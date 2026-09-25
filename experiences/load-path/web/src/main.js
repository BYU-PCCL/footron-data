import { nodeId, nodeDofs } from "./mesh.js";
import { iterateTopologyOptimization } from "./optimize.js";
import { renderDensities, renderStress } from "./render.js";
import * as report from "./report.js";
import { playGrowth, showFrame } from "./growth.js";
import { loadLimit, evaluateHalves, stressRatioMap } from "./failure.js";
import * as challenge from "./challenge.js";
import { LESSONS, weightToSliderValue } from "./lessons.js";
import { connectFootron, footronEnabled, spotToColumn } from "./footron.js";
import { paintBackdrop, paintWaterOverlay } from "./backdrop.js";
import { DOMAIN, SCENE_W, SCENE_H } from "./scene.js";
import { buildCollapseScene } from "./collapse.js";
import { kgToVolumeFraction, WEIGHT_EXPONENT_MIN, WEIGHT_EXPONENT_MAX } from "./units.js";

// Supports stay fixed at the two bottom corners — only the load point and
// the material budget are interactive.
const numElemX = 60;
const numElemY = 30;

const bottomLeft = nodeId(0, 0, numElemX);
const bottomRight = nodeId(numElemX, 0, numElemX);
const fixedDofs = [...nodeDofs(bottomLeft), ...nodeDofs(bottomRight)];

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

// The scene is three stacked canvases at a fixed logical size (scene.js): a
// static backdrop, the structure/physics canvas in the middle, and a
// translucent water overlay in front. The page scales the whole scene
// uniformly to fit the screen.
paintBackdrop(document.getElementById("backdrop"));
paintWaterOverlay(document.getElementById("overlay"));

