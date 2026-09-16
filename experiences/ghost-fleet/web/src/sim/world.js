import * as THREE from 'three';
import { Ship } from './Ship.js';
import { SHIP, hullSegmentHit, halfBeamAt, clampToSpine } from '../geometry/hull.js';
import { FACTIONS } from './factions.js';
import { DynamicSplats, KIND } from '../fx/DynamicSplats.js';
import { muzzleBlast, explosion, waterSplash, burn, wake } from '../fx/emitters.js';
import { waveAt } from '../geometry/ocean.js';

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _local = new THREE.Vector3();
const _prev = new THREE.Vector3();
const _prevLocal = new THREE.Vector3();
const _entry = new THREE.Vector3();

/** Roughly normal in [-1,1]: real dispersion clusters, it is not uniform. */
function gauss() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

const MUZZLE_V = 74;       // m/s — fast enough to read, slow enough to watch
const GRAV = 22.0;
const MAX_BALLS = 160;

export class World {
  constructor(scene, { density = 1, dynamicCapacity = 26000, deferFleet = false } = {}) {
    this.scene = scene;
    this.density = density;
    this.time = 0;
    this.swell = 1;
    this.stormTarget = 1;
    this.shotsFired = 0;
    this.hitsLanded = 0;

    // drawing-buffer size, mirrored onto every splat mesh we create later
    this.viewport = new THREE.Vector2(1, 1);

    // shared lighting environment, mirrored onto every splat mesh
    this.lighting = {
      sunDir: new THREE.Vector3(-0.72, 0.085, 0.30).normalize(),
      sunColor: new THREE.Color(1.35, 0.92, 0.62),
      skyColor: new THREE.Color(0.30, 0.42, 0.68),
      groundColor: new THREE.Color(0.10, 0.11, 0.14),
      ambient: 0.85
    };

    this.fx = new DynamicSplats(dynamicCapacity);
    // smoke and fire are volumetric, not surfaces — only half-shade them
    this.fx.mesh.litAmount = 0.55;
    scene.add(this.fx.mesh);

    this.ships = [];
    this.balls = [];
    this.flashes = [];       // { pos, t, life, color, intensity }
    this.onHit = null;       // set by the showcase
    this.ballPool = [];
    this._initBalls();
    this.totalSplats = 0;
    if (!deferFleet) this.spawnFleet();

    this.shake = 0;
    this.playerTarget = null;
  }

  // ------------------------------------------------------------ cannonballs

