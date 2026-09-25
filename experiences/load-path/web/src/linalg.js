// Solves A x = b for a dense, square matrix using Gaussian elimination with
// partial pivoting. Simple and correct, which is what the small meshes used
// during development need — the real ~60x30 mesh will need a sparse,
// iterative solver (conjugate gradient) instead, since a dense solve there
// would be far too slow. That swap is a later step.
export function solveLinearSystem(A, b) {
  const n = b.length;
  const M = A.map((row) => row.slice());
  const rhs = b.slice();

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivotRow][col])) {
        pivotRow = row;
      }
    }
    if (pivotRow !== col) {
      [M[col], M[pivotRow]] = [M[pivotRow], M[col]];
      [rhs[col], rhs[pivotRow]] = [rhs[pivotRow], rhs[col]];
    }

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-12) {
      throw new Error(`Matrix is singular (or nearly so) at column ${col}`);
    }

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / pivot;
      if (factor === 0) continue;
      for (let k = col; k < n; k++) {
        M[row][k] -= factor * M[col][k];
      }
      rhs[row] -= factor * rhs[col];
    }
  }

  const x = new Array(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = rhs[row];
    for (let col = row + 1; col < n; col++) {
      sum -= M[row][col] * x[col];
    }
    x[row] = sum / M[row][row];
  }
  return x;
}
