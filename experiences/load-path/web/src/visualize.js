// Quick-and-dirty terminal preview of a density grid — enough to see
// whether the optimizer produced a plausible truss shape, without waiting
// on a real renderer. Not used by the eventual wall display.
const SHADES = " .:-=+*#%@";

export function densitiesToAscii(densities) {
  const numElemY = densities.length;
  const rows = [];

  // Row 0 is the bottom of the domain (this project's y-up convention), but
  // terminals print top line first, so walk the rows top-down for display.
  for (let ely = numElemY - 1; ely >= 0; ely--) {
    const row = densities[ely]
      .map((x) => SHADES[Math.min(SHADES.length - 1, Math.floor(x * SHADES.length))])
      .join("");
    rows.push(row);
  }

  return rows.join("\n");
}
