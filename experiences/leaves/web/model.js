/* ============================================================================
 * Fall Leaf Color Simulation — Phase 1: pure biological/environmental model.
 *
 * NO RENDERING IN THIS FILE. It runs identically in the browser and in Node
 * (see test-model.js). Everything here is a function of state + environment.
 *
 * PROVENANCE TAGS on every constant, per plan.md's instruction to flag it:
 *   [V]    Verified against a published source. See leaf-phenology-data.md.
 *   [P]    Plausible — indirect or non-peer-reviewed support.
 *   [TUNE] Free parameter. Inside a published range where one exists, but the
 *          specific value was chosen to make the season land in the right
 *          place. Not a cited fact.
 *   [GUESS] Weaker than [TUNE]: no published range to sit inside and no local
 *          observational record to calibrate against. Direction is sourced;
 *          magnitude is invented. Introduced when the site moved west — the
 *          Wasatch has no open coloration record equivalent to Harvard Forest's
 *          HF003, so values that were anchored to a documented pattern in New
 *          England are now anchored only to a qualitative description.
 *
 * Section numbers in comments (§3.1 etc.) refer to leaf-phenology-data.md.
 *   §1-§10  the original research; equation forms and pigment chemistry still
 *           hold, but site-specific numbers there are marked SUPERSEDED.
 *   §11     the LIVE Wasatch calibration — baseline, species, drivers, and the
 *           full constant set mirrored as JSON in §11.5.
 * ==========================================================================*/

/*
 * The global is published UNCONDITIONALLY, and module.exports only as well.
 *
 * This used to be an either/or -- CommonJS if `module` was around, the global
 * otherwise -- and on the wall that silently picked the wrong one. The shell
 * the kiosk runs the page in leaves a `module` object in the page's global
 * scope, so the CommonJS branch won and window.LeafModel was never set, which
 * index.html reports as "the sibling script did not load" even though the
 * script had loaded and run perfectly. In a plain browser there is no `module`
 * and it worked, which is why it only ever failed on the wall.
 *
 * There is no reason these have to be exclusive: index.html reads the global
 * and never looks at module.exports, test-model.js / check-docs.js /
 * calibrate-species.js require() this file and never look at the global. Doing
 * both means neither can be starved by an environment guess going wrong.
 *
 * `root` resolves through globalThis first so it is always a real object --
 * under `self` alone it would have been `this`, which is undefined in an ES
 * module and would throw here now that root is always dereferenced.
 */
