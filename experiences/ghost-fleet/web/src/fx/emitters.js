import * as THREE from 'three';
import { KIND } from './DynamicSplats.js';

const _v = new THREE.Vector3();

function rnd(a, b) { return a + Math.random() * (b - a); }
function unitDir(out) {
  const z = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return out.set(r * Math.cos(a), z, r * Math.sin(a));
}

/** The white powder cloud that vomits out of a gun port. */
export function muzzleBlast(fx, origin, dir, scale = 1) {
  for (let i = 0; i < Math.round(34 * scale); i++) {
    const s = Math.pow(Math.random(), 0.55);
    unitDir(_v);
    const speed = rnd(3, 17) * (1 - s * 0.55);
    fx.spawn({
      kind: KIND.SMOKE,
      x: origin.x + dir.x * s * 2.4 + _v.x * 0.5,
      y: origin.y + dir.y * s * 2.4 + _v.y * 0.5,
      z: origin.z + dir.z * s * 2.4 + _v.z * 0.5,
      vx: dir.x * speed + _v.x * rnd(1, 5),
      vy: dir.y * speed + _v.y * rnd(1, 4) + 1.5,
      vz: dir.z * speed + _v.z * rnd(1, 5),
      sx: rnd(0.30, 0.80) * scale, sy: rnd(0.30, 0.80) * scale, sz: rnd(0.30, 0.80) * scale,
      grow: rnd(0.6, 1.4) * scale,
      r: 0.70, g: 0.68, b: 0.66,
      alpha: rnd(0.09, 0.18),
      life: rnd(1.5, 3.4)
    });
  }
  for (let i = 0; i < Math.round(22 * scale); i++) {
    unitDir(_v);
    fx.spawn({
      kind: KIND.FIRE,
      x: origin.x + dir.x * 0.6, y: origin.y + dir.y * 0.6, z: origin.z + dir.z * 0.6,
      vx: dir.x * rnd(10, 26) + _v.x * 3,
      vy: dir.y * rnd(10, 26) + _v.y * 3,
      vz: dir.z * rnd(10, 26) + _v.z * 3,
      sx: rnd(0.18, 0.48), grow: 1.4,
      r: 1.0, g: rnd(0.58, 0.82), b: rnd(0.20, 0.38),
      emissive: rnd(0.45, 0.9),
      alpha: rnd(0.34, 0.52), life: rnd(0.16, 0.40)
    });
  }
}

/** Impact detonation: fireball, soot, embers. Debris comes from the hull itself. */
export function explosion(fx, p, power = 1, tint = null) {
  const base = tint || new THREE.Color(1.0, 0.55, 0.18);

  for (let i = 0; i < Math.round(40 * power); i++) {
    unitDir(_v);
    const s = Math.pow(Math.random(), 0.4);
    fx.spawn({
      kind: KIND.FIRE,
      x: p.x + _v.x * s * 1.2, y: p.y + _v.y * s * 1.2, z: p.z + _v.z * s * 1.2,
      vx: _v.x * rnd(4, 17) * power, vy: _v.y * rnd(4, 15) * power + 4, vz: _v.z * rnd(4, 17) * power,
      sx: rnd(0.24, 0.72) * power, grow: rnd(0.8, 1.8),
      r: base.r, g: base.g * rnd(0.55, 1.05), b: base.b * rnd(0.35, 1.1),
      emissive: rnd(0.55, 1.15),
      alpha: rnd(0.26, 0.42), life: rnd(0.26, 0.66)
    });
  }
  for (let i = 0; i < Math.round(38 * power); i++) {
    unitDir(_v);
    const s = Math.pow(Math.random(), 0.5);
    fx.spawn({
      kind: KIND.SMOKE,
      x: p.x + _v.x * s * 2.0, y: p.y + _v.y * s * 2.0, z: p.z + _v.z * s * 2.0,
      vx: _v.x * rnd(2, 15) * power, vy: _v.y * rnd(2, 12) + 3, vz: _v.z * rnd(2, 15) * power,
      sx: rnd(0.45, 1.2) * power, grow: rnd(0.6, 1.5),
      r: 0.19, g: 0.17, b: 0.165,
      alpha: rnd(0.10, 0.22), life: rnd(2.2, 5.0)
    });
  }
  for (let i = 0; i < Math.round(46 * power); i++) {
    unitDir(_v);
    fx.spawn({
      kind: KIND.EMBER,
      x: p.x, y: p.y, z: p.z,
      vx: _v.x * rnd(8, 40), vy: Math.abs(_v.y) * rnd(10, 38) + 6, vz: _v.z * rnd(8, 40),
      sx: rnd(0.035, 0.085),
      r: 1.0, g: rnd(0.50, 0.78), b: rnd(0.08, 0.24),
      emissive: rnd(0.6, 1.3),
      alpha: 1, life: rnd(0.8, 2.6)
    });
  }
}

