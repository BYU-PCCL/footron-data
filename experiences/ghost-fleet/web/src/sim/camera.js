import * as THREE from 'three';
import { SHIP } from '../geometry/ship.js';
import { waveFrame } from '../geometry/ocean.js';

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

/** Pointer/touch orbit rig with inertia — tuned for a wall-sized touchscreen. */
export class OrbitRig {
  constructor(dom) {
    this.target = new THREE.Vector3(0, 6, 0);
    this.smoothTarget = this.target.clone();
    this.dist = 96;
    this.distGoal = 96;
    this.az = -0.6;
    this.el = 0.22;
    this.azGoal = -0.6;
    this.elGoal = 0.22;
    this.enabled = true;
    // the owner supplies this; the rig must not keep its own idea of "now",
    // or the idle timeout compares two unrelated clocks
    this.onInput = null;

    this._pointers = new Map();
    this._pinch = 0;
    this.dragged = false;

    const down = (e) => {
      this._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dragged = false;
      dom.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      const p = this._pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 3) this.dragged = true;

      if (this._pointers.size === 1 && this.enabled) {
        this.azGoal -= dx * 0.0042;
        this.elGoal = clamp(this.elGoal + dy * 0.0034, -0.06, 1.25);
        this.mark();
      } else if (this._pointers.size >= 2) {
        const pts = [...this._pointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (this._pinch) this.distGoal = clamp(this.distGoal * (this._pinch / d), 26, 320);
        this._pinch = d;
        this.mark();
      }
    };
    const up = (e) => {
      this._pointers.delete(e.pointerId);
      if (this._pointers.size < 2) this._pinch = 0;
    };

    dom.addEventListener('pointerdown', down);
    dom.addEventListener('pointermove', move);
    dom.addEventListener('pointerup', up);
    dom.addEventListener('pointercancel', up);
    dom.addEventListener('pointerleave', up);
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.distGoal = clamp(this.distGoal * (1 + Math.sign(e.deltaY) * 0.10), 26, 320);
      this.mark();
    }, { passive: false });
  }

  mark() { this.onInput?.(); }

  apply(camera, dt) {
    const k = 1 - Math.pow(0.0015, dt);
    this.az += (this.azGoal - this.az) * k;
    this.el += (this.elGoal - this.el) * k;
    this.dist += (this.distGoal - this.dist) * k;
    this.smoothTarget.lerp(this.target, 1 - Math.pow(0.02, dt));

    const ce = Math.cos(this.el), se = Math.sin(this.el);
    camera.position.set(
      this.smoothTarget.x + Math.cos(this.az) * ce * this.dist,
      this.smoothTarget.y + se * this.dist,
      this.smoothTarget.z + Math.sin(this.az) * ce * this.dist
    );
    camera.position.y = Math.max(camera.position.y, 2.2);
    camera.lookAt(this.smoothTarget);
  }
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
const ease = (t) => t * t * (3 - 2 * t);

/**
 * Cinematic director used by the idle screen. It picks shots that frame
 * whatever is actually happening, cuts on a beat, and keeps a little drift
 * in every move so nothing ever looks locked off.
 */
export class Director {
  constructor(world) {
    this.world = world;
    this.t = 0;
    this.shot = null;
    this.shotIndex = -1;
    this.pos = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.fov = 42;
    this.cut();
  }

  _pickShip(prefer = null) {
    const alive = this.world.ships.filter(s => !s.dead);
    if (!alive.length) return null;
    if (prefer === 'damaged') {
      return alive.slice().sort((a, b) => a.integrity - b.integrity)[0];
    }
    if (prefer === 'firing') {
      const recent = alive.filter(s => s.reload > 3.5);
      if (recent.length) return recent[(Math.random() * recent.length) | 0];
    }
    return alive[(Math.random() * alive.length) | 0];
  }

  /**
   * Push the camera out of any ship it has ended up inside. The shot's own
   * subject is exempt — the close shots are deliberately close; what we are
   * guarding against is a second ship sailing through the frame.
   */
  _avoidShips(pos, exempt) {
    // half the length plus the yard-arms, plus a little air
    const KEEP = 27;
    for (const s of this.world.ships) {
      if (s.dead || s === exempt) continue;
      const dx = pos.x - s.mesh.position.x;
      const dz = pos.z - s.mesh.position.z;
      const d = Math.hypot(dx, dz);
      if (d > KEEP || d < 1e-4) continue;
      const k = (KEEP - d) / d;
      pos.x += dx * k;
      pos.z += dz * k;
    }
  }

