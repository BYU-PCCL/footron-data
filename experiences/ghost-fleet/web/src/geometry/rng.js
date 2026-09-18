/** Small deterministic PRNG (mulberry32) so a fleet can be rebuilt identically. */
export function makeRng(seed = 1) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  r.sym = (k = 1) => (r() * 2 - 1) * k;
  r.pick = (arr) => arr[(r() * arr.length) | 0];
  return r;
}
