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
const PUSH_T = 0.85;
const HOLD_T = 7.2;
const RELEASE_T = 1.6;

const SLOWEST = 0.045;          // time scale at the bottom of the ramp

const _v = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _centroid = new THREE.Vector3();

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
      return THREE.MathUtils.lerp(1, SLOWEST, ease(Math.min(1, this.t / PUSH_T)));
    }
    if (this.state === STATE.HOLD) return SLOWEST;
    if (this.state === STATE.RELEASE) {
      // come back up gently, then snap the last bit so the battle feels live again
      return THREE.MathUtils.lerp(SLOWEST, 1, easeOutCubic(Math.min(1, this.t / RELEASE_T)));
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

    // Only a solid hit on structure is worth it. A graze that clips a shroud
    // removes a handful of splats and looks like nothing when you freeze it.
    const solid = info.removed > 420;
    if (!solid) return;

    this._begin(info);
  }

  _begin(info) {
    this.hit = info;
    this.state = STATE.PUSH;
    this.t = 0;
    this.orbit = 0;
    this.seenFirst = true;
    this._aim = null;
    this._fit = undefined;
    this._frameShot(info);
    this.panel?.show(info);
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
  _frameShot(info) {
    const ship = info.ship;
    const DIST = 14.5;

    const local = info.local;
    // The blast throws splats radially outward far harder than it carries
    // them along the ball's path, so the debris forms a ball around the
    // impact rather than a fan out the far side. That means the entry side —
    // where the hull is between the lens and the rest of the ship — is the
    // clean place to stand.
    const outSign = Math.sign(local.z) || 1;

    // lift the focus slightly: the fragments rise as they spread
    const focus = local.clone();
    focus.y += 1.4;

    let best = null;
    for (let i = 0; i < 18; i++) {
      // sweep the half-circle on the side the debris is heading toward
      const a = (-Math.PI / 2) + (i / 17) * Math.PI;
      const lx = Math.sin(a) * DIST;
      const lz = outSign * Math.cos(a) * DIST;
      for (const lift of [1.2, 3.4]) {
        const from = new THREE.Vector3(focus.x + lx, focus.y + lift, focus.z + lz);
        // must be outboard of the hull, on the same side as the breach
        if (Math.abs(from.z) < 7.5) continue;
        if (Math.sign(from.z) !== outSign) continue;
        // once a candidate is worse than the best so far it cannot win, so
        // let the scan bail out of it early
        const budget = best ? Math.ceil(best.score / 4) + 1 : Infinity;
        const occ = ship.occlusionBetween(from, focus, 22, 1.05, budget);
        // near the beam reads best, all else being equal
        const score = occ * 4 + Math.abs(Math.sin(a)) * 3;
        if (!best || score < best.score) best = { score, from, occ, lift };
      }
    }

    const fromLocal = best
      ? best.from
      : new THREE.Vector3(focus.x, focus.y + 1.2, outSign * (Math.abs(focus.z) + DIST));
    this.occlusion = best ? best.occ : -1;
    this._lift = best ? best.lift : 1.2;
    this._focusLocal = focus;

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
    else if (this.state === STATE.HOLD && this.t >= HOLD_T) { this.state = STATE.RELEASE; this.t = 0; this.panel?.hide(); }
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
      this._aim = this._aim || anchor.clone();
      this._aim.lerp(_centroid, Math.min(1, dt * 2.2));
      anchor.copy(this._aim);
      // Frame the dense core of the cloud, not its last outlier. The point is
      // to resolve a single Gaussian, and backing off far enough to fit every
      // fragment defeats that.
      this.panel?.setFragments(b.n);
      const want = THREE.MathUtils.clamp(b.spread * 1.35 + 5.0, 11, 19);
      this._fit = this._fit === undefined ? want
        : this._fit + (want - this._fit) * Math.min(1, dt * 1.4);
    }

    let pos, look, blend;
    if (this.state === STATE.PUSH) {
      const u = ease(Math.min(1, this.t / PUSH_T));
      pos = this.entryPos.clone().lerp(this.camPos, u);
      look = this.entryLook.clone().lerp(this.camLook, u);
      blend = u;
    } else if (this.state === STATE.HOLD) {
      // a slow creep round the breach while the fragments hang in the air
      this.orbit += dt * 0.055;
      const d = this._dir.clone().applyAxisAngle(_up, this.orbit);
      const dist = this._fit ?? 14.5;
      pos = anchor.clone().addScaledVector(d, dist).addScaledVector(_up, this._lift);
      look = anchor.clone();
      blend = 1;
    } else {
      const u = easeOutCubic(Math.min(1, this.t / RELEASE_T));
      const d = this._dir.clone().applyAxisAngle(_up, this.orbit);
      const near = anchor.clone().addScaledVector(d, this._fit ?? 14.5).addScaledVector(_up, this._lift);
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
    // space them out: often enough to catch, rare enough not to nag
    this.cooldown = this.seenFirst ? 75 : 20;
    this.panel?.hide();
  }

  /** Cut it short — a visitor touching the screen outranks the showcase. */
  dismiss() {
    if (this.active) { this.cooldown = 30; this._end(); }
  }
}
