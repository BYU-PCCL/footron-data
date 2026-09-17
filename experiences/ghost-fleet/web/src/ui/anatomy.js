/**
 * DOM side of the impact showcase: reveals the explanatory beats in sequence
 * while the world is held near-frozen, and fills in the live numbers for the
 * hit actually being shown.
 */

/**
 * When each beat appears, as a fraction of however long the world is being
 * held. The hold is variable — a hit with more to show gets longer — so fixed
 * seconds would leave the last paragraph on screen for four seconds after one
 * hit and barely one after another.
 *
 * The last beat lands at 0.60, which leaves the whole final two-fifths of the
 * hold to read it in.
 */
const BEAT_AT = [0.04, 0.21, 0.40, 0.60];

export class AnatomyPanel {
  constructor() {
    this.el = document.getElementById('anatomy');
    this.beats = [...this.el.querySelectorAll('.an-beat')];
    this.figs = {
      hull: document.getElementById('anHull'),
      removed: document.getElementById('anRemoved'),
      flight: document.getElementById('anFlight')
    };
    this.t = 0;
    this.open = false;
  }

  show(info, holdDur = 9) {
    this.t = 0;
    this.open = true;
    this.hit = info;
    this.holdDur = holdDur;

    this.figs.hull.textContent = info.ship.splatCount.toLocaleString();
    this.figs.removed.textContent = info.removed.toLocaleString();
    this.figs.flight.textContent = '—';
    this.fragments = undefined;

    this.beats.forEach(b => b.classList.remove('on'));
    this.el.classList.remove('closing');
    this.el.classList.add('on');
    document.body.classList.add('showcase');
  }

  update(dt, state, world) {
    if (!this.open) return;
    this.t += dt;

    this.beats.forEach((b, i) => {
      if (this.t >= BEAT_AT[i] * this.holdDur) b.classList.add('on');
    });

    // Count only this hit's fragments. `fx.aliveCount` is every effect splat
    // in the scene — smoke, spray and other ships' debris included — which
    // would make the figure a good deal larger than the sentence claims.
    const figuresFrom = BEAT_AT[1] * this.holdDur;
    if (this.t > figuresFrom && this.t < figuresFrom + 2.8 && this.fragments !== undefined) {
      this.figs.flight.textContent = this.fragments.toLocaleString();
    }
  }

  /** Told by the showcase how many fragments this hit actually put in the air. */
  setFragments(n) { this.fragments = n; }

  hide() {
    if (!this.open) return;
    this.el.classList.add('closing');
    this.el.classList.remove('on');
    document.body.classList.remove('showcase');
    this.open = false;
  }
}
