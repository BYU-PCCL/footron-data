/**
 * Houses of Light — the slideshow itself.
 *
 * One photograph at a time, held long enough to actually look at. Three things
 * happen on every slide, staggered so that none of them is ever the thing you
 * are watching:
 *
 *   * a slow Ken Burns drift, anchored on the building rather than the frame
 *     centre, so the drift is *around* the temple;
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

const HOLD = 9200;        // ms a slide is held, bloom included
const BLOOM = 2400;       // ms for the light to open across the frame

/* The drift is gentle because the photograph is shown whole rather than
 * cropped to the frame (see .plate-front): anything more than a few per cent
 * of zoom starts pushing the top of the building off the wall, which is the
 * problem the contained layout exists to avoid. */
const ZOOM_MIN = 1.0, ZOOM_MAX = 1.06;

/* Where a point in the photograph lands on the wall, once the photograph has
 * been fitted inside it. The bloom has to open from the spire, and the spire's
 * position is recorded in the image's own coordinates — but the image occupies
 * only the middle ~60% of a 2.25:1 wall, so those coordinates are not screen
 * coordinates and using them directly would open the light off to one side. */
function imageToScreen(ix, iy, imgAspect) {
  const W = window.innerWidth || 1, H = window.innerHeight || 1;
  const screenAspect = W / H;
  let bw, bh;
  if (!imgAspect || !Number.isFinite(imgAspect)) return [ix, iy];
  if (imgAspect > screenAspect) { bw = W; bh = W / imgAspect; }
  else { bh = H; bw = H * imgAspect; }
  const ox = (W - bw) / 2, oy = (H - bh) / 2;
  return [(ox + ix * bw) / W, (oy + iy * bh) / H];
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

    // Two layers from one file: the photograph itself, shown whole, over a
    // blurred and dimmed copy that fills the rest of the ultrawide frame.
    const back = document.createElement("div");
    back.className = "plate-back";
    const front = document.createElement("div");
    front.className = "plate-front";
    back.style.backgroundImage = front.style.backgroundImage = `url("${image.src}")`;
    el.append(back, front);

    // Ken Burns is anchored on the building, not the frame. The bloom point is
    // the spire, so scaling about a point a little below it keeps the temple in
    // shot for the whole drift instead of letting it wander off an edge.
    const aspect = image.w && image.h ? image.w / image.h : null;
    const [sx, sy] = imageToScreen(image.bloom[0], image.bloom[1], aspect);
    const bx = sx * 100, by = sy * 100;
    el.style.setProperty("--bx", `${bx}%`);
    el.style.setProperty("--by", `${by}%`);
    el.style.setProperty("--ox", `${bx}%`);
    el.style.setProperty("--oy", `${Math.min(80, by + 18)}%`);

    this.plates.appendChild(el);

    // Alternate pushing in and pulling out so consecutive slides do not all
    // drift the same way, which is what makes a long sequence feel mechanical.
    const inward = this.plates.children.length % 2 === 0;
    const z0 = inward ? ZOOM_MIN : ZOOM_MAX, z1 = inward ? ZOOM_MAX : ZOOM_MIN;
    const dx = (Math.random() - 0.5) * 1.0, dy = (Math.random() - 0.5) * 0.8;

    el.animate(
      [{ transform: `scale(${z0}) translate(0%, 0%)` },
       { transform: `scale(${z1}) translate(${dx}%, ${dy}%)` }],
      { duration: HOLD + BLOOM + 2000, fill: "forwards", easing: "linear" }
    );

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
