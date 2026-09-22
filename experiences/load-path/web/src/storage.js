// The visitor's saved bridges: a small leaderboard per setup (stone budget +
// where the weight lands), kept in the browser so it survives reloads on the
// wall. Everything takes the storage object as an argument, so it runs
// unchanged in Node tests with a stand-in, and every read/write is guarded:
// storage can be unavailable or full (private windows, blocked site data),
// and that must never break the page.
const KEY = "loadpath.best.v1";
const MAX_PER_SETUP = 5;

// Bridges are only comparable when they had the same stone and the same load
// spot, so each such pair gets its own board.
export function setupKey(materialKg, column) {
  return `${materialKg}kg@${column}`;
}

export function encodeDesign(design) {
  return design.map((row) => row.join("")).join("|");
}

// Back to a grid, or null if the text isn't a design of exactly this size.
export function decodeDesign(text, numElemX, numElemY) {
  if (typeof text !== "string") return null;
  const rows = text.split("|");
  if (rows.length !== numElemY || rows.some((row) => !/^[01]+$/.test(row) || row.length !== numElemX)) return null;
  return rows.map((row) => Array.from(row, Number));
}

function readAll(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function loadBoard(storage, key) {
  const board = readAll(storage)[key];
  return Array.isArray(board) ? board : [];
}

// Adds a result (best capacity first, at most MAX_PER_SETUP, identical designs
// kept once) and returns the new board and this result's 1-based rank, or
// rank null if it didn't make the cut or isn't a finite, positive capacity.
export function addResult(storage, key, entry) {
  const board = loadBoard(storage, key);
  if (!Number.isFinite(entry.capacityKg) || entry.capacityKg <= 0) return { board, rank: null };

  const existing = board.findIndex((e) => e.cells === entry.cells);
  const others = board.filter((e) => e.cells !== entry.cells);
  // A better score for the same design replaces it; a worse or equal one changes nothing.
  const kept = existing >= 0 && board[existing].capacityKg >= entry.capacityKg ? board[existing] : entry;
  const next = [...others, kept].sort((a, b) => b.capacityKg - a.capacityKg).slice(0, MAX_PER_SETUP);
  const rank = next.indexOf(kept) + 1;

  try {
    const all = readAll(storage);
    all[key] = next;
    storage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage full or blocked: the board just won't persist this time.
  }
  return { board: next, rank: rank > 0 ? rank : null };
}
