import * as THREE from 'three';

/**
 * "Genesis" — the opening explainer.
 *
 * The argument, in order: here is a Gaussian in two dimensions; it can be
 * stretched and turned; it is not really flat, it is an ellipsoid in space; it
 * carries its own colour; one is useless but thousands overlap into a surface;
 * here are fifty-eight thousand; each takes its own colour; together they are
 * a ship. Then the battle starts, and the viewer already knows what is coming
 * apart when a shot lands.
 *
 * It runs on the real splat data. From the moment the cloud appears it is the
 * lead ship's own 58,640 Gaussians being interpolated from a scatter state to
 * their authored positions — nothing is substituted for the animation, which
 * is the entire point of showing it.
 *
 * Pacing: captions are 15-25 words and each beat is timed to be read at a
 * wall, not a desk — roughly four words a second with a beat of silence at
 * each end. Touching the screen skips the whole thing.
 */

const BEATS = [
  { key: 'flat',     dur: 6.0 },   // a 2D Gaussian, face-on and round
  { key: 'stretch',  dur: 6.0 },   // anisotropy: it becomes an ellipse
  { key: 'depth',    dur: 8.5 },   // turned edge-on, then given a third radius
  { key: 'colour1',  dur: 6.0 },   // it carries its own colour and opacity
  { key: 'many',     dur: 6.0 },   // one multiplies outward
  { key: 'count',    dur: 5.5 },   // the full pale swarm
  { key: 'colour2',  dur: 5.5 },   // each takes its own colour
  { key: 'assemble', dur: 7.5 },   // they fly into formation
  { key: 'reveal',   dur: 4.0 }    // pull back, hand over to the battle
];

const TOTAL = BEATS.reduce((a, b) => a + b.dur, 0);

// absolute start time of each beat
const START = [];
BEATS.reduce((acc, b, i) => { START[i] = acc; return acc + b.dur; }, 0);

const B_FLAT = 0, B_STRETCH = 1, B_DEPTH = 2, B_COLOUR1 = 3,
      B_MANY = 4, B_COUNT = 5, B_COLOUR2 = 6, B_ASSEMBLE = 7, B_REVEAL = 8;

/** Height of the hero Gaussian above the cloud centre, in local units. */
const HERO_Y = 9.0;

/**
 * Size of the hero. A splat is drawn out to 3 sigma, so its visible extent is
 * roughly 3x this — big enough to read as a shape, small enough that the whole
 * falloff stays inside the frame.
 */
const HERO_R = 0.92;          // the round 2D Gaussian's radius
const HERO_LONG = 1.62;       // long axis once stretched
const HERO_SHORT = 0.50;      // short axis once stretched
const HERO_THIN = 0.022;      // "flat": thin enough to vanish edge-on
const HERO_DEEP = 0.62;       // third radius once it becomes an ellipsoid

const _q = new THREE.Quaternion();
const _qRoll = new THREE.Quaternion();
const _e = new THREE.Euler();
const _m = new THREE.Matrix4();
const _n = new THREE.Vector3();
const _e1 = new THREE.Vector3();
const _e2 = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _alt = new THREE.Vector3(1, 0, 0);
const _wc = new THREE.Vector3();

/**
 * Colours the hero cycles through while the caption says the colour belongs to
 * the Gaussian. A single warm shift was far too subtle against a sunset sky —
 * the point only lands if the viewer watches the same blob become obviously
 * different colours. These are real values off the ship: canvas, gilding,
 * painted trim, tarred oak.
 */
const HERO_PALETTE = [
  [0.88, 0.86, 0.80],   // canvas — also the neutral the earlier beats use, so
                        // entering this beat does not pop to a new colour
  [0.97, 0.74, 0.26],   // gilding
  [0.92, 0.22, 0.24],   // painted trim
  [0.62, 0.44, 0.28]    // oak
];

/** What the Gaussian is while it is still only "a Gaussian". */
const HERO_NEUTRAL = HERO_PALETTE[0];
const _camLocal = new THREE.Vector3();
const _inv = new THREE.Matrix4();

