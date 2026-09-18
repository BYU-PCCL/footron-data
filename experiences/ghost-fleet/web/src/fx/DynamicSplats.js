import * as THREE from 'three';
import { SplatMesh } from '../splats/SplatMesh.js';
import { waveAt } from '../geometry/ocean.js';

/**
 * A world-space pool of simulated Gaussians: hull fragments torn off a ship,
 * powder smoke, fire, embers and spray. Dead slots are recycled from a free
 * list, and the whole pool is compacted into the live prefix of the splat
 * texture each frame so the sorter only ever walks active splats.
 */

export const KIND = {
  DEBRIS: 0,   // a real fragment of the ship, tumbling
  SMOKE:  1,   // expands, rises, fades
  FIRE:   2,   // bright, short-lived, becomes smoke
  SPRAY:  3,   // ballistic water, dies at the surface
  EMBER:  4    // tiny bright mote with drag
};

const GRAV = -22.0;
const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _c = new THREE.Color();

export class DynamicSplats {
  constructor(capacity = 26000) {
    this.capacity = capacity;
    this.mesh = new SplatMesh(capacity, { name: 'dynamic', sortEvery: 1, renderOrder: 5 });

    this.px = new Float32Array(capacity); this.py = new Float32Array(capacity); this.pz = new Float32Array(capacity);
    this.vx = new Float32Array(capacity); this.vy = new Float32Array(capacity); this.vz = new Float32Array(capacity);
    this.sx = new Float32Array(capacity); this.sy = new Float32Array(capacity); this.sz = new Float32Array(capacity);
    this.qx = new Float32Array(capacity); this.qy = new Float32Array(capacity);
    this.qz = new Float32Array(capacity); this.qw = new Float32Array(capacity);
    this.wx = new Float32Array(capacity); this.wy = new Float32Array(capacity); this.wz = new Float32Array(capacity);
    this.r = new Float32Array(capacity); this.g = new Float32Array(capacity); this.b = new Float32Array(capacity);
    this.life = new Float32Array(capacity);
    this.maxLife = new Float32Array(capacity);
    this.kind = new Uint8Array(capacity);
    this.alpha0 = new Float32Array(capacity);
    this.grow = new Float32Array(capacity);
    this.emi = new Float32Array(capacity);

    // 0 = normal. Ramped up by the impact showcase to thin the powder smoke
    // and flame so the debris Gaussians — the thing being explained — are
    // actually visible instead of buried in their own explosion.
    this.reveal = 0;

    this.alive = new Int32Array(capacity);
    this.aliveCount = 0;
    this.free = new Int32Array(capacity);
    for (let i = 0; i < capacity; i++) this.free[i] = capacity - 1 - i;
    this.freeCount = capacity;
  }

  _alloc() {
    if (this.freeCount === 0) {
      // recycle the oldest live splat rather than dropping the effect
      const victim = this.alive[0];
      this.alive[0] = this.alive[--this.aliveCount];
      return victim;
    }
    return this.free[--this.freeCount];
  }

  spawn(o) {
    const i = this._alloc();
    this.alive[this.aliveCount++] = i;

    this.px[i] = o.x; this.py[i] = o.y; this.pz[i] = o.z;
    this.vx[i] = o.vx || 0; this.vy[i] = o.vy || 0; this.vz[i] = o.vz || 0;
    this.sx[i] = o.sx; this.sy[i] = o.sy ?? o.sx; this.sz[i] = o.sz ?? o.sx;
    this.qx[i] = o.qx || 0; this.qy[i] = o.qy || 0; this.qz[i] = o.qz || 0; this.qw[i] = o.qw ?? 1;
    this.wx[i] = o.wx || 0; this.wy[i] = o.wy || 0; this.wz[i] = o.wz || 0;
    this.r[i] = o.r; this.g[i] = o.g; this.b[i] = o.b;
    this.life[i] = 0;
    this.maxLife[i] = o.life;
    this.kind[i] = o.kind;
    this.alpha0[i] = o.alpha ?? 1;
    this.grow[i] = o.grow || 0;
    this.emi[i] = o.emissive || 0;
    return i;
  }

  /**
   * Centre and spread of the live debris near a point. The showcase frames
   * this directly rather than guessing a distance: the fragments are the
   * subject, so the shot should fit the fragments.
   * @returns { n, spread } — spread is the RMS distance from the centroid
   */
  debrisBounds(near, radius, outCentroid) {
    const r2 = radius * radius;
    let n = 0, x = 0, y = 0, z = 0;
    for (let a = 0; a < this.aliveCount; a++) {
      const i = this.alive[a];
      if (this.kind[i] !== KIND.DEBRIS) continue;
      const dx = this.px[i] - near.x, dy = this.py[i] - near.y, dz = this.pz[i] - near.z;
      if (dx * dx + dy * dy + dz * dz > r2) continue;
      x += this.px[i]; y += this.py[i]; z += this.pz[i];
      n++;
    }
    if (n === 0) return { n: 0, spread: 0 };
    x /= n; y /= n; z /= n;
    outCentroid.set(x, y, z);

    let sum = 0;
    for (let a = 0; a < this.aliveCount; a++) {
      const i = this.alive[a];
      if (this.kind[i] !== KIND.DEBRIS) continue;
      const dx = this.px[i] - near.x, dy = this.py[i] - near.y, dz = this.pz[i] - near.z;
      if (dx * dx + dy * dy + dz * dz > r2) continue;
      const ex = this.px[i] - x, ey = this.py[i] - y, ez = this.pz[i] - z;
      sum += ex * ex + ey * ey + ez * ez;
    }
    return { n, spread: Math.sqrt(sum / n) };
  }

