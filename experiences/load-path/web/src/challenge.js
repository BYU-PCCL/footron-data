// "Can you beat the algorithm?" — the visitor paints their own bridge onto the
// grid with the same stone budget the optimizer had, and it is judged by
// EXACTLY the same model: the same finite-element solve for the sag, and the
// same stress and buckling check for what it can hold. Nothing here is a
// special scoring rule, so the comparison is fair.
import { DOMAIN, SCENE_W, SCENE_H } from "./scene.js";
import { nodeId, nodeDofs } from "./mesh.js";
import { solveDisplacement } from "./structure.js";
import { computeElementWork } from "./sensitivity.js";
import { renderDensities, renderDeformed, normalizeHeat } from "./render.js";
import { loadCapacityKg } from "./failure.js";
import { MAX_MATERIAL_KG } from "./units.js";
import { setupKey, encodeDesign, decodeDesign, loadBoard, addResult } from "./storage.js";
import { createDesign, countCells, budgetCells, paintBrush, toDensities, supportsConnected, connectionStatus, connectionHint, nearbyRequiredCells } from "./design.js";

const $ = (id) => document.getElementById(id);
const card = $("challenge");

const SOLVE_DELAY_MS = 220; // solve once the visitor pauses, never mid-stroke
const PHONE_SNAP_CELLS = 4; // half a fingertip (~7 cells wide on a phone pad): how close a stroke must pass to a required cell to fill it in
const MAX_DRAWN_SAG = 0.3; // a very soft design is drawn sagging at most this fraction of the domain height

let host = null;
let design = null;
let budget = 0;
let brush = 1;
let eraseMode = false;
let showGhost = false;
let testing = false;
let painting = false;
let strokeErases = false;
let lastCell = null;
let hover = null;
let result = null; // null while unsolved; { connected: false } or { connected: true, ... }
let lastU = null;
let solveTimer = null;
let loadDof = 0;

export function isActive() {
  return host !== null;
}

function cellSize() {
  return { cw: DOMAIN.w / host.numElemX, ch: DOMAIN.h / host.numElemY };
}

// Pointer -> grid cell, through the scene's uniform scaling; null outside.
function cellAt(event) {
  const rect = host.canvas.getBoundingClientRect();
  const sceneX = ((event.clientX - rect.left) / rect.width) * SCENE_W;
  const sceneY = ((event.clientY - rect.top) / rect.height) * SCENE_H;
  const { cw, ch } = cellSize();
  const elx = Math.floor((sceneX - DOMAIN.x) / cw);
  const ely = host.numElemY - 1 - Math.floor((sceneY - DOMAIN.y) / ch);
  if (elx < 0 || elx >= host.numElemX || ely < 0 || ely >= host.numElemY) return null;
  return { elx, ely };
}

function drawGhost(ctx) {
  const { cw, ch } = cellSize();
  ctx.fillStyle = "rgba(230,192,123,0.28)";
  ctx.strokeStyle = "rgba(230,192,123,0.55)";
  ctx.lineWidth = 1;
  const grid = host.algorithm.densities;
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] <= 0.5) continue;
      const px = DOMAIN.x + x * cw;
      const py = DOMAIN.y + (host.numElemY - 1 - y) * ch;
      ctx.fillRect(px, py, cw, ch);
      ctx.strokeRect(px + 0.5, py + 0.5, cw - 1, ch - 1);
    }
  }
}

