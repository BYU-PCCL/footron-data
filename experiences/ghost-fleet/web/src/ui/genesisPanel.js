/** Captions for the genesis sequence: one step visible at a time. */
export class GenesisPanel {
  constructor() {
    this.el = document.getElementById('genesis');
    this.steps = [...this.el.querySelectorAll('.gen-step')];
    this.skip = this.el.querySelector('.gen-skip');
  }

  show() {
    this.el.classList.add('on');
    document.body.classList.add('genesis-running');
  }

  step(i) {
    this.steps.forEach((s, k) => s.classList.toggle('on', k === i));
    // the last beat is the title card; nothing left to skip past
    if (this.skip) this.skip.style.opacity = i >= this.steps.length - 1 ? '0' : '';
  }

  hide() {
    this.el.classList.remove('on');
    this.steps.forEach(s => s.classList.remove('on'));
    document.body.classList.remove('genesis-running');
  }
}
