import * as THREE from 'three';

/**
 * "Genesis" — the opening explainer.
 *
 * One Gaussian, then many, then coloured, then assembled into a ship. It runs
 * on the real splat data: the cloud that scatters and reassembles is literally
 * the ship's own 58,000 Gaussians being interpolated from a scatter state to
 * their authored positions. Nothing is faked for the animation, which is the
 * whole point — by the time the battle starts the viewer has watched the
 * primitive, seen a hull built out of it, and knows what is coming apart when
 * a shot lands.
 *
 * Beats:
 *   0  one Gaussian, turning slowly so it reads as an ellipsoid not a disc
 *   1  it multiplies into a cloud of identical pale splats
 *   2  each takes its own colour
 *   3  they fly into formation and become the ship
 *   4  pull back, hand over to the battle
 */

const BEATS = [
  { key: 'one',      dur: 4.2 },
  { key: 'many',     dur: 3.6 },
  { key: 'colour',   dur: 3.0 },
  { key: 'assemble', dur: 5.4 },
  { key: 'reveal',   dur: 3.0 }
];

const TOTAL = BEATS.reduce((a, b) => a + b.dur, 0);

const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _e = new THREE.Euler();
const _c = new THREE.Color();
const _wc = new THREE.Vector3();

/** Height of the hero Gaussian above the cloud centre, in local units. */
const HERO_Y = 9.0;

/**
 * Size of the hero Gaussian. A splat is drawn out to 3 sigma, so its visible
 * extent is roughly 3x this — big enough to read as a shape, small enough that
 * the whole ellipsoid and its falloff stay inside the frame.
 */
const HERO_S = 0.92;

const ease = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeIn = (t) => t * t * t;

