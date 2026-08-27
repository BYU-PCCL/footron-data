// The beach renderer.
//
// Everything here is deliberately LOW frequency: depth colour, wetness, big
// surface shading, foam coverage, cloud shadow. It is rasterised at simulation
// resolution and then smooth-upscaled to the display, which is lossless for
// content this soft, and costs nothing per display pixel.
//
// There used to be a second pass over this one at full display resolution,
// adding sun glitter, wind ripple, foam texture and a drawn waterline. It has
// been removed: at this grid the extra frequencies read as noise sitting on
// top of the water rather than as part of it, and the soft pass is a better
// picture on its own.

import { NX, NY } from './sim.js';

export const THEMES = {
  day: {
    label: 'Midday',
    sun: [255, 250, 232], glint: 1.0,
    tint: [1, 1, 1], ambient: 0.74,
    deep: [10, 58, 96], mid: [22, 126, 152], shallow: [56, 186, 178],
    sand: [238, 221, 180], wetSand: [150, 122, 88], rock: [138, 136, 130],
    coral: [150, 112, 84], coralHi: [204, 122, 140], timber: [112, 86, 66],
    sky: [150, 200, 235], foam: [244, 248, 250],
    silt: [126, 108, 68], skyHorizon: [214, 232, 244], cloud: 0.075, glitter: 'rgba(255,252,235,', ripple: 0.5,
  },
  sunset: {
    label: 'Sunset',
    sun: [255, 180, 112], glint: 1.3,
    tint: [1.01, 0.92, 0.88], ambient: 0.56,
    deep: [14, 36, 74], mid: [26, 86, 114], shallow: [64, 138, 146],
    sand: [206, 166, 124], wetSand: [114, 82, 64], rock: [112, 100, 98],
    coral: [136, 88, 72], coralHi: [192, 104, 118], timber: [92, 64, 52],
    sky: [244, 152, 100], foam: [255, 226, 206], skyMix: 0.30,
    silt: [118, 92, 58], skyHorizon: [255, 206, 150], cloud: 0.11, glitter: 'rgba(255,204,150,', ripple: 0.6,
  },
  night: {
    label: 'Moonlight',
    sun: [206, 228, 255], glint: 2.0,
    tint: [0.56, 0.68, 0.94], ambient: 0.60, foamLit: 1.9,
    deep: [3, 10, 26], mid: [8, 34, 64], shallow: [22, 76, 92],
    sand: [156, 154, 152], wetSand: [58, 62, 76], rock: [76, 82, 96],
    coral: [58, 60, 78], coralHi: [82, 70, 104], timber: [42, 46, 60],
    sky: [26, 44, 88], foam: [206, 255, 252],
    silt: [54, 58, 56], skyHorizon: [64, 88, 140], cloud: 0.08, glitter: 'rgba(214,236,255,', ripple: 0.35,
  },
};

// Light direction (points toward the light), roughly over the viewer's shoulder.
export const LX = 0.42, LY = -0.34, LZ = 0.84;

// --- lookup tables: this loop runs ~60k times a frame, so no pow/exp in it ---
const POW_N = 1024;
const SPEC = new Float32Array(POW_N + 1);          // broad specular lobe
for (let k = 0; k <= POW_N; k++) SPEC[k] = Math.pow(k / POW_N, 14);

const EXP_N = 512, EXP_MAX = 9;
const CLARITY = new Float32Array(EXP_N + 1);       // exp(-H / 1.45)
const CAUST = new Float32Array(EXP_N + 1);         // exp(-H / 3.0)
for (let k = 0; k <= EXP_N; k++) {
  const h = (k / EXP_N) * EXP_MAX;
  // Falls off faster than before: water only a knee deep still reads as water,
  // not as wet sand, so the shallows keep their colour instead of going milky.
  CLARITY[k] = Math.exp(-h / 0.85);
  CAUST[k] = Math.exp(-h / 3.0);
}
const EXP_SCALE = EXP_N / EXP_MAX;

// Soft shoulder instead of a hard clip: glint and foam overshoot a lot, and
// clipping three channels at once flattens everything to paper white.
const ROLL = new Uint8Array(1400);
{
  const KNEE = 186, SPAN = 69;
  for (let v = 0; v < ROLL.length; v++) {
    ROLL[v] = v <= KNEE ? v : Math.min(255, 255 - (SPAN * SPAN) / (v - KNEE + SPAN));
  }
}
const ROLL_MAX = ROLL.length - 1;

