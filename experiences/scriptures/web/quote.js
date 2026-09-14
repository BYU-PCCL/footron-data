/* ---------------------------------------------------------------------------
 * quote.js -- reads an annotated quote file, lays it out, types it.
 *
 * THE FILE FORMAT (see text1.txt)
 *
 *   Plain lines are typed as written, one line per line.
 *   [some words](effect)          marks a run of text with one or more effects,
 *   [some words](swell circle)    space-separated, fired the instant the run
 *                                 finishes typing.
 *   -- Attribution                a line opening with an em dash or two hyphens
 *                                 is the attribution; it is typed last, smaller.
 *   # note to self                a comment line, never shown.
 *   (blank line)                  a stanza break.
 *
 * Effects are looked up by name in two places: CSS classes `.fx-<name>` in
 * index.html for the animated spans, and MARKS in doodles.js for the rough.js
 * marks. Anything in either list can be used, and the two mix freely on one run.
 *
 * WHY THE TEXT IS LAID OUT BEFORE IT IS TYPED
 *
 * Every character gets its own span up front, hidden with opacity rather than
 * display, and typing only flips them visible. The line breaks therefore never
 * move mid-quote, and a doodle drawn around a word at the moment it lands is
 * drawn against geometry that is already final.
 * ------------------------------------------------------------------------ */
