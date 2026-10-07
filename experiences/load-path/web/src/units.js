// Physical calibration for the "Chinese classical stone arch bridge"
// theme: turns the abstract volume-fraction / physics-engine numbers
// everywhere else in the project into real kilograms.
//
// Reference structure: a small garden-scale stone footbridge, not a real
// highway span — a real bridge at this aspect ratio would put the material
// budget in the tens of tonnes, which doesn't feel like anything a person
// can relate to on a slider. 2m span x 1m rise x 0.3m wide keeps the numbers
// human-scale while still being an honest "small stone bridge."
export const BRIDGE_SPAN_M = 2;
export const BRIDGE_RISE_M = 1;
export const BRIDGE_DEPTH_M = 0.3; // the bridge's actual width, i.e. the
// out-of-plane thickness the plane-stress FEM model assumes but never
// represents directly.

// Stone/masonry. Real stone is much weaker in tension than compression —
// classical arch bridges are literally shaped to keep the stone in
// compression and avoid tension entirely, which is the whole reason the
// arch form exists. So the two are checked separately (failure.js): the
// per-element FEM check uses the TENSILE strength below, and a strut's
// compressive force is checked against the much larger COMPRESSIVE strength.
export const STONE_DENSITY_KG_M3 = 2600;
export const STONE_TENSILE_STRENGTH_PA = 5e6; // 5 MPa
// Stone is far stronger squeezed than pulled — typically ~10x, which is why
// arch bridges work. 50 MPa is a representative value for limestone/granite
// masonry, not a measurement of any particular stone.
export const STONE_COMPRESSIVE_STRENGTH_PA = 5e7; // 50 MPa
// Needed specifically for buckling — unlike the strength check, buckling
// resistance depends on how STIFF a member is (E), not just how strong it
// is, so this is a genuinely new physical constant, not a restatement of
// the tensile strength above. A representative value for granite/limestone.
export const STONE_ELASTIC_MODULUS_PA = 3e10; // 30 GPa

export const BRIDGE_VOLUME_M3 = BRIDGE_SPAN_M * BRIDGE_RISE_M * BRIDGE_DEPTH_M;

// What the bridge would weigh at 100% material (nothing hollowed out).
export const MAX_MATERIAL_KG = BRIDGE_VOLUME_M3 * STONE_DENSITY_KG_M3;

export function kgToVolumeFraction(kg) {
  return kg / MAX_MATERIAL_KG;
}

export function volumeFractionToKg(fraction) {
  return fraction * MAX_MATERIAL_KG;
}

export const GRAVITY_M_S2 = 9.8;

// The test-weight range worth offering, as powers of ten of kg. Found with
// sweep.js after the stress scaling was corrected: below ~10^4 kg every
// shape holds, above ~10^6 kg every shape breaks, and the interesting
// middle (outcome depends on stone budget and where the weight lands)
// sits in between. Shared by the slider (main.js) and the impact
// sound/dust intensity (collapse.js) so they can't drift apart.
export const WEIGHT_EXPONENT_MIN = 3;
export const WEIGHT_EXPONENT_MAX = 6;

// Real force (newtons) a real mass exerts under gravity.
export function kgToNewtons(kg) {
  return kg * GRAVITY_M_S2;
}

// The FEM model is a unit model: elements are 1 x 1 and the plate is 1
// thick, so a stress it reports (with E=1 and a unit load) is really
// "stress per unit force, for a plate of thickness 1 and element size 1".
// For a real plate of thickness t and element size h, stress scales as
// F / (t * h) — e.g. a uniform bar under total force F has stress
// F / (t * H), and the model reports exactly 1/H for F=1, t=1. Multiply a
// model stress by (real force) x stressScaleFactor(h) to get pascals.
// Skipping this factor (an earlier version did) understates every real
// stress by 1 / (t * h) — about 100x for this bridge.
export function stressScaleFactor(cellSizeM) {
  return 1 / (BRIDGE_DEPTH_M * cellSizeM);
}
