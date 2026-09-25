// The growth report card: live numbers from the optimizer, the four steps of
// its loop, a scrubber over every recorded iteration, and what the finished
// bridge can carry. Everything shown is real data from the run — nothing is
// decorative.
//
// "Sag under load" is the compliance. With a single unit load, compliance
// (f . u) is literally the vertical displacement of the loaded point, so
// "100% -> 14%" means the bridge now sags to 14% of what it did when the
// stone was first spread evenly. Total stone never changes during a run: the
// optimizer only moves it.
import { HEAT_STOPS } from "./render.js";

const $ = (id) => document.getElementById(id);
const card = $("report");
const iterEl = $("rep-iter");
const stoneEl = $("rep-stone");
const sagEl = $("rep-sag");
const noteEl = $("rep-note");
const spark = $("rep-spark");
const stagesEl = $("rep-stages");
const scrub = $("rep-scrub");
const playBtn = $("rep-play");
const skipBtn = $("rep-skip");
const testBtn = $("rep-test");
const challengeBtn = $("rep-challenge");
const resultEl = $("rep-result");

$("rep-legend").style.background = `linear-gradient(90deg, ${HEAT_STOPS.map(
  ([t, c]) => `rgb(${c[0]},${c[1]},${c[2]}) ${t * 100}%`
).join(", ")})`;

let history = [];

// The heat ramp means different things in different views: how hard the stone
// is working while the bridge grows, how close it is to breaking once it has.
export function setLegend(mode) {
  $("rep-legend-lo").textContent = mode === "stress" ? "safe" : "idle";
  $("rep-legend-hi").textContent = mode === "stress" ? "at its limit" : "carrying load";
}

export function showReport() {
  card.classList.remove("hidden");
}

export function hideReport() {
  card.classList.add("hidden");
}

// Wires the interactive bits once; main.js supplies what each does.
export function bindControls({ onScrub, onPlay, onSkip, onTest, onChallenge }) {
  scrub.addEventListener("input", () => onScrub(Number(scrub.value)));
  playBtn.addEventListener("click", onPlay);
  skipBtn.addEventListener("click", onSkip);
  testBtn.addEventListener("click", onTest);
  challengeBtn.addEventListener("click", onChallenge);
}

// Highlights one step of the optimizer's loop (1-4), or shows the loop as a
// whole (null) once the explanation has been sped past.
export function setStage(stage, note) {
  stagesEl.classList.toggle("looping", stage === null);
  for (const li of stagesEl.children) li.classList.toggle("active", Number(li.dataset.n) === stage);
  if (note !== undefined) noteEl.textContent = note;
}

export function setSkipVisible(visible) {
  skipBtn.hidden = !visible;
}

export function setPlaying(playing) {
  playBtn.textContent = playing ? "❚❚" : "▶";
}

// The scrubber runs over every recorded iteration plus one more position for
// the finished result.
export function setScrubber({ max, value, enabled }) {
  scrub.max = String(max);
  scrub.value = String(value);
  scrub.disabled = !enabled;
  playBtn.disabled = !enabled;
  testBtn.hidden = !enabled;
  challengeBtn.hidden = !enabled;
}

export function setNote(text) {
  noteEl.textContent = text;
}

export function resetForRun() {
  history = [];
  setLegend("energy");
  setScrubber({ max: 1, value: 1, enabled: false });
  setPlaying(false);
  resultEl.hidden = true;
  setSkipVisible(false);
  setStage(null, "");
}

// What the optimizer is doing right now, in words, from how much it is
// still moving stone around.
function narrate({ iteration, maxChange, converged, finished }) {
  if (converged) return "Settled: no stone left worth moving.";
  if (finished) return "Stopped at the iteration limit. The shape has stopped changing.";
  if (iteration <= 2) return "Stone spread evenly. Measuring where it strains.";
  if (maxChange > 0.1) return "Moving stone from idle areas to where it carries load.";
  return "Fine-tuning the edges.";
}

function drawSparkline(marker) {
  const ctx = spark.getContext("2d");
  const w = spark.width;
  const h = spark.height;
  ctx.clearRect(0, 0, w, h);
  if (history.length < 2) return;

  const start = history[0];
  const pad = 8;
  const x = (i) => pad + (i / Math.max(1, history.length - 1)) * (w - 2 * pad);
  const y = (c) => pad + (1 - Math.min(1, c / start)) * (h - 2 * pad);

  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y(start));
  ctx.lineTo(w - pad, y(start));
  ctx.stroke();

  const fill = ctx.createLinearGradient(0, 0, 0, h);
  fill.addColorStop(0, "rgba(230,192,123,0.35)");
  fill.addColorStop(1, "rgba(230,192,123,0)");
  ctx.beginPath();
  ctx.moveTo(x(0), h - pad);
  history.forEach((c, i) => ctx.lineTo(x(i), y(c)));
  ctx.lineTo(x(history.length - 1), h - pad);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.beginPath();
  history.forEach((c, i) => (i === 0 ? ctx.moveTo(x(i), y(c)) : ctx.lineTo(x(i), y(c))));
  ctx.strokeStyle = "#e6c07b";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.stroke();

  const at = Math.min(history.length - 1, Math.max(0, marker));
  ctx.beginPath();
  ctx.arc(x(at), y(history[at]), 5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff4dc";
  ctx.fill();
}

function setSag(index) {
  const ratio = history[Math.min(history.length - 1, index)] / history[0];
  sagEl.textContent = `100% → ${Math.round(ratio * 100)}%`;
}

export function updateReport({ iteration, compliance, maxChange, converged, finished, materialKg }) {
  history.push(compliance);
  iterEl.textContent = `iteration ${iteration}`;
  stoneEl.textContent = `${materialKg} kg, unchanged`;
  setSag(history.length - 1);
  noteEl.textContent = narrate({ iteration, maxChange, converged, finished });
  drawSparkline(history.length - 1);
}

// Which recorded iteration is on screen while scrubbing or replaying;
// `index` is 1-based, and history.length + 1 means the finished result.
export function setMarker(index) {
  const isResult = index > history.length;
  iterEl.textContent = isResult ? "result" : `iteration ${index} / ${history.length}`;
  setLegend(isResult ? "stress" : "energy");
  setSag(isResult ? history.length - 1 : index - 1);
  drawSparkline(isResult ? history.length - 1 : index - 1);
  scrub.value = String(index);
  noteEl.textContent = isResult
    ? "Result: how close each stone is to breaking at the test weight."
    : index === 1
      ? "Stone spread evenly: the most it will ever sag."
      : `Iteration ${index}: sagging ${Math.round((history[index - 1] / history[0]) * 100)}% of the start.`;
}

// What the finished bridge can carry, from failure.js's exact capacity.
export function showResult({ holds, limit, efficiency, safety, safe }) {
  resultEl.hidden = false;
  $("rep-holds").textContent = holds;
  $("rep-limit").textContent = limit;
  $("rep-eff").textContent = efficiency;
  updateSafety({ safety, safe });
}

// The test weight changed without regrowing: only the safety line moves.
export function updateSafety({ safety, safe }) {
  const safetyEl = $("rep-safety");
  safetyEl.textContent = safety;
  safetyEl.className = safe ? "ok" : "warn";
}