const sceneEl = document.getElementById("scene");
const reportEl = document.getElementById("report");
const challengeEl = document.getElementById("challenge");
const panelEl = document.getElementById("panel");
let sceneScale = 1;
function applySceneTransform(dx, dy) {
  sceneEl.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(${sceneScale})`;
}

// A short camera shake on impact, decaying to nothing. Skipped for people who
// ask their system for reduced motion.
let shakeToken = 0;
function shakeScene(amplitudePx, durationMs) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const token = ++shakeToken;
  const start = performance.now();
  (function frame() {
    if (token !== shakeToken) return;
    const t = (performance.now() - start) / durationMs;
    if (t >= 1) {
      applySceneTransform(0, 0);
      return;
    }
    const decay = (1 - t) ** 2;
    applySceneTransform((Math.random() * 2 - 1) * amplitudePx * decay, (Math.random() * 2 - 1) * amplitudePx * decay);
    requestAnimationFrame(frame);
  })();
}

// The scene always fills the window at full size — it does NOT shrink to make
// room for the side panels. Instead the panels themselves are see-through
// (index.html: low background alpha, and pointer-events disabled on their
// empty space — see the CSS comment there) so a support corner sitting under
// one is still visible and still clickable.
function fitScene() {
  document.documentElement.style.setProperty("--ui", String(Math.min(1.3, Math.max(0.85, window.innerWidth / 1700))));
  sceneScale = Math.min(window.innerWidth / SCENE_W, window.innerHeight / SCENE_H);
  applySceneTransform(0, 0);
}
fitScene();
window.addEventListener("resize", fitScene);

const materialSlider = document.getElementById("material-slider");
const materialLabel = document.getElementById("material-label");
const weightSlider = document.getElementById("weight-slider");
const weightLabel = document.getElementById("weight-label");
const messageEl = document.getElementById("message");
const handle = document.getElementById("load-handle");

document.getElementById("collapse").addEventListener("click", (event) => {
  const collapsed = panelEl.classList.toggle("collapsed");
  event.currentTarget.textContent = collapsed ? "+" : "–";
});

function getMaterialKg() {
  return Number(materialSlider.value);
}

// The interesting range (some shapes hold, some don't, depending on stone
// and position) spans several orders of magnitude (see WEIGHT_EXPONENT_*
// in units.js), which a linear slider can't usefully cover. The slider
// itself stays a plain 0-1000 range; this maps it onto that exponent range.
const WEIGHT_SLIDER_MAX = 1000;

function getWeightKg() {
  const t = Number(weightSlider.value) / WEIGHT_SLIDER_MAX;
  const exponent = WEIGHT_EXPONENT_MIN + (WEIGHT_EXPONENT_MAX - WEIGHT_EXPONENT_MIN) * t;
  return Math.round(10 ** exponent);
}

// Bare kilogram counts don't mean much — anchor each to the nearest (on a
// log scale) familiar object. Approximate, round-number masses.
const REFERENCE_OBJECTS = [
  { name: "a car", kg: 1500 },
  { name: "an elephant", kg: 6000 },
  { name: "a loaded semi-truck", kg: 36000 },
  { name: "a loaded Boeing 747", kg: 400000 },
];
function formatWeightKg(kg) {
  const nearest = REFERENCE_OBJECTS.reduce((best, obj) =>
    Math.abs(Math.log(kg / obj.kg)) < Math.abs(Math.log(kg / best.kg)) ? obj : best
  );
  const count = kg / nearest.kg;
  const countText = count < 10 ? count.toFixed(1) : Math.round(count).toLocaleString();
  return `${Math.round(kg).toLocaleString()} kg (≈ ${countText} × ${nearest.name})`;
}

function setMessage(text) {
  messageEl.textContent = text;
}

function updateLabels() {
  materialLabel.textContent = `${materialSlider.value} kg`;
  weightLabel.textContent = formatWeightKg(getWeightKg());
}
updateLabels();

// Each full cycle (optimize, then test) gets a token. Starting a new one —
// from a fresh drop or a slider change — makes any in-flight animation or
// physics scene notice it's stale and stop touching the canvas, instead of
// two runs racing for it.
let currentRunToken = 0;
let activeScene = null; // the physics scene from the current/most recent test, if any
let lastLoadColumn = null; // set on the first drop; nothing runs before that
let lastDensities = null; // the last converged shape and its displacement
let lastU = null; // field, cached so changing just the test weight
let lastMaterialKg = null; // doesn't re-grow the structure

const FINAL_HOLD_MS = 1800;

// --- Guided lessons: a lesson sets the stone, the weight and the spot, runs
// the whole thing, and says something once the test is over. Any manual change
// to the sliders or a fresh drop ends the lesson, since its closing words are
// only true for the exact setup it verified (see check-lessons.js). ---
let activeLesson = null;
const lessonChips = document.getElementById("lesson-chips");
const lessonText = document.getElementById("lesson-text");

function showLesson(lesson, body) {
  for (const chip of lessonChips.children) chip.classList.toggle("on", lesson !== null && chip.dataset.id === lesson.id);
  lessonText.hidden = lesson === null;
  if (lesson) {
    document.getElementById("lesson-title").textContent = lesson.title;
    document.getElementById("lesson-body").textContent = body;
  }
}

function clearLesson() {
  activeLesson = null;
  showLesson(null);
}

function startLesson(lesson) {
  materialSlider.value = String(lesson.material);
  weightSlider.value = String(weightToSliderValue(lesson.weightKg, WEIGHT_EXPONENT_MIN, WEIGHT_EXPONENT_MAX, WEIGHT_SLIDER_MAX));
  updateLabels();
  runFullCycle(lesson.column, lesson);
}

// Called with the verdict of a finished test; only speaks if it still belongs to the lesson.
function lessonInsight(broke) {
  if (!activeLesson) return;
  const words = broke ? activeLesson.afterBreaks : activeLesson.afterHolds;
  if (words) showLesson(activeLesson, words);
}

for (const lesson of LESSONS) {
  const chip = document.createElement("button");
  chip.textContent = lesson.title;
  chip.dataset.id = lesson.id;
  chip.addEventListener("click", () => startLesson(lesson));
  lessonChips.appendChild(chip);
}
const REPLAY_FRAME_MS = 260;

let lastPlayback = null; // every recorded iteration of the current run, for scrubbing/replay
let phone = { send() {} }; // the link back to the visitor's phone; replaced by connectFootron() below

// What the phone can't see for itself. The editor opens on a FINISHED run, and
// lastPlayback is exactly that: empty before the first grow and while one is
// growing, set once it has finished. Telling the phone lets it grey the button
// out instead of offering one the wall would quietly ignore.
function sendPhoneState() {
  phone.send({ type: "state", canEdit: lastPlayback !== null });
}
let lastCapacityKg = null; // what the finished bridge can carry, exactly (failure.js)
let lastLimit = null; // ...and what limits it: { kg, mode, side }
const skip = { requested: false }; // "Skip" during the step-by-step explanation

function stopEverything() {
  ++currentRunToken;
  if (activeScene) {
    activeScene.stop();
    activeScene = null;
  }
}

async function runFullCycle(loadColumn, lesson = null) {
  challenge.leave();
  activeLesson = lesson;
  showLesson(lesson, lesson ? lesson.intro : "");
  report.showReport();
  stopEverything();
  const token = currentRunToken;
  const isCancelled = () => token !== currentRunToken;

  lastLoadColumn = loadColumn;
  lastPlayback = null;
  sendPhoneState();
  const materialKg = getMaterialKg();
  const volumeFraction = kgToVolumeFraction(materialKg);

  const node = nodeId(loadColumn, numElemY, numElemX);
  const loadDof = nodeDofs(node)[1];
  const loads = [[loadDof, -1]];

  panelEl.classList.add("busy");
  setMessage("Growing the structure…");
  report.showReport();
  report.resetForRun();
  skip.requested = false;
  const iterator = iterateTopologyOptimization(numElemX, numElemY, fixedDofs, loads, { volumeFraction });

  const playback = await playGrowth({ iterator, ctx, isCancelled, materialKg, skip });
  if (!playback) return;

  lastPlayback = playback;
  sendPhoneState();
  const { final } = playback;
  lastDensities = final.densities;
  lastU = final.u;
  lastMaterialKg = materialKg;

  const limit = loadLimit({ numElemX, numElemY, densities: final.densities, u: final.u, loadColumn });
  lastCapacityKg = limit.kg;
  lastLimit = limit;
  showResult();
  report.setScrubber({ max: playback.frames.length + 1, value: playback.frames.length + 1, enabled: true });

  // Before the test, show where the finished bridge is closest to breaking AT
  // THE TEST WEIGHT: the crack in the test will start at the reddest stone.
  showStress();
  await new Promise((resolve) => setTimeout(resolve, FINAL_HOLD_MS));
  if (isCancelled()) return;
  startCollapseTest(token, final.densities, final.u, loadColumn, materialKg);
}

const LIMIT_TEXT = {
  tension: "stone pulled apart",
  buckling: "a leg bowing sideways",
  crushing: "stone crushed",
};

// Draws the finished bridge colored by stress at the current test weight and
// says, in one line, where and how it will start to fail (or how much margin
// it has).
function showStress() {
  if (!lastPlayback) return;
  const { final } = lastPlayback;
  const args = { numElemX, numElemY, densities: final.densities, u: final.u, loadColumn: lastLoadColumn };
  const test = getWeightKg();
  lastPlayback.stressRatios = stressRatioMap({ ...args, testWeightKg: test });
  report.setLegend("stress");
  renderStress(ctx, final.densities, lastPlayback.stressRatios);

  const evaluation = evaluateHalves({ ...args, testWeightKg: test });
  const kg = `${Math.round(test).toLocaleString()} kg`;
  const failing = evaluation.ok ? [evaluation.left, evaluation.right].find((half) => half.fails) : null;
  const worst = evaluation.ok ? Math.max(evaluation.left.stressRatio, evaluation.right.stressRatio) : 0;
  report.setNote(
    !evaluation.ok
      ? "Not connected: nothing carries the load."
      : failing && failing.origin.kind === "tension"
        ? `At ${kg} the reddest stone is over its limit. The crack starts there.`
        : failing
          ? `At ${kg} a whole leg ${failing.origin.kind === "buckling" ? "buckles (bows sideways)" : "crushes"} before the stone cracks, starting mid-leg.`
          : `At ${kg} the hottest stone is at ${Math.round(worst * 100)}% of its limit. It holds.`
  );
}

// The capacity readout: what the finished shape holds, how efficiently it uses
// its stone, and how the current test weight compares.
function showResult() {
  const capacity = lastCapacityKg;
  const test = getWeightKg();
  report.showResult({
    holds: capacity === 0 ? "nothing: not connected" : Number.isFinite(capacity) ? formatWeightKg(capacity) : "no limit found",
    limit: lastLimit && lastLimit.mode ? LIMIT_TEXT[lastLimit.mode] : "\u2014",
    efficiency: capacity > 0 && Number.isFinite(capacity) ? `${Math.round(capacity / lastMaterialKg).toLocaleString()} kg per kg of stone` : "\u2014",
    ...safetyText(capacity, test),
  });
}

function safetyText(capacity, test) {
  if (capacity === 0) return { safety: `${formatWeightKg(test)}: cannot carry it`, safe: false };
  if (!Number.isFinite(capacity)) return { safety: `${formatWeightKg(test)}: holds`, safe: true };
  const factor = capacity / test;
  return factor >= 1
    ? { safety: `${Math.round(test).toLocaleString()} kg: safe, ${factor.toFixed(2)}\u00d7 to spare`, safe: true }
    : { safety: `${Math.round(test).toLocaleString()} kg: over by ${(1 / factor).toFixed(2)}\u00d7`, safe: false };
}

// Scrubbing takes over the canvas: whatever was pending (the test about to
// start, a physics test in progress, a replay) is cancelled, and the chosen
// recorded iteration is drawn.
function scrubTo(index) {
  if (!lastPlayback) return;
  stopEverything();
  playing = false;
  report.setPlaying(false);
  panelEl.classList.remove("busy");
  showFrame(ctx, lastPlayback, index);
  report.setMarker(index);
  setMessage("Scrubbing through the optimizer's iterations.");
}

let playing = false;
async function togglePlay() {
  if (!lastPlayback) return;
  if (playing) {
    stopEverything();
    playing = false;
    report.setPlaying(false);
    return;
  }
  stopEverything();
  const token = currentRunToken;
  playing = true;
  report.setPlaying(true);
  const last = lastPlayback.frames.length + 1;
  for (let k = 1; k <= last; k++) {
    if (token !== currentRunToken) return;
    showFrame(ctx, lastPlayback, k);
    report.setMarker(k);
    await new Promise((resolve) => setTimeout(resolve, REPLAY_FRAME_MS));
  }
  if (token === currentRunToken) {
    playing = false;
    report.setPlaying(false);
  }
}

// Hands the finished run to the visitor's editor: same load, same supports,
// same stone budget, judged by the same model.
function enterChallenge() {
  if (!lastPlayback) return;
  stopEverything();
  playing = false;
  report.setPlaying(false);
  panelEl.classList.remove("busy");
  report.hideReport();
  setMessage("Your turn: lay stone with the same budget as the algorithm.");
  challenge.enterChallenge({
    ctx,
    canvas,
    numElemX,
    numElemY,
    fixedDofs,
    loadColumn: lastLoadColumn,
    volumeFraction: kgToVolumeFraction(lastMaterialKg),
    materialKg: lastMaterialKg,
    algorithm: { densities: lastPlayback.final.densities, u: lastPlayback.final.u, capacity: lastCapacityKg },
    evenSpreadCompliance: lastPlayback.frames[0].compliance,
    deformScale: lastPlayback.scale,
    wallMode: onWall,
    runTest: (densities, u) => {
      stopEverything();
      startCollapseTest(currentRunToken, densities, u, lastLoadColumn, lastMaterialKg);
    },
    stopTest: () => {
      stopEverything();
      panelEl.classList.remove("busy");
    },
    onExit: () => {
      stopEverything();
      report.showReport();
      showFrame(ctx, lastPlayback, lastPlayback.frames.length + 1);
      report.setMarker(lastPlayback.frames.length + 1);
      panelEl.classList.remove("busy");
      setMessage("Back to the algorithm's bridge.");
    },
  });
}

report.bindControls({
  onChallenge: enterChallenge,
  onScrub: scrubTo,
  onPlay: togglePlay,
  onSkip: () => {
    skip.requested = true;
    report.setSkipVisible(false);
  },
  onTest: testAgain,
});

function testAgain() {
  if (lastPlayback) {
    report.setMarker(lastPlayback.frames.length + 1);
    showFrame(ctx, lastPlayback, lastPlayback.frames.length + 1);
  }
  retest();
}

function startCollapseTest(token, densities, u, loadColumn, materialKg) {
  if (token !== currentRunToken) return;

  const testWeightKg = getWeightKg();
  const scene = buildCollapseScene({
    numElemX,
    numElemY,
    densities,
    u,
    loadColumn,
    testWeightKg,
    canvas,
    // Hard when something breaks, a light thud when it holds.
    effects: { onImpact: (broke, intensity) => shakeScene(broke ? 8 + 18 * intensity : 2 + 5 * intensity, broke ? 520 : 240) },
  });
  if (!scene.ok) {
    onRunFinished();
    panelEl.classList.remove("busy");
    setMessage(`${materialKg}kg of stone can't even form a structure here — try more stone, or a different spot.`);
    return;
  }

  activeScene = scene;
  panelEl.classList.add("busy");
  setMessage("Testing it…");
  scene.dropBall();

  function poll() {
    if (token !== currentRunToken) return; // stop() already called by whoever superseded this run
    if (scene.hasSettled()) {
      panelEl.classList.remove("busy");
      if (scene.collapsed()) {
        setMessage(`It broke under ${testWeightKg}kg. Try more stone, or a different spot.`);
      } else {
        setMessage(`It held ${testWeightKg}kg. Try less stone, or a different spot.`);
      }
      lessonInsight(scene.collapsed());
      onRunFinished();
      return;
    }
    requestAnimationFrame(poll);
  }

  requestAnimationFrame(poll);
}

