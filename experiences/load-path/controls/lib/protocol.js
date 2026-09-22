// What the phone and the wall agree on. No React and no DOM in here, so
// test.js can import it and check it against the wall's own copy of the
// protocol (web/src/footron.js) and its lesson list (web/src/lessons.js): the
// two ends can't drift apart without a test failing.
//
// Messages (see web/src/footron.js for the full protocol and what the wall does
// with each one). Every builder returns a plain message object.

export const RANGES = {
  stone: [230, 1560],
  weight: [0, 1],
  spot: [0, 1],
};

// The test-weight slider is 0..1 along a log scale from 10^3 to 10^6 kg.
export const WEIGHT_EXPONENTS = [3, 6];

// Each lesson also carries the setup the wall will use for it, so tapping one
// can move this phone's own sliders to match (the wall never says). test.js
// checks every one against web/src/lessons.js.
export const LESSONS = [
  { id: "meet", label: "Meet the algorithm", material: 620, weightKg: 30000, column: 30 },
  { id: "heavy", label: "Too heavy", material: 620, weightKg: 200000, column: 30 },
  { id: "spot", label: "Move the weight", material: 620, weightKg: 100000, column: 12 },
  { id: "stiff", label: "Stiffest isn't strongest", material: 250, weightKg: 80000, column: 30 },
];

export const BRUSH_RANGE = [0, 4];
export const BOARD_SIZE = 5;
export const NUM_ELEM_X = 60; // the wall's grid, only used to place the pad's weight arrow
export const DRAG_HZ = 20; // paint messages per second while a finger is down

// A 0..1 position along the span as the wall's load column (mirrors spotToColumn
// in web/src/footron.js, and test.js checks they agree).
export function spotToColumn(fraction, numElemX = NUM_ELEM_X) {
  return Math.min(numElemX - 3, Math.max(3, Math.round(fraction * numElemX)));
}

// The inverse: a weight in kg as a 0..1 position on the slider.
export function weightFraction(kg) {
  const [lo, hi] = WEIGHT_EXPONENTS;
  return Math.min(1, Math.max(0, (Math.log10(kg) - lo) / (hi - lo)));
}

export function weightKg(fraction) {
  const [lo, hi] = WEIGHT_EXPONENTS;
  return Math.round(10 ** (lo + (hi - lo) * fraction));
}

// Bare kilograms don't mean much; anchor to the nearest familiar object, as the wall does.
const REFERENCE_OBJECTS = [
  { name: "a car", kg: 1500 },
  { name: "an elephant", kg: 6000 },
  { name: "a semi-truck", kg: 36000 },
  { name: "a Boeing 747", kg: 400000 },
];

export function formatKg(kg) {
  const nearest = REFERENCE_OBJECTS.reduce((best, o) => (Math.abs(Math.log(kg / o.kg)) < Math.abs(Math.log(kg / best.kg)) ? o : best));
  const count = kg / nearest.kg;
  const countText = count < 10 ? count.toFixed(1) : Math.round(count).toLocaleString();
  return `${kg.toLocaleString()} kg, about ${countText} × ${nearest.name}`;
}

export const msg = {
  setup: (key, value) => ({ type: "setup", key, value }),
  grow: (setup) => ({ type: "grow", ...setup }),
  lesson: (id) => ({ type: "lesson", value: id }),
  skip: () => ({ type: "skip" }),
  scrub: (value) => ({ type: "scrub", value }),
  replay: () => ({ type: "replay" }),
  test: () => ({ type: "test" }),
  yourTurn: (open) => ({ type: "yourTurn", value: open }),
  paint: (x, y, erase) => ({ type: "paint", x, y, erase }),
  strokeEnd: () => ({ type: "stroke", value: "end" }),
  brush: (value) => ({ type: "brush", value }),
  clear: () => ({ type: "clear" }),
  reveal: (value) => ({ type: "reveal", value }),
  testMine: () => ({ type: "testMine" }),
  save: () => ({ type: "save" }),
  loadBest: (rank) => ({ type: "loadBest", value: rank }),
};