/** Cannonball hitting the sea: a column of spray and a ring. */
export function waterSplash(fx, p, power = 1) {
  const n = Math.round(90 * power);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.pow(Math.random(), 0.6);
    const up = rnd(9, 26) * power * (1 - r * 0.5);
    fx.spawn({
      kind: KIND.SPRAY,
      x: p.x + Math.cos(a) * r * 1.4, y: p.y + 0.2, z: p.z + Math.sin(a) * r * 1.4,
      vx: Math.cos(a) * rnd(2, 13) * r * power, vy: up, vz: Math.sin(a) * rnd(2, 13) * r * power,
      sx: rnd(0.10, 0.40) * power, grow: rnd(0.3, 1.1),
      r: 0.80, g: 0.88, b: 0.92,
      alpha: rnd(0.35, 0.8), life: rnd(0.7, 1.9)
    });
  }
  for (let i = 0; i < Math.round(26 * power); i++) {
    const a = Math.random() * Math.PI * 2;
    fx.spawn({
      kind: KIND.SMOKE,
      x: p.x + Math.cos(a) * rnd(0.5, 3), y: p.y + 0.4, z: p.z + Math.sin(a) * rnd(0.5, 3),
      vx: Math.cos(a) * rnd(1, 5), vy: rnd(0.4, 2.0), vz: Math.sin(a) * rnd(1, 5),
      sx: rnd(0.4, 1.1), grow: 1.3,
      r: 0.82, g: 0.88, b: 0.90,
      alpha: rnd(0.10, 0.26), life: rnd(1.0, 2.4)
    });
  }
}

/** Continuous fire licking out of a hull breach. */
export function burn(fx, p, size, dt, rate = 34) {
  const n = Math.random() < (rate * size * dt) % 1 ? Math.floor(rate * size * dt) + 1 : Math.floor(rate * size * dt);
  for (let i = 0; i < n; i++) {
    unitDir(_v);
    fx.spawn({
      kind: KIND.FIRE,
      x: p.x + _v.x * size * 0.7, y: p.y + Math.abs(_v.y) * size * 0.4, z: p.z + _v.z * size * 0.7,
      vx: _v.x * 1.6, vy: rnd(2.5, 6.5), vz: _v.z * 1.6,
      sx: rnd(0.16, 0.40) * size, grow: rnd(0.7, 1.5),
      r: 1.0, g: rnd(0.42, 0.72), b: rnd(0.08, 0.22),
      emissive: rnd(0.5, 1.0),
      alpha: rnd(0.26, 0.44), life: rnd(0.4, 1.0)
    });
  }
  if (Math.random() < 14 * size * dt) {
    unitDir(_v);
    fx.spawn({
      kind: KIND.SMOKE,
      x: p.x, y: p.y + 0.6, z: p.z,
      vx: _v.x * 1.2 + 1.0, vy: rnd(2, 5), vz: _v.z * 1.2,
      sx: rnd(0.4, 1.0) * size, grow: rnd(0.5, 1.2),
      r: 0.15, g: 0.135, b: 0.13,
      alpha: rnd(0.09, 0.18), life: rnd(3, 6)
    });
  }
}

/** Bow wake + hull spray, emitted continuously while under way. */
export function wake(fx, p, dir, speed, dt) {
  const n = Math.floor(speed * 5.5 * dt) + (Math.random() < (speed * 5.5 * dt) % 1 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const side = Math.random() < 0.5 ? 1 : -1;
    fx.spawn({
      kind: KIND.SPRAY,
      x: p.x + rnd(-1, 1), y: p.y + rnd(-0.2, 0.5), z: p.z + rnd(-1, 1),
      vx: dir.x * rnd(0, 2) + side * -dir.z * rnd(1.5, 4.5),
      vy: rnd(1.5, 5.5),
      vz: dir.z * rnd(0, 2) + side * dir.x * rnd(1.5, 4.5),
      sx: rnd(0.16, 0.5), grow: rnd(0.5, 1.4),
      r: 0.86, g: 0.92, b: 0.95,
      alpha: rnd(0.18, 0.46), life: rnd(0.8, 1.8)
    });
  }
}
