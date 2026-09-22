import { findConnectedPath } from "./connectivity.js";
import { elementDofs } from "./mesh.js";
import { maxPrincipalStress } from "./stress.js";
import { rectMomentOfInertia, eulerCriticalLoad, resolveTrussAxialForces } from "./buckling.js";
import { kgToNewtons, stressScaleFactor, STONE_TENSILE_STRENGTH_PA, STONE_COMPRESSIVE_STRENGTH_PA, STONE_ELASTIC_MODULUS_PA, BRIDGE_SPAN_M, BRIDGE_RISE_M, BRIDGE_DEPTH_M } from "./units.js";

const DENSITY_THRESHOLD = 0.5;

function isSolid(densities, numElemX, numElemY, elx, ely) {
  return elx >= 0 && elx < numElemX && ely >= 0 && ely < numElemY && densities[ely][elx] > DENSITY_THRESHOLD;
}

function closestCell(cells, targetElx, targetEly) {
  let best = null;
  let bestDist = Infinity;
  for (const cell of cells) {
    const dist = (cell.elx - targetElx) ** 2 + (cell.ely - targetEly) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = cell;
    }
  }
  return best;
}

// The geometry for one half — its solid cells, endpoints, real length and
// angle. Shared by the strength check, the buckling check, and by
// collapse.js when it needs the same endpoints to place the physics body,
// so all three always agree on what "this half" actually is.
export function halfGeometry(numElemX, numElemY, densities, columnFilter, supportElx, loadColumn) {
  const cellWidthM = Math.min(BRIDGE_SPAN_M / numElemX, BRIDGE_RISE_M / numElemY);
  const cells = [];
  for (let ely = 0; ely < numElemY; ely++) {
    for (let elx = 0; elx < numElemX; elx++) {
      if (!isSolid(densities, numElemX, numElemY, elx, ely) || !columnFilter(elx)) continue;
      cells.push({ elx, ely });
    }
  }
  if (cells.length === 0) return null;

  const bottomCell = closestCell(cells, supportElx, 0);
  const topCell = closestCell(cells, loadColumn, numElemY);

  const connection = findConnectedPath(densities, DENSITY_THRESHOLD, bottomCell, topCell);
  if (!connection) return null;

  const gridLength = Math.hypot(topCell.elx - bottomCell.elx, topCell.ely - bottomCell.ely);
  const angle = Math.atan2(topCell.ely - bottomCell.ely, topCell.elx - bottomCell.elx);

  return { cells, bottomCell, topCell, gridLength, lengthM: gridLength * cellWidthM, angle, cellWidthM };
}

// The worst (highest stress-to-capacity ratio) element anywhere in this
// half's real, irregular material — a true per-point check, not an
// average, so a local pinch point can't be hidden by wider material
// elsewhere. Units: maxPrincipalStress is computed with E=1 in the unit
// model (element size 1, thickness 1), so it's stress per unit force in
// MODEL units — dividing by capacity (Pa) gives a ratio that the caller
// turns into a real, dimensionless one by multiplying by the real force
// (N) AND stressScaleFactor (1 / (thickness x element size), see
// units.js). >1 means failure.
function cellStressRatioPerNewton(numElemX, densities, u, cell) {
  const u_e = elementDofs(cell.elx, cell.ely, numElemX).map((dof) => u[dof]);
  const stressPerNewton = maxPrincipalStress(u_e, 1, 0.3);
  const capacity = STONE_TENSILE_STRENGTH_PA * densities[cell.ely][cell.elx]; // porous-material scaling, as used throughout
  return capacity > 0 ? stressPerNewton / capacity : 0;
}

// Returns the worst ratio AND the cell it happens in — where a strength
// failure would start.
function worstStressToCapacityRatio(numElemX, densities, u, cells) {
  let worst = 0;
  let worstCell = cells[0];
  for (const cell of cells) {
    const ratio = cellStressRatioPerNewton(numElemX, densities, u, cell);
    if (ratio > worst) {
      worst = ratio;
      worstCell = cell;
    }
  }
  return { worst, cell: worstCell };
}

// The solid cell nearest the middle of a half's support-to-load line: where a
// strut that buckles or crushes bows out the most, since neither has a single
// weakest element to blame.
function midCell(half) {
  const midX = (half.bottomCell.elx + half.topCell.elx) / 2;
  const midY = (half.bottomCell.ely + half.topCell.ely) / 2;
  return closestCell(half.cells, midX, midY);
}

// The stress ratio of every solid cell at a given test weight — the map of
// how close each bit of stone is to its tensile limit (1 = at the limit). It
// is the very same per-cell number the strength check takes the maximum of,
// so its maximum IS the strength ratio evaluateHalves reports.
export function stressRatioMap({ numElemX, numElemY, densities, u, testWeightKg }) {
  const cellWidthM = Math.min(BRIDGE_SPAN_M / numElemX, BRIDGE_RISE_M / numElemY);
  const scale = kgToNewtons(testWeightKg) * stressScaleFactor(cellWidthM);
  return densities.map((row, ely) =>
    row.map((density, elx) => (density > DENSITY_THRESHOLD ? Math.max(0, cellStressRatioPerNewton(numElemX, densities, u, { elx, ely })) * scale : 0))
  );
}