// The grid, the two supports, the weight's arrow, and the brush ring.
function drawGuides(ctx) {
  const { cw, ch } = cellSize();
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= host.numElemX; x++) {
    ctx.moveTo(DOMAIN.x + x * cw, DOMAIN.y);
    ctx.lineTo(DOMAIN.x + x * cw, DOMAIN.y + DOMAIN.h);
  }
  for (let y = 0; y <= host.numElemY; y++) {
    ctx.moveTo(DOMAIN.x, DOMAIN.y + y * ch);
    ctx.lineTo(DOMAIN.x + DOMAIN.w, DOMAIN.y + y * ch);
  }
  ctx.stroke();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.strokeRect(DOMAIN.x, DOMAIN.y, DOMAIN.w, DOMAIN.h);
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(230,192,123,0.9)";
  for (const x of [DOMAIN.x, DOMAIN.x + DOMAIN.w]) {
    ctx.beginPath();
    ctx.moveTo(x, DOMAIN.y + DOMAIN.h);
    ctx.lineTo(x - 20, DOMAIN.y + DOMAIN.h + 30);
    ctx.lineTo(x + 20, DOMAIN.y + DOMAIN.h + 30);
    ctx.closePath();
    ctx.fill();
  }

  const loadX = DOMAIN.x + host.loadColumn * cw;
  ctx.strokeStyle = "rgba(246,220,157,0.95)";
  ctx.fillStyle = "rgba(246,220,157,0.95)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(loadX, DOMAIN.y - 78);
  ctx.lineTo(loadX, DOMAIN.y - 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(loadX - 13, DOMAIN.y - 24);
  ctx.lineTo(loadX + 13, DOMAIN.y - 24);
  ctx.lineTo(loadX, DOMAIN.y);
  ctx.closePath();
  ctx.fill();
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("weight lands here", loadX, DOMAIN.y - 90);

  // While the bridge isn't connected, mark the cells that must hold stone.
  if (!(result && result.connected)) {
    const status = connectionStatus(design, host.loadColumn);
    const targets = [
      ...(status.leftSupportStone ? [] : [status.supportCells.left]),
      ...(status.rightSupportStone ? [] : [status.supportCells.right]),
      ...(status.loadTouched ? [] : status.underLoad),
    ];
    ctx.strokeStyle = "rgba(255,214,120,0.95)";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    for (const c of targets) {
      ctx.strokeRect(DOMAIN.x + c.elx * cw + 1.5, DOMAIN.y + (host.numElemY - 1 - c.ely) * ch + 1.5, cw - 3, ch - 3);
    }
    ctx.setLineDash([]);
  }

  if (hover && !testing) {
    ctx.strokeStyle = eraseMode ? "rgba(255,140,120,0.9)" : "rgba(255,255,255,0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(DOMAIN.x + (hover.elx + 0.5) * cw, DOMAIN.y + (host.numElemY - 1 - hover.ely + 0.5) * ch, (brush + 0.5) * cw, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// A very soft design can sag by orders of magnitude more than the domain is
// tall; drawn at the run's scale it would fly off the screen, so cap it.
function drawScale(u) {
  let largest = 0;
  for (const v of u) largest = Math.max(largest, Math.abs(v));
  return largest > 0 ? Math.min(host.deformScale, (MAX_DRAWN_SAG * DOMAIN.h) / largest) : 0;
}

function redraw() {
  if (!host || testing) return;
  const ctx = host.ctx;
  if (result && result.connected) {
    renderDeformed(ctx, result.densities, result.u, drawScale(result.u), normalizeHeat(result.work, result.densities));
  } else {
    renderDensities(ctx, toDensities(design));
  }
  if (showGhost) drawGhost(ctx);
  drawGuides(ctx);
}

function sagText(sag) {
  return `${Math.round((sag / host.evenSpreadCompliance) * 100)}%`;
}

function holdText(capacity) {
  if (capacity === 0) return "—";
  return Number.isFinite(capacity) ? `${Math.round(capacity).toLocaleString()} kg` : "no limit";
}

function updateReadout() {
  const used = countCells(design);
  const kg = Math.round((used * MAX_MATERIAL_KG) / (host.numElemX * host.numElemY));
  $("ch-used").textContent = `${used} / ${budget} cells`;
  $("ch-bar").style.width = `${Math.min(100, (used / budget) * 100)}%`;
  $("ch-bar").parentElement.title = `${kg} kg of stone used`;

  $("ch-alg-sag").textContent = sagText(host.algorithmSag);
  $("ch-alg-hold").textContent = holdText(host.algorithm.capacity);

  const verdict = $("ch-verdict");
  verdict.className = "";
  if (used === 0) {
    $("ch-you-sag").textContent = $("ch-you-hold").textContent = "—";
    verdict.textContent = "Paint stone to build your bridge, starting on the marked corner cells.";
  } else if (!supportsConnected(design, host.loadColumn)) {
    $("ch-you-sag").textContent = $("ch-you-hold").textContent = "—";
    verdict.textContent = connectionHint(connectionStatus(design, host.loadColumn));
  } else if (!result || !result.connected) {
    $("ch-you-sag").textContent = $("ch-you-hold").textContent = "…";
    verdict.textContent = "Measuring your bridge…";
  } else {
    $("ch-you-sag").textContent = sagText(result.sag);
    $("ch-you-hold").textContent = holdText(result.capacity);
    const ratio = result.sag / host.algorithmSag;
    const stiffer = ratio < 1;
    const stronger = result.capacity > host.algorithm.capacity;
    verdict.textContent =
      (stiffer
        ? `You beat the algorithm on stiffness: ${Math.round((1 - ratio) * 100)}% less sag.`
        : `The algorithm's bridge sags ${ratio.toFixed(1)}× less than yours.`) +
      (stronger ? " Yours holds more, though." : "");
    verdict.className = stiffer ? "win" : "";
  }
  $("ch-test").disabled = !(result && result.connected) && !testing;
  $("ch-save").disabled = !(result && result.connected);
}

// Solve the visitor's bridge with the same model the optimizer used.
function evaluate() {
  solveTimer = null;
  if (!host) return;
  const { numElemX, numElemY, fixedDofs, loadColumn } = host;
  if (!supportsConnected(design, loadColumn)) {
    result = { connected: false };
  } else {
    const densities = toDensities(design);
    const u = solveDisplacement(numElemX, numElemY, densities, fixedDofs, [[loadDof, -1]], lastU ? { previousU: lastU } : {});
    lastU = u;
    result = {
      connected: true,
      densities,
      u,
      sag: -u[loadDof],
      capacity: loadCapacityKg({ numElemX, numElemY, densities, u, loadColumn }),
      work: computeElementWork(numElemX, numElemY, densities, u),
    };
  }
  redraw();
  updateReadout();
}

function scheduleEvaluate() {
  result = null;
  clearTimeout(solveTimer);
  solveTimer = setTimeout(evaluate, SOLVE_DELAY_MS);
}

function paintAt(cell, erase) {
  const changed = paintBrush(design, cell.elx, cell.ely, brush, erase, budget);
  if (changed > 0) scheduleEvaluate();
  return changed;
}

// Fills in the cells between two pointer samples, so a fast stroke leaves no gaps.
function paintLine(from, to, erase) {
  const steps = Math.max(Math.abs(to.elx - from.elx), Math.abs(to.ely - from.ely), 1);
  for (let i = 1; i <= steps; i++) {
    paintAt({ elx: Math.round(from.elx + ((to.elx - from.elx) * i) / steps), ely: Math.round(from.ely + ((to.ely - from.ely) * i) / steps) }, erase);
  }
}

function onDown(event) {
  if (testing) return;
  const cell = cellAt(event);
  if (!cell) return;
  event.preventDefault();
  painting = true;
  strokeErases = eraseMode || event.shiftKey || event.button === 2;
  host.canvas.setPointerCapture(event.pointerId);
  lastCell = cell;
  paintAt(cell, strokeErases);
  redraw();
  updateReadout();
}

function onMove(event) {
  if (testing) return;
  hover = cellAt(event);
  if (painting && hover) {
    paintLine(lastCell, hover, strokeErases);
    lastCell = hover;
    updateReadout();
  }
  redraw();
}

function onUp() {
  painting = false;
  lastCell = null;
}

function onLeave() {
  hover = null;
  redraw();
}

const noMenu = (event) => event.preventDefault();

function setBrush(size) {
  brush = Math.max(0, Math.min(4, size));
  $("ch-brush").textContent = `brush ${brush + 1}`;
}

function resetDesign() {
  design = createDesign(host.numElemX, host.numElemY);
  result = null;
  lastU = null;
  clearTimeout(solveTimer);
}

function setTesting(value) {
  testing = value;
  $("ch-test").textContent = value ? "Back to editing" : "Test my bridge";
  if (!value) redraw();
  updateReadout();
}

// localStorage can throw just by being touched (blocked site data), so it is only
// handed to storage.js, which guards every call.
function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {} };
  }
}