  cut() {
    const w = this.world;
    const c = w.battleCenter(new THREE.Vector3());
    const ship = this._pickShip();
    const shots = [];

    // 1. sea-skimming approach
    shots.push(() => {
      const a = Math.random() * Math.PI * 2;
      const r0 = 190, r1 = 78;
      return {
        dur: 11,
        fov: 38,
        pos: (u, out) => {
          const r = r0 + (r1 - r0) * ease(u);
          out.set(c.x + Math.cos(a + u * 0.2) * r, 2.6 + Math.sin(u * 3.1) * 0.5, c.z + Math.sin(a + u * 0.2) * r);
        },
        look: (u, out) => out.copy(c).setY(9 + u * 4)
      };
    });

    // 2. crane up over a ship's stern
    shots.push(() => {
      if (!ship) return null;
      return {
        dur: 9.5,
        fov: 44,
        follow: ship,
        pos: (u, out) => {
          const back = _a.set(-SHIP.L * 0.95 - 8, 3.5 + ease(u) * 26, 6.5).applyMatrix4(ship.mesh.matrixWorld);
          out.copy(back);
        },
        look: (u, out) => out.copy(ship.mesh.position).setY(6 + u * 5)
      };
    });

    // 3. dolly along the broadside
    shots.push(() => {
      if (!ship) return null;
      const side = Math.random() < 0.5 ? 1 : -1;
      return {
        dur: 9,
        fov: 34,
        follow: ship,
        pos: (u, out) => {
          out.set(SHIP.L * (u * 1.6 - 0.8), 4.6, side * 27).applyMatrix4(ship.mesh.matrixWorld);
        },
        look: (u, out) => {
          out.set(SHIP.L * (u * 1.6 - 0.75), 6.5, 0).applyMatrix4(ship.mesh.matrixWorld);
        }
      };
    });

    // 4. high orbit of the whole engagement
    shots.push(() => {
      const a0 = Math.random() * Math.PI * 2;
      const r = 150;
      return {
        dur: 12,
        fov: 46,
        pos: (u, out) => {
          const a = a0 + u * 0.55;
          out.set(c.x + Math.cos(a) * r, 46 - u * 12, c.z + Math.sin(a) * r);
        },
        look: (u, out) => out.copy(c).setY(4)
      };
    });

    // 5. masthead looking down the deck
    shots.push(() => {
      if (!ship) return null;
      return {
        dur: 8.5,
        fov: 52,
        follow: ship,
        pos: (u, out) => out.set(-SHIP.L * 0.18, 27 - u * 3.5, 2.2).applyMatrix4(ship.mesh.matrixWorld),
        look: (u, out) => out.set(SHIP.L * 0.55, 3 - u * 2, 0).applyMatrix4(ship.mesh.matrixWorld)
      };
    });

    // 6. slow push through the smoke toward the damaged ship
    shots.push(() => {
      const s = this._pickShip('damaged');
      if (!s) return null;
      const a = Math.random() * Math.PI * 2;
      return {
        dur: 10,
        fov: 40,
        follow: s,
        pos: (u, out) => {
          const r = 72 - ease(u) * 34;
          out.set(s.pos.x + Math.cos(a) * r, 10 - ease(u) * 4.5, s.pos.z + Math.sin(a) * r);
        },
        look: (u, out) => out.copy(s.mesh.position).setY(7)
      };
    });

    // 7. water-level between two ships, looking along the line of fire
    shots.push(() => {
      const alive = this.world.ships.filter(x => !x.dead);
      if (alive.length < 2) return null;
      const A = alive[0], B = alive.slice(1).sort((p, q) =>
        p.pos.distanceTo(A.pos) - q.pos.distanceTo(A.pos))[0];
      const mid = A.pos.clone().add(B.pos).multiplyScalar(0.5);
      const dir = B.pos.clone().sub(A.pos).normalize();
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);
      return {
        dur: 9,
        fov: 36,
        pos: (u, out) => out.copy(mid).addScaledVector(perp, 44 - u * 8).setY(2.4),
        look: () => mid.clone().setY(8)
      };
    });

    // shot 0..6 in build order; the wider ones earn more of the loop
    const WEIGHT = [3, 2, 2, 4, 1, 2, 3];
    const total = WEIGHT.reduce((a, b) => a + b, 0);

    let next = null, guard = 0;
    while (!next && guard++ < 14) {
      let roll = Math.random() * total, i = 0;
      while (roll > WEIGHT[i] && i < WEIGHT.length - 1) { roll -= WEIGHT[i]; i++; }
      if (i === this.shotIndex && shots.length > 1) i = (i + 1) % shots.length;
      next = shots[i]();
      if (next) this.shotIndex = i;
    }
    this.shot = next || shots[3]();
    this.t = 0;
  }

  update(dt, camera, time, swell) {
    if (!this.shot) this.cut();
    this.t += dt;
    const u = Math.min(1, this.t / this.shot.dur);

    this.shot.pos(u, _a);
    const r = this.shot.look(u, _b) || _b;

    // never let a shot drop below the actual water surface
    const h = waveFrame(_a.x, _a.z, time, swell, null);
    _a.y = Math.max(_a.y, h + 1.1);

    // and never let one end up inside a hull or its rigging: a shot framed on
    // one ship can have another sail straight through it
    this._avoidShips(_a, this.shot.follow);

    // a touch of handheld drift
    const k = time * 0.37;
    _a.x += Math.sin(k * 1.7) * 0.28;
    _a.y += Math.sin(k * 2.3 + 1.1) * 0.20;
    _a.z += Math.cos(k * 1.3 + 0.5) * 0.28;

    camera.position.copy(_a);
    camera.lookAt(r);
    if (Math.abs(camera.fov - this.shot.fov) > 0.01) {
      camera.fov += (this.shot.fov - camera.fov) * Math.min(1, dt * 3);
      camera.updateProjectionMatrix();
    }

    if (this.t >= this.shot.dur) this.cut();
  }
}
