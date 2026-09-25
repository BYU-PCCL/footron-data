import { getElementStiffnessMatrix } from "./fem.js";
import { elementDofs, numDofs } from "./mesh.js";

// Same assembly as assembleGlobalStiffness in assemble.js, but stores only
// the nonzero entries — one Map<column, value> per row — instead of a full
// n x n array of mostly zeros. K is sparse because a DOF only interacts
// with the handful of elements touching it, not with every other DOF in
// the mesh, so a dense array wastes almost all of its memory and every
// multiply against a zero it stores.
export function assembleSparseStiffness(numElemX, numElemY, densities, penal = 3) {
  const KE = getElementStiffnessMatrix();
  const n = numDofs(numElemX, numElemY);
  const K = Array.from({ length: n }, () => new Map());

  for (let ely = 0; ely < numElemY; ely++) {
    for (let elx = 0; elx < numElemX; elx++) {
      const dofs = elementDofs(elx, ely, numElemX);
      const scale = densities[ely][elx] ** penal;
      for (let a = 0; a < 8; a++) {
        const row = K[dofs[a]];
        for (let b = 0; b < 8; b++) {
          const col = dofs[b];
          row.set(col, (row.get(col) ?? 0) + scale * KE[a][b]);
        }
      }
    }
  }

  return K;
}

// The diagonal of a sparse matrix — used to build a Jacobi preconditioner
// for CG (approximating A^-1 with 1/diagonal is cheap and, for a stiffness
// matrix like this one, a meaningfully better guess than no preconditioner
// at all).
export function sparseDiagonal(K) {
  return K.map((row, i) => row.get(i) ?? 0);
}

// Multiplies a sparse matrix (array of Map<column, value> rows) by a dense
// vector — only touches the nonzero entries, unlike matVec() in fem.js.
export function sparseMatVec(K, vector) {
  return K.map((row) => {
    let sum = 0;
    for (const [col, value] of row) {
      sum += value * vector[col];
    }
    return sum;
  });
}
