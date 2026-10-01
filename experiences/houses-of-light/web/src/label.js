/**
 * Caption text, in one place.
 *
 * These temples are named after where they are — "Brisbane Australia Temple",
 * "Bern Switzerland Temple" — so the naive caption (place above, name below)
 * prints "BRISBANE AUSTRALIA" directly over "Brisbane Australia". The rules
 * here exist to stop the label repeating itself:
 *
 *   * the title is the official name with "Temple" dropped, because at wall
 *     size the word is on every slide and carries nothing;
 *   * the eyebrow is the dedication date written out, which is always new
 *     information and is the same fact the ribbon along the bottom is pointing
 *     at, so the two reinforce each other;
 *   * the country only appears when the name does not already contain it, which
 *     is how Kirtland gets "United States" and Brisbane does not get "Australia"
 *     twice.
 */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];

export function displayName(t) {
  return t.name.replace(/\s+Temple$/, "");
}

/** "6 April 1893", or just the year, or nothing. */
export function dedicationLine(t) {
  if (t.dedicated) {
    const [y, m, d] = t.dedicated.split("-").map(Number);
    if (y && m && d) return `Dedicated ${d} ${MONTHS[m - 1]} ${y}`;
  }
  return t.year ? `Dedicated ${t.year}` : "";
}

/* Accents differ between the two sources — Wikidata writes "Tijuana México"
 * while the country field says "Mexico" — so fold them before comparing, or the
 * caption prints the country a second time. */
const fold = (s) =>
  s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** The country, unless the temple's own name already says it. */
export function countryLine(t) {
  if (!t.country) return "";
  const name = fold(displayName(t));
  const c = fold(t.country);
  if (name.includes(c)) return "";
  // "United States" never appears in a temple name, but the state does, and
  // naming the country as well is what places Kirtland for a visitor who does
  // not know where Ohio is.
  return t.country;
}

/** Up to `max` facts, already joined with the separator span. */
export function metaLine(t, max = 3) {
  const bits = [];
  const c = countryLine(t);
  if (c) bits.push(c);
  if (t.dedicatedBy) bits.push(`Dedicated by <b>${esc(t.dedicatedBy)}</b>`);
  if (t.architect) bits.push(`Designed by <b>${esc(t.architect)}</b>`);
  if (t.floorSqft) bits.push(`<b>${t.floorSqft.toLocaleString()}</b> sq ft`);
  return bits.slice(0, max).join('<span class="sep">/</span>');
}

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
