import { evaluateHalves } from "./failure.js";
import { buildShards, polygonCentroid } from "./fracture.js";
import { createDustSystem } from "./dust.js";
import { playImpact, playBreak } from "./sound.js";
import { WEIGHT_EXPONENT_MIN, WEIGHT_EXPONENT_MAX } from "./units.js";
import { drawShard, drawWeight } from "./stone.js";
import { DOMAIN, SCENE_W, SCENE_H, BANK_TOP_Y, RIVER_LEFT_X, RIVER_RIGHT_X, RIVERBED_Y } from "./scene.js";

const { Engine, Render, Runner, Bodies, Body, Composite, Vector } = window.Matter;

const SETTLE_SPEED = 0.05;
const SETTLE_FRAMES_REQUIRED = 30;
const MAX_FRAMES = 600; // ~10s safety cap in case something never quite settles

// Every shard body shares this (negative) collision group, meaning members
// never collide with each other — the same trick the old single-beam
// version used at the apex, now needed everywhere two shards touch,
// including neighboring shards within the same half.
const SHARD_GROUP = -1;
const MIN_SHARDS = 3;
// High enough that CELLS_PER_SHARD_TARGET is the one actually deciding
// shard count across the real material range (roughly 230-1560kg, i.e.
// ~230-865 solid cells per half) -- an earlier MAX_SHARDS=7 sat below the
// uncapped count everywhere in that range, so every structure shattered
// into exactly 7 pieces per half regardless of how much material it had.
const MAX_SHARDS = 20;
const CELLS_PER_SHARD_TARGET = 25;

// How fast the break travels through the stone, and the longest it may take
// to reach the farthest shard (kept under the ~0.5s of stillness hasSettled
// needs, and hasSettled also waits for every release to have happened).
const PROPAGATION_PX_PER_MS = 2.2;
const MAX_PROPAGATION_MS = 380;
const FLASH_MS = 420;

// Slow motion at the moment of breaking: the physics clock drops to
// SLOWMO_SCALE for SLOWMO_HOLD_MS, then eases back to full speed over
// SLOWMO_RAMP_MS. Skipped entirely for people who ask their system for
// reduced motion.
const SLOWMO_SCALE = 0.3;
const SLOWMO_HOLD_MS = 450;
const SLOWMO_RAMP_MS = 450;
const SLOWMO_STEP_MS = 40;

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shardCountFor(cellCount) {
  return Math.max(MIN_SHARDS, Math.min(MAX_SHARDS, Math.round(cellCount / CELLS_PER_SHARD_TARGET)));
}

