// Shallow-water beach simulator.
// Staggered (MAC) grid, linearised shallow-water equations with robust wet/dry
// handling so waves shoal, refract over sandbars and run up the beach.
//
//   du/dt   = -g d(eta)/dx
//   deta/dt = -div(H u)          H = surface - bed  (clamped at 0)
//
// Face depths use the upwind form  max(eta) - max(bed): with min(eta) instead,
// a wet cell next to dry sand always gets a zero-depth face and the swash can
// never climb the beach.
//
// Ocean is on the left (x=0) where the wavemaker lives, beach on the right.
// The y axis wraps, so angled swell trains are seamless.

// --- grid size, chosen once at load ---------------------------------------
//
// The same page has to run on a wall display, a laptop and a phone. Cost scales
// with cell count, so rather than shipping one compromise resolution we measure
// what the machine can actually do and pick a tier. The probe is a stand-in for
// the solver's real inner loop (strided float reads, a few multiplies, one
// write), which is what makes it predictive; a pure ALU spin would not be.
//
// Override with ?grid=480 for testing, or 'wavelab.grid' in localStorage.

function readOverride() {
  try {
    const q = +new URLSearchParams(location.search).get('grid');
    if (q >= 160 && q <= 900) return q;
    const st = +localStorage.getItem('wavelab.grid');
    if (st >= 160 && st <= 900) return st;
  } catch (e) { /* file:// or privacy mode */ }
  return 0;
}

function probeGrid() {
  const N = 1 << 16;
  const a = new Float32Array(N), b = new Float32Array(N);
  for (let i = 0; i < N; i++) { a[i] = i * 0.001; b[i] = 1; }
  const t0 = performance.now();
  let reps = 0;
  // run for a fixed slice of time, then see how much got done
  while (performance.now() - t0 < 6) {
    for (let i = 1; i < N - 1; i++) {
      const l = a[i - 1], r = a[i + 1], c = a[i];
      const h = l > r ? l : r;
      b[i] = (c - 0.05 * (r - l)) * (h > 0 ? 0.999 : 0);
    }
    a.set(b);
    reps++;
  }
  const ms = performance.now() - t0;
  return (reps * N) / (ms * 1000);        // millions of cell-updates per second
}

export const NX = (() => {
  if (typeof window === 'undefined') return 320;
  const forced = readOverride();
  if (forced) return forced & ~1;
  let rate;
  try { rate = probeGrid(); } catch (e) { rate = 0; }
  // Tiers set from measured cost: ~58k cells needs ~7 ms of sim+raster on a
  // machine that probes near 80, and cost is close to linear in cell count.
  // Substeps have to rise with SCALE to hold CFL, so cost grows faster than
  // cell count and the useful automatic range is narrow. Bigger grids are a
  // deliberate choice, not something to guess into: use ?grid=480.
  let nx = 320;
  if (rate > 320) nx = 400;
  else if (rate < 55) nx = 256;
  // Never ask for meaningfully more cells than the screen can show.
  const px = window.innerWidth * Math.min(2, window.devicePixelRatio || 1);
  if (px && nx > px * 0.85) nx = Math.max(256, Math.round(px * 0.85) & ~1);
  return nx;
})();

export const NY = (() => {
  if (typeof window === 'undefined') return 200;
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  return Math.max(150, Math.min(Math.round(NX / 1.15), Math.round(NX / aspect) & ~1));
})();

// SCALE is cells per unit of beach relative to the 320-wide reference grid.
// Cells get smaller as the grid grows, and the equations are written in cell
// units, so gravity has to grow as SCALE^2 to keep the physics — wavelength,
// celerity, run-up, where waves break — identical at every resolution. Without
// this, a higher-resolution beach would quietly become a different beach.
//
// Time is untouched, so the CFL limit tightens as 1/SCALE. dt = 0.05 sits about
// 2.7x inside the limit on the reference grid, which leaves room up to roughly
// NX = 700 before the substep count would have to rise.
export const SCALE = NX / 320;
const G = 9.8 * SCALE * SCALE;
// Velocities are in cells per unit time, so every speed threshold scales too.
const VS = SCALE;
const DT_CFL = 0.0667;
// Silt in the surf tops out here; a river runs several times muddier, which is
// what keeps a freshwater plume readable against churned-up sea.
const SURF_TURB = 0.26;

// --- frequency dispersion -------------------------------------------------
//
// Plain shallow-water theory has none: every period travels at sqrt(gH), so a
// short chop and a long groundswell cross the same water at the same speed,
// which is wrong and visibly so. Airy theory gives w^2 = g k tanh(kh), whose
// shallow expansion is
//
//     w^2 = g h k^2 (1 - (kh)^2/3 + ...)
//
// Adding a third-derivative term to the momentum equation reproduces that
// leading correction. Linearising u_t = -g n_x + C n_xxx with n_t = -h u_x
// gives w^2 = g h k^2 + C h k^4, so C = -g h^2 / 3.
//
// One subtlety: the solver's vertical unit is not the cell width, so h has to be
// converted into cells before it is squared, or the term is out by the square of
// that ratio. One height unit is about 1 metre and one cell is 1.5/SCALE metres.
const H_PER_CELL = 1.5;                       // metres of height per unit
const DISP_C = SCALE / H_PER_CELL;            // height units -> cells
// Boussinesq terms are stiff at short wavelengths and an explicit scheme will
// amplify them, so the correction is capped at a fraction of the gravity term.
// That leaves the physical range intact and refuses only the runaway.
const DISP_CAP = 0.30;
const SPONGE = Math.round(16 * (NX / 320));   // absorbing band at the ocean edge
const SRCX = Math.round(24 * (NX / 320));     // internal wave generator column
export const PRESETS = ['classic', 'sandbar', 'coves', 'reef', 'pier', 'jetty', 'flat'];

