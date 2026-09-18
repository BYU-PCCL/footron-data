/**
 * An orthographic globe, drawn in 2D canvas.
 *
 * There is no three.js here on purpose. The only thing this piece needs from a
 * globe is "a sphere seen from outside, with land on it and a glowing point
 * where the temple is", and an orthographic projection gives exactly that in
 * about a page of trigonometry — with no WebGL context to lose, no shader
 * compile on a cold machine, and no second renderer fighting the DOM
 * compositor that the photographs are already using.
 *
 * It sits in the corner over the photographs, turning to each temple's real
 * coordinates as the slide changes.
 */

const RAD = Math.PI / 180;

/* How far past the limb the atmosphere glow reaches, as a multiple of the
 * globe's radius. The disc is sized so this still fits inside the canvas. */
const HALO = 1.11;

/* Orthographic projection about a view centre. Returns unit-sphere coordinates
 * (-1..1) plus the cosine of the angular distance from the centre, which is
 * negative exactly when the point is on the far side of the world. */
function project(lat, lon, viewLat, viewLon) {
  const p = lat * RAD, l = lon * RAD;
  const p0 = viewLat * RAD, l0 = viewLon * RAD;
  const cp = Math.cos(p), sp = Math.sin(p);
  const cp0 = Math.cos(p0), sp0 = Math.sin(p0);
  const dl = l - l0, cdl = Math.cos(dl);
  return {
    x: cp * Math.sin(dl),
    y: cp0 * sp - sp0 * cp * cdl,
    c: sp0 * sp + cp0 * cp * cdl,
  };
}

/* Where the sun is directly overhead, right now. Declination from the standard
 * cosine approximation, and longitude straight from UTC — the equation of time
 * would move the terminator by up to a quarter of a degree, which is invisible
 * at this size. It is worth doing at all because it means the globe on the wall
 * is lit the way the world outside the building is lit. */
function subsolar(date = new Date()) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 864e5;
  const dec = -23.44 * Math.cos((360 / 365.24) * (day + 10) * RAD);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return { lat: dec, lon: -15 * (utcHours - 12) };
}

/* Shortest signed angular difference, so a flight from Tokyo to Salt Lake
 * crosses the Pacific instead of unwinding the long way round the planet. */
function shortLon(from, to) {
  let d = ((to - from + 540) % 360) - 180;
  return from + d;
}

/* Is this ring wound counter-clockwise around the land it encloses, as seen
 * from outside the sphere?
 *
 * A flat shoelace over the lon/lat pairs answers this for most rings and gets
 * Antarctica exactly backwards, because lon/lat is singular at the poles: a
 * ring that encircles a pole is not a closed curve on the plane in any useful
 * sense, and the planar area it reports belongs to a region that does not
 * exist. Antarctica then fills the entire globe instead of the bottom of it.
 *
 * So measure the signed area on the sphere instead. This sums each edge's
 * contribution as its longitude sweep weighted by the latitudes it spans, which
 * stays meaningful across a pole, and yields the area lying to the left of the
 * direction of travel. Land masses are all far smaller than a hemisphere, so
 * whichever side comes out under 2pi steradians is the land.
 */