// Builds a physics scene testing whether a converged density grid holds
// under a given real-world test weight, drawing onto the SAME canvas the
// optimization animation just used (Matter.Render takes over the canvas
// once this is built — don't draw over it with renderDensities after).
//
// Whether each beam holds is decided analytically before any physics
// runs at all, by evaluateHalves() (failure.js) — real stress from the
// FEM solution against stone's real strength, plus a real Euler buckling
// check — not by anything Matter.js measures during the simulation.
// Physics only animates whichever outcome that calculation already
// determined: setting a beam dynamic on impact if it was going to fail,
// and never touching it if it wasn't.
//
// Returns { ok: false } if the support and apex on either side aren't
// actually connected by material at this volume fraction/load position —
// there's nothing to test, so the caller should treat that as an
// automatic failure without spawning any physics. Otherwise returns an
// object with dropBall()/hasSettled()/collapsed()/stop().
export function buildCollapseScene({ numElemX, numElemY, densities, u, loadColumn, testWeightKg, canvas, effects = {} }) {
  const evaluation = evaluateHalves({ numElemX, numElemY, densities, u, loadColumn, testWeightKg });
  if (!evaluation.ok) return { ok: false };

  const cellWidth = DOMAIN.w / numElemX;
  const cellHeight = DOMAIN.h / numElemY;
  const domainBottom = DOMAIN.y + DOMAIN.h;
  const physicsX = (elx) => DOMAIN.x + elx * cellWidth + cellWidth / 2;
  const physicsY = (ely) => domainBottom - (ely * cellHeight + cellHeight / 2); // flip: ely up == y down

  const engine = Engine.create();
  const world = engine.world;

  // The cliffs the bridge rests on and the riverbed between them — real
  // (collidable) bodies, so debris that breaks free lands on something
  // instead of falling off-screen. Invisible to Matter's renderer: the
  // backdrop already paints them.
  const invisible = { isStatic: true, friction: 0.9, render: { visible: false } };
  const slab = (x0, x1, top) => Bodies.rectangle((x0 + x1) / 2, top + 200, x1 - x0, 400, invisible);
  Composite.add(world, [
    slab(-400, RIVER_LEFT_X, BANK_TOP_Y),
    slab(RIVER_RIGHT_X, SCENE_W + 400, BANK_TOP_Y),
    slab(RIVER_LEFT_X, RIVER_RIGHT_X, RIVERBED_Y),
  ]);

  // A cell's 4 corners in physics/canvas space — the same rectangle
  // renderDensities() draws for that cell, just without its 1px overlap
  // padding (irrelevant here: a shard's hull only keeps its group's outer
  // boundary, so any interior seams between neighboring cells disappear
  // into the hull anyway).
  function cellCorners(elx, ely) {
    const xLeft = DOMAIN.x + elx * cellWidth;
    const xRight = xLeft + cellWidth;
    const yBottom = domainBottom - ely * cellHeight;
    const yTop = yBottom - cellHeight;
    return [
      { x: xLeft, y: yTop },
      { x: xRight, y: yTop },
      { x: xRight, y: yBottom },
      { x: xLeft, y: yBottom },
    ];
  }

  // One half's real, irregular shape — the same solid cells the strength
  // check evaluated, not an idealized straight beam — split into a few
  // convex shards so a failure can shatter it instead of dropping one
  // rigid slab. All shards start static (the half "resting" as tested);
  // the shards are freed once the ball lands (see scheduleRelease below),
  // spreading outward from where the failure starts; the decision itself is
  // made at the half level, not the shard level.
  let nextShardSeed = 1;
  function buildShardBodies(half) {
    const shards = buildShards(half.cells, shardCountFor(half.cells.length), (cell) => cellCorners(cell.elx, cell.ely));
    return shards.map(({ vertices }) => {
      const { x: centerX, y: centerY } = polygonCentroid(vertices);
      const body = Bodies.fromVertices(centerX, centerY, [vertices], {
        friction: 0.9,
        isStatic: true,
        collisionFilter: { group: SHARD_GROUP },
        render: { visible: false }, // drawn by drawShard() in the afterRender hook
      });
      body.plugin = { seed: nextShardSeed++, broken: false };
      Composite.add(world, body);
      return body;
    });
  }

  const leftShards = buildShardBodies(evaluation.left);
  const rightShards = buildShardBodies(evaluation.right);
  const willBreak = { left: evaluation.left.fails, right: evaluation.right.fails };
  const triggered = { left: false, right: false };

  const ballRadius = Math.max(cellWidth, cellHeight) * 1.2;
  const dropStartY = physicsY(numElemY) - ballRadius * 3;
  // The ball's Matter.js mass only affects how the drop LOOKS (a heavier
  // test weight should visibly fall with more presence) — it has no say
  // in whether anything breaks, since that was already decided above.
  const testBall = Bodies.circle(physicsX(loadColumn), dropStartY, ballRadius, {
    density: 0.002 + testWeightKg * 0.0000003,
    friction: 0.9,
    restitution: 0.1,
    isStatic: true, // starts suspended — "the weight resting where you placed it"
    render: { visible: false }, // drawn by drawWeight() in the afterRender hook
  });
  Composite.add(world, testBall);

  const render = Render.create({
    canvas,
    engine,
    // Transparent: the backdrop canvas underneath shows through.
    options: { width: SCENE_W, height: SCENE_H, wireframes: false, background: "transparent" },
  });
  const runner = Runner.create();

  // Registered BEFORE the dust system so the puffs draw on top of the stone.
  window.Matter.Events.on(render, "afterRender", () => {
    const ctx = render.context;
    for (const body of leftShards) drawShard(ctx, body);
    for (const body of rightShards) drawShard(ctx, body);
    drawWeight(ctx, testBall);
    drawCrackFlashes(ctx);
    // Something the caller wants over the wreck (the editor's revealed algorithm
    // bridge). It has to be drawn here: this render repaints the whole canvas every
    // frame, so anything painted on it from outside is gone by the next one.
    if (effects.drawOver) effects.drawOver(ctx);
  });
  const dust = createDustSystem(render);

  // A ring that expands and fades from each crack origin.
  function drawCrackFlashes(ctx) {
    const now = performance.now();
    for (let i = flashes.length - 1; i >= 0; i--) {
      const t = (now - flashes[i].start) / FLASH_MS;
      if (t >= 1) {
        flashes.splice(i, 1);
        continue;
      }
      const { x, y } = flashes[i];
      ctx.save();
      ctx.strokeStyle = `rgba(255,236,190,${0.95 * (1 - t)})`;
      ctx.lineWidth = 1 + 7 * (1 - t);
      ctx.beginPath();
      ctx.arc(x, y, 14 + 90 * t, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,248,225,${0.9 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(x, y, 9 * (1 - t) + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // How hard the drop reads, for both the audio and the dust: derived from
  // the same exponent range main.js maps the weight slider onto, so a
  // heavier test weight sounds and looks heavier, not just "breaks or
  // doesn't."
  const impactIntensity = Math.min(
    1,
    Math.max(0, (Math.log10(testWeightKg) - WEIGHT_EXPONENT_MIN) / (WEIGHT_EXPONENT_MAX - WEIGHT_EXPONENT_MIN))
  );

  // Where the failure starts: for each half that fails, the cell failure.js
  // says it begins in (the worst-stressed cell for a strength failure,
  // mid-strut for buckling). The shards let go outward from there, so the
  // collapse visibly starts where the calculation says it does.
  const origins = [evaluation.left, evaluation.right]
    .filter((half) => half.fails && half.origin)
    .map((half) => ({ x: physicsX(half.origin.cell.elx), y: physicsY(half.origin.cell.ely) }));

  const releaseTimers = new Set();
  const slowMoTimers = new Set();

  function startSlowMotion() {
    if (prefersReducedMotion()) return;
    engine.timing.timeScale = SLOWMO_SCALE;
    const later = (ms, fn) => {
      const id = setTimeout(() => {
        slowMoTimers.delete(id);
        fn();
      }, ms);
      slowMoTimers.add(id);
    };
    // The last step is pinned to exactly SLOWMO_RAMP_MS so the clock ends at
    // precisely 1, however the ramp divides into steps.
    const steps = Math.ceil(SLOWMO_RAMP_MS / SLOWMO_STEP_MS);
    for (let i = 0; i <= steps; i++) {
      const elapsed = Math.min(i * SLOWMO_STEP_MS, SLOWMO_RAMP_MS);
      later(SLOWMO_HOLD_MS + elapsed, () => {
        engine.timing.timeScale = SLOWMO_SCALE + (1 - SLOWMO_SCALE) * (elapsed / SLOWMO_RAMP_MS);
      });
    }
  }

  let pendingReleases = 0;
  const flashes = []; // expanding crack rings, drawn in the afterRender hook

  // Frees one shard. A shard in the half that failed also dulls (a cue on top
  // of the motion) and kicks up dust; the other half is released without
  // recoloring, since it only fell because it lost its support.
  function releaseOne(body, broken) {
    Body.setStatic(body, false);
    if (broken) body.plugin.broken = true;
    const size = (body.bounds.max.x - body.bounds.min.x + (body.bounds.max.y - body.bounds.min.y)) / 4;
    dust.spawnBurst(body.position.x, body.position.y, size);
  }

  // Releases a half's shards in order of distance from the nearest origin, so
  // the break travels through the stone instead of everything letting go at once.
  function scheduleRelease(shards, broken) {
    for (const body of shards) {
      const distance = Math.min(...origins.map((o) => Math.hypot(body.position.x - o.x, body.position.y - o.y)));
      const delay = Math.min(MAX_PROPAGATION_MS, distance / PROPAGATION_PX_PER_MS);
      pendingReleases++;
      const id = setTimeout(() => {
        releaseTimers.delete(id);
        pendingReleases--;
        releaseOne(body, broken);
      }, delay);
      releaseTimers.add(id);
    }
  }

  // evaluateHalves resolves both halves' fates from ONE simultaneous
  // application of the load (real 2D truss statics, splitting the same
  // force across both sides at once) — so the moment the ball actually
  // reaches the structure, both verdicts are already decided together,
  // not one at a time as the ball happens to bump into each side. Waiting
  // for a separate contact per half would let a half the physics already
  // called a failure sit there forever untouched, if the ball's landing
  // spot just never happened to reach it — an inconsistency between what
  // was computed and what's shown, not a different physical outcome.
  let hasImpacted = false;

  const { Events } = window.Matter;
  Events.on(engine, "collisionStart", (event) => {
    for (const pair of event.pairs) {
      const bodies = [pair.bodyA, pair.bodyB];
      if (!bodies.includes(testBall)) continue;
      const touchedStructure = bodies.some((b) => leftShards.includes(b) || rightShards.includes(b));
      if (hasImpacted || !touchedStructure) continue;

      hasImpacted = true;
      playImpact(impactIntensity);
      if (effects.onImpact) effects.onImpact(willBreak.left || willBreak.right, impactIntensity);
      if (willBreak.left || willBreak.right) {
        triggered.left = willBreak.left;
        triggered.right = willBreak.right;
        playBreak(impactIntensity);
        startSlowMotion();
        // The crack starts at each origin: a flash and a burst of dust there.
        for (const o of origins) {
          flashes.push({ x: o.x, y: o.y, start: performance.now() });
          dust.spawnBurst(o.x, o.y, cellWidth * 2.5);
        }
        // The two halves prop each other up at the apex, so once either one
        // fails the other has lost its support too — leaving it frozen in
        // mid-air (as an earlier version did) shows a structure that couldn't
        // actually stand.
        scheduleRelease(leftShards, willBreak.left);
        scheduleRelease(rightShards, willBreak.right);
      }
    }
  });

  let settledFrames = 0;
  let totalFrames = 0;

  return {
    ok: true,
    dropBall() {
      Body.setStatic(testBall, false);
      Render.run(render);
      Runner.run(runner, engine);
    },
    hasSettled() {
      totalFrames++;
      if (totalFrames > MAX_FRAMES) return true;
      if (pendingReleases > 0) return false; // the break is still travelling: don't call it settled yet

      const dynamicBodies = [testBall, ...leftShards, ...rightShards].filter((b) => !b.isStatic);
      const speeds = dynamicBodies.map((b) => Vector.magnitude(b.velocity));
      settledFrames = Math.max(...speeds) < SETTLE_SPEED ? settledFrames + 1 : 0;
      return settledFrames > SETTLE_FRAMES_REQUIRED;
    },
    collapsed() {
      return triggered.left || triggered.right;
    },
    stop() {
      for (const id of releaseTimers) clearTimeout(id);
      releaseTimers.clear();
      for (const id of slowMoTimers) clearTimeout(id);
      slowMoTimers.clear();
      pendingReleases = 0;
      Runner.stop(runner);
      Render.stop(render);
      Composite.clear(world, false);
      Engine.clear(engine);
    },
  };
}
