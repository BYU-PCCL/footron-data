// Live cross-section through the beach.
//
// The top-down view is beautiful but hides the mechanism. This draws the profile
// along one row — sea bed, still-water level, the actual water surface, and
// where the wave is breaking — which is where shoaling, the surf zone and run-up
// become legible: the wave visibly shortens and steepens as the bed rises, then
// breaks and runs up as a thin wedge.

import { NX, NY, SCALE } from './sim.js';

export class Section {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.row = Math.round(NY * 0.5);
    this.trace = new Float32Array(NX);     // smoothed envelope of crest height
    this.visible = false;
    this.dpr = 1;
  }

  resize(w, h, dpr) {
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.w = w; this.h = h;
  }

  setRow(j) {
    this.row = Math.max(0, Math.min(NY - 1, Math.round(j)));
  }

  draw(sim, theme) {
    if (!this.visible) return;
    const ctx = this.ctx;
    const { w, h, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const row = this.row * NX;
    // Show the interesting part: from just outside the wave generator to the dune.
    const i0 = Math.round(30 * SCALE), i1 = NX;
    const span = i1 - i0;
    // vertical range, in world units, with the sea level a fixed fraction down
    const TOP = 3.4, BOT = -7.0;
    const xOf = i => ((i - i0) / span) * w;
    const yOf = z => h * (TOP - z) / (TOP - BOT);

    // --- sky / air ---
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(10,26,40,0.0)');
    g.addColorStop(1, 'rgba(10,26,40,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // --- still water level ---
    const ySea = yOf(sim.sea);
    ctx.strokeStyle = 'rgba(150,205,235,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, ySea); ctx.lineTo(w, ySea); ctx.stroke();
    ctx.setLineDash([]);

    // --- water body ---
    ctx.beginPath();
    ctx.moveTo(xOf(i0), yOf(sim.eta[row + i0]));
    for (let i = i0 + 1; i < i1; i++) ctx.lineTo(xOf(i), yOf(sim.eta[row + i]));
    for (let i = i1 - 1; i >= i0; i--) ctx.lineTo(xOf(i), yOf(sim.bed[row + i]));
    ctx.closePath();
    const wg = ctx.createLinearGradient(0, yOf(TOP), 0, yOf(BOT));
    wg.addColorStop(0, 'rgba(120,215,225,0.55)');
    wg.addColorStop(1, 'rgba(16,70,110,0.75)');
    ctx.fillStyle = wg;
    ctx.fill();

    // --- water surface, with breaking crests picked out ---
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(215,245,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(xOf(i0), yOf(sim.eta[row + i0]));
    for (let i = i0 + 1; i < i1; i++) ctx.lineTo(xOf(i), yOf(sim.eta[row + i]));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let pen = false;
    for (let i = i0; i < i1; i++) {
      const k = row + i;
      const H = sim.eta[k] - sim.bed[k];
      const breaking = H > 0.05 && (sim.eta[k] - sim.sea) / H > 0.36;
      if (breaking) {
        if (!pen) { ctx.moveTo(xOf(i), yOf(sim.eta[k])); pen = true; }
        else ctx.lineTo(xOf(i), yOf(sim.eta[k]));
      } else pen = false;
    }
    ctx.stroke();

    // --- sea bed ---
    ctx.beginPath();
    ctx.moveTo(xOf(i0), yOf(sim.bed[row + i0]));
    for (let i = i0 + 1; i < i1; i++) ctx.lineTo(xOf(i), yOf(sim.bed[row + i]));
    ctx.lineTo(xOf(i1 - 1), h);
    ctx.lineTo(xOf(i0), h);
    ctx.closePath();
    const sg = ctx.createLinearGradient(0, yOf(3.4), 0, h);
    sg.addColorStop(0, 'rgba(226,206,166,0.95)');
    sg.addColorStop(1, 'rgba(150,124,92,0.95)');
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,96,64,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xOf(i0), yOf(sim.bed[row + i0]));
    for (let i = i0 + 1; i < i1; i++) ctx.lineTo(xOf(i), yOf(sim.bed[row + i]));
    ctx.stroke();

    // --- rock, coral and timber ---
    // Drawn over the sand as a column per cell, which is exactly what it is:
    // everything below this line is the surface the sand cannot be cut into.
    // Seeing the sand veneer thin out over the reef crest and bank up in the
    // lee of it is the clearest statement of what the material actually does.
    if (sim.hasFloor) {
      const cw = w / span + 0.8;
      for (let i = i0; i < i1; i++) {
        const f = sim.floor[row + i];
        if (f < -9) continue;
        const yT = yOf(f);
        ctx.fillStyle = sim.built[row + i] > 0.5 ? 'rgba(104,78,58,0.95)'
          : sim.reef[row + i] > 0.15 ? 'rgba(168,116,104,0.95)'
          : 'rgba(128,124,120,0.95)';
        ctx.fillRect(xOf(i), yT, cw, h - yT);
      }
    }

    // --- labels ---
    ctx.fillStyle = 'rgba(200,228,244,0.72)';
    ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('offshore', 4, h - 4);
    const bw = ctx.measureText('beach').width;
    ctx.fillText('beach', w - bw - 4, h - 4);
    ctx.fillText('cross-section', 4, 11);
  }
}
