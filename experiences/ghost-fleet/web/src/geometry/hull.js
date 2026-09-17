import * as THREE from 'three';

/**
 * The analytic hull form.
 *
 * This is the ship's *shape*, independent of the splat cloud that draws it.
 * Three things need it and none of them should care how many Gaussians are
 * left alive:
 *
 *  - gunnery, so a ship shot full of holes is not literally harder to hit;
 *  - collision, so hulls do not sail through one another;
 *  - a depth-only proxy, so debris behind a hull is occluded by it.
 *
 * Splat-cloud queries were doing the first of those and degraded badly as a
 * ship was destroyed: a wreck is mostly gaps, so round shot passed straight
 * through it.
 */

export const SHIP = {
  L: 36,          // length overall, stern (x=-L/2) to bow (x=+L/2)
  B: 9.0,         // max beam
  KEEL: 4.2,      // depth below waterline amidships
  FREEBOARD: 3.4  // gunwale height above waterline amidships
};

function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Half-beam factor along the length. 0 = stern, 1 = bow. */
export function beamProfile(t) {
  if (t >= 0.40) {
    // long, fine entry: the beam falls away steadily all the way to the stem
    const s = (t - 0.40) / 0.60;
    return Math.max(0.015, Math.pow(1 - s * s, 0.85));
  }
  const s = (0.40 - t) / 0.40;               // a full but tapering run aft
  return Math.max(0.30, 1 - 0.58 * Math.pow(s, 1.55));
}

/** Deck sheer: the gunwale sweeps up at both ends. */
export function sheer(t) {
  const d = t - 0.46;
  return 0.9 * d * d * 4.0 + (t > 0.82 ? (t - 0.82) * 3.4 : 0) + (t < 0.16 ? (0.16 - t) * 5.2 : 0);
}

export function keelDepth(t) {
  return SHIP.KEEL * (0.40 + 0.60 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.5));
}

/** v: 0 at the keel, 1 at the gunwale. Width factor (rounded bilge + tumblehome). */
export function sectionWidth(v) {
  const bilge = Math.pow(v, 0.40);
  const tumble = 1 - 0.20 * smooth(0.70, 1.0, v);
  return bilge * tumble;
}

/** Hull surface point + tangents for side `side` (+1 starboard / -1 port). */
export function hullPoint(t, v, side, out) {
  const x = SHIP.L * (t - 0.5);
  const half = (SHIP.B / 2) * beamProfile(t);
  const kd = keelDepth(t);
  const top = SHIP.FREEBOARD + sheer(t);
  const y = -kd + (top + kd) * v;
  const z = side * half * sectionWidth(v);
  out.p.set(x, y, z);

  const e = 0.004;
  // d/dt
  const t2 = Math.min(1, t + e);
  const half2 = (SHIP.B / 2) * beamProfile(t2);
  const kd2 = keelDepth(t2), top2 = SHIP.FREEBOARD + sheer(t2);
  out.du.set(
    (SHIP.L * (t2 - 0.5) - x) / e,
    ((-kd2 + (top2 + kd2) * v) - y) / e,
    (side * half2 * sectionWidth(v) - z) / e
  );
  // d/dv
  const v2 = Math.min(1, v + e);
  out.dv.set(0, ((top + kd) * (v2 - v)) / e, (side * half * (sectionWidth(v2) - sectionWidth(v))) / e);
}

// -------------------------------------------------------------- queries

/** Longitudinal parameter t for a local x, or -1 if outside the hull's length. */
function tAt(x) {
  const t = x / SHIP.L + 0.5;
  return (t < 0 || t > 1) ? -1 : t;
}

/**
 * Half-beam of the hull at local (x, y), or 0 if that station is clear of it.
 * `grow` inflates the envelope, which collision uses to keep a standoff.
 */
export function halfBeamAt(x, y, grow = 0) {
  const t = tAt(x);
  if (t < 0) return 0;

  const kd = keelDepth(t);
  const top = SHIP.FREEBOARD + sheer(t);
  if (y < -kd - grow || y > top + grow) return 0;

  // v runs 0 at the keel to 1 at the gunwale
  const v = Math.min(1, Math.max(0, (y + kd) / (top + kd)));
  return (SHIP.B / 2) * beamProfile(t) * sectionWidth(v) + grow;
}

