/* The per-pixel blend.
 *
 * Given a leaf's (x, y) in the grid, produce the image of that leaf by
 * bilinearly blending the four surrounding cells, pixel by pixel, in leaf
 * space. This is the step the whole phase exists for: between the generated
 * cells, every pixel is interpolated, so a vein that is still green while the
 * blade has turned stays green through the transition instead of being
 * averaged away.
 *
 * Two things are not negotiable here:
 *
 *   Blend in linear light. Gamma-encoded values darken at the midpoint, and
 *   the midpoint of yellow -> red is exactly the transition the project is
 *   about. sRGB in, linear to blend, sRGB out, via lookup tables.
 *
 *   Cache on quantised (x, y). Recompositing per leaf per frame is pointless
 *   even at this scale, and the caching pattern is what makes the tree step
 *   possible later. Entries are evicted least-recently-used.
 *
 * Alpha is not blended: Step 2 established that the grid shares one silhouette
 * (see leafspace.js), so it is composited in whole from _alpha.png.
 *
 *   <script src="../model.js"></script>
 *   <script src="grid.js"></script>
 *   <script src="leafspace.js"></script>
 *   <script src="interpolate.js"></script>
 *
 *   LeafInterp.load({ species: 'bigtoothMaple' }).then(function (gi) {
 *     var canvas = gi.forLeaf(leaf);           // a model leaf, straight in
 *     gi.draw(ctx, canvas, x, y, width, rot);  // Step 4
 *   });
 */
/*
 * The global is published UNCONDITIONALLY, and module.exports as well.
 *
 * This used to be an either/or -- CommonJS if `module` was around, the global
 * otherwise -- and on the wall that silently picked the wrong one. The shell
 * the kiosk runs the page in leaves a `module` object in the page's global
 * scope, so the CommonJS branch won and the window global was never set, which
 * index.html then reports as a script that "did not load" even though it had
 * loaded and run perfectly. In a plain browser there is no `module` and it
 * worked, which is why it only ever failed on the wall. Same fix, same reason,
 * as the one written out at length in model.js.
 *
 * `root` resolves through globalThis first so it is always a real object --
 * under `self` alone it would have been `this`, which is undefined in an ES
 * module and would throw here now that root is always dereferenced.
 */
