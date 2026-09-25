import { assembleSparseStiffness, sparseMatVec, sparseDiagonal } from "./sparse.js";
import { numDofs } from "./mesh.js";
import { freeDofList, restrictMatVec, expandSolution } from "./boundary.js";
import { conjugateGradient } from "./cg.js";

// Solves for the displacement of every node under the given loads.
//
//   fixedDofs — DOF indices whose displacement is pinned to 0 (supports).
//   loads     — array of [dof, value] pairs; every other DOF gets 0 force.
//   options.previousU — a full displacement vector from a prior call with
//     the same fixedDofs (e.g. the previous optimization iteration), used
//     to warm-start CG. Density changes only a little between iterations,
//     so the previous answer is usually already close to the new one.
//
// Returns the full displacement vector (length numDofs(numElemX, numElemY)),
// indexed the same way as the DOFs everywhere else in this project.
//
// Uses the sparse matrix + preconditioned conjugate gradient, not the dense
// Gaussian elimination solver in linalg.js — that one is kept around for
// tests and small cross-checks, but doesn't scale to the mesh sizes this
// needs to run at.
export function solveDisplacement(numElemX, numElemY, densities, fixedDofs, loads, options = {}) {
  const K = assembleSparseStiffness(numElemX, numElemY, densities);
  const n = numDofs(numElemX, numElemY);

  const f = new Array(n).fill(0);
  for (const [dof, value] of loads) {
    f[dof] = value;
  }

  const freeDofs = freeDofList(n, fixedDofs);
  const ff = freeDofs.map((dof) => f[dof]);
  const matVecFree = restrictMatVec((v) => sparseMatVec(K, v), freeDofs, n);

  const diagonal = sparseDiagonal(K);
  const precondition = (v) => v.map((value, i) => value / diagonal[freeDofs[i]]);

  const x0 = options.previousU ? freeDofs.map((dof) => options.previousU[dof]) : undefined;

  const { x: uFree } = conjugateGradient(matVecFree, ff, { x0, precondition });
  return expandSolution(uFree, freeDofs, n);
}