export class Sim {
  constructor() {
    const n = NX * NY;
    this.nx = NX;
    this.ny = NY;
    this.bed = new Float32Array(n);   // ground surface (0 = mean sea level)
    // --- materials ------------------------------------------------------
    //
    // The bed used to be sand everywhere, so every terrain was a shape drawn
    // in something that flows. A reef and a pier are not shapes in sand, they
    // are a different substance, and the difference has to be in the physics
    // or it is only a paint job. Three fields carry it:
    //
    //   floor  the surface the sand can never be cut below. Sand lies on top
    //          and does everything it always did; underneath is rock, coral or
    //          timber, and no amount of surf will move it. This one field is
    //          what makes a reef behave unlike a sandbar — a bar migrates and
    //          eventually washes out, a reef stays exactly where it is and the
    //          beach rearranges itself around it.
    //   rough  extra bed drag. A coral flat is a forest of branches and a pile
    //          sheds vortices; both take energy out of the water in a way a
    //          sand bed does not, which is how a reef shelters what is behind
    //          it even where the water is deep enough not to break.
    //   reef / built  coverage of live coral and of man-made structure. These
    //          are for the renderer, and for nothing else.
    //
    // -9.5 is the same floor the sand code always clamped to, so a beach with
    // no reef and no pier on it behaves exactly as it did before.
    this.floor = new Float32Array(n).fill(-9.5);
    this.reef = new Float32Array(n);
    this.rough = new Float32Array(n);
    this.built = new Float32Array(n);
    // Local stirring, for scour around an obstacle. A cell is 1.5 m and a pile
    // is 0.4 m, so the horseshoe vortex that actually digs a scour hole is far
    // below the grid and cannot emerge from the solver. This is therefore a
    // parameterisation and is labelled as one: it raises the sand the flow can
    // carry in the cells immediately around a pile, which makes the sediment
    // flux diverge there and hollows the bed out exactly where it should. It
    // does nothing when the water is still, so the scour tracks the surf.
    this.stir = new Float32Array(n);
    // Hoisted flags so the hot loops can skip the material work entirely on a
    // plain sand coast, which is most of them.
    this.hasFloor = false;      // any non-erodible surface above -9.5
    this.hasMaterial = false;   // anything the renderer must colour differently
    this.structures = [];       // things drawn above the water, e.g. the pier
    this.eta = new Float32Array(n);   // water surface height
    this.u = new Float32Array(n);     // x velocity, left face of cell i
    this.v = new Float32Array(n);     // y velocity, lower face of cell j
    this.foam = new Float32Array(n);
    this.wet = new Float32Array(n);
    this.noise = new Float32Array(n);
    this.etaPrev = new Float32Array(n);
    this.foamTmp = new Float32Array(n);
    this.qx = new Float32Array(n);
    this.qy = new Float32Array(n);
    this.fyCarry = new Float32Array(NX);
    this.fyWrap = new Float32Array(NX);
    // Turbidity: a passive tracer carried by the flow. Rivers run silty, and
    // breaking waves stir the bed up, so this is what makes fresh water and
    // churned surf visibly different from clean sea.
    this.turb = new Float32Array(n);
    this.turbTmp = new Float32Array(n);
    this.river = {
      on: false,
      y: NY * 0.42,
      discharge: 0.5,
      width: Math.max(3, 5 * SCALE),
      headX: Math.round(NX * 0.965),
      carved: false,
    };
    this.sea = 0;
    this.time = 0;
    this.rippleOff = 0;
    this.lastDt = 0.2;
    this.foamTotal = 0;
    this.breakEnergy = 0;
    this.swashEnergy = 0;
    this.params = {
      amplitude: 0.55,
      frequency: 0.095,
      angle: 0,        // degrees of swell approach
      chop: 0.35,
      wind: 0.25,
      tide: 0,
      erosion: 0.4,
      damping: 0.02,
      speed: 1,
    };
    this.paused = false;
    // Off by default, and the reason is measured rather than assumed: see the
    // dispersion note above. At this domain's geometry — roughly 480 m of beach
    // over 6 m of water — kh stays below about 0.6, so the correction is worth
    // 3-4% of celerity and is not visible, while costing 14% of the frame. Turn
    // it on (?dispersion=1) if the bathymetry is ever made much deeper, where it
    // would start to matter.
    this.dispersion = (() => {
      try { return new URLSearchParams(location.search).get('dispersion') === '1'; }
      catch (e) { return false; }
    })();
    this.srcW = new Float32Array(NX);   // wave-generator column weights
    let sw = 0;
    const srcHalf = Math.max(3, Math.round(5 * SCALE));
    const srcSigma = 3.0 * SCALE;
    for (let i = SRCX - srcHalf; i <= SRCX + srcHalf; i++) {
      const w = Math.exp(-Math.pow((i - SRCX) / srcSigma, 2));
      this.srcW[i] = w; sw += w;
    }
    for (let i = 0; i < NX; i++) this.srcW[i] /= sw;
    this.buildNoise();
    this.preset('classic');
  }

  buildNoise() {
    // Value noise that wraps in y, used for sand grain + travelling ripples.
    let s = 1337;
    const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const cn = 40, cm = 25;
    const grid = new Float32Array(cn * cm);
    for (let i = 0; i < grid.length; i++) grid[i] = rnd() * 2 - 1;
    const at = (a, b) => grid[((b % cm) + cm) % cm * cn + ((a % cn) + cn) % cn];
    const sm = t => t * t * (3 - 2 * t);
    for (let j = 0; j < NY; j++) {
      const gy = (j / NY) * cm, j0 = Math.floor(gy), fy = sm(gy - j0);
      for (let i = 0; i < NX; i++) {
        const gx = (i / NX) * cn, i0 = Math.floor(gx), fx = sm(gx - i0);
        const a = at(i0, j0) + (at(i0 + 1, j0) - at(i0, j0)) * fx;
        const b = at(i0, j0 + 1) + (at(i0 + 1, j0 + 1) - at(i0, j0 + 1)) * fx;
        // second octave for finer grain
        const fine = Math.sin(i * 1.7 + j * 2.3) * Math.sin(i * 0.9 - j * 1.1);
        this.noise[j * NX + i] = (a + (b - a) * fy) * 0.75 + fine * 0.25;
      }
    }
  }

  // ---------------------------------------------------------------- terrain

  preset(kind) {
    const bed = this.bed;
    // Every terrain starts as pure sand; the ones that are not add themselves
    // back below.
    this.floor.fill(-9.5);
    this.reef.fill(0);
    this.rough.fill(0);
    this.built.fill(0);
    this.stir.fill(0);
    this.structures = [];
    this.hasFloor = false;
    this.hasMaterial = false;
    for (let j = 0; j < NY; j++) {
      const fy = j / NY;
      const w1 = Math.sin(2 * Math.PI * 2 * fy + 0.7);
      const w2 = Math.sin(2 * Math.PI * 3 * fy + 2.3);
      const w3 = Math.sin(2 * Math.PI * 5 * fy + 4.9);
      for (let i = 0; i < NX; i++) {
        const s = i / (NX - 1);
        let b = -5.6 + 7.7 * s;
        const bump = (c, wd) => Math.exp(-Math.pow((s - c) / wd, 2));
        // alongshore shape only matters near the beach; scalloping the deep
        // shelf just makes the swell arrive from silly directions
        const near = Math.exp(-Math.pow((s - 0.62) / 0.28, 2));
        switch (kind) {
          case 'sandbar':
            // bars stay just submerged: that's what makes waves break offshore
            b += 2.1 * bump(0.40, 0.055) * (0.8 + 0.2 * w1)
               + 1.0 * bump(0.58, 0.045) * (0.7 + 0.3 * w2);
            break;
          case 'coves':
            b += (0.95 * w1 + 0.4 * w3) * near;
            break;
          case 'reef':
            // Only the sand here: a lagoon scooped out behind where the coral
            // is about to go, and the beach beyond it. buildReef() lays the
            // rock on top once the whole sand surface exists.
            b -= 1.5 * bump(0.60, 0.10);
            b += 0.25 * w2 * near;
            break;
          case 'pier':
            // An ordinary barred beach. All the interest comes from what the
            // piles do to it, so the bathymetry stays plain on purpose.
            b += 1.5 * bump(0.45, 0.07) * (0.85 + 0.15 * w1) + 0.3 * w2 * near;
            break;
          case 'jetty':
            b += 1.2 * bump(0.46, 0.07);
            if (Math.abs(((fy * 3) % 1) - 0.5) < 0.05 && s < 0.82) {
              b += 6.5 * (0.85 - s);
            }
            break;
          case 'flat':
            b = -3.6 + 5.2 * s;
            break;
          default:
            b += 1.5 * bump(0.45, 0.07) * (0.85 + 0.15 * w1) + 0.3 * w2 * near;
        }
        b += Math.max(0, s - 0.88) * 9 * (0.7 + 0.3 * w2);   // dunes
        b += 0.14 * w3 * Math.sin(11 * s + 1.3);
        bed[j * NX + i] = b;
      }
    }
    if (kind === 'reef') this.buildReef();
    else if (kind === 'pier') this.buildPier();
    else if (kind === 'jetty') this.buildJetties();
    this.resetWater();
  }

