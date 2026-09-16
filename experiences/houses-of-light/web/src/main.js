/**
 * Houses of Light — a temple slideshow for the Footron wall.
 *
 * One photograph of one temple at a time, drifting, with the light opening from
 * the spire and the colour in the room graded from the picture's own palette.
 * Along the bottom, a chronology ribbon marks every dedication from Kirtland in
 * 1836 to this year and lights the one on screen; in the corner, a globe turns
 * to the building's actual coordinates.
 *
 * Every photograph is used under a free licence (CC BY, CC BY-SA, CC0 or public
 * domain) harvested from Wikimedia Commons, and the credit line naming the
 * photographer and the licence is on screen the whole time the photograph is.
 */

import { Globe } from "./globe.js";
import { Ribbon } from "./ribbon.js";
import { Slideshow } from "./slideshow.js";
import { connectFootron } from "./footron.js";

const BATCH = 8;   // slides fetched from the running order at a time

/* How much the running order is allowed to depart from strict quality order,
 * in units of aesthetic score. The scores of everything that survived the gates
 * span about 4.9 to 6.5, so a jitter of this size reshuffles neighbours freely
 * while still keeping the stronger photographs tending toward the front. */
const ORDER_JITTER = 0.8;

const app = {
  temples: [],
  slides: [],
  byId: new Map(),
  order: [],
  paused: false,
  cursor: 0,
};

/* ------------------------------------------------------------------ setup */

async function boot() {
  const [data, land] = await Promise.all([
    fetch("./assets/temples.json").then((r) => r.json()),
    fetch("./assets/land.json").then((r) => r.json()),
  ]);

  app.temples = data.temples;
  app.temples.forEach((t) => app.byId.set(t.id, t));

  // One entry per photograph, carrying its temple along. Everything downstream
  // works in slides, because a temple with two good photographs should get two
  // turns and a temple with one should get one.
  app.slides = [];
  for (const t of app.temples) {
    for (const image of t.slides) app.slides.push({ temple: t, image });
  }
  buildOrder();

  const pins = app.temples
    .filter((t) => Number.isFinite(t.lat))
    .map((t) => ({ lat: t.lat, lon: t.lon }));

  const ribbon = new Ribbon(document.getElementById("ribbon"), app.temples);
  const globe = new Globe(document.getElementById("miniglobe"), land, {
    fill: 0.92, pins, arcs: false, graticule: false,
  });
  globe.spin = 1.4;

  const ctx = {
    ribbon,
    globe,
    miniglobe: document.getElementById("miniglobe"),
    setPalette, setCredit,
    more: () => {
      const slides = take(BATCH);
      preload(slides);
      return slides;
    },
  };

  const show = new Slideshow(ctx);
  Object.assign(app, { ribbon, globe, show, ctx });

  // Warm the first few so the opening slide does not bloom onto an empty box.
  await preload(app.order.slice(0, 3));

  window.addEventListener("resize", onResize);
  onResize();

  document.getElementById("boot").classList.add("gone");
  document.getElementById("piece-title").classList.add("show");
  requestAnimationFrame(frame);
  show.start();

  connectFootron(app);
}

function onResize() {
  app.globe.resize();
  app.ribbon.resize();
}

/* --------------------------------------------------------------- the loop */

function frame(now) {
  requestAnimationFrame(frame);
  if (app.paused) return;
  app.globe.draw(now);
  app.ribbon.draw(now);
}

/* ------------------------------------------------------------- selection */

/* Walk the whole corpus rather than sampling it, so over a long dwell the wall
 * works through every temple instead of orbiting the same favourites. The
 * ordering is fixed once at load (see buildOrder), and this is a cursor into it
 * that wraps. */
function take(n) {
  const out = [];
  for (let i = 0; i < n && app.order.length; i++) {
    out.push(app.order[app.cursor % app.order.length]);
    app.cursor++;
  }
  return out;
}

/* Build the running order once per load. Three competing goals: show the best
 * photographs, never show six pictures of Utah in a row, and do not show every
 * visitor the same opening.
 *
 * That last one matters more than it looks. The wall gives an experience about
 * five minutes, which is some thirty slides out of two hundred, so a strictly
 * deterministic order would mean the same thirty temples every single time and
 * the other one hundred and seventy would be seen by almost nobody. Scores are
 * therefore jittered before sorting: the order differs on every boot, while a
 * better photograph is still likelier to come early. The round-robin deal by
 * country then guarantees the sequence travels whatever the shuffle did. */
function buildOrder() {
  const byCountry = new Map();
  const shuffled = app.slides
    .map((s) => ({ s, key: s.image.aesthetic + (Math.random() - 0.5) * ORDER_JITTER }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.s);
  for (const s of shuffled) {
    const k = s.temple.country || "—";
    if (!byCountry.has(k)) byCountry.set(k, []);
    byCountry.get(k).push(s);
  }
  // The countries are dealt in a random order too, not biggest-first. Dealing
  // them in a fixed order made the *pictures* differ between boots while the
  // rhythm stayed identical — always America, then Mexico, then Canada, then
  // Brazil — which is the sort of thing nobody notices once and everybody
  // notices on the fourth visit.
  const groups = [...byCountry.values()];
  for (let i = groups.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [groups[i], groups[j]] = [groups[j], groups[i]];
  }
  const order = [];
  let dealt = true;
  while (dealt) {
    dealt = false;
    for (const g of groups) {
      if (g.length) { order.push(g.shift()); dealt = true; }
    }
  }
  app.order = order;
}

/* --------------------------------------------------------------- chrome */

function setPalette(pal) {
  if (!pal || !pal.length) return;
  const root = document.documentElement.style;
  root.setProperty("--glow", pal[0]);
  root.setProperty("--glow-2", pal[1] || pal[0]);
  root.setProperty("--glow-3", pal[2] || pal[1] || pal[0]);
}

/* The two sources are used on different terms, so they are credited
 * differently rather than being given one house format that would imply the
 * Church's photographs are freely licensed like the rest. */
function setCredit(image) {
  const el = document.getElementById("credit");
  const who = (image.credit || "").replace(/\s+/g, " ").trim();
  const parts = image.from === "church"
    ? [image.title.replace(/^Church Media:\s*/, ""),
       "© Intellectual Reserve, Inc.",
       "churchofjesuschrist.org"]
    : [image.title.replace(/^File:/, ""),
       who ? `© ${who}` : null,
       image.license,
       "via Wikimedia Commons"];
  el.textContent = parts.filter(Boolean).join("  ·  ");
  el.classList.add("show");
}

/* -------------------------------------------------------------- preload */

const warmed = new Set();

function preload(slides) {
  return Promise.all(slides.map((s) => {
    if (warmed.has(s.image.src)) return Promise.resolve();
    warmed.add(s.image.src);
    const img = new Image();
    img.src = s.image.src;
    // decode() resolves once the bitmap is ready, which is the difference
    // between a slide that blooms and one that blooms onto an empty box.
    return (img.decode ? img.decode() : Promise.resolve()).catch(() => {});
  }));
}

boot().catch((e) => {
  document.querySelector(".boot-text").textContent = "Could not load the temple data.";
  console.error(e);
});

export { app };