(function (root, factory) {
  var api = factory();
  root.LeafModel = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis
   : typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var D2R = Math.PI / 180;
  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };

  /* ==========================================================================
   * 0. Seeded RNG — mulberry32. Reproducibility matters: Phase 3 tuning is
   *    impossible if the same slider settings give a different season each run.
   * ========================================================================*/
  function makeRng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ==========================================================================
   * 1. ASTRONOMY — photoperiod and insolation from day-of-year + latitude.
   *
   * Forsythe et al. CBM daylength model. [V] Reproduces the day-length table in
   * §2 exactly: 15.31 h at the solstice and 11.14 h on Oct 15 at 42.54 N.
   * ========================================================================*/

  // Solar declination (radians) — the CBM intermediate, reused for insolation.
  function declination(doy) {
    var theta = 0.2163108 + 2 * Math.atan(0.9671396 * Math.tan(0.00860 * (doy - 186)));
    return Math.asin(0.39795 * Math.cos(theta));
  }

  function dayLength(doy, lat) {
    var phi = declination(doy);
    var p = 0.8333;                                     // [V] sunrise/sunset refraction
    var x = (Math.sin(p * D2R) + Math.sin(lat * D2R) * Math.sin(phi)) /
            (Math.cos(lat * D2R) * Math.cos(phi));
    return 24 - (24 / Math.PI) * Math.acos(clamp(x, -1, 1));
  }

  // Clear-sky daily insolation, normalised to the summer-solstice value at this
  // latitude. Captures the real seasonal light decline (~0.48 by mid-October at
  // 42.5 N) instead of treating "sunlight" as season-independent.
  function insolationIndex(doy, lat) {
    function raw(d) {
      var elev = Math.PI / 2 - Math.abs(lat * D2R - declination(d));
      return Math.max(0, Math.sin(elev)) * dayLength(d, lat);
    }
    var ref = raw(172);
    return ref > 0 ? clamp(raw(doy) / ref, 0, 1) : 0;
  }

  /* ==========================================================================
   * 2. SEASONAL BASELINE — the trajectory the sliders modulate.
   *
   * plan.md decision: sliders shift a baseline season, they do not override an
   * instant. §5 vindicates this — the SIGN of a temperature effect depends on
   * whether it lands before or after the solstice, which an instantaneous
   * override cannot express.
   * ========================================================================*/

  // Daily minimum temperature — WASATCH MONTANE, semi-arid.
  // Reference site: Park City UT, 40.65 N, ~2100 m.
  // Sinusoid fitted to the 1991-2020 normals for the two months that decide
  // autumn: mean September low 6 C, mean October low 1 C. [V]
  // Daily MINIMUM, not mean: §3.1 — the best-performing senescence models use
  // minimum temperature. [V]
  //
  // Note this is an ELEVATION signature, not a latitude one: compared with the
  // previous New England baseline the seasonal amplitude is SMALLER (10.3 vs
  // 13.4) but the offset is far colder (0.42 vs 2.25). The latitude lapse below
  // cannot express that, which is why the whole baseline is swapped rather than
  // shifted.
  var T_OFFSET_C  = 0.4205;  // [V] from the Sep/Oct normals fit
  var T_AMP_C     = 10.313;  // [V] from the Sep/Oct normals fit
  var T_PEAK_DOY  = 200;     // [TUNE]
  var DIURNAL_C   = 14.0;    // [V] Park City normals: Sep 14 C, Oct 12 C,
                             // Aug 15 C. Wider than New England's 12 C — dry
                             // air, clear skies.

  // Night-to-night variability, as the standard deviation of the noise term.
  // [P] This is load-bearing for a semi-arid site: mean September low is 6 C, so
  // the reported "first freeze near Sep 25" can ONLY happen through large
  // clear-sky radiative-cooling swings. With New England's narrow noise the
  // model would never freeze in September at all.
  var T_NOISE_SD_C = 2.6;

  // Coarse continental lapse with latitude. [P] Without this the latitude
  // slider is actively misleading: it would lengthen summer daylight without
  // making anywhere colder, so RAISING latitude DELAYED senescence — the
  // opposite of the observed gradient. ~0.65 C per degree of latitude, with a
  // slightly larger seasonal swing further north.
  var LAT_REF        = 40.65;   // where the temperature fit was anchored
  var LAT_LAPSE_C    = 0.65;    // [P] per degree of latitude
  var LAT_AMP_PER_DEG = 0.012;  // [P] continentality grows poleward

  function baselineTmin(doy, lat) {
    var dLat = (lat == null ? LAT_REF : lat) - LAT_REF;
    var offset = T_OFFSET_C - LAT_LAPSE_C * dLat;
    var amp = T_AMP_C * (1 + LAT_AMP_PER_DEG * dLat);
    return offset + amp * Math.cos(2 * Math.PI * (doy - T_PEAK_DOY) / 365);
  }

  /* ==========================================================================
   * 3. SPECIES PROFILES — a config table, not branching logic.
   *    Same equations for every species; only these numbers differ.
   *
   * WASATCH / INTERIOR WEST trio. These three carry most of Utah's fall colour
   * (USU Forestry Extension, "Fall Color in Utah"). They map onto the eastern
   * maple/oak/birch roles closely enough that the equations did not change —
   * only the table did, which is what the config-table decision was for.
   *
   * pSen  photoperiod gate, hours. Published calibration range 10-16 h. [V]
   *       HIGHER = gate opens EARLIER in the season = earlier turner.
   *       24 h means "no gate" — see the aspen note below.
   * ySen  photoperiod weight. 0 = pure thermal accumulator. Species-specific,
   *       because the dependence on photoperiod vs thermal forcing genuinely
   *       differs between species. [V]
   * sCrit critical cold-degree-day sum. Scale-dependent on T_SEN_C, X_SEN, pSen
   *       AND ySen — re-run calibrate-species.js if you touch any of them.
   *       Values are NOT comparable between a gated and an ungated species.
   *
   * Colour sequence being reproduced: high-country aspen turns first (mid to
   * late September), then bigtooth maple and Gambel oak in the lower canyons
   * through the first two weeks of October. [V]
   * ========================================================================*/

  var SPECIES = {
    bigtoothMaple: {
      name: 'Bigtooth maple',       // Acer grandidentatum
      pSen: 13.0,                   // [V range] photoperiod-gated
      ySen: 2.0,                    // [TUNE] shorter days amplify (DM2)
      sCrit: 630,                   // [GUESS] calibrated to a target date, see
                                    // calibrate-species.js. No local record.
      chlDecay: 1.00,               // [P] medium, like eastern sugar maple
      carotenoid: 0.42,             // [V] green-leaf chl:carotenoid 2-2.5:1, §3.6
      green: { h: 106, s: 0.46, l: 0.33 },  // [P] mid green, the reference tone
      anthoPotential: 1.00,         // [V] "brilliant orange-red" — USU Extension
      fallFloor: 0.55,              // [TUNE]
      marcescence: 0.00
    },
    gambelOak: {
      name: 'Gambel oak',           // Quercus gambelii
      pSen: 12.5,                   // [V range] latest turner
      ySen: 2.0,                    // [TUNE]
      sCrit: 1114,                  // [GUESS]
      chlDecay: 0.80,               // [P] slow, as oaks generally
      carotenoid: 0.34,             // [P]
      green: { h: 116, s: 0.40, l: 0.25 },  // [P] darkest and slightly blue-green
                                    // — oak foliage is thick and leathery
      anthoPotential: 0.55,         // [V] "orange to red-orange" — REDDER than
                                    // the eastern white oak this replaces
      fallFloor: 0.60,              // [TUNE]
      marcescence: 0.35             // [V] §6.1 — oaks retain dead leaves
    },
    aspen: {
      name: 'Quaking aspen',        // Populus tremuloides
      // NOT photoperiod-gated. Michelson et al. 2018 tested 116 aspen genotypes
      // across two common gardens 8 degrees of latitude apart and found autumn
      // senescence onset "incompatible with the trigger being the day length
      // per se" — genotypes senescing before the equinox started EARLIER where
      // days were LONGER. Bud set was photoperiodic; senescence was not. [V]
      // Caveat: that work is on Populus tremula, the European congener.
      //
      // pSen 24 h keeps the gate permanently open and ySen 0 removes the
      // photoperiod term entirely, leaving pure cold-degree-day accumulation
      // from the solstice. Species-specific weighting of photoperiod vs thermal
      // forcing is the documented position, not a workaround. [V]
      pSen: 24.0,
      ySen: 0.0,
      sCrit: 605,                   // [GUESS] NOT comparable to the values
                                    // above: with no photoperiod gate this sums
                                    // from the solstice, so it accumulates ~10
                                    // extra weeks before September.
      chlDecay: 1.40,               // [P] fast — earliest turner
      carotenoid: 0.58,             // [V] "usually tends more toward bright
                                    // yellow"
      green: { h: 95, s: 0.50, l: 0.40 },   // [P] lightest and yellowest — thin
                                    // leaves, and they flash paler undersides
                                    // as they flutter
      anthoPotential: 0.15,         // [V] "can be orange or even orange-red"
                                    // — a little more than eastern birch
      fallFloor: 0.50,              // [TUNE]
      marcescence: 0.00
    }
  };

  /* ==========================================================================
   * 4. MODEL CONSTANTS
   * ========================================================================*/

  // --- Senescence clock: Delpierre DM2, §3.1 -------------------------------
  var T_SEN_C = 20.0;   // [V range] cold-degree-day BASE temperature. Published
                        // calibration range is +7 to +30 C. NOT the ~10 C in the
                        // original plan.md — at 10 C almost nothing accumulates
                        // until late October. This is the single biggest fix.
  var X_SEN   = 1.0;    // [TUNE] temperature exponent. 1.0 keeps the literal
                        // cold-degree-day meaning: sum of (base - Tmin).
  // The photoperiod exponent y_sen now lives in the SPECIES table, because
  // senescence control is species-specific: some species are photoperiod-gated
  // and some are essentially pure thermal accumulators. [V]
  var ACCUM_START_DOY = 173;  // [V] summer solstice — where the literature
                              // starts accumulating, §3.1.

  // --- Chlorophyll ---------------------------------------------------------
  var K_CHL = 6.2;      // [TUNE] LOGISTIC decay coefficient per unit of
                        // senescence progress. Logistic, not plain exponential:
                        // a plain exponential front-loads the loss (rate goes
                        // as chl, so the biggest absolute drop happens first),
                        // which stripped the green weeks before the cool nights
                        // arrived and left nothing degrading during the
                        // anthocyanin window. Real chlorophyll curves are
                        // sigmoid — that is why the literature needs breakpoint
                        // analysis to locate onset at all. [V] §9
  var K_CHL_CAP = 1.05; // [TUNE] logistic ceiling; controls how slowly the
                        // decline gets going from a full green canopy.

  // --- Sugar (borrowed from the NetLogo reference, §7) ---------------------
  // Explicit sugar makes "cloudy autumn -> duller reds" emergent rather than a
  // separate hand-added term: fewer photons -> smaller pool -> less substrate.
  var SUGAR_PROD    = 0.28;   // [TUNE]
  var SUGAR_RESP    = 0.035;  // [TUNE] baseline loss
  var SUGAR_EXPORT  = 0.25;   // [TUNE] extra loss on warm nights (veins open)
  var EXPORT_T_LO   = 2.0;    // [V] cool nights trap sugars in the leaf
  var EXPORT_T_SPAN = 10.0;   // [TUNE]

  // --- Anthocyanin, §3.2 --------------------------------------------------
  var K_ANTHO      = 3.4;   // [TUNE] lowered from 6.0 when the site moved west.
                            // The Wasatch is both sunnier (25% vs 35% default
                            // cloud) and colder, so 6.0 pinned bigtooth maple at
                            // the 1.0 clamp in an average season — which throws
                            // away the sunny-vs-cloudy discrimination entirely.
                            // 3.4 puts an average season near 0.8 and leaves a
                            // good year somewhere to go.
  var ANTHO_T_MIN  = 0.0;   // [V] must stay ABOVE freezing
  var ANTHO_T_PEAK = 7.0;   // [V] "below 45 F but not freezing"
  var ANTHO_T_MAX  = 12.0;  // [V] outer envelope

  // --- Tannin / brown -----------------------------------------------------
  var TANNIN_ONSET = 0.70;  // [TUNE] senescence fraction where browning starts
  var TANNIN_RATE  = 0.035; // [TUNE]

  /* --- Antecedent winter precipitation: the WESTERN primary driver --------
   * Li, Donnelly & Wang 2026, Agric. For. Meteorol. 384:111190. In the western
   * US, autumn phenology tracks JANUARY-MARCH precipitation more strongly than
   * summer temperature: a wet Jan-Mar means colour change and leaf fall come
   * LATER than normal. [V]
   *
   * This is the structural difference from the eastern model. It is not a daily
   * driver — it is a seasonal conditioner set before the season starts, so it
   * scales sCrit rather than entering the daily rate. In-season rain stays what
   * it was in the east: a weak mechanical knock-down, nothing more.
   *
   * Blonder et al. 2023 found aspen responds to climate up to THREE YEARS back.
   * Not modelled — one antecedent season is as far as this goes. [V]
   */
  var WINTER_PRECIP_SENS = 0.32;  // [GUESS] fraction change in sCrit per unit
                                  // of winterPrecip. The paper gives no
                                  // magnitude, so the DIRECTION is verified and
                                  // the SIZE is invented. Sized against maple:
                                  // near completion it accumulates ~20 units/day
                                  // against sCrit 630, so each 0.032 here is
                                  // worth roughly one day.
                                  //
                                  // The realised effect is species-dependent and
                                  // ASYMMETRIC, which is emergent rather than
                                  // designed. Measured span of senescence
                                  // completion across the full 0-2x range:
                                  //   aspen  Sep 7 -> Oct  2   (25 d, unclipped)
                                  //   maple  Oct 1 -> Oct 11   (10 d)
                                  //   oak    Oct 11 -> Oct 18  ( 7 d, clipped)
                                  // Median first hard freeze is ~Oct 14, so the
                                  // wet-side delay runs into a frost wall. Early
                                  // species express the antecedent-winter signal
                                  // fully; late species get truncated. A wet
                                  // winter cannot push a species past the frost.
  // Drought carries through to colour as well as timing: a dry antecedent
  // winter means less carbon, so a smaller sugar pool and duller reds. [V] §3.5
  var WINTER_SUGAR_LO = 0.60;     // [GUESS] sugar-production scale at wp = 0
  var WINTER_SUGAR_HI = 1.25;     // [GUESS] ceiling at wet extreme

  // --- Frost, §3.3 (two tiers) --------------------------------------------
  var LIGHT_FROST_C = 0.0;   // [V] 0 to -2 C: abscission layer hardens fast
  var HARD_FREEZE_C = -2.0;  // [V] <= -2 C: cells rupture, mass drop in 1-3 d

  // --- Abscission and wind, §3.4 ------------------------------------------
  var K_FALL         = 0.09;  // [TUNE] daily fall probability at full readiness
  var WIND_NEGLIGIBLE = 8.0;  // [P] below this, no meaningful effect
  var WIND_RECONFIG   = 8.0;  // [V] ~11 m/s is the measured open->cone
                              // transition; the steep term is anchored so the
                              // multiplier passes ~2.2x there.
  var WIND_STEEP     = 3.0;   // [TUNE]
  var RAIN_KNOCKDOWN_MM = 15.0; // [P] heavy rain as mechanical knock-down only
  var MARCESCENT_READINESS = 0.10; // [TUNE] how much a marcescent leaf still
                                   // yields. Not zero — retention runs "into
                                   // the following spring", not forever. [V]

  /* ==========================================================================
   * 5. ENVIRONMENT FOR ONE DAY
   *
   * controls: { tempOffset, cloudCover, windMean, precipMult, latitude }
   * All four map onto plan.md Phase 5's real units.
   * ========================================================================*/
  function makeEnvironment(doy, controls, rng) {
    var lat = controls.latitude;

    var L = dayLength(doy, lat);

    // Temperature: baseline + slider offset + day-to-day weather noise.
    // Sum of three uniforms ~ normal with sd 0.5, so scale by 2*sd to hit the
    // target spread.
    var noise = (rng() + rng() + rng() - 1.5) * (T_NOISE_SD_C * 2);
    var tMin = baselineTmin(doy, lat) + controls.tempOffset + noise;
    var tMax = tMin + DIURNAL_C;

    // Light: clear-sky seasonal decline, attenuated by cloud cover.
    var clearSky = insolationIndex(doy, lat);
    var cloud = clamp(controls.cloudCover / 100, 0, 1);
    var sun = clearSky * (1 - 0.85 * cloud);           // [TUNE] overcast still
                                                       // passes ~15% diffuse
    // Wind: seasonal mean from the slider, stochastic daily gust.
    var gust = controls.windMean * (0.55 + 1.30 * Math.pow(rng(), 1.6));
    if (rng() < 0.04) gust *= 2.2;                     // [TUNE] occasional storm

    // Precipitation: ~30% of days wet, exponential amounts.
    var rain = 0;
    if (rng() < 0.30 * clamp(controls.precipMult, 0, 3)) {
      rain = -10.0 * controls.precipMult * Math.log(1 - rng() * 0.999);
    }

    // Antecedent Jan-Mar precipitation, as a multiple of normal. Constant for
    // the whole season by construction — it already happened.
    var wp = clamp(controls.winterPrecip, 0, 2);

    return {
      doy: doy,
      dayLength: L,
      winterPrecip: wp,
      sCritScale: 1 + WINTER_PRECIP_SENS * (wp - 1),
      sugarScale: clamp(WINTER_SUGAR_LO + 0.40 * wp, WINTER_SUGAR_LO, WINTER_SUGAR_HI),
      tMin: tMin,
      tMax: tMax,
      tMean: (tMin + tMax) / 2,
      sun: sun,                                  // 0..1, relative to solstice
      swMeanWm2: Math.round(sun * 950),          // rough W/m2 for the readout
      gust: gust,
      rain: rain,
      lightFrost: tMin <= LIGHT_FROST_C && tMin > HARD_FREEZE_C,
      hardFreeze: tMin <= HARD_FREEZE_C
    };
  }

  /* ==========================================================================
   * 6. LEAF
   * ========================================================================*/
  function makeLeaf(speciesKey, rng) {
    var base = SPECIES[speciesKey];
    var j = function (v, frac) { return v * (1 + (rng() * 2 - 1) * frac); };

    return {
      species: speciesKey,
      // Resolved per-leaf profile: same table, individual variation. Real
      // canopies are not uniform, and §3.7's 3.1-6.6 day interannual SD is
      // about POPULATION timing, so individual scatter belongs here.
      p: {
        pSen: base.pSen + (rng() * 2 - 1) * 0.25,
        ySen: base.ySen,
        sCrit: j(base.sCrit, 0.12),
        chlDecay: j(base.chlDecay, 0.10),
        carotenoid: clamp(j(base.carotenoid, 0.15), 0, 1),
        anthoPotential: clamp(j(base.anthoPotential, 0.20), 0, 1),
        fallFloor: clamp(base.fallFloor + (rng() * 2 - 1) * 0.06, 0.1, 0.95),
        marcescence: base.marcescence
      },
      // Marcescence is a per-LEAF property, not a rate reduction: the
      // abscission layer "never fully develops" on some leaves, so those hold
      // on through winter while their neighbours drop normally. [V] §6.1
      // Modelling it as a slower rate instead just delays a total leaf-off,
      // and a run of November freezes then strips the tree anyway.
      marcescent: rng() < base.marcescence,
      // This leaf's own colour anchors: species base green plus an individual
      // tint, resolved once. See §7 for why the variation lives here and not in
      // the chlorophyll jitter below.
      anchors: (function () {
        var tint = {
          dh: (rng() * 2 - 1) * TINT_HUE_DEG,
          ds: (rng() * 2 - 1) * TINT_SAT,
          dl: (rng() * 2 - 1) * TINT_LIGHT
        };
        var c = TINT_AUTUMN_CARRY;
        return {
          green:  tintedAnchor(base.green,     tint, 1),
          yellow: tintedAnchor(ANCHOR_YELLOW,  tint, c),
          red:    tintedAnchor(ANCHOR_RED,     tint, c),
          brown:  tintedAnchor(ANCHOR_BROWN,   tint, c)
        };
      })(),
      // Kept deliberately tight. Widening this would scatter the senescence
      // trajectory, not just the colour — that is what `anchors` is for.
      chlorophyll: clamp(j(1.0, 0.05), 0, 1),
      carotenoid: 0,           // set from profile below
      anthocyanin: 0,          // [V] de novo synthesis only — starts at zero
      tannin: 0,
      sugar: 0.45,             // [TUNE] mid-summer pool
      S: 0,                    // raw accumulated senescence rate
      senescence: 0,           // 0..1 normalised
      anthoBlocked: false,     // [V] latched off by the first freeze
      attached: true,
      fellOnDoy: null
    };
  }

  /* --------------------------------------------------------------------------
   * Advance one leaf by one simulated day.
   * ------------------------------------------------------------------------*/
  function stepLeaf(leaf, env, rng) {
    if (!leaf.attached) return;
    var p = leaf.p;

    /* --- Senescence clock: Delpierre DM2, §3.1 ---------------------------
     * Gate on BOTH photoperiod and temperature, then accumulate.
     * Nothing happens before the solstice.                                  */
    // Antecedent winter precipitation scales the whole requirement: a wet
    // Jan-Mar pushes the finish line further out. [V]
    var sCrit = p.sCrit * env.sCritScale;

    if (env.doy >= ACCUM_START_DOY &&
        env.dayLength < p.pSen && env.tMin < T_SEN_C) {
      // ySen = 0 collapses the photoperiod term to 1, leaving pure cold-degree
      // days — that is the aspen case.
      leaf.S += Math.pow(T_SEN_C - env.tMin, X_SEN) *
                (p.ySen === 0 ? 1 : Math.pow(p.pSen / env.dayLength, p.ySen));
    }

    // Frost pushes the clock forward discretely, not gradually. [V] §3.3
    //
    // Sized against the leaf's BASE sCrit, not the winter-scaled one. A frost
    // event does a fixed amount of damage; it does not do proportionally more
    // just because a wet winter raised the tree's accumulation requirement.
    // Scaling these with sCrit made them scale-invariant, which silently
    // cancelled the winter-precipitation driver almost exactly — the Wasatch has
    // enough freeze nights that frost shortcuts, not gradual accumulation, were
    // setting the leaf-off date.
    if (env.hardFreeze)      leaf.S += 0.35 * p.sCrit;
    else if (env.lightFrost) leaf.S += 0.06 * p.sCrit;

    var sPrev = leaf.senescence;
    leaf.senescence = clamp(leaf.S / sCrit, 0, 1);
    var dS = Math.max(0, leaf.senescence - sPrev);

    /* --- Chlorophyll: logistic falloff driven by senescence progress ------
     * dChl = -k * decay * dS * chl * (cap - chl)
     * Slow to start from a full green canopy, fastest through the middle,
     * tapering at the end. Peak loss RATE lands mid-senescence, which is what
     * puts chlorophyll degradation inside the cool-night anthocyanin window
     * instead of weeks ahead of it.                                          */
    var chlPrev = leaf.chlorophyll;
    var dChl = K_CHL * p.chlDecay * dS * leaf.chlorophyll *
               Math.max(0, K_CHL_CAP - leaf.chlorophyll);
    leaf.chlorophyll = clamp(leaf.chlorophyll - dChl, 0, 1);
    if (env.hardFreeze) leaf.chlorophyll *= 0.70;      // [V] rapid browning
    var chlLoss = Math.max(0, chlPrev - leaf.chlorophyll);

    /* --- Carotenoid: constant per leaf, only ever REVEALED. [V] ----------- */
    leaf.carotenoid = p.carotenoid;

    /* --- Sugar ------------------------------------------------------------
     * Cool nights close the veins and trap sugar; warm nights drain it.     */
    var exportF = clamp((env.tMin - EXPORT_T_LO) / EXPORT_T_SPAN, 0, 1);
    // A dry antecedent winter shrinks the pool, which is what dulls the reds. [V]
    var prod = SUGAR_PROD * env.sugarScale * leaf.chlorophyll * env.sun;
    leaf.sugar = clamp(
      leaf.sugar + prod - leaf.sugar * (SUGAR_RESP + SUGAR_EXPORT * exportF),
      0, 1);

    /* --- Anthocyanin: actively produced, §3.2 ----------------------------
     * Freezing DESTROYS the synthesis mechanism, so this latches off
     * permanently rather than merely slowing. [V]                           */
    if (env.tMin <= ANTHO_T_MIN) leaf.anthoBlocked = true;
    if (!leaf.anthoBlocked) {
      // Cool-but-not-freezing window: 0 at 0 C, full 1-7 C, 0 by 12 C.
      var coolness = clamp(env.tMin / 1.0, 0, 1) *
                     clamp((ANTHO_T_MAX - env.tMin) / (ANTHO_T_MAX - ANTHO_T_PEAK), 0, 1);
      // Coupled to chlorophyll DEGRADATION, not absolute chlorophyll — that is
      // what produces the observed r = 0.60-0.72 correlation. [V]
      leaf.anthocyanin = clamp(
        leaf.anthocyanin +
        K_ANTHO * p.anthoPotential * env.sun * coolness * leaf.sugar * chlLoss,
        0, 1);
    }

    /* --- Tannin: end-of-life brown, dominates regardless of the rest ------ */
    if (leaf.senescence > TANNIN_ONSET) {
      leaf.tannin = clamp(
        leaf.tannin + TANNIN_RATE * (leaf.senescence - TANNIN_ONSET) / (1 - TANNIN_ONSET),
        0, 1);
    }
    if (env.hardFreeze)      leaf.tannin = clamp(leaf.tannin + 0.30, 0, 1);
    else if (env.lightFrost) leaf.tannin = clamp(leaf.tannin + 0.05, 0, 1);

    /* --- Abscission, §3.4 ------------------------------------------------
     * Wind is a MULTIPLIER on biological readiness, never an independent
     * cause. A healthy green leaf has readiness 0, so no gale can strip it.
     * This is the main correction over the NetLogo reference model. [V]      */
    var readiness = clamp((leaf.senescence - p.fallFloor) / (1 - p.fallFloor), 0, 1);
    // A marcescent leaf never completes its abscission layer, so it resists
    // every pathway — the seasonal clock AND frost. [V] §6.1
    if (leaf.marcescent) readiness *= MARCESCENT_READINESS;

    var pFall = K_FALL * readiness * readiness;

    var g = env.gust;
    var windMult = 1 + 0.10 * Math.min(g, WIND_NEGLIGIBLE) / WIND_NEGLIGIBLE;
    if (g > WIND_RECONFIG) {
      windMult += WIND_STEEP * Math.pow((g - WIND_RECONFIG) / 6, 1.5);
    }
    pFall *= windMult;

    if (env.rain > RAIN_KNOCKDOWN_MM) pFall += 0.015 * readiness;   // [P]

    // Hard freeze can drop still-green leaves. [V]
    // A marcescent leaf gets NO freeze bonus at all: freezing is precisely what
    // INTERRUPTS abscission-layer formation, so the freeze that strips its
    // neighbours is what locks this leaf on. [V] §6.1
    //
    // This started as a small multiplier rather than an exemption, which was
    // fine in New England but leaked badly here — the Wasatch has ~40 freeze
    // nights in the back half of the season, and even a 10% bonus compounds to
    // stripping most retained leaves. The mechanism says protection, not a
    // discount, so it is now an exemption.
    if (env.hardFreeze && !leaf.marcescent) {
      pFall += 0.45 * (leaf.senescence > 0.15 ? 1 : 0.35);
    }

    // Attachment resistance. Measured petiole detachment force ordered
    // green > red > yellow, so anthocyanin buys a leaf extra time. [V] §3.4
    pFall /= (1 + 0.90 * leaf.chlorophyll + 0.35 * leaf.anthocyanin);

    if (rng() < pFall) {
      leaf.attached = false;
      leaf.fellOnDoy = env.doy;
    }
  }

  /* ==========================================================================
   * 7. PIGMENTS -> RGB
   *
   * Weighted blend by pigment "mass". Carotenoid is weighted by (1 - chl)
   * because it is revealed rather than produced; tannin is over-weighted
   * because brown dominates at cell death. [V] §3.6
   *
   * Orange is not a special case — it falls out of yellow + red mixing.
   *
   * Anchors are held in HSL rather than RGB, because the variation that makes a
   * real canopy look like a canopy runs along lightness and hue, and those are
   * awkward to perturb in RGB without drifting the colour somewhere unintended.
   * Each leaf resolves its own four anchors once at creation (see makeLeaf) and
   * they never change after that, so this stays a table lookup per frame.
   * ========================================================================*/

  // Species-independent anchors. Values are the HSL of the original RGB
  // constants, so the palette is unchanged apart from the new variation.
  var ANCHOR_YELLOW = { h:  46, s: 0.79, l: 0.56 };   // was rgb(232,190,55)
  var ANCHOR_RED    = { h:   2, s: 0.65, l: 0.42 };   // was rgb(178, 42,38)
  var ANCHOR_BROWN  = { h:  29, s: 0.39, l: 0.31 };   // was rgb(110, 78,48)

  /* Per-leaf tint, applied on top of the species anchors. [P]
   *
   * Real leaf-to-leaf green varies mostly in DEPTH (chlorophyll per unit area,
   * which the LOPEX numbers in §3.6 show ranging over more than an order of
   * magnitude between leaves) and secondarily in hue, with sun leaves running
   * darker and more blue-green than shade leaves on the same tree.
   *
   * Deliberately NOT done by widening the chlorophyll jitter: chlorophyll is a
   * state variable that drives the senescence colour trajectory, so scattering
   * it would couple how a leaf looks to when it turns. Two leaves can both sit
   * at full chlorophyll and still be visibly different greens.
   */
  var TINT_HUE_DEG   = 7.0;    // [TUNE] +/-
  var TINT_SAT       = 0.07;   // [TUNE] +/-
  var TINT_LIGHT     = 0.055;  // [TUNE] +/-
  // How much of a leaf's tint carries into its autumn colours. Not 1.0: the
  // individuality of a green leaf comes largely from chlorophyll density, which
  // is precisely what is gone by peak colour. Not 0 either, or every leaf would
  // converge on an identical yellow the moment the green drops out.
  var TINT_AUTUMN_CARRY = 0.6; // [TUNE]

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 1);
    l = clamp(l, 0, 1);
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r, g, b;
    if      (h <  60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    return [Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)];
  }

  // Resolve one anchor for one leaf: species/global HSL + this leaf's tint.
  function tintedAnchor(base, tint, weight) {
    return hslToRgb(base.h + tint.dh * weight,
                    base.s + tint.ds * weight,
                    base.l + tint.dl * weight);
  }

  function leafColor(leaf) {
    var a = leaf.anchors;
    var wG = leaf.chlorophyll;
    var wY = leaf.carotenoid * (1 - leaf.chlorophyll);
    var wR = leaf.anthocyanin;
    var wB = leaf.tannin * 2.0;                  // [TUNE] brown dominance
    var sum = wG + wY + wR + wB;
    if (sum < 1e-6) {
      return 'rgb(' + a.brown[0] + ',' + a.brown[1] + ',' + a.brown[2] + ')';
    }

    var r = (wG * a.green[0] + wY * a.yellow[0] + wR * a.red[0] + wB * a.brown[0]) / sum;
    var g = (wG * a.green[1] + wY * a.yellow[1] + wR * a.red[1] + wB * a.brown[1]) / sum;
    var b = (wG * a.green[2] + wY * a.yellow[2] + wR * a.red[2] + wB * a.brown[2]) / sum;
    return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
  }

  /* ==========================================================================
   * 8. SIMULATION CONTAINER
   * ========================================================================*/
  var DEFAULT_CONTROLS = {
    tempOffset: 0,       // C, applied to the whole seasonal baseline
    cloudCover: 25,      // % — semi-arid, clearer than New England's 35
    windMean: 3.0,       // m/s seasonal mean
    precipMult: 1.0,     // x baseline, IN-SEASON rain only (weak, mechanical)
    winterPrecip: 1.0,   // x normal Jan-Mar precip. The western primary driver.
    latitude: 40.65      // Park City UT, ~2100 m
  };

  var START_DOY = 213;   // Aug 1 — start green, before any gate opens
  var SEASON_DAYS = 120; // [V] §3.7 season is 75-105 days; 120 gives headroom

  function createSim(opts) {
    opts = opts || {};
    var cols = opts.cols || 24;
    var rows = opts.rows || 14;
    var mix = opts.mix || ['bigtoothMaple', 'gambelOak', 'aspen'];
    var seed = opts.seed == null ? 12345 : opts.seed;

    var sim = {
      cols: cols,
      rows: rows,
      mix: mix,
      seed: seed,
      startDoy: opts.startDoy || START_DOY,
      seasonDays: opts.seasonDays || SEASON_DAYS,
      controls: Object.assign({}, DEFAULT_CONTROLS, opts.controls || {}),
      day: 0,
      doy: 0,
      env: null,
      leaves: [],
      // Separate RNG streams so changing a slider mid-run does not reshuffle
      // which individual leaves are which.
      _weatherRng: null,
      _leafRng: null
    };

    sim.reset = function () {
      var setupRng = makeRng(sim.seed);
      sim._weatherRng = makeRng(sim.seed ^ 0x9E3779B9);
      sim._leafRng = makeRng(sim.seed ^ 0x85EBCA6B);
      sim.leaves = [];
      for (var i = 0; i < cols * rows; i++) {
        sim.leaves.push(makeLeaf(sim.mix[i % sim.mix.length], setupRng));
      }
      sim.day = 0;
      sim.doy = sim.startDoy;
      sim.env = makeEnvironment(sim.doy, sim.controls, makeRng(sim.seed ^ 0xC2B2AE35));
      return sim;
    };

    sim.step = function () {
      if (sim.day >= sim.seasonDays) return false;
      sim.doy = sim.startDoy + sim.day;
      sim.env = makeEnvironment(sim.doy, sim.controls, sim._weatherRng);
      for (var i = 0; i < sim.leaves.length; i++) {
        stepLeaf(sim.leaves[i], sim.env, sim._leafRng);
      }
      sim.day++;
      return true;
    };

    sim.done = function () { return sim.day >= sim.seasonDays; };

    // Aggregate stats — what Phase 3 tuning actually reads.
    sim.stats = function (speciesKey) {
      var n = 0, attached = 0, chl = 0, car = 0, ant = 0, tan = 0, sen = 0;
      for (var i = 0; i < sim.leaves.length; i++) {
        var l = sim.leaves[i];
        if (speciesKey && l.species !== speciesKey) continue;
        n++;
        if (l.attached) {
          attached++;
          chl += l.chlorophyll; car += l.carotenoid;
          ant += l.anthocyanin; tan += l.tannin; sen += l.senescence;
        }
      }
      var a = attached || 1;
      return {
        n: n,
        attached: attached,
        fallenFrac: n ? (n - attached) / n : 0,
        chlorophyll: chl / a, carotenoid: car / a,
        anthocyanin: ant / a, tannin: tan / a, senescence: sen / a
      };
    };

    return sim.reset();
  }

  /* ==========================================================================
   * 9. UTILITIES
   * ========================================================================*/
  function doyToLabel(doy) {
    var d = new Date(2025, 0, 1);
    d.setDate(d.getDate() + doy - 1);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return {
    SPECIES: SPECIES,
    DEFAULT_CONTROLS: DEFAULT_CONTROLS,
    START_DOY: START_DOY,
    SEASON_DAYS: SEASON_DAYS,
    makeRng: makeRng,
    dayLength: dayLength,
    insolationIndex: insolationIndex,
    baselineTmin: baselineTmin,
    makeEnvironment: makeEnvironment,
    makeLeaf: makeLeaf,
    stepLeaf: stepLeaf,
    leafColor: leafColor,
    createSim: createSim,
    doyToLabel: doyToLabel,
    clamp: clamp
  };
});
