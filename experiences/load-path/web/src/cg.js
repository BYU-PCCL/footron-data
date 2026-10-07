// Conjugate Gradient (preconditioned): solves A·x = b for a symmetric
// positive-definite A, without ever needing A itself — only a function
// that computes "A times this vector". That's what lets the same solver
// work whether the multiply comes from a sparse matrix or, later, from a
// matrix-free computation that never assembles A at all.
//
//   x0          — starting guess. Warm-starting one optimization
//                 iteration's solve from the previous iteration's answer
//                 (density barely changes between iterations) means CG
//                 starts much closer to the answer, so it takes fewer
//                 steps to get there.
//   precondition — a function approximating "multiply by A^-1"; applying it
//                 to the residual each step steers the search directions
//                 toward ones that converge faster. Omit it (or pass
//                 nothing) and this behaves as plain, unpreconditioned CG.
export function conjugateGradient(matVec, b, options = {}) {
  const { tolerance = 1e-8, maxIterations = b.length * 2, x0, precondition } = options;
  const applyPrecondition = precondition || ((v) => v);

  let x = x0 ? x0.slice() : new Array(b.length).fill(0);
  let r = subtract(b, matVec(x));
  let z = applyPrecondition(r);
  let p = z.slice();
  let rzOld = dot(r, z);

  const bNormSq = dot(b, b) || 1; // avoid divide-by-zero when b is all 0

  if (dot(r, r) / bNormSq < tolerance * tolerance) {
    return { x, iterations: 0 };
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    const Ap = matVec(p);
    const alpha = rzOld / dot(p, Ap);

    x = addScaled(x, p, alpha);
    r = addScaled(r, Ap, -alpha);

    if (dot(r, r) / bNormSq < tolerance * tolerance) {
      return { x, iterations: iter + 1 };
    }

    z = applyPrecondition(r);
    const rzNew = dot(r, z);
    p = addScaled(z, p, rzNew / rzOld);
    rzOld = rzNew;
  }

  return { x, iterations: maxIterations };
}

function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function subtract(a, b) {
  return a.map((value, i) => value - b[i]);
}

// a + scalar * b
function addScaled(a, b, scalar) {
  return a.map((value, i) => value + scalar * b[i]);
}
