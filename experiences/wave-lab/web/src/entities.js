// Everything that lives on top of the water: floating toys that surf the swell,
// crabs that bolt from the swash, gulls overhead, and beach furniture that the
// tide will eventually steal.

import { NX, NY, SCALE, VIEW_X0 } from './sim.js';

const TAU = Math.PI * 2;
// The solver advances ~12 sim-time units per wall-clock second at speed 1.
const SIM_PER_SECOND = 12;
// Lengths and speeds below are in cells, so they scale with the grid: that keeps
// a beach ball the same size and a crab the same speed on every tier.
const S = SCALE;
const rand = (a, b) => a + Math.random() * (b - a);
const wrap = y => ((y % NY) + NY) % NY;
const pick = a => a[(Math.random() * a.length) | 0];

export const FLOATER_KINDS = ['ball', 'duck', 'ring', 'boat', 'coconut'];
export const SHELL_KINDS = ['scallop', 'spiral', 'star', 'pebble'];
export const PROP_KINDS = ['umbrella', 'palm', 'towel', 'chair', 'castle'];

const BALL_COLORS = [
  ['#ff4d5e', '#fff'], ['#ffd23f', '#fff'], ['#3fa9f5', '#fff'],
  ['#7ed957', '#fff'], ['#c77dff', '#fff'],
];

export class World {
  constructor(sim) {
    this.sim = sim;
    this.floaters = [];
    this.crabs = [];
    this.gulls = [];
    this.props = [];
    this.splashes = [];
    this.footprints = [];
    this.pipers = [];
    this.dolphins = [];
    this.shells = [];
    this.surf = null;              // set by main.js if audio is available
    // Cross-shore position of the break, shared by every bird. Recomputed a
    // couple of times a second rather than per bird per frame.
    this.surfX = NX * 0.62;
    this.surfT = 0;
    for (let i = 0; i < 5; i++) this.addCrab();
    for (let i = 0; i < 3; i++) this.addGull();
    for (let i = 0; i < 7; i++) this.addPiper();
    this.addPod();
    for (let i = 0; i < 26; i++) this.addShell();
  }

  reset() {
    this.floaters.length = 0;
    this.props.length = 0;
    this.splashes.length = 0;
    this.footprints.length = 0;
    this.shells.length = 0;
    for (let i = 0; i < 26; i++) this.addShell();
  }

  // ------------------------------------------------------------------ spawn

  addFloater(x, y, kind) {
    if (this.floaters.length > 90) this.floaters.shift();
    this.floaters.push({
      kind: kind || pick(FLOATER_KINDS),
      x, y, vx: 0, vy: 0, spin: rand(0, TAU), spinV: rand(-1, 1),
      r: rand(2.4, 3.6) * S, colors: pick(BALL_COLORS), seed: Math.random(),
      beached: 0,
    });
  }

  addCrab(x, y) {
    const sim = this.sim;
    if (x === undefined) {
      // start crabs on dry-ish sand
      for (let tries = 0; tries < 40; tries++) {
        const gx = rand(NX * 0.76, NX * 0.96), gy = rand(0, NY);
        if (sim.depthAt(gx, gy) < 0.02) { x = gx; y = gy; break; }
      }
      if (x === undefined) { x = NX * 0.9; y = rand(0, NY); }
    }
    this.crabs.push({ x, y, dir: rand(0, TAU), speed: rand(2.6, 4.2) * S, t: rand(0, 3), panic: 0, leg: 0 });
  }

  // Gulls. A bird is mostly recognisable by HOW it moves, so the flight model
  // gets more attention than the drawing:
  //
  //  * It holds a bank and comes round in an arc. The old version added a
  //    random number to the heading every frame, which is a drunk walk — the
  //    path had no radius and the bird read as an insect.
  //  * It flaps in bursts and then glides with the wings held still. A gull
  //    glides far more of the time than it beats, and the stillness is most of
  //    what reads as a bird.
  //  * It works the surf line, by sampling the whitewater ahead to either side
  //    and leaning toward whichever has more. Nothing tells it where the surf
  //    is; it finds it, and it follows the break as the break moves.
  //  * It loses height into a dive and climbs back out flapping hard.
  addGull() {
    this.gulls.push({
      x: rand(VIEW_X0, NX), y: rand(0, NY), a: rand(0, TAU),
      sp: rand(11, 15) * S,
      turn: 0, turnGoal: 0, turnT: rand(0, 3), bank: 0,
      wing: rand(0, TAU), flap: 1, burst: 0, glide: rand(0.4, 2.6),
      cruise: rand(0.85, 1.3), alt: 1, dive: 0,
      // Its own preferred stand-off from the break, so a flock strings out
      // along the surf instead of stacking into one line.
      band: rand(-17, 13) * S,
    });
  }

  // Sandpipers: the birds that run down the beach after a retreating wave and
  // sprint back up ahead of the next one. All of that falls out of one rule —
  // stay just at the edge of the water — so they read as alive without any
  // scripted behaviour.
  addPiper(x, y) {
    this.pipers.push({
      x: x === undefined ? NX * 0.84 : x,
      y: y === undefined ? rand(0, NY) : y,
      vx: 0, vy: 0, leg: rand(0, TAU), peck: 0, seed: Math.random(),
      want: rand(0.06, 0.16),      // preferred water depth to forage in
    });
  }