const ease = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => t < 0 ? 0 : t > 1 ? 1 : t;
const lerp = (a, b, t) => a + (b - a) * t;

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

    this.sx = new Float32Array(n);
    this.sy = new Float32Array(n);
    this.sz = new Float32Array(n);
    this.birth = new Float32Array(n);
    this.spin = new Float32Array(n * 3);

    const d = ship.data;
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < n; i++) { cx += d.pos[i * 3]; cy += d.pos[i * 3 + 1]; cz += d.pos[i * 3 + 2]; }
    this.centre = new THREE.Vector3(cx / n, cy / n, cz / n);
    this.heroPos = this.centre.clone().setY(this.centre.y + HERO_Y);

    for (let i = 0; i < n; i++) {
      // a broad, slightly flattened swarm, wide enough that the camera can get
      // outside it and read it as one object
      const u = hash(i * 3 + 1) * 2 - 1;
      const th = hash(i * 3 + 2) * Math.PI * 2;
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

    this._camPos = new THREE.Vector3();
    this._camLook = new THREE.Vector3();
  }

  get duration() { return TOTAL; }

  start() {
    this.t = 0;
    this.running = true;
    this.done = false;
    this.beat = -1;
    this.ship.mesh.setCount(1);
    this._solveCamera(0);
  }

  /** Jump to the finished state — a visitor touching the screen outranks this. */
  skip() {
    if (!this.running) return;
    this.t = TOTAL;
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

    let idx = 0;
    for (let i = BEATS.length - 1; i >= 0; i--) {
      if (this.t >= START[i]) { idx = i; break; }
    }
    if (idx !== this.beat) { this.beat = idx; this.panel?.step(idx); }
    this.panel?.progress(this.t / TOTAL);

    // the camera has to be solved before the splats, because while the Gaussian
    // is still a flat 2D one it is turned to face the lens
    this._solveCamera(this.t);
    this._apply(this.t);
  }

  // ------------------------------------------------------------ the hero

  /**
   * Orientation that lays the Gaussian's face squarely toward the camera, so
   * what the viewer sees is a true 2D Gaussian rather than a foreshortened
   * slice of a 3D one. `roll` turns it within that plane.
   */
  _billboard(out, roll) {
    _inv.copy(this.ship.mesh.matrixWorld).invert();
    _camLocal.copy(this._camPos).applyMatrix4(_inv);

    _n.subVectors(_camLocal, this.heroPos);
    if (_n.lengthSq() < 1e-9) _n.set(0, 0, 1);
    _n.normalize();

    const ref = Math.abs(_n.dot(_up)) > 0.94 ? _alt : _up;
    _e1.crossVectors(ref, _n).normalize();
    _e2.crossVectors(_n, _e1).normalize();

    _m.makeBasis(_e1, _e2, _n);
    out.setFromRotationMatrix(_m);
    if (roll) {
      _qRoll.setFromAxisAngle(_n, roll);
      out.premultiply(_qRoll);
    }
    return out;
  }

  /**
   * The single Gaussian's state for the first four beats.
   *
   * The story runs 2D -> 3D, so it starts billboarded and round: a circular
   * splat facing the lens, which is exactly what a 2D Gaussian looks like.
   * Then it stretches into an ellipse, then it is turned edge-on — where being
   * flat becomes obvious, because it nearly disappears — and only then is it
   * given a third radius and allowed to tumble as a solid.
   */
  _hero(time, out) {
    const beat = time < START[B_STRETCH] ? B_FLAT
      : time < START[B_DEPTH] ? B_STRETCH
      : time < START[B_COLOUR1] ? B_DEPTH : B_COLOUR1;

    // `palette` is an index into HERO_PALETTE once the colour beat starts,
    // and -1 before it — 0 is a real palette entry, so it cannot mean "none"
    let rx, ry, rz, roll = 0, tumble = 0, palette = -1, alpha = 1;

    if (beat === B_FLAT) {
      const u = clamp01(time / BEATS[B_FLAT].dur);
      const grow = easeOut(clamp01(u * 3.4));
      rx = ry = HERO_R * grow;
      rz = HERO_THIN;
      alpha = clamp01(u * 4);
      // a barely-there breath, so it never looks like a pasted-on decal
      rx *= 1 + 0.03 * Math.sin(time * 1.2);
      ry *= 1 + 0.03 * Math.sin(time * 1.2);

    } else if (beat === B_STRETCH) {
      const u = clamp01((time - START[B_STRETCH]) / BEATS[B_STRETCH].dur);
      const s = ease(clamp01(u * 2.0));
      rx = lerp(HERO_R, HERO_LONG, s);
      ry = lerp(HERO_R, HERO_SHORT, s);
      rz = HERO_THIN;
      // once stretched, turn it in its own plane: the ellipse can lie any way
      roll = ease(clamp01((u - 0.45) / 0.55)) * Math.PI * 0.85;

    } else if (beat === B_DEPTH) {
      const u = clamp01((time - START[B_DEPTH]) / BEATS[B_DEPTH].dur);
      rx = HERO_LONG;
      ry = HERO_SHORT;
      roll = Math.PI * 0.85;
      // 0.00-0.42  swing to edge-on; being flat becomes undeniable
      // 0.42-0.78  grow the third radius: now it is an ellipsoid
      // 0.78-1.00  let it tumble as a solid
      tumble = ease(clamp01(u / 0.42)) * Math.PI * 0.52;
      const depth = ease(clamp01((u - 0.42) / 0.36));
      rz = lerp(HERO_THIN, HERO_DEEP, depth);
      tumble += ease(clamp01((u - 0.78) / 0.22)) * 1.1;

    } else {
      const u = clamp01((time - START[B_COLOUR1]) / BEATS[B_COLOUR1].dur);
      rx = HERO_LONG; ry = HERO_SHORT; rz = HERO_DEEP;
      roll = Math.PI * 0.85;
      tumble = Math.PI * 0.52 + 1.1 + (time - START[B_COLOUR1]) * 0.42;
      // step through the palette, holding each long enough to register
      palette = u * (HERO_PALETTE.length - 1);
      // and let the opacity dip once, so that reads as its own property too
      // a dip, not a disappearance: these splats composite over a bright sky
      // and a deep dip simply reads as the thing being gone
      alpha = 1 - 0.30 * Math.sin(clamp01((u - 0.45) / 0.55) * Math.PI);
    }

    this._billboard(_q, roll);
    if (tumble) {
      // turn about the ellipse's own long axis, which is the local x after the
      // billboard basis — that is the axis that swings it edge-on
      _qRoll.setFromAxisAngle(_e1.set(1, 0, 0).applyQuaternion(_q).normalize(), tumble);
      _q.premultiply(_qRoll);
    }

    out.rx = rx; out.ry = ry; out.rz = rz;
    out.q = _q; out.palette = palette; out.alpha = alpha;
    return out;
  }

  // ------------------------------------------------------------- render

  _apply(time) {
    const ship = this.ship;
    const mesh = ship.mesh;
    const d = ship.data;
    const n = this.n;

    // ---- beats 0-3: a single Gaussian
    if (time < START[B_MANY]) {
      const h = this._hero(time, this._heroOut || (this._heroOut = {}));

      // Neutral while it is still just "a Gaussian"; once the caption says the
      // colour belongs to it, walk the palette so the viewer sees it change.
      let r = HERO_NEUTRAL[0], g = HERO_NEUTRAL[1], b = HERO_NEUTRAL[2];
      if (h.palette >= 0) {
        const f = Math.min(h.palette, HERO_PALETTE.length - 1);
        const i0 = Math.floor(f);
        const i1 = Math.min(i0 + 1, HERO_PALETTE.length - 1);
        // hold each colour, then move briskly: a constant crossfade reads as
        // one muddy gradient rather than as four distinct colours
        const k = ease(clamp01(((f - i0) - 0.35) / 0.45));
        const A = HERO_PALETTE[i0], B = HERO_PALETTE[i1];
        r = lerp(A[0], B[0], k); g = lerp(A[1], B[1], k); b = lerp(A[2], B[2], k);
      }

      mesh.set(0,
        this.heroPos.x, this.heroPos.y, this.heroPos.z,
        h.rx, h.ry, h.rz,
        h.q.x, h.q.y, h.q.z, h.q.w,
        r, g, b, h.alpha, 0.26);
      mesh.setCount(1);
      mesh.flush();
      return;
    }

    // ---- beats 4-8: the swarm
    mesh.setCount(n);

    const pMany = clamp01((time - START[B_MANY]) / (BEATS[B_MANY].dur + BEATS[B_COUNT].dur));
    const pCol  = clamp01((time - START[B_COLOUR2]) / BEATS[B_COLOUR2].dur);
    const pAsm  = clamp01((time - START[B_ASSEMBLE]) / BEATS[B_ASSEMBLE].dur);

    const cloudBase = 0.42;
    const ox = this.heroPos.x, oy = this.heroPos.y, oz = this.heroPos.z;

    for (let i = 0; i < n; i++) {
      const o3 = i * 3, o4 = i * 4;

      const b = this.birth[i];
      const born = clamp01((pMany - b * 0.82) / 0.18);

      const fly = easeOut(born);
      let px = ox + (this.sx[i] - ox) * fly;
      let py = oy + (this.sy[i] - oy) * fly;
      let pz = oz + (this.sz[i] - oz) * fly;

      const lag = b * 0.22;
      const settle = pAsm > 0 ? ease(clamp01((pAsm - lag) / (1 - lag))) : 0;
      if (settle > 0) {
        px += (d.pos[o3] - px) * settle;
        py += (d.pos[o3 + 1] - py) * settle;
        pz += (d.pos[o3 + 2] - pz) * settle;
      }

      const cloud = cloudBase * (0.55 + 0.9 * hash(i * 13 + 2));
      const sBirth = HERO_LONG * 0.5 * (1 - easeOut(born)) + cloud * easeOut(born);
      const sx = sBirth + (d.scl[o3] - sBirth) * settle;
      const sy = sBirth + (d.scl[o3 + 1] - sBirth) * settle;
      const sz = sBirth * 0.55 + (d.scl[o3 + 2] - sBirth * 0.55) * settle;

      _e.set(this.spin[o3] * time, this.spin[o3 + 1] * time, this.spin[o3 + 2] * time, 'XYZ');
      _q.setFromEuler(_e);
      if (settle > 0) {
        _qRoll.set(d.rot[o4], d.rot[o4 + 1], d.rot[o4 + 2], d.rot[o4 + 3]);
        _q.slerp(_qRoll, settle);
      }

      const wave = ease(clamp01((pCol - hash(i * 17 + 5) * 0.45) / 0.55));
      const pale = 0.46;
      const r = pale + (d.col[o3] - pale) * wave;
      const g = pale * 0.97 + (d.col[o3 + 1] - pale * 0.97) * wave;
      const bl = pale * 0.90 + (d.col[o3 + 2] - pale * 0.90) * wave;

      // 58,000 opaque splats stacked along the view ray composite to flat
      // white and read as fog, so the cloud is deliberately translucent
      const cloudA = 0.44;
      const alpha = born * (settle > 0 ? (d.opa[i] - cloudA) * settle + cloudA : cloudA);

      mesh.set(i, px, py, pz, sx, sy, sz, _q.x, _q.y, _q.z, _q.w,
        r, g, bl, alpha, d.emi[i] * settle);
    }
    mesh.flush();
  }

  // ------------------------------------------------------------- camera

  /**
   * Solve the camera for this moment into `_camPos` / `_camLook`.
   *
   * The sky carries a warm band all the way round the horizon, so a single
   * splat held at eye level disappears into the glare on every bearing. The
   * early beats therefore sit below the Gaussian and look up at it against the
   * zenith, where it reads immediately.
   */
  _solveCamera(time) {
    const c = _wc.copy(this.centre).applyMatrix4(this.ship.mesh.matrixWorld);
    const heroLift = HERO_Y;

    let dist, height, aim, shift, drift;

    const at = (i) => clamp01((time - START[i]) / BEATS[i].dur);

    if (time < START[B_STRETCH]) {
      dist = 11.5 - 0.8 * ease(at(B_FLAT));
      height = -3.2; aim = heroLift; shift = 0.22; drift = time * 0.045;

    } else if (time < START[B_DEPTH]) {
      dist = 10.7; height = -3.2; aim = heroLift; shift = 0.22;
      drift = START[B_STRETCH] * 0.045 + (time - START[B_STRETCH]) * 0.05;

    } else if (time < START[B_COLOUR1]) {
      // ease round a little as it turns, so the edge-on moment is seen from an
      // angle where "flat" is unmistakable rather than ambiguous
      const u = at(B_DEPTH);
      dist = 10.7 + 1.3 * ease(u);
      height = -3.2 - 0.2 * ease(u); aim = heroLift; shift = 0.22;
      drift = START[B_STRETCH] * 0.045 + BEATS[B_STRETCH].dur * 0.05
            + (time - START[B_DEPTH]) * 0.085;

    } else if (time < START[B_MANY]) {
      // hold the steep look-up: at a shallower angle the Gaussian sits against
      // the sky's warm horizon band and a dark palette colour vanishes into it
      dist = 12.0; height = -3.4; aim = heroLift; shift = 0.22;
      drift = START[B_STRETCH] * 0.045 + BEATS[B_STRETCH].dur * 0.05
            + BEATS[B_DEPTH].dur * 0.085 + (time - START[B_COLOUR1]) * 0.06;

    } else {
      // from here the subject is the swarm, then the ship
      const base = START[B_STRETCH] * 0.045 + BEATS[B_STRETCH].dur * 0.05
                 + BEATS[B_DEPTH].dur * 0.085 + BEATS[B_COLOUR1].dur * 0.06;

      if (time < START[B_COUNT]) {
        const u = at(B_MANY);
        dist = lerp(12.3, 140, easeOut(u));
        height = lerp(-1.8, 24, ease(u));
        aim = lerp(heroLift, 3.2, ease(u));
        shift = lerp(0.22, 0.16, ease(u));
        drift = base + (time - START[B_MANY]) * 0.05;

      } else if (time < START[B_COLOUR2]) {
        dist = 140 - 4 * ease(at(B_COUNT));
        height = 24; aim = 3.2; shift = 0.16;
        drift = base + BEATS[B_MANY].dur * 0.05 + (time - START[B_COUNT]) * 0.045;

      } else if (time < START[B_ASSEMBLE]) {
        dist = 136 - 4 * ease(at(B_COLOUR2));
        height = 24; aim = 3.2; shift = 0.16;
        drift = base + BEATS[B_MANY].dur * 0.05 + BEATS[B_COUNT].dur * 0.045
              + (time - START[B_COLOUR2]) * 0.045;

      } else if (time < START[B_REVEAL]) {
        const u = at(B_ASSEMBLE);
        dist = lerp(132, 64, ease(u));
        height = lerp(24, 11, ease(u)); aim = 3.2;
        shift = lerp(0.16, 0.30, ease(u));
        drift = base + BEATS[B_MANY].dur * 0.05 + BEATS[B_COUNT].dur * 0.045
              + BEATS[B_COLOUR2].dur * 0.045 + (time - START[B_ASSEMBLE]) * 0.04;

      } else {
        const u = at(B_REVEAL);
        dist = lerp(64, 82, ease(u));
        height = lerp(11, 14, ease(u)); aim = 3.2; shift = 0.30;
        drift = base + BEATS[B_MANY].dur * 0.05 + BEATS[B_COUNT].dur * 0.045
              + BEATS[B_COLOUR2].dur * 0.045 + BEATS[B_ASSEMBLE].dur * 0.04
              + (time - START[B_REVEAL]) * 0.035;
      }
    }

    // Stand with the sun behind us: the sunset is toward -x, so looking that
    // way puts the subject in silhouette against a blown-out sky.
    const a = 2.95 + drift;
    this._camPos.set(c.x + Math.cos(a) * dist, c.y + height, c.z + Math.sin(a) * dist);
    this._camLook.set(c.x, c.y + aim, c.z);

    // The captions own the left of the frame. Aiming left of the subject swings
    // the lens left, which carries the subject into the clear half.
    const dx = this._camPos.x - c.x, dz = this._camPos.z - c.z;
    const inv = 1 / Math.max(1e-3, Math.hypot(dx, dz));
    const off = dist * shift;
    this._camLook.x += -dz * inv * off;
    this._camLook.z += dx * inv * off;
  }

  /** Where the camera should be, in world space, for the current moment. */
  camera(out, lookAt) {
    out.copy(this._camPos);
    lookAt.copy(this._camLook);
    return out;
  }
}