// Re-runs just the physics test against the shape already grown for the
// current position/material, since changing only the test weight doesn't
// change what shape the optimizer would produce.
function retest() {
  // Nothing to re-test until a run has FINISHED growing: changing the weight
  // mid-growth must not cancel the growth and test a stale earlier shape. And
  // while the visitor is painting their own bridge, the canvas is theirs.
  if (lastPlayback === null || challenge.isActive()) return;
  stopEverything();
  const token = currentRunToken;
  playing = false;
  report.setPlaying(false);
  if (lastCapacityKg !== null) report.updateSafety(safetyText(lastCapacityKg, getWeightKg()));
  const { final } = lastPlayback;
  lastPlayback.stressRatios = stressRatioMap({ numElemX, numElemY, densities: final.densities, u: final.u, loadColumn: lastLoadColumn, testWeightKg: getWeightKg() });
  startCollapseTest(token, lastDensities, lastU, lastLoadColumn, lastMaterialKg);
}

// Idle until the first drop — a plain solid block, nothing computed yet.
// Dropping the weight is what starts anything at all.
const solidBlock = Array.from({ length: numElemY }, () => new Array(numElemX).fill(1));
renderDensities(ctx, solidBlock);
setMessage("Drag the weight onto the block to begin.");

materialSlider.addEventListener("input", updateLabels);
materialSlider.addEventListener("change", () => {
  clearLesson();
  updateLabels();
  if (lastLoadColumn !== null) runFullCycle(lastLoadColumn);
});

