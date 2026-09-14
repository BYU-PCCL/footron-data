/* Leaf space.
 *
 * Step 3 blends four cells per output pixel. That is only meaningful if the
 * same (u,v) picks the same anatomical point out of every cell, and the raw
 * files do not give you that for free: they arrive at two different
 * resolutions (583x555 and ~1024x970) with silhouettes that agree closely but
 * not exactly. This module defines the common space and the operations that
 * put a cell into it.
 *
 *   leaf space = the cell's alpha bounding box, resampled to LEAF_PX square.
 *
 * Three consequences worth stating, because each is a decision:
 *
 * 1. The bounding box, not the image frame. The frame is incidental — it is
 *    whatever the generator emitted. The alpha bbox is the leaf.
 *
 * 2. Squashed to a square, not letterboxed. Cell aspect ratios span
 *    1.046-1.075; normalising them away is what makes (u,v) line up. The true
 *    proportion is not lost, it moves into ASPECT, and Step 4 restores it in
 *    the destination rectangle it is already computing.
 *
 * 3. One alpha for the whole grid, not one per cell. Every cell is meant to be
 *    the same leaf, so per-cell silhouette differences are generator noise. If
 *    they are blended, the disagreement band at the lobe tips composites
 *    opaque against transparent and leaves a grey fringe. Sharing a single
 *    consensus alpha removes the artefact by construction, and means Step 3
 *    blends three channels instead of four. Colour must then be defined
 *    slightly outside each cell's own mask — see fillOutward.
 *
 * <script src="leafspace.js"></script>   // then window.LeafSpace
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
  var api = factory();
  root.LeafSpace = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis
   : typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Resolution of leaf space. Leaves draw around 64px in the scene, so this is
   * far more than the renderer needs; it is sized for inspection and for a
   * close-up, and Step 3's cache is what keeps the cost off the frame. */
  var LEAF_PX = 1024;

  /* Alpha above this counts as leaf when measuring the bounding box and the
   * registration masks. Mid-grey is the obvious cut and the images are clean
   * enough that nothing is near it. */
  var ALPHA_CUT = 128;

  /* A pixel is in the shared silhouette if this fraction of cells call it
   * leaf. 0.5 is a per-pixel majority vote. */
  var CONSENSUS = 0.5;

  /* Alpha at or above which a pixel's COLOUR can be trusted — a much higher
   * bar than ALPHA_CUT, and for a different question.
   *
   * ALPHA_CUT asks "is this leaf?", which a half-covered edge pixel honestly
   * is. This asks "is this pixel's RGB the leaf's actual colour?", and on a
   * partly transparent pixel it is not: these cells carry a pale fringe in
   * their antialiased edge (measured mean brightness 152 against 127 in the
   * blade), and canvas hands back unpremultiplied values there, which
   * amplifies whatever error is present as alpha falls.
   *
   * That colour is harmless while it is drawn at the alpha it came with. It
   * stops being harmless the moment the grid shares one silhouette, because
   * the shared alpha can call a pixel opaque that this cell had half-covered
   * — and then the fringe is composited at full strength. It reads as a pale
   * halo around every leaf. So fillOutward replaces colour across the whole
   * ramp, not just outside the mask. */
  var COLOUR_TRUST = 250;

  /* Registration floor. A cell whose mask agrees with the consensus by less
   * IoU than this is rejected: it is no longer the same leaf, and blending it
   * would ghost. The maple grid measures 0.945-0.984, so this sits a little
   * over a point below the worst current cell: loose enough that ordinary
   * generator noise does not trip it, tight enough to catch a regeneration
   * that has actually moved a lobe. Raise it if a future grid is cleaner. */
  var MIN_IOU = 0.93;

  /* ---- bounding box ----------------------------------------------------- */
  function alphaBounds(img, cut) {
    cut = cut == null ? ALPHA_CUT : cut;
    var w = img.width, h = img.height, d = img.data;
    var x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > cut) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) throw new Error('leafspace: image is fully transparent');
    return { x0: x0, y0: y0, x1: x1 + 1, y1: y1 + 1, w: x1 + 1 - x0, h: y1 + 1 - y0 };
  }

  /* ---- resample into leaf space ----------------------------------------- */
  /* Separable triangle filter. Downsamples the ~1024px cells and upsamples the
   * 583px ones with the same code path, so no cell is treated specially.
   * Colour is premultiplied across the filter and divided back out after: on a
   * cutout, filtering straight RGB pulls the transparent pixels' colour into
   * the edge and darkens the margin. */
  function resample(img, bounds, n) {
    n = n || LEAF_PX;
    var wx = weights(bounds.w, n), wy = weights(bounds.h, n);
    var src = img.data, sw = img.width;

    /* pass 1: horizontal, into a float buffer n wide by bounds.h tall */
    var tmp = new Float32Array(n * bounds.h * 4);
    for (var y = 0; y < bounds.h; y++) {
      var srow = (bounds.y0 + y) * sw;
      var trow = y * n * 4;
      for (var ox = 0; ox < n; ox++) {
        var wgt = wx[ox], r = 0, g = 0, b = 0, a = 0;
        for (var k = 0; k < wgt.i.length; k++) {
          var s = (srow + bounds.x0 + wgt.i[k]) * 4, f = wgt.w[k];
          var pa = src[s + 3] / 255 * f;
          r += src[s] * pa; g += src[s + 1] * pa; b += src[s + 2] * pa; a += pa;
        }
        var t = trow + ox * 4;
        tmp[t] = r; tmp[t + 1] = g; tmp[t + 2] = b; tmp[t + 3] = a;
      }
    }

    /* pass 2: vertical, unpremultiplying on the way out */
    var out = new Uint8ClampedArray(n * n * 4);
    for (var oy = 0; oy < n; oy++) {
      var wgty = wy[oy];
      for (var x = 0; x < n; x++) {
        var R = 0, G = 0, B = 0, A = 0;
        for (var j = 0; j < wgty.i.length; j++) {
          var p = (wgty.i[j] * n + x) * 4, fy = wgty.w[j];
          R += tmp[p] * fy; G += tmp[p + 1] * fy; B += tmp[p + 2] * fy; A += tmp[p + 3] * fy;
        }
        var o = (oy * n + x) * 4;
        if (A > 1e-6) { out[o] = R / A; out[o + 1] = G / A; out[o + 2] = B / A; }
        out[o + 3] = A * 255;
      }
    }
    return { width: n, height: n, data: out };
  }

  /* Filter taps for one axis, precomputed once per axis rather than per pixel.
   * Radius follows the scale so downsampling averages the whole footprint and
   * upsampling stays a plain triangle. */
  function weights(srcLen, dstLen) {
    var scale = srcLen / dstLen, radius = Math.max(1, scale);
    var rows = new Array(dstLen);
    for (var o = 0; o < dstLen; o++) {
      var centre = (o + 0.5) * scale - 0.5;
      var lo = Math.max(0, Math.ceil(centre - radius));
      var hi = Math.min(srcLen - 1, Math.floor(centre + radius));
      var idx = [], wts = [], sum = 0;
      for (var s = lo; s <= hi; s++) {
        var t = 1 - Math.abs(s - centre) / radius;
        if (t <= 0) continue;
        idx.push(s); wts.push(t); sum += t;
      }
      if (!idx.length) { idx.push(Math.min(srcLen - 1, Math.max(0, Math.round(centre)))); wts.push(1); sum = 1; }
      for (var m = 0; m < wts.length; m++) wts[m] /= sum;
      rows[o] = { i: idx, w: wts };
    }
    return rows;
  }

  /* ---- masks ------------------------------------------------------------ */
  function maskOf(img, cut) {
    cut = cut == null ? ALPHA_CUT : cut;
    var n = img.width * img.height, m = new Uint8Array(n);
    for (var i = 0; i < n; i++) m[i] = img.data[i * 4 + 3] > cut ? 1 : 0;
    return m;
  }

  function iou(a, b) {
    var inter = 0, union = 0;
    for (var i = 0; i < a.length; i++) {
      if (a[i] & b[i]) inter++;
      if (a[i] | b[i]) union++;
    }
    return union ? inter / union : 1;
  }

  /* Averaging 43 silhouettes that disagree by a pixel or two does not just
   * antialias the edge, it smears it: the mean ramps across the whole
   * disagreement band rather than across one pixel. Ungained, the shared edge
   * measured 22.7px against a single cell's 12.8px — 1.8x too soft. This gain
   * pulls it back, applied around 0.5 so the silhouette itself does not move,
   * only the softness of its boundary.
   *
   * Measured band width against that 12.8px reference:
   *
   *     gain   1.00   1.15   1.25   1.35   1.40   1.50   1.70
   *     ratio  1.77x  1.40x  1.19x  1.06x  1.00x  0.94x  0.75x
   *
   * 1.4 matches a real cell. Going further is not "crisper", it is sharper
   * than the source images actually are, which aliases. This is a correction,
   * not a preference — re-measure before changing it. */
  var ALPHA_GAIN = 1.4;

  function sharpen(a) {
    var v = 0.5 + (a / 255 - 0.5) * ALPHA_GAIN;
    return v <= 0 ? 0 : v >= 1 ? 255 : v * 255;
  }

  /* The silhouette the whole grid shares. Split in two because the build tool
   * streams cells one at a time to stay inside memory and never holds the
   * array this convenience form wants — both must land on the same answer, so
   * the arithmetic lives in one place. */
  function finishConsensus(sum, count) {
    var out = new Uint8ClampedArray(sum.length);
    for (var i = 0; i < sum.length; i++) out[i] = sharpen(sum[i] / count);
    return out;
  }

  function consensusAlpha(cells) {
    var n = cells[0].width * cells[0].height;
    var acc = new Float64Array(n);
    for (var c = 0; c < cells.length; c++) {
      var d = cells[c].data;
      for (var i = 0; i < n; i++) acc[i] += d[i * 4 + 3];
    }
    return finishConsensus(acc, cells.length);
  }

  /* ---- colour where the cell has none to give --------------------------- */
  /* Two cases, one fix. The shared alpha can call a pixel leaf where this cell
   * was transparent (up to 4.4% of the silhouette), and it can call a pixel
   * opaque where this cell was only partly covered. In the first the cell has
   * no colour at all; in the second it has colour that is not trustworthy —
   * see COLOUR_TRUST. Both are repaired by carrying the nearest fully opaque
   * colour outward across them.
   *
   * Two chamfer passes propagate the nearest opaque source, which is
   * O(pixels). A dilation loop wide enough to close the gap would not be, at
   * this resolution.
   *
   * Mutates img.data in place and returns the number of pixels filled. */
  function fillOutward(img, cut) {
    cut = cut == null ? COLOUR_TRUST : cut;
    var w = img.width, h = img.height, d = img.data, n = w * h;
    var srcX = new Int32Array(n), srcY = new Int32Array(n);
    var dist = new Float64Array(n);
    var INF = Infinity;

    for (var i = 0; i < n; i++) {
      if (d[i * 4 + 3] > cut) { srcX[i] = i % w; srcY[i] = (i / w) | 0; dist[i] = 0; }
      else { srcX[i] = -1; srcY[i] = -1; dist[i] = INF; }
    }

    function relax(i, j) {                     // adopt j's source if it is closer
      if (srcX[j] < 0) return;
      var dx = (i % w) - srcX[j], dy = ((i / w) | 0) - srcY[j];
      var dd = dx * dx + dy * dy;
      if (dd < dist[i]) { dist[i] = dd; srcX[i] = srcX[j]; srcY[i] = srcY[j]; }
    }

    var x, y, idx;
    for (y = 0; y < h; y++) {                  // forward: up and left neighbours
      for (x = 0; x < w; x++) {
        idx = y * w + x;
        if (dist[idx] === 0) continue;
        if (x > 0) relax(idx, idx - 1);
        if (y > 0) relax(idx, idx - w);
        if (y > 0 && x > 0) relax(idx, idx - w - 1);
        if (y > 0 && x < w - 1) relax(idx, idx - w + 1);
      }
    }
    for (y = h - 1; y >= 0; y--) {             // backward: down and right
      for (x = w - 1; x >= 0; x--) {
        idx = y * w + x;
        if (dist[idx] === 0) continue;
        if (x < w - 1) relax(idx, idx + 1);
        if (y < h - 1) relax(idx, idx + w);
        if (y < h - 1 && x < w - 1) relax(idx, idx + w + 1);
        if (y < h - 1 && x > 0) relax(idx, idx + w - 1);
      }
    }

    var filled = 0;
    for (var p = 0; p < n; p++) {
      if (dist[p] === 0 || srcX[p] < 0) continue;
      var s = (srcY[p] * w + srcX[p]) * 4, t = p * 4;
      d[t] = d[s]; d[t + 1] = d[s + 1]; d[t + 2] = d[s + 2];
      filled++;
    }
    return filled;
  }

  /* ---- browser: one cell, ready for Step 3 ------------------------------ */
  /* Resolves to {width, height, data} at LEAF_PX square, colour filled
   * outward, alpha still the cell's own — the caller replaces it with the
   * shared alpha loaded from _alpha.png.
   *
   * Uses canvas for the crop and scale rather than resample() above: it is
   * hardware-backed and the page has 43 of these to do. The two resamplers
   * therefore do not agree to the last bit, so a cell's own edge here can sit
   * a fraction of a pixel off the _alpha.png the Node tool built. That is
   * exactly the disagreement fillOutward already covers — it is why colour is
   * defined past the cell's own mask — so the difference cannot show. Do not
   * "fix" it by swapping in resample() without timing the page first. */
  function loadCell(url, n) {
    n = n || LEAF_PX;
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = function () { reject(new Error('leafspace: cannot load ' + url)); };
      img.onload = function () {
        var probe = document.createElement('canvas');
        probe.width = img.naturalWidth; probe.height = img.naturalHeight;
        var pctx = probe.getContext('2d', { willReadFrequently: true });
        pctx.drawImage(img, 0, 0);
        var full = pctx.getImageData(0, 0, probe.width, probe.height);

        var b = alphaBounds(full);
        var out = document.createElement('canvas');
        out.width = n; out.height = n;
        var octx = out.getContext('2d', { willReadFrequently: true });
        octx.imageSmoothingQuality = 'high';
        octx.drawImage(img, b.x0, b.y0, b.w, b.h, 0, 0, n, n);

        var cell = octx.getImageData(0, 0, n, n);
        fillOutward(cell);
        resolve({ width: n, height: n, data: cell.data, aspect: b.w / b.h });
      };
      img.src = url;
    });
  }

  return {
    LEAF_PX: LEAF_PX,
    ALPHA_CUT: ALPHA_CUT,
    CONSENSUS: CONSENSUS,
    COLOUR_TRUST: COLOUR_TRUST,
    MIN_IOU: MIN_IOU,
    alphaBounds: alphaBounds,
    resample: resample,
    maskOf: maskOf,
    iou: iou,
    ALPHA_GAIN: ALPHA_GAIN,
    consensusAlpha: consensusAlpha,
    finishConsensus: finishConsensus,
    fillOutward: fillOutward,
    loadCell: loadCell
  };
});
