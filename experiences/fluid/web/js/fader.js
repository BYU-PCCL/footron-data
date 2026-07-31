// Caption rotator: fades each .fader element in, holds it, fades it out, then
// loops forever. Same behaviour as the old jQuery fader, without the jQuery.

(function () {
    'use strict';

    const DEFAULTS = { in: 500, stay: 2000, out: 500, delaynext: 1000 };

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function settings (el, defaults) {
        const d = el.dataset;
        return {
            in: d.in ? Number(d.in) : defaults.in,
            stay: d.stay ? Number(d.stay) : defaults.stay,
            out: d.out ? Number(d.out) : defaults.out,
            delaynext: d.delaynext ? Number(d.delaynext) : defaults.delaynext,
        };
    }

    async function fade (el, ms, to) {
        el.style.transition = `opacity ${ms}ms ease-in-out`;
        if (to > 0) el.style.visibility = 'visible';
        // Let the browser apply visibility before starting the transition.
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        el.style.opacity = String(to);
        await sleep(ms);
        if (to === 0) el.style.visibility = 'hidden';
    }

    async function run (elements, defaults) {
        for (;;) {
            for (const el of elements) {
                const s = settings(el, defaults);
                await fade(el, s.in, 1);
                await sleep(s.stay);
                await fade(el, s.out, 0);
                await sleep(Math.max(0, s.delaynext - s.in - s.stay - s.out));
            }
        }
    }

    window.startCaptions = function (overrides) {
        const defaults = Object.assign({}, DEFAULTS, overrides || {});
        const elements = Array.from(document.querySelectorAll('.fader'));
        if (elements.length === 0) return;
        for (const el of elements) {
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
        }
        run(elements, defaults);
    };
})();
