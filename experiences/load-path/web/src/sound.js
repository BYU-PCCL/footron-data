// Procedurally generated impact/break sounds via the Web Audio API — no
// audio files, so there's nothing to source, license, or vendor. Both
// sounds are built from oscillators and filtered noise, synthesized fresh
// on every call.
//
// A browser only lets an AudioContext actually produce sound after a real
// user gesture. The context is created lazily on first use rather than at
// module load, and every call resumes it — cheap when it's already
// running, and exactly what's needed the first time, since dropping the
// weight (a real drag-and-drop) is itself the qualifying gesture.
let ctx = null;
function getContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

// The weight making contact — a low thud, played whether or not the
// structure ends up holding. A heavier impact (intensity closer to 1)
// sounds deeper and louder, not just louder.
export function playImpact(intensity = 0.5) {
  const audio = getContext();
  const now = audio.currentTime;
  const level = clamp01(intensity);

  const osc = audio.createOscillator();
  osc.type = "sine";
  const baseFreq = 120 - level * 60;
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, baseFreq * 0.4), now + 0.25);

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.4 + level * 0.4, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

// Real stone breaking — a short burst of filtered noise for the crack
// itself, layered over a lower thump for the mass giving way underneath.
export function playBreak(intensity = 0.5) {
  const audio = getContext();
  const now = audio.currentTime;
  const level = clamp01(intensity);

  const bufferSize = Math.floor(audio.sampleRate * 0.3);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;

  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 800 + level * 1200;
  filter.Q.value = 0.7;

  const noiseGain = audio.createGain();
  noiseGain.gain.setValueAtTime(0.5 + level * 0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audio.destination);
  noise.start(now);

  const osc = audio.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(70, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
  const oscGain = audio.createGain();
  oscGain.gain.setValueAtTime(0.0001, now);
  oscGain.gain.exponentialRampToValueAtTime(0.5 + level * 0.3, now + 0.02);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.connect(oscGain);
  oscGain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.55);
}
