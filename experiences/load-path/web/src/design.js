// The visitor's own bridge for "beat the algorithm": a plain 0/1 grid they
// paint stone into, limited to the same stone budget the optimizer got.
// Pure logic, no drawing, so the rules can be tested on their own.
import { findConnectedPath } from "./connectivity.js";

// The optimizer never lets a cell reach exactly 0 (see oc.js MIN_DENSITY): a
// truly empty cell has zero stiffness and can make the system singular. The
// same tiny stand-in for "empty" is used here so both bridges are solved by
// exactly the same model.
export const VOID_DENSITY = 0.001;

export function createDesign(numElemX, numElemY) {
  return Array.from({ length: numElemY }, () => new Array(numElemX).fill(0));
}

export function countCells(design) {
  let count = 0;
  for (const row of design) for (const cell of row) count += cell;
  return count;
}

// The optimizer spends exactly volumeFraction * (number of cells) of stone
// (its densities sum to that). The visitor's whole cells get the same count.
export function budgetCells(volumeFraction, numElemX, numElemY) {
  return Math.round(volumeFraction * numElemX * numElemY);
}

// Paints (or erases) every cell within `radius` cells of (elx, ely), nearest
// first, and never spends past `budget`. Returns how many cells changed, so
// the caller knows whether a redraw is needed.
export function paintBrush(design, elx, ely, radius, erase, budget) {
  const numElemY = design.length;
  const numElemX = design[0].length;
  const cells = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const distance = Math.hypot(dx, dy);
      const x = elx + dx;
      const y = ely + dy;
      if (distance > radius + 1e-9 || x < 0 || x >= numElemX || y < 0 || y >= numElemY) continue;
      cells.push({ x, y, distance });
    }
  }
  cells.sort((a, b) => a.distance - b.distance);

  let used = countCells(design);
  let changed = 0;
  for (const { x, y } of cells) {
    if (erase) {
      if (design[y][x] === 1) {
        design[y][x] = 0;
        used--;
        changed++;
      }
    } else if (design[y][x] === 0 && used < budget) {
      design[y][x] = 1;
      used++;
      changed++;
    }
  }
  return changed;
}

export function toDensities(design) {
  return design.map((row) => row.map((cell) => (cell === 1 ? 1 : VOID_DENSITY)));
}

// Where the visitor's bridge stands, so the editor can say exactly what is
// missing. The two support cells are the bottom corners (the pinned nodes'
// only neighbours); the load acts on the top node `loadColumn`, which the two
// top-row cells either side of it touch. A support counts as joined when 8-
// connected stone (a diagonal touch carries force in the continuum FEM) runs
// from its cell to one of those top cells.
export function connectionStatus(design, loadColumn) {
  const numElemY = design.length;
  const numElemX = design[0].length;
  const underLoad = [loadColumn - 1, loadColumn]
    .filter((elx) => elx >= 0 && elx < numElemX)
    .map((elx) => ({ elx, ely: numElemY - 1 }));
  const joined = (support) => underLoad.some((target) => findConnectedPath(design, 0.5, support, target) !== null);

  const leftCell = { elx: 0, ely: 0 };
  const rightCell = { elx: numElemX - 1, ely: 0 };
  return {
    underLoad,
    supportCells: { left: leftCell, right: rightCell },
    leftSupportStone: design[leftCell.ely][leftCell.elx] === 1,
    rightSupportStone: design[rightCell.ely][rightCell.elx] === 1,
    loadTouched: underLoad.some((c) => design[c.ely][c.elx] === 1),
    left: joined(leftCell),
    right: joined(rightCell),
  };
}

// A bridge only works if BOTH supports are joined to the weight by stone.
export function supportsConnected(design, loadColumn) {
  const status = connectionStatus(design, loadColumn);
  return status.left && status.right;
}

// What to tell the visitor while the bridge isn't connected yet: the first
// thing that is actually missing, in the order they would fix it.
export function connectionHint(status) {
  if (!status.leftSupportStone && !status.rightSupportStone) return "Start on the two marked corner cells, right above the support triangles.";
  if (!status.leftSupportStone) return "Lay stone on the marked left corner cell, right above the left support.";
  if (!status.rightSupportStone) return "Lay stone on the marked right corner cell, right above the right support.";
  if (!status.loadTouched) return "Reach the weight: stone must touch the top edge under the arrow.";
  if (!status.left && !status.right) return "Neither support reaches the weight yet: there is a gap in each leg.";
  return `The ${status.left ? "right" : "left"} support isn't joined to the weight yet: there is a gap in that leg.`;
}

// The cells a bridge MUST have stone in (the corner cell above each support, and
// at least one cell under the weight) that are still empty and lie within `reach`
// cells of `cell`. A fingertip on a phone pad covers many grid cells and cannot
// land on one exactly, so the editor lets a phone stroke that passes close to a
// missing required cell fill it in (see paintFraction in challenge.js). Mouse
// painting doesn't use this: a mouse can click the exact cell.
export function nearbyRequiredCells(design, loadColumn, cell, reach) {
  const status = connectionStatus(design, loadColumn);
  const wanted = [];
  if (!status.leftSupportStone) wanted.push(status.supportCells.left);
  if (!status.rightSupportStone) wanted.push(status.supportCells.right);
  if (!status.loadTouched) wanted.push(...status.underLoad);
  return wanted.filter((c) => Math.max(Math.abs(c.elx - cell.elx), Math.abs(c.ely - cell.ely)) <= reach);
}
