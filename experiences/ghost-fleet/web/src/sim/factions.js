import * as THREE from 'three';

const C = (h) => new THREE.Color(h);

function circle(u, v, cx, cy, r, ar = 1) {
  const dx = (u - cx), dy = (v - cy) / ar;
  return Math.sqrt(dx * dx + dy * dy) - r;
}
function box(u, v, cx, cy, hw, hh) {
  return Math.max(Math.abs(u - cx) - hw, Math.abs(v - cy) - hh);
}
function capsule(u, v, ax, ay, bx, by, r) {
  const pax = u - ax, pay = v - ay, bax = bx - ax, bay = by - ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * h, pay - bay * h) - r;
}
const mask = (d, soft = 0.012) => 1 - Math.min(1, Math.max(0, (d + soft) / (2 * soft)));

/** Skull and crossbones, drawn as a signed-distance field on the sail. */
function skull(u, v) {
  const bones = Math.min(
    capsule(u, v, 0.26, 0.28, 0.74, 0.76, 0.028),
    capsule(u, v, 0.74, 0.28, 0.26, 0.76, 0.028)
  );
  const knobs = Math.min(
    Math.min(circle(u, v, 0.245, 0.265, 0.045), circle(u, v, 0.755, 0.735, 0.045)),
    Math.min(circle(u, v, 0.755, 0.265, 0.045), circle(u, v, 0.245, 0.735, 0.045))
  );
  let head = Math.min(circle(u, v, 0.5, 0.44, 0.175, 1.1), box(u, v, 0.5, 0.60, 0.085, 0.075));
  const eyes = Math.min(circle(u, v, 0.437, 0.435, 0.052), circle(u, v, 0.563, 0.435, 0.052));
  const nose = circle(u, v, 0.5, 0.52, 0.026);
  head = Math.max(head, -Math.min(eyes, nose));
  const teeth = box(u, v, 0.5, 0.615, 0.075, 0.05);
  const gaps = Math.abs(((u - 0.5) * 22) % 2) < 1 ? -1 : 1;
  const d = Math.min(Math.min(bones, knobs), gaps > 0 ? head : Math.min(head, teeth));
  return mask(d);
}

/** Anchor and rope. */
function anchor(u, v) {
  const shank = box(u, v, 0.5, 0.52, 0.026, 0.24);
  const stock = box(u, v, 0.5, 0.36, 0.17, 0.023);
  const ring = Math.abs(circle(u, v, 0.5, 0.245, 0.062)) - 0.021;
  const armL = capsule(u, v, 0.5, 0.74, 0.28, 0.62, 0.028);
  const armR = capsule(u, v, 0.5, 0.74, 0.72, 0.62, 0.028);
  const flukeL = capsule(u, v, 0.28, 0.62, 0.235, 0.545, 0.05);
  const flukeR = capsule(u, v, 0.72, 0.62, 0.765, 0.545, 0.05);
  const d = Math.min(
    Math.min(Math.min(shank, stock), ring),
    Math.min(Math.min(armL, armR), Math.min(flukeL, flukeR))
  );
  return mask(d);
}

export const FACTIONS = {
  crimson: {
    key: 'crimson',
    label: 'Crimson',
    gold:  C(0xd2a33d),
    trim:  C(0x71121d),
    sail:  C(0x7d141f),
    flagA: C(0xa81c28),
    flagB: C(0x1d0d10),
    ui: '#ff6b62',
    uiDim: 'rgba(255,107,98,.22)',
    device: skull,
    names: ['Vermillion Oath', 'Ash & Ember']
  },
  azure: {
    key: 'azure',
    label: 'Azure',
    gold:  C(0xc8b06a),
    trim:  C(0x17395e),
    sail:  C(0x123a63),
    flagA: C(0x1b5e96),
    flagB: C(0x08131f),
    ui: '#5fb8ff',
    uiDim: 'rgba(95,184,255,.22)',
    device: anchor,
    names: ['Cold Meridian', 'Salt Lantern']
  }
};