  // A pod offshore, surfing the face of the swell the way real dolphins do.
  addPod() {
    const n = 3 + ((Math.random() * 3) | 0);
    const y0 = rand(0, NY);
    for (let i = 0; i < n; i++) {
      this.dolphins.push({
        x: NX * rand(0.18, 0.30), y: wrap(y0 + rand(-9, 9) * S),
        vx: 0, vy: 0, phase: rand(0, TAU), up: 0, seed: Math.random(),
        lead: i === 0,
      });
    }
  }

  addShell(x, y, kind) {
    if (x === undefined) {
      for (let t = 0; t < 30; t++) {
        const gx = rand(NX * 0.62, NX * 0.94), gy = rand(0, NY);
        if (this.sim.bedAt(gx, gy) > -0.2) { x = gx; y = gy; break; }
      }
      if (x === undefined) { x = NX * 0.8; y = rand(0, NY); }
    }
    this.shells.push({
      x, y, kind: kind || pick(SHELL_KINDS), rot: rand(0, TAU),
      seed: Math.random(), r: rand(0.7, 1.5) * S,
    });
  }

  addProp(x, y, kind) {
    this.props.push({ kind: kind || pick(PROP_KINDS), x, y, seed: Math.random(), rot: rand(0, TAU), sway: rand(0, TAU) });
  }

