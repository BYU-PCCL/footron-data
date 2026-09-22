// Finite-element building blocks for the topology optimizer.
//
// getElementStiffnessMatrix() is the local 8x8 stiffness matrix for a unit
// square, 4-node bilinear quad element under plane stress with unit
// thickness. It is the same reference matrix used in Sigmund's classic
// topology-optimization code (Sigmund, "A 99 line topology optimization
// code written in Matlab", Struct Multidisc Optim 21, 2001) — every element
// in the mesh reuses this one matrix, scaled by that element's density.
//
// DOF order per node is [x, y], and nodes are ordered 1..4 around the
// element, so the 8 local DOFs are:
//   [n1x, n1y, n2x, n2y, n3x, n3y, n4x, n4y]
export function getElementStiffnessMatrix(E = 1, nu = 0.3) {
  const k = [
    1 / 2 - nu / 6,
    1 / 8 + nu / 8,
    -1 / 4 - nu / 12,
    -1 / 8 + (3 * nu) / 8,
    -1 / 4 + nu / 12,
    -1 / 8 - nu / 8,
    nu / 6,
    1 / 8 - (3 * nu) / 8,
  ];

  const rows = [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [1, 0, 7, 6, 5, 4, 3, 2],
    [2, 7, 0, 5, 6, 3, 4, 1],
    [3, 6, 5, 0, 7, 2, 1, 4],
    [4, 5, 6, 7, 0, 1, 2, 3],
    [5, 4, 3, 2, 1, 0, 7, 6],
    [6, 3, 4, 1, 2, 7, 0, 5],
    [7, 2, 1, 4, 3, 6, 5, 0],
  ];

  const scale = E / (1 - nu * nu);
  return rows.map((row) => row.map((idx) => scale * k[idx]));
}

// Multiplies a square matrix by a vector. Works for the 8x8 element matrix
// and for full assembled global matrices alike.
export function matVec(matrix, vector) {
  return matrix.map((row) => row.reduce((sum, value, j) => sum + value * vector[j], 0));
}
