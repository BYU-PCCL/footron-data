import { getElementStiffnessMatrix, matVec } from "./fem.js";
import { elementDofs } from "./mesh.js";

// Raw strain energy of every element, u_e^T KE u_e — what the element WOULD
// carry if it were fully solid. Elements carrying a lot are load-bearing.
export function computeStrainEnergies(numElemX, numElemY, u) {
  const KE = getElementStiffnessMatrix();
  const energies = Array.from({ length: numElemY }, () => new Array(numElemX).fill(0));

  for (let ely = 0; ely < numElemY; ely++) {
    for (let elx = 0; elx < numElemX; elx++) {
      const ue = elementDofs(elx, ely, numElemX).map((d) => u[d]);
      const KEue = matVec(KE, ue);
      energies[ely][elx] = ue.reduce((sum, value, i) => sum + value * KEue[i], 0);
    }
  }

  return energies;
}

// The strain energy each element ACTUALLY carries at its current density:
// density^penal * u_e^T KE u_e. These sum to exactly the structure's
// compliance (f . u) — the compliance is literally the total of what every
// element is doing — so this is a true decomposition of the optimizer's
// objective, not an invented measure of "importance".
export function computeElementWork(numElemX, numElemY, densities, u, penal = 3) {
  const raw = computeStrainEnergies(numElemX, numElemY, u);
  return raw.map((row, ely) => row.map((energy, elx) => densities[ely][elx] ** penal * energy));
}

// How much the structure's total compliance would change if element e's
// density moved a tiny bit: dc/dx_e = -penal * x_e^(penal-1) * (u_e^T KE u_e).
// Elements carrying a lot of strain energy (load-bearing) get a
// large-magnitude, very negative value; elements doing nothing get a value
// near zero and are safe to remove.
export function computeSensitivities(numElemX, numElemY, densities, u, penal = 3) {
  const energies = computeStrainEnergies(numElemX, numElemY, u);
  return energies.map((row, ely) => row.map((energy, elx) => -penal * densities[ely][elx] ** (penal - 1) * energy));
}
