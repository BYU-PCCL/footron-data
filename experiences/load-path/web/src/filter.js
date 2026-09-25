// Sigmund's mesh-independent sensitivity filter: an element's filtered
// sensitivity is a density-weighted average of its neighbors' raw
// sensitivities within radius `rmin`, weighted by how close they are.
// Without this, the optimizer tends toward checkerboard patterns —
// alternating solid/empty elements that are a numerical artifact of how the
// element stiffness is formulated, not a real optimal structure.
export function filterSensitivities(numElemX, numElemY, densities, sensitivities, rmin) {
  const filtered = Array.from({ length: numElemY }, () => new Array(numElemX).fill(0));
  const reach = Math.floor(rmin);

  for (let ely = 0; ely < numElemY; ely++) {
    for (let elx = 0; elx < numElemX; elx++) {
      let weightSum = 0;
      let total = 0;

      for (let dy = -reach; dy <= reach; dy++) {
        for (let dx = -reach; dx <= reach; dx++) {
          const ny = ely + dy;
          const nx = elx + dx;
          if (ny < 0 || ny >= numElemY || nx < 0 || nx >= numElemX) continue;

          const distance = Math.sqrt(dx * dx + dy * dy);
          const weight = Math.max(0, rmin - distance);
          weightSum += weight;
          total += weight * densities[ny][nx] * sensitivities[ny][nx];
        }
      }

      filtered[ely][elx] = total / (densities[ely][elx] * weightSum);
    }
  }

  return filtered;
}