/** Deterministic hash so the scatter is identical every run. */
function hash(i) {
  let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export class Genesis {
  /**
   * @param ship the Ship whose splats are used, and which is left assembled
   * @param panel DOM controller for the captions
   */
  constructor(ship, panel) {
    this.ship = ship;
    this.panel = panel;
    this.t = 0;
    this.running = false;
    this.done = false;
    this.beat = -1;

    const n = ship.splatCount;
    this.n = n;

    // scatter state: a loose shell around the hull, plus a birth time so the
    // cloud grows outward from the first Gaussian rather than popping in
    this.sx = new Float32Array(n);
    this.sy = new Float32Array(n);
    this.sz = new Float32Array(n);
    this.birth = new Float32Array(n);
    this.spin = new Float32Array(n * 3);

    const d = ship.data;
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < n; i++) { cx += d.pos[i * 3]; cy += d.pos[i * 3 + 1]; cz += d.pos[i * 3 + 2]; }
    this.centre = new THREE.Vector3(cx / n, cy / n, cz / n);

    for (let i = 0; i < n; i++) {
      // even distribution on a shell, radius jittered so it reads as volume
      const u = hash(i * 3 + 1) * 2 - 1;
      const th = hash(i * 3 + 2) * Math.PI * 2;
      // a broad, slightly flattened swarm. It has to be wide enough that the
      // camera can get outside it and read it as one object — at the original
      // radius the lens ended up inside and the frame went white.
      const r = 26 + 20 * Math.pow(hash(i * 3 + 3), 0.55);
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      this.sx[i] = this.centre.x + r * s * Math.cos(th) * 1.35;
      this.sy[i] = this.centre.y + r * u * 0.60 + 6;
      this.sz[i] = this.centre.z + r * s * Math.sin(th) * 1.35;
      this.birth[i] = Math.pow(hash(i * 7 + 11), 0.75);
      this.spin[i * 3]     = (hash(i * 5 + 4) - 0.5) * 1.4;
      this.spin[i * 3 + 1] = (hash(i * 5 + 5) - 0.5) * 1.4;
      this.spin[i * 3 + 2] = (hash(i * 5 + 6) - 0.5) * 1.4;
    }

    // the hero Gaussian of beat 0: pick one from the hull so its colour is
    // honest timber rather than whatever happened to be at index zero
    this.hero = 0;
    for (let i = 0; i < n; i++) {
      if (d.part[i] === 0 && d.pos[i * 3 + 1] > 1.5) { this.hero = i; break; }
    }
  }

  get duration() { return TOTAL; }

  start() {
    this.t = 0;
    this.running = true;
    this.done = false;
    this.beat = -1;
    this.ship.mesh.setCount(1);
  }

  /** Jump to the finished state — a visitor touching the screen outranks this. */
  skip() {
    if (!this.running) return;
    this.t = TOTAL;
    this._apply(TOTAL);
    this._finish();
  }

  _finish() {
    const ship = this.ship;
    const d = ship.data;
    // restore the authored data exactly, so nothing carries interpolation error
    for (let i = 0; i < this.n; i++) {
      ship.mesh.set(i,
        d.pos[i * 3], d.pos[i * 3 + 1], d.pos[i * 3 + 2],
        d.scl[i * 3], d.scl[i * 3 + 1], d.scl[i * 3 + 2],
        d.rot[i * 4], d.rot[i * 4 + 1], d.rot[i * 4 + 2], d.rot[i * 4 + 3],
        d.col[i * 3], d.col[i * 3 + 1], d.col[i * 3 + 2],
        d.opa[i], d.emi[i]);
    }
    ship.mesh.setCount(this.n);
    ship.mesh.flush();
    this.running = false;
    this.done = true;
    this.panel?.hide();
  }

  update(dt) {
    if (!this.running) return;
    this.t += dt;
    if (this.t >= TOTAL) { this._finish(); return; }

    // which beat, and how far through it
    let acc = 0, idx = 0, local = 0;
    for (let i = 0; i < BEATS.length; i++) {
      if (this.t < acc + BEATS[i].dur) { idx = i; local = (this.t - acc) / BEATS[i].dur; break; }
      acc += BEATS[i].dur;
    }
    if (idx !== this.beat) { this.beat = idx; this.panel?.step(idx); }
    this.local = local;

    this._apply(this.t);
  }

  _apply(time) {
    const ship = this.ship;
    const mesh = ship.mesh;
    const d = ship.data;
    const n = this.n;

    // beat boundaries in absolute seconds
    const t0 = BEATS[0].dur;
    const t1 = t0 + BEATS[1].dur;
    const t2 = t1 + BEATS[2].dur;
    const t3 = t2 + BEATS[3].dur;

    // ---- beat 0: a single Gaussian, turning
    if (time < t0) {
      const u = time / t0;
      const h = this.hero;

      // a lazy tumble on two axes, so the anisotropy is unmistakable
      _e.set(time * 0.55, time * 0.8, Math.sin(time * 0.6) * 0.3, 'XYZ');
      _q.setFromEuler(_e);

      // grows in, then breathes very slightly so it never looks like a decal
      const grow = easeOut(Math.min(1, u * 3.2));
      const s = HERO_S * grow * (1 + 0.035 * Math.sin(time * 1.3));

      mesh.set(0,
        this.centre.x, this.centre.y + HERO_Y, this.centre.z,
        s * 1.55, s * 0.62, s * 0.30,          // deliberately anisotropic
        _q.x, _q.y, _q.z, _q.w,
        // warm timber, lifted well clear of the sky behind it — a single
        // splat at hull albedo simply disappears against a sunset
        0.92, 0.66, 0.40,
        Math.min(1, u * 4), 0.30);
      mesh.setCount(1);
      mesh.flush();
      return;
    }

    // from here on every splat is live; birth and opacity do the revealing
    mesh.setCount(n);

    // global progress through each phase
    const pMany = Math.min(1, Math.max(0, (time - t0) / BEATS[1].dur));
    const pCol  = Math.min(1, Math.max(0, (time - t1) / BEATS[2].dur));
    const pAsm  = Math.min(1, Math.max(0, (time - t2) / BEATS[3].dur));

    const heroS = HERO_S;
    const cloudBase = 0.42;

    for (let i = 0; i < n; i++) {
      const o3 = i * 3, o4 = i * 4;

      // --- born yet?
      const b = this.birth[i];
      const bornAt = b * 0.82;
      const age = (pMany - bornAt) / 0.18;
      const born = Math.min(1, Math.max(0, age));

      // --- position: from the hero's spot, out to the shell, then into place
      const ox = this.centre.x, oy = this.centre.y + HERO_Y, oz = this.centre.z;
      const fly = easeOut(born);
      let px = ox + (this.sx[i] - ox) * fly;
      let py = oy + (this.sy[i] - oy) * fly;
      let pz = oz + (this.sz[i] - oz) * fly;

      if (pAsm > 0) {
        // stagger it a little so the ship gathers rather than snapping, but
        // not so much that it is still a blob at the end of the beat
        const lag = b * 0.22;
        const a = ease(Math.min(1, Math.max(0, (pAsm - lag) / (1 - lag))));
        px += (d.pos[o3] - px) * a;
        py += (d.pos[o3 + 1] - py) * a;
        pz += (d.pos[o3 + 2] - pz) * a;
      }

      // --- scale: hero-sized at birth, shrinking to the real splat size
      const target = pAsm > 0
        ? ease(Math.min(1, Math.max(0, (pAsm - b * 0.22) / (1 - b * 0.22))))
        : 0;
      const cloud = cloudBase * (0.55 + 0.9 * hash(i * 13 + 2));
      const sBirth = heroS * 0.5 * (1 - easeOut(born)) + cloud * easeOut(born);
      const sx = sBirth + (d.scl[o3] - sBirth) * target;
      const sy = sBirth + (d.scl[o3 + 1] - sBirth) * target;
      const sz = sBirth * 0.55 + (d.scl[o3 + 2] - sBirth * 0.55) * target;

      // --- orientation: tumbling in the cloud, settling into the authored one
      _e.set(this.spin[o3] * time, this.spin[o3 + 1] * time, this.spin[o3 + 2] * time, 'XYZ');
      _q.setFromEuler(_e);
      _q2.set(d.rot[o4], d.rot[o4 + 1], d.rot[o4 + 2], d.rot[o4 + 3]);
      if (target > 0) _q.slerp(_q2, target);

      // --- colour: pale and uniform, then each takes its own
      const wave = Math.min(1, Math.max(0, (pCol - hash(i * 17 + 5) * 0.45) / 0.55));
      const w = ease(wave);
      const pale = 0.46;
      const r = pale + (d.col[o3] - pale) * w;
      const g = pale * 0.97 + (d.col[o3 + 1] - pale * 0.97) * w;
      const bl = pale * 0.90 + (d.col[o3 + 2] - pale * 0.90) * w;

      // the cloud is deliberately translucent: 58,000 opaque splats stacked
      // along the view ray composite to a flat white and read as fog
      const cloudA = 0.44;
      const alpha = born * (target > 0 ? (d.opa[i] - cloudA) * target + cloudA : cloudA);

      mesh.set(i, px, py, pz, sx, sy, sz, _q.x, _q.y, _q.z, _q.w,
        r, g, bl, alpha, d.emi[i] * target);
    }
    mesh.flush();
  }

  /** Where the camera should be, in world space, for the current moment. */
  camera(out, lookAt, time = this.t) {
    // the centre is authored in the ship's local space; she has a heading and
    // rides the swell, so it has to be taken into world space every frame
    const c = _wc.copy(this.centre).applyMatrix4(this.ship.mesh.matrixWorld);
    const t0 = BEATS[0].dur;
    const t1 = t0 + BEATS[1].dur;
    const t2 = t1 + BEATS[2].dur;
    const t3 = t2 + BEATS[3].dur;

    // `shift` biases the subject into the clear half of the frame, as a
    // fraction of the view distance. The swarm is far larger than the ship, so
    // it needs a gentler push or it runs off the right edge.
    let dist, height, drift, aim, shift;
    if (time < t0) {
      // Close on the single Gaussian, looking UP at it. The sky carries a warm
      // band all the way round the horizon, so a splat held at eye level
      // disappears into the glare whatever the bearing; against the upper sky
      // it reads immediately.
      const u = time / t0;
      dist = 11 - 2.0 * ease(u);
      height = -3.0;
      aim = HERO_Y; shift = 0.22;
      drift = time * 0.12;
    } else if (time < t1) {
      const u = (time - t0) / BEATS[1].dur;
      dist = 9 + 131 * easeOut(u);
      height = -3.0 + 26 * ease(u);
      aim = HERO_Y + (3.2 - HERO_Y) * ease(u); shift = 0.22 - 0.06 * ease(u);
      drift = t0 * 0.12 + (time - t0) * 0.10;
    } else if (time < t2) {
      const u = (time - t1) / BEATS[2].dur;
      dist = 140 - 6 * ease(u);
      height = 23; aim = 3.2; shift = 0.16;
      drift = t0 * 0.12 + (t1 - t0) * 0.10 + (time - t1) * 0.09;
    } else if (time < t3) {
      const u = (time - t2) / BEATS[3].dur;
      dist = 134 - 70 * ease(u);
      height = 23 - 12 * ease(u); aim = 3.2; shift = 0.16 + 0.14 * ease(u);
      drift = t0 * 0.12 + (t1 - t0) * 0.10 + (t2 - t1) * 0.09 + (time - t2) * 0.07;
    } else {
      const u = (time - t3) / BEATS[4].dur;
      dist = 64 + 18 * ease(u);
      height = 11 + 3 * ease(u); aim = 3.2; shift = 0.30;
      drift = t0 * 0.12 + (t1 - t0) * 0.10 + (t2 - t1) * 0.09 + (t3 - t2) * 0.07 + (time - t3) * 0.06;
    }

    // Stand with the sun behind us. The sunset is toward -x, so looking that
    // way puts the subject in silhouette against a blown-out sky; from here
    // the Gaussians are lit and the sky behind them is the deep blue half.
    const a = 2.95 + drift;
    out.set(c.x + Math.cos(a) * dist, c.y + height, c.z + Math.sin(a) * dist);

    // The captions own the left of the frame. Aiming left of the subject
    // swings the lens left, which carries the subject over into the clear
    // half — the same trick the impact showcase uses.
    lookAt.set(c.x, c.y + aim, c.z);
    const dx = out.x - c.x, dz = out.z - c.z;
    const inv = 1 / Math.max(1e-3, Math.hypot(dx, dz));
    // perpendicular to the view, scaled by distance so the framing holds
    const off = dist * shift;
    lookAt.x += -dz * inv * off;
    lookAt.z += dx * inv * off;
    return out;
  }
}