  // Raise the immovable surface at one cell, and the sand with it if the rock
  // now stands higher. Everything that lays down material goes through here so
  // that bed and floor can never disagree.
  stampRock(k, top, cover, rough, built) {
    if (top > this.floor[k]) this.floor[k] = top;
    if (top > this.bed[k]) this.bed[k] = top;
    if (cover > this.reef[k]) this.reef[k] = cover;
    if (rough > this.rough[k]) this.rough[k] = rough;
    if (built > this.built[k]) this.built[k] = built;
    this.hasFloor = true;
    if (cover > 0 || built > 0) this.hasMaterial = true;
  }

  // ------------------------------------------------------------------ reef
  //
  // A fringing reef, in miniature but with the real parts in the real order: a
  // steep fore-reef, a crest sitting just under the surface where the swell
  // trips over it, a shallow rough flat behind, and a sand lagoon in the lee.
  //
  // Two details are worth pointing at. Spur-and-groove — the comb of ridges and
  // channels running down the fore-reef face — is cut in here, because on a
  // real reef it is carved by exactly the wave energy this model has. And the
  // crest is broken by two passes: water driven over the flat by breaking waves
  // has to get back out to sea somewhere, and it leaves through the gaps. Turn
  // the currents overlay on and the rips are plainly visible running out of
  // them, which is the same mechanism as a rip on a sand beach and much easier
  // to see, because the reef holds the channel still instead of letting it
  // wander.
  buildReef() {
    // Cross-shore profile of the coral surface, as (position, height) pairs
    // with position measured from the offshore edge. Straight lines between
    // them: the shape is legible in the numbers this way, and the sand that
    // drapes over it softens the joints anyway.
    const PROF = [
      [0.190, -5.30], [0.270, -2.35], [0.330, -0.72],
      [0.352, -0.28], [0.386, -0.78], [0.480, -0.92],
      [0.512, -2.10], [0.545, -4.60],
    ];
    const GROOVES = Math.max(8, Math.round(13 * (NY / 200)) );
    const PASSES = [0.22, 0.68];        // where the crest is cut through
    const bed = this.bed;

    for (let j = 0; j < NY; j++) {
      const fy = j / NY;
      // grooves: deepest out on the fore-reef face, gone by the crest
      const comb = Math.sin(2 * Math.PI * GROOVES * fy + 0.6);
      // the crest is not a straight line either
      const wob = Math.sin(2 * Math.PI * 3 * fy + 1.9) * 0.10
                + Math.sin(2 * Math.PI * 7 * fy - 0.4) * 0.05;
      // distance to the nearest pass, wrapped
      let passCut = 0;
      for (const py of PASSES) {
        let dy = fy - py;
        dy -= Math.round(dy);
        passCut = Math.max(passCut, Math.exp(-(dy * dy) / (0.024 * 0.024)));
      }
      for (let i = 0; i < NX; i++) {
        const s = i / (NX - 1);
        if (s < PROF[0][0] || s > PROF[PROF.length - 1][0]) continue;
        // piecewise-linear lookup
        let top = PROF[PROF.length - 1][1];
        for (let p = 1; p < PROF.length; p++) {
          if (s <= PROF[p][0]) {
            const [s0, h0] = PROF[p - 1], [s1, h1] = PROF[p];
            top = h0 + (h1 - h0) * ((s - s0) / (s1 - s0));
            break;
          }
        }
        top += wob;
        const fore = Math.max(0, Math.min(1, (0.335 - s) / 0.10));
        top -= 1.25 * fore * fore * (0.5 + 0.5 * comb);
        // a pass is cut clean through the crest and the flat
        top -= 3.4 * passCut;
        const k = j * NX + i;
        // Coverage follows how far the rock actually stands out of the sand,
        // so the coral fades out where it is buried instead of stopping at an
        // arbitrary line.
        const stand = top - bed[k];
        if (stand < -0.4) continue;
        const cov = Math.max(0, Math.min(1, (stand + 0.4) / 0.55));
        // the flat is the roughest part: that is where the branching coral is
        const rough = cov * (s > 0.345 && s < 0.50 ? 1 : 0.7);
        this.stampRock(k, top, cov, rough, 0);
      }
    }

    // Coral heads standing up out of the lagoon floor. Deterministic, so the
    // same beach comes back on reset.
    let seed = 987654321;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let n = 0; n < 18; n++) {
      const ci = Math.round(NX * (0.545 + rnd() * 0.155));
      const cj = Math.round(rnd() * NY);
      const rad = (2.2 + rnd() * 3.4) * SCALE;
      const hgt = 1.0 + rnd() * 1.6;
      const r = Math.ceil(rad * 2.2);
      for (let dj = -r; dj <= r; dj++) {
        const j = ((cj + dj) % NY + NY) % NY;
        for (let di = -r; di <= r; di++) {
          const ii = ci + di;
          if (ii < 1 || ii >= NX - 1) continue;
          const prof = Math.exp(-(di * di + dj * dj) / (rad * rad));
          if (prof < 0.06) continue;
          const k = j * NX + ii;
          this.stampRock(k, bed[k] + hgt * prof, Math.min(1, prof * 1.8),
            Math.min(1, prof * 1.6), 0);
        }
      }
    }
  }

  // ------------------------------------------------------------------ pier
  //
  // Timber piles, stamped in as material the sand cannot touch — the same
  // mechanism as the reef, a different substance on top.
  //
  // One honest caveat. A cell is about 1.5 m across and a real pile is 0.4 m,
  // so a pile cannot be resolved; what is here is one solid cell per pile,
  // which blocks appreciably more of the flow than the real thing does. What
  // that buys is the behaviour actually worth watching, and it is the right
  // behaviour for the right reason: the flow squeezes between the piles, the
  // sediment flux diverges around each one, and a scour hollow digs itself out
  // at the base while sand banks up on the updrift side. Angle the swell and
  // the longshore drift piles sand against one side of the pier and starves
  // the other, which is why real piers grow a beach on one side.
  buildPier() {
    const y = Math.round(NY * 0.5);
    const i0 = Math.round(NX * 0.31);                 // seaward end, past the break
    const i1 = Math.round(NX * 0.90);                 // buried in the dune
    const step = Math.max(3, Math.round(4 * SCALE));  // spacing between bents
    const off = Math.max(1, Math.round(2 * SCALE));   // piles either side of centre
    const headI1 = i0 + Math.round(10 * SCALE);       // widened seaward head
    const headOff = Math.max(2, Math.round(5 * SCALE));
    // Piles stand well clear of the highest tide the tide cycle reaches.
    const top = this.params.tide + 3.6;
    const bents = [];
    for (let i = i0; i <= i1; i += step) {
      const offs = i <= headI1 ? [-headOff, -off, off, headOff] : [-off, off];
      bents.push({ i, offs });
      for (const d of offs) this.stampPile(i, y + d, top);
      for (const d of offs) this.stampScour(i, y + d);
    }
    this.structures.push({
      kind: 'pier', y, i0, i1, headI1, bents,
      half: Math.max(2, Math.round(3.0 * SCALE)),
      headHalf: headOff + Math.max(1, Math.round(1.4 * SCALE)),
      deck: this.params.tide + 3.6,
    });
    this.hasMaterial = true;
  }

  // The disturbed patch of bed around one pile.
  stampScour(i, j0, r = Math.max(2, Math.round(2.2 * SCALE))) {
    for (let dj = -r; dj <= r; dj++) {
      const j = (((j0 + dj) % NY) + NY) % NY;
      for (let di = -r; di <= r; di++) {
        const ii = i + di;
        if (ii < 1 || ii >= NX - 1) continue;
        const d2 = di * di + dj * dj;
        if (d2 > r * r) continue;
        const k = j * NX + ii;
        if (this.built[k] > 0.5) continue;      // the pile itself has no sand
        const w = 1 - Math.sqrt(d2) / (r + 1);
        if (w > this.stir[k]) this.stir[k] = w;
      }
    }
  }

  stampPile(i, j0, top) {
    if (i < 1 || i >= NX - 1) return;
    const j = ((j0 % NY) + NY) % NY;
    const k = j * NX + i;
    // A pile driven into a dune still has to be a pile: keep it above whatever
    // it is standing in.
    this.stampRock(k, Math.max(top, this.bed[k] + 0.5), 0, 1, 1);
  }

  // The groins in the jetty preset are rock too. They used to be piles of sand
  // that dissolved over a few minutes, which quietly undid the thing the preset
  // exists to show.
  buildJetties() {
    for (let j = 0; j < NY; j++) {
      const fy = j / NY;
      if (Math.abs(((fy * 3) % 1) - 0.5) >= 0.05) continue;
      for (let i = 0; i < NX; i++) {
        const s = i / (NX - 1);
        if (s >= 0.82) continue;
        const k = j * NX + i;
        if (this.bed[k] < -6) continue;
        this.stampRock(k, this.bed[k], 0, 0.6, 0);
      }
    }
  }

  // Cut a valley for the river to run down. The bed already falls toward the
  // sea, so once there is a channel the water finds its own way out; everything
  // after that — where the mouth ends up, the delta, the spit across it — is
  // the sediment code doing its job, not a script.
  carveRiver(y) {
    const r = this.river;
    if (y !== undefined) r.y = ((y % NY) + NY) % NY;
    const { bed, eta } = this;
    const w = r.width;
    const from = Math.round(NX * 0.50);
    // Aim for a bed that sits a little below sea level at the shore and climbs
    // gently inland, which is what gives a steady seaward flow.
    for (let i = from; i < NX; i++) {
      const s2 = (i - from) / (NX - 1 - from);
      const target = this.sea - 0.7 + 2.4 * s2 * s2;
      for (let d = -Math.ceil(w * 2.2); d <= Math.ceil(w * 2.2); d++) {
        const j = ((Math.round(r.y) + d) % NY + NY) % NY;
        const k = j * NX + i;
        const prof = Math.exp(-(d * d) / (w * w));
        if (prof < 0.02) continue;
        if (bed[k] > target) bed[k] += (target - bed[k]) * prof;
        if (bed[k] < this.floor[k]) bed[k] = this.floor[k];
        if (eta[k] < bed[k]) eta[k] = bed[k];
      }
    }
    r.carved = true;
  }

  setRiver(on, y) {
    this.river.on = on;
    if (on) this.carveRiver(y);
  }

  resetWater() {
    this.sea = this.params.tide;
    for (let k = 0; k < this.eta.length; k++) {
      this.eta[k] = Math.max(this.bed[k], this.sea);
      this.u[k] = 0;
      this.v[k] = 0;
      this.foam[k] = 0;
      this.turb[k] = 0;
      this.wet[k] = this.eta[k] - this.bed[k] > 0.02 ? 1 : 0;
    }
    this.time = 0;
  }

  setTide(level) {
    const d = level - this.sea;
    this.params.tide = level;
    this.sea = level;
    for (let k = 0; k < this.eta.length; k++) {
      this.eta[k] = Math.max(this.bed[k], this.eta[k] + d);
    }
  }

  // ------------------------------------------------------------- wavemaker

  forcing(j) {
    const p = this.params;
    const depth = Math.max(1.2, this.sea - this.bed[j * NX]);
    const c = Math.sqrt(G * depth);
    const w = 2 * Math.PI * p.frequency;
    const theta = (p.angle * Math.PI) / 180;
    // quantise the alongshore wavenumber so crests wrap seamlessly in y
    const quant = k => (Math.round((k * NY) / (2 * Math.PI)) * 2 * Math.PI) / NY;
    const k1 = quant((w / c) * Math.sin(theta));
    const k2 = quant(((1.87 * w) / c) * Math.sin(theta * 0.6 + 0.25));
    const k3 = quant(((0.61 * w) / c) * Math.sin(theta * 1.4 - 0.2));
    const t = this.time;
    let e = p.amplitude * Math.sin(w * t - k1 * j);
    e += p.amplitude * p.chop * 0.55 * Math.sin(1.87 * w * t - k2 * j + 1.7);
    e += p.amplitude * 0.28 * Math.sin(0.61 * w * t - k3 * j + 4.1);
    // wind sea: short, steep, mostly-aligned junk riding on top of the swell
    if (p.wind > 0.01) {
      e += p.wind * 0.13 * Math.sin(3.4 * w * t - 0.42 * j + 2.1)
         + p.wind * 0.09 * Math.sin(5.1 * w * t + 0.63 * j - 0.7);
    }
    return e;
  }

  // One giant swell: a smooth ridge of water released offshore.
  tsunami(strength = 2.6) {
    const { eta, bed } = this;
    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      const reach = Math.round(40 * SCALE), off = Math.round(6 * SCALE), wid = 11 * SCALE;
      for (let i = 1; i < Math.min(NX, SRCX + reach); i++) {
        const f = Math.exp(-Math.pow((i - (SRCX + off)) / wid, 2));
        const k = row + i;
        if (eta[k] - bed[k] > 0.4) eta[k] += strength * f;
      }
    }
  }

  splash(gx, gy, strength = 1.4, radius = 7) {
    const r2 = radius * radius;
    for (let dj = -radius; dj <= radius; dj++) {
      const j = ((Math.round(gy) + dj) % NY + NY) % NY;
      for (let di = -radius; di <= radius; di++) {
        const i = Math.round(gx) + di;
        if (i < 1 || i >= NX) continue;
        const d2 = di * di + dj * dj;
        if (d2 > r2) continue;
        const f = Math.exp(-d2 / (r2 * 0.30));
        const k = j * NX + i;
        if (this.eta[k] - this.bed[k] > 0.05) {
          this.eta[k] += strength * f;
          this.foam[k] = Math.min(1.15, this.foam[k] + f * 0.35);
        }
      }
    }
  }

  // ------------------------------------------------------------- sculpting

  sculpt(gx, gy, radius, amount, mode) {
    const bed = this.bed, eta = this.eta;
    const r = Math.max(1, radius), r2 = r * r;
    for (let dj = -r; dj <= r; dj++) {
      const j = ((Math.round(gy) + dj) % NY + NY) % NY;
      for (let di = -r; di <= r; di++) {
        const i = Math.round(gx) + di;
        if (i < 1 || i >= NX - 1) continue;
        const d2 = di * di + dj * dj;
        if (d2 > r2) continue;
        const f = Math.pow(1 - Math.sqrt(d2) / r, 1.5);
        const k = j * NX + i;
        if (mode === 'smooth') {
          const jm = ((j - 1 + NY) % NY) * NX + i, jp = ((j + 1) % NY) * NX + i;
          const avg = (bed[k - 1] + bed[k + 1] + bed[jm] + bed[jp]) * 0.25;
          bed[k] += (avg - bed[k]) * f * 0.6;
        } else {
          bed[k] += amount * f;
        }
        // You can pile sand onto coral or against a pile, but you cannot dig
        // either of them away with a finger.
        const fl = this.floor[k];
        bed[k] = bed[k] < fl ? fl : bed[k] > 6.5 ? 6.5 : bed[k];
        if (eta[k] < bed[k]) eta[k] = bed[k];
      }
    }
  }

  // ---------------------------------------------------------------- solver

  step() {
    if (this.paused) return;
    // Timestep is set by the CFL condition, which tightens as 1/SCALE because
    // waves cross a small cell faster than a large one. Measured limits: 0.0667
    // is stable through SCALE 1.25 and diverges at 1.5, so the 1/SCALE law with
    // this constant sits just inside the boundary at every tier. Big swell gets
    // a smaller step again, since the linearised solver is least happy when the
    // wave height is a real fraction of the depth.
    const dtMax = (DT_CFL / Math.max(1, SCALE))
      * Math.min(1, 0.8 / Math.max(0.5, this.params.amplitude));
    // Pick the substep count first, then divide the frame's time advance by it.
    // Rounding the count against a fixed dt instead made the advance land up to
    // 11% off target, so the wave clock ran at slightly different rates on
    // different grids — the same 'time speed' has to mean the same thing
    // everywhere.
    const target = 0.2 * this.params.speed;
    const sub = Math.max(1, Math.min(12, Math.ceil(target / dtMax)));
    const dt = target / sub;
    for (let s = 0; s < sub; s++) {
      this.substep(dt);
      this.time += dt;
    }
    this.lastDt = sub * dt;   // sim-time advanced this frame; entities need it
    this.rippleOff = (this.rippleOff + 3) % (NX * NY);
    this.postProcess(sub * dt);
  }

  substep(dt) {
    const { bed, eta, u, v } = this;
    const p = this.params;
    // Gentle: a swell crossing the whole basin should lose maybe 15% of its
    // height, not 99%.
    const damp = 1 - Math.min(0.02, p.damping * dt * 0.25);
    const gdt = G * dt;

    // --- momentum, x and y fused into one sweep ---
    // Both read only the previous substep's surface, so they can share a pass;
    // that halves the memory traffic of this stage.
    const disp = this.dispersion;
    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      const rowm = ((j - 1 + NY) % NY) * NX;
      u[row] = 0;
      for (let i = 0; i < NX; i++) {
        const b = row + i;
        const eb = eta[b], bb = bed[b];
        if (i > 0) {
          const a = b - 1;
          const ea = eta[a], ba = bed[a];
          if ((ea > eb ? ea : eb) - (ba > bb ? ba : bb) <= 0.002) u[b] = 0;
          else {
            let grad = eb - ea;
            // Dispersion, cross-shore only: that is the direction waves are
            // actually travelling, and it buys the whole effect for one extra
            // stencil read instead of two.
            if (disp && i > 1 && i < NX - 1) {
              const hFace = 0.5 * ((ea - ba) + (eb - bb));
              if (hFace > 0.6) {
                const hc = hFace * DISP_C;
                // third difference centred on this face
                const d3 = eta[b + 1] - 3 * eb + 3 * ea - eta[a - 1];
                let corr = (hc * hc / 3) * d3;
                const lim = DISP_CAP * Math.abs(grad) + 1e-9;
                if (corr > lim) corr = lim; else if (corr < -lim) corr = -lim;
                grad += corr;
              }
            }
            u[b] = (u[b] - gdt * grad) * damp;
          }
        }
        const d = rowm + i;
        const ed = eta[d], bdd = bed[d];
        if ((ed > eb ? ed : eb) - (bdd > bb ? bdd : bb) <= 0.002) v[b] = 0;
        else v[b] = (v[b] - gdt * (eb - ed)) * damp;
      }
    }

    // --- continuity ---
    //
    // Every face flux is computed exactly ONCE and consumed by both of the
    // cells that share it, carried forward in i (horizontally) and in j
    // (vertically). That makes the scheme conservative by construction — no
    // snapshot copy of the surface needed, and half the face arithmetic of the
    // naive version, which recomputed each face twice from a copy.
    const src = this.srcBuf || (this.srcBuf = new Float32Array(NY));
    for (let j = 0; j < NY; j++) src[j] = this.forcing(j);
    const srcGain = 2 * Math.sqrt(G * Math.max(1.2, this.sea - this.bed[SRCX]));
    const sea = this.sea;
    const srcW = this.srcW;

    const fyCarry = this.fyCarry;
    const fyWrap = this.fyWrap;
    const lastRow = (NY - 1) * NX;

    // The y axis wraps, so the seam between the last row and the first is the
    // one face the carry cannot reach. Compute it up front from the untouched
    // surface and hand the same value to both ends.
    for (let i = 0; i < NX; i++) {
      const a = lastRow + i, b = i;
      const h = (eta[a] > eta[b] ? eta[a] : eta[b]) - (bed[a] > bed[b] ? bed[a] : bed[b]);
      fyWrap[i] = h > 0 ? v[b] * h : 0;
      fyCarry[i] = fyWrap[i];
    }

    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      const rowp = j + 1 < NY ? row + NX : 0;
      const last = j === NY - 1;
      let fL = 0;              // no flux through the offshore wall at i = 0
      const spongeAt = SPONGE;

      for (let i = 0; i < NX; i++) {
        const c = row + i;
        const ec = eta[c], bc = bed[c];

        // right face, shared with cell i+1
        let fR = 0;
        if (i + 1 < NX) {
          const r = c + 1;
          const er = eta[r], br = bed[r];
          const h = (ec > er ? ec : er) - (bc > br ? bc : br);
          if (h > 0) fR = u[r] * h;
        }
        // upper face, shared with row j+1 (and with row 0 at the seam)
        let fU;
        if (last) {
          fU = fyWrap[i];
        } else {
          const up = rowp + i;
          const eu = eta[up], bu = bed[up];
          const h = (ec > eu ? ec : eu) - (bc > bu ? bc : bu);
          fU = h > 0 ? v[up] * h : 0;
        }

        let e = ec - dt * (fR - fL + fU - fyCarry[i]);
        // internal wave generator: mass source scaled by local celerity so the
        // requested amplitude comes out right whatever the offshore depth is
        const w = srcW[i];
        if (w > 0) e += dt * srcGain * w * src[j];
        // sponge: absorb everything heading back out to sea
        if (i < spongeAt) {
          const f = (spongeAt - i) / spongeAt;
          let r = f * f * 3.2 * dt;
          if (r > 0.6) r = 0.6;
          e += (sea - e) * r;
          u[c] *= 1 - r;
          v[c] *= 1 - r;
        }
        eta[c] = e < bc ? bc : e;

        fL = fR;
        fyCarry[i] = fU;
      }
    }

    if (this.river.on) this.riverInflow(dt);
  }

  // Discharge at the head of the valley. Water is added as mass and given a
  // seaward nudge; gravity does the rest. The sponge at the ocean edge is the
  // outlet, so the basin's total volume stays bounded however long it runs.
  riverInflow(dt) {
    const r = this.river;
    const { bed, eta, u, turb } = this;
    const q = r.discharge;
    if (q <= 0) return;
    const w = r.width;
    const half = Math.ceil(w * 1.6);
    const i0 = Math.max(1, r.headX - Math.round(6 * SCALE));
    const i1 = Math.min(NX - 1, r.headX + Math.round(2 * SCALE));
    // weight so the total added per unit time is q regardless of grid size
    let wsum = 0;
    for (let d = -half; d <= half; d++) wsum += Math.exp(-(d * d) / (w * w));
    wsum *= (i1 - i0) * SCALE * SCALE;
    if (wsum <= 0) return;
    // Calibrated so a discharge of 1 fills the valley and runs steadily out to
    // sea without spilling across the back-beach.
    const gain = (q * 40) / wsum;
    for (let i = i0; i < i1; i++) {
      for (let d = -half; d <= half; d++) {
        const j = ((Math.round(r.y) + d) % NY + NY) % NY;
        const k = j * NX + i;
        const prof = Math.exp(-(d * d) / (w * w));
        eta[k] += dt * gain * prof;
        // a push toward the sea, so the flow starts moving rather than ponding
        u[k] -= dt * 5.5 * SCALE * prof;
        const load = Math.min(1.4, turb[k] + dt * 2.2 * prof);
        turb[k] = load;
        if (eta[k] < bed[k]) eta[k] = bed[k];
      }
    }
  }

  postProcess(dt) {
    const { bed, eta, u, v, foam, wet, turb, floor, rough } = this;
    const hasFloor = this.hasFloor;
    // Quadratic bed drag, du/dt = -Cd |u| u / H, applied only where the ground
    // is rough. A coral flat or a field of piles takes energy out of the water
    // continuously, not just where it breaks — which is how a reef shelters a
    // lagoon that is deep enough for the swell to cross unbroken. Sand is
    // smooth enough that the uniform damping already covers it.
    const CD_BED = 0.12;
    let foamTotal = 0, breakEnergy = 0, swashEnergy = 0;
    const p = this.params;
    const sea = this.sea;
    // Whitewater should live for a second or two and drift shoreward. It used
    // to decay with a 0.07 s time constant, which meant foam existed only in
    // the exact cells generating it — isolated blobs instead of surf.
    const foamDecay = Math.exp(-0.055 * dt);
    const etaFilter = Math.min(0.40, 0.18 + p.amplitude * 0.18);
    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      const rowp = (j + 1 < NY ? j + 1 : 0) * NX;
      const rowm = (j > 0 ? j - 1 : NY - 1) * NX;
      for (let i = 1; i < NX - 1; i++) {
        const c = row + i;
        const H = eta[c] - bed[c];

        // --- stabilisers, both with a physical reading ---
        // 1. waves break (and dump their energy into foam) once the crest gets
        //    close to the still-water depth.
        const stillH = sea - bed[c];
        if (stillH > 0.04) {
          // The cap needs a floor, or the shallows can never rise and the swash
          // never reaches dry sand.
          const cap = Math.min(2.2 * (p.amplitude + 0.5),
            Math.max(0.9 * p.amplitude + 0.4, 0.85 * stillH));
          const over = eta[c] - sea - cap;
          if (over > 0) {
            eta[c] -= over * 0.55;     // relax, don't snap: snapping rings
            foam[c] = Math.min(1.15, foam[c] + 0.05);
          }
        }
        // 2. water can't outrun its own wave speed by much.
        if (H > 0.002) {
          const vmax = 1.3 * Math.sqrt(G * H) + 0.5 * VS;
          if (u[c] > vmax) u[c] = vmax; else if (u[c] < -vmax) u[c] = -vmax;
          if (v[c] > vmax) v[c] = vmax; else if (v[c] < -vmax) v[c] = -vmax;
        } else { u[c] = 0; v[c] = 0; }

        const spd = Math.abs(u[c]) + Math.abs(v[c]);
        if (hasFloor) {
          const rg = rough[c];
          // Thin water over a rough bed would otherwise divide by almost
          // nothing, so the depth is floored before it is divided by.
          if (rg > 0.01 && H > 0.02) {
            const loss = CD_BED * rg * (spd / VS) / (H > 0.30 ? H : 0.30);
            const m = 1 / (1 + loss * dt);
            u[c] *= m; v[c] *= m;
          }
        }

        // foam: breaking crests + whitecaps + swash on wet sand
        let f = foam[c] * foamDecay;
        // Whitewater is only MADE in the sea. Above the waterline — swash, or a
        // river running downhill — the surface sits well above sea level, so a
        // crest-versus-sea-level test fires permanently and paints the whole
        // thing white. Foam gets there by being carried, not by being created.
        const stillHere = sea - bed[c];
        if (H > 0.02 && stillHere > 0.04) {
          const crest = eta[c] - sea;
          // spilling breaker: crest height rivals the local depth
          if (H < 3.0 && crest > 0.40 * H) {
            f += 0.34 * dt * Math.min(1.2, crest / Math.max(0.18, H));
          }
          // whitecaps where the surface is genuinely racing
          if (H > 0.15 && spd > 2.8 * VS) {
            f += 0.10 * dt * Math.min(1.0, (spd - 2.8 * VS) * 0.4 / VS);
          }
        }
        foam[c] = f > 1.15 ? 1.15 : f;
        // Breaking waves lift sand into the water, so the surf runs murky. Free
        // to add here: foam and speed are already in hand.
        // Kept well below the river's load, and capped: the surf should look
        // faintly churned, not like the whole coast is in flood. One field
        // serves both because they never need telling apart — only showing.
        if (H > 0.03 && H < 2.2) {
          const stir = foam[c] * 0.35 + (spd > 1.4 * VS ? (spd / VS - 1.4) * 0.16 : 0);
          if (stir > 0.01 && turb[c] < SURF_TURB) {
            const t2 = turb[c] + stir * dt * 0.10;
            turb[c] = t2 > SURF_TURB ? SURF_TURB : t2;
          }
        }

        // drivers for the soundscape and the readouts, free while we are here
        foamTotal += foam[c];
        if (H > 0.10 && H < 3.0) {
          const st = (eta[c] - sea) / H;
          if (st > 0.36) breakEnergy += (st - 0.36) * H;
        } else if (H > 0.02 && H <= 0.10) {
          swashEnergy += spd;
        }

        // wetness memory -> dark wet sand and receding swash lines
        if (H > 0.025) wet[c] = 1;
        else wet[c] = Math.max(0, wet[c] - dt * 0.12);

        // Avalanche. Submerged sand has a much lower angle of repose than dry
        // sand, so underwater piles slump while dunes hold their shape. The
        // excess is handed to the four neighbours rather than deleted, or the
        // beach would slowly dissolve.
        const nA = c - 1, nB = c + 1, nC = rowm + i, nD = rowp + i;
        const avg2 = (bed[nA] + bed[nB] + bed[nC] + bed[nD]) * 0.25;
        const diff = bed[c] - avg2;
        // repose eases from submerged (slumps readily) to dry (holds a dune)
        // slope limits are per-cell rises, so they shrink as cells do
        const repose = (0.45 + 0.5 * Math.max(0, 1 - H / 0.30)) / VS;
        let slump = 0;
        if (diff > repose) slump = (diff - repose) * 0.4;
        else if (diff < -repose) slump = (diff + repose) * 0.4;
        if (hasFloor && slump !== 0) {
          // Only the loose sand lying on top can slump. Without this the reef
          // crest and the pier piles — both steep by construction — would
          // collapse into their surroundings within a second of loading, and
          // the avalanche would be manufacturing sand out of solid rock.
          if (slump > 0) {
            const loose = bed[c] - floor[c];
            if (slump > loose) slump = loose > 0 ? loose : 0;
          } else {
            // A hollow fills itself from its neighbours, and they may be rock.
            let give = bed[nA] - floor[nA];
            const gB = bed[nB] - floor[nB]; if (gB < give) give = gB;
            const gC = bed[nC] - floor[nC]; if (gC < give) give = gC;
            const gD = bed[nD] - floor[nD]; if (gD < give) give = gD;
            if (give < 0) give = 0;
            if (-slump * 0.25 > give) slump = -give * 4;
          }
        }
        if (slump !== 0) {
          bed[c] -= slump;
          const share = slump * 0.25;
          bed[nA] += share; bed[nB] += share; bed[nC] += share; bed[nD] += share;
        }
      }
    }
    // A staggered leapfrog happily carries a 2-cell checkerboard mode, and the
    // wet/dry front at the shoreline pumps it hard. A 5-point filter multiplies
    // that mode by (1 - 2w) per frame while leaving the ~100-cell swell alone,
    // so it is the cheapest possible de-noiser. Surface filtering is restricted
    // to fully wet neighbourhoods: diffusing eta across the waterline would
    // smear water onto dry sand.
    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      const rowp = (j + 1 < NY ? j + 1 : 0) * NX;
      const rowm = (j > 0 ? j - 1 : NY - 1) * NX;
      for (let i = 1; i < NX - 1; i++) {
        const c = row + i, cd = rowm + i, cu = rowp + i;
        u[c] += ((u[c - 1] + u[c + 1] + u[cd] + u[cu]) * 0.25 - u[c]) * 0.22;
        v[c] += ((v[c - 1] + v[c + 1] + v[cd] + v[cu]) * 0.25 - v[c]) * 0.22;
        if (eta[c] - bed[c] > 0.05 && eta[c - 1] - bed[c - 1] > 0.05 &&
            eta[c + 1] - bed[c + 1] > 0.05 && eta[cd] - bed[cd] > 0.05 &&
            eta[cu] - bed[cu] > 0.05) {
          eta[c] += ((eta[c - 1] + eta[c + 1] + eta[cd] + eta[cu]) * 0.25 - eta[c]) * etaFilter;
        }
      }
    }
    // Foam rides the water: advecting it (semi-Lagrangian) makes breakers trail
    // real streaks shoreward instead of drawing static outlines. The sampling is
    // inlined rather than going through bilinear() — this is the single hottest
    // loop in the frame, and the generic version's bounds handling dominated it.
    const ft = this.foamTmp;
    const k = dt * 1.7;
    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      for (let i = 0; i < NX; i++) {
        const c = row + i;
        const f0 = foam[c];
        if (f0 < 0.002 && eta[c] - bed[c] < 0.02) { ft[c] = f0; continue; }
        let x = i - u[c] * k;
        let y = j - v[c] * k;
        if (x < 0) x = 0; else if (x > NX - 1.001) x = NX - 1.001;
        const i0 = x | 0, fx = x - i0;
        let j0 = Math.floor(y);
        const fy = y - j0;
        j0 = ((j0 % NY) + NY) % NY;
        const j1 = j0 + 1 < NY ? j0 + 1 : 0;
        const r0 = j0 * NX + i0, r1 = j1 * NX + i0;
        const a = foam[r0], b = foam[r0 + 1];
        const cc = foam[r1], dd = foam[r1 + 1];
        const top = a + (b - a) * fx;
        const bot = cc + (dd - cc) * fx;
        ft[c] = top + (bot - top) * fy;
      }
    }
    // blur so it reads as sheets rather than pixels
    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      const rowp = (j + 1 < NY ? j + 1 : 0) * NX;
      const rowm = (j > 0 ? j - 1 : NY - 1) * NX;
      for (let i = 1; i < NX - 1; i++) {
        const c = row + i;
        foam[c] = ft[c] + ((ft[c - 1] + ft[c + 1] + ft[rowm + i] + ft[rowp + i]) * 0.25 - ft[c]) * 0.5;
      }
    }

    this.advectTurb(dt);

    const cells = NX * NY;
    this.foamTotal = foamTotal / cells;
    this.breakEnergy = breakEnergy / cells;
    this.swashEnergy = swashEnergy / cells;

    this.transportSand(dt);
  }

  // Silt is carried by the water and settles out of it. Advecting the tracer is
  // what turns the river into a plume: it fans out at the mouth, gets bent along
  // the coast by the longshore current, and thins as it mixes — none of which
  // could be drawn from the river's position alone.
  advectTurb(dt) {
    const { turb, turbTmp, u, v, eta, bed } = this;
    const k = dt * 1.9;
    // Slow enough that a plume reaches well offshore before it clears; silt
    // settling is a matter of minutes in reality, not seconds.
    const settle = Math.exp(-0.035 * dt);
    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      for (let i = 0; i < NX; i++) {
        const c = row + i;
        const t0 = turb[c];
        const H = eta[c] - bed[c];
        if (H < 0.02) { turbTmp[c] = 0; continue; }      // silt drops out on dry sand
        if (t0 < 0.002) {
          // still has to sample: a plume can flow into a clean cell
          if (Math.abs(u[c]) + Math.abs(v[c]) < 0.02) { turbTmp[c] = t0; continue; }
        }
        let x = i - u[c] * k;
        let y = j - v[c] * k;
        if (x < 0) x = 0; else if (x > NX - 1.001) x = NX - 1.001;
        const i0 = x | 0, fx = x - i0;
        let j0 = Math.floor(y);
        const fy = y - j0;
        j0 = ((j0 % NY) + NY) % NY;
        const j1 = j0 + 1 < NY ? j0 + 1 : 0;
        const r0 = j0 * NX + i0, r1 = j1 * NX + i0;
        const a = turb[r0], b = turb[r0 + 1];
        const cc = turb[r1], dd = turb[r1 + 1];
        const top = a + (b - a) * fx;
        const bot = cc + (dd - cc) * fx;
        turbTmp[c] = (top + (bot - top) * fy) * settle;
      }
    }
    // spread a little, so the plume has soft edges rather than pixel steps
    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      const rowp = (j + 1 < NY ? j + 1 : 0) * NX;
      const rowm = (j > 0 ? j - 1 : NY - 1) * NX;
      for (let i = 1; i < NX - 1; i++) {
        const c = row + i;
        turb[c] = turbTmp[c]
          + ((turbTmp[c - 1] + turbTmp[c + 1] + turbTmp[rowm + i] + turbTmp[rowp + i]) * 0.25
            - turbTmp[c]) * 0.30;
      }
    }
  }

  // ------------------------------------------------------- sand transport
  //
  // Bedload, in flux form. Grains start moving once the water is faster than a
  // threshold, they travel WITH the current, and the bed rises wherever that
  // flux converges. Because it is a divergence, sand is conserved: what leaves
  // one cell arrives in the next. That single property is what produces the
  // interesting behaviour — bars that migrate, scour holes below a breaking
  // wave, and sand carried along the beach by an angled swell that then piles
  // up against anything blocking it.
  transportSand(dt) {
    const { bed, eta, u, v, foam, qx, qy, floor } = this;
    const ero = this.params.erosion;
    if (ero <= 0) return;
    // How much sand each cell has to give. Coral and timber have none, so no
    // flux can start there; sand can still be carried ONTO them and drape over
    // the rock, and can be swept off again later, which is what a reef flat
    // does. Doing it as a mobility on the flux rather than as a clamp on the
    // bed afterwards is what keeps sand conserved: clamping the bed would
    // quietly delete whatever the surf tried to lift off the rock.
    const stirF = this.hasFloor ? this.stir : null;
    let mob = null;
    if (this.hasFloor) {
      mob = this.mob || (this.mob = new Float32Array(NX * NY));
      // A thin veneer still moves, so mobility fades in over a few centimetres
      // rather than switching on at exactly one grain.
      const LOOSE = 0.12;
      for (let k = 0; k < mob.length; k++) {
        const d = (bed[k] - floor[k]) / LOOSE;
        mob[k] = d <= 0 ? 0 : d >= 1 ? 1 : d;
      }
    }
    // K carries a 1/VS so that the same water speed moves the same amount of
    // sand per unit of beach at any resolution.
    const K = (0.30 * ero) / VS;
    const CRIT = 0.16 * VS;     // grains sit still below this speed
    // Runaway is capped at the FACE, not on the bed: both cells sharing a face
    // see the same clamped flux, so clamping here loses no sand, while clamping
    // the bed change afterwards quietly deletes it.
    const QMAX = 0.15 / Math.max(0.02, dt);
    // Downslope creep. Pure advective bedload is unstable at cell scale — it
    // grows a field of little lumps — so moving water also drags sand down the
    // local gradient. That damps the short wavelengths and leaves the coherent
    // bars and channels standing.
    const KD = 0.14 * ero;
    // Dry sand creeps too: wind knocks grains off whatever you pile up, so
    // sculpted dunes soften instead of standing forever. It goes through the
    // same flux array as everything else — done as a separate relaxation pass
    // it exchanged one-sidedly with the waterline and slowly ate the beach.
    const KW = 0.28 * this.params.wind * ero;
    const sea = this.sea;
    const MOBILE = 0.035;       // shallowest water that still carries sand

    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      const rowm = (j > 0 ? j - 1 : NY - 1) * NX;
      for (let i = 0; i < NX; i++) {
        const c = row + i;

        let fx = 0;
        if (i > 0) {
          const a = c - 1;
          const h = Math.min(eta[a] - bed[a], eta[c] - bed[c]);
          const sp = Math.abs(u[c]);
          // A film of water a few millimetres deep flickers wet/dry every frame
          // and would spray sand around the waterline, so transport fades in.
          const thin = h > MOBILE ? Math.min(1, (h - MOBILE) / 0.15) : 0;
          // Sand runs downhill out of the higher cell and is advected out of
          // the upstream one, so each term is limited by a different neighbour.
          const mCr = mob === null ? 1 : (bed[c] > bed[a] ? mob[c] : mob[a]);
          if (thin > 0) {
            // Surf-zone mixing spreads sand as well as carrying it, so foam
            // raises the creep too. Without this the swash line goes gravelly.
            const mix = 1 + 2.6 * Math.min(1, (foam[a] + foam[c]) * 0.5);
            fx = -KD * (0.15 * VS + sp) * mix * thin * mCr * (bed[c] - bed[a]);
          }
          else if (KW > 0 && bed[a] > sea && bed[c] > sea) fx = -KW * mCr * (bed[c] - bed[a]);
          if (thin > 0 && sp > CRIT) {
            // breaking waves stir sand into suspension, so foam multiplies the
            // load — this is why the surf zone reshapes fastest
            let stir = 1 + 3.2 * Math.min(1, (foam[a] + foam[c]) * 0.5);
            if (stirF !== null) stir *= 1 + 3.4 * (stirF[a] + stirF[c]) * 0.5;
            const ex = sp - CRIT;
            const mAd = mob === null ? 1 : (u[c] > 0 ? mob[a] : mob[c]);
            // No explicit depth term: deep water is slow, so it moves little on
            // its own. Weighting by shallowness instead made bar crests the
            // most active place on the map, and they grew without limit.
            fx += (u[c] > 0 ? 1 : -1) * ex * ex * stir * thin * mAd * K;
          }
          if (fx > QMAX) fx = QMAX; else if (fx < -QMAX) fx = -QMAX;
        }
        qx[c] = fx;

        let fy = 0;
        const d = rowm + i;
        const h2 = Math.min(eta[d] - bed[d], eta[c] - bed[c]);
        const sp2 = Math.abs(v[c]);
        const thin2 = h2 > MOBILE ? Math.min(1, (h2 - MOBILE) / 0.15) : 0;
        const mCr2 = mob === null ? 1 : (bed[c] > bed[d] ? mob[c] : mob[d]);
        if (thin2 > 0) {
          const mix = 1 + 2.6 * Math.min(1, (foam[d] + foam[c]) * 0.5);
          fy = -KD * (0.15 * VS + sp2) * mix * thin2 * mCr2 * (bed[c] - bed[d]);
        }
        else if (KW > 0 && bed[d] > sea && bed[c] > sea) fy = -KW * mCr2 * (bed[c] - bed[d]);
        if (thin2 > 0 && sp2 > CRIT) {
          let stir = 1 + 3.2 * Math.min(1, (foam[d] + foam[c]) * 0.5);
          if (stirF !== null) stir *= 1 + 3.4 * (stirF[d] + stirF[c]) * 0.5;
          const ex = sp2 - CRIT;
          const mAd2 = mob === null ? 1 : (v[c] > 0 ? mob[d] : mob[c]);
          fy += (v[c] > 0 ? 1 : -1) * ex * ex * stir * thin2 * mAd2 * K;
        }
        if (fy > QMAX) fy = QMAX; else if (fy < -QMAX) fy = -QMAX;
        qy[c] = fy;
      }
    }

    let clipped = 0;
    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      const rowp = (j + 1 < NY ? j + 1 : 0) * NX;
      for (let i = 0; i < NX; i++) {
        const c = row + i;
        // faces outside the basin carry nothing, so the walls neither gain nor
        // lose sand
        const fR = i + 1 < NX ? qx[c + 1] : 0;
        const div = (fR - qx[c]) + (qy[rowp + i] - qy[c]);
        const db = -dt * div;
        let nb = bed[c] + db;
        const fl = floor[c];
        if (nb < fl) { nb = fl; clipped++; } else if (nb > 6.5) { nb = 6.5; clipped++; }
        bed[c] = nb;
        // a bar that grows above the surface displaces the water sitting on it
        if (nb > eta[c]) eta[c] = nb;
      }
    }
    this.sandClipped = clipped;
  }

  // ---------------------------------------------------------------- probes

  idx(i, j) {
    const ii = Math.max(0, Math.min(NX - 1, i | 0));
    const jj = ((j | 0) % NY + NY) % NY;
    return jj * NX + ii;
  }

  bilinear(field, x, y) {
    const i0 = Math.floor(x), j0 = Math.floor(y);
    const fx = x - i0, fy = y - j0;
    const a = field[this.idx(i0, j0)], b = field[this.idx(i0 + 1, j0)];
    const c = field[this.idx(i0, j0 + 1)], d = field[this.idx(i0 + 1, j0 + 1)];
    return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
  }

  depthAt(x, y) {
    return Math.max(0, this.bilinear(this.eta, x, y) - this.bilinear(this.bed, x, y));
  }
  etaAt(x, y) { return this.bilinear(this.eta, x, y); }
  bedAt(x, y) { return this.bilinear(this.bed, x, y); }
  velAt(x, y) {
    return [this.bilinear(this.u, x, y), this.bilinear(this.v, x, y)];
  }
  slopeAt(field, x, y) {
    return [
      (this.bilinear(field, x + 1, y) - this.bilinear(field, x - 1, y)) * 0.5,
      (this.bilinear(field, x, y + 1) - this.bilinear(field, x, y - 1)) * 0.5,
    ];
  }
}