// The weight only matters once a structure already exists — changing it
// re-tests the SAME converged shape rather than re-growing it, since the
// load position and material budget (what the shape depends on) haven't
// changed.
weightSlider.addEventListener("input", updateLabels);
weightSlider.addEventListener("change", () => {
  clearLesson();
  updateLabels();
  retest();
});

// --- Drag-and-drop: dropping the weight onto the canvas sets a new load
// column there and reruns the whole cycle from scratch. ---

// Converts a point in page coordinates to the nearest domain column, or null
// if the point isn't over the scene at all. Only the horizontal position is
// used — a dropped weight always rests on top of the structure, never
// inside it (an interior point load is a real FEM stress singularity) — and
// a drop beside the bridge snaps to its nearest end.
function clientPointToColumn(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const relX = (clientX - rect.left) / rect.width;
  const relY = (clientY - rect.top) / rect.height;
  if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return null;

  const column = Math.round(((relX * SCENE_W - DOMAIN.x) / DOMAIN.w) * numElemX);
  return Math.min(numElemX, Math.max(0, column));
}

// The dragged weight is a free-floating copy on <body>, not the handle
// itself: the panel is transformed/blurred, which would make a
// position:fixed child position itself relative to the panel instead of the
// viewport.
//
// Move/up/cancel are listened for on the WINDOW for the length of a drag,
// rather than relying on pointer capture on the handle: if the browser
// cancels the gesture or the release lands somewhere unexpected, capture can
// silently drop the release, leaving the copy stuck on screen and nothing
// started. A cancel is treated as a drop where the pointer last was.
let ghost = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastX = 0;
let lastY = 0;

