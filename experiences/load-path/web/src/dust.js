// A lightweight dust puff spawned where a shard breaks — pure decoration,
// drawn on top of Matter's own render via its afterRender hook. It never
// touches physics: nothing here reads or writes any body, so a burst can't
// possibly perturb the collapse itself.
import { DUST_COLOR } from "./theme.js";

const PARTICLES_PER_BURST = 8;
const LIFETIME_MS = 700;

export function createDustSystem(render) {
  let particles = [];

  function spawnBurst(x, y, radius) {
    for (let i = 0; i < PARTICLES_PER_BURST; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (radius * (0.5 + Math.random() * 1.5)) / LIFETIME_MS;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - radius / LIFETIME_MS, // slight upward bias, like kicked-up dust
        radius: radius * (0.15 + Math.random() * 0.25),
        bornAt: performance.now(),
      });
    }
  }

  const { Events } = window.Matter;
  Events.on(render, "afterRender", () => {
    const ctx = render.context;
    const now = performance.now();
    particles = particles.filter((p) => now - p.bornAt < LIFETIME_MS);

    ctx.fillStyle = DUST_COLOR;
    for (const p of particles) {
      const age = (now - p.bornAt) / LIFETIME_MS;
      const elapsed = now - p.bornAt;
      ctx.globalAlpha = (1 - age) * 0.5;
      ctx.beginPath();
      ctx.arc(p.x + p.vx * elapsed, p.y + p.vy * elapsed, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  return { spawnBurst };
}
