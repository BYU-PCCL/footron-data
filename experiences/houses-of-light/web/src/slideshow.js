/**
 * Houses of Light — the slideshow itself.
 *
 * One photograph at a time, held long enough to actually look at. Three things
 * happen on every slide, staggered so that none of them is ever the thing you
 * are watching:
 *
 *   * a slow travel up the photograph — the frame is filled edge to edge and
 *     the slide rises from the foot of the picture to the spire over its life,
 *     so the whole of it is seen without any of it being letterboxed;
 *   * the ambient wash behind everything re-grading to this photograph's own
 *     three dominant colours, which takes a couple of seconds and so is always
 *     still settling when the caption finishes arriving;
 *   * the bloom — the new slide is revealed through a soft circular mask
 *     centred on the brightest point of the upper frame, which the scorer
 *     recorded and which is the spire in nearly every temple photograph.
 *
 * The result is that the change between two slides reads as a light coming on
 * rather than as a transition effect.
 */

import { displayName, dedicationLine, metaLine } from "./label.js";

const HOLD = 30000;       // ms a slide is held, bloom included
const BLOOM = 2400;       // ms for the light to open across the frame

/* How long the travel takes. A slide is fully visible from the end of its own
 * bloom until the next one starts blooming over it, so the journey is set to
 * finish just as it begins to be covered rather than running on underneath.
 *
 * At a thirty-second hold this works out around 25 pixels a second up a 4:3
 * photograph — slow enough that you notice the building has moved rather than
 * watching it move, which is the point. */
const PAN_MS = HOLD + BLOOM * 0.5;

/* Below this much overflow there is nothing to pan across — an image already
 * about as wide as the wall — so it gets a gentle push in instead, purely so
 * the frame is never completely still. */
const MIN_TRAVEL = 40;

/**
 * Fill the frame with the photograph and work out the journey across it.
 *
 * `cover` would do the filling, but it crops to the middle and stays there. So
 * size an element to the photograph's own proportions at the scale that fills
 * the frame, and move it: the overflow is exactly the part of the picture that
 * does not fit, and travelling that distance is exactly seeing all of it.
 *
 * Panning the long axis rather than assuming the tall one keeps this correct
 * for a panorama too, should one ever pass the filters.
 */
function layout(el, imgAspect) {
  const W = window.innerWidth || 1, H = window.innerHeight || 1;
  const a = Number.isFinite(imgAspect) && imgAspect > 0 ? imgAspect : W / H;
  let w, h;
  if (a < W / H) { w = W; h = W / a; }     // narrower than the wall: travel down
  else { h = H; w = H * a; }               // wider than the wall: travel across
  el.style.width = `${w}px`;
  el.style.height = `${h}px`;
  return { w, h, W, H, overflowX: Math.max(0, w - W), overflowY: Math.max(0, h - H) };
}

export class Slideshow {
  constructor(ctx) {
    this.ctx = ctx;
    this.plates = document.getElementById("plates");
    this.cap = document.getElementById("caption");
    this.eyebrow = this.cap.querySelector(".cap-eyebrow");
    this.name = this.cap.querySelector(".cap-name");
    this.meta = this.cap.querySelector(".cap-meta");
    this.current = null;
    this.timer = null;
    this.queue = [];
  }

  start() {
    this.ctx.miniglobe.classList.add("show");
    this.step();
  }

  stop() { clearTimeout(this.timer); }

  step() {
    if (!this.queue.length) this.queue = this.ctx.more();
    const slide = this.queue.shift();
    // `more()` walks the whole corpus and wraps, so it only comes back empty if
    // there is nothing to show at all. Stop rather than spin.
    if (!slide) return;
    this.show(slide);
    this.timer = setTimeout(() => this.step(), HOLD);
  }

  /** Skip whatever is on screen and move on. */
  next() {
    clearTimeout(this.timer);
    this.step();
  }

  /** Hold the current photograph, or release it and carry on. */
  pause(on) {
    clearTimeout(this.timer);
    if (!on) this.timer = setTimeout(() => this.step(), HOLD);
  }

