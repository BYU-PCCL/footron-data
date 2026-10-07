// Guided demonstrations: each sets the stone, the weight and where it lands,
// runs the whole thing, and says something afterwards. Every claim a lesson
// makes is listed in `claims` as a concrete (stone, spot, weight) -> holds /
// breaks statement, and check-lessons.js re-verifies all of them against the
// real model, so a lesson can't quietly go stale when the physics changes.
//
// Numbers in the text (like "100 tonnes") are ones the claims pin down.

export const LESSONS = [
  {
    id: "meet",
    title: "Meet the algorithm",
    material: 620,
    weightKg: 30000,
    column: 30,
    intro: "620 kg of stone, a 30-tonne load in the middle. Watch the algorithm decide where the stone should go.",
    afterHolds: "It holds. All along it used the same 620 kg: it only moved stone from idle places to busy ones.",
    claims: [{ material: 620, column: 30, weightKg: 30000, expect: "holds" }],
  },
  {
    id: "heavy",
    title: "Too heavy",
    material: 620,
    weightKg: 200000,
    column: 30,
    intro: "The same bridge, but a 200-tonne load. Look for where the stress map turns red.",
    afterBreaks: "It broke. The crack started at the reddest stone in the stress map, and the collapse spread out from there.",
    claims: [{ material: 620, column: 30, weightKg: 200000, expect: "breaks" }],
  },
  {
    id: "spot",
    title: "Move the weight",
    material: 620,
    weightKg: 100000,
    column: 12,
    intro: "The same 620 kg, but 100 tonnes landing near one end instead of in the middle.",
    afterHolds:
      "It holds 100 tonnes here. Grown for the middle, the same 620 kg can't hold that much: where the weight lands changes the shape, and the strength.",
    claims: [
      { material: 620, column: 12, weightKg: 100000, expect: "holds" },
      { material: 620, column: 30, weightKg: 100000, expect: "breaks" },
    ],
  },
  {
    id: "stiff",
    title: "Stiffest isn't strongest",
    material: 250,
    weightKg: 80000,
    column: 30,
    intro: "Only 250 kg this time, under an 80-tonne load in the middle.",
    afterHolds:
      "It holds 80 tonnes on just 250 kg. A 400 kg bridge grown for the same spot fails below 40 tonnes: the algorithm builds the STIFFEST bridge for its stone, not the strongest. Can you build a stronger one? Try \"Your turn\".",
    claims: [
      { material: 250, column: 30, weightKg: 80000, expect: "holds" },
      { material: 400, column: 30, weightKg: 40000, expect: "breaks" },
    ],
  },
];

// The weight slider is 0-1000 mapped onto 10^min..10^max kg; this is its inverse,
// so a lesson can be stated in kilograms.
export function weightToSliderValue(kg, exponentMin, exponentMax, sliderMax = 1000) {
  const t = (Math.log10(kg) - exponentMin) / (exponentMax - exponentMin);
  return Math.round(Math.min(1, Math.max(0, t)) * sliderMax);
}