/** Is this local-space point inside the hull envelope? */
export function hullContains(p, grow = 0) {
  const half = halfBeamAt(p.x, p.y, grow);
  return half > 0 && Math.abs(p.z) <= half;
}

/**
 * Does the segment a -> b (both local) enter the hull? Returns the entry point
 * in `out` and true, or false if it misses.
 *
 * Marched rather than solved: the hull is a product of four smooth profile
 * functions with no closed-form intersection, and the ball is already
 * substepped by the caller, so a short march is both simpler and accurate to
 * well under the width of a plank.
 */
export function hullSegmentHit(a, b, out, grow = 0) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 1e-6) {
    if (!hullContains(a, grow)) return false;
    out.copy(a);
    return true;
  }

  const steps = Math.max(2, Math.min(64, Math.ceil(len / 0.30)));
  let px = a.x, py = a.y, pz = a.z;
  for (let i = 1; i <= steps; i++) {
    const u = i / steps;
    const x = a.x + dx * u, y = a.y + dy * u, z = a.z + dz * u;
    const half = halfBeamAt(x, y, grow);
    if (half > 0 && Math.abs(z) <= half) {
      // step back to the last point outside, so the crater lands on the
      // surface rather than somewhere inside the ship
      out.set((px + x) * 0.5, (py + y) * 0.5, (pz + z) * 0.5);
      return true;
    }
    px = x; py = y; pz = z;
  }
  return false;
}

/**
 * Closest point on the hull's centreline to a local point, clamped to the
 * ship's length. Collision resolves against this spine rather than the full
 * surface — two hulls are long and thin, and spine-to-spine distance with a
 * beam allowance is both cheap and stable.
 */
export function clampToSpine(x) {
  const h = SHIP.L * 0.5;
  return x < -h ? -h : x > h ? h : x;
}

// ---------------------------------------------------- depth-only proxy

/**
 * A closed, low-poly triangle mesh of the hull envelope.
 *
 * Rendered colour-free before the splats so the depth buffer knows where the
 * hull is. Without it the effect pool — a separate transparent mesh with no
 * depth write — draws its debris over the ship whatever the real depth, and
 * fragments blown out the far side appear to hang in front of the near one.
 *
 * `inset` shrinks it slightly so the ship's own splats, which sit exactly on
 * this surface, are not clipped by their own proxy.
 */
export function buildHullProxy(nt = 34, nv = 10, inset = 0.34) {
  const verts = [];
  const idx = [];

  const ring = (t) => {
    const kd = keelDepth(t);
    const top = SHIP.FREEBOARD + sheer(t);
    const base = [];
    // starboard keel -> gunwale, then port gunwale -> keel: one closed loop
    for (let i = 0; i < nv; i++) {
      const v = i / (nv - 1);
      base.push([v, 1]);
    }
    for (let i = nv - 1; i >= 0; i--) {
      const v = i / (nv - 1);
      base.push([v, -1]);
    }
    return base.map(([v, side]) => {
      const y = -kd + (top + kd) * v;
      const half = (SHIP.B / 2) * beamProfile(t) * sectionWidth(v);
      const shrink = Math.max(0, half - inset);
      return [SHIP.L * (t - 0.5), y + (v < 0.5 ? inset : -inset), side * shrink];
    });
  };

  const perRing = nv * 2;
  for (let s = 0; s < nt; s++) {
    const t = s / (nt - 1);
    for (const [x, y, z] of ring(t)) verts.push(x, y, z);
  }

  for (let s = 0; s < nt - 1; s++) {
    for (let i = 0; i < perRing; i++) {
      const j = (i + 1) % perRing;
      const a = s * perRing + i, b = s * perRing + j;
      const c = (s + 1) * perRing + i, d = (s + 1) * perRing + j;
      idx.push(a, c, b, b, c, d);
    }
  }

  // cap both ends so the solid is closed and cannot be seen into
  for (const [s, flip] of [[0, false], [nt - 1, true]]) {
    const centre = verts.length / 3;
    const t = s / (nt - 1);
    const kd = keelDepth(t), top = SHIP.FREEBOARD + sheer(t);
    verts.push(SHIP.L * (t - 0.5), (top - kd) * 0.5, 0);
    for (let i = 0; i < perRing; i++) {
      const a = s * perRing + i;
      const b = s * perRing + ((i + 1) % perRing);
      if (flip) idx.push(centre, b, a); else idx.push(centre, a, b);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