  _initBalls() {
    // round shot is about 16 cm; at 0.42 it read as a boulder. Shade it so it
    // is a dark iron ball catching a little sky, not a hole in the frame.
    const geo = new THREE.SphereGeometry(0.24, 10, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0x1b1d22, emissive: 0x0a0b0d });
    this.ballMesh = new THREE.InstancedMesh(geo, mat, MAX_BALLS);
    this.ballMesh.frustumCulled = false;
    this.ballMesh.count = 0;
    this.ballMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.ballMesh);
    // the shot is the only lit geometry in the scene; everything else is
    // either a splat (lit in its own shader) or a full-screen shader
    this.ballLight = new THREE.HemisphereLight(0xbfd4ff, 0x14202e, 2.4);
    this.scene.add(this.ballLight);
    this._ballMat = new THREE.Matrix4();
  }

  // ------------------------------------------------------------------ fleet

  /** Build the fleet a ship at a time, yielding to the browser between hulls. */
  async spawnFleetAsync(onProgress) {
    this._clearFleet();
    const layout = this.fleetLayout();
    for (let k = 0; k < layout.length; k++) {
      this._addShip(layout[k], k);
      onProgress?.((k + 1) / layout.length, layout[k].f.names[layout[k].i]);
      await new Promise(r => requestAnimationFrame(() => r()));
    }
    this.totalSplats = this.ships.reduce((a, s) => a + s.splatCount, 0);
  }

  fleetLayout() {
    return [
      { f: FACTIONS.crimson, i: 0, x: -44, z: -26, h: 0.30 },
      { f: FACTIONS.crimson, i: 1, x: -58, z:  18, h: 0.10 },
      { f: FACTIONS.azure,   i: 0, x:  46, z:  26, h: Math.PI - 0.28 },
      { f: FACTIONS.azure,   i: 1, x:  60, z: -18, h: Math.PI - 0.06 }
    ];
  }

  _clearFleet() {
    for (const s of this.ships) {
      this.scene.remove(s.mesh);
      s.mesh.geometry.dispose();
      s.mesh.material.dispose();
      s.mesh.texture.dispose();
    }
    this.ships.length = 0;
    this.balls.length = 0;
    this.flashes?.splice(0, this.flashes.length);
    this.shotsFired = 0;
    this.hitsLanded = 0;
    this.playerTarget = null;
  }

  _addShip(L, k) {
    const ship = new Ship({
      seed: 101 + k * 37,
      faction: L.f,
      density: this.density,
      name: L.f.names[L.i]
    });
    ship.pos.set(L.x, 0, L.z);
    ship.heading = L.h;
    ship.targetHeading = L.h;
    ship.speed = 3.0 + (k % 2) * 0.5;
    ship.reload = 1.5 + k * 0.8;
    ship.mesh.setViewport(this.viewport.x, this.viewport.y);
    ship.mesh.setLighting(this.lighting);
    ship.update(0.0001, this.time, this.swell);
    this.scene.add(ship.mesh);
    this.ships.push(ship);
  }

  spawnFleet() {
    this._clearFleet();
    this.fleetLayout().forEach((L, k) => this._addShip(L, k));
    this.totalSplats = this.ships.reduce((a, s) => a + s.splatCount, 0);
  }

  living(faction) {
    return this.ships.filter(s => !s.dead && !s.sinking && s.faction.key === faction.key);
  }
  enemiesOf(ship) {
    return this.ships.filter(s => !s.dead && s.faction.key !== ship.faction.key);
  }

  // -------------------------------------------------------------- gunnery

  /**
   * Solve for the launch elevation that drops a ball on `target` from
   * `origin` at fixed muzzle velocity, then fire it with a little spread.
   */
  fireGun(ship, side, index, target, spread = 1) {
    if (this.balls.length >= MAX_BALLS) return;

    const origin = ship.gunPort(side, index, new THREE.Vector3());
    const dir = _v.subVectors(target, origin);
    const dy = dir.y;
    dir.y = 0;
    const range = dir.length();
    if (range < 1) return;
    dir.normalize();

    // Solve the elevation for a *misjudged* range. Against a ship lying
    // broadside the lateral error hardly matters — she is 36 m long — so it is
    // the gun captain's estimate of the distance that decides whether the shot
    // goes home or throws up a column of water short of her side.
    // Widened when the hit test moved to the analytic hull, though only
    // modestly effective: 0.36 -> 0.50 moved the hit rate 77% -> 73%, because
    // a ship lying broadside is a 36 m target and range error has to be large
    // to miss it entirely. The old ~60% was mostly an artefact of shot
    // slipping through gaps in the splat cloud. The remaining quarter still
    // throws up the columns of spray that give the sea its scale.
    const guessed = range * (1 + gauss() * 0.50 * spread);

    const v = MUZZLE_V;
    const v2 = v * v;
    const disc = v2 * v2 - GRAV * (GRAV * guessed * guessed + 2 * dy * v2);
    let angle;
    if (disc < 0) angle = Math.PI / 4;                       // out of range: max it
    else angle = Math.atan((v2 - Math.sqrt(disc)) / (GRAV * guessed));

    // Smoothbore gunnery from a rolling deck is genuinely poor, and the misses
    // matter: they throw up the columns of spray that give the sea its scale
    // and stop the engagement resolving in half a minute. Error grows with
    // range, the way real dispersion does.
    const rangeK = 0.55 + range / 110;
    const yaw = gauss() * 0.045 * rangeK * spread;
    const pitchErr = gauss() * 0.012 * rangeK * spread;
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    const fd = new THREE.Vector3(dir.x * ca - dir.z * sa, 0, dir.x * sa + dir.z * ca);

    const e = angle + pitchErr;
    const vel = new THREE.Vector3(
      fd.x * Math.cos(e) * v,
      Math.sin(e) * v,
      fd.z * Math.cos(e) * v
    );

    this.balls.push({
      p: origin.clone(),
      v: vel,
      t: 0,
      owner: ship,
      trail: 0
    });

    const outward = new THREE.Vector3(0, 0, side).applyQuaternion(ship.mesh.quaternion).normalize();
    muzzleBlast(this.fx, origin, outward, 1);
    this.flashes.push({ pos: origin.clone(), t: 0, life: 0.14, color: new THREE.Color(1.0, 0.72, 0.36), intensity: 3.2 });
    this.shotsFired++;
  }

  /**
   * A full broadside: six guns rippling down the side.
   * Returns false if neither battery can be trained far enough round.
   */
  broadside(ship, target, delayScale = 1) {
    if (ship.dead || ship.sinking) return false;

    // the guns are in ports, not turrets — if the target is off the bow or
    // astern, the ship has to come round before she can answer
    const side = ship.sideBearing(target);
    if (side === 0) return false;

    const aim = target.clone();
    aim.y = Math.max(aim.y, 1.5);

    for (let g = 0; g < 6; g++) {
      const d = g * 0.055 * delayScale;
      setTimeout(() => {
        if (!ship.dead) this.fireGun(ship, side, g, aim, 1);
      }, d * 1000);
    }
    ship.reload = 6.5 + Math.random() * 4.0;
    this.shake = Math.min(1, this.shake + 0.35);
    return true;
  }

  /**
   * Order a ship to engage a point: fire if the battery already bears,
   * otherwise put the helm over so it soon will and try again shortly.
   *
   * Every player-facing command goes through this. Silently doing nothing
   * because the guns are trained the wrong way is indistinguishable from a
   * broken button; visibly swinging the ship round reads as an order being
   * carried out.
   */
  orderBroadside(ship, target, delayScale = 1) {
    if (ship.dead || ship.sinking) return false;
    if (this.broadside(ship, target, delayScale)) return true;

    const to = _v.subVectors(target, ship.pos);
    const bearing = Math.atan2(to.z, to.x);
    // lay the nearer beam toward the target
    const side = ship.sideBearing(target) || (
      Math.sin(bearing - ship.heading) > 0 ? 1 : -1);
    ship.targetHeading = bearing - side * Math.PI * 0.5;
    ship.reload = Math.min(ship.reload, 1.2);
    return false;
  }

  /**
   * Player-directed ranging shot at an arbitrary sea position. Prefers a ship
   * whose guns already bear; falls back to the nearest, which will then come
   * round and fire once she can.
   */
  rangingShot(faction, target) {
    const ships = this.living(faction);
    if (!ships.length) return false;

    const canBear = ships.filter(s => s.sideBearing(target) !== 0);
    const pool = canBear.length ? canBear : ships;
    let best = pool[0], bd = Infinity;
    for (const s of pool) {
      const d = s.pos.distanceTo(target);
      if (d < bd) { bd = d; best = s; }
    }
    return this.orderBroadside(best, target, 0.7);
  }

  // ----------------------------------------------------------- collision

  /**
   * Keep hulls out of each other.
   *
   * Two galleons are long and thin, so a bounding sphere is far too crude —
   * at 36 m long and 9 m in the beam it would hold them 36 m apart. Instead
   * each hull is treated as a capsule along its own centreline: find the
   * closest pair of points on the two spines, and if they are inside the
   * combined half-beam there, push both ships apart and bleed off the part of
   * their velocity that was closing.
   */
  _resolveCollisions(dt) {
    const ships = this.ships.filter(s => !s.dead);

    for (let i = 0; i < ships.length; i++) {
      for (let j = i + 1; j < ships.length; j++) {
        const A = ships[i], B = ships[j];

        // cheap reject first: nothing within a length of each other can touch
        const dx0 = B.pos.x - A.pos.x, dz0 = B.pos.z - A.pos.z;
        if (dx0 * dx0 + dz0 * dz0 > SHIP.L * SHIP.L) continue;

        // closest points on the two centrelines, in the XZ plane
        const ca = Math.cos(A.heading), sa = Math.sin(A.heading);
        const cb = Math.cos(B.heading), sb = Math.sin(B.heading);

        // solve the 2x2 system for the pair of spine parameters
        const r = A.pos.clone().sub(B.pos);
        const f = ca * cb + sa * sb;             // cosine between headings
        const c1 = ca * r.x + sa * r.z;
        const c2 = cb * r.x + sb * r.z;
        const den = 1 - f * f;
        let ta, tb;
        if (Math.abs(den) < 1e-4) {              // near parallel
          ta = 0;
          tb = c2;
        } else {
          ta = (f * c2 - c1) / den;
          tb = (c2 - f * c1) / den;
        }
        ta = clampToSpine(ta);
        tb = clampToSpine(tb);

        const ax = A.pos.x + ca * ta, az = A.pos.z + sa * ta;
        const bx = B.pos.x + cb * tb, bz = B.pos.z + sb * tb;

        const dx = bx - ax, dz = bz - az;
        let d = Math.hypot(dx, dz);

        // allowed separation: each hull's half-beam at that station, plus a
        // margin so the rigging does not interlock either
        const need = halfBeamAt(ta, 0) + halfBeamAt(tb, 0) + 3.2;
        if (d >= need) continue;

        // degenerate overlap: shove them apart along their beams
        let nx, nz;
        if (d < 1e-3) { nx = -sa; nz = ca; d = 1e-3; } else { nx = dx / d; nz = dz / d; }

        const push = (need - d) * 0.5;
        A.pos.x -= nx * push; A.pos.z -= nz * push;
        B.pos.x += nx * push; B.pos.z += nz * push;

        // scrub the closing component so they stop grinding along each other
        const closing = (Math.cos(B.heading) - Math.cos(A.heading)) * nx
                      + (Math.sin(B.heading) - Math.sin(A.heading)) * nz;
        if (closing < 0) {
          A.speed = Math.max(1.2, A.speed * 0.985);
          B.speed = Math.max(1.2, B.speed * 0.985);
        }
      }
    }
  }

  // ------------------------------------------------------------------- AI

  _updateAI(dt) {
    for (const ship of this.ships) {
      if (ship.dead || ship.sinking) continue;
      const enemies = this.enemiesOf(ship).filter(e => !e.sinking);
      if (!enemies.length) {
        // no one left to fight: sail a slow victory circle
        ship.targetHeading = ship.heading + 0.25;
        continue;
      }

      let target = enemies[0], bd = Infinity;
      for (const e of enemies) {
        const d = e.pos.distanceTo(ship.pos);
        if (d < bd) { bd = d; target = e; }
      }
      ship.currentTarget = target;

      // Hold the enemy abeam at close fighting range. These numbers are as
      // much about composition as tactics: too loose and the fleets end up at
      // opposite edges of the frame with empty sea between them.
      const to = _v.subVectors(target.pos, ship.pos);
      const bearing = Math.atan2(to.z, to.x);
      const want = bd > 62 ? bearing                       // close the distance
        : bd < 30 ? bearing + Math.PI * 0.72               // sheer away
        : bearing + Math.PI * 0.5 * (ship.seed % 2 ? 1 : -1);  // parallel course
      ship.targetHeading = want;

      // Sheer off anything close ahead. Collision resolution alone makes
      // ships shove each other; this makes them look like they meant to
      // avoid it, which is what actually reads as seamanship.
      let avoidX = 0, avoidZ = 0;
      for (const other of this.ships) {
        if (other === ship || other.dead) continue;
        const ox = ship.pos.x - other.pos.x, oz = ship.pos.z - other.pos.z;
        const d = Math.hypot(ox, oz);
        if (d > SHIP.L * 1.3 || d < 1e-3) continue;
        const w = (1 - d / (SHIP.L * 1.3)) / d;
        avoidX += ox * w; avoidZ += oz * w;
      }
      if (avoidX || avoidZ) {
        const away = Math.atan2(avoidZ, avoidX);
        let d = away - ship.targetHeading;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const urgency = Math.min(0.85, Math.hypot(avoidX, avoidZ) * 5.5);
        ship.targetHeading += d * urgency;
      }

      // keep the fight near the origin so the camera never loses it
      const fromCenter = Math.hypot(ship.pos.x, ship.pos.z);
      if (fromCenter > 60) {
        // blend back toward the centre rather than snapping, so the turn reads
        const home = Math.atan2(-ship.pos.z, -ship.pos.x);
        const pull = Math.min(1, (fromCenter - 60) / 35);
        let d = home - ship.targetHeading;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        ship.targetHeading += d * pull;
      }

      ship.reload -= dt;
      if (ship.reload <= 0) {
        if (bd > 20 && bd < 95 && ship.sideBearing(target.pos) !== 0) {
          // aim where the target will be, not where it is
          const flight = bd / MUZZLE_V;
          const lead = _v2.set(
            Math.cos(target.heading) * target.speed,
            0,
            Math.sin(target.heading) * target.speed
          ).multiplyScalar(flight * 1.25);
          if (!this.broadside(ship, target.pos.clone().add(lead).setY(3.0))) {
            ship.reload = 0.5;   // she swung off the mark while we were aiming
          }
        } else {
          ship.reload = 0.6;
        }
      }
    }
  }

  // ------------------------------------------------------------ projectiles

  _updateBalls(dt) {
    const balls = this.balls;
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      b.t += dt;
      b.v.y -= GRAV * dt;

      // substep so a fast ball cannot tunnel through a hull
      const steps = 3;
      const sdt = dt / steps;
      let consumed = false;

      for (let s = 0; s < steps && !consumed; s++) {
        _prev.copy(b.p);
        b.p.addScaledVector(b.v, sdt);

        for (const ship of this.ships) {
          if (ship.dead || ship === b.owner) continue;
          if (ship.pos.distanceToSquared(b.p) > 46 * 46) continue;

          _local.copy(b.p).applyMatrix4(ship._inv);
          _prevLocal.copy(_prev).applyMatrix4(ship._inv);

          if (this._hullHit(ship, _prevLocal, _local, _entry)) {
            this._detonate(ship, _entry, b);
            consumed = true;
            break;
          }
        }

        if (!consumed) {
          const h = waveAt(b.p.x, b.p.z, this.time, this.swell, _v).y;
          if (b.p.y < h) {
            waterSplash(this.fx, _v.set(b.p.x, h, b.p.z), 1);
            consumed = true;
          }
        }
      }

      // smoke trail
      b.trail += dt;
      if (b.trail > 0.028) {
        b.trail = 0;
        this.fx.spawn({
          kind: KIND.SMOKE,
          x: b.p.x, y: b.p.y, z: b.p.z,
          vx: 0, vy: 0.4, vz: 0,
          sx: 0.16, grow: 0.9,
          r: 0.68, g: 0.66, b: 0.64,
          alpha: 0.17, life: 0.9
        });
      }

      if (consumed || b.t > 9 || b.p.y < -6) balls.splice(i, 1);
    }

    // upload instance matrices
    const n = Math.min(balls.length, MAX_BALLS);
    for (let i = 0; i < n; i++) {
      this._ballMat.makeTranslation(balls[i].p.x, balls[i].p.y, balls[i].p.z);
      this.ballMesh.setMatrixAt(i, this._ballMat);
    }
    this.ballMesh.count = n;
    if (n > 0) this.ballMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Does this step of the ball's flight enter the hull?
   *
   * Tested against the analytic hull envelope, not the surviving splat cloud.
   * The cloud version degraded catastrophically as a ship was destroyed — a
   * wreck is mostly gaps, so round shot flew straight through it. Measured in
   * a 1v1 between two ships at ~0.3 integrity: 162 shots, 5 hits. The same
   * fight now resolves instead of stalling the attract loop.
   */
  _hullHit(ship, from, to, out) {
    return hullSegmentHit(from, to, out);
  }

  _detonate(ship, local, ball) {
    const speed = ball.v.length();
    const power = Math.min(1.5, 0.70 + speed / 150);
    const radius = 1.7 + power * 1.1;

    const dir = _v.copy(ball.v).normalize();
    const removed = ship.impact(local, radius, power, this.fx, { dir });

    const world = _v2.copy(local).applyMatrix4(ship.mesh.matrixWorld);
    explosion(this.fx, world, power * (removed > 300 ? 1.25 : 0.95));
    this.flashes.push({
      pos: world.clone(), t: 0, life: 0.28,
      color: new THREE.Color(1.0, 0.58, 0.22), intensity: 7.5 * power
    });
    this.shake = Math.min(1.4, this.shake + 0.5 * power);
    if (removed > 0) this.hitsLanded++;

    // tell anyone watching that a shot went home, so the showcase can decide
    // whether this one is worth stopping the world for
    if (removed > 0 && this.onHit) {
      this.onHit({
        ship, removed, power, radius,
        local: local.clone(),
        world: world.clone(),
        dir: dir.clone(),
        debris: this.fx.aliveCount
      });
    }
  }

  // ---------------------------------------------------------------- update

  /**
   * @param dt simulation step (slowed by the showcase)
   * @param realDt wall-clock step, for things that are presentation rather
   *        than simulation. A muzzle flash is a 0.28 s pop; decaying it on the
   *        slowed clock stretches it to six seconds and blows out the frame.
   */
  update(dt, realDt = dt) {
    this.time += dt;
    this.swell += (this.stormTarget - this.swell) * Math.min(1, dt * 0.45);

    for (const ship of this.ships) {
      if (ship.dead) continue;
      ship.update(dt, this.time, this.swell);

      // bow wake
      if (!ship.sinking) {
        const bow = _v.set(SHIP.L * 0.42, 0.2, 0).applyMatrix4(ship.mesh.matrixWorld);
        wake(this.fx, bow, _v2.set(Math.cos(ship.heading), 0, Math.sin(ship.heading)), ship.speed, dt);
      }

      // a flooding ship wallows: spray breaking over her decks
      if (!ship.sinking && ship.integrity < 0.20 && Math.random() < dt * 9) {
        const wp = _v.set((Math.random() - 0.5) * SHIP.L * 0.8, 0.4,
          (Math.random() < 0.5 ? 1 : -1) * SHIP.B * 0.5).applyMatrix4(ship.mesh.matrixWorld);
        waterSplash(this.fx, wp, 0.3);
      }

      // fires burning in the breaches
      for (let i = ship.fires.length - 1; i >= 0; i--) {
        const f = ship.fires[i];
        f.t += dt;
        if (f.t > f.life) { ship.fires.splice(i, 1); continue; }
        const wp = _v.copy(f.p).applyMatrix4(ship.mesh.matrixWorld);
        const fade = 1 - f.t / f.life;
        burn(this.fx, wp, f.size * (0.4 + 0.6 * fade), dt);
        if (Math.random() < dt * 3) {
          this.flashes.push({
            pos: wp.clone(), t: 0, life: 0.2,
            color: new THREE.Color(1.0, 0.5, 0.2), intensity: 1.1 * fade
          });
        }
      }

      // a sinking ship sheds its cargo and steam
      if (ship.sinking && Math.random() < dt * 22) {
        const wp = _v.set((Math.random() - 0.5) * SHIP.L, 1.5, (Math.random() - 0.5) * SHIP.B)
          .applyMatrix4(ship.mesh.matrixWorld);
        waterSplash(this.fx, wp, 0.25);
      }
    }

    // retire fully sunk hulls
    for (let i = this.ships.length - 1; i >= 0; i--) {
      const s = this.ships[i];
      if (s.dead && s.mesh.parent) this.scene.remove(s.mesh);
    }

    this._resolveCollisions(dt);
    this._updateAI(dt);
    this._updateBalls(dt);

    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.t += realDt;
      if (f.t > f.life) this.flashes.splice(i, 1);
    }

    this.shake = Math.max(0, this.shake - realDt * 1.6);
    this.fx.update(dt, this.time, this.swell);
  }

  /** Centre of the action — what the cinematic camera frames. */
  battleCenter(out = new THREE.Vector3()) {
    out.set(0, 0, 0);
    let n = 0;
    for (const s of this.ships) { if (!s.dead) { out.add(s.pos); n++; } }
    if (n) out.divideScalar(n);
    out.y = 6;
    return out;
  }

  /** Radius that encloses every living ship, for auto-framing. */
  battleRadius(center) {
    let r = 0;
    for (const s of this.ships) {
      if (s.dead) continue;
      r = Math.max(r, Math.hypot(s.pos.x - center.x, s.pos.z - center.z));
    }
    return r;
  }

  liveSplatCount() {
    let n = this.fx.mesh.count;
    for (const s of this.ships) if (!s.dead) n += s.splatCount;
    return n;
  }

  allOneSideLeft() {
    const a = this.living(FACTIONS.crimson).length;
    const b = this.living(FACTIONS.azure).length;
    return a === 0 || b === 0;
  }

  /** Update the lighting environment and push it to every splat mesh. */
  setLighting(next) {
    Object.assign(this.lighting, next);
    for (const s of this.ships) s.mesh.setLighting(this.lighting);
    this.fx.mesh.setLighting(this.lighting);
  }

  setViewport(w, h) {
    this.viewport.set(w, h);
    for (const s of this.ships) s.mesh.setViewport(w, h);
    this.fx.mesh.setViewport(w, h);
  }

  sortAll(camera) {
    for (const s of this.ships) if (!s.dead) s.mesh.sort(camera);
    this.fx.mesh.sort(camera);
  }
}
