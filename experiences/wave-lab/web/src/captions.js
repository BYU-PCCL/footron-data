// Pop-up captions: the exhibit label, one sentence at a time.
//
// A paragraph on a card is read by the one person standing closest and skipped
// by everyone else. Short lines that fade in, hold long enough to read, and give
// way to the next are read from across a room — and they can follow the scene
// as it develops, saying what to look at NOW rather than everything up front.
// Same idea as the Chroma Fluids wall.
//
// Driven from the render loop (update(dt), in real seconds) rather than from
// timers, so it pauses with the page and cannot pile up callbacks when a tab is
// in the background.

const FADE_IN = 0.6;
const FADE_OUT = 0.5;
const GAP = 0.5;

// Long enough to read twice at a comfortable pace, never so long it stalls.
function holdFor(text) {
  return Math.max(4.5, Math.min(8.5, 2 + text.length * 0.05));
}

export class Captions {
  constructor(root) {
    this.root = root;
    this.box = root.querySelector('.caption');
    this.titleEl = root.querySelector('.caption-title');
    this.dotsEl = root.querySelector('.caption-dots');
    this.textEl = root.querySelector('.caption-text');
    this.seq = null;
    this.index = 0;
    this.phase = 'idle';
    this.t = 0;
    this.passes = 0;       // completed trips through the lines
    this.resumeTo = null;  // a looping sequence an interruption hands back to
  }

  get active() { return this.seq !== null; }

  // seq: { title, lines: [string | { text, hold }], loop, hot, resume }
  // A line with hold: Infinity waits for next(); `resume` means "when this one
  // is done, go back to whatever was playing".
  play(seq) {
    if (seq.resume && this.seq && this.seq.loop) this.resumeTo = this.seq;
    else if (!seq.resume) this.resumeTo = null;
    this.seq = seq;
    this.passes = 0;
    this.box.classList.toggle('hot', !!seq.hot);
    this.titleEl.textContent = seq.title || '';
    this.index = -1;
    // If a line is already up, fade it out first; otherwise straight in.
    if (this.phase === 'in' || this.phase === 'hold') { this.phase = 'out'; this.t = 0; this.hide(); }
    else this.advance();
  }

  stop() {
    this.seq = null;
    this.resumeTo = null;
    this.phase = 'idle';
    this.hide();
  }

  // Skip straight to line i (or the next one), e.g. when the thing a line is
  // about has just happened.
  next(i) {
    if (!this.seq) return;
    this.index = (i === undefined ? this.index + 1 : i) - 1;
    this.phase = 'out'; this.t = 0;
    this.hide();
  }

  hide() { this.box.classList.remove('show'); }

  advance() {
    const lines = this.seq.lines;
    this.index++;
    if (this.index >= lines.length) {
      this.passes++;
      if (this.seq.loop) this.index = 0;
      else {
        const back = this.resumeTo;
        this.seq = null; this.phase = 'idle';
        if (back) { this.resumeTo = null; this.play(back); }
        return;
      }
    }
    const line = lines[this.index];
    const text = typeof line === 'string' ? line : line.text;
    this.hold = typeof line === 'string' || line.hold === undefined ? holdFor(text) : line.hold;
    this.textEl.textContent = text;
    this.titleEl.textContent = this.seq.title || '';
    this.dotsEl.textContent = lines.length > 1
      ? lines.map((_, k) => (k === this.index ? '●' : '○')).join(' ')
      : '';
    this.phase = 'in'; this.t = 0;
    // Let the new text land before the fade starts, or it transitions in mid-swap.
    requestAnimationFrame(() => { if (this.phase === 'in') this.box.classList.add('show'); });
  }

  update(dt) {
    if (!this.seq && this.phase === 'idle') return;
    this.t += dt;
    switch (this.phase) {
      case 'in': if (this.t >= FADE_IN) { this.phase = 'hold'; this.t = 0; } break;
      case 'hold':
        if (this.t >= this.hold) { this.phase = 'out'; this.t = 0; this.hide(); }
        break;
      case 'out': if (this.t >= FADE_OUT) { this.phase = 'gap'; this.t = 0; } break;
      case 'gap':
        if (this.t >= GAP) { if (this.seq) this.advance(); else this.phase = 'idle'; }
        break;
    }
  }
}
