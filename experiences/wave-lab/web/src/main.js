import { Sim, NX, NY, SCALE, VIEW_X0, VIEW_NX, STEP_HZ } from './sim.js';
import { Renderer, THEMES } from './render.js';
import { World, FLOATER_KINDS, PROP_KINDS } from './entities.js';
import { Surf } from './sound.js';
import { Section } from './section.js';
import { drawStructures } from './structures.js';
import { connectFootron, footronEnabled, dispatchControlMessage } from './footron.js';

const sim = new Sim();
const renderer = new Renderer(sim);
const world = new World(sim);
const section = new Section(document.getElementById('section'));
const surf = new Surf();
world.surf = surf;

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d', { alpha: false });
const ui = document.getElementById('ui');

let themeName = 'day';
let tool = 'raise';
let brush = Math.round(12 * SCALE);
let dpr = 1;
let W = 0, H = 0;
let lastInput = performance.now();
let attract = false;
let hover = null;
let soundOn = false;
const hintEl = document.getElementById('hint');

// ------------------------------------------------------------------ sizing

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Proportional to the display, within limits. A fixed 340 px is right on a
  // laptop and a postage stamp on a wall, where this is the panel that explains
  // what the water is doing.
  const secW = Math.max(340, Math.min(820, Math.round(W * 0.26)));
  section.resize(secW, Math.round(secW * 0.376), dpr);
}
window.addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------- input

const pointers = new Map();

function toGrid(ev) {
  const rect = canvas.getBoundingClientRect();
  // The picture starts at VIEW_X0, not at column 0: the wave generator is
  // simulated off the left edge of the frame.
  return [
    VIEW_X0 + ((ev.clientX - rect.left) / rect.width) * VIEW_NX,
    ((ev.clientY - rect.top) / rect.height) * NY,
  ];
}

const BRUSH_MIN = Math.max(2, Math.round(3 * SCALE));
const BRUSH_MAX = Math.round(34 * SCALE);
function clampBrush(v) {
  return Math.max(BRUSH_MIN, Math.min(BRUSH_MAX, Math.round(v)));
}

function markInput() {
  lastInput = performance.now();
  attract = false;
  // Browsers only allow audio to start inside a user gesture, and markInput is
  // called from every one of ours.
  if (soundOn) surf.start();
}

// One-shot actions happen on press. The sand tools are driven from the render
// loop instead of from pointermove, so the rate doesn't depend on the mouse's
// report rate and holding still keeps working.
function applyOnce(gx, gy) {
  switch (tool) {
    case 'toy':
      world.addFloater(gx, gy, FLOATER_KINDS[(Math.random() * FLOATER_KINDS.length) | 0]);
      if (sim.depthAt(gx, gy) > 0.1) surf.splash(0.6);
      break;
    case 'prop':
      if (sim.depthAt(gx, gy) > 0.25) {
        world.addSplash(gx, gy, 12, 1);
        sim.splash(gx, gy, 0.8, 5);
        surf.splash(0.9);
      } else {
        world.addProp(gx, gy);
      }
      break;
  }
}

function applyHeld(gx, gy, dt) {
  const step = Math.min(0.05, dt);
  switch (tool) {
    case 'raise': sim.sculpt(gx, gy, brush, 5.5 * step); break;
    case 'dig': sim.sculpt(gx, gy, brush, -5.5 * step); break;
  }
}

canvas.addEventListener('pointerdown', ev => {
  canvas.setPointerCapture(ev.pointerId);
  const g = toGrid(ev);
  pointers.set(ev.pointerId, g);
  markInput();
  applyOnce(g[0], g[1]);
});
canvas.addEventListener('pointermove', ev => {
  if (!pointers.has(ev.pointerId)) return;
  markInput();
  pointers.set(ev.pointerId, toGrid(ev));
});
const release = ev => {
  pointers.delete(ev.pointerId);
  if (ev.pointerType === 'touch') hover = null;   // don't leave a ghost ring
};
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);

