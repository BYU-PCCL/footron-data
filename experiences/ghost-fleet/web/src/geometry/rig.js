import * as THREE from 'three';
import { SHIP, sheer } from './hull.js';

/**
 * The rig: where the masts stand, how the yards are braced, and the exact
 * surface each sail bellies into.
 *
 * Shared because two things need the same numbers and must not drift apart —
 * `ship.js` lays Gaussians onto these surfaces, and `buildSailProxy` builds a
 * colour-free copy of them for the depth buffer. A sail is an opaque sheet;
 * without a depth proxy the effect pool draws its debris straight through one,
 * because the pool is a separate transparent mesh that writes no depth.
 */

/** Height of the weather deck at longitudinal position t. */
export const deckY = (t) => SHIP.FREEBOARD + sheer(t) - 0.55;

/** [heightFraction, halfWidth, drop] per sail, foot to head. */
export const MASTS = [
  { t: 0.21, h: 19.5, r: 0.32, sails: [[0.30, 7.0, 6.0], [0.58, 5.8, 4.6], [0.80, 3.9, 3.1]] },  // mizzen (aft)
  { t: 0.49, h: 25.0, r: 0.40, sails: [[0.25, 9.8, 7.8], [0.53, 8.2, 6.3], [0.76, 5.6, 4.2]] },  // main
  { t: 0.78, h: 20.5, r: 0.32, sails: [[0.28, 8.0, 6.6], [0.56, 6.7, 5.1], [0.79, 4.4, 3.4]] }   // fore
];

export const BRACE = 0.42;               // radians the yards are swung round
const CB = Math.cos(BRACE), SB = Math.sin(BRACE);

/** Rotate a point in the yard's plane about the mast's vertical axis. */
export function brace(ox, oz) {
  return [ox * CB - oz * SB, ox * SB + oz * CB];
}

export const BELLY = 1.35;

/**
 * A point on one sail. `m` is the mast, `sail` is its [hf, half, sh] triple,
 * and (u, v) run across the foot and down from the head.
 */
export function sailPoint(m, sail, u, v, out) {
  const [hf, half, sh] = sail;
  const baseY = deckY(m.t);
  const x = SHIP.L * (m.t - 0.5);
  const rake = 0.55 * (m.t - 0.5);
  const yy = baseY + m.h * hf;
  const yx = x - rake * (m.h * hf) * 0.12;

  const zz = (u * 2 - 1) * half * (1 - 0.07 * v);
  const bow = Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.15)) * BELLY;
  const ripple = 0.14 * Math.sin(u * 13.0 + v * 4.0) * Math.sin(Math.PI * u);
  const [bx, bz] = brace(-bow - ripple, zz);
  // The sag term raises sin(pi*u) to a fractional power, which is NaN for a
  // negative base. The splat version never sees u outside [0,1], but the depth
  // proxy deliberately overshoots the sail's edges, so clamp it here rather
  // than letting one NaN vertex poison a whole BufferGeometry.
  const sag = Math.pow(Math.max(0, Math.sin(Math.PI * u)), 1.5);
  return out.set(yx + bx, yy - v * sh + sag * 0.30 * v, bz);
}

/**
 * Colour-free sheets matching every sail, for the depth buffer.
 *
 * Drawn with `polygonOffset` rather than inset: a sail has no inside to shrink
 * toward, so the proxy is nudged a little further from the camera in depth,
 * which lets the sail's own Gaussians — sitting exactly on this surface — pass
 * their depth test while anything genuinely behind the sail fails.
 */
