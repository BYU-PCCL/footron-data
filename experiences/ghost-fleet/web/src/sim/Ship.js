import * as THREE from 'three';
import { SplatMesh } from '../splats/SplatMesh.js';
import { buildShip } from '../geometry/ship.js';
import { SHIP, buildHullProxy } from '../geometry/hull.js';
import { buildSailProxy, buildSparProxy } from '../geometry/rig.js';
import { PART } from '../geometry/splatbuilder.js';
import { KIND } from '../fx/DynamicSplats.js';
import { waveFrame } from '../geometry/ocean.js';
import { polar } from './wind.js';

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _n = new THREE.Vector3();
const _c = new THREE.Color();

/** Splats in these roles are load-bearing: losing them costs the ship. */
const STRUCTURAL = new Set([PART.HULL, PART.DECK, PART.MAST]);

export class Ship {
  constructor({ seed, faction, density, name }) {
    this.name = name;
    this.faction = faction;
    this.seed = seed;

    const data = buildShip({ seed, faction, density });
    this.data = data;
    this.part = data.part;

    const mesh = new SplatMesh(data.count, { name: `ship-${name}`, sortEvery: 2, renderOrder: 2 });
    for (let i = 0; i < data.count; i++) {
      mesh.set(i,
        data.pos[i * 3], data.pos[i * 3 + 1], data.pos[i * 3 + 2],
        data.scl[i * 3], data.scl[i * 3 + 1], data.scl[i * 3 + 2],
        data.rot[i * 4], data.rot[i * 4 + 1], data.rot[i * 4 + 2], data.rot[i * 4 + 3],
        data.col[i * 3], data.col[i * 3 + 1], data.col[i * 3 + 2],
        data.opa[i], data.emi[i]);
    }
    mesh.setCount(data.count);
    mesh.flush();
    this.mesh = mesh;
    this.splatCount = data.count;

    // A colour-free solid of the hull, drawn before any splat so the depth
    // buffer knows where the ship is. The effect pool is a separate
    // transparent mesh with no depth write, so without this its debris draws
    // over the hull whatever the real depth — fragments blown out the far
    // side appear to hang in front of the near one.
    const depthOnly = () => new THREE.MeshBasicMaterial({
      colorWrite: false, depthWrite: true, depthTest: true
    });

    const proxy = new THREE.Mesh(buildHullProxy(), depthOnly());
    proxy.name = `hull-proxy-${name}`;
    proxy.renderOrder = -5;          // before every splat mesh
    proxy.frustumCulled = false;
    mesh.add(proxy);
    this.proxy = proxy;

    // The hull is a closed solid and can be inset; a sail is a sheet with no
    // inside to shrink toward, so its proxy sits exactly where the sail's own
    // Gaussians do and is pushed back in depth instead. Without this, flotsam
    // floating on the water beyond a sail draws straight through it.
    const sailMat = depthOnly();
    sailMat.polygonOffset = true;
    sailMat.polygonOffsetFactor = 4.0;
    sailMat.polygonOffsetUnits = 8;
    sailMat.side = THREE.DoubleSide;    // sails are seen from both faces

    const sailProxy = new THREE.Mesh(buildSailProxy(), sailMat);
    sailProxy.name = `sail-proxy-${name}`;
    sailProxy.renderOrder = -4;
    sailProxy.frustumCulled = false;
    mesh.add(sailProxy);
    this.sailProxy = sailProxy;

    // Masts and yards matter more than their size suggests: a mast is dark
    // against a bright sky, so debris drawing through one is among the most
    // obvious depth failures on the ship. Too slender to inset, so they share
    // the sails' offset.
    const sparMat = sailMat.clone();
    const sparProxy = new THREE.Mesh(buildSparProxy(), sparMat);
    sparProxy.name = `spar-proxy-${name}`;
    sparProxy.renderOrder = -4;
    sparProxy.frustumCulled = false;
    mesh.add(sparProxy);
    this.sparProxy = sparProxy;

    // ---- coarse spatial index: buckets along the ship's length
    this.SLICES = 40;
    this.sliceMin = -SHIP.L / 2 - 10;
    this.sliceMax = SHIP.L / 2 + 10;
    this._buildIndex();

    // ---- sailing state
    this.pos = new THREE.Vector3();
    this.heading = 0;             // radians, 0 = bow toward +x
    this.targetHeading = 0;
    this.rudder = 0;

    // `speed` is what she is making now; `maxSpeed` is her best, on a beam
    // reach in a full breeze. They used to be the same number, which is why
    // the fleet moved like a carousel.
    this.maxSpeed = 7.6;
    this.speed = 3.0;
    this.heel = 0;

    // ---- condition
    this.maxIntegrity = 1;
    this.integrity = 1;
    this.structuralTotal = 0;
    for (let i = 0; i < data.count; i++) if (STRUCTURAL.has(this.part[i])) this.structuralTotal++;
    this.structuralLost = 0;
    this.sinking = false;
    this.sinkT = 0;
    this.dead = false;
    this.listRoll = 0;
    this.flooding = 0;
    this.fires = [];              // local-space burning points
    this.reload = 0;
    this.lastHitAt = -99;
  }

