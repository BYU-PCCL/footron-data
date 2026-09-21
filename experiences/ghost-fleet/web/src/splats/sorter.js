/**
 * Back-to-front depth sort for splats.
 *
 * A comparison sort over 100k+ elements every frame is far too slow in JS, so
 * we quantise the projected depth into 16-bit buckets and counting-sort. That
 * is O(n) with two linear passes and no allocation, and 65536 buckets is more
 * than enough precision for alpha compositing — adjacent splats that land in
 * the same bucket are visually interchangeable anyway.
 */
const BUCKETS = 1 << 16;

// one scratch histogram is enough: sorting is synchronous and never nested
const COUNTS = new Uint32Array(BUCKETS);

export class RadixDepthSorter {
  constructor(capacity) {
    this.keys = new Uint32Array(capacity);
  }

  /**
   * @param {Float32Array} px,py,pz splat positions (mesh-local space)
   * @param {number} n number of live splats
   * @param {number} dx,dy,dz normalised view direction in the same space
   * @param {Float32Array} out index buffer, filled far -> near
   */
  sort(px, py, pz, n, dx, dy, dz, out) {
    const keys = this.keys;
    const counts = COUNTS;

    // pass 1: depth range
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < n; i++) {
      const d = px[i] * dx + py[i] * dy + pz[i] * dz;
      if (d < min) min = d;
      if (d > max) max = d;
    }
    if (!(max > min)) {
      for (let i = 0; i < n; i++) out[i] = i;
      return;
    }

    // quantise: larger depth == further away == drawn first
    const scale = (BUCKETS - 1) / (max - min);
    counts.fill(0);
    for (let i = 0; i < n; i++) {
      const d = px[i] * dx + py[i] * dy + pz[i] * dz;
      // invert so bucket 0 holds the furthest splats
      const k = ((BUCKETS - 1) - (d - min) * scale) | 0;
      keys[i] = k;
      counts[k]++;
    }

    // prefix sum
    let sum = 0;
    for (let b = 0; b < BUCKETS; b++) {
      const c = counts[b];
      counts[b] = sum;
      sum += c;
    }

    // scatter
    for (let i = 0; i < n; i++) out[counts[keys[i]]++] = i;
  }
}