  update(dt, time, swell) {
    const n = this.aliveCount;
    let w = 0;
    const mesh = this.mesh;
    let out = 0;

    for (let a = 0; a < n; a++) {
      const i = this.alive[a];
      const k = this.kind[i];
      let t = (this.life[i] += dt);
      const T = this.maxLife[i];
      if (t >= T) { this.free[this.freeCount++] = i; continue; }
      const u = t / T;

      // ---- integrate
      if (k === KIND.DEBRIS || k === KIND.SPRAY) {
        this.vy[i] += GRAV * dt;
        const drag = k === KIND.SPRAY ? 0.55 : 0.22;
        const d = Math.max(0, 1 - drag * dt);
        this.vx[i] *= d; this.vy[i] *= d; this.vz[i] *= d;
      } else if (k === KIND.SMOKE) {
        this.vy[i] += 3.4 * dt;                   // buoyancy
        const d = Math.max(0, 1 - 0.85 * dt);
        this.vx[i] *= d; this.vy[i] *= d; this.vz[i] *= d;
        this.vx[i] += 1.2 * dt;                   // pushed downwind
      } else if (k === KIND.FIRE) {
        this.vy[i] += 8.0 * dt;
        const d = Math.max(0, 1 - 2.2 * dt);
        this.vx[i] *= d; this.vy[i] *= d; this.vz[i] *= d;
      } else if (k === KIND.EMBER) {
        this.vy[i] += GRAV * 0.28 * dt;
        const d = Math.max(0, 1 - 1.1 * dt);
        this.vx[i] *= d; this.vy[i] *= d; this.vz[i] *= d;
      }

      this.px[i] += this.vx[i] * dt;
      this.py[i] += this.vy[i] * dt;
      this.pz[i] += this.vz[i] * dt;

      // ---- water interaction
      if (k === KIND.DEBRIS || k === KIND.SPRAY || k === KIND.EMBER) {
        const h = waveAt(this.px[i], this.pz[i], time, swell, _v).y;
        if (this.py[i] < h) {
          if (k === KIND.DEBRIS) {
            // flotsam: settle and bob, kill spin
            this.py[i] = h;
            this.vy[i] *= -0.18;
            this.vx[i] *= 0.5; this.vz[i] *= 0.5;
            this.wx[i] *= 0.4; this.wy[i] *= 0.4; this.wz[i] *= 0.4;
          } else {
            // spray and embers are extinguished by the sea
            this.life[i] = T;
            this.free[this.freeCount++] = i;
            continue;
          }
        }
      }

      // ---- spin
      if (this.wx[i] || this.wy[i] || this.wz[i]) {
        _v.set(this.wx[i], this.wy[i], this.wz[i]);
        const ang = _v.length() * dt;
        if (ang > 1e-6) {
          _q2.setFromAxisAngle(_v.normalize(), ang);
          _q.set(this.qx[i], this.qy[i], this.qz[i], this.qw[i]).premultiply(_q2).normalize();
          this.qx[i] = _q.x; this.qy[i] = _q.y; this.qz[i] = _q.z; this.qw[i] = _q.w;
        }
      }

      // ---- appearance over life
      let alpha = this.alpha0[i];
      let sc = 1 + this.grow[i] * t;
      let emi = this.emi[i];
      let rr = this.r[i], gg = this.g[i], bb = this.b[i];

      if (k === KIND.SMOKE) {
        alpha *= Math.min(1, u * 7.0) * (1 - u) * (1 - u);
        // powder smoke cools from lit grey to soot
        _c.setRGB(rr, gg, bb).multiplyScalar(1 - 0.45 * u);
        rr = _c.r; gg = _c.g; bb = _c.b;
      } else if (k === KIND.FIRE) {
        alpha *= (1 - u);
        emi *= (1 - u) * 1.6;
        sc *= 1 + u * 0.9;
      } else if (k === KIND.EMBER) {
        alpha *= Math.min(1, (1 - u) * 3.0);
        emi *= 0.5 + 0.5 * Math.sin(t * 34 + i);
      } else if (k === KIND.SPRAY) {
        alpha *= Math.min(1, u * 9.0) * (1 - u * u);
      } else if (k === KIND.DEBRIS) {
        alpha *= 1 - Math.pow(Math.max(0, (u - 0.72) / 0.28), 1.4);
      }

      if (this.reveal > 0 && k !== KIND.DEBRIS) {
        // Everything that is not a torn-off piece of the ship gets taken out
        // of the way. Hundreds of overlapping puffs still read as fog at 5%
        // each, and the showcase exists to show the debris, not the weather.
        const keep = k === KIND.FIRE ? 0.22 : k === KIND.EMBER ? 0.35 : 0.02;
        alpha *= 1 - this.reveal * (1 - keep);
      }

      if (alpha < 0.004) { this.free[this.freeCount++] = i; continue; }

      this.alive[w++] = i;
      mesh.set(out++,
        this.px[i], this.py[i], this.pz[i],
        this.sx[i] * sc, this.sy[i] * sc, this.sz[i] * sc,
        this.qx[i], this.qy[i], this.qz[i], this.qw[i],
        rr, gg, bb, alpha, emi);
    }

    this.aliveCount = w;
    mesh.setCount(out);
    mesh.flush();
  }
}