export function buildSailProxy(nu = 14, nv = 11) {
  const verts = [];
  const idx = [];
  const p = new THREE.Vector3();

  // The sail's Gaussians are soft-edged and spill past the parametric
  // boundary. A proxy that stops exactly at u=0..1 leaves that fringe
  // unprotected, and debris behind it shows through in a hard-edged band that
  // traces the proxy rather than the sail. Overshoot the sides and the foot so
  // the proxy covers everything the sail actually paints.
  const OVER_U = 0.045;
  const OVER_V = 0.05;
  // not the head: the yard sits there and has Gaussians of its own
  const uAt = (i) => -OVER_U + (i / (nu - 1)) * (1 + 2 * OVER_U);
  const vAt = (j) => (j / (nv - 1)) * (1 + OVER_V);

  for (const m of MASTS) {
    for (const sail of m.sails) {
      const base = verts.length / 3;
      for (let i = 0; i < nu; i++) {
        for (let j = 0; j < nv; j++) {
          sailPoint(m, sail, uAt(i), vAt(j), p);
          verts.push(p.x, p.y, p.z);
        }
      }
      for (let i = 0; i < nu - 1; i++) {
        for (let j = 0; j < nv - 1; j++) {
          const a = base + i * nv + j;
          const b = base + i * nv + j + 1;
          const c = base + (i + 1) * nv + j;
          const d = base + (i + 1) * nv + j + 1;
          idx.push(a, c, b, b, c, d);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.setIndex(idx);
  return geo;
}

/**
 * A swept tube as triangles: `path(t, out)` gives the centreline, `radius(t)`
 * the half-width. Used for the spar proxies, which are the same shapes the
 * splat version sweeps Gaussians along.
 */
function tubeMesh(verts, idx, path, radius, nt, nr) {
  const p = new THREE.Vector3(), p2 = new THREE.Vector3();
  const tan = new THREE.Vector3(), ref = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  const base = verts.length / 3;

  for (let i = 0; i < nt; i++) {
    const t = i / (nt - 1);
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
    for (let j = 0; j < nr; j++) {
      const a = (j / nr) * Math.PI * 2;
      verts.push(
        p.x + (e1.x * Math.cos(a) + e2.x * Math.sin(a)) * r,
        p.y + (e1.y * Math.cos(a) + e2.y * Math.sin(a)) * r,
        p.z + (e1.z * Math.cos(a) + e2.z * Math.sin(a)) * r
      );
    }
  }
  for (let i = 0; i < nt - 1; i++) {
    for (let j = 0; j < nr; j++) {
      const j2 = (j + 1) % nr;
      const a = base + i * nr + j, b = base + i * nr + j2;
      const c = base + (i + 1) * nr + j, d = base + (i + 1) * nr + j2;
      idx.push(a, c, b, b, c, d);
    }
  }
}

/**
 * Colour-free masts, yards and bowsprit for the depth buffer.
 *
 * These matter more than they look: a mast is dark against a bright sky, so
 * debris drawing through one is among the most obvious depth failures on the
 * whole ship. They are too slender to inset the way the hull is, so they share
 * the sails' polygon offset.
 */
export function buildSparProxy() {
  const verts = [];
  const idx = [];

  for (const m of MASTS) {
    const baseY = deckY(m.t);
    const x = SHIP.L * (m.t - 0.5);
    const rake = 0.55 * (m.t - 0.5);

    tubeMesh(verts, idx,
      (t, o) => o.set(x - rake * t * m.h * 0.12, baseY - 2.2 + t * (m.h + 2.2), 0),
      (t) => m.r * (1 - 0.55 * t) * 1.1,
      14, 7);

    for (const [hf, half] of m.sails) {
      const yy = baseY + m.h * hf;
      const yx = x - rake * (m.h * hf) * 0.12;
      tubeMesh(verts, idx, (t, o) => {
        const [bx, bz] = brace(0, (t * 2 - 1) * half);
        o.set(yx + bx, yy + Math.pow(Math.abs(t * 2 - 1), 2) * 0.35, bz);
      }, (t) => 0.17 * (1 - 0.5 * Math.abs(t * 2 - 1)) * 1.25, 12, 6);
    }
  }

  // the bowsprit, which reaches well clear of the hull
  const bowTipX = SHIP.L / 2 + 7.0;
  const bowTipY = SHIP.FREEBOARD + 3.4;
  const d0 = deckY(0.95);
  tubeMesh(verts, idx,
    (t, o) => o.set(SHIP.L * 0.40 + t * (bowTipX - SHIP.L * 0.40), d0 + t * (bowTipY - d0), 0),
    (t) => 0.22 * (1 - 0.5 * t) * 1.2,
    12, 6);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.setIndex(idx);
  return geo;
}