var Quote = (function () {
    'use strict';

    /* Typing rhythm, all milliseconds. A real typewriter is uneven, so the
     * per-character delay is a base plus jitter, with a held beat at
     * punctuation and a longer one at the end of a line. */
    var PACE = {
        base: 46,
        jitter: 34,
        space: 22,
        comma: 230,        /* , ; : */
        stop: 460,         /* . ! ? */
        dash: 200,         /* -- and em dash */
        lineEnd: 520,
        beforeAttribution: 1100
    };

    var host = null;         /* the element the quote is built into */
    var caret = null;
    var chars = [];          /* flat list of { el, ch, seg, last, lineEnd } */
    var segs = [];           /* every marked run, so a skip can fire them all */
    var cursor = 0;
    var timer = null;
    var onDone = null;

    /* ---------------------------------------------------------------- parse */
    function parse(src) {
        var lines = [];
        var attribution = null;
        var raw = src.replace(/\r\n?/g, '\n').split('\n');

        for (var i = 0; i < raw.length; i++) {
            var line = raw[i];
            if (/^\s*#/.test(line)) { continue; }                  // comment
            if (!line.trim()) {                                    // stanza break
                if (lines.length) { lines.push(null); }
                continue;
            }
            var attrib = line.match(/^\s*(?:—|–|--)\s*(.+?)\s*$/);
            if (attrib) { attribution = parseRuns(attrib[1]); continue; }
            lines.push(parseRuns(line.trim()));
        }
        /* A stanza break left dangling at the end would just add empty space. */
        while (lines.length && lines[lines.length - 1] === null) { lines.pop(); }
        return { lines: lines, attribution: attribution };
    }

    /* Splits one line into runs of { text, fx }. */
    function parseRuns(line) {
        var runs = [];
        var re = /\[([^\]]*)\]\(([^)]*)\)/g;
        var last = 0, m;
        while ((m = re.exec(line)) !== null) {
            if (m.index > last) { runs.push({ text: line.slice(last, m.index), fx: [] }); }
            runs.push({
                text: m[1],
                fx: m[2].trim().split(/[\s,]+/).filter(Boolean)
            });
            last = re.lastIndex;
        }
        if (last < line.length) { runs.push({ text: line.slice(last), fx: [] }); }
        return runs;
    }

    /* ---------------------------------------------------------------- build */
    function build(parsed) {
        host.textContent = '';
        chars = [];
        segs = [];
        cursor = 0;

        for (var i = 0; i < parsed.lines.length; i++) {
            var line = parsed.lines[i];
            if (line === null) {
                var gap = document.createElement('div');
                gap.className = 'line gap';
                host.appendChild(gap);
                continue;
            }
            host.appendChild(buildLine(line, 'line'));
        }
        if (parsed.attribution && parsed.attribution.length) {
            /* The held beat belongs to the last character of the quote itself,
             * so it has to be claimed before the attribution is appended. */
            if (chars.length) { chars[chars.length - 1].beforeAttribution = true; }
            /* The dash belongs to the attribution's look rather than to the
             * text of the file, but it is typed like everything else -- as a
             * fixed element it would sit there visible from the first frame. */
            parsed.attribution[0].text = '— ' + parsed.attribution[0].text;
            host.appendChild(buildLine(parsed.attribution, 'line attribution'));
        }
        if (chars.length) { chars[chars.length - 1].last = true; }
    }

    function buildLine(runs, className) {
        var lineEl = document.createElement('div');
        lineEl.className = className;
        var firstCharOfLine = chars.length;

        for (var i = 0; i < runs.length; i++) {
            var run = runs[i];
            var segEl = document.createElement('span');
            segEl.className = 'seg';

            var doodleKinds = [];
            for (var f = 0; f < run.fx.length; f++) {
                var name = run.fx[f];
                if (Doodles.isMark(name)) { doodleKinds.push(name); }
                else { segEl.classList.add('fx-' + name); }
            }
            /* A circled phrase that wrapped mid-way looks broken, so runs
             * carrying a mark are kept on one line where they can be. */
            if (doodleKinds.length) { segEl.classList.add('nowrap'); }

            var seg = { el: segEl, doodles: doodleKinds, fired: false };
            segs.push(seg);

            var text = run.text;
            for (var c = 0; c < text.length; c++) {
                var ch = text[c];
                var chEl = document.createElement('span');
                chEl.className = 'ch';
                chEl.textContent = ch;
                if (ch === ' ') {
                    /* Left inline (not inline-block) so the line can still
                     * break here, and left untilted -- a space has no ink. */
                    chEl.classList.add('sp');
                } else {
                    /* The type bar never hits square. */
                    chEl.style.transform =
                        'translateY(' + (Math.random() * 1.6 - 0.8).toFixed(2) + 'px) ' +
                        'rotate(' + (Math.random() * 2.2 - 1.1).toFixed(2) + 'deg)';
                }
                segEl.appendChild(chEl);
                chars.push({
                    el: chEl,
                    ch: ch,
                    seg: seg,
                    lastOfSeg: false,
                    lineEnd: false,
                    last: false,
                    beforeAttribution: false
                });
            }
            if (text.length) { chars[chars.length - 1].lastOfSeg = true; }
            lineEl.appendChild(segEl);
        }

        if (chars.length > firstCharOfLine) { chars[chars.length - 1].lineEnd = true; }
        return lineEl;
    }

    /* ------------------------------------------------------------------ fit */
    /* Quotes are different lengths and the wall is one size, so the type is
     * scaled to the quote rather than the quote trusted to fit the type: lines
     * are laid out unwrapped, measured, and the whole block scaled to the stage.
     * A quote long enough to hit the floor size is allowed to wrap instead. */
    var FIT = { min: 20, grow: 2.0, margin: 0.97 };

    function fit() {
        var stage = host.parentElement;
        var cs = getComputedStyle(stage);
        var availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        var availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

        host.classList.remove('wrapping');
        host.style.fontSize = '';                 /* back to the CSS clamp */
        var base = parseFloat(getComputedStyle(host).fontSize);

        /* With .line at white-space:pre, scrollWidth is the widest line. */
        var w = host.scrollWidth, h = host.scrollHeight;
        if (!w || !h) { return; }

        var k = Math.min(availW / w, availH / h) * FIT.margin;
        var size = Math.min(base * k, base * FIT.grow);
        if (size < FIT.min) { size = FIT.min; host.classList.add('wrapping'); }
        host.style.fontSize = size + 'px';
    }

    /* Re-fits and re-measures after the window changes size. Only meaningful
     * once a quote is on screen. */
    function refit() { if (host && chars.length) { fit(); } }

    /* ---------------------------------------------------------------- typing */
    function delayFor(entry) {
        var d = PACE.base + Math.random() * PACE.jitter;
        var ch = entry.ch;
        if (ch === ' ') { d += PACE.space; }
        if (/[,;:]/.test(ch)) { d += PACE.comma; }
        if (/[.!?]/.test(ch)) { d += PACE.stop; }
        if (/[—–-]/.test(ch)) { d += PACE.dash; }
        if (entry.lineEnd) { d += PACE.lineEnd; }
        if (entry.beforeAttribution) { d += PACE.beforeAttribution; }
        return d;
    }

    function reveal(entry) {
        entry.el.classList.add('on');
        moveCaret(entry.el);
        if (entry.lastOfSeg) { fire(entry.seg); }
    }

    /* Effects land the moment the run they belong to finishes typing. */
    function fire(seg) {
        if (seg.fired) { return; }
        seg.fired = true;
        seg.el.classList.add('on');
        if (!seg.doodles.length) { return; }
        afterSettle(seg.el, function () {
            for (var i = 0; i < seg.doodles.length; i++) {
                (function (kind, delay) {
                    setTimeout(function () { Doodles.annotate(seg.el, kind); }, delay);
                })(seg.doodles[i], i * 220);
            }
        });
    }

    /* A run that is still swelling is still moving, and a mark measured in the
     * middle of that lands around geometry the word is about to leave. So any
     * one-shot animation on the run is waited out first. The endless ones
     * (wobble, glow, shimmer) would never resolve, and are ignored. */
    function afterSettle(el, cb) {
        if (!el.getAnimations) { return void setTimeout(cb, 120); }
        var finite = el.getAnimations().filter(function (a) {
            var t = a.effect && a.effect.getTiming();
            return t && t.iterations !== Infinity;
        });
        if (!finite.length) { return void setTimeout(cb, 120); }

        var done = false;
        function once() { if (!done) { done = true; cb(); } }
        Promise.all(finite.map(function (a) { return a.finished; })).then(once, function () {});
        /* Never let a cancelled or stalled animation swallow the mark. */
        setTimeout(once, 1400);
    }

    /* A block cursor sized off the character it stands next to, so it keeps its
     * proportions whatever size fit() landed on. It covers the letter's own
     * height rather than the whole line box -- the full box reads as a
     * highlight rather than as a cursor. */
    function moveCaret(el) {
        var r = el.getBoundingClientRect();
        var h = r.height * 0.56;
        caret.style.transform = 'translate(' + (r.right + 2) + 'px,' +
                                               (r.top + r.height * 0.30) + 'px)';
        caret.style.width = Math.max(3, h * 0.6) + 'px';
        caret.style.height = h + 'px';
        caret.classList.add('lit');
    }

    function step() {
        if (cursor >= chars.length) { return finish(); }
        var entry = chars[cursor++];
        reveal(entry);
        timer = setTimeout(step, delayFor(entry));
    }

    function finish() {
        caret.classList.remove('lit');
        if (onDone) { onDone(); }
    }

    /* ------------------------------------------------------------- controls */
    /* Fills the rest of the quote in at once -- handy while writing one. */
    function skip() {
        clearTimeout(timer);
        while (cursor < chars.length) {
            var entry = chars[cursor++];
            entry.el.classList.add('on');
            if (entry.lastOfSeg) { fire(entry.seg); }
        }
        finish();
    }

    function stop() { clearTimeout(timer); }

    /* Parses, lays out and types `src` into `hostEl`, calling done() at the end. */
    function play(hostEl, caretEl, src, done) {
        host = hostEl;
        caret = caretEl;
        onDone = done;
        clearTimeout(timer);
        build(parse(src));
        fit();
        /* One frame for the browser to lay the hidden text out at the fitted
         * size before the first caret position is measured. */
        requestAnimationFrame(step);
    }

    return { play: play, skip: skip, stop: stop, refit: refit, parse: parse };
})();
