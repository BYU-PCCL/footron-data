/** Captions for the genesis sequence: one beat visible at a time. */
export class GenesisPanel {
  constructor() {
    this.el = document.getElementById('genesis');
    this.steps = [...this.el.querySelectorAll('.gen-step')];
    this.bar = document.getElementById('genProgress');
    this.skip = this.el.querySelector('.gen-skip');
  }

  show() {
    this.el.classList.add('on');
    document.body.classList.add('genesis-running');
    this.progress(0);
  }

  step(i) {
    this.steps.forEach((s, k) => s.classList.toggle('on', k === i));
    // the last beat is the title card; there is nothing left to skip past
    if (this.skip) this.skip.style.opacity = i >= this.steps.length - 1 ? '0' : '';
  }

  progress(p) {
    if (this.bar) this.bar.style.width = `${Math.max(0, Math.min(1, p)) * 100}%`;
  }

  hide() {
    this.el.classList.remove('on');
    this.steps.forEach(s => s.classList.remove('on'));
    document.body.classList.remove('genesis-running');
  }
}