function boardKey() {
  return setupKey(host.materialKg, host.loadColumn);
}

// The best bridges saved for this exact stone and spot; click one to load it.
function renderBoard() {
  const list = $("ch-board-list");
  list.replaceChildren();
  const board = loadBoard(browserStorage(), boardKey());
  $("ch-board-title").textContent = `Best for ${host.materialKg} kg at this spot`;
  if (board.length === 0) {
    const empty = document.createElement("div");
    empty.id = "ch-board-empty";
    empty.textContent = "Nothing saved yet. Build a bridge and save it.";
    list.appendChild(empty);
    return;
  }
  board.forEach((entry, i) => {
    const button = document.createElement("button");
    button.title = "Load this bridge into the editor";
    button.innerHTML = '<span class="rank"></span><span class="kg"></span><span class="sag"></span>';
    button.children[0].textContent = `#${i + 1}`;
    button.children[1].textContent = `${Math.round(entry.capacityKg).toLocaleString()} kg`;
    button.children[2].textContent = `sag ${entry.sagPct}%`;
    button.addEventListener("click", () => loadSaved(entry));
    list.appendChild(button);
  });
}

function loadSaved(entry) {
  const loaded = decodeDesign(entry.cells, host.numElemX, host.numElemY);
  if (!loaded || testing) return;
  design = loaded;
  scheduleEvaluate();
  redraw();
  updateReadout();
}

