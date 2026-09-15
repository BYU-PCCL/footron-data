/* ---------------------------------------------------------------------------
 * doodles.js -- the hand-drawn layer, rough.js on one full-screen SVG overlay.
 *
 * Everything here works in viewport pixels. The overlay is position:fixed with
 * a viewBox of exactly innerWidth x innerHeight, so a rect straight out of
 * getBoundingClientRect() can be handed to rough without any conversion.
 *
 * Every doodle is recorded in `drawn` along with the seed it was drawn from,
 * so a resize can wipe the overlay and redraw the same squiggles against the
 * new text geometry instead of rolling a fresh set of wobbles.
 * ------------------------------------------------------------------------ */
var Doodles = (function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    var svg = null;
    var rc = null;
    var drawn = [];          // { el, kind, seed } -- el is null for ambient marks

    /* Pulled from the CSS so the ink out here matches the ink on the page. */
    function cssVar(name, fallback) {
        var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
    }

    /* No resize listener of its own: on a resize the text has to be re-fitted
     * before the marks are redrawn against it, so index.html drives the order. */
    function init(svgEl) {
        svg = svgEl;
        rc = rough.svg(svg);
        resize();
    }

    /* The stage is observed for resizes from the first frame, which is before
       init() has been given the overlay -- so both entry points have to be
       willing to do nothing until there is an SVG to draw on. */
    function resize() {
        if (!svg) { return; }
        var w = window.innerWidth, h = window.innerHeight;
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.setAttribute('width', w);
        svg.setAttribute('height', h);
    }

    /* The pen. `seed` keeps a given doodle's wobble identical across redraws. */
    function pen(seed, opts) {
        var o = {
            stroke: cssVar('--accent', '#c2452d'),
            strokeWidth: 2.4,
            roughness: 1.9,
            bowing: 1.6,
            seed: seed,
            fill: 'none'
        };
        for (var k in opts) { if (opts.hasOwnProperty(k)) { o[k] = opts[k]; } }
        return o;
    }

    /* Draws the strokes on rather than popping them in: each <path> rough
     * produced is dash-offset out of sight and then transitioned back. */
    function drawOn(g, duration) {
        var paths = g.querySelectorAll('path');
        for (var i = 0; i < paths.length; i++) {
            var p = paths[i], len = 0;
            try { len = p.getTotalLength(); } catch (e) { len = 0; }
            if (!len) { continue; }
            p.style.strokeDasharray = len + ' ' + len;
            p.style.strokeDashoffset = len;
            p.getBoundingClientRect();   // flush, or the transition never runs
            p.style.transition = 'stroke-dashoffset ' + duration + 'ms ' +
                                 'cubic-bezier(.25,.85,.35,1) ' +
                                 Math.round(i * duration * 0.4) + 'ms';
            p.style.strokeDashoffset = '0';
        }
    }

    /* ------------------------------------------------------------ the marks */
    /* Each takes a viewport rect plus a seed and returns an SVG <g>. Add a case
     * here and the name is immediately usable as an effect in a quote file. */
    var MARKS = {
        circle: function (r, seed) {
            return rc.ellipse(r.left + r.width / 2, r.top + r.height / 2,
                              r.width * 1.10 + 30, r.height * 1.28 + 6,
                              pen(seed, { roughness: 2.1 }));
        },

        box: function (r, seed) {
            return rc.rectangle(r.left - 10, r.top - 6,
                                r.width + 20, r.height + 12,
                                pen(seed, { roughness: 2.3, bowing: 2.2 }));
        },

        /* Two passes of a loose curve under the word -- the way you underline
         * something in a notebook without lifting the pen.
         *
         * It starts below the rect rather than inside it. The rect is the run's
         * inline box, whose bottom is only a couple of pixels clear of where
         * the descenders of a j or a y actually reach, so a stroke drawn up
         * inside it and then given its wobble climbs back through the word.
         * The wobble is kept smaller here than on the other marks for the same
         * reason: this is the one mark whose whole job is to stay under. */
        underline: function (r, seed) {
            var g = document.createElementNS(NS, 'g');
            var y = r.bottom + r.height * 0.12;
            for (var pass = 0; pass < 2; pass++) {
                var pts = [];
                for (var i = 0; i <= 4; i++) {
                    pts.push([r.left - 6 + (r.width + 12) * (i / 4),
                              y + pass * 4 + (i % 2 ? 1.2 : -1.2)]);
                }
                g.appendChild(rc.curve(pts, pen(seed + pass, {
                    strokeWidth: 2.6, roughness: 1.35, bowing: 1.2
                })));
            }
            return g;
        },

        strike: function (r, seed) {
            return rc.line(r.left - 8, r.top + r.height * 0.58,
                           r.right + 8, r.top + r.height * 0.52,
                           pen(seed, { strokeWidth: 2.2 }));
        },

        /* Three four-pointed sparkles scattered around the word. */
        star: function (r, seed) {
            var g = document.createElementNS(NS, 'g');
            var spots = [
                [r.right + 20, r.top - 6,   13],
                [r.right + 42, r.top + 20,   8],
                [r.left  - 26, r.top - 10,   9]
            ];
            for (var i = 0; i < spots.length; i++) {
                g.appendChild(rc.path(sparklePath(spots[i][0], spots[i][1], spots[i][2]),
                                      pen(seed + i, { strokeWidth: 1.9, roughness: 1.3 })));
            }
            return g;
        }
    };

    /* A four-pointed sparkle: straight out to each point, pinched at the waist. */
    function sparklePath(cx, cy, r) {
        var w = r * 0.26;
        return 'M ' + cx + ' ' + (cy - r) +
               ' C ' + cx + ' ' + (cy - w) + ' ' + (cx + w) + ' ' + cy + ' ' + (cx + r) + ' ' + cy +
               ' C ' + (cx + w) + ' ' + cy + ' ' + cx + ' ' + (cy + w) + ' ' + cx + ' ' + (cy + r) +
               ' C ' + cx + ' ' + (cy + w) + ' ' + (cx - w) + ' ' + cy + ' ' + (cx - r) + ' ' + cy +
               ' C ' + (cx - w) + ' ' + cy + ' ' + cx + ' ' + (cy - w) + ' ' + cx + ' ' + (cy - r) + ' Z';
    }

    function isMark(name) { return MARKS.hasOwnProperty(name); }

    /* -------------------------------------------------------------- drawing */
    /* getClientRects(), not getBoundingClientRect(): a marked phrase that has
     * wrapped onto two lines gets one mark per line fragment rather than one
     * enormous circle around the gap between them. */
    function paint(el, kind, seed, animate) {
        var rects = el.getClientRects();
        for (var i = 0; i < rects.length; i++) {
            var r = rects[i];
            if (r.width < 2) { continue; }
            var g = MARKS[kind](r, seed + i * 17);
            g.setAttribute('class', 'doodle');
            svg.appendChild(g);
            if (animate) { drawOn(g, 520); }
        }
    }

    function annotate(el, kind) {
        if (!isMark(kind)) { return; }
        var seed = Math.floor(Math.random() * 100000);
        drawn.push({ el: el, kind: kind, seed: seed });
        paint(el, kind, seed, true);
    }

    /* Marginalia -- marks that belong to the page rather than to any one word,
     * kept out at the edges so they frame the quote without crowding it. */
    function ambient() {
        var seed = Math.floor(Math.random() * 100000);
        drawn.push({ el: null, kind: 'ambient', seed: seed });
        paintAmbient(seed, true);
    }

    function paintAmbient(seed, animate) {
        var w = window.innerWidth, h = window.innerHeight;
        var ink = cssVar('--ink-soft', '#8a7a68');
        var g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'doodle doodle-ambient');

        /* A long loose squiggle along the bottom, like a pen idling. */
        var pts = [];
        for (var i = 0; i <= 8; i++) {
            pts.push([w * 0.16 + (w * 0.68) * (i / 8), h * 0.90 + (i % 2 ? -7 : 7)]);
        }
        g.appendChild(rc.curve(pts, pen(seed, { stroke: ink, strokeWidth: 1.8, roughness: 1.4 })));

        /* Corner flourishes. */
        g.appendChild(rc.path(sparklePath(w * 0.09, h * 0.16, 15),
                              pen(seed + 3, { stroke: ink, strokeWidth: 1.7 })));
        g.appendChild(rc.path(sparklePath(w * 0.93, h * 0.22, 11),
                              pen(seed + 4, { stroke: ink, strokeWidth: 1.7 })));
        g.appendChild(rc.path(sparklePath(w * 0.90, h * 0.79, 17),
                              pen(seed + 5, { stroke: ink, strokeWidth: 1.7 })));

        svg.appendChild(g);
        if (animate) { drawOn(g, 1400); }
    }

    /* --------------------------------------------------------- housekeeping */
    /* Same seeds, new geometry: after a resize the marks have to land on the
     * words again, but they should be recognisably the same marks. */
    function redraw() {
        if (!svg) { return; }
        resize();
        wipe(false);
        for (var i = 0; i < drawn.length; i++) {
            var d = drawn[i];
            if (d.kind === 'ambient') { paintAmbient(d.seed, false); }
            else if (d.el && d.el.isConnected) { paint(d.el, d.kind, d.seed, false); }
        }
    }

    /* wipe(true) forgets the doodles as well -- used between quotes. */
    function wipe(forget) {
        while (svg.firstChild) { svg.removeChild(svg.firstChild); }
        if (forget) { drawn = []; }
    }

    return {
        init: init, annotate: annotate, ambient: ambient,
        wipe: wipe, redraw: redraw, isMark: isMark
    };
})();
