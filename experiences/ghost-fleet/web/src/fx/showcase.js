import * as THREE from 'three';
import { waveFrame } from '../geometry/ocean.js';

/**
 * "Anatomy of a hit" — the moment that makes the technique legible.
 *
 * When a shot goes properly home, the world ramps down to a near-stop, the
 * camera pushes in close enough to resolve individual Gaussians, and a panel
 * explains what the viewer is looking at. Then everything ramps back up and
 * the battle carries on.
 *
 * The whole point of the piece is that the ships are splat clouds and that a
 * hit takes the actual Gaussians out of the hull. At normal speed and normal
 * range that reads as a satisfying explosion and nothing more. This is what
 * turns it into something you can see.
 */

const STATE = {
  IDLE: 'idle',         // waiting for a hit worth showing
  PUSH: 'push',         // ramping time down, camera moving in
  HOLD: 'hold',         // near-frozen, text running
  RELEASE: 'release',   // ramping back up, camera pulling out
  COOLDOWN: 'cooldown'  // not again just yet
};

// seconds
const PUSH_T = 1.05;
const RELEASE_T = 1.8;

/**
 * How long the world is held, and how far down the clock is ramped.
 *
 * Both scale with how much there actually is to look at. A shot that tears a
 * thousand Gaussians out of a hull throws a cloud worth studying and earns the
 * long, slow hold; one that clips a rail does not, and holding it just as long
 * makes the piece feel like it is waiting for the viewer rather than the other
 * way round.
 */
const HOLD_MIN = 9.0, HOLD_MAX = 15.5;
const SLOW_MIN = 0.030, SLOW_MAX = 0.060;   // smaller is slower

/** Removed-splat counts that map to the bottom and top of those ranges. */
const RICH_LO = 420, RICH_HI = 1400;

/**
 * Total bearing the camera sweeps during a hold, in radians — spread over
 * whatever the hold's duration turns out to be. Tuned when the hold was fixed
 * at seven seconds; keeping the sweep rather than the rate is what stops a
 * fifteen-second hold ending up behind the rigging.
 */
const ORBIT_SWEEP = 0.60;

/**
 * How far the lens sits from the fragments, in world units.
 *
 * Fixed, and the same value the bearing scan uses — that identity is the whole
 * point. It was previously derived from the cloud's own spread, which meant the
 * scan validated a bearing at one distance and the hold then sat at another:
 * fine while nothing on the rig wrote depth, and a sail straight across the
 * lens once the sails did. Close enough to resolve one Gaussian, far enough
 * that the fireball does not fill the frame.
 */
const SHOT_DIST = 15.0;

const _v = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _centroid = new THREE.Vector3();
const _inv = new THREE.Matrix4();
const _leash = new THREE.Vector3();

