import * as THREE from 'three';

/**
 * The wind, and what a square-rigged ship can do with it.
 *
 * This exists because constant-speed ships turning slow circles read as
 * models on a turntable. Once speed depends on the angle to the wind, every
 * manoeuvre costs or earns something: a ship that turns to bring her guns to
 * bear may have to give up her best point of sail to do it, one running down
 * on an enemy surges, one caught head to wind wallows. None of that needs
 * explaining to a viewer — it just stops looking mechanical.
 */

/**
 * Speed as a fraction of the ship's best, against the angle between where she
 * is pointing and where the wind is going, in degrees. 0 is straight into it.
 *
 * Square rig, so: hopeless close to the wind, best on a beam or broad reach,
 * and slower dead before it than across it, because the after sails steal the
 * wind from the forward ones.
 */
const POLAR = [
  [0, 0.06], [25, 0.10], [40, 0.50], [55, 0.78], [75, 0.94],
  [90, 1.00], [110, 0.99], [135, 0.92], [160, 0.80], [180, 0.72]
];

/** Inside this angle of the wind she cannot make way at all and must tack. */
export const NO_GO = 42 * Math.PI / 180;

export function polar(angleRad) {
  const d = Math.min(180, Math.abs(angleRad) * 180 / Math.PI);
  for (let i = 1; i < POLAR.length; i++) {
    if (d <= POLAR[i][0]) {
      const [a0, v0] = POLAR[i - 1], [a1, v1] = POLAR[i];
      return v0 + (v1 - v0) * (d - a0) / (a1 - a0);
    }
  }
  return POLAR[POLAR.length - 1][1];
}

export class Wind {
  constructor(seed = 1) {
    // the direction the wind blows TOWARD, as a bearing in world XZ
    this.dir = -0.7;
    this.strength = 1;
    this._t = seed * 11.3;
    this.vec = new THREE.Vector3(Math.cos(this.dir), 0, Math.sin(this.dir));
  }

  update(dt, swell) {
    this._t += dt;
    // A slow veer and a gentle gust cycle. Enough that the fleet's best point
    // of sail is not fixed for the whole battle, slow enough that nobody
    // watching sees the wind "change" — they just see the ships work at it.
    this.dir += Math.sin(this._t * 0.021) * 0.010 * dt;
    this.strength = (0.88 + 0.18 * Math.sin(this._t * 0.13) + 0.06 * Math.sin(this._t * 0.37))
      * (0.85 + 0.35 * swell);
    this.vec.set(Math.cos(this.dir), 0, Math.sin(this.dir));
  }

  /**
   * Angle between a heading and the wind's direction of travel: 0 means
   * pointing straight into it, PI means running before it.
   */
  angleOff(heading) {
    const d = Math.cos(heading) * this.vec.x + Math.sin(heading) * this.vec.z;
    return Math.acos(Math.max(-1, Math.min(1, -d)));
  }

  /** +1 if the wind is coming over the starboard side, -1 for port. */
  side(heading) {
    const cross = Math.cos(heading) * this.vec.z - Math.sin(heading) * this.vec.x;
    return cross >= 0 ? 1 : -1;
  }

  /**
   * The nearest heading a ship can actually sail toward `want`.
   *
   * Asking for a course inside the no-go zone is asking to stop, so this
   * returns the closer of the two close-hauled headings instead — which is
   * what produces visible beating to windward rather than a ship sitting head
   * to wind with her sails shivering.
   */
  sailable(want) {
    const off = this.angleOff(want);
    if (off >= NO_GO) return want;
    const into = this.dir + Math.PI;            // heading straight into the wind
    let rel = want - into;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;
    return into + (rel >= 0 ? NO_GO : -NO_GO);
  }
}
