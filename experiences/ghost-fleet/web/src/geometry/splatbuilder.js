import * as THREE from 'three';

/**
 * Accumulates splats into flat arrays. Everything downstream (ships, debris,
 * foam) is authored through this, so a "surface" is really a dense sheet of
 * flat anisotropic Gaussians — which is exactly what a trained splat of a real
 * object looks like up close.
 */

export const PART = {
  HULL: 0, DECK: 1, RAIL: 2, MAST: 3, SAIL: 4,
  RIGGING: 5, CANNON: 6, TRIM: 7, LANTERN: 8, FLAG: 9
};

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _u = new THREE.Vector3();
const _v = new THREE.Vector3();
const _n = new THREE.Vector3();

export class SplatBuilder {
  constructor(expected = 1 << 16) {
    this.pos = [];
    this.scl = [];
    this.rot = [];
    this.col = [];
    this.opa = [];
    this.emi = [];
    this.part = [];
    this.n = 0;
  }

  /**
   * Push one splat oriented by a tangent frame.
   * @param p position
   * @param u first tangent (gets scale su), v second tangent (sv), thickness along the normal
   */
  push(p, u, v, su, sv, thickness, color, opacity, part, emissive = 0) {
    _u.copy(u).normalize();
    _v.copy(v);
    _n.crossVectors(_u, _v);
    if (_n.lengthSq() < 1e-12) return;
    _n.normalize();
    _v.crossVectors(_n, _u).normalize();

    _m.makeBasis(_u, _v, _n);
    _q.setFromRotationMatrix(_m);

    this.pos.push(p.x, p.y, p.z);
    this.scl.push(su, sv, thickness);
    this.rot.push(_q.x, _q.y, _q.z, _q.w);
    this.col.push(color.r, color.g, color.b);
    this.opa.push(opacity);
    this.emi.push(emissive);
    this.part.push(part);
    this.n++;
  }

  /** Push an axis-aligned (unoriented) blob — used for smoke, embers, foam. */
  pushBlob(p, sx, sy, sz, color, opacity, part, emissive = 0) {
    this.pos.push(p.x, p.y, p.z);
    this.scl.push(sx, sy, sz);
    this.rot.push(0, 0, 0, 1);
    this.col.push(color.r, color.g, color.b);
    this.opa.push(opacity);
    this.emi.push(emissive);
    this.part.push(part);
    this.n++;
  }

  finish() {
    return {
      count: this.n,
      pos: new Float32Array(this.pos),
      scl: new Float32Array(this.scl),
      rot: new Float32Array(this.rot),
      col: new Float32Array(this.col),
      opa: new Float32Array(this.opa),
      emi: new Float32Array(this.emi),
      part: new Uint8Array(this.part)
    };
  }
}

/**
 * Tessellate a parametric surface into splats.
 * `fn(u, v, out)` fills out.p / out.du / out.dv.
 */
export function surface(b, fn, nu, nv, opts) {
  const {
    thickness = 0.035, color, opacity = 1, part = PART.HULL,
    jitter = 0.25, sizeJitter = 0.25, emissive = 0, rng,
    colorAt = null, skip = null, sizeBoost = 1.0
  } = opts;

  const out = { p: new THREE.Vector3(), du: new THREE.Vector3(), dv: new THREE.Vector3() };
  const c = new THREE.Color();
  const du = 1 / (nu - 1), dv = 1 / (nv - 1);

  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      let u = i * du, v = j * dv;
      if (rng) { u += rng.sym(du * jitter); v += rng.sym(dv * jitter); }
      u = Math.min(1, Math.max(0, u));
      v = Math.min(1, Math.max(0, v));
      if (skip && skip(u, v)) continue;

      fn(u, v, out);
      const su = out.du.length() * du * 0.78 * sizeBoost;
      const sv = out.dv.length() * dv * 0.78 * sizeBoost;
      if (!(su > 0) || !(sv > 0)) continue;

      const k = rng ? 1 + rng.sym(sizeJitter) : 1;
      if (colorAt) colorAt(u, v, c); else c.copy(color);
      const cap = opts.maxSize ?? 0.45;
      b.push(out.p, out.du, out.dv,
        Math.min(su * k, cap), Math.min(sv * k, cap), thickness, c, opacity, part, emissive);
    }
  }
}

/**
 * Tessellate a swept tube (mast, spar, cannon, rope) into splats.
 * `path(t, out)` fills out.p; radius(t) gives the half-width.
 */
export function tube(b, path, radius, nt, nr, opts) {
  const {
    color, opacity = 1, part = PART.MAST, thickness = 0.03,
    jitter = 0.3, sizeJitter = 0.25, emissive = 0, rng, colorAt = null
  } = opts;

  const p = new THREE.Vector3(), p2 = new THREE.Vector3();
  const tan = new THREE.Vector3(), ref = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  const pt = new THREE.Vector3(), circ = new THREE.Vector3();
  const around = new THREE.Vector3(), along = new THREE.Vector3();
  const c = new THREE.Color();
  const dt = 1 / (nt - 1);

  for (let i = 0; i < nt; i++) {
    let t = i * dt + (rng ? rng.sym(dt * jitter) : 0);
    t = Math.min(1, Math.max(0, t));
    path(t, p);
    path(Math.min(1, t + 0.004), p2);
    tan.subVectors(p2, p);
    if (tan.lengthSq() < 1e-12) tan.set(0, 1, 0);
    tan.normalize();

    ref.set(0, 1, 0);
    if (Math.abs(ref.dot(tan)) > 0.94) ref.set(1, 0, 0);
    e1.crossVectors(tan, ref).normalize();
    e2.crossVectors(tan, e1).normalize();

    const r = radius(t);
    const arcStep = (2 * Math.PI) / nr;
    for (let j = 0; j < nr; j++) {
      const a = j * arcStep + (rng ? rng.sym(arcStep * jitter) : 0) + i * 0.21;
      const ca = Math.cos(a), sa = Math.sin(a);
      circ.copy(e1).multiplyScalar(ca).addScaledVector(e2, sa);
      pt.copy(p).addScaledVector(circ, r);

      const k = rng ? 1 + rng.sym(sizeJitter) : 1;
      const su = r * arcStep * 0.85 * k;
      const sv = dt * p.distanceTo(p2) / 0.004 * 0.85 * k;
      if (colorAt) colorAt(t, a, c); else c.copy(color);
      // tangent frame: around the tube, then along it
      along.copy(tan);
      around.copy(circ).cross(tan).normalize();
      b.push(pt, around, along, su, Math.max(sv, su * 0.4), thickness, c, opacity, part, emissive);
    }
  }
}

/** A straight rope / spar between two points. */
export function cord(b, a, z, radius, opts) {
  const A = a.clone(), B = z.clone();
  const len = A.distanceTo(B);
  // ropes read as lines, not cylinders — sample sparsely around the sweep
  const n = Math.max(3, Math.round(len / (radius * 7.5)));
  tube(b, (t, o) => o.copy(A).lerp(B, t), () => radius, n, 3, opts);
}