canvas.addEventListener('wheel', ev => {
  ev.preventDefault();
  markInput();
  brush = clampBrush(brush - Math.sign(ev.deltaY) * 2 * SCALE);
  document.getElementById('brush').value = brush;
}, { passive: false });

// --------------------------------------------------------------------- UI

const fmt = {
  amplitude: v => v.toFixed(2) + 'm',
  frequency: v => (1 / v).toFixed(1) + 's',
  angle: v => v.toFixed(0) + '°',
  chop: v => Math.round(v * 100) + '%',
  wind: v => Math.round(v * 100) + '%',
  tide: v => (v > 0 ? '+' : '') + v.toFixed(2),
  erosion: v => Math.round(v * 100) + '%',
  speed: v => v.toFixed(2) + '×',
};

// Only sliders we know how to format and apply; an unrecognised data-p would
// otherwise throw during startup and take the whole page down with it.
const sliders = [...document.querySelectorAll('input[data-p]')]
  .filter(el => typeof fmt[el.dataset.p] === 'function');

function syncSliders() {
  for (const el of sliders) {
    const key = el.dataset.p;
    el.value = sim.params[key];
    el.nextElementSibling.textContent = fmt[key](+el.value);
  }
}
for (const el of sliders) {
  el.addEventListener('input', () => {
    const key = el.dataset.p;
    const v = +el.value;
    if (key === 'tide') sim.setTide(v);
    else sim.params[key] = v;
    el.nextElementSibling.textContent = fmt[key](v);
    markInput();
  });
}
syncSliders();

function selectIn(container, el) {
  for (const b of container.querySelectorAll('button')) b.classList.remove('on');
  if (el) el.classList.add('on');
}

// Every control below is a named function with the DOM handler as a thin
// wrapper, because on the wall there is no DOM to click: the phone calls the
// same functions over the socket. Keeping one implementation is what stops the
// two input paths drifting into different behaviour.
const presetsEl = document.getElementById('presets');
const themesEl = document.getElementById('themes');

function setCoast(name) {
  sim.preset(name);
  world.reset();
  syncSliders();
  selectIn(presetsEl, presetsEl.querySelector(`[data-preset="${name}"]`));
}
presetsEl.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  setCoast(b.dataset.preset);
  markInput();
});

function setTheme(name) {
  themeName = name;
  selectIn(themesEl, themesEl.querySelector(`[data-theme="${name}"]`));
}
themesEl.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  setTheme(b.dataset.theme);
  markInput();
});

// ------------------------------------------------------------ demonstrations
//
// Each one sets up a situation the physics then resolves on its own — nothing
// here fakes the result. The card says what to watch for, so the beach also
// works as an exhibit when nobody is there to explain it.

