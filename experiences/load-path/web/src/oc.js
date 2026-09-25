const MIN_DENSITY = 0.001;

// Optimality Criteria update: given filtered sensitivities and a target
// volume fraction, finds a new density for every element. Each element's
// candidate density is x * sqrt(-dc/lambda) — larger where the (negative)
// sensitivity has a bigger magnitude, i.e. where adding material helps
// more — clamped to a maximum per-step change (`move`) for stability, and
// to [MIN_DENSITY, 1] since density 0 would make an element's stiffness
// (and its future sensitivity) permanently zero.
//
// lambda isn't known in advance — it's whatever value makes the total
// material used match volumeFraction, so it's found by bisection: try a
// lambda, see if the resulting design uses too much or too little material,
// and narrow the search range accordingly.
export function updateDensities(numElemX, numElemY, densities, filteredSensitivities, volumeFraction, move = 0.2) {
  let lower = 0;
  let upper = 1e5;
  let newDensities;

  while (upper - lower > 1e-4) {
    const lambda = 0.5 * (upper + lower);

    newDensities = densities.map((row, ely) =>
      row.map((x, elx) => {
        const dc = filteredSensitivities[ely][elx];
        const candidate = x * Math.sqrt(Math.max(0, -dc / lambda));
        const capped = Math.min(1, Math.min(x + move, candidate));
        const floored = Math.max(x - move, capped);
        return Math.max(MIN_DENSITY, floored);
      })
    );

    const totalVolume = newDensities.flat().reduce((sum, x) => sum + x, 0);
    const targetVolume = volumeFraction * numElemX * numElemY;

    if (totalVolume > targetVolume) {
      lower = lambda;
    } else {
      upper = lambda;
    }
  }

  return newDensities;
}
