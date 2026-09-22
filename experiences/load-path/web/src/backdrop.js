// The static night scene behind the bridge, painted once: starry sky, moon,
// layered ink-wash mountains with a pagoda, the two cliffs the bridge rests
// on, and the river between them. paintWaterOverlay() is the translucent
// water surface drawn IN FRONT of the structure canvas so debris that falls
// in looks submerged.
import { SCENE_W, SCENE_H, BANK_TOP_Y, RIVER_LEFT_X, RIVER_RIGHT_X, WATER_SURFACE_Y, RIVERBED_Y } from "./scene.js";

// Small deterministic PRNG so the scene looks identical on every load.
function makeRng(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOON = { x: 640, y: 92, r: 52 };

function paintSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, WATER_SURFACE_Y);
  sky.addColorStop(0, "#03060d");
  sky.addColorStop(0.4, "#0a1729");
  sky.addColorStop(0.75, "#17304a");
  sky.addColorStop(1, "#2c4757");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);

  const rand = makeRng(7);
  for (let i = 0; i < 170; i++) {
    const x = rand() * SCENE_W;
    const y = rand() * SCENE_H * 0.5;
    if (Math.hypot(x - MOON.x, y - MOON.y) < 150) continue;
    ctx.globalAlpha = 0.25 + rand() * 0.6;
    ctx.fillStyle = rand() < 0.15 ? "#ffe9c4" : "#dbe8ff";
    ctx.beginPath();
    ctx.arc(x, y, 0.5 + rand() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function paintMoon(ctx) {
  const glow = ctx.createRadialGradient(MOON.x, MOON.y, MOON.r * 0.8, MOON.x, MOON.y, 320);
  glow.addColorStop(0, "rgba(255,240,205,0.30)");
  glow.addColorStop(1, "rgba(255,240,205,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(MOON.x - 330, MOON.y - 330, 660, 660);

  const disc = ctx.createRadialGradient(MOON.x - 18, MOON.y - 18, 4, MOON.x, MOON.y, MOON.r);
  disc.addColorStop(0, "#fffbe9");
  disc.addColorStop(1, "#dccfa6");
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(MOON.x, MOON.y, MOON.r, 0, Math.PI * 2);
  ctx.fill();

  const rand = makeRng(21);
  ctx.fillStyle = "rgba(150,138,104,0.16)";
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2;
    const d = rand() * MOON.r * 0.7;
    ctx.beginPath();
    ctx.arc(MOON.x + Math.cos(a) * d, MOON.y + Math.sin(a) * d, 5 + rand() * 11, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A jagged ink-wash ridge: several sines with an |sin| term for sharp peaks.
function makeRidge(baseY, amp, seed) {
  const rand = makeRng(seed);
  const p = [rand() * 6.28, rand() * 6.28, rand() * 6.28, rand() * 6.28];
  return (x) =>
    baseY -
    amp *
      (0.5 * Math.abs(Math.sin(x * 0.0042 + p[0])) +
        0.3 * Math.sin(x * 0.011 + p[1]) +
        0.2 * Math.abs(Math.sin(x * 0.023 + p[2])) +
        0.08 * Math.sin(x * 0.05 + p[3]));
}

function paintRidge(ctx, ridge, top, bottom) {
  const g = ctx.createLinearGradient(0, WATER_SURFACE_Y - 340, 0, WATER_SURFACE_Y);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, WATER_SURFACE_Y);
  for (let x = 0; x <= SCENE_W; x += 10) ctx.lineTo(x, ridge(x));
  ctx.lineTo(SCENE_W, WATER_SURFACE_Y);
  ctx.closePath();
  ctx.fill();
}

function paintMist(ctx, y, height, alpha) {
  const g = ctx.createLinearGradient(0, y - height, 0, y + height);
  g.addColorStop(0, "rgba(150,185,205,0)");
  g.addColorStop(0.5, `rgba(150,185,205,${alpha})`);
  g.addColorStop(1, "rgba(150,185,205,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, y - height, SCENE_W, height * 2);
}

// A small three-tier pagoda silhouette perched on a ridge.
function paintPagoda(ctx, x, baseY, color) {
  ctx.fillStyle = color;
  const tiers = [
    { w: 44, h: 16 },
    { w: 34, h: 14 },
    { w: 24, h: 12 },
  ];
  let y = baseY;
  for (const { w, h } of tiers) {
    ctx.fillRect(x - w / 2 + 4, y - h, w - 8, h); // body
    ctx.beginPath(); // upturned eave
    ctx.moveTo(x - w / 2 - 6, y - h + 2);
    ctx.quadraticCurveTo(x, y - h - 6, x + w / 2 + 6, y - h + 2);
    ctx.lineTo(x + w / 2, y - h + 6);
    ctx.lineTo(x - w / 2, y - h + 6);
    ctx.closePath();
    ctx.fill();
    y -= h + 2;
  }
  ctx.fillRect(x - 1.5, y - 16, 3, 16); // finial
}

function paintCliff(ctx, x0, x1, faceOnRight, seed) {
  const top = BANK_TOP_Y;
  const g = ctx.createLinearGradient(0, top, 0, SCENE_H);
  g.addColorStop(0, "#4a3d2f");
  g.addColorStop(0.5, "#2b2219");
  g.addColorStop(1, "#140f0a");
  ctx.fillStyle = g;
  ctx.fillRect(x0, top, x1 - x0, SCENE_H - top);

  const rand = makeRng(seed);
  // Strata: thin, slightly wavy horizontal seams.
  for (let i = 0; i < 26; i++) {
    const y = top + 14 + rand() * (SCENE_H - top - 20);
    ctx.strokeStyle = `rgba(${rand() < 0.5 ? "0,0,0" : "255,235,200"},${0.06 + rand() * 0.1})`;
    ctx.lineWidth = 1 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    for (let x = x0; x <= x1; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 2.5);
    ctx.stroke();
  }
  // Rough stones.
  for (let i = 0; i < 70; i++) {
    const x = x0 + rand() * (x1 - x0);
    const y = top + 10 + rand() * (SCENE_H - top - 12);
    ctx.fillStyle = `rgba(${rand() < 0.5 ? "0,0,0" : "255,235,200"},${0.05 + rand() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 6 + rand() * 14, 3 + rand() * 8, rand() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Shadowed cliff face toward the river.
  const faceX = faceOnRight ? x1 : x0;
  const face = ctx.createLinearGradient(faceX - (faceOnRight ? 90 : -90), 0, faceX, 0);
  face.addColorStop(0, "rgba(0,0,0,0)");
  face.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = face;
  ctx.fillRect(faceOnRight ? x1 - 90 : x0, top, 90, SCENE_H - top);

  // Mossy lip along the top.
  ctx.fillStyle = "#2f4a37";
  ctx.fillRect(x0, top - 4, x1 - x0, 6);
  ctx.fillStyle = "#3f6247";
  for (let x = x0; x < x1; x += 7 + rand() * 9) {
    ctx.fillRect(x, top - 4 - rand() * 5, 2, 6);
  }
}

function paintRiverBody(ctx) {
  const w = RIVER_RIGHT_X - RIVER_LEFT_X;
  const g = ctx.createLinearGradient(0, WATER_SURFACE_Y, 0, SCENE_H);
  g.addColorStop(0, "#1c5163");
  g.addColorStop(0.5, "#0d3342");
  g.addColorStop(1, "#061a22");
  ctx.fillStyle = g;
  ctx.fillRect(RIVER_LEFT_X, WATER_SURFACE_Y, w, SCENE_H - WATER_SURFACE_Y);
  ctx.fillStyle = "#0a1418"; // riverbed
  ctx.fillRect(RIVER_LEFT_X, RIVERBED_Y, w, SCENE_H - RIVERBED_Y);
}

export function paintBackdrop(canvas) {
  const ctx = canvas.getContext("2d");
  paintSky(ctx);
  paintMoon(ctx);

  const far = makeRidge(WATER_SURFACE_Y - 250, 170, 3);
  const mid = makeRidge(WATER_SURFACE_Y - 150, 140, 11);
  const near = makeRidge(WATER_SURFACE_Y - 70, 110, 29);

  paintRidge(ctx, far, "#28425a", "#1d3448");
  paintPagoda(ctx, 430, far(430) + 4, "#22384d");
  paintMist(ctx, WATER_SURFACE_Y - 210, 70, 0.10);
  paintRidge(ctx, mid, "#182d42", "#122436");
  paintMist(ctx, WATER_SURFACE_Y - 120, 60, 0.09);
  paintRidge(ctx, near, "#0e1e2e", "#0a1622");

  paintRiverBody(ctx);
  paintCliff(ctx, 0, RIVER_LEFT_X, false, 5);
  paintCliff(ctx, RIVER_RIGHT_X, SCENE_W, true, 9);
}

export function paintWaterOverlay(canvas) {
  const ctx = canvas.getContext("2d");
  const w = RIVER_RIGHT_X - RIVER_LEFT_X;

  // Translucent tint over the whole water column, so fallen shards read as
  // underwater rather than lying on top of it.
  const tint = ctx.createLinearGradient(0, WATER_SURFACE_Y, 0, SCENE_H);
  tint.addColorStop(0, "rgba(40,120,150,0.35)");
  tint.addColorStop(1, "rgba(6,40,56,0.55)");
  ctx.fillStyle = tint;
  ctx.fillRect(RIVER_LEFT_X, WATER_SURFACE_Y, w, SCENE_H - WATER_SURFACE_Y);

  const rand = makeRng(41);
  // Moon glitter on the surface.
  for (let i = 0; i < 26; i++) {
    const y = WATER_SURFACE_Y + 6 + i * 3.2;
    const len = 10 + rand() * 70 * (1 - i / 34);
    ctx.fillStyle = `rgba(255,243,210,${0.5 - i * 0.017})`;
    ctx.fillRect(MOON.x - len / 2 + (rand() - 0.5) * 40, y, len, 1.6);
  }
  // Faint ripples.
  ctx.strokeStyle = "rgba(190,230,245,0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 46; i++) {
    const x = RIVER_LEFT_X + rand() * w;
    const y = WATER_SURFACE_Y + 4 + rand() * 62;
    const len = 20 + rand() * 60;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + len / 2, y - 2.5, x + len, y);
    ctx.stroke();
  }
  // The surface line itself.
  ctx.fillStyle = "rgba(200,235,250,0.35)";
  ctx.fillRect(RIVER_LEFT_X, WATER_SURFACE_Y, w, 2);
}
