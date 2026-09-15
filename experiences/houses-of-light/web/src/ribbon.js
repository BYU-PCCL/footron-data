/**
 * The chronology ribbon: every dedicated temple as a mark on one linear axis,
 * with the temple currently on screen lit and labelled.
 *
 * The scale is deliberately linear in years. A log or rank scale would spread
 * the marks out evenly and read more "designed", but the crowding is the
 * content here — from Kirtland in 1836 there are four dedications in the first
 * century and then the marks pile into a wall from about 1980 onward. Anyone
 * watching for two minutes sees that shape without being told it.
 */

const PAD_L = 0.044;   // matches the caption's left margin, in fractions of width
const PAD_R = 0.30;    // keep clear of the corner globe

export class Ribbon {
  constructor(canvas, temples) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.marks = temples
      .filter((t) => t.year)
      .map((t) => ({ id: t.id, year: t.year, name: t.name }))
      .sort((a, b) => a.year - b.year);

    this.min = this.marks.length ? this.marks[0].year : 1836;
    this.max = Math.max(new Date().getFullYear(), this.marks.at(-1)?.year ?? 2026);

    this.target = null;   // the mark we are sliding toward
    this.pos = null;      // current animated year position
    this.alpha = 0;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, Math.round(r.width));
    this.h = Math.max(1, Math.round(r.height));
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  x(year) {
    const a = this.w * PAD_L, b = this.w * (1 - PAD_R);
    return a + ((year - this.min) / (this.max - this.min)) * (b - a);
  }

  /** Light the mark for this temple and slide the label to it. */
  focus(temple) {
    if (!temple || !temple.year) { this.target = null; return; }
    this.target = { year: temple.year, name: temple.name, id: temple.id };
    if (this.pos === null) this.pos = temple.year;
  }

  draw(now) {
    const ctx = this.ctx, w = this.w, h = this.h;
    ctx.clearRect(0, 0, w, h);
    if (!this.marks.length) return;

    this.alpha += ((this.target ? 1 : 0.35) - this.alpha) * 0.05;

    const baseY = h * 0.58;

    // Axis.
    ctx.strokeStyle = "rgba(255,250,244,0.13)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x(this.min), baseY);
    ctx.lineTo(this.x(this.max), baseY);
    ctx.stroke();

    // Decade ticks. Every twenty years keeps the axis readable from a distance
    // without turning it into a comb.
    ctx.font = "500 9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    for (let y = 1840; y <= this.max; y += 20) {
      const x = this.x(y);
      ctx.strokeStyle = "rgba(255,250,244,0.13)";
      ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY + h * 0.11); ctx.stroke();
      ctx.fillStyle = "rgba(255,250,244,0.22)";
      ctx.fillText(String(y), x, baseY + h * 0.36);
    }

    // One mark per temple. Overlapping marks in the crowded years reinforce
    // each other because they are drawn with alpha, which is exactly the
    // density read we want.
    const active = this.target?.id;
    for (const m of this.marks) {
      const x = this.x(m.year);
      const on = m.id === active;
      ctx.strokeStyle = on ? "rgba(236,208,168,0.95)" : "rgba(255,250,244,0.30)";
      ctx.lineWidth = on ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, baseY - h * (on ? 0.46 : 0.20));
      ctx.stroke();
    }

    // The travelling marker. It eases toward the target rather than jumping, so
    // moving from a 2020s temple back to a 19th-century one is legible as a
    // move through time instead of a cut.
    if (this.target) {
      this.pos += (this.target.year - this.pos) * 0.09;
      const x = this.x(this.pos);

      const g = ctx.createLinearGradient(x, baseY - h * 0.5, x, baseY);
      g.addColorStop(0, "rgba(236,208,168,0)");
      g.addColorStop(1, "rgba(236,208,168,0.75)");
      ctx.strokeStyle = g; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, baseY - h * 0.5); ctx.lineTo(x, baseY); ctx.stroke();

      ctx.beginPath(); ctx.arc(x, baseY, 2.6, 0, 7);
      ctx.fillStyle = "rgba(246,222,186,0.95)";
      ctx.shadowColor = "rgba(236,208,168,0.9)"; ctx.shadowBlur = 10;
      ctx.fill(); ctx.shadowBlur = 0;

      ctx.font = "500 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = `rgba(246,222,186,${0.85 * this.alpha})`;
      ctx.textAlign = "center";
      ctx.fillText(String(this.target.year), x, baseY - h * 0.56);
    }
  }
}