const LESSONS = {
  shoal: {
    title: 'Shoaling: why waves grow as they arrive',
    body: 'A long, low swell crossing a smooth slope. Watch the cross-section: '
      + 'in deep water the crests are far apart and gentle. As the bed rises the '
      + 'wave slows, so the crests bunch up and grow taller until the front face '
      + 'is too steep to hold and it breaks.',
    preset: 'flat',
    params: { amplitude: 0.5, frequency: 0.055, angle: 0, chop: 0.05, wind: 0.05, erosion: 0 },
    section: true,
  },
  rip: {
    title: 'Rip currents: where the water gets back out',
    body: 'Waves pile water onto the beach, and it has to escape somewhere. A gap '
      + 'in the sandbar is the path of least resistance. The arrows show the '
      + 'mean flow: through the gap the water heads offshore two to four times '
      + 'faster than on either side, fed by water drifting along the shore. '
      + 'Leave it running — the current scours its own channel deeper, which '
      + 'makes the rip stronger still.',
    preset: 'sandbar',
    params: { amplitude: 0.72, frequency: 0.085, angle: 0, chop: 0.3, wind: 0.25, erosion: 0.3 },
    flow: true,
    build(sim) {
      // cut a channel through the bar, the way a real rip maintains its own gap
      const gy = NY * 0.5;
      for (let k = 0; k < 34; k++) {
        sim.sculpt(NX * (0.36 + k * 0.006), gy, Math.round(9 * SCALE), -0.55);
      }
    },
  },
  groin: {
    title: 'Longshore drift and the groin trap',
    body: 'The swell arrives at an angle, so the water it throws up the beach '
      + 'runs sideways as it drains — and it carries sand with it. The wall '
      + 'blocks that river of sand: watch it build up on the upstream side and '
      + 'starve the beach on the other. Turn Sand drift up to speed it along.',
    preset: 'classic',
    params: { amplitude: 0.68, frequency: 0.085, angle: 34, chop: 0.3, wind: 0.3, erosion: 0.85 },
    build(sim) {
      const gy = Math.round(NY * 0.5);
      const w = Math.max(1, Math.round(2 * SCALE));
      for (let i = Math.round(NX * 0.60); i < Math.round(NX * 0.76); i++) {
        for (let d = -w; d <= w; d++) {
          const j = ((gy + d) % NY + NY) % NY;
          sim.bed[j * NX + i] += 3.4;
          if (sim.eta[j * NX + i] < sim.bed[j * NX + i]) sim.eta[j * NX + i] = sim.bed[j * NX + i];
        }
      }
    },
  },
  refract: {
    title: 'Refraction: waves turn to face the beach',
    body: 'The swell is set to come in at a steep angle, but look at the crests '
      + 'near the shore — they have swung round to run almost parallel to it. '
      + 'The end of a crest in shallow water moves slower than the end still in '
      + 'deep water, so the whole wave pivots. Flatten the bars and it stops.',
    preset: 'coves',
    params: { amplitude: 0.6, frequency: 0.07, angle: 48, chop: 0.15, wind: 0.15, erosion: 0.1 },
  },
  reefbreak: {
    title: 'Why a reef makes a lagoon',
    body: 'The swell crosses deep water untouched, then trips over the coral '
      + 'crest and dumps almost all of it there. What gets past is small, and '
      + 'the rough reef flat takes more of it, so the lagoon behind stays calm '
      + 'in a swell that would be pounding an open beach. Watch the two gaps in '
      + 'the crest: water piled over the flat has to get back out, and it leaves '
      + 'through them as rips — turn Currents on to see it. The coral itself '
      + 'never moves. Only the sand around it does.',
    preset: 'reef',
    params: { amplitude: 0.85, frequency: 0.085, angle: 12, chop: 0.35, wind: 0.3, erosion: 0.6 },
    flow: true,
  },
  pierscour: {
    title: 'What a pier does to a beach',
    body: 'The piles cannot be washed away, so the sand has to arrange itself '
      + 'around them. Flow squeezing between them digs a hollow at the base of '
      + 'each one — that is scour, and it is what undermines real piers. With '
      + 'the swell coming in at an angle the drift piles sand up on the updrift '
      + 'side and starves the other, which is why a pier so often has a fat '
      + 'beach on one side and a scarp on the other. Set Direction to 0 and the '
      + 'two sides even out again.',
    preset: 'pier',
    params: { amplitude: 0.7, frequency: 0.09, angle: 30, chop: 0.35, wind: 0.35, erosion: 0.95 },
    flow: true,
  },
  surge: {
    title: 'Storm surge: the same beach, higher water',
    body: 'Big steep waves on top of a raised sea level. The waves break much '
      + 'closer in because the bars are too deep to trip them, so all that '
      + 'energy arrives at the dunes instead. Anything left on the sand is going '
      + 'to get taken.',
    preset: 'classic',
    params: { amplitude: 1.05, frequency: 0.13, angle: -26, chop: 0.9, wind: 0.9, erosion: 0.9 },
    tide: 1.15,
    props: true,
  },
};