export class Renderer {
  constructor(sim) {
    this.sim = sim;
    this.buf = document.createElement('canvas');
    this.buf.width = NX;
    this.buf.height = NY;
    this.bctx = this.buf.getContext('2d', { alpha: false });
    this.img = this.bctx.createImageData(NX, NY);
    this.data = this.img.data;
    for (let i = 3; i < this.data.length; i += 4) this.data[i] = 255;
    this.showDepth = false;

    this.smooth = new Float32Array(NX * NY);
    this.smooth2 = new Float32Array(NX * NY);
    this.bedSmooth = new Float32Array(NX * NY);
    this.scratch = new Float32Array(NX * NY);
    // per-axis phase tables (separable, so two multiplies per pixel not two sines)
    this.wave = new Float32Array(NX * 8);
    this.waveY = new Float32Array(NY * 8);
  }

  // Shading reads a lightly smoothed surface: single-cell differences on the
  // raw field are too twitchy and read as moire rather than water.
  smoothSurface() {
    const pass = (src, dst) => {
      for (let j = 0; j < NY; j++) {
        const row = j * NX;
        const rowp = ((j + 1) % NY) * NX;
        const rowm = ((j - 1 + NY) % NY) * NX;
        for (let i = 0; i < NX; i++) {
          const c = row + i;
          const l = i > 0 ? c - 1 : c, r = i < NX - 1 ? c + 1 : c;
          dst[c] = src[c] * 0.36 + (src[l] + src[r] + src[rowm + i] + src[rowp + i]) * 0.16;
        }
      }
    };
    pass(this.sim.eta, this.smooth2);
    pass(this.smooth2, this.smooth);
    // the bed picks up its own fine texture from sand transport; shade it smooth
    pass(this.sim.bed, this.scratch);
    pass(this.scratch, this.bedSmooth);
  }

  // Separable phase tables for the two things that need coherent travelling
  // patterns in the base pass: drifting cloud shadow, and the sand ripples you
  // see through shallow water.
  buildPatterns(time) {
    const w = this.wave, wy = this.waveY;
    // 0,1: cloud A   2,3: cloud B   4,5: bed ripple   6,7: swell sheen
    const set = (slot, kx, ky, phase) => {
      const ox = slot * 2 * NX, oy = slot * 2 * NY;
      for (let i = 0; i < NX; i++) {
        w[ox + i] = Math.sin(kx * i + phase);
        w[ox + NX + i] = Math.cos(kx * i + phase);
      }
      for (let j = 0; j < NY; j++) {
        wy[oy + j] = Math.sin(ky * j);
        wy[oy + NY + j] = Math.cos(ky * j);
      }
    };
    set(0, 0.031, 0.023, time * 0.045);
    set(1, 0.017, 0.043, -time * 0.031 + 2.1);
    set(2, 0.55, 0.10, time * 0.55);
    set(3, 0.13, 0.09, time * 0.02);
  }

  // cos(kx*i + ky*j + phase) from the separable tables
  patCos(slot, i, j) {
    const ox = slot * 2 * NX, oy = slot * 2 * NY;
    return this.wave[ox + NX + i] * this.waveY[oy + NY + j]
         - this.wave[ox + i] * this.waveY[oy + j];
  }