  addSplash(x, y, n = 10, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), sp = rand(2, 9) * power * S;
      this.splashes.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, r: rand(0.5, 1.6) * S });
    }
  }

  // ----------------------------------------------------------------- update

  // `dt` is SIM time (the water's clock, ~12 units per wall-clock second).
  // Anything coupled to the water integrates in it; anything with its own pace
  // (legs, wingbeats, timers, fading) uses the wall-clock equivalent `rs`.
  update(dt) {
    const sim = this.sim;
    const rs = dt / SIM_PER_SECOND;
    const wrapY = y => ((y % NY) + NY) % NY;

    for (const f of this.floaters) {
      const H = sim.depthAt(f.x, f.y);
      if (H > 0.06) {
        const [gx, gy] = sim.slopeAt(sim.eta, f.x, f.y);
        const [wu, wv] = sim.velAt(f.x, f.y);
        const surf = Math.min(1, H / 0.8);          // shallow water shoves harder
        // Coupling is stronger under a crest than in a trough, which is exactly
        // why real flotsam drifts shoreward instead of just circling in place.
        const lift = Math.max(0, sim.etaAt(f.x, f.y) - sim.sea);
        const grip = Math.min(0.85, (1 + 2.6 * Math.min(1, lift * 1.6)) * 4.2 * surf * dt);
        f.vx += -gx * 40 * S * dt + (wu - f.vx) * grip + sim.params.wind * 0.8 * S * dt;
        f.vy += -gy * 40 * S * dt + (wv - f.vy) * grip;
        f.beached = 0;
      } else {
        const stop = Math.pow(0.02, rs);
        f.vx *= stop; f.vy *= stop;
        f.beached = Math.min(1, f.beached + rs);
        // roll downhill on wet sand so beached toys settle naturally
        const [bx, by] = sim.slopeAt(sim.bed, f.x, f.y);
        f.vx -= bx * 3 * S * dt; f.vy -= by * 3 * S * dt;
      }
      const sp = Math.hypot(f.vx, f.vy);
      const vmax = 8 * S;
      if (sp > vmax) { f.vx *= vmax / sp; f.vy *= vmax / sp; }
      f.x += f.vx * dt; f.y = wrapY(f.y + f.vy * dt);
      if (f.x < 2 * S) { f.x = 2 * S; f.vx = Math.abs(f.vx) * 0.4; }
      if (f.x > NX - 2 * S) { f.x = NX - 2 * S; f.vx = -Math.abs(f.vx) * 0.4; }
      f.spin += f.spinV * rs * 3 + f.vx * dt * 0.25;
      if (sp > 2.2 * S && Math.random() < rs * 4) this.addSplash(f.x, f.y, 2, 0.5);
    }

    for (const c of this.crabs) {
      const H = sim.depthAt(c.x, c.y);
      c.t -= rs;
      if (H > 0.05) {
        c.panic = 1;
        // scuttle uphill, away from the water
        const [bx, by] = sim.slopeAt(sim.bed, c.x, c.y);
        const m = Math.hypot(bx, by) || 1;
        c.dir = Math.atan2(by / m, bx / m);
      } else {
        c.panic = Math.max(0, c.panic - rs * 0.7);
        if (c.t <= 0) { c.t = rand(0.6, 2.6); c.dir += rand(-1.6, 1.6); }
      }
      const sp = c.speed * (1 + c.panic * 2.4);
      c.x += Math.cos(c.dir) * sp * rs;
      c.y = wrapY(c.y + Math.sin(c.dir) * sp * rs);
      c.leg += sp * rs * 2.6;
      if (c.x < NX * 0.55) { c.x = NX * 0.55; c.dir = rand(-0.6, 0.6); }
      if (c.x > NX - 3 * S) { c.x = NX - 3 * S; c.dir = Math.PI + rand(-0.6, 0.6); }
      if (Math.random() < rs * 1.5 && H < 0.02 && sim.bedAt(c.x, c.y) > 0.2) {
        this.footprints.push({ x: c.x, y: c.y, life: 1, r: 0.7 * S });
      }
    }

    // --- sandpipers: hold the waterline, flee what is coming ---
    for (const b of this.pipers) {
      const H = sim.depthAt(b.x, b.y);
      const [bx] = sim.slopeAt(sim.bed, b.x, b.y);
      // Look a little seaward: if water is arriving there, leave now. This one
      // lookahead is what turns "stand near water" into "outrun the wave".
      const ahead = sim.depthAt(b.x - 4 * S, b.y);
      let drive;
      if (H > b.want * 2.2 || ahead > 0.34) {
        drive = 1;                       // uphill, fast
        b.peck = 0;
      } else if (H < b.want * 0.5) {
        drive = -0.55;                   // downhill, following the water out
      } else {
        drive = 0;
        b.peck += rs * (1.4 + b.seed);   // forage where the sand is just wet
      }
      const urgency = H > 0.06 ? 2.4 : 1;
      const sp = 13 * S * urgency;
      b.vx += (drive * sp * (bx > 0 ? 1 : 1) - b.vx) * Math.min(1, rs * 9);
      b.vy += (Math.sin(b.leg * 0.7 + b.seed * 6) * 2.2 * S - b.vy) * Math.min(1, rs * 3);
      b.x += b.vx * rs; b.y = wrapY(b.y + b.vy * rs);
      b.leg += Math.abs(b.vx) * rs * 1.1 + rs * 2;
      if (b.x < NX * 0.55) { b.x = NX * 0.55; b.vx = Math.abs(b.vx); }
      if (b.x > NX - 3 * S) { b.x = NX - 3 * S; b.vx = -Math.abs(b.vx); }
      if (Math.random() < rs * 2.2 && H < 0.02 && sim.bedAt(b.x, b.y) > 0) {
        this.footprints.push({ x: b.x, y: b.y, life: 1, r: 0.5 * S });
      }
    }

    // --- dolphins: ride the front face of a swell, breathe at the top ---
    for (const dph of this.dolphins) {
      const H = sim.depthAt(dph.x, dph.y);
      const [gx, gy] = sim.slopeAt(sim.eta, dph.x, dph.y);
      if (H > 1.2) {
        // A wave face slopes down-shore ahead of the crest; swimming down that
        // slope is exactly what surfing is.
        dph.vx += (-gx * 90 * S - dph.vx * 0.9) * Math.min(1, rs * 2.4);
        dph.vy += (-gy * 60 * S - dph.vy * 0.9) * Math.min(1, rs * 2.4);
        dph.vx += 5.5 * S * rs;              // steady swim shoreward
      } else {
        dph.vx -= 26 * S * rs;              // too shallow: turn back out
        dph.vy *= Math.pow(0.4, rs);
      }
      const spd = Math.hypot(dph.vx, dph.vy);
      const vmax = 16 * S;
      if (spd > vmax) { dph.vx *= vmax / spd; dph.vy *= vmax / spd; }
      dph.x += dph.vx * rs; dph.y = wrapY(dph.y + dph.vy * rs);
      if (dph.x < VIEW_X0 + 4 * S) { dph.x = VIEW_X0 + 4 * S; dph.vx = Math.abs(dph.vx); }
      dph.phase += rs * (1.6 + spd / (7 * S));
      const wasUp = dph.up;
      dph.up = Math.sin(dph.phase) > 0.55 ? 1 : 0;   // surfacing arc
      if (dph.up && !wasUp && H > 1.0) {
        this.addSplash(dph.x, dph.y, 4, 0.5);
        if (this.surf) this.surf.splash(0.35);
      }
    }

    // Where the surf is. The outermost solid foam on a row is the break; with
    // no foam anywhere — a glassy morning — fall back to the waterline, which
    // is where the birds would be standing about anyway.
    this.surfT -= rs;
    if (this.surfT <= 0) {
      this.surfT = 0.4;
      const step = Math.max(4, Math.round(NY / 24));
      const from = VIEW_X0;
      let sum = 0, n = 0;
      for (let j = 0; j < NY; j += step) {
        const row = j * NX;
        let at = -1;
        for (let i = from; i < NX; i++) if (sim.foam[row + i] > 0.5) { at = i; break; }
        if (at < 0) {
          for (let i = NX - 1; i > from; i--) {
            if (sim.sea - sim.bed[row + i] > 0.3) { at = i; break; }
          }
        }
        if (at >= 0) { sum += at; n++; }
      }
      if (n) this.surfX += (sum / n - this.surfX) * 0.5;
    }

    for (const g of this.gulls) {
      // --- steering: hold a bank, then pick a new one -----------------------
      g.turnT -= rs;
      if (g.turnT <= 0) {
        g.turnT = 1.3 + Math.random() * 3.4;
        g.turnGoal = rand(-1, 1) * 1.15;
        if (Math.random() < 0.34) g.turnGoal *= 0.12;   // a long straight glide
      }
      // Lean toward the whitewater: two samples ahead, one either side. This is
      // the whole of the hunting behaviour, and it is enough — the birds end up
      // strung out along the break because that is where the gradient leads.
      const look = 9 * S;
      const la = g.a - 0.55, ra = g.a + 0.55;
      const fl = sim.bilinear(sim.foam, g.x + Math.cos(la) * look, g.y + Math.sin(la) * look);
      const fr = sim.bilinear(sim.foam, g.x + Math.cos(ra) * look, g.y + Math.sin(ra) * look);
      // Patrol the break: aim at a point on this bird's own stand-off line, a
      // good way further along the coast, so it flies ALONG the surf rather
      // than straight at it. The foam gradient above then does the fine work.
      const along = Math.sin(g.a) >= 0 ? 1 : -1;
      let err = Math.atan2(along * 46 * S, (this.surfX + g.band) - g.x) - g.a;
      err = Math.atan2(Math.sin(err), Math.cos(err));      // to -pi..pi
      let turnGoal = g.turnGoal * 0.5
        + Math.max(-1.1, Math.min(1.1, err * 1.3))
        + (fr - fl) * 1.6;
      // and keep off the far side of the dunes, where there is nothing for them
      if (g.x > NX * 0.94) turnGoal += along > 0 ? 0.6 : -0.6;
      g.turn += (turnGoal - g.turn) * Math.min(1, rs * 2.4);
      g.a += g.turn * rs;
      g.bank += (g.turn * 0.8 - g.bank) * Math.min(1, rs * 3.2);

      // --- flap in bursts, glide in between --------------------------------
      g.glide -= rs;
      if (g.glide <= 0) {
        g.glide = 2.2 + Math.random() * 4.0;
        g.burst = 0.40 + Math.random() * 0.7;
      }
      if (g.burst > 0) { g.burst -= rs; g.flap += (1 - g.flap) * Math.min(1, rs * 7); }
      else g.flap += (0.06 - g.flap) * Math.min(1, rs * 2.2);
      // A hard turn costs lift, so a banking gull beats its wings.
      const work = Math.min(0.7, Math.abs(g.bank) * 0.5);
      g.wing += rs * (g.dive > 0 ? 15 : 6.4) * (0.35 + Math.max(g.flap, work));

      // --- diving ------------------------------------------------------------
      const overSurf = sim.bilinear(sim.foam, g.x, g.y);
      if (g.dive > 0) {
        g.dive -= rs;
        g.alt += (0.38 - g.alt) * Math.min(1, rs * 4.5);
        g.flap = Math.max(g.flap, 0.85);
      } else {
        // more likely to go for it over broken water than over flat sea
        if (Math.random() < rs * (0.022 + overSurf * 0.26)) g.dive = 1.1;
        g.alt += (g.cruise - g.alt) * Math.min(1, rs * 1.1);
      }
      if (Math.random() < rs * 0.05 && this.surf) this.surf.gull();

      g.x += Math.cos(g.a) * g.sp * rs;
      g.y = wrapY(g.y + Math.sin(g.a) * g.sp * rs);
      // Wrap at the edges of the PICTURE, not of the basin. Wrapping at the
      // basin meant a bird left the frame and reappeared several seconds later
      // after crossing the hidden offshore strip, which reads as one having
      // been lost rather than as one having flown past.
      if (g.x < VIEW_X0 - 6 * S) g.x = NX + 6 * S;
      if (g.x > NX + 6 * S) g.x = VIEW_X0 - 6 * S;
      if (g.dive > 0 && g.dive < 0.12 && sim.depthAt(g.x, g.y) > 0.3) {
        this.addSplash(g.x, g.y, 8, 0.8);
        sim.splash(g.x, g.y, 0.35, 3 * S);
        if (this.surf) this.surf.splash(0.5);
        g.dive = 0;
        g.burst = 1.0;                 // climb away hard
        g.turnGoal = rand(-1, 1) * 1.2;
      }
    }

    for (let i = this.props.length - 1; i >= 0; i--) {
      const p = this.props[i];
      p.sway += rs;
      const H = sim.depthAt(p.x, p.y);
      if (H > 0.30) {
        // the sea claims it: umbrellas become flotsam
        this.props.splice(i, 1);
        this.addSplash(p.x, p.y, 14, 1.2);
        this.addFloater(p.x, p.y, p.kind === 'palm' ? 'coconut' : 'ring');
      } else if (p.kind === 'castle' && H > 0.06) {
        p.decay = (p.decay === undefined ? 1 : p.decay) - rs * 0.5;   // castles dissolve
        if (p.decay <= 0) { this.props.splice(i, 1); this.addSplash(p.x, p.y, 8, 0.7); }
      }
    }

    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      s.life -= rs * 1.8;
      const drag = Math.pow(0.25, rs);
      s.vx *= drag; s.vy *= drag;
      s.x += s.vx * rs; s.y = wrapY(s.y + s.vy * rs);
      if (s.life <= 0) this.splashes.splice(i, 1);
    }
    // Shells are nudged along by thin fast water, which is how a strand line
    // forms: they collect exactly where the swash gives up.
    for (const sh of this.shells) {
      const H = sim.depthAt(sh.x, sh.y);
      if (H > 0.03 && H < 0.5) {
        const [wu, wv] = sim.velAt(sh.x, sh.y);
        sh.x += wu * rs * 0.30;
        sh.y = wrapY(sh.y + wv * rs * 0.30);
        sh.rot += (wu + wv) * rs * 0.25;
      }
      if (sh.x < NX * 0.5) sh.x = NX * 0.5;
      if (sh.x > NX - 2 * S) sh.x = NX - 2 * S;
    }

    for (let i = this.footprints.length - 1; i >= 0; i--) {
      const f = this.footprints[i];
      f.life -= rs * 0.05 + (sim.depthAt(f.x, f.y) > 0.02 ? rs * 2 : 0);
      if (f.life <= 0) this.footprints.splice(i, 1);
    }
    if (this.footprints.length > 400) this.footprints.splice(0, this.footprints.length - 400);
  }

  // ------------------------------------------------------------------- draw

  draw(ctx, S, theme, time) {
    const sim = this.sim;
    ctx.save();
    ctx.scale(S, S);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // footprints / critter tracks in the sand
    ctx.fillStyle = 'rgba(120,96,68,0.20)';
    for (const f of this.footprints) {
      ctx.globalAlpha = 0.25 * f.life;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const sh of this.shells) this.drawShell(ctx, sh, sim);
    for (const p of this.props) this.drawProp(ctx, p, sim, time);
    for (const d of this.dolphins) this.drawDolphin(ctx, d, sim);
    for (const c of this.crabs) this.drawCrab(ctx, c, sim);
    for (const b of this.pipers) this.drawPiper(ctx, b, sim);
    for (const f of this.floaters) this.drawFloater(ctx, f, sim, time);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const s of this.splashes) {
      ctx.globalAlpha = Math.max(0, s.life) * 0.85;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (0.5 + s.life), 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const g of this.gulls) this.drawGull(ctx, g, theme);
    ctx.restore();
  }

  drawFloater(ctx, f, sim, time) {
    const lift = Math.max(0, sim.etaAt(f.x, f.y) - sim.sea) * 0.9;
    const x = f.x - lift * 0.35, y = f.y - lift * 0.8;
    const r = f.r;
    // shadow on the water
    ctx.fillStyle = 'rgba(0,20,40,0.28)';
    ctx.beginPath(); ctx.ellipse(f.x + r * 0.35, f.y + r * 0.45, r * 0.95, r * 0.75, 0, 0, TAU); ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(f.spin);
    switch (f.kind) {
      case 'ball': {
        const [a, b] = f.colors;
        for (let k = 0; k < 6; k++) {
          ctx.fillStyle = k % 2 ? b : a;
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.arc(0, 0, r, (k * TAU) / 6, ((k + 1) * TAU) / 6); ctx.fill();
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, TAU); ctx.fill();
        break;
      }
      case 'duck':
        ctx.fillStyle = '#ffd83d';
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.8, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.75, -r * 0.15, r * 0.45, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ff8c1a';
        ctx.beginPath(); ctx.moveTo(r * 1.1, -r * 0.2); ctx.lineTo(r * 1.7, -r * 0.05);
        ctx.lineTo(r * 1.1, r * 0.12); ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(r * 0.85, -r * 0.35, r * 0.11, 0, TAU); ctx.fill();
        break;
      case 'ring':
        ctx.lineWidth = r * 0.55;
        ctx.strokeStyle = f.colors[0];
        ctx.beginPath(); ctx.arc(0, 0, r * 0.75, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#fff';
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.75, (k * TAU) / 4, (k * TAU) / 4 + 0.5); ctx.stroke();
        }
        break;
      case 'boat':
        ctx.fillStyle = '#e8e3d8';
        ctx.beginPath();
        ctx.moveTo(r * 1.5, 0); ctx.lineTo(-r * 0.9, -r * 0.75);
        ctx.quadraticCurveTo(-r * 1.3, 0, -r * 0.9, r * 0.75); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2f6fbf';
        ctx.beginPath();
        ctx.moveTo(r * 0.1, -r * 0.1); ctx.lineTo(-r * 0.6, -r * 0.55);
        ctx.lineTo(-r * 0.6, r * 0.35); ctx.closePath(); ctx.fill();
        break;
      default: // coconut
        ctx.fillStyle = '#7a5230';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.25, r * 0.3, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  drawCrab(ctx, c, sim) {
    const s = 1.9 * S;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.dir);
    ctx.fillStyle = 'rgba(0,20,40,0.20)';
    ctx.beginPath(); ctx.ellipse(0.5, 0.6, s * 0.9, s * 0.6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = c.panic > 0.4 ? '#ff5b3d' : '#e2653c';
    ctx.lineWidth = 0.45 * S;
    for (let k = -1; k <= 1; k++) {
      const w = Math.sin(c.leg + k) * 0.5;
      ctx.beginPath();
      ctx.moveTo(k * 0.5, -s * 0.4); ctx.lineTo(k * 0.7 - 0.3, -s * 1.1 - w * 0.4);
      ctx.moveTo(k * 0.5, s * 0.4); ctx.lineTo(k * 0.7 - 0.3, s * 1.1 + w * 0.4);
      ctx.stroke();
    }
    ctx.fillStyle = c.panic > 0.4 ? '#ff6a4a' : '#d95c33';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.85, s * 0.62, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.85, -s * 0.45, s * 0.3, 0, TAU);
    ctx.arc(s * 0.85, s * 0.45, s * 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.28, 0.28, 0, TAU);
    ctx.arc(s * 0.35, s * 0.28, 0.28, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawShell(ctx, sh, sim) {
    // Buried shells fade rather than vanish, so erosion uncovering them reads
    // as the sand moving, not as objects popping into existence.
    const bury = sim.bedAt(sh.x, sh.y);
    const a = Math.max(0, Math.min(1, 1.4 - Math.max(0, bury - 1.2)));
    if (a < 0.05) return;
    const wet = Math.min(1, sim.depthAt(sh.x, sh.y) * 8);
    ctx.save();
    ctx.globalAlpha = a * (0.85 - wet * 0.25);
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.rot);
    const r = sh.r;
    switch (sh.kind) {
      case 'scallop':
        ctx.fillStyle = sh.seed > 0.5 ? '#f2e0cd' : '#ecd2c6';
        ctx.beginPath();
        ctx.moveTo(0, r);
        ctx.quadraticCurveTo(-r * 1.2, -r * 0.4, 0, -r);
        ctx.quadraticCurveTo(r * 1.2, -r * 0.4, 0, r);
        ctx.fill();
        ctx.strokeStyle = 'rgba(170,140,116,0.5)';
        ctx.lineWidth = 0.22 * S;
        ctx.beginPath();
        for (let k = -1; k <= 1; k++) { ctx.moveTo(k * r * 0.35, r * 0.8); ctx.lineTo(k * r * 0.5, -r * 0.7); }
        ctx.stroke();
        break;
      case 'spiral':
        ctx.strokeStyle = '#e8cdb4';
        ctx.lineWidth = 0.5 * S;
        ctx.beginPath();
        for (let k = 0; k < 16; k++) {
          const t = k / 15, ang = t * TAU * 1.7, rr = r * (1 - t * 0.85);
          const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        break;
      case 'star':
        ctx.fillStyle = '#e08a6a';
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const ang = (k * TAU) / 10, rr = k % 2 ? r * 0.42 : r * 1.15;
          const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath(); ctx.fill();
        break;
      default:
        ctx.fillStyle = sh.seed > 0.5 ? '#b6b0a6' : '#9c968e';
        ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.7, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawPiper(ctx, b, sim) {
    const sc = 1.5 * S;
    const run = Math.min(1, Math.abs(b.vx) / (7 * S));
    const stride = Math.sin(b.leg * 2.4) * run;
    const bob = Math.abs(Math.sin(b.leg * 1.2)) * 0.3 * run;
    const pecking = b.peck > 0 && Math.sin(b.peck * 3.1) > 0.55;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = 'rgba(0,20,40,0.18)';
    ctx.beginPath(); ctx.ellipse(sc * 0.4, sc * 0.5, sc * 0.8, sc * 0.5, 0, 0, TAU); ctx.fill();
    ctx.rotate(b.vx < 0 ? Math.PI : 0);
    // legs
    ctx.strokeStyle = '#d8a24a';
    ctx.lineWidth = 0.2 * S;
    ctx.beginPath();
    ctx.moveTo(-sc * 0.1, sc * 0.2); ctx.lineTo(-sc * 0.1 + stride * sc * 0.5, sc * 0.9);
    ctx.moveTo(sc * 0.1, sc * 0.2); ctx.lineTo(sc * 0.1 - stride * sc * 0.5, sc * 0.9);
    ctx.stroke();
    // body, head, bill
    ctx.fillStyle = '#efe6da';
    ctx.beginPath(); ctx.ellipse(0, -bob * sc, sc * 0.85, sc * 0.55, -0.12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9c8b76';
    ctx.beginPath(); ctx.ellipse(-sc * 0.25, -sc * 0.15 - bob * sc, sc * 0.6, sc * 0.34, -0.2, 0, TAU); ctx.fill();
    const hy = (pecking ? sc * 0.55 : -sc * 0.55) - bob * sc;
    ctx.fillStyle = '#f4ece2';
    ctx.beginPath(); ctx.arc(sc * 0.55, hy, sc * 0.32, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3b3b3b';
    ctx.lineWidth = 0.16 * S;
    ctx.beginPath();
    ctx.moveTo(sc * 0.8, hy);
    ctx.lineTo(sc * 1.5, hy + (pecking ? sc * 0.3 : sc * 0.06));
    ctx.stroke();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(sc * 0.66, hy - sc * 0.09, sc * 0.08, 0, TAU); ctx.fill();
    ctx.restore();
  }

  drawDolphin(ctx, d, sim) {
    const sc = 4.2 * S;
    const lift = Math.max(0, sim.etaAt(d.x, d.y) - sim.sea);
    const surfaced = d.up;
    const ang = Math.atan2(d.vy, d.vx);
    ctx.save();
    // Below the surface it is a soft shadow; only the arc of the back breaks
    // through, which is all you ever actually see of a dolphin from above.
    ctx.globalAlpha = surfaced ? 0.95 : 0.34;
    ctx.translate(d.x - lift * 0.3, d.y - lift * 0.6);
    ctx.rotate(ang);
    ctx.fillStyle = surfaced ? '#5c6a78' : 'rgba(24,54,74,0.9)';
    ctx.beginPath();
    ctx.moveTo(sc * 1.25, 0);
    ctx.quadraticCurveTo(sc * 0.2, -sc * 0.42, -sc * 0.95, -sc * 0.20);
    ctx.quadraticCurveTo(-sc * 1.35, 0, -sc * 0.95, sc * 0.20);
    ctx.quadraticCurveTo(sc * 0.2, sc * 0.42, sc * 1.25, 0);
    ctx.fill();
    // tail flukes
    ctx.beginPath();
    ctx.moveTo(-sc * 0.9, 0);
    ctx.lineTo(-sc * 1.5, -sc * 0.42);
    ctx.lineTo(-sc * 1.25, 0);
    ctx.lineTo(-sc * 1.5, sc * 0.42);
    ctx.closePath(); ctx.fill();
    if (surfaced) {
      ctx.fillStyle = '#46525e';        // dorsal fin
      ctx.beginPath();
      ctx.moveTo(sc * 0.1, 0);
      ctx.lineTo(-sc * 0.15, -sc * 0.72);
      ctx.lineTo(-sc * 0.42, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.ellipse(sc * 0.55, 0, sc * 0.5, sc * 0.16, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // A gull seen from directly above: body along the heading, wings swept back
  // from the shoulders, black tips, fanned tail.
  //
  // The flap is drawn as FORESHORTENING, not as a hinge. From overhead a wing
  // on the downstroke is a shorter wing, not a wing somewhere else, and a bank
  // shortens the two wings by different amounts. Drawing it as a folding V —
  // which is what was here — gives a chevron that scissors open and shut, and
  // at this size that reads as a moth or as a stray mark on the water rather
  // than as a bird.
  drawGull(ctx, g, theme) {
    const night = theme === 'night';
    const alt = g.alt;
    // Smaller than it was. Shot and looked at, the old size put a bird about
    // seven cells across on the water, which at wall scale is a gull with a
    // three-metre wingspan — and being the brightest thing in frame, it read as
    // the subject rather than as background life.
    const sc = (0.52 + alt * 0.22) * S;
    const flap = Math.sin(g.wing) * Math.max(g.flap, 0.06);

    // Shadow: further from the bird the higher it is, so a dive visibly closes
    // the gap. It is the shadow that puts the gull in the air rather than on
    // the water.
    ctx.globalAlpha = night ? 0.10 : 0.16;
    ctx.fillStyle = 'rgba(0,20,40,1)';
    ctx.beginPath();
    ctx.ellipse(g.x + 5.5 * alt * S, g.y + 6.5 * alt * S,
      2.5 * sc, 1.0 * sc, g.a, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.a);
    ctx.scale(sc, sc);

    // Span shortens on the beat; the bank shortens one wing and lengthens the
    // other, which is what makes a turning bird look like it is turning.
    const span = 3.5 - 1.45 * Math.abs(flap);
    const bank = Math.max(-0.9, Math.min(0.9, g.bank));
    // Sweep is a FRACTION of the span, not a fixed offset. As a fixed offset the
    // tips sat almost square to the body and the whole bird came out as a
    // symmetric white cross — which is what an aeroplane looks like from above,
    // and it was duly mistaken for one. A gull's hand is carried well behind its
    // shoulder, and that backward rake is most of what separates the silhouette
    // of a bird from a crucifix.
    const rake = 0.62 + flap * 0.12;

    // Not paper white: a gull's back is pale grey, and pure white here is the
    // brightest thing on the whole beach, which is why they drew the eye.
    const body = night ? 'rgba(180,198,222,0.92)' : 'rgba(238,240,242,0.94)';
    const tip = night ? 'rgba(40,52,74,0.95)' : 'rgba(74,80,92,0.92)';

    const wing = (sgn) => {
      const sp = sgn * span * Math.max(0.22, 1 + sgn * bank * 0.5);
      const tipX = -rake * Math.abs(sp);        // the hand, carried behind
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(0.62, sgn * 0.20);                          // shoulder
      // Leading edge bows forward out of the shoulder and then rakes back to
      // the tip — the shallow S that makes a gull's wing a gull's wing.
      ctx.quadraticCurveTo(0.30, sp * 0.55, tipX, sp);
      ctx.quadraticCurveTo(tipX * 0.55 - 0.35, sp * 0.42, -0.85, sgn * 0.16);
      ctx.closePath();
      ctx.fill();
      // The black hand is the one marking that says gull rather than dove.
      ctx.fillStyle = tip;
      ctx.beginPath();
      ctx.moveTo(tipX, sp);
      ctx.quadraticCurveTo(tipX * 0.80 - 0.10, sp * 0.80, tipX * 0.62 - 0.30, sp * 0.66);
      ctx.quadraticCurveTo(tipX * 0.82 + 0.05, sp * 0.80, tipX, sp);
      ctx.closePath();
      ctx.fill();
    };
    wing(-1);
    wing(1);

    // Tail, fanned and swept — carried well back so the bird has a long axis
    // rather than four arms of equal length.
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-0.80, -0.30);
    ctx.lineTo(-2.30, -0.44);
    ctx.lineTo(-2.55, 0);
    ctx.lineTo(-2.30, 0.44);
    ctx.lineTo(-0.80, 0.30);
    ctx.closePath();
    ctx.fill();

    // body and head
    ctx.beginPath(); ctx.ellipse(0.05, 0, 1.55, 0.40, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(1.55, 0, 0.36, 0, TAU); ctx.fill();
    ctx.fillStyle = night ? '#b8842c' : '#e8a032';
    ctx.beginPath();
    ctx.moveTo(1.84, -0.09); ctx.lineTo(2.50, 0.02); ctx.lineTo(1.84, 0.13);
    ctx.closePath(); ctx.fill();

    ctx.restore();
  }

  drawProp(ctx, p, sim, time) {
    const wetness = Math.min(1, sim.depthAt(p.x, p.y) / 0.3);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = 1 - wetness * 0.35;
    switch (p.kind) {
      case 'umbrella': {
        const r = (6 + p.seed * 2) * S;
        ctx.fillStyle = 'rgba(0,20,40,0.22)';
        ctx.beginPath(); ctx.ellipse(r * 0.35, r * 0.4, r, r * 0.85, 0, 0, TAU); ctx.fill();
        ctx.rotate(p.rot + Math.sin(p.sway * 0.7) * 0.03);
        const cols = p.seed > 0.5 ? ['#ff5566', '#fff8f0'] : ['#2fb8c6', '#fff8f0'];
        for (let k = 0; k < 8; k++) {
          ctx.fillStyle = cols[k % 2];
          ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.arc(0, 0, r, (k * TAU) / 8, ((k + 1) * TAU) / 8); ctx.fill();
        }
        ctx.fillStyle = '#6b4b2a';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, TAU); ctx.fill();
        break;
      }
      case 'palm': {
        const r = (8 + p.seed * 3) * S;
        ctx.fillStyle = 'rgba(0,20,40,0.20)';
        ctx.beginPath(); ctx.ellipse(r * 0.5, r * 0.5, r * 0.9, r * 0.7, 0, 0, TAU); ctx.fill();
        const n = 7;
        for (let k = 0; k < n; k++) {
          const a = p.rot + (k * TAU) / n + Math.sin(p.sway * 1.3 + k) * 0.07;
          ctx.strokeStyle = k % 2 ? '#2f7d4f' : '#3d9a5f';
          ctx.lineWidth = 1.5 * S;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6,
            Math.cos(a + 0.35) * r, Math.sin(a + 0.35) * r);
          ctx.stroke();
        }
        ctx.fillStyle = '#6f4a2c';
        ctx.beginPath(); ctx.arc(0, 0, 1.7 * S, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8a5c33';
        for (let k = 0; k < 3; k++) {
          const a = p.seed * 6 + k * 2.1;
          ctx.beginPath(); ctx.arc(Math.cos(a) * 2.6 * S, Math.sin(a) * 2.6 * S, 0.85 * S, 0, TAU); ctx.fill();
        }
        break;
      }
      case 'towel': {
        ctx.rotate(p.rot);
        const w = 9 * S, h = 5.5 * S;
        ctx.fillStyle = 'rgba(0,20,40,0.16)';
        ctx.fillRect(-w / 2 + 0.6, -h / 2 + 0.6, w, h);
        const a = p.seed > 0.5 ? '#ff8fa3' : '#7ec8e3';
        ctx.fillStyle = a;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        for (let k = 0; k < 4; k++) ctx.fillRect(-w / 2 + 1 + k * 2.1, -h / 2, 0.9, h);
        break;
      }
      case 'chair': {
        ctx.rotate(p.rot);
        ctx.fillStyle = 'rgba(0,20,40,0.18)';
        ctx.fillRect(-2.4 * S, -3.4 * S, 5.6 * S, 7 * S);
        ctx.fillStyle = '#f3e6c8';
        ctx.fillRect(-3 * S, -4 * S, 6 * S, 7.2 * S);
        ctx.fillStyle = '#3f7fbf';
        ctx.fillRect(-2.2 * S, -3.2 * S, 4.4 * S, 3 * S);
        ctx.fillStyle = '#e0d2b0';
        ctx.fillRect(-2.2 * S, 0.4 * S, 4.4 * S, 2.4 * S);
        break;
      }
      default: { // sandcastle
        const d = p.decay === undefined ? 1 : Math.max(0, p.decay);
        const r = (4.5 + p.seed * 1.5) * (0.5 + 0.5 * d) * S;
        ctx.fillStyle = 'rgba(0,20,40,0.18)';
        ctx.beginPath(); ctx.ellipse(r * 0.4, r * 0.4, r, r * 0.8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#dcc08a';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.fillStyle = '#efdcae';
        for (let k = 0; k < 4; k++) {
          const a = p.rot + (k * TAU) / 4;
          ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.34, 0, TAU); ctx.fill();
        }
        ctx.strokeStyle = '#b9986a';
        ctx.lineWidth = 0.4 * S;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.stroke();
        if (d > 0.55) {
          ctx.strokeStyle = '#e9563f'; ctx.lineWidth = 0.4 * S;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r * 1.5); ctx.stroke();
          ctx.fillStyle = '#e9563f';
          ctx.beginPath(); ctx.moveTo(0, -r * 1.5); ctx.lineTo(r * 0.9, -r * 1.25);
          ctx.lineTo(0, -r * 1.0); ctx.fill();
        }
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
