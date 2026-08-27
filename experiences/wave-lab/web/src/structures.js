// Things that stand above the water.
//
// The piles themselves are not drawn here — they are material in the bed, and
// the base renderer colours them as timber like it colours coral as coral. What
// this file draws is the part with no bed underneath it: the deck, its rail,
// and the shadow it throws on whatever is below. That has to be a separate pass
// because the heightfield has exactly one surface per cell and a pier is a
// second one, several metres up.
//
// Everything is in grid cells, drawn under the same transform as the entity
// layer, so a pier is the same width on every resolution tier.

import { NX, NY, SCALE } from './sim.js';
import { LX, LY } from './render.js';

// How far the shadow falls, in cells. The deck sits about 3.5 m up and the
// light comes in over the viewer's shoulder, so this is roughly geometric
// rather than invented.
const SHADOW = 3.4 * SCALE;

function withAlpha(rgb, a) {
  return `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${a})`;
}

// The deck is a spine plus a wider head at the seaward end. Both are drawn from
// the same helper so the shadow, the planks and the rail can each trace the
// same outline without repeating the geometry.
function deckPath(ctx, p, dx, dy) {
  ctx.beginPath();
  ctx.rect(p.i0 + dx, p.y - p.half + dy, p.i1 - p.i0, p.half * 2);
  ctx.rect(p.i0 + dx, p.y - p.headHalf + dy, p.headI1 - p.i0, p.headHalf * 2);
}

function drawPier(ctx, p, sim, theme, time) {
  const timber = theme.timber || [112, 86, 66];
  const amb = theme.ambient;

  // --- shadow, on the water and the sand alike -----------------------------
  // Cast opposite the light. It is the shadow more than the deck that makes the
  // pier read as standing above the surface rather than painted onto it.
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = 'rgba(6,16,26,1)';
  deckPath(ctx, p, -LX * SHADOW, -LY * SHADOW);
  ctx.fill();
  ctx.globalAlpha = 1;

  // --- deck ----------------------------------------------------------------
  const lit = 0.62 + amb * 0.55;
  deckPath(ctx, p, 0, 0);
  ctx.fillStyle = withAlpha([timber[0] * lit * 1.5, timber[1] * lit * 1.45,
    timber[2] * lit * 1.4], 1);
  ctx.fill();

  // planks running across the pier, which is the way they are actually laid
  ctx.save();
  deckPath(ctx, p, 0, 0);
  ctx.clip();
  ctx.strokeStyle = withAlpha([timber[0] * 0.7, timber[1] * 0.7, timber[2] * 0.7], 0.55);
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  const gap = Math.max(0.9, 1.3 * SCALE);
  for (let x = p.i0; x < p.i1; x += gap) {
    ctx.moveTo(x, p.y - p.headHalf);
    ctx.lineTo(x, p.y + p.headHalf);
  }
  ctx.stroke();
  ctx.restore();

  // --- rail ----------------------------------------------------------------
  // Two lines and a post at every bent. At this scale that is all a rail can
  // be, and it is enough to give the deck an edge and a sense of height.
  ctx.strokeStyle = withAlpha([timber[0] * 0.55, timber[1] * 0.55, timber[2] * 0.55], 0.9);
  ctx.lineWidth = 0.4;
  deckPath(ctx, p, 0, 0);
  ctx.stroke();

  ctx.fillStyle = withAlpha([timber[0] * 1.7 * lit, timber[1] * 1.6 * lit,
    timber[2] * 1.5 * lit], 0.9);
  for (const b of p.bents) {
    const hh = b.i <= p.headI1 ? p.headHalf : p.half;
    ctx.fillRect(b.i - 0.35, p.y - hh - 0.35, 0.7, 0.7);
    ctx.fillRect(b.i - 0.35, p.y + hh - 0.35, 0.7, 0.7);
  }

  // A row of lamps down the middle, lit only when the scene is.
  if (theme.glint >= 1.6) {
    const spacing = Math.max(6, Math.round(9 * SCALE));
    for (let x = p.i0 + spacing; x < p.i1; x += spacing) {
      const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, 4 * SCALE);
      g.addColorStop(0, 'rgba(255,226,168,0.55)');
      g.addColorStop(1, 'rgba(255,226,168,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, p.y, 4 * SCALE, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawStructures(ctx, sim, S, theme, time) {
  const list = sim.structures;
  if (!list || !list.length) return;
  ctx.save();
  ctx.scale(S, S);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'butt';
  for (const st of list) {
    if (st.kind === 'pier') drawPier(ctx, st, sim, theme, time);
  }
  ctx.restore();
}