  rasterise(theme, time) {
    const s = this.sim;
    const { bed, eta, foam, wet, turb } = s;
    this.smoothSurface();
    this.buildPatterns(time);
    const sm = this.smooth;
    const bsm = this.bedSmooth;
    const w = this.wave, wy = this.waveY;
    const d = this.data;
    const sea = s.sea;
    const t = theme;

    const glint = t.glint;
    const foamCol = t.foam || [244, 248, 250];
    const foamLit = t.foamLit || 1;
    const skyMix = t.skyMix || 0.13;
    const siltR = (t.silt || [126, 108, 68])[0];
    const siltG = (t.silt || [126, 108, 68])[1];
    const siltB = (t.silt || [126, 108, 68])[2];
    const cloudAmp = t.cloud === undefined ? 0.13 : t.cloud;
    // Coral and timber, mottled with the value-noise field that the sand grain
    // already uses, so the texture costs one array read rather than a hash.
    const coral = t.coral || [150, 112, 84];
    const coralHi = t.coralHi || [204, 122, 140];
    const timber = t.timber || [112, 86, 66];
    const hasMat = !!s.hasMaterial;
    const reefF = s.reef, builtF = s.built, noiseF = s.noise;
    const [tr, tg, tb] = t.tint;
    const amb = t.ambient;
    const sunR = t.sun[0], sunG = t.sun[1], sunB = t.sun[2];
    const skyR = t.sky[0], skyG = t.sky[1], skyB = t.sky[2];
    const sandR = t.sand[0], sandG = t.sand[1], sandB = t.sand[2];
    const wetR = t.wetSand[0], wetG = t.wetSand[1], wetB = t.wetSand[2];
    const rockR = t.rock[0], rockG = t.rock[1], rockB = t.rock[2];
    const deepR = t.deep[0], deepG = t.deep[1], deepB = t.deep[2];
    const midR = t.mid[0], midG = t.mid[1], midB = t.mid[2];
    const shR = t.shallow[0], shG = t.shallow[1], shB = t.shallow[2];

    // offsets into the separable pattern tables
    const cA = 0, cAy = 0, cAc = NX, cAyc = NY;
    const cB = 2 * NX, cBy = 2 * NY, cBc = 3 * NX, cByc = 3 * NY;
    const rP = 4 * NX, rPy = 4 * NY, rPc = 5 * NX, rPyc = 5 * NY;

    for (let j = 0; j < NY; j++) {
      const row = j * NX;
      const rowp = ((j + 1) % NY) * NX;
      const rowm = ((j - 1 + NY) % NY) * NX;
      // per-row halves of the separable patterns
      const cAs = wy[cAy + j], cAcs = wy[cAyc + j];
      const cBs = wy[cBy + j], cBcs = wy[cByc + j];
      const rPs = wy[rPy + j], rPcs = wy[rPyc + j];

      for (let i = 0; i < NX; i++) {
        const c = row + i;
        const b = bed[c];
        const e = eta[c];
        const H = e - b;
        const il = row + (i > 0 ? i - 1 : 0);
        const ir = row + (i < NX - 1 ? i + 1 : NX - 1);

        // drifting cloud shadow, soft and slow
        const clA = w[cAc + i] * cAcs - w[cA + i] * cAs;
        const clB = w[cBc + i] * cBcs - w[cB + i] * cBs;
        // smoothstep, or the shadow edge reads as a hard diagonal band
        let cl = (clA * 0.62 + clB * 0.38 - 0.10) * 1.35;
        cl = cl < 0 ? 0 : cl > 1 ? 1 : cl;
        const shade = 1 - cloudAmp * cl * cl * (3 - 2 * cl);

        let r, g, bb;
        if (H > 0.015) {
          // ---------------------------------------------------------- water
          const RELIEF = 6.2;
          const nx = -(sm[ir] - sm[il]) * 0.5 * RELIEF;
          const ny = -(sm[rowp + i] - sm[rowm + i]) * 0.5 * RELIEF;
          const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
          let dif = (nx * LX + ny * LY + LZ) * inv;
          if (dif < 0) dif = 0;
          const specIdx = (dif * POW_N) | 0;
          const spec = SPEC[specIdx] * 150 * glint * (H > 0.5 ? 1 : H * 2);
          const lap = sm[il] + sm[ir] + sm[rowm + i] + sm[rowp + i] - 4 * sm[c];

          const hIdx = H >= EXP_MAX ? EXP_N : (H * EXP_SCALE) | 0;
          // Silt in suspension does two things: it colours the water, and it
          // stops you seeing the bed through it. Both matter — a clear plume
          // that still showed clean sand underneath would look painted on.
          const silt = turb[c] > 1 ? 1 : turb[c];
          const clarity = CLARITY[hIdx] * (1 - silt * 0.85);

          // depth ramp: shallow -> mid -> deep
          const dn = H > 5.2 ? 1 : H * 0.1923;
          let wr, wg, wb;
          if (dn > 0.42) {
            const f = (dn - 0.42) * 1.7241;
            wr = midR + (deepR - midR) * f;
            wg = midG + (deepG - midG) * f;
            wb = midB + (deepB - midB) * f;
          } else {
            const f = dn * 2.381;
            wr = shR + (midR - shR) * f;
            wg = shG + (midG - shG) * f;
            wb = shB + (midB - shB) * f;
          }

          // sand showing through the shallows, with the ripple field the water
          // has combed into it
          let sr = 0, sg = 0, sb = 0;
          if (clarity > 0.004) {
            // Submerged sand keeps its pale colour — the dark "wet sand" tone is
            // what exposed sand looks like just after a wave, not what the sea
            // bed looks like from above. Mixing it in here turned the shallows
            // brown instead of turquoise.
            let rocky = (b - 2.4) * 0.7;
            rocky = rocky < 0 ? 0 : rocky > 1 ? 1 : rocky;
            // seen through water, so tinted toward it rather than pure sand
            sr = sandR * 0.80; sg = sandG * 0.90; sb = sandB * 0.86;
            sr += (rockR - sr) * rocky;
            sg += (rockG - sg) * rocky;
            sb += (rockB - sb) * rocky;
            // ripples: strongest in knee-deep water, gone in the deep and in
            // the thinnest film
            const rip = w[rPc + i] * rPcs - w[rP + i] * rPs;
            let rw = H < 2.6 ? (2.6 - H) * 0.385 : 0;
            if (H < 0.35) rw *= H * 2.86;
            const rm = 1 + rip * 0.045 * rw;
            sr *= rm; sg *= rm; sb *= rm;
            // Material last: ripples are combed into sand, and coral is not
            // sand, so the reef must not inherit them.
            if (hasMat) {
              const rf = reefF[c];
              if (rf > 0.004) {
                const n = noiseF[c];
                const hi = n > 0 ? n : 0;
                const mt = 0.86 + n * 0.20;
                sr += ((coral[0] + (coralHi[0] - coral[0]) * hi) * mt - sr) * rf;
                sg += ((coral[1] + (coralHi[1] - coral[1]) * hi) * mt - sg) * rf;
                sb += ((coral[2] + (coralHi[2] - coral[2]) * hi) * mt - sb) * rf;
              }
              const bt = builtF[c];
              if (bt > 0.004) {
                sr += (timber[0] - sr) * bt;
                sg += (timber[1] - sg) * bt;
                sb += (timber[2] - sb) * bt;
              }
            }
          }

          let caustic = -lap * 6.0;
          if (caustic < -0.30) caustic = -0.30; else if (caustic > 0.65) caustic = 0.65;
          const bright = amb + 0.42 * dif + caustic * CAUST[hIdx];
          r = (wr * (1 - clarity) + sr * clarity) * bright;
          g = (wg * (1 - clarity) + sg * clarity) * bright;
          bb = (wb * (1 - clarity) + sb * clarity) * bright;

          if (silt > 0.01) {
            // murky water also scatters more light back, so it reads lighter as
            // well as browner, which is what silt actually looks like
            const m = silt > 1 ? 0.82 : silt * 0.82;
            r += (siltR * (0.75 + bright * 0.55) - r) * m;
            g += (siltG * (0.75 + bright * 0.55) - g) * m;
            bb += (siltB * (0.75 + bright * 0.55) - bb) * m;
          }
          // sky reflection at grazing angles keeps deep water from going flat
          const graze = (1 - dif) * skyMix;
          r += skyR * graze; g += skyG * graze; bb += skyB * graze;
          r += sunR * spec * 0.00392; g += sunG * spec * 0.00392; bb += sunB * spec * 0.00392;

          // Translucent rather than opaque paint: foam that hides the water
          // under it reads as a white sticker on the wave.
          const fo = foam[c] * 0.66 > 0.72 ? 0.72 : foam[c] * 0.66;
          if (fo > 0.01) {
            const lit = (amb + 0.34) * foamLit;
            r += (foamCol[0] * lit - r) * fo;
            g += (foamCol[1] * lit - g) * fo;
            bb += (foamCol[2] * lit - bb) * fo;
          }
          if (H < 0.16) {           // thin swash film catches the light
            const edge = (1 - H * 6.25) * (0.5 + amb * 0.5);
            r += 30 * edge; g += 32 * edge; bb += 30 * edge;
          }
        } else {
          // ----------------------------------------------------------- sand
          const bnx = -(bsm[ir] - bsm[il]) * 1.1;
          const bny = -(bsm[rowp + i] - bsm[rowm + i]) * 1.1;
          const binv = 1 / Math.sqrt(bnx * bnx + bny * bny + 1);
          let bd = (bnx * LX + bny * LY + LZ) * binv;
          if (bd < 0) bd = 0;
          const bshade = 0.80 + 0.34 * bd;
          let wetness = wet[c] > 1 ? 1 : wet[c];
          let rocky = (b - 2.4) * 0.7;
          rocky = rocky < 0 ? 0 : rocky > 1 ? 1 : rocky;
          r = sandR + (wetR - sandR) * wetness * 0.82;
          g = sandG + (wetG - sandG) * wetness * 0.82;
          bb = sandB + (wetB - sandB) * wetness * 0.82;
          r += (rockR - r) * rocky;
          g += (rockG - g) * rocky;
          bb += (rockB - bb) * rocky;
          if (hasMat) {
            const rf = reefF[c];
            if (rf > 0.004) {
              // Coral out of the water is bleached bone, not the colour it is
              // when alive and submerged.
              const n = noiseF[c];
              const mt = 1.34 + n * 0.16;
              r += (coral[0] * mt - r) * rf;
              g += (coral[1] * mt - g) * rf;
              bb += (coral[2] * mt - bb) * rf;
            }
            const bt = builtF[c];
            if (bt > 0.004) {
              const n = noiseF[c] * 0.10;
              r += (timber[0] * (1 + n) - r) * bt;
              g += (timber[1] * (1 + n) - g) * bt;
              bb += (timber[2] * (1 + n) - bb) * bt;
            }
          }
          // A tide leaves a pale line of dried salt and foam at its high mark.
          if (wetness > 0.30 && wetness < 0.46) {
            const line = 1 - Math.abs(wetness - 0.38) * 12.5;
            r += 26 * line; g += 24 * line; bb += 20 * line;
          }
          r *= bshade; g *= bshade; bb *= bshade;
          const fo = foam[c] * 0.40 > 0.62 ? 0.62 : foam[c] * 0.40;
          if (fo > 0.01) {          // sea foam stranded on the sand
            const lit = (amb + 0.32) * foamLit;
            r += (foamCol[0] * lit - r) * fo;
            g += (foamCol[1] * lit - g) * fo;
            bb += (foamCol[2] * lit - bb) * fo;
          }
        }

        r *= tr * shade; g *= tg * shade; bb *= tb * shade;
        const p = c * 4;
        d[p] = ROLL[r < 0 ? 0 : r > ROLL_MAX ? ROLL_MAX : r | 0];
        d[p + 1] = ROLL[g < 0 ? 0 : g > ROLL_MAX ? ROLL_MAX : g | 0];
        d[p + 2] = ROLL[bb < 0 ? 0 : bb > ROLL_MAX ? ROLL_MAX : bb | 0];
      }
    }
    this.bctx.putImageData(this.img, 0, 0);
  }

  // Teaching view: bathymetry with contour bands instead of the beauty pass.
  rasteriseDepth() {
    const s = this.sim, d = this.data;
    for (let k = 0; k < NX * NY; k++) {
      const b = s.bed[k];
      const H = s.eta[k] - b;
      const band = Math.abs((b % 1) - 0.5) < 0.06 ? 0.72 : 1;
      let r, g, bb;
      if (H > 0.015) {
        const f = Math.min(1, Math.max(0, (b + 8) / 8));
        r = 18 + 40 * f; g = 60 + 150 * f; bb = 150 + 90 * f;
      } else {
        const f = Math.min(1, Math.max(0, b / 4));
        r = 210 - 40 * f; g = 170 + 30 * f; bb = 110 + 20 * f;
      }
      const p = k * 4;
      d[p] = r * band; d[p + 1] = g * band; d[p + 2] = bb * band;
    }
    this.bctx.putImageData(this.img, 0, 0);
  }

  blit(ctx, w, h, theme, time) {
    if (this.showDepth) this.rasteriseDepth();
    else this.rasterise(theme, time);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.buf, 0, 0, NX, NY, 0, 0, w, h);
  }
}