// Whether each half holds under a given real test weight — checking BOTH
// a strength failure (material exceeding stone's real tensile strength
// somewhere) and a buckling failure (the whole strut suddenly bending
// sideways under compression, which for a long thin member can happen
// well before the material itself is overstressed). Either one failing
// means that half fails.
export function evaluateHalves({ numElemX, numElemY, densities, u, loadColumn, testWeightKg }) {
  // loadColumn is a NODE index (0..numElemX), not an element index —
  // element `elx` spans nodes [elx, elx+1], so the element immediately
  // left of the load node is elx = loadColumn-1, not loadColumn. Element
  // elx's mirror image around a centered load is (numElemX-1-elx); the
  // split below (elx < loadColumn goes left, elx >= loadColumn goes
  // right) is exactly the set-level mirror of that, with no column
  // double-counted or dropped. An earlier version used <=/> here, which
  // handed the column of elements straddling the load entirely to one
  // side and broke left-right symmetry (caught by the symmetry test
  // below) for a centered load.
  const left = halfGeometry(numElemX, numElemY, densities, (elx) => elx < loadColumn, 0, loadColumn);
  const right = halfGeometry(numElemX, numElemY, densities, (elx) => elx >= loadColumn, numElemX, loadColumn);

  if (!left || !right) return { ok: false, left, right };

  const appliedForceN = kgToNewtons(testWeightKg);
  const axial = resolveTrussAxialForces(left.angle, right.angle, appliedForceN);

  function evaluateOne(half, axialForceN) {
    const worstStress = worstStressToCapacityRatio(numElemX, densities, u, half.cells);
    const stressRatio = worstStress.worst * appliedForceN * stressScaleFactor(half.cellWidthM);
    const strengthFails = stressRatio > 1;

    const totalDensitySum = half.cells.reduce((sum, cell) => sum + densities[cell.ely][cell.elx], 0);
    const avgWidthM = (totalDensitySum * half.cellWidthM) / half.gridLength;
    const momentOfInertia = Math.min(
      rectMomentOfInertia(avgWidthM, BRIDGE_DEPTH_M), // buckling in-plane (bends the wide way)
      rectMomentOfInertia(BRIDGE_DEPTH_M, avgWidthM) // buckling out-of-plane (bends through the depth)
    );
    const criticalLoadN = eulerCriticalLoad(STONE_ELASTIC_MODULUS_PA, momentOfInertia, half.lengthM);
    const bucklingFails = axialForceN > 0 && axialForceN > criticalLoadN;

    // Crushing: the strut's compressive force over its mean cross-section,
    // against stone's compressive strength. Deliberately NOT a per-element
    // FEM check like the tension one: a point load or a pinned support makes
    // the compressive stress in the one element beside it a mesh-dependent
    // singularity (it grows as the mesh is refined), which would drag every
    // design's capacity down to the same meaningless number. The mean section
    // is the same idealization the buckling check uses.
    const crossSectionM2 = avgWidthM * BRIDGE_DEPTH_M;
    const crushingStressPa = axialForceN > 0 ? axialForceN / crossSectionM2 : 0;
    const crushingFails = crushingStressPa > STONE_COMPRESSIVE_STRENGTH_PA;

    const fails = strengthFails || bucklingFails || crushingFails;
    // Where it starts to go. A strength failure starts at the worst-stressed
    // cell; a buckling or crushing failure has no single weakest element, so
    // it starts mid-strut, where the strut bows out the most.
    const origin = !fails ? null : strengthFails ? { cell: worstStress.cell, kind: "tension" } : { cell: midCell(half), kind: bucklingFails ? "buckling" : "crushing" };

    return {
      fails,
      origin,
      strengthFails,
      bucklingFails,
      crushingFails,
      stressRatio,
      axialForceN,
      criticalLoadN,
      crossSectionM2,
      crushingStressPa,
    };
  }

  return {
    ok: true,
    left: { ...left, ...evaluateOne(left, axial.left) },
    right: { ...right, ...evaluateOne(right, axial.right) },
  };
}

// The heaviest test weight (kg) this shape holds — exactly, not by search —
// and what limits it. The stress ratio, the truss axial force and the
// crushing stress are all linear in the applied force, and the buckling and
// crushing limits don't depend on it, so evaluating once at a reference
// weight gives every threshold in closed form: strength = reference /
// stressRatio, buckling = reference * critical / axial, crushing = reference
// * (strength * area) / axial. evaluateHalves fails a half exactly when any
// ratio exceeds 1, so a weight above the capacity fails and one below holds.
// kg is 0 for a shape whose halves aren't connected, Infinity if nothing
// limits it. mode is "tension", "buckling" or "crushing".
export function loadLimit({ numElemX, numElemY, densities, u, loadColumn }) {
  const REFERENCE_KG = 1000;
  const result = evaluateHalves({ numElemX, numElemY, densities, u, loadColumn, testWeightKg: REFERENCE_KG });
  if (!result.ok) return { kg: 0, mode: null, side: null };

  let best = { kg: Infinity, mode: null, side: null };
  for (const [side, half] of [["left", result.left], ["right", result.right]]) {
    const limits = [
      ["tension", half.stressRatio > 0 ? REFERENCE_KG / half.stressRatio : Infinity],
      ["buckling", half.axialForceN > 0 ? (REFERENCE_KG * half.criticalLoadN) / half.axialForceN : Infinity],
      [
        "crushing",
        half.axialForceN > 0 ? (REFERENCE_KG * STONE_COMPRESSIVE_STRENGTH_PA * half.crossSectionM2) / half.axialForceN : Infinity,
      ],
    ];
    for (const [mode, kg] of limits) if (kg < best.kg) best = { kg, mode, side };
  }
  return best;
}

export function loadCapacityKg(params) {
  return loadLimit(params).kg;
}