  _buildIndex() {
    const n = this.splatCount;
    const S = this.SLICES;
    const counts = new Int32Array(S + 1);
    const span = this.sliceMax - this.sliceMin;
    const slice = new Int32Array(n);
    const px = this.mesh.px;
    for (let i = 0; i < n; i++) {
      let s = Math.floor(((px[i] - this.sliceMin) / span) * S);
      s = Math.min(S - 1, Math.max(0, s));
      slice[i] = s;
      counts[s + 1]++;
    }
    for (let s = 0; s < S; s++) counts[s + 1] += counts[s];
    const order = new Int32Array(n);
    const cursor = counts.slice();
    for (let i = 0; i < n; i++) order[cursor[slice[i]]++] = i;
    this.sliceStart = counts;
    this.sliceOrder = order;
  }

  /** Iterate splat indices whose x lies within [x0, x1]. */
  _forSlices(x0, x1, fn) {
    const S = this.SLICES;
    const span = this.sliceMax - this.sliceMin;
    let a = Math.floor(((x0 - this.sliceMin) / span) * S);
    let b = Math.floor(((x1 - this.sliceMin) / span) * S);
    a = Math.min(S - 1, Math.max(0, a));
    b = Math.min(S - 1, Math.max(0, b));
    for (let s = a; s <= b; s++) {
      const from = this.sliceStart[s], to = this.sliceStart[s + 1];
      for (let k = from; k < to; k++) fn(this.sliceOrder[k]);
    }
  }

  worldMatrix() { return this.mesh.matrixWorld; }

  /**
   * The depth proxies describe an assembled ship. While the genesis has her
   * scattered into a cloud there is no solid there to occlude anything, and
   * leaving them on punches a ship-shaped hole through the swarm.
   */
  setProxiesVisible(v) {
    if (this.proxy) this.proxy.visible = v;
    if (this.sailProxy) this.sailProxy.visible = v;
    if (this.sparProxy) this.sparProxy.visible = v;
  }

  /**
   * Roughly how much of this ship sits between two points, both in local
   * space. Used to pick a camera angle that actually sees the thing it is
   * meant to be looking at: a lens placed without checking ends up staring
   * through a course or a set of shrouds, which at close range is a wall of
   * pale splats.
   */
  occlusionBetween(from, to, samples = 16, radius = 0.75, giveUpAt = Infinity) {
    const mesh = this.mesh;
    const r2 = radius * radius;
    const S = this.SLICES;
    const span = this.sliceMax - this.sliceMin;
    let hits = 0;

    // stop short of the target so the breach rim itself is not counted
    for (let i = 1; i < samples; i++) {
      const u = i / samples;
      if (u > 0.82) break;
      const x = from.x + (to.x - from.x) * u;
      const y = from.y + (to.y - from.y) * u;
      const z = from.z + (to.z - from.z) * u;

      // inlined slice walk: this runs a few hundred times when the showcase
      // picks its angle, and the closure call per splat was most of the cost
      let a = Math.floor(((x - radius - this.sliceMin) / span) * S);
      let b = Math.floor(((x + radius - this.sliceMin) / span) * S);
      a = a < 0 ? 0 : a > S - 1 ? S - 1 : a;
      b = b < 0 ? 0 : b > S - 1 ? S - 1 : b;

      let found = 0;
      outer:
      for (let sl = a; sl <= b; sl++) {
        const to_ = this.sliceStart[sl + 1];
        for (let k = this.sliceStart[sl]; k < to_; k++) {
          const j = this.sliceOrder[k];
          const dx = mesh.px[j] - x;
          if (dx > radius || dx < -radius) continue;
          const dy = mesh.py[j] - y;
          if (dy > radius || dy < -radius) continue;
          const dz = mesh.pz[j] - z;
          if (dx * dx + dy * dy + dz * dz >= r2) continue;
          if (mesh.data[j * 16 + 3] <= 0.001) continue;
          if (++found > 3) break outer;
        }
      }
      hits += found > 4 ? 4 : found;
      // a candidate this blocked will never win; stop paying for it
      if (hits >= giveUpAt) return hits;
    }
    return hits;
  }