  /** Cut to a particular slide now, and carry on from there. */
  jump(slide) {
    clearTimeout(this.timer);
    this.show(slide);
    this.timer = setTimeout(() => this.step(), HOLD);
  }

  show(slide) {
    const { temple, image } = slide;

    const el = document.createElement("div");
    el.className = "plate-img blooming";

    const pan = document.createElement("div");
    pan.className = "plate-pan";
    pan.style.backgroundImage = `url("${image.src}")`;
    el.append(pan);

    const aspect = image.w && image.h ? image.w / image.h : null;
    const box = layout(pan, aspect);

    // The travel runs upward: it opens at the foot of the photograph and rises
    // to the spire, so the building is revealed the way you take it in standing
    // in front of one rather than the way a camera falls off it.
    const travelY = box.overflowY, travelX = box.overflowX;
    const still = travelY < MIN_TRAVEL && travelX < MIN_TRAVEL;

    // Where the spire is on the wall *at the moment the light arrives*, which
    // is the start of the travel and therefore the picture shifted up by its
    // whole overflow. On a tall photograph the spire is still above the top of
    // the frame then, so the bloom is clamped back onto the wall and opens from
    // the top edge — which is the direction the spire is in, and the direction
    // the picture is about to rise from.
    const bx = (image.bloom[0] * box.w - travelX) / box.W;
    const by = (image.bloom[1] * box.h - travelY) / box.H;
    const cx = Math.max(0.04, Math.min(0.96, bx)) * 100;
    const cy = Math.max(0.04, Math.min(0.96, by)) * 100;
    el.style.setProperty("--bx", `${cx}%`);
    el.style.setProperty("--by", `${cy}%`);

    this.plates.appendChild(el);

    // Eased a little at both ends so the journey starts and stops the way a
    // camera move does, rather than switching on at full speed.
    if (still) {
      // Nothing to travel across; push in gently so the frame is never dead.
      pan.animate([{ transform: "scale(1)" }, { transform: "scale(1.05)" }],
        { duration: PAN_MS, fill: "forwards", easing: "linear" });
    } else {
      pan.animate(
        [{ transform: `translate(${-travelX}px, ${-travelY}px)` },
         { transform: "translate(0px, 0px)" }],
        { duration: PAN_MS, fill: "forwards", easing: "cubic-bezier(.32,0,.68,1)" }
      );
    }

    el.animate([{ opacity: 0 }, { opacity: 1 }],
      { duration: BLOOM * 0.55, fill: "forwards", easing: "ease-out" });

    // The mask opening. 165% rather than 100% because the origin is off-centre
    // and the far corner of the frame is further away than half the diagonal.
    el.animate([{ "--r": "0%" }, { "--r": "165%" }],
      { duration: BLOOM, fill: "forwards", easing: "cubic-bezier(.22,.7,.3,1)" })
      .finished.then(() => {
        // Once the mask covers everything it is pure cost, so drop it — and
        // retire the slide underneath, which is now completely hidden.
        el.classList.remove("blooming");
        while (this.plates.children.length > 1 && this.plates.firstChild !== el) {
          this.plates.firstChild.remove();
        }
      }).catch(() => {});

    this.current = slide;

    this.ctx.setPalette(image.palette);
    this.ctx.setCredit(image);
    this.ctx.ribbon.focus(temple);
    this.ctx.globe.flyTo(temple.lat, temple.lon, 3400);

    this.caption(temple);
  }

  caption(t) {
    const lines = [
      [this.eyebrow, dedicationLine(t) || "&nbsp;"],
      [this.name, displayName(t)],
      [this.meta, metaLine(t, 3)],
    ];

    lines.forEach(([el, html], i) => {
      el.classList.remove("rise", "in");
      el.innerHTML = html;
      // Force a reflow so the class removal above actually takes effect before
      // it is re-added; otherwise the browser coalesces the two and nothing
      // animates on the second and later slides.
      void el.offsetWidth;
      el.classList.add("rise");
      setTimeout(() => el.classList.add("in"), 420 + i * 190);
    });
  }
}
