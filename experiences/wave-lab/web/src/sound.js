// Surf synthesis, driven by the simulation.
//
// There is no recording here: the sound is three bands of filtered noise whose
// gains follow what the water is actually doing this frame — the low boom
// tracks breaking energy, the bright sizzle tracks foam coverage, the mid wash
// tracks thin fast water on sand. Because the drivers come from the solver, the
// beach sounds like what you are looking at: dig a channel and that stretch
// goes quiet, crank the swell and the whole thing builds.
//
// Browsers only allow audio after a user gesture, so nothing starts until
// start() is called from a real input event. Every entry point is guarded: if
// WebAudio is missing or blocked, this degrades to silence rather than errors.

const NOISE_SECONDS = 4;

export class Surf {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
    this.volume = 0.55;
    this.failed = false;
  }

  start() {
    if (this.ready || this.failed) return this.resume();
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this.failed = true; return; }
      const ctx = new AC();
      this.ctx = ctx;

      // pink-ish noise: a few octaves of white, summed
      const len = ctx.sampleRate * NOISE_SECONDS;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + w * 0.0990460;
        b1 = 0.96300 * b1 + w * 0.2965164;
        b2 = 0.57000 * b2 + w * 1.0526913;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.22;
      }
      this.noiseBuf = buf;

      this.master = ctx.createGain();
      this.master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      this.master.connect(comp);
      comp.connect(ctx.destination);

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.start();
      this.src = src;

      // three voices off the one noise source
      const band = (type, freq, q, gain) => {
        const f = ctx.createBiquadFilter();
        f.type = type; f.frequency.value = freq;
        if (q) f.Q.value = q;
        const g = ctx.createGain();
        g.gain.value = gain;
        src.connect(f); f.connect(g); g.connect(this.master);
        return { f, g };
      };
      this.boom = band('lowpass', 210, 0.9, 0);
      this.hiss = band('bandpass', 2100, 0.55, 0);
      this.wash = band('bandpass', 760, 0.8, 0);

      // slow swell in the low band, so sets feel like they arrive
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.35;
      lfo.connect(lfoGain);
      lfoGain.connect(this.boom.g.gain);
      lfo.start();

      this.ready = true;
      this.applyVolume();
    } catch (e) {
      this.failed = true;
    }
  }

  resume() {
    try { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { /* ignore */ }
  }

  applyVolume() {
    if (!this.ready) return;
    const target = this.muted ? 0 : this.volume;
    try { this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.25); } catch (e) { /* ignore */ }
  }

  setMuted(m) { this.muted = m; this.applyVolume(); }

  // Called every frame with the simulation's own energy measures.
  update(sim) {
    if (!this.ready || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const p = sim.params;
      const boom = Math.min(1, sim.breakEnergy * 320) * 0.85;
      const hiss = Math.min(1, sim.foamTotal * 5.2) * 0.5 + p.wind * 0.12;
      const wash = Math.min(1, sim.swashEnergy * 26) * 0.42;
      this.boom.g.gain.setTargetAtTime(boom, t, 0.30);
      this.hiss.g.gain.setTargetAtTime(hiss, t, 0.22);
      this.wash.g.gain.setTargetAtTime(wash, t, 0.18);
      // wind opens up the bright band
      this.hiss.f.frequency.setTargetAtTime(1500 + p.wind * 1900, t, 0.6);
    } catch (e) { /* ignore */ }
  }

  // A poke at the water, a dropped toy, a diving gull.
  splash(strength = 1) {
    if (!this.ready || this.muted) return;
    try {
      const ctx = this.ctx, t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 1.1;
      f.frequency.setValueAtTime(2600, t);
      f.frequency.exponentialRampToValueAtTime(420, t + 0.35);
      const g = ctx.createGain();
      const peak = Math.min(0.9, 0.32 * strength);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t);
      src.stop(t + 0.5);
    } catch (e) { /* ignore */ }
  }

  // Herring-gull style two-note cry.
  gull() {
    if (!this.ready || this.muted) return;
    try {
      const ctx = this.ctx, t = ctx.currentTime;
      for (let k = 0; k < 2; k++) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        const t0 = t + k * 0.22;
        o.frequency.setValueAtTime(880 + k * 90, t0);
        o.frequency.exponentialRampToValueAtTime(1500 + k * 120, t0 + 0.06);
        o.frequency.exponentialRampToValueAtTime(700, t0 + 0.19);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 3.2;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.055, t0 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
        o.connect(f); f.connect(g); g.connect(this.master);
        o.start(t0); o.stop(t0 + 0.24);
      }
    } catch (e) { /* ignore */ }
  }

  // A long low swell for the rogue wave.
  rumble() {
    if (!this.ready || this.muted) return;
    try {
      const ctx = this.ctx, t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 130; f.Q.value = 1.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.75, t + 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + 3.6);
    } catch (e) { /* ignore */ }
  }
}