(function (root, factory) {
  var api = factory(root);
  root.LeafInterp = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis
   : typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  /* Compositing resolution. Leaf space is 1024 (leafspace.js) and stays the
   * source of truth, but blending at 1024 means 3.1M pixel-blends per cache
   * miss, which stalls a frame for no visible gain at the size a leaf is drawn.
   *
   * 512 covers a ~300px leaf on a 2x display without upscaling, which is the
   * case that actually shows: at 384 a retina panel was resampling the
   * composite back up. Cost is quadratic in both time and memory. Raise it
   * for a close-up, lower it if a later step needs many more leaves at once. */
  var WORK_PX = 512;

  /* Sub-steps per cell interval when quantising (x, y) for the cache. Six
   * across a cell keeps the key space small enough that a season replays
   * mostly out of cache, and at four leaves on screen the steps read as one
   * ramp. Blown up to a single leaf filling the stage they do not — pass
   * `substeps` to load() for that case; the cost is a proportionally larger
   * key space, so raise `cacheMax` with it. */
  var SUBSTEPS = 6;

  /* Composited canvases held before the least recently used is dropped. At
   * WORK_PX = 512 each is ~1 MB, so 48 is ~50 MB. */
  var CACHE_MAX = 48;

  /* sRGB <-> linear, as tables. The forward direction is indexed by byte; the
   * inverse is quantised to 4096 steps, which is finer than 8-bit output can
   * express, so it costs nothing in accuracy and replaces a pow() per channel
   * per pixel. */
  var SRGB2LIN = new Float32Array(256);
  for (var i = 0; i < 256; i++) {
    var c = i / 255;
    SRGB2LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  var LIN_STEPS = 4096;
  var LIN2SRGB = new Uint8Array(LIN_STEPS);
  for (var j = 0; j < LIN_STEPS; j++) {
    var v = j / (LIN_STEPS - 1);
    v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    LIN2SRGB[j] = Math.max(0, Math.min(255, Math.round(v * 255)));
  }

  function load(opts) {
    opts = opts || {};
    var species = opts.species || 'bigtoothMaple';
    var px = opts.px || WORK_PX;
    var substeps = opts.substeps || SUBSTEPS;
    var cacheMax = opts.cacheMax || CACHE_MAX;
    var dir = opts.dir || ('cells/' + species + '/');
    var onProgress = opts.onProgress || function () {};

    var G = root.LeafGrid, LS = root.LeafSpace;
    if (!G || !LS) throw new Error('interpolate: needs grid.js and leafspace.js');

    var rows = G.rowsOf(species), cols = G.COLS;

    /* Column 0 is one file shared down the column — y is undefined on a fully
     * green leaf — so it is fetched once and aliased into every row. */
    var jobs = [];
    for (var col = 0; col < cols; col++) {
      for (var row = 0; row < rows; row++) {
        if (col === 0 && row > 0) continue;
        jobs.push({ col: col, row: row, url: dir + G.cellName(col, row) + '.png' });
      }
    }

    var done = 0;
    var total = jobs.length + 1;                      // + the shared alpha
    function tick() { onProgress(++done, total); }

    return Promise.all([
      loadAlpha(dir + '_alpha.png', px).then(function (a) { tick(); return a; }),
      Promise.all(jobs.map(function (job) {
        return LS.loadCell(job.url, px).then(function (cell) {
          tick();
          /* Alpha is dropped: the shared silhouette replaces it. Keeping only
           * RGB is also a quarter less memory across 43 cells. */
          var n = px * px, rgb = new Uint8Array(n * 3), d = cell.data;
          for (var k = 0; k < n; k++) {
            rgb[k * 3] = d[k * 4]; rgb[k * 3 + 1] = d[k * 4 + 1]; rgb[k * 3 + 2] = d[k * 4 + 2];
          }
          job.rgb = rgb;
          job.aspect = cell.aspect;
          return job;
        });
      }))
    ]).then(function (res) {
      var alpha = res[0], loaded = res[1];

      var byName = {};
      loaded.forEach(function (c) { byName[c.col + ',' + c.row] = c; });
      /* Alias the shared green down column 0. */
      for (var r = 1; r < rows; r++) byName['0,' + r] = byName['0,0'];

      var aspect = loaded.reduce(function (s, c) { return s + c.aspect; }, 0) / loaded.length;

      return makeInterp({
        species: species, px: px, cols: cols, rows: rows,
        substeps: substeps, cacheMax: cacheMax,
        cell: byName, alpha: alpha, aspect: aspect, G: G
      });
    });
  }

  function loadAlpha(url, px) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = function () {
        reject(new Error('interpolate: cannot load ' + url +
                         ' — run tools/leafspace-build.js --write, and serve over http'));
      };
      img.onload = function () {
        var cv = document.createElement('canvas');
        cv.width = px; cv.height = px;
        var ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, px, px);
        var d = ctx.getImageData(0, 0, px, px).data;
        var a = new Uint8Array(px * px);
        for (var k = 0; k < a.length; k++) a[k] = d[k * 4 + 3];
        resolve(a);
      };
      img.src = url;
    });
  }

  function makeInterp(S) {
    var px = S.px, n = px * px;
    var cache = new Map();                   // Map preserves insertion order: LRU for free
    var stats = { hits: 0, misses: 0, lastMs: 0 };

    /* Where a leaf sits, in continuous cell coordinates. */
    function coordsOf(leaf) {
      return S.G.cellCoords(S.species, S.G.axesOf(leaf));
    }

    /* The composite for a point in the grid. cx, cy are continuous cell
     * coordinates, not (x, y) in [0,1] — cellCoords has already applied the
     * species' y ceiling, which is the thing it would be easy to forget. */
    function atCell(cx, cy) {
      var qx = Math.round(cx * S.substeps) / S.substeps;
      var qy = Math.round(cy * S.substeps) / S.substeps;
      var key = qx + '|' + qy;

      var hit = cache.get(key);
      if (hit) {
        cache.delete(key); cache.set(key, hit);      // refresh recency
        stats.hits++;
        return hit;
      }
      stats.misses++;

      var t0 = (root.performance || Date).now();
      var canvas = composite(qx, qy);
      stats.lastMs = (root.performance || Date).now() - t0;

      cache.set(key, canvas);
      if (cache.size > S.cacheMax) cache.delete(cache.keys().next().value);
      return canvas;
    }

    function composite(cx, cy) {
      var c0 = Math.floor(cx), r0 = Math.floor(cy);
      if (c0 >= S.cols - 1) c0 = S.cols - 2;
      if (c0 < 0) c0 = 0;
      if (r0 >= S.rows - 1) r0 = S.rows - 2;
      if (r0 < 0) r0 = 0;
      var fx = cx - c0, fy = cy - r0;
      if (fx < 0) fx = 0; else if (fx > 1) fx = 1;
      if (fy < 0) fy = 0; else if (fy > 1) fy = 1;

      var q = [
        [S.cell[c0 + ',' + r0].rgb,         (1 - fx) * (1 - fy)],
        [S.cell[(c0 + 1) + ',' + r0].rgb,   fx * (1 - fy)],
        [S.cell[c0 + ',' + (r0 + 1)].rgb,   (1 - fx) * fy],
        [S.cell[(c0 + 1) + ',' + (r0 + 1)].rgb, fx * fy]
      ];

      var out = new Uint8ClampedArray(n * 4);
      var alpha = S.alpha;
      var lastMax = LIN_STEPS - 1;

      /* Four weighted lookups per channel. Weights that round to zero are
       * skipped, which is most of the work on an exact grid line. */
      var use = [];
      for (var k = 0; k < 4; k++) if (q[k][1] > 1e-6) use.push(q[k]);

      for (var p = 0; p < n; p++) {
        var i3 = p * 3, R = 0, Gc = 0, B = 0;
        for (var u = 0; u < use.length; u++) {
          var src = use[u][0], w = use[u][1];
          R += SRGB2LIN[src[i3]] * w;
          Gc += SRGB2LIN[src[i3 + 1]] * w;
          B += SRGB2LIN[src[i3 + 2]] * w;
        }
        var o = p * 4;
        var ri = R * lastMax | 0, gi = Gc * lastMax | 0, bi = B * lastMax | 0;
        out[o] = LIN2SRGB[ri > lastMax ? lastMax : ri];
        out[o + 1] = LIN2SRGB[gi > lastMax ? lastMax : gi];
        out[o + 2] = LIN2SRGB[bi > lastMax ? lastMax : bi];
        out[o + 3] = alpha[p];
      }

      var cv = document.createElement('canvas');
      cv.width = px; cv.height = px;
      cv.getContext('2d').putImageData(new ImageData(out, px, px), 0, 0);
      return cv;
    }

    /* The shared silhouette filled with one flat colour — what the renderer
     * did before this phase, drawn through the same mask so a comparison is
     * only ever about colour, never about shape. Cached by colour string. */
    var flatCache = new Map();
    function flat(css) {
      var got = flatCache.get(css);
      if (got) return got;
      var cv = document.createElement('canvas');
      cv.width = px; cv.height = px;
      var ctx = cv.getContext('2d');
      var img = new ImageData(px, px), d = img.data;
      for (var p = 0; p < n; p++) d[p * 4 + 3] = S.alpha[p];
      ctx.putImageData(img, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, px, px);
      if (flatCache.size > 64) flatCache.delete(flatCache.keys().next().value);
      flatCache.set(css, cv);
      return cv;
    }

    return {
      species: S.species,
      px: px,
      substeps: S.substeps,
      cacheMax: S.cacheMax,
      aspect: S.aspect,
      stats: stats,
      flat: flat,
      cacheSize: function () { return cache.size; },
      coordsOf: coordsOf,
      atCell: atCell,
      /* Convenience: straight from a model leaf. */
      forLeaf: function (leaf) { var c = coordsOf(leaf); return atCell(c.cx, c.cy); },
      /* Step 4's draw. The composite is square because leaf space is square;
       * the real proportion was measured in Step 2 and is restored here, which
       * is the whole reason aspect was kept rather than discarded.
       *
       * w is the drawn width; height follows from aspect. rot in radians. */
      draw: function (ctx, canvas, cx, cy, w, rot) {
        var h = w / S.aspect;
        if (!rot) {
          ctx.drawImage(canvas, cx - w / 2, cy - h / 2, w, h);
          return;
        }
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.drawImage(canvas, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    };
  }

  return { load: load, WORK_PX: WORK_PX, SUBSTEPS: SUBSTEPS, CACHE_MAX: CACHE_MAX };
});