const lessonCard = document.getElementById('lesson-card');
const lessonTitle = document.getElementById('lesson-title');
const lessonBody = document.getElementById('lesson-body');
document.getElementById('lesson-close').addEventListener('click', () => {
  lessonCard.classList.remove('on');
  selectIn(document.getElementById('lessons'), null);
});

const lessonsEl = document.getElementById('lessons');
function runLesson(name) {
  const L = LESSONS[name];
  if (!L) return;
  selectIn(lessonsEl, lessonsEl.querySelector(`[data-lesson="${name}"]`));

  sim.preset(L.preset);
  selectIn(document.getElementById('presets'),
    document.querySelector(`#presets [data-preset="${L.preset}"]`));
  world.reset();
  Object.assign(sim.params, L.params);
  sim.setTide(L.tide || 0);
  syncSliders();
  if (L.build) L.build(sim);
  if (L.props) {
    for (let i = 0; i < 6; i++) {
      world.addProp(NX * (0.80 + Math.random() * 0.11), Math.random() * NY);
    }
  }
  // Let the situation develop a little before it is looked at. This is a slice
  // of SIM-time rather than a step count so the wave clock cannot quietly change
  // how much of a head start a demonstration gets, and it is kept short because
  // it runs synchronously: every unit of it is a freeze between the click and
  // the card. The rest of the scene builds on screen, at the speed it happens.
  for (let t = 0; t < 10; t += sim.lastDt) { sim.step(); world.update(sim.lastDt); }

  if (L.flow && !showFlow) flowBtn.click();
  if (L.section && !section.visible) sectionBtn.click();

  lessonTitle.textContent = L.title;
  lessonBody.textContent = L.body;
  lessonCard.classList.add('on');
}
lessonsEl.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  markInput();
  runLesson(b.dataset.lesson);
});

const MOODS = {
  glassy: { amplitude: 0.16, frequency: 0.06, chop: 0.05, wind: 0.04, angle: 4 },
  surf: { amplitude: 0.72, frequency: 0.085, chop: 0.4, wind: 0.35, angle: 16 },
  storm: { amplitude: 1.1, frequency: 0.14, chop: 0.95, wind: 0.95, angle: -32 },
};
function setMood(name) {
  if (!MOODS[name]) return;
  Object.assign(sim.params, MOODS[name]);
  syncSliders();
}
function rogueWave() { sim.tsunami(2.6); surf.rumble(); }
document.getElementById('moods').addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  markInput();
  if (b.dataset.mood === 'tsunami') rogueWave();
  else setMood(b.dataset.mood);
});

const toolBar = document.getElementById('tools');
toolBar.addEventListener('click', ev => {
  const b = ev.target.closest('button[data-tool]'); if (!b) return;
  tool = b.dataset.tool;
  selectIn(toolBar, b);
  markInput();
});
const brushEl = document.getElementById('brush');
brushEl.min = BRUSH_MIN; brushEl.max = BRUSH_MAX; brushEl.value = brush;
brushEl.addEventListener('input', ev => {
  brush = clampBrush(+ev.target.value); markInput();
});

const pauseBtn = document.getElementById('btn-pause');
pauseBtn.addEventListener('click', () => togglePause());
function flattenSea() {
  for (let k = 0; k < sim.eta.length; k++) {
    sim.eta[k] = Math.max(sim.bed[k], sim.sea);
    sim.u[k] = 0; sim.v[k] = 0; sim.foam[k] = 0;
  }
}
document.getElementById('btn-calm').addEventListener('click', () => {
  flattenSea();
  markInput();
});
document.getElementById('btn-reset').addEventListener('click', () => {
  sim.preset(currentPreset());
  world.reset();
  syncSliders();
  markInput();
});
// The currents overlay is on from the first frame. It is the one instrument
// that explains what the water is doing rather than what it looks like — where
// the rip runs, which way the longshore drift is going — and leaving it off by
// default meant most viewers never saw it. The toggle still works (F, the
// button, or the phone) for anyone who wants the bare water.
let showFlow = true;
const flowBtn = document.getElementById('btn-flow');
flowBtn.classList.toggle('on', showFlow);
flowBtn.addEventListener('click', () => {
  showFlow = !showFlow;
  flowBtn.classList.toggle('on', showFlow);
  markInput();
});
const soundBtn = document.getElementById('btn-sound');
soundBtn.addEventListener('click', () => {
  soundOn = !soundOn;
  soundBtn.classList.toggle('on', soundOn);
  if (soundOn) { surf.start(); surf.setMuted(false); } else { surf.setMuted(true); }
  markInput();
});