const ease = (t) => t * t * (3 - 2 * t);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export class ImpactShowcase {
  /**
   * @param world the World to watch
   * @param panel the DOM controller for the explanatory copy
   */
  constructor(world, panel) {
    this.world = world;
    this.panel = panel;
    this.state = STATE.IDLE;
    this.t = 0;
    this.enabled = true;

    // The first hit of a battle always earns one; after that they are spaced
    // out so the attract loop does not turn into a slideshow.
    this.seenFirst = false;
    this.cooldown = 0;
    this.firstDelay = 0;

    this.hit = null;
    this.holdDur = HOLD_MIN;
    this.slowest = SLOW_MAX;
    // set by the main loop: the attract loop and the cinematic camera are
    // where this moment does the most work, so it runs more often there
    this.cinematic = false;
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.entryPos = new THREE.Vector3();
    this.entryLook = new THREE.Vector3();
    this.orbit = 0;

    world.onHit = (info) => this.offer(info);
  }

  get active() { return this.state !== STATE.IDLE && this.state !== STATE.COOLDOWN; }

  /** How hard to thin the smoke and fire so the debris reads. */
  get reveal() {
    if (this.state === STATE.PUSH) return ease(Math.min(1, this.t / PUSH_T));
    if (this.state === STATE.HOLD) return 1;
    if (this.state === STATE.RELEASE) return 1 - easeOutCubic(Math.min(1, this.t / RELEASE_T));
    return 0;
  }

  /** Time multiplier the main loop should apply to the simulation. */
  get timeScale() {
    if (this.state === STATE.PUSH) {
      return THREE.MathUtils.lerp(1, this.slowest, ease(Math.min(1, this.t / PUSH_T)));
    }
    if (this.state === STATE.HOLD) return this.slowest;
    if (this.state === STATE.RELEASE) {
      // come back up gently, then snap the last bit so the battle feels live again
      return THREE.MathUtils.lerp(this.slowest, 1, easeOutCubic(Math.min(1, this.t / RELEASE_T)));
    }
    return 1;
  }

  /** Reset between battles so every new fleet gets its own opening showcase. */
  rearm(delay = 14) {
    this.seenFirst = false;
    this.cooldown = 0;
    this.firstDelay = delay;    // let the engagement actually start first
    if (this.active) this._end();
  }

  /** A hit just landed. Decide whether to stop the world for it. */
  offer(info) {
    if (!this.enabled || this.state !== STATE.IDLE) return;
    if (this.cooldown > 0 || this.firstDelay > 0) return;

    // Only a hit with something to show. A graze that clips a shroud removes a
    // handful of splats and looks like nothing when you freeze it — though the
    // bar is lower under the cinematic camera, which is already framing the
    // action and has nothing else competing for the moment.
    const bar = this.cinematic ? RICH_LO * 0.62 : RICH_LO;
    if (info.removed < bar) return;

    this._begin(info);
  }

  _begin(info) {
    this.hit = info;
    this.state = STATE.PUSH;
    this.t = 0;
    this.orbit = 0;
    this.seenFirst = true;
    this._aim = null;

    // how much this particular hit has to show
    const rich = THREE.MathUtils.clamp(
      (info.removed - RICH_LO) / (RICH_HI - RICH_LO), 0, 1);
    this.richness = rich;
    this.holdDur = THREE.MathUtils.lerp(HOLD_MIN, HOLD_MAX, rich);
    this.slowest = THREE.MathUtils.lerp(SLOW_MAX, SLOW_MIN, rich);

    this._frameShot(info);

    // Does the shot we just composed actually show anything? The bearing is
    // chosen to be clear of the rig, but a hit can throw its fragments
    // somewhere the clear bearing does not look — and stopping the world to
    // present an empty patch of sea is worse than not stopping it at all.
    if (!this._shotHasSubject()) {
      this.state = STATE.COOLDOWN;
      this.hit = null;
      this.cooldown = 6;          // try again on the next solid hit, soon
      return false;
    }

    this.panel?.show(info, this.holdDur);
    return true;
  }

  /** Count fragments that would actually be in frame from the composed camera. */
  _shotHasSubject() {
    const fx = this.world.fx;
    _fwd.subVectors(this.camLook, this.camPos).normalize();
    let seen = 0;
    for (let a = 0; a < fx.aliveCount; a++) {
      const i = fx.alive[a];
      if (fx.kind[i] !== 0) continue;          // debris only
      _v.set(fx.px[i] - this.camPos.x, fx.py[i] - this.camPos.y, fx.pz[i] - this.camPos.z);
      const d = _v.length();
      if (d < 1 || d > 48) continue;
      if (_v.dot(_fwd) / d < 0.80) continue;   // roughly the central cone
      if (++seen >= 120) return true;
    }
    return false;
  }

  /**
   * Work out where to put the lens. We want the breach side-on from outside
   * the hull, close enough that a single Gaussian is several pixels across
   * but far enough that the fireball does not fill the frame.
   *
   * Rather than pick an angle by hand, try a ring of candidates and keep the
   * one with the least ship between it and the hole. A galleon is mostly
   * rigging and canvas, and a lens placed on geometry alone ends up looking
   * through a course.
   */
  /**
   * Best bearing to view `focus` from, and how far either side of it stays
   * clear. Returns local-space offsets, not world positions.
   *
   * The arc matters as much as the bearing: the camera creeps round during the
   * hold, and with the hold now running up to fifteen seconds it will happily
   * orbit into the rigging if nothing stops it.
   */
  _solveBearing(ship, focus, dist, outSign) {
    let best = null;
    for (let i = 0; i < 18; i++) {
      const a = (-Math.PI / 2) + (i / 17) * Math.PI;
      const lx = Math.sin(a) * dist;
      const lz = outSign * Math.cos(a) * dist;
      let bestHere = null;
      for (const lift of [1.2, 3.4]) {
        const from = new THREE.Vector3(focus.x + lx, focus.y + lift, focus.z + lz);
        if (Math.abs(from.z) < 7.5) continue;
        if (Math.sign(from.z) !== outSign) continue;
        const occ = ship.occlusionBetween(from, focus, 22, 1.05);
        if (!bestHere || occ < bestHere.occ) bestHere = { occ, from, lift, a };
      }
      if (!bestHere) continue;
      const score = bestHere.occ * 4 + Math.abs(Math.sin(bestHere.a)) * 3;
      if (!best || score < best.score) best = { ...bestHere, score };
    }
    return best;
  }

  _frameShot(info) {
    const ship = info.ship;
    const local = info.local;

    const DIST = SHOT_DIST;
    // The blast throws splats radially outward far harder than it carries
    // them along the ball's path, so the debris forms a ball around the
    // impact rather than a fan out the far side. That means the entry side —
    // where the hull is between the lens and the rest of the ship — is the
    // clean place to stand.
    const outSign = Math.sign(local.z) || 1;

    // lift the focus slightly: the fragments rise as they spread
    const focus = local.clone();
    focus.y += 1.4;

    const best = this._solveBearing(ship, focus, DIST, outSign);

    const fromLocal = best
      ? best.from
      : new THREE.Vector3(focus.x, focus.y + 1.2, outSign * (Math.abs(focus.z) + DIST));
    this.occlusion = best ? best.occ : -1;
    this._lift = best ? best.lift : 1.2;
    this._focusLocal = focus;
    this._outSign = outSign;

    const m = ship.mesh.matrixWorld;
    this.camPos.copy(fromLocal).applyMatrix4(m);
    this.camLook.copy(focus).applyMatrix4(m);

    const dir = this.camPos.clone().sub(this.camLook);
    dir.y = 0;
    dir.normalize();
    this._dir = dir;
    this.entryPos.copy(this.camLook).addScaledVector(dir, 32).addScaledVector(_up, 8);
    this.entryLook.copy(this.camLook).addScaledVector(_up, 1.2);
  }

  update(dt, camera, time, swell) {
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.firstDelay > 0) this.firstDelay = Math.max(0, this.firstDelay - dt);

    if (this.state === STATE.COOLDOWN) { this.state = STATE.IDLE; return; }
    if (!this.active) return;

    this.t += dt;
    this.panel?.update(dt, this.state, this.world);

    if (this.state === STATE.PUSH && this.t >= PUSH_T) { this.state = STATE.HOLD; this.t = 0; }
    else if (this.state === STATE.HOLD && this.t >= this.holdDur) { this.state = STATE.RELEASE; this.t = 0; this.panel?.hide(); }
    else if (this.state === STATE.RELEASE && this.t >= RELEASE_T) { this._end(); return; }

    this._driveCamera(dt, camera, time, swell);
  }

  _driveCamera(dt, camera, time, swell) {
    const hit = this.hit;
    if (!hit) return;

    // the breach travels with the ship, so re-derive its world position each
    // frame rather than freezing a stale point in space
    const anchor = _v.copy(this._focusLocal || hit.local)
      .applyMatrix4(hit.ship.mesh.matrixWorld);

    // Follow the fragments and fit the shot to them. They are the subject, so
    // the frame should be theirs — aiming at a fixed point and guessing a
    // distance leaves them drifting out of shot as they spread and rise.
    const b = this.world.fx.debrisBounds(anchor, 30, _centroid);
    if (b.n > 24) {
      // Follow the centre of the fragments, gently and on a short leash.
      //
      // Unbounded, this walks: fragments settle downward and inboard, the aim
      // point follows them into the ship, and the lens — which keeps a fixed
      // distance from the aim — is dragged in behind the rig. The subject is
      // the fragments from THIS hit, which are near where it landed, so the
      // aim is not allowed far from there.
      this._aim = this._aim || anchor.clone();
      this._aim.lerp(_centroid, Math.min(1, dt * 0.9));
      _leash.subVectors(this._aim, hit.world);
      const MAX_DRIFT = 3.5;
      if (_leash.lengthSq() > MAX_DRIFT * MAX_DRIFT) {
        this._aim.copy(hit.world).addScaledVector(_leash.normalize(), MAX_DRIFT);
      }
      anchor.copy(this._aim);
      // `b.n` counts every fragment near the anchor, which includes flotsam
      // from earlier hits — it has read as more fragments than the hit removed
      // Gaussians, which is impossible. Quote what this hit actually threw.
      this.panel?.setFragments(Math.min(b.n, hit.fragments ?? b.n));
    }

    let pos, look, blend;
    if (this.state === STATE.PUSH) {
      const u = ease(Math.min(1, this.t / PUSH_T));
      pos = this.entryPos.clone().lerp(this.camPos, u);
      look = this.entryLook.clone().lerp(this.camLook, u);
      blend = u;
    } else if (this.state === STATE.HOLD) {
      // a slow creep round the breach while the fragments hang in the air
      this.orbit += dt * (ORBIT_SWEEP / Math.max(2, this.holdDur));
      const d = this._dir.clone().applyAxisAngle(_up, this.orbit);
      const dist = SHOT_DIST;
      pos = anchor.clone().addScaledVector(d, dist).addScaledVector(_up, this._lift);
      look = anchor.clone();
      blend = 1;
    } else {
      const u = easeOutCubic(Math.min(1, this.t / RELEASE_T));
      const d = this._dir.clone().applyAxisAngle(_up, this.orbit);
      const near = anchor.clone().addScaledVector(d, SHOT_DIST).addScaledVector(_up, this._lift);
      pos = near.lerp(this.entryPos, u);
      look = anchor.clone().lerp(this.entryLook, u);
      blend = 1 - u;
    }

    // never dip below the sea, same guard the director uses
    const h = waveFrame(pos.x, pos.z, time, swell, null);
    pos.y = Math.max(pos.y, h + 1.0);

    // The explanatory panel owns the left of the frame, so push the subject
    // over into the clear half instead of centring it behind the text. Aiming
    // left of the breach swings the lens left, which moves the breach right.
    const shift = this._panelShift(camera, pos, look) * blend;
    if (shift !== 0) {
      _fwd.subVectors(look, pos).normalize();
      _right.crossVectors(_fwd, _up).normalize();
      look.addScaledVector(_right, -shift);
    }

    camera.position.copy(pos);
    camera.lookAt(look);
    this.blend = blend;
  }

  /**
   * How far to slide the subject sideways, in world units at the subject's
   * distance, so it clears the panel. On a narrow screen the panel drops to
   * the bottom of the layout, so nothing needs shifting.
   */
  _panelShift(camera, pos, look) {
    if (window.innerWidth <= 860) return 0;
    // put the subject around 68% across rather than 50%
    const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const halfW = halfH * camera.aspect;
    return pos.distanceTo(look) * halfW * 0.36;
  }

  _end() {
    this.state = STATE.COOLDOWN;
    this.t = 0;
    this.hit = null;
    this.blend = 0;
    // Space them out. Under the cinematic camera this moment IS the show — it
    // is what the attract loop is for — so it comes round far more often there
    // than it does over someone's shoulder while they are steering.
    this.cooldown = this.seenFirst ? (this.cinematic ? 26 : 70) : 18;
    this.panel?.hide();
  }

  /** Cut it short — a visitor touching the screen outranks the showcase. */
  dismiss() {
    if (this.active) { this.cooldown = 30; this._end(); }
  }
}