  toLocal(worldPoint, out = _v) {
    return out.copy(worldPoint).applyMatrix4(this._inv);
  }

  /**
   * A cannonball lands. Removes splats inside the blast, throws a fraction of
   * them into the debris pool with matching colour/scale/orientation, and
   * chars the crater rim so the wound reads as burnt timber.
   */
  impact(localPoint, radius, power, fx, opts = {}) {
    if (this.dead) return 0;
    const r2 = radius * radius;
    const mesh = this.mesh;
    let removed = 0;
    let structural = 0;

    const debrisBudget = Math.min(opts.debrisBudget ?? 620, fx.freeCount);
    let debrisMade = 0;
    this.lastDebrisMade = 0;
    const emitDir = opts.dir || _n.set(0, 1, 0);

    const m = this.mesh.matrixWorld;
    const rot = _q.setFromRotationMatrix(m);

    this._forSlices(localPoint.x - radius, localPoint.x + radius, (i) => {
      if (mesh.getOpacity(i) <= 0.001) return;
      const dx = mesh.px[i] - localPoint.x;
      const dy = mesh.py[i] - localPoint.y;
      const dz = mesh.pz[i] - localPoint.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > r2) return;

      const d = Math.sqrt(d2);
      const falloff = 1 - d / radius;

      // rim splats survive but get scorched
      if (falloff < 0.26) {
        mesh.getColor(i, _c);
        const char = 0.55 + 0.45 * (1 - falloff / 0.26);
        mesh.setColor(i, _c.r * (1 - char * 0.9), _c.g * (1 - char * 0.93), _c.b * (1 - char * 0.95));
        return;
      }

      removed++;
      if (STRUCTURAL.has(this.part[i])) structural++;
      mesh.setOpacity(i, 0);

      // throw a sample of the removed splats as real tumbling debris
      if (debrisMade < debrisBudget && Math.random() < 0.72) {
        debrisMade++;
        _v2.set(mesh.px[i], mesh.py[i], mesh.pz[i]).applyMatrix4(m);
        const sc = mesh.getScale(i, new THREE.Vector3());
        const qq = mesh.getQuat(i, new THREE.Quaternion()).premultiply(rot);
        mesh.getColor(i, _c);

        const blast = 13 + power * 21 * falloff;
        const nx = dx / (d + 1e-4), ny = dy / (d + 1e-4), nz = dz / (d + 1e-4);
        const out = _v.set(nx, ny, nz).applyQuaternion(rot);

        fx.spawn({
          kind: KIND.DEBRIS,
          x: _v2.x, y: _v2.y, z: _v2.z,
          vx: out.x * blast + emitDir.x * power * 3 + (Math.random() - 0.5) * 6,
          vy: out.y * blast * 0.8 + 5 + Math.random() * 7,
          vz: out.z * blast + emitDir.z * power * 3 + (Math.random() - 0.5) * 6,
          sx: sc.x * 1.15, sy: sc.y * 1.15, sz: Math.max(sc.z, 0.05) * 1.4,
          qx: qq.x, qy: qq.y, qz: qq.z, qw: qq.w,
          wx: (Math.random() - 0.5) * 11, wy: (Math.random() - 0.5) * 11, wz: (Math.random() - 0.5) * 11,
          r: _c.r * 0.85, g: _c.g * 0.85, b: _c.b * 0.85,
          alpha: 1, life: 3.2 + Math.random() * 3.4
        });
      }
    });

