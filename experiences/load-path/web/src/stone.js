// Draws shards and the test weight with a bit of light and texture instead of
// flat fills. Matter's own body renderer is turned off for these bodies
// (render.visible = false) and this runs from collapse.js's afterRender hook,
// reading each body's live vertices, so it follows the physics exactly.
import { STONE_RGB, BROKEN_STONE_RGB } from "./theme.js";

// One-time tileable grain, laid over stone at low opacity.
let grain = null;
function getGrain(ctx) {
  if (!grain) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.random() * 60;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    grain = ctx.createPattern(c, "repeat");
  }
  return grain;
}

// Light from the upper left (canvas y grows downward, so "up" is -y).
const LIGHT = { x: -0.5, y: -0.86 };

function seededUnit(seed) {
  const h = Math.sin(seed * 12.9898) * 43758.5453;
  return h - Math.floor(h);
}

function shardPath(ctx, vertices) {
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
  ctx.closePath();
}

export function drawShard(ctx, body) {
  const { seed, broken } = body.plugin;
  const v = body.vertices;
  const base = broken ? BROKEN_STONE_RGB : STONE_RGB;
  const tint = 0.9 + 0.2 * seededUnit(seed + 1);
  ctx.save();

  shardPath(ctx, v);
  ctx.fillStyle = `rgb(${Math.round(base[0] * tint)},${Math.round(base[1] * tint)},${Math.round(base[2] * tint)})`;
  ctx.fill();

  // Broad light-to-shade gradient across the piece.
  const b = body.bounds;
  const shade = ctx.createLinearGradient(b.min.x, b.min.y, b.max.x, b.max.y);
  shade.addColorStop(0, "rgba(255,250,232,0.22)");
  shade.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = shade;
  ctx.fill();

  // Grain.
  ctx.globalAlpha = 0.16;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = getGrain(ctx);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // Bevel: edges facing the light glint, edges facing away darken.
  const cx = body.position.x;
  const cy = body.position.y;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  for (let i = 0; i < v.length; i++) {
    const a = v[i];
    const c = v[(i + 1) % v.length];
    let nx = c.y - a.y;
    let ny = -(c.x - a.x);
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    if (nx * ((a.x + c.x) / 2 - cx) + ny * ((a.y + c.y) / 2 - cy) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const lit = nx * LIGHT.x + ny * LIGHT.y;
    if (lit > 0.3) ctx.strokeStyle = `rgba(255,248,225,${0.55 * lit})`;
    else if (lit < -0.3) ctx.strokeStyle = `rgba(0,0,0,${0.4 * -lit})`;
    else continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(c.x, c.y);
    ctx.stroke();
  }

  shardPath(ctx, v);
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(22,15,8,0.6)";
  ctx.stroke();
  ctx.restore();
}

// The test weight: a bronze sphere.
export function drawWeight(ctx, ball) {
  const { x, y } = ball.position;
  const r = ball.circleRadius;
  ctx.save();
  const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.1, x, y, r);
  g.addColorStop(0, "#f6dc9d");
  g.addColorStop(0.45, "#c08a3a");
  g.addColorStop(1, "#4a3010");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(40,24,6,0.8)";
  ctx.stroke();
  // Specular glint.
  ctx.fillStyle = "rgba(255,247,220,0.55)";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.2, r * 0.12, -0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
