// Draws the density grid as carved stone onto the (transparent) structure
// canvas: each cell is stone tinted by density, with a little per-cell
// variation and a chiseled edge where it borders empty space, under a
// moonlit top-to-bottom gradient. Row 0 is the bottom of the domain (this
// project's y-up convention), but canvas y grows downward, so rows are
// flipped when drawing.
//
// While the structure is growing, each cell is also colored by how much
// strain energy it is carrying (see computeElementWork) — cool slate for
// stone doing nothing, through stone and amber, to red for stone straining
// hard — so you can watch material leave the idle areas and gather where
// the load actually runs.
import { STONE_RGB } from "./theme.js";
import { DOMAIN } from "./scene.js";
import { nodePosition } from "./deform.js";

const SOLID = 0.5;

// Idle -> carrying load. Exported as CSS stops so the legend matches exactly.
export const HEAT_STOPS = [
  [0.0, [52, 84, 112]],
  [0.4, [207, 195, 171]],
  [0.72, [240, 176, 74]],
  [1.0, [226, 84, 46]],
];

function heatColor(t) {
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [t1, c1] = HEAT_STOPS[i];
    if (t <= t1) {
      const [t0, c0] = HEAT_STOPS[i - 1];
      const f = (t - t0) / (t1 - t0);
      return [c0[0] + (c1[0] - c0[0]) * f, c0[1] + (c1[1] - c0[1]) * f, c0[2] + (c1[2] - c0[2]) * f];
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length - 1][1];
}

// The energy that reads as "fully hot": the 95th percentile among cells with
// real material, so a couple of stress-concentration outliers can't wash the
// rest of the structure out to blue.
function hotReference(strainEnergy, densities) {
  const values = [];
  for (let ely = 0; ely < densities.length; ely++) {
    for (let elx = 0; elx < densities[0].length; elx++) {
      if (densities[ely][elx] > 0.3) values.push(strainEnergy[ely][elx]);
    }
  }
  if (values.length === 0) return 1;
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length * 0.95)] || 1;
}

function cellNoise(elx, ely) {
  const h = Math.sin(elx * 12.9898 + ely * 78.233) * 43758.5453;
  return h - Math.floor(h);
}

// The finished structure at rest, colored by how close each cell is to its
// tensile limit AT THE TEST WEIGHT: an absolute scale, not normalized like the
// growth heat map, so red really means "at the limit" (ratio 1) and a bridge
// with a wide safety margin looks cool all over.
export function renderStress(ctx, densities, ratios) {
  drawRest(ctx, densities, (elx, ely) => Math.min(1, Math.max(0, ratios[ely][elx])));
}

export function renderDensities(ctx, densities, strainEnergy = null) {
  const hot = strainEnergy ? hotReference(strainEnergy, densities) : 1;
  drawRest(ctx, densities, strainEnergy ? (elx, ely) => Math.min(1, Math.sqrt(Math.max(0, strainEnergy[ely][elx]) / hot)) : null);
}