function saveCurrent() {
  if (!result || !result.connected) return;
  const { board, rank } = addResult(browserStorage(), boardKey(), {
    capacityKg: result.capacity,
    sagPct: Math.round((result.sag / host.evenSpreadCompliance) * 100),
    cells: encodeDesign(design),
    when: Date.now(),
  });
  renderBoard();
  const verdict = $("ch-verdict");
  verdict.className = rank === 1 ? "win" : "";
  verdict.textContent =
    rank === null
      ? `Saved, but the ${board.length} best bridges for this setup all hold more.`
      : rank === 1
        ? "Saved as the best bridge for this setup!"
        : `Saved as #${rank} for this setup.`;
}

// --- The editor's actions. The buttons and the phone (footron.js) both call
// these, so a phone can do exactly what the buttons on the card do. ---

export function clearDesign() {
  if (!host) return;
  if (testing) host.stopTest();
  setTesting(false);
  resetDesign();
  redraw();
  updateReadout();
}

export function setRevealed(value) {
  if (!host) return;
  showGhost = value;
  $("ch-reveal").textContent = showGhost ? "Hide algorithm" : "Reveal algorithm";
  redraw();
}

// Drop the weight on the visitor's bridge, or go back to editing it.
export function testMine() {
  if (!host) return;
  if (testing) {
    host.stopTest();
    setTesting(false);
  } else if (result && result.connected) {
    setTesting(true);
    host.runTest(result.densities, result.u);
  }
}

export function saveMine() {
  if (host) saveCurrent();
}

export function loadBest(rank) {
  if (!host) return;
  const entry = loadBoard(browserStorage(), boardKey())[rank - 1];
  if (entry) loadSaved(entry);
}

export function setBrushSize(size) {
  if (host) setBrush(size);
}

// A point of a stroke from the phone: x and y are fractions of the design area
// (y from the top), so the phone never needs to know the grid size. Consecutive
// points are joined, like a finger dragging on the wall itself.
let phoneLast = null;
export function paintFraction(x, y, erase) {
  if (!host || testing) return;
  const cell = {
    elx: Math.min(host.numElemX - 1, Math.floor(x * host.numElemX)),
    ely: host.numElemY - 1 - Math.min(host.numElemY - 1, Math.floor(y * host.numElemY)),
  };
  if (phoneLast) paintLine(phoneLast, cell, erase);
  else paintAt(cell, erase);
  // A fingertip can't land on one 5px grid cell, so a stroke that passes near a
  // corner cell or the spot under the weight is extended to it with a painted
  // line -- not just a single isolated cell, which would satisfy the "has
  // stone" check without actually joining it to the rest of the stroke.
  if (!erase) for (const required of nearbyRequiredCells(design, host.loadColumn, cell, PHONE_SNAP_CELLS)) paintLine(cell, required, false);
  phoneLast = cell;
  hover = cell;
  redraw();
  updateReadout();
}