function onDragMove(event) {
  lastX = event.clientX;
  lastY = event.clientY;
  ghost.style.left = `${lastX - dragOffsetX}px`;
  ghost.style.top = `${lastY - dragOffsetY}px`;
}

function endDrag(drop) {
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragUp);
  window.removeEventListener("pointercancel", onDragUp);
  if (ghost) ghost.remove();
  ghost = null;
  if (!drop) return;

  const column = clientPointToColumn(lastX, lastY);
  if (column !== null) runFullCycle(column);
}

function onDragUp(event) {
  lastX = event.clientX;
  lastY = event.clientY;
  endDrag(true);
}

handle.addEventListener("dragstart", (event) => event.preventDefault());
handle.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (ghost) endDrag(false); // a stale copy from a drag that never ended

  const rect = handle.getBoundingClientRect();
  dragOffsetX = event.clientX - rect.left;
  dragOffsetY = event.clientY - rect.top;
  lastX = event.clientX;
  lastY = event.clientY;
  ghost = document.createElement("div");
  ghost.id = "drag-ghost";
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.style.left = `${rect.left}px`;
  ghost.style.top = `${rect.top}px`;
  document.body.appendChild(ghost);

  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragUp);
  window.addEventListener("pointercancel", onDragUp);
});


// ===== The wall: phone controls and the unattended loop =====
//
// On the Footron wall nobody can touch the page, so a visitor's phone drives
// it (footron.js). When no one has for IDLE_MS, the wall plays the lessons on
// its own, one after another, until the next message or touch arrives.