    mesh.flush();

    if (structural > 0) {
      this.structuralLost += structural;
      this.integrity = Math.max(0, 1 - this.structuralLost / (this.structuralTotal * 0.42));
    }
    this.lastHitAt = performance.now() / 1000;

    if (removed > 25 && this.fires.length < 9) {
      this.fires.push({ p: localPoint.clone(), t: 0, life: 9 + Math.random() * 10, size: Math.min(1.5, radius * 0.45) });
    }
    // how many of the removed Gaussians actually became flying fragments —
    // the showcase quotes this, and it must never exceed `removed`
    this.lastDebrisMade = debrisMade;

    if (this.integrity <= 0 && !this.sinking) this.beginSinking();
    return removed;
  }

  beginSinking() {
    this.sinking = true;
    this.sinkT = 0;
    this.listRoll = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.35);
  }

  /**
   * How far a gun can be trained either side of square.
   *
   * A carriage gun run out through a port can be levered round a little with
   * handspikes, but the port cheeks stop it well short of anything like a
   * turret. Roughly 25 degrees is generous for the period, and it is what
   * forces the ships to actually manoeuvre for a firing solution instead of
   * shooting over the bow whenever a target wanders past.
   */
  static get TRAVERSE() { return 0.44; }   // radians, ~25 degrees

  /**
   * Can this side's battery bear on `target`?
   * Returns the signed training error in radians, or null if it cannot.
   */
  bearing(side, target) {
    // outward normal of that broadside, in world space
    const beam = _v2.set(0, 0, side).applyQuaternion(this.mesh.quaternion).normalize();
    const to = _v.subVectors(target, this.pos);
    to.y = 0;
    if (to.lengthSq() < 1e-6) return null;
    to.normalize();

    // angle between where the guns point and where the target is
    const cos = Math.max(-1, Math.min(1, beam.x * to.x + beam.z * to.z));
    const err = Math.acos(cos);
    return err <= Ship.TRAVERSE ? err : null;
  }

  /** Which side can bear on this target, or 0 if neither. */
  sideBearing(target) {
    const s = this.bearing(1, target);
    const p = this.bearing(-1, target);
    if (s === null && p === null) return 0;
    if (p === null) return 1;
    if (s === null) return -1;
    return s <= p ? 1 : -1;
  }

  /** Muzzle position/direction for a broadside gun on the given side. */
  gunPort(side, index, out = new THREE.Vector3()) {
    const ts = [0.20, 0.31, 0.42, 0.53, 0.64, 0.75];
    const t = ts[index % ts.length];
    const x = SHIP.L * (t - 0.5);
    const half = (SHIP.B / 2) * 0.96 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.4);
    out.set(x, SHIP.FREEBOARD + 0.2, side * (half + 1.1));
    return out.applyMatrix4(this.mesh.matrixWorld);
  }

  update(dt, time, swell) {
    // A hull holed at the waterline takes water, and once the pumps are losing
    // she goes down whether or not anyone hits her again. Without this the
    // endgame stalls: late shot lands in an existing breach, removes almost no
    // new structure, and two wrecks trade fire indefinitely.
    if (!this.sinking && this.integrity < 0.20) {
      const severity = (0.20 - this.integrity) / 0.20;
      this.flooding = (this.flooding || 0) + dt * severity * 0.085;
      this.integrity = Math.max(0, this.integrity - dt * severity * 0.030);
      if (this.integrity <= 0) this.beginSinking();
    }

    // steering
    let dh = this.targetHeading - this.heading;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    this.rudder += (Math.max(-1, Math.min(1, dh * 1.6)) - this.rudder) * Math.min(1, dt * 1.6);
    // the rudder only bites on water flowing past it, so a ship with no way on
    // answers her helm slowly — which is what makes being caught in irons cost
    // something rather than just looking slow
    const bite = Math.min(1, 0.25 + 0.75 * (this.speed / Math.max(1e-3, this.maxSpeed)));
    this.heading += this.rudder * 0.34 * bite * dt;

    // ---- what the wind will give her on this heading
    const wind = this.wind;
    let target = this.maxSpeed;
    let heelWant = 0;
    if (wind) {
      const off = wind.angleOff(this.heading);
      target *= polar(off) * wind.strength;
      // a ship under press of sail lies over away from the wind, hardest when
      // it is on the beam and she is driving
      // A ship laid over is the clearest sign from a distance that she is
      // driving rather than drifting, so this is pitched for legibility across
      // a room — around ten degrees at full press, rather than the five or six
      // that would be closer to the truth.
      heelWant = -wind.side(this.heading) * Math.sin(off) * wind.strength * 0.26;
    }

    // hard over scrubs way off: the rudder is a brake as well as a helm
    target *= 1 - 0.34 * Math.abs(this.rudder);
    // a holed ship carries less canvas and drags water — but this compounds
    // with a poor point of sail, so it stays gentle
    target *= 0.62 + 0.38 * this.integrity;
    const drive = this.sinking ? Math.max(0, 1 - this.sinkT * 0.5) : 1;
    target *= drive;

    // Momentum. A ship does not change speed when her helmsman does — she
    // gathers way slowly and carries it a long time, and that lag is most of
    // what makes her look heavy.
    const gaining = target > this.speed;
    const tau = gaining ? 7.5 : 4.0;
    this.speed += (target - this.speed) * Math.min(1, dt / tau);

    this.heel += (heelWant * Math.min(1, this.speed / this.maxSpeed) - this.heel)
      * Math.min(1, dt * 0.55);

    const sp = this.speed;
    this.pos.x += Math.cos(this.heading) * sp * dt;
    this.pos.z += Math.sin(this.heading) * sp * dt;

    // ride the waves
    const h = waveFrame(this.pos.x, this.pos.z, time, swell, _n);
    // sample fore and aft so long hulls pitch instead of hovering
    const fx = this.pos.x + Math.cos(this.heading) * SHIP.L * 0.4;
    const fz = this.pos.z + Math.sin(this.heading) * SHIP.L * 0.4;
    const ax = this.pos.x - Math.cos(this.heading) * SHIP.L * 0.4;
    const az = this.pos.z - Math.sin(this.heading) * SHIP.L * 0.4;
    const hf = waveFrame(fx, fz, time, swell, null);
    const ha = waveFrame(ax, az, time, swell, null);
    const pitch = Math.atan2(hf - ha, SHIP.L * 0.8) * 0.75;

    const px = this.pos.x - Math.sin(this.heading) * SHIP.B * 0.5;
    const pz = this.pos.z + Math.cos(this.heading) * SHIP.B * 0.5;
    const sxp = this.pos.x + Math.sin(this.heading) * SHIP.B * 0.5;
    const szp = this.pos.z - Math.cos(this.heading) * SHIP.B * 0.5;
    const hp = waveFrame(px, pz, time, swell, null);
    const hs = waveFrame(sxp, szp, time, swell, null);
    let roll = Math.atan2(hs - hp, SHIP.B) * 0.9
      + Math.sin(time * 0.62 + this.seed) * 0.035
      + this.heel;

    // the hull profile already measures from the waterline (local y = 0), so
    // this is just the trim: a laden ship floats a little below her marks
    // she settles as she takes water, so the sea is at her gunports before
    // she finally goes
    let y = (h + hf + ha) / 3 - 0.35 - Math.min(1.5, this.flooding || 0);

    if (this.sinking) {
      this.sinkT += dt;
      const s = this.sinkT;
      roll += this.listRoll * Math.min(1, s / 5.5);
      y -= Math.pow(Math.max(0, s - 1.2), 1.9) * 0.30;
      // the stern goes under first
      const down = Math.min(1, Math.max(0, (s - 2.0) / 7));
      this.mesh.globalAlpha = Math.max(0, 1 - Math.max(0, (s - 7) / 5));
      if (s > 13) this.dead = true;
      this._sinkPitch = -down * 0.55;
    }

    const q = this.mesh.quaternion;
    q.setFromEuler(new THREE.Euler(0, -this.heading, 0, 'YXZ'));
    const local = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(pitch + (this._sinkPitch || 0), 0, roll, 'XZY'));
    q.multiply(local);

    this.mesh.position.set(this.pos.x, y, this.pos.z);
    this.mesh.updateMatrixWorld(true);
    this._inv = this._inv || new THREE.Matrix4();
    this._inv.copy(this.mesh.matrixWorld).invert();
  }
}
