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

    /* Every verse is a different length and the rhythm above is written for a
     * short one: Alma 7:14-16 typed at it takes a minute and a half to land,
     * which is longer than anyone stands in front of the wall. So the rhythm is
     * scaled per quote. Anything that would come in under TARGET_MS is typed
     * exactly as written; anything longer is sped up in proportion to how long
     * it is, down to a floor that still reads as a typewriter rather than a
     * paste. Every beat scales together -- the held breath at a full stop and
     * at the end of a line included -- so a hurried verse keeps its cadence. */
    var TARGET_MS = 38000;
    var MIN_RATE = 0.45;
    var rate = 1;            /* set per quote in play() */

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
            /* A line with another line after it in the same stanza carries a
             * joint: the space that authored line break turns into if fit()
             * decides this verse has to be run together as prose. */
            var next = parsed.lines[i + 1];
            host.appendChild(buildLine(line, 'line', next !== undefined && next !== null));
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

    function buildLine(runs, className, joinNext) {
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
            /* Every character is its own inline-block, and a line may be broken
             * between any two of them -- which is how a quote long enough to
             * wrap ended up splitting words down the middle. So the letters of
             * a word go inside a .word span of their own, which is nowrap: the
             * only break opportunities left are the spaces between words. */
            var wordEl = null;
            for (var c = 0; c < text.length; c++) {
                var ch = text[c];
                var chEl = document.createElement('span');
                chEl.className = 'ch';
                chEl.textContent = ch;
                if (ch === ' ') {
                    /* Left inline (not inline-block) so the line can still
                     * break here, and left untilted -- a space has no ink. */
                    chEl.classList.add('sp');
                    segEl.appendChild(chEl);
                    wordEl = null;
                } else {
                    /* The type bar never hits square. */
                    chEl.style.transform =
                        'translateY(' + (Math.random() * 1.6 - 0.8).toFixed(2) + 'px) ' +
                        'rotate(' + (Math.random() * 2.2 - 1.1).toFixed(2) + 'deg)';
                    if (!wordEl) {
                        wordEl = document.createElement('span');
                        wordEl.className = 'word';
                        segEl.appendChild(wordEl);
                    }
                    wordEl.appendChild(chEl);
                }
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

        /* The joint is typed like any other space, and is display:none while the
         * verse is set on its own lines, so it costs nothing there. */
        if (joinNext) {
            var joint = document.createElement('span');
            joint.className = 'ch sp joint';
            joint.textContent = ' ';
            lineEl.appendChild(joint);
            chars.push({
                el: joint, ch: ' ', seg: { el: joint, doodles: [], fired: true },
                lastOfSeg: false, lineEnd: false, last: false, beforeAttribution: false
            });
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

    /* Three dials, tried in this order.
     *
     * The column: a narrow measure reads better, so it is opened up only as far
     * as this verse needs -- per cent of the wall, narrowest first.
     *
     * The line breaks: a verse long enough that even the widest column leaves
     * it cramped is the one standing as a tall stack of short lines, and height
     * is what is costing it its size. That one is run together as prose and
     * allowed to fill the box instead.
     *
     * The size: whatever is left, floored at FIT.min.
     *
     * Both thresholds are a fraction of the wall's height rather than a pixel
     * count, so the same verse behaves the same way on a bigger screen. */
    var COLUMNS = [50, 62, 74, 86];
    var COMFORT = 0.030;       /* stop widening once the type reaches this */
    var REFLOW_GAIN = 1.25;    /* what reflowing has to buy to be worth it */

    function fit() {
        var stage = host.parentElement;
        var cs = getComputedStyle(stage);
        var padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        var availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        if (availH <= 0) { return; }

        host.classList.remove('wrapping', 'reflow');
        host.style.fontSize = '';                 /* back to the CSS clamp */
        host.style.maxWidth = '';
        var base = parseFloat(getComputedStyle(host).fontSize);

        /* With .line at white-space:pre, scrollWidth is the widest line. */
        var natW = host.scrollWidth, natH = host.scrollHeight;
        if (!natW || !natH) { return; }

        /* Laid out on its own lines the block is the size it is whatever the
         * column -- only the room changes -- so the column can be picked by
         * arithmetic rather than by laying the verse out once per candidate. */
        var comfort = window.innerHeight * COMFORT;
        var pick = null;
        for (var i = 0; i < COLUMNS.length; i++) {
            var availW = window.innerWidth * COLUMNS[i] / 100 - padX;
            var k = Math.min(availW / natW, availH / natH) * FIT.margin;
            pick = { pct: COLUMNS[i], room: availW, size: Math.min(base * k, base * FIT.grow) };
            if (pick.size >= comfort) { break; }
        }
        stage.style.width = pick.pct + '%';

        var size = pick.size;
        if (size < comfort) {
            /* Short of comfortable even in the widest column. Rather than guess
             * from the length of the verse whether its line breaks are what is
             * costing it, lay it out both ways and look: the authored breaks
             * are kept unless letting them go buys a materially bigger verse.
             *
             * Reflowed, the block fills whatever width it is given, so the
             * width is pinned here and the search is left to solve for the
             * height alone. */
            host.classList.add('reflow');
            host.style.maxWidth = (pick.room * FIT.margin) + 'px';
            var reflowed = fillSize(availH * FIT.margin, base);
            if (reflowed >= size * REFLOW_GAIN) {
                size = reflowed;
            } else {
                host.classList.remove('reflow');
                host.style.maxWidth = '';
            }
        }

        if (size < FIT.min) { size = FIT.min; host.classList.add('wrapping'); }
        host.style.fontSize = size + 'px';
    }

    /* The largest size at which the reflowed verse still fits the box. Wrapped
     * text has no closed form for this -- a size either fits or it does not --
     * so it is a handful of bisections against the real layout. */
    function fillSize(maxH, base) {
        var lo = FIT.min, hi = base * FIT.grow, best = lo;
        for (var i = 0; i < 11; i++) {
            var mid = (lo + hi) / 2;
            host.style.fontSize = mid + 'px';
            if (host.scrollHeight <= maxH + 0.5) { best = mid; lo = mid; }
            else { hi = mid; }
        }
        return best;
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
        return d * rate;
    }

    /* What the quote now laid out would take at the written rhythm, with the
     * jitter averaged out rather than rolled -- the same sum delayFor produces,
     * which is what makes the scaling below land where it says it will. */
    function naturalDuration() {
        var ms = 0;
        for (var i = 0; i < chars.length; i++) {
            var entry = chars[i], ch = entry.ch;
            ms += PACE.base + PACE.jitter / 2;
            if (ch === ' ') { ms += PACE.space; }
            if (/[,;:]/.test(ch)) { ms += PACE.comma; }
            if (/[.!?]/.test(ch)) { ms += PACE.stop; }
            if (/[—–-]/.test(ch)) { ms += PACE.dash; }
            if (entry.lineEnd) { ms += PACE.lineEnd; }
            if (entry.beforeAttribution) { ms += PACE.beforeAttribution; }
        }
        return ms;
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
        /* A joint that is display:none has no box to stand beside. */
        if (!r.width && !r.height) { return; }
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
        var natural = naturalDuration();
        rate = natural > 0 ? Math.max(MIN_RATE, Math.min(1, TARGET_MS / natural)) : 1;
        fit();
        /* One frame for the browser to lay the hidden text out at the fitted
         * size before the first caret position is measured. */
        requestAnimationFrame(step);
    }

    return { play: play, skip: skip, stop: stop, refit: refit, parse: parse };
})();
