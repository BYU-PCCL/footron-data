import { solveDisplacement } from "./structure.js";
import { computeSensitivities, computeElementWork } from "./sensitivity.js";
import { filterSensitivities } from "./filter.js";
import { updateDensities } from "./oc.js";

// Compliance = f . u, the load dotted with the resulting displacement — a
// measure of how much the structure "gives" under the load (lower is
// stiffer, better). This is the actual quantity the optimizer is minimizing,
// so whether it decreases and settles is the real test of correctness — a
// far more reliable signal than whether the resulting shape *looks* like a
// clean truss, which depends on mesh resolution and volume fraction and can
// be misleading.
function computeCompliance(loads, u) {
  return loads.reduce((sum, [dof, value]) => sum + value * u[dof], 0);
}

// The full topology-optimization loop, one iteration per yield: solve for
// displacement under the current material distribution, work out which
// elements matter (sensitivity), smooth that out (filter), and shift
// material toward the elements that matter most (OC update). Exposed as a
// generator — rather than a function that just returns the final result —
// so a renderer can draw every intermediate step (watching the structure
// take shape) instead of only ever seeing the converged end state.
export function* iterateTopologyOptimization(numElemX, numElemY, fixedDofs, loads, options = {}) {
  const {
    volumeFraction = 0.5,
    rmin = 1.5,
    move = 0.2,
    maxIterations = 100,
    // 0.01 sounds like the more careful choice, but the OC method
    // oscillates by a few thousandths near convergence and can simply
    // never satisfy that tight a bound — measured on a 60x30 mesh at
    // volumeFraction 0.7: 0.01 ran the full 100-iteration cap without
    // ever converging (11.8s), while 0.02 converged in 36 iterations
    // (4.6s) at virtually identical final compliance (7.217 vs 7.213).
    // The extra 64 iterations weren't buying a better answer, just
    // spinning on noise.
    tolerance = 0.02,
    // The "no cell moved more than `tolerance`" test can fail forever even
    // though the design has long since settled: at higher volume fractions a
    // few boundary cells can flip back and forth by the full move limit every
    // iteration (a limit cycle), pinning maxChange at `move` while the
    // compliance sits still to a few thousandths of a percent — measured at
    // 1250kg, load column 8: compliance within 0.1% by iteration 5, but
    // maxChange stuck at 0.2 through all 100 iterations. So the objective
    // stopping improving counts as converged too: once at least
    // `stagnationMinIteration` iterations have run, the last
    // `stagnationWindow` compliances all within `stagnationTolerance`
    // (relative) of each other. 0.3% because a limit-cycling run's
    // compliance still wobbles by about 0.13% (1250kg, load column 20: 6.975
    // to 6.985), which a 0.1% bound never accepts. The late minimum keeps
    // ordinary runs, which converge on maxChange by themselves, unchanged.
    stagnationMinIteration = 25,
    stagnationWindow = 10,
    stagnationTolerance = 3e-3,
  } = options;

  let densities = Array.from({ length: numElemY }, () => new Array(numElemX).fill(volumeFraction));
  let previousU;
  const complianceHistory = [];

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const u = solveDisplacement(numElemX, numElemY, densities, fixedDofs, loads, { previousU });
    previousU = u;
    const compliance = computeCompliance(loads, u);
    // Per-element work at the densities this solve used (before the update
    // below), for drawing where the structure is actually carrying load.
    const strainEnergy = computeElementWork(numElemX, numElemY, densities, u);
    const dc = computeSensitivities(numElemX, numElemY, densities, u);
    const dcFiltered = filterSensitivities(numElemX, numElemY, densities, dc, rmin);
    const solvedDensities = densities; // what this iteration's solve (u, strainEnergy) actually used
    const newDensities = updateDensities(numElemX, numElemY, densities, dcFiltered, volumeFraction, move);

    let maxChange = 0;
    for (let ely = 0; ely < numElemY; ely++) {
      for (let elx = 0; elx < numElemX; elx++) {
        maxChange = Math.max(maxChange, Math.abs(newDensities[ely][elx] - densities[ely][elx]));
      }
    }

    densities = newDensities;
    complianceHistory.push(compliance);
    const recent = complianceHistory.slice(-stagnationWindow);
    const stalled =
      iteration + 1 >= stagnationMinIteration &&
      recent.length === stagnationWindow &&
      (Math.max(...recent) - Math.min(...recent)) / Math.max(...recent) < stagnationTolerance;
    const converged = maxChange < tolerance || stalled;
    // Also the last iteration when the cap is hit without converging: the
    // caller needs one final, consistent frame either way, not a generator
    // that just runs out.
    const finished = converged || iteration === maxIterations - 1;

    // u above was solved for the density BEFORE this iteration's update,
    // not the newDensities being yielded now — fine for the animation
    // (they're one step apart, visually indistinguishable), but stress
    // recovery on the final shape needs u that actually matches the exact
    // densities returned, so re-solve once, warm-started from u (cheap:
    // density barely moved on the very last step).
    const finalU = finished ? solveDisplacement(numElemX, numElemY, densities, fixedDofs, loads, { previousU: u }) : u;

    yield {
      densities,
      iteration: iteration + 1,
      compliance,
      maxChange,
      converged,
      finished,
      u: finalU,
      strainEnergy,
      // The state this iteration solved, kept whole so it can be replayed: the
      // densities it started from, the displacement they produced, and how
      // "important" each cell looked after smoothing (-dc, filtered).
      solvedDensities,
      solvedU: u,
      importance: dcFiltered.map((row) => row.map((v) => -v)),
    };

    if (finished) return;
  }
}

// Drains iterateTopologyOptimization synchronously and returns just the
// final result — what tests and the Node demo script want, when nothing is
// watching the intermediate frames.
export function runTopologyOptimization(numElemX, numElemY, fixedDofs, loads, options = {}) {
  const history = [];
  let last;

  for (const step of iterateTopologyOptimization(numElemX, numElemY, fixedDofs, loads, options)) {
    history.push({ iteration: step.iteration, compliance: step.compliance, maxChange: step.maxChange });
    last = step;
  }

  return {
    densities: last.densities,
    iterations: last.iteration,
    converged: last.converged,
    u: last.u,
    history,
  };
}
