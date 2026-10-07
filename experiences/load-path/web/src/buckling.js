// Euler buckling: a slender member under compression can fail by suddenly
// bending sideways at a load well below what its material strength alone
// would allow — this is a real, separate failure mode from simple
// crushing/tearing, and it's often the one that actually governs for long
// thin struts (exactly what our diagonal members are). Not checking for
// it was a real, disclosed gap in the earlier area-based approach.

// Second moment of area for a rectangular cross-section that bends in the
// "bendDimension" direction — the standard b*h^3/12 formula, where h is
// the dimension along the bend and b is perpendicular to it.
export function rectMomentOfInertia(bendDimensionM, perpendicularDimensionM) {
  return (perpendicularDimensionM * bendDimensionM ** 3) / 12;
}

// The load (newtons) at which a pinned-pinned column of this stiffness
// and length buckles. Real members can buckle in either of two
// directions (in-plane or out-of-plane, for our case) — this takes
// whichever cross-sectional dimension is weaker (the caller should pass
// the smaller of the two moments of inertia) since that's the direction
// it actually fails in first.
export function eulerCriticalLoad(E, momentOfInertia, effectiveLengthM) {
  return (Math.PI ** 2 * E * momentOfInertia) / effectiveLengthM ** 2;
}

// Resolves how much of a vertical load each of two angled struts actually
// carries in (axial compression), from joint equilibrium at the apex —
// exact 2D statics for a two-bar truss, not an approximation. angleLeft
// and angleRight are each measured from support to apex (matching how
// collapse.js already computes strut angles), so a positive result means
// compression (the strut pushing the apex away from its support, which is
// what a compressed strut does).
export function resolveTrussAxialForces(angleLeft, angleRight, verticalForceN) {
  const cosL = Math.cos(angleLeft);
  const sinL = Math.sin(angleLeft);
  const cosR = Math.cos(angleRight);
  const sinR = Math.sin(angleRight);

  // [cosL cosR][Fl]   [0]
  // [sinL sinR][Fr] = [V]
  const det = cosL * sinR - cosR * sinL;
  const left = -cosR * verticalForceN / det;
  const right = cosL * verticalForceN / det;
  return { left, right };
}
