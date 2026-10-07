// A fixed degree of freedom has a known displacement (0 — it's a support
// that can't move), so it's dropped from the system before solving rather
// than solved for. This also avoids a singular matrix: a fixed node has no
// stiffness of its own against being moved, only what its neighbors supply,
// so leaving it in unconstrained would make the system unsolvable.

export function freeDofList(n, fixedDofs) {
  const fixed = new Set(fixedDofs);
  const freeDofs = [];
  for (let i = 0; i < n; i++) {
    if (!fixed.has(i)) freeDofs.push(i);
  }
  return freeDofs;
}

// Builds a "multiply by K, restricted to the free DOFs" function from a
// multiply over the *full* DOF set, without ever materializing a reduced
// matrix (dense or sparse). A vector over just the free DOFs is expanded to
// full length (0 at every fixed DOF, since those displacements are pinned),
// multiplied by the full K, then restricted back down to the free DOFs —
// which is all a solver needs, since the fixed rows/columns only ever
// contribute 0 to a free DOF's equation once IT'S the fixed side that's 0.
export function restrictMatVec(fullMatVec, freeDofs, n) {
  return (vFree) => {
    const vFull = new Array(n).fill(0);
    freeDofs.forEach((dof, i) => {
      vFull[dof] = vFree[i];
    });
    const resultFull = fullMatVec(vFull);
    return freeDofs.map((dof) => resultFull[dof]);
  };
}

export function reduceSystem(K, f, fixedDofs) {
  const n = f.length;
  const fixed = new Set(fixedDofs);
  const freeDofs = [];
  for (let i = 0; i < n; i++) {
    if (!fixed.has(i)) freeDofs.push(i);
  }

  const Kff = freeDofs.map((row) => freeDofs.map((col) => K[row][col]));
  const ff = freeDofs.map((row) => f[row]);

  return { Kff, ff, freeDofs };
}

// Puts the solved free-DOF displacements back into a full-length vector,
// filling the fixed DOFs back in as 0.
export function expandSolution(uFree, freeDofs, totalDofs) {
  const u = new Array(totalDofs).fill(0);
  freeDofs.forEach((dof, i) => {
    u[dof] = uFree[i];
  });
  return u;
}