const sectionBtn = document.getElementById('btn-section');
sectionBtn.addEventListener('click', () => {
  section.visible = !section.visible;
  sectionBtn.classList.toggle('on', section.visible);
  section.canvas.classList.toggle('on', section.visible);
  markInput();
});

const depthBtn = document.getElementById('btn-depth');
depthBtn.addEventListener('click', () => {
  renderer.showDepth = !renderer.showDepth;
  depthBtn.classList.toggle('on', renderer.showDepth);
  markInput();
});
document.getElementById('collapse').addEventListener('click', () => {
  document.getElementById('controls').classList.toggle('collapsed');
});

function currentPreset() {
  const on = document.querySelector('#presets button.on');
  return on ? on.dataset.preset : 'classic';
}
function togglePause() {
  sim.paused = !sim.paused;
  pauseBtn.classList.toggle('on', sim.paused);
}

addEventListener('keydown', ev => {
  if (ev.target instanceof HTMLInputElement) return;   // let sliders keep arrows/space
  const keys = { '1': 'raise', '2': 'dig', '3': 'toy', '4': 'prop' };
  markInput();
  if (keys[ev.key]) {
    tool = keys[ev.key];
    selectIn(toolBar, toolBar.querySelector(`[data-tool="${tool}"]`));
    return;
  }
  switch (ev.key.toLowerCase()) {
    case ' ': ev.preventDefault(); togglePause(); break;
    case 'r': sim.preset(currentPreset()); world.reset(); syncSliders(); break;
    case 't': sim.tsunami(2.6); surf.rumble(); break;
    case 'd': depthBtn.click(); break;
    case 'f': flowBtn.click(); break;
    case 's': soundBtn.click(); break;
    case 'x': sectionBtn.click(); break;
    case 'h': ui.classList.toggle('hidden'); break;
    case 'c': world.reset(); break;
    case '[': brush = clampBrush(brush - 2 * SCALE); document.getElementById('brush').value = brush; break;
    case ']': brush = clampBrush(brush + 2 * SCALE); document.getElementById('brush').value = brush; break;
  }
});

// ------------------------------------------------------- attract mode (kiosk)

let attractT = 0;
function updateAttract(dt, now) {
  if (!attract && now - lastInput > 45000) attract = true;
  if (!attract) return;
  attractT -= dt;
  if (attractT > 0) return;
  attractT = 9 + Math.random() * 7;
  const p = sim.params;
  p.amplitude = 0.25 + Math.random() * 0.7;
  p.frequency = 0.04 + Math.random() * 0.08;
  p.angle = (Math.random() * 2 - 1) * 40;
  p.chop = Math.random() * 0.8;
  p.wind = Math.random() * 0.8;
  syncSliders();
  if (Math.random() < 0.35) {
    // Just inside the frame, so a toy drifts in from the deep rather than
    // popping into existence somewhere the camera cannot see.
    world.addFloater(VIEW_X0 + (4 + Math.random() * 40) * SCALE, Math.random() * NY,
      FLOATER_KINDS[(Math.random() * FLOATER_KINDS.length) | 0]);
  }
  if (Math.random() < 0.25) {
    world.addProp(NX * (0.80 + Math.random() * 0.14), Math.random() * NY,
      PROP_KINDS[(Math.random() * PROP_KINDS.length) | 0]);
  }
  if (Math.random() < 0.10) sim.tsunami(1.8);
}

// -------------------------------------------------------------- brush ring

