import { getElementStiffnessMatrix } from "./fem.js";
import { elementDofs, numDofs } from "./mesh.js";

// Assembles the global stiffness matrix K from per-element densities
// (indexed densities[ely][elx]), penalizing intermediate densities with
// density^penal (SIMP) so the optimizer is pushed toward crisp 0/1 designs.
//
// Returned as a plain dense array-of-arrays. That's fine for the small
// meshes used here; a real ~60x30 mesh will need a sparse representation
// and an iterative solver, which is a later step, not this one.
export function assembleGlobalStiffness(numElemX, numElemY, densities, penal = 3) {
  const KE = getElementStiffnessMatrix();
  const n = numDofs(numElemX, numElemY);
  const K = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let ely = 0; ely < numElemY; ely++) {
    for (let elx = 0; elx < numElemX; elx++) {
      const dofs = elementDofs(elx, ely, numElemX);
      const scale = densities[ely][elx] ** penal;
      for (let a = 0; a < 8; a++) {
        for (let b = 0; b < 8; b++) {
          K[dofs[a]][dofs[b]] += scale * KE[a][b];
        }
      }
    }
  }

  return K;
}

export function solidDensities(numElemX, numElemY) {
  return Array.from({ length: numElemY }, () => new Array(numElemX).fill(1));
}
