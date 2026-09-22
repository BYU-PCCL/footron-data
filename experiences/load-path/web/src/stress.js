// Recovers real stress from the displacement field our FEM already solves
// — the missing link between "how much did this deform" (which we've had
// since structure.js) and "is this actually about to fail" (which needs a
// real stress value, not just an energy-based sensitivity number).
//
// Every element here is the same unit-square bilinear quad used
// throughout the project (fem.js), so — like the KE matrix — the
// strain-displacement matrix B is the same fixed matrix for every
// element, evaluated once at the element's center. Center-point stress is
// the standard, textbook way finite element codes report a single
// representative stress per element; it's not "every atom individually,"
// it's the same simplification real FEM post-processing uses.
//
// B, in local dof order [u1,v1,u2,v2,u3,v3,u4,v4] with corners ordered
// bottom-left, bottom-right, top-right, top-left (matching fem.js):
const B = [
  [-0.5, 0, 0.5, 0, 0.5, 0, -0.5, 0],
  [0, -0.5, 0, -0.5, 0, 0.5, 0, 0.5],
  [-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5],
];

// Strain (epsilon_x, epsilon_y, gamma_xy) at an element's center, from its
// 8 local displacement values.
export function computeStrain(u_e) {
  return B.map((row) => row.reduce((sum, value, i) => sum + value * u_e[i], 0));
}

// The standard plane-stress material matrix (Hooke's law relating strain
// to stress for a thin, in-plane-loaded panel — the same "plane stress"
// assumption the whole FEM model is built on).
export function planeStressD(E, nu) {
  const scale = E / (1 - nu * nu);
  return [
    [scale, scale * nu, 0],
    [scale * nu, scale, 0],
    [0, 0, (scale * (1 - nu)) / 2],
  ];
}

// Stress (sigma_x, sigma_y, tau_xy) from strain, via D.
export function computeStress(strain, D) {
  return D.map((row) => row.reduce((sum, value, i) => sum + value * strain[i], 0));
}

// The two principal stresses (the max and min normal stress at this point,
// found by rotating to the orientation where shear vanishes) — the
// standard 2D Mohr's-circle formula. For a brittle material like stone,
// the failure-relevant number is the larger (most tensile) of the two.
export function principalStresses(sx, sy, txy) {
  const average = (sx + sy) / 2;
  const radius = Math.sqrt(((sx - sy) / 2) ** 2 + txy ** 2);
  return [average + radius, average - radius];
}

// Convenience: max principal stress straight from an element's local
// displacement vector.
export function maxPrincipalStress(u_e, E, nu) {
  const strain = computeStrain(u_e);
  const D = planeStressD(E, nu);
  const [sx, sy, txy] = computeStress(strain, D);
  const [s1] = principalStresses(sx, sy, txy);
  return s1;
}