canvas.addEventListener('pointermove', ev => {
  hover = toGrid(ev);
  section.setRow(hover[1]);      // inspect whatever row you are pointing at
});
canvas.addEventListener('pointerleave', () => { hover = null; });

function drawCursor(sx, sy) {
  if (!hover) return;
  const sculpting = tool === 'raise' || tool === 'dig';
  if (!sculpting) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.ellipse((hover[0] - VIEW_X0) * sx, hover[1] * sy, brush * sx, brush * sy, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------ flow overlay

function drawFlow(sx, sy) {
  const step = Math.max(5, Math.round(7 * SCALE));
  ctx.save();
  // Line width is in CSS pixels, so a constant is a hairline on a wall and the
  // overlay reads as not having come on at all. Scale it with the display.
  const weight = Math.max(1.1, W / 1000);
  ctx.lineWidth = weight;
  ctx.lineCap = 'round';
  for (let j = step >> 1; j < NY; j += step) {
    for (let i = VIEW_X0 + (step >> 1); i < NX; i += step) {
      const k = j * NX + i;
      if (sim.eta[k] - sim.bed[k] < 0.15) continue;
      const u = sim.u[k], v = sim.v[k];
      const sp = Math.hypot(u, v);
      if (sp < 0.12 * SCALE) continue;
      const a = Math.min(0.72, (sp / SCALE) * 0.34);
      const len = Math.min(step * 0.9, (sp / SCALE) * 2.2);
      const nx = u / sp, ny = v / sp;
      const x0 = (i - VIEW_X0) * sx, y0 = j * sy;
      const x1 = (i - VIEW_X0 + nx * len) * sx, y1 = (j + ny * len) * sy;
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.beginPath();          // arrowhead
      ctx.arc(x1, y1, weight * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    }
  }
  ctx.restore();
}

// -------------------------------------------------------------- surf report

// The domain is a fixed stretch of beach whatever the grid, so metres per cell
// falls out of the resolution.
const CELL_M = 1.5 / SCALE;
const report = {
  height: document.getElementById('r-height'),
  period: document.getElementById('r-period'),
  dir: document.getElementById('r-dir'),
  brk: document.getElementById('r-break'),
  swash: document.getElementById('r-swash'),
};

function updateReport() {
  let hMax = 0, shoreX = 0, rows = 0, runUp = 0, brkSum = 0, brkRows = 0;
  const rowStep = Math.max(3, Math.round(5 * SCALE));
  for (let j = 2; j < NY; j += rowStep) {
    const row = j * NX;
    let shore = 0, wettest = 0, firstFoam = -1;
    for (let i = VIEW_X0; i < NX; i++) {
      const k = row + i;
      const still = sim.sea - sim.bed[k];
      if (still > 0.1 && still < 3.0) {
        const crest = sim.eta[k] - sim.sea;
        if (crest > hMax) hMax = crest;
      }
      if (still > 0) shore = i;                     // last cell below sea level
      // the outermost solid foam on this row is where waves start breaking
      if (firstFoam < 0 && sim.foam[k] > 0.55) firstFoam = i;
      // Instantaneous water, not the wetness memory: the memory holds a high
      // mark for several seconds, which reads as a permanent flood.
      if (sim.eta[k] - sim.bed[k] > 0.02 && sim.bed[k] > 0) wettest = i;
    }
    shoreX += shore; rows++;
    if (wettest) runUp = Math.max(runUp, wettest - shore);
    if (firstFoam >= 0) { brkSum += shore - firstFoam; brkRows++; }
  }
  shoreX /= Math.max(1, rows);
  const p = sim.params;
  report.height.textContent = (hMax * 2).toFixed(1);       // crest to trough
  report.period.textContent = (1 / p.frequency).toFixed(1) + ' s';
  report.dir.textContent = (p.angle > 0 ? '+' : '') + p.angle.toFixed(0) + '\u00b0';
  report.brk.textContent = brkRows
    ? Math.max(0, Math.round((brkSum / brkRows) * CELL_M)) + ' m out'
    : 'not breaking';
  report.swash.textContent = runUp > 0 ? Math.round(runUp * CELL_M) + ' m up' : 'dry';
}

// ------------------------------------------------------------ grid watchdog
//
// There is no longer any detail to shed when a machine falls behind, so the
// only remaining lever is the grid itself — and resolution is fixed at startup
// and cannot change mid-session. Sustained slow frames therefore just remember
// a smaller grid for the next load.

let qCooldown = 6;
let slowFrames = 0;

function watchFrameRate(dt) {
  qCooldown -= dt;
  if (dt > 0.024) slowFrames++; else slowFrames = 0;
  if (qCooldown > 0) return;
  if (slowFrames > 300) {
    rememberSmallerGrid();
    slowFrames = 0; qCooldown = 60;
  }
}

function rememberSmallerGrid() {
  const smaller = NX >= 400 ? 320 : NX >= 320 ? 256 : 0;
  if (!smaller) return;
  try {
    if (+localStorage.getItem('wavelab.grid') === smaller) return;
    localStorage.setItem('wavelab.grid', String(smaller));
    hintEl.textContent = `running behind — reload for a lighter ${smaller}-cell grid`;
  } catch (e) { /* privacy mode: nothing to do */ }
}

// -------------------------------------------------------------------- loop

const statsEl = document.getElementById('stats');
let last = performance.now();
let fpsAvg = 60, statTimer = 0;

// sim.step() always advances the same slice of sim-time, so how fast the water
// appears to move is set by how OFTEN it is stepped, not by how long the frame
// took. Stepping once per rendered frame tied the wave clock to the frame rate:
// a 120 Hz display ran at double speed, and anything that changed frame cost —
// switching preset, a heavier coastline, the tab coming back to the
// foreground — made the swell visibly speed up or slow down. So real time is
// accumulated here and spent in whole steps at a fixed rate instead.
// STEP_HZ and the sim-time each step advances live in sim.js; together they set
// how fast the water runs (see 'the wave clock' there).
const MAX_CATCHUP = 4;          // steps one frame may spend
let acc = 0;

function frame(now) {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  fpsAvg += (1 / dt - fpsAvg) * 0.06;

  // No spin-up: the beach opens as flat calm water and the swell arrives at the
  // speed it actually travels. There used to be a burst of extra steps here to
  // have waves already breaking on the first frame — a crossing time is about
  // 20 units of sim-time, and 60 before the surf settles — but it is 4.5 s of
  // solver however it is spent, and spending it in the render loop means the
  // opening seconds play at twenty times speed. Fast-forwarding in front of the
  // viewer looks like the simulation is broken rather than starting, so the
  // first wave is simply allowed to travel.

  updateAttract(dt, now);
  for (const [, g] of pointers) applyHeld(g[0], g[1], dt);

  if (sim.paused) {
    acc = 0;                    // no debt to repay in a lurch on unpause
  } else {
    acc += dt * STEP_HZ;
    let steps = acc | 0;
    acc -= steps;
    // A machine that cannot hold the full rate runs in honest slow motion
    // rather than accumulating a backlog it later spends all at once.
    if (steps > MAX_CATCHUP) steps = MAX_CATCHUP;
    for (let i = 0; i < steps; i++) {
      sim.step();
      world.update(sim.lastDt);   // entities share the water's clock
    }
  }

  const theme = THEMES[themeName];
  renderer.blit(ctx, W, H, theme, sim.time);

  // sx is pixels per cell across the VISIBLE window, and the translate slides
  // the hidden offshore columns off the left of the screen. Everything drawn in
  // grid units goes inside this transform.
  const sx = W / VIEW_NX, sy = H / NY;
  ctx.save();
  ctx.translate(-VIEW_X0 * sx, 0);
  ctx.scale(sx / sy, 1);          // entities are drawn in grid units, y-scaled
  world.draw(ctx, sy, themeName, sim.time);
  // Structures last: a pier deck is above the water and above everything on it.
  drawStructures(ctx, sim, sy, theme, sim.time);
  ctx.restore();
  if (showFlow) drawFlow(sx, sy);
  drawCursor(sx, sy);

  section.draw(sim, theme);
  surf.update(sim);
  watchFrameRate(dt);

  canvas.style.cursor = attract ? 'none' : 'crosshair';

  statTimer -= dt;
  if (statTimer <= 0) {
    statTimer = 0.25;
    updateReport();
    statsEl.textContent =
      `${fpsAvg.toFixed(0)} fps · ${NX}×${NY} cells\n` +
      `${world.floaters.length} floating · ${world.crabs.length} crabs` +
      (attract ? ' · demo mode' : '');
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// A couple of toys and umbrellas so the beach never opens empty.
for (let i = 0; i < 3; i++) {
  world.addFloater(VIEW_X0 + (6 + Math.random() * 55) * SCALE, Math.random() * NY);
}
for (let i = 0; i < 4; i++) world.addProp(NX * (0.84 + Math.random() * 0.1), Math.random() * NY);

// A handle for the headless scripts. The page is otherwise entirely
// self-contained, and this is the only thing scripts/lib/browser.mjs can ask to
// find out whether the beach is actually running — a page whose module threw on
// line one still answers document.title.
window.__wavelab = {
  sim, world, renderer,
  get theme() { return themeName; },
  setCoast, setTheme, setMood, rogueWave, runLesson,
  get showFlow() { return showFlow; },
  get section() { return section; },
  // Set below, once the handlers exist: lets the checks send a phone message
  // into the live page.
  control: null,
  ready: true,
};

// ------------------------------------------------------------ phone controls
//
// On the wall this is the only way in. Each handler is the same function the
// on-screen button calls, so the two paths cannot behave differently — see the
// protocol in src/footron.js.

if (footronEnabled()) {
  // The wall has no pointer, so the panels are dead weight in front of the
  // beach. Hide them and let the phone drive; `H` still brings them back for
  // anyone debugging on the machine itself.
  ui.classList.add('hidden');
  document.body.classList.add('kiosk');
}

// Named rather than inline so the headless checks can drive the exact path a
// phone drives, without a socket. This is the whole of the wall's input on the
// wall, and it was previously reachable only through a WebSocket, which meant
// the one code path that matters most was the one nothing could test.
const controlHandlers = {
  onActivity: () => { lastInput = performance.now(); attract = false; },
  onSwell: (key, value) => {
    if (key === 'tide') sim.setTide(value);
    else sim.params[key] = value;
    syncSliders();
  },
  onCoast: setCoast,
  onLight: setTheme,
  onMood: setMood,
  onRogue: rogueWave,
  onLesson: runLesson,
  onTouch: (fx, fy, which) => {
    // Fractions of the VISIBLE wall, so the phone need not know the grid — which
    // is picked at load from the display and differs between machines — and a
    // finger at the left edge of the pad lands at the left edge of the picture,
    // not in the hidden offshore strip.
    const gx = VIEW_X0 + fx * VIEW_NX, gy = fy * NY;
    const previous = tool;
    tool = which;
    applyOnce(gx, gy);
    // The held-down tools do nothing on a single tap, so a tap on one of them
    // gets a single step's worth rather than silently no-op.
    if (which === 'raise' || which === 'dig') {
      applyHeld(gx, gy, 0.35);
    }
    tool = previous;
  },
  onView: (key, on) => {
    if (key === 'pause') { if (sim.paused !== on) togglePause(); return; }
    const btn = { flow: flowBtn, depth: depthBtn, section: sectionBtn }[key];
    if (btn && btn.classList.contains('on') !== on) btn.click();
  },
  onReset: () => { sim.preset(currentPreset()); world.reset(); syncSliders(); },
  onCalm: () => flattenSea(),
};
connectFootron(controlHandlers);
window.__wavelab.control = (msg) => dispatchControlMessage(msg, controlHandlers);