function ringIsCCW(ring) {
  const TAU = Math.PI * 2;
  let s = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [lon1, lat1] = ring[i], [lon2, lat2] = ring[(i + 1) % n];
    let dl = (lon2 - lon1) * RAD;
    if (dl > Math.PI) dl -= TAU;
    if (dl < -Math.PI) dl += TAU;
    s += dl * (2 + Math.sin(lat1 * RAD) + Math.sin(lat2 * RAD));
  }
  s = -s / 2;                       // positive is counter-clockwise
  const left = s < 0 ? s + 2 * TAU : s;   // area to the left, in [0, 4pi)
  return left < TAU;                // the smaller side is the land
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Globe {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Array<Array<[number,number]>>} land  simplified rings, lon/lat
   * @param {object} opts
   */
  constructor(canvas, land, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    // Each ring carries its own winding, measured once from the source lon/lat
    // geometry. It cannot be recovered after clipping — a continent reduced to
    // a sliver at the limb has a chord-closed area whose sign says nothing
    // about the ring it came from — and it is not a constant either: this
    // Natural Earth extract follows the shapefile convention, so 66 of its 67
    // rings are clockwise and one is not.
    this.land = land.map((pts) => ({ pts, ccw: ringIsCCW(pts) }));
    this.o = Object.assign({
      fill: 0.78,        // disc radius as a fraction of the shorter side
      ocean: true,
      graticule: true,
      pins: [],          // [{lat, lon}] — every temple, drawn faintly
      glow: "#caa478",
    }, opts);

    this.view = { lat: 20, lon: -40 };
    this.flight = null;
    this.spin = 0.0;     // degrees/second of idle drift
    this.focus = null;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
    this.cx = w / 2; this.cy = h / 2;
    // The atmosphere is drawn out to HALO x R, so a `fill` close to 1 would
    // push the glow past the edge of the canvas and the browser would clip it
    // to four hard straight edges around the globe. Cap the radius so the
    // halo always fits, whatever fill was asked for.
    const half = Math.min(w, h) / 2;
    this.R = Math.min(half * this.o.fill, half / HALO);
  }

  /** Begin a camera move. Resolves nothing; `flight` is consumed by draw(). */
  flyTo(lat, lon, ms = 3200) {
    const from = { ...this.view };
    this.flight = {
      from, to: { lat, lon: shortLon(from.lon, lon) },
      start: performance.now(), ms,
    };
    this.focus = { lat, lon };
  }

  get flying() { return !!this.flight; }

  draw(now) {
    const ctx = this.ctx;

    if (this.flight) {
      const k = Math.min(1, (now - this.flight.start) / this.flight.ms);
      const e = easeInOut(k);
      this.view.lat = this.flight.from.lat + (this.flight.to.lat - this.flight.from.lat) * e;
      this.view.lon = this.flight.from.lon + (this.flight.to.lon - this.flight.from.lon) * e;
      if (k >= 1) this.flight = null;
    } else if (this.spin) {
      this.view.lon += this.spin * (1 / 60);
    }

    ctx.clearRect(0, 0, this.w, this.h);
    const { cx, cy, R } = this;

    // --- the sphere itself ----------------------------------------------
    if (this.o.ocean) {
      // Offsetting the highlight up and left gives the disc a readable
      // curvature; a flat fill reads as a circle, not a ball.
      const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
      g.addColorStop(0, "rgba(46,60,84,0.95)");
      g.addColorStop(0.55, "rgba(22,29,44,0.95)");
      g.addColorStop(1, "rgba(10,13,22,0.98)");
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = g; ctx.fill();
    }

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();

    // --- graticule -------------------------------------------------------
    if (this.o.graticule) {
      ctx.strokeStyle = "rgba(150,180,220,0.13)";
      ctx.lineWidth = 1;
      for (let lon = -180; lon < 180; lon += 30) this._meridian(lon);
      for (let lat = -60; lat <= 60; lat += 30) this._parallel(lat);
    }

    // --- land ------------------------------------------------------------
    // Land has to stay readable through the night-side gradient that is drawn
    // over it a few lines below, so it is lifted well clear of the ocean.
    ctx.fillStyle = "rgba(150,172,202,0.58)";
    ctx.strokeStyle = "rgba(196,218,246,0.55)";
    ctx.lineWidth = 1;
    for (const ring of this.land) this._ring(ring.pts, ring.ccw);

    // --- night side ------------------------------------------------------
    // A radial gradient centred on the sub-solar point. Where the sun is on the
    // far side we centre on its antipode and darken outward from the rim
    // instead, which keeps the terminator continuous as the globe turns.
    const s = subsolar();
    const sp = project(s.lat, s.lon, this.view.lat, this.view.lon);
    const behind = sp.c < 0;
    const sx = cx + (behind ? -sp.x : sp.x) * R;
    const sy = cy - (behind ? -sp.y : sp.y) * R;
    const ng = ctx.createRadialGradient(sx, sy, R * 0.15, sx, sy, R * 1.9);
    ng.addColorStop(0, behind ? "rgba(4,6,12,0.72)" : "rgba(4,6,12,0)");
    ng.addColorStop(0.5, "rgba(4,6,12,0.34)");
    ng.addColorStop(1, behind ? "rgba(4,6,12,0)" : "rgba(4,6,12,0.80)");
    ctx.fillStyle = ng;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    // --- every other temple, faintly -------------------------------------
    if (this.o.pins.length) {
      ctx.fillStyle = "rgba(226,204,170,0.45)";
      for (const p of this.o.pins) {
        const q = project(p.lat, p.lon, this.view.lat, this.view.lon);
        if (q.c < 0.02) continue;
        ctx.globalAlpha = Math.min(1, q.c * 1.6) * 0.55;
        ctx.beginPath();
        ctx.arc(cx + q.x * R, cy - q.y * R, Math.max(0.8, R * 0.0055), 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // --- the temple we are looking at -------------------------------------
    if (this.focus) this._focus(this.focus, now);

    ctx.restore();

    // --- limb -------------------------------------------------------------
    // Drawn outside the clip so the stroke is not halved by its own edge.
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7);
    ctx.strokeStyle = "rgba(150,185,230,0.30)"; ctx.lineWidth = 1.2; ctx.stroke();

    // A thin atmosphere. Cheap, and it is what stops the globe reading as a
    // sticker pasted on the background.
    const a = ctx.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * HALO);
    a.addColorStop(0, "rgba(120,170,235,0.20)");
    a.addColorStop(1, "rgba(120,170,235,0)");
    ctx.beginPath(); ctx.arc(cx, cy, R * HALO, 0, 7); ctx.fillStyle = a; ctx.fill();
  }

  // ---------------------------------------------------------------- helpers

  /* Draw one land ring, clipped to the visible hemisphere.
   *
   * The naive version — drop the vertices with c < 0 and start a new subpath
   * when the ring comes back into view — looks right until you fill it.
   * `fill()` closes every subpath with a *straight* chord from its last point
   * to its first, so a continent that leaves the visible hemisphere and
   * returns gets a line drawn across the middle of the globe. For Afro-Eurasia,
   * which spans half the planet, that chord is a hard diagonal across the whole
   * disc.
   *
   * So clip against the horizon plane instead of filtering points. (x, y, c)
   * from project() is already the vertex as a unit vector rotated so that +c
   * faces the camera, which makes the horizon exactly the plane c = 0 and the
   * disc exactly the unit circle — an edge that changes the sign of c can be
   * split at c = 0, and that split point, renormalised, lands on the limb.
   * Where the ring went behind the globe we then walk along the limb between
   * the exit and re-entry points rather than cutting across.
   *
   * Which way round the limb to walk needs no guessing about where the hidden
   * part of the ring went. The visible region is the intersection of two
   * regions — the polygon and the disc — and the boundary of an intersection is
   * each region's own boundary traversed in the same rotational sense, so that
   * the interior stays on the same side of both. So a limb arc simply sweeps
   * the way its ring winds, and the winding is a property of the ring, measured
   * once at load from the source geometry.
   */
  _ring(ring, ccw) {
    const ctx = this.ctx, { cx, cy, R } = this;
    const N = ring.length;
    if (N < 3) return;

    const v = new Array(N);
    let front = 0, start = -1;
    for (let i = 0; i < N; i++) {
      v[i] = project(ring[i][1], ring[i][0], this.view.lat, this.view.lon);
      if (v[i].c >= 0) { front++; if (start < 0) start = i; }
    }
    if (front === 0) return;                      // entirely round the back

    const X = (p) => cx + p.x * R;
    const Y = (p) => cy - p.y * R;

    // Wholly visible: nothing to clip, and the common case for small islands.
    if (front === N) {
      ctx.beginPath();
      ctx.moveTo(X(v[0]), Y(v[0]));
      for (let i = 1; i < N; i++) ctx.lineTo(X(v[i]), Y(v[i]));
      ctx.closePath(); ctx.fill(); ctx.stroke();
      return;
    }

    // Canvas angle of a projected point. Canvas y points down, so the sign of
    // y flips relative to the projection.
    const ang = (x, y) => Math.atan2(-y, x);
    // Walk the ring once, cutting it into runs of visible vertices separated by
    // crossings. Starting at a vertex that immediately follows a crossing back
    // into view means every run is a complete entry-to-exit span.
    let s0 = -1;
    for (let i = 0; i < N; i++) {
      if (v[i].c >= 0 && v[(i - 1 + N) % N].c < 0) { s0 = i; break; }
    }
    if (s0 < 0) return;

    const cut = (a, b) => {
      // Split the edge where c crosses zero, then renormalise so the point sits
      // exactly on the limb rather than fractionally inside it.
      const t = a.c / (a.c - b.c);
      let x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      const m = Math.hypot(x, y) || 1;
      return { x: x / m, y: y / m };
    };

    const runs = [];        // visible spans, each from its entry point to its exit
    const cross = [];       // {x, y, ang, exit, run}
    const exitOfRun = [];
    let run = [];

    for (let k = 0; k < N; k++) {
      const i = (s0 + k) % N, a = v[i], b = v[(i + 1) % N];
      const af = a.c >= 0, bf = b.c >= 0;
      if (af) run.push(a);
      if (af === bf) continue;

      const p = cut(a, b);
      p.ang = ang(p.x, p.y);
      if (af) {
        run.push(p);
        p.exit = true; p.run = runs.length;
        exitOfRun[runs.length] = cross.length;
        runs.push(run);
        run = [];
      } else {
        p.exit = false; p.run = runs.length;
        run = [p];
      }
      cross.push(p);
    }
    // The loop began mid-region, so the span left open at the end is the front
    // of the very first run.
    if (run.length) {
      cross[cross.length - 1].run = 0;
      runs[0] = run.concat(runs[0]);
    }
    if (!cross.length || !runs.length) return;

    // An exit joins the entry that is adjacent to it *along the limb*, which is
    // not generally the next entry in ring order. Antarctica seen from West
    // Africa is the case that proves it: the peninsula and the main body are two
    // separate visible pieces, four crossings in all, and pairing them in ring
    // order connects each exit to the far piece's entry — turning a 3-degree arc
    // into a 353-degree one that floods the globe with land.
    const order = cross.map((_, i) => i).sort((i, j) => cross[i].ang - cross[j].ang);
    const at = new Map(order.map((ci, k) => [ci, k]));
    const M = order.length;
    // ctx.arc sweeps toward increasing canvas angle unless told otherwise, so
    // the crossing it reaches next is the neighbour in that direction.
    const dir = ccw ? -1 : 1;

    const done = new Set();
    for (const seed of cross.keys()) {
      if (!cross[seed].exit || done.has(seed)) continue;

      ctx.beginPath();
      ctx.moveTo(X(cross[seed]), Y(cross[seed]));
      let cur = seed;
      do {
        done.add(cur);
        const entry = cross[order[(at.get(cur) + dir + M) % M]];
        ctx.arc(cx, cy, R, cross[cur].ang, entry.ang, ccw);
        for (const q of runs[entry.run]) ctx.lineTo(X(q), Y(q));
        cur = exitOfRun[entry.run];
      } while (cur !== undefined && cur !== seed && !done.has(cur));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  _meridian(lon) {
    const ctx = this.ctx, { cx, cy, R } = this;
    let open = false; ctx.beginPath();
    for (let lat = -90; lat <= 90; lat += 3) {
      const p = project(lat, lon, this.view.lat, this.view.lon);
      if (p.c < 0) { open = false; continue; }
      const x = cx + p.x * R, y = cy - p.y * R;
      open ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), open = true);
    }
    ctx.stroke();
  }

  _parallel(lat) {
    const ctx = this.ctx, { cx, cy, R } = this;
    let open = false; ctx.beginPath();
    for (let lon = -180; lon <= 180; lon += 3) {
      const p = project(lat, lon, this.view.lat, this.view.lon);
      if (p.c < 0) { open = false; continue; }
      const x = cx + p.x * R, y = cy - p.y * R;
      open ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), open = true);
    }
    ctx.stroke();
  }

  /* The lit point, with two rings that breathe out of it on a slow cycle. */
  _focus(f, now) {
    const ctx = this.ctx, { cx, cy, R } = this;
    const p = project(f.lat, f.lon, this.view.lat, this.view.lon);
    if (p.c < 0) return;
    const x = cx + p.x * R, y = cy - p.y * R;

    for (let i = 0; i < 2; i++) {
      const t = ((now / 2600) + i * 0.5) % 1;
      ctx.beginPath();
      ctx.arc(x, y, R * (0.012 + 0.10 * t), 0, 7);
      ctx.strokeStyle = this.o.glow;
      ctx.globalAlpha = 0.5 * (1 - t) * Math.min(1, p.c * 2);
      ctx.lineWidth = Math.max(1, R * 0.004);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.arc(x, y, Math.max(2, R * 0.013), 0, 7);
    ctx.fillStyle = this.o.glow;
    ctx.shadowColor = this.o.glow;
    ctx.shadowBlur = R * 0.12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export { subsolar };