const onWall = footronEnabled() || /[?&]attract=1/.test(location.search);
const IDLE_MS = 45000;
const ATTRACT_HOLD_MS = 9000; // how long to linger on a finished lesson
let attracting = false;
let idleTimer = null;
let attractTimer = null;
let attractIndex = 0;
const attractBanner = document.getElementById("attract");

function attractStep() {
  if (!attracting) return;
  startLesson(LESSONS[attractIndex++ % LESSONS.length]);
}

// The current run is over; if the wall is playing on its own, line up the next lesson.
function onRunFinished() {
  if (!attracting) return;
  clearTimeout(attractTimer);
  attractTimer = setTimeout(attractStep, ATTRACT_HOLD_MS);
}

function startAttract() {
  attracting = true;
  attractBanner.hidden = false;
  attractStep();
}

// Anyone touching anything ends the unattended loop and restarts the idle clock.
function bumpActivity() {
  if (!onWall) return;
  attracting = false;
  clearTimeout(attractTimer);
  attractBanner.hidden = true;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(startAttract, IDLE_MS);
}

if (onWall) {
  document.body.classList.add("wall");
  for (const type of ["pointerdown", "keydown", "input"]) window.addEventListener(type, bumpActivity, true);
  bumpActivity();
}

// The pending setup a phone builds up before saying "grow". The sliders are the
// source of truth for stone and weight, so the labels on the wall follow along.
let pendingSpot = 0.5;

phone = connectFootron({
  onActivity: bumpActivity,
  onHello: sendPhoneState,
  onSetup(key, value) {
    if (key === "stone") materialSlider.value = String(Math.round(value / 10) * 10);
    else if (key === "weight") weightSlider.value = String(Math.round(value * WEIGHT_SLIDER_MAX));
    else pendingSpot = value;
    clearLesson();
    updateLabels();
  },
  onGrow(setup) {
    if (setup.stone !== undefined) materialSlider.value = String(Math.round(setup.stone / 10) * 10);
    if (setup.weight !== undefined) weightSlider.value = String(Math.round(setup.weight * WEIGHT_SLIDER_MAX));
    if (setup.spot !== undefined) pendingSpot = setup.spot;
    clearLesson();
    updateLabels();
    runFullCycle(spotToColumn(pendingSpot, numElemX));
  },
  onLesson(id) {
    const lesson = LESSONS.find((l) => l.id === id);
    if (lesson) startLesson(lesson);
  },
  onSkip() {
    skip.requested = true;
    report.setSkipVisible(false);
  },
  onScrub(fraction) {
    if (lastPlayback) scrubTo(1 + Math.round(fraction * lastPlayback.frames.length));
  },
  onReplay: togglePlay,
  onTest: testAgain,
  onYourTurn(open) {
    if (open && !challenge.isActive()) enterChallenge();
    else if (!open) challenge.exit();
  },
  onPaint: (x, y, erase) => challenge.paintFraction(x, y, erase),
  onStrokeEnd: challenge.endStroke,
  onBrush: challenge.setBrushSize,
  onClear: challenge.clearDesign,
  onReveal: challenge.setRevealed,
  onTestMine: challenge.testMine,
  onSave: challenge.saveMine,
  onLoadBest: challenge.loadBest,
});