// heatAt(elx, ely) returns 0..1 on the heat ramp, or heatAt is null for plain stone.
function drawRest(ctx, densities, heatAt) {
  const numElemY = densities.length;
  const numElemX = densities[0].length;
  const cellWidth = DOMAIN.w / numElemX;
  const cellHeight = DOMAIN.h / numElemY;
  const isSolid = (elx, ely) =>
    elx >= 0 && elx < numElemX && ely >= 0 && ely < numElemY && densities[ely][elx] > SOLID;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (let ely = 0; ely < numElemY; ely++) {
    for (let elx = 0; elx < numElemX; elx++) {
      const density = densities[ely][elx];
      if (density < 0.02) continue;

      const x = DOMAIN.x + elx * cellWidth;
      const y = DOMAIN.y + (numElemY - 1 - ely) * cellHeight;
      const tint = 0.975 + 0.05 * cellNoise(elx, ely);
      const base = heatAt ? heatColor(heatAt(elx, ely)) : STONE_RGB;
      ctx.globalAlpha = density;
      ctx.fillStyle = `rgb(${Math.round(base[0] * tint)},${Math.round(base[1] * tint)},${Math.round(base[2] * tint)})`;
      // Pad each cell by 1px so adjacent cells don't leave hairline gaps
      // from floating-point rounding.
      ctx.fillRect(x, y, cellWidth + 1, cellHeight + 1);
    }
  }
  ctx.globalAlpha = 1;

  // Chiseled edges: a lit line where solid stone borders empty space above
  // or to the left, a shaded one below or to the right.
  const edge = Math.max(2, cellHeight * 0.14);
  for (let ely = 0; ely < numElemY; ely++) {
    for (let elx = 0; elx < numElemX; elx++) {
      if (!isSolid(elx, ely)) continue;
      const x = DOMAIN.x + elx * cellWidth;
      const y = DOMAIN.y + (numElemY - 1 - ely) * cellHeight;
      if (!isSolid(elx, ely + 1)) {
        ctx.fillStyle = "rgba(255,248,225,0.5)";
        ctx.fillRect(x, y, cellWidth + 1, edge);
      }
      if (!isSolid(elx - 1, ely)) {
        ctx.fillStyle = "rgba(255,248,225,0.25)";
        ctx.fillRect(x, y, edge, cellHeight + 1);
      }
      if (!isSolid(elx, ely - 1)) {
        ctx.fillStyle = "rgba(0,0,0,0.38)";
        ctx.fillRect(x, y + cellHeight - edge, cellWidth + 1, edge + 1);
      }
      if (!isSolid(elx + 1, ely)) {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(x + cellWidth - edge, y, edge + 1, cellHeight + 1);
      }
    }
  }

  // Moonlit gradient over the stone only (source-atop paints just where
  // pixels already exist): lighter toward the top, darker toward the base.
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const shade = ctx.createLinearGradient(0, DOMAIN.y, 0, DOMAIN.y + DOMAIN.h);
  shade.addColorStop(0, "rgba(255,252,240,0.14)");
  shade.addColorStop(1, "rgba(0,0,0,0.30)");
  ctx.fillStyle = shade;
  ctx.fillRect(DOMAIN.x, DOMAIN.y, DOMAIN.w, DOMAIN.h);
  ctx.restore();
}

// Turns any per-cell quantity (strain energy, smoothed importance) into 0..1
// heat values the same way for every view, so the colors mean the same thing
// in each. Square root spreads out the low end, where most stone sits.
export function normalizeHeat(values, densities) {
  const hot = hotReference(values, densities);
  return values.map((row) => row.map((v) => Math.min(1, Math.sqrt(Math.max(0, v) / hot))));
}

// The structure drawn as the deformed mesh: every cell is a quad on its four
// displaced corner nodes, so it visibly bends under the load. `heat` is a
// 0..1 grid from normalizeHeat (or null for plain stone). scale is pixels per
// model unit; 0 draws it at rest.
export function renderDeformed(ctx, densities, u, scale, heat = null) {
  const numElemY = densities.length;
  const numElemX = densities[0].length;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const corner = (col, row) => nodePosition(col, row, numElemX, numElemY, u, scale);
  for (let ely = 0; ely < numElemY; ely++) {
    for (let elx = 0; elx < numElemX; elx++) {
      const density = densities[ely][elx];
      if (density < 0.02) continue;

      const a = corner(elx, ely);
      const b = corner(elx + 1, ely);
      const c = corner(elx + 1, ely + 1);
      const d = corner(elx, ely + 1);
      const tint = 0.975 + 0.05 * cellNoise(elx, ely);
      const base = heat ? heatColor(heat[ely][elx]) : STONE_RGB;
      const color = `rgb(${Math.round(base[0] * tint)},${Math.round(base[1] * tint)},${Math.round(base[2] * tint)})`;

      ctx.globalAlpha = density;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke(); // closes the hairline seams between neighboring quads
    }
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const shade = ctx.createLinearGradient(0, DOMAIN.y, 0, DOMAIN.y + DOMAIN.h);
  shade.addColorStop(0, "rgba(255,252,240,0.14)");
  shade.addColorStop(1, "rgba(0,0,0,0.30)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}
