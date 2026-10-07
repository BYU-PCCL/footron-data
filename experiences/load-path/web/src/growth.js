// Plays the optimizer's run on screen, and records every iteration so it can
// be scrubbed and replayed afterwards.
//
// The optimizer's loop is: solve how the structure bends under the load,
// measure which stone works hardest, smooth that, and move stone toward the
// hard-working places. The first EXPLAIN_ITERATIONS iterations are played as
// those four steps, one at a time, each with its own picture; later
// iterations are fast-forwarded as a quick deformed heat map, so the sag
// visibly shrinks as the bridge stiffens.
import { renderDensities, renderDeformed, renderStress, normalizeHeat } from "./render.js";
import { deformScaleFor } from "./deform.js";
import { computeElementWork } from "./sensitivity.js";
import * as report from "./report.js";

// The largest displacement in the first (softest) iteration is drawn as this
// fraction of the domain height; every later iteration uses the same scale.
const DEFORM_FRACTION = 0.14;
const EXPLAIN_ITERATIONS = 2;
const FAST_MS = 180;

const raf = () => new Promise((resolve) => requestAnimationFrame(resolve));
const ease = (t) => t * t * (3 - 2 * t);

function lerpGrid(a, b, t) {
  return a.map((row, y) => row.map((v, x) => v + (b[y][x] - v) * t));
}

// Draws frame k of a recorded run: the state that iteration solved, deformed
// under the load and colored by strain energy. One position past the last
// iteration is the finished result at rest.
export function showFrame(ctx, playback, index) {
  if (index > playback.frames.length) {
    // The result: how close each stone is to breaking at the test weight, when
    // that has been worked out; otherwise the finished heat map.
    if (playback.stressRatios) renderStress(ctx, playback.final.densities, playback.stressRatios);
    else renderDensities(ctx, playback.final.densities, playback.finalWork);
    return;
  }
  const frame = playback.frames[index - 1];
  renderDeformed(ctx, frame.solvedDensities, frame.solvedU, playback.scale, normalizeHeat(frame.strainEnergy, frame.solvedDensities));
}

// Runs the optimizer to the end while animating it. Resolves with the
// recording, or null if `isCancelled()` turned true (a new run started).
export async function playGrowth({ iterator, ctx, isCancelled, materialKg, skip }) {
  const frames = [];
  let scale = 0;

  const sleep = async (ms) => {
    const start = performance.now();
    while (performance.now() - start < ms) {
      await raf();
      if (isCancelled()) return false;
    }
    return true;
  };
  const tween = async (ms, draw) => {
    const start = performance.now();
    for (;;) {
      await raf();
      if (isCancelled()) return false;
      const t = Math.min(1, (performance.now() - start) / ms);
      draw(ease(t));
      if (t >= 1) return true;
    }
  };

  // The four steps, played out for one iteration.
  async function explain(frame) {
    const { solvedDensities: rest, solvedU: u } = frame;
    const energy = normalizeHeat(frame.strainEnergy, rest);
    const importance = normalizeHeat(frame.importance, rest);
    const plain = energy.map((row) => row.map(() => 0.4)); // 0.4 on the heat ramp is plain stone

    report.setStage(1, "Solve: press on it and see how it bends (finite elements).");
    if (!(await tween(1000, (t) => renderDeformed(ctx, rest, u, scale * t, null)))) return false;

    report.setStage(2, "Measure: which stone is working hardest? Red is working hardest, blue is idle.");
    if (!(await tween(700, (t) => renderDeformed(ctx, rest, u, scale, lerpGrid(plain, energy, t))))) return false;
    if (!(await sleep(900))) return false;

    report.setStage(3, "Smooth: average with neighbours, so we get struts instead of checkerboards.");
    if (!(await tween(800, (t) => renderDeformed(ctx, rest, u, scale, lerpGrid(energy, importance, t))))) return false;
    if (!(await sleep(500))) return false;

    report.setStage(4, "Move: take stone from idle spots and add it where it is needed. Total stone is unchanged.");
    return tween(1100, (t) => renderDeformed(ctx, lerpGrid(rest, frame.densities, t), u, scale * (1 - t), importance));
  }

  async function fastForward(frame) {
    report.setStage(null);
    renderDeformed(ctx, frame.solvedDensities, frame.solvedU, scale, normalizeHeat(frame.strainEnergy, frame.solvedDensities));
    return sleep(FAST_MS);
  }

  report.setSkipVisible(true);
  for (;;) {
    const { value: frame, done } = iterator.next();
    if (done) break;
    if (isCancelled()) return null;

    frames.push(frame);
    if (frames.length === 1) scale = deformScaleFor(frame.solvedU, DEFORM_FRACTION);
    report.updateReport({
      iteration: frame.iteration,
      compliance: frame.compliance,
      maxChange: frame.maxChange,
      converged: frame.converged,
      finished: frame.finished,
      materialKg,
    });

    const explained = frames.length <= EXPLAIN_ITERATIONS && !skip.requested;
    if (!(explained ? await explain(frame) : await fastForward(frame))) return null;
    if (frames.length === EXPLAIN_ITERATIONS) report.setSkipVisible(false);
    if (frame.finished) break;
  }
  report.setSkipVisible(false);
  report.setStage(null);

  const final = frames[frames.length - 1];
  const numElemY = final.densities.length;
  const numElemX = final.densities[0].length;
  const finalWork = computeElementWork(numElemX, numElemY, final.densities, final.u);
  renderDensities(ctx, final.densities, finalWork);
  return { frames, scale, final, finalWork };
}