export function endStroke() {
  phoneLast = null;
  hover = null;
  if (host) redraw();
}

// Leaves the editor and returns to the algorithm's bridge (the "Back" button).
export function exit() {
  if (!host) return;
  const callback = host.onExit;
  leave();
  callback();
}

let bound = false;
function bindOnce() {
  if (bound) return;
  bound = true;
  $("ch-brush-minus").addEventListener("click", () => setBrush(brush - 1));
  $("ch-brush-plus").addEventListener("click", () => setBrush(brush + 1));
  $("ch-erase").addEventListener("click", () => {
    eraseMode = !eraseMode;
    $("ch-erase").classList.toggle("on", eraseMode);
  });
  $("ch-clear").addEventListener("click", clearDesign);
  $("ch-reveal").addEventListener("click", () => setRevealed(!showGhost));
  $("ch-test").addEventListener("click", testMine);
  $("ch-save").addEventListener("click", saveCurrent);
  $("ch-collapse").addEventListener("click", (event) => {
    const collapsed = card.classList.toggle("collapsed");
    event.currentTarget.textContent = collapsed ? "+" : "–";
  });
  $("ch-back").addEventListener("click", exit);
}

// Opens the editor over the finished run: an empty grid, the same stone
// budget the algorithm had.
export function enterChallenge(hostContext) {
  bindOnce();
  host = hostContext;
  host.algorithmSag = -host.algorithm.u[nodeDofs(nodeId(host.loadColumn, host.numElemY, host.numElemX))[1]];
  loadDof = nodeDofs(nodeId(host.loadColumn, host.numElemY, host.numElemX))[1];
  budget = budgetCells(host.volumeFraction, host.numElemX, host.numElemY);
  showGhost = false;
  eraseMode = false;
  testing = false;
  card.classList.remove("collapsed");
  $("ch-collapse").textContent = "–";
  hover = null;
  $("ch-reveal").textContent = "Reveal algorithm";
  $("ch-erase").classList.remove("on");
  $("ch-test").textContent = "Test my bridge";
  setBrush(1);
  resetDesign();

  // On the wall there is no mouse or touchscreen at all — a phone is the only
  // input there is — so this is more than a convenience: leaving these bound
  // would mean the canvas keeps reacting to a pointer that, on real hardware,
  // physically cannot exist. host.wallMode also gates every other pointer
  // surface (the drag-and-drop handle, the sliders) the same way; this is the
  // one this module owns.
  const { canvas } = host;
  if (!host.wallMode) {
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("contextmenu", noMenu);
    canvas.style.cursor = "crosshair";
    canvas.style.pointerEvents = "auto";
    // Without this a touch drag scrolls or zooms the page instead of painting.
    canvas.style.touchAction = "none";
  }
  card.hidden = false;
  renderBoard();
  redraw();
  updateReadout();
}

// Closes the editor without touching the canvas (a new run is about to take it).
export function leave() {
  if (!host) return;
  clearTimeout(solveTimer);
  phoneLast = null;
  const { canvas } = host;
  canvas.removeEventListener("pointerdown", onDown);
  canvas.removeEventListener("pointermove", onMove);
  canvas.removeEventListener("pointerup", onUp);
  canvas.removeEventListener("pointercancel", onUp);
  canvas.removeEventListener("pointerleave", onLeave);
  canvas.removeEventListener("contextmenu", noMenu);
  canvas.style.cursor = "";
  canvas.style.touchAction = "";
  card.hidden = true;
  painting = false;
  host = null;
}
