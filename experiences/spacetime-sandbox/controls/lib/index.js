/** @jsxImportSource @emotion/react */
// Phone controls panel for Spacetime Sandbox.
//
// This file is compiled by footron-data's build-controls CI job against a
// checkout of BYU-PCCL/footron-web, so it can only import what that repo
// provides: react, @footron/controls-client, @material-ui/core, and
// @emotion/react. Do not add a package.json next to it — the build copies
// controls/lib verbatim, and footron-web's eslint config (react/prop-types is
// an error there) lints it, so components take no props.
//
// Protocol (keep in sync with src/input/phone.ts in the app repo):
//
//   { type: "pointer", action: "down" | "move" | "up", x, z }
//   { type: "place", kind: "star" | "hole" | "clock" }
//   { type: "throw", kind: "asteroid" | "photon" }
//   { type: "mass", dial: 0..1 }
//   { type: "clear" }
//
// and the wall sends back, ten times a second:
//
//   { type: "plate", bodies: [{k, x, z, r, s}], clocks: [{x, z, far}], sid, dial }
//
// which is what the pad draws. Without it a visitor is judging the plate by
// looking up at the wall and guessing where their finger corresponds to, which
// is not a control surface. Positions come already in pad coordinates, so this
// file still needs none of the exhibit's constants. It is a map, not the
// controls: if it never arrives the panel works exactly as it did.
//
// The pad is a plan view of the plate — the disc from directly above, already
// turned to match the wall, so a point here is a point there. Coordinates go
// over the wire normalised to ±1, which is why this file needs to know none of
// the exhibit's constants and nothing at all about its camera.
//
// One rule carries the whole panel: a tap places, a drag throws. Both switches
// below are always live, so there is no mode in which a gesture does nothing —
// and the controls sit at the bottom because footron-web frames this between a
// 64px header and a 64px footer, and the visitor is looking at the wall, not
// at their hand.
import { css, Global } from "@emotion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import Button from "@material-ui/core/Button";

// The plate's own palette: silver ruling staining to ember as it descends,
// which is the gravitational redshift, and one measure red for a quantity a
// visitor has chosen or can read off.
const plate = "#0b0a0c";
const silver = "#c9d2da";
const stain = "#c08a4e";
const ember = "#7a2e1e";
const cream = "#f2ede3";
const measure = "#d6453c";
const line = "rgba(201, 210, 218, 0.16)";
const dim = "rgba(242, 237, 227, 0.44)";

/** Bodies may sit inside this fraction of the pad; outside it is launch-only. */
const PLACE = 88 / 143;
/** Moves are throttled to about 30Hz, with the last point always flushed. */
const MOVE_MS = 33;
/** How long the "sent" pulse lasts: just long enough to cover the round trip
 *  before the wall's own mirror shows the thing that was placed. */
const GHOST_MS = 700;

/**
 * What you can do, one thing at a time.
 *
 * A visitor arrives mid-exhibit with no idea what the pad is, and a wall of
 * instructions is not something anyone reads standing up. So they come round
 * one at a time and fade, which is also what stops this line competing with
 * the plate for attention. Every one of them is an action, not a fact -- the
 * physics is the wall's to tell.
 */
const TIPS = [
  "Tap the plate to drop a star.",
  "Drag anywhere to throw something past it.",
  "Drag a star to move it.",
  "Tap a star, then turn the dial to set its mass.",
  "Start a drag out at the rim for a long approach.",
  "Stand a clock and watch it fall behind.",
  "Throw light: it bends twice as far as matter.",
];
/** How long each tip holds, and how long the cross-fade takes. */
const TIP_MS = 5200;
const FADE_MS = 600;

// The mass dial, as the wall computes it: logarithmic, because the range spans
// ten orders of magnitude and a linear dial is the Moon for its whole travel
// and then a neutron star in the last hair's breadth.
const MIN_C = 6.28e-11;
const MAX_C = 0.6;
const LOG_MIN = Math.log10(MIN_C);
const LOG_MAX = Math.log10(MAX_C);
const ANCHORS = [
  { label: "the Moon", c: 6.28e-11 },
  { label: "the Earth", c: 1.392e-9 },
  { label: "the Sun", c: 4.244e-6 },
  { label: "a white dwarf", c: 5.15e-4 },
  { label: "a neutron star", c: 0.376 },
];

const compactnessAt = (t) => Math.pow(10, LOG_MIN + (LOG_MAX - LOG_MIN) * t);
const dialFor = (c) => (Math.log10(c) - LOG_MIN) / (LOG_MAX - LOG_MIN);

function describeDial(t) {
  const c = compactnessAt(t);
  if (c > ANCHORS[ANCHORS.length - 1].c * 1.3) return "past a neutron star";
  let best = ANCHORS[0];
  let gap = Infinity;
  for (const anchor of ANCHORS) {
    const d = Math.abs(Math.log10(c) - Math.log10(anchor.c));
    if (d < gap) {
      gap = d;
      best = anchor;
    }
  }
  return best.label;
}

const buzz = (ms) => {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch (err) {
    // Not every phone has it, and none of them need it.
  }
};

const pageStyle = css`
  body {
    background: ${plate};
  }
`;

const containerStyle = css`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* fill to the footer: header (64) + footer clearance (64). The dvh line wins
     on browsers that know it and tracks the visible viewport as chrome hides. */
  min-height: calc(100vh - 128px);
  min-height: calc(100dvh - 128px);
  background: ${plate};
  color: ${cream};
  font-family: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;

  .top {
    padding: 14px 16px 10px;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .mast {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }
  .mast .title {
    font-family: "Zilla Slab", Georgia, serif;
    font-size: 17px;
    letter-spacing: 0.04em;
    color: ${cream};
  }
  .mast .live {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 9.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${dim};
  }
  .mast .live i {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-right: 7px;
    border-radius: 50%;
    background: ${stain};
    box-shadow: 0 0 8px ${stain};
    animation: ss-breathe 2.4s ease-in-out infinite;
  }
  @keyframes ss-breathe {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.9; }
  }
  /* One thing you can do, fading in and out. Quiet: measure red is spent on
     quantities and nothing else, and this is chatter, not a reading. */
  .say {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    letter-spacing: 0.02em;
    color: ${dim};
    min-height: 16px;
    transition: opacity ${FADE_MS}ms ease;
  }
  .say.out {
    opacity: 0;
  }

  /* the pad takes what is left between the masthead and the dock */
  .pad {
    flex: 1 1 auto;
    min-height: 180px;
    position: relative;
  }
  .pad canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  .dock {
    border-top: 1px solid ${line};
    padding: 11px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 11px;
  }

  .dial .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${dim};
    margin-bottom: 3px;
  }
  .dial .head b {
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    font-size: 12.5px;
    font-weight: 500;
    letter-spacing: 0.01em;
    text-transform: none;
    color: ${cream};
  }
  .dial .track {
    position: relative;
    height: 38px;
    touch-action: none;
    cursor: pointer;
  }
  .dial .bar,
  .dial .fill {
    position: absolute;
    top: 18px;
    height: 2px;
  }
  .dial .bar {
    left: 0;
    right: 0;
    background: rgba(201, 210, 218, 0.28);
  }
  .dial .fill {
    left: 0;
    background: ${stain};
  }
  .dial .knob {
    position: absolute;
    top: 8px;
    width: 22px;
    height: 22px;
    margin-left: -11px;
    border-radius: 50%;
    background: ${stain};
    box-shadow: 0 0 0 5px rgba(192, 138, 78, 0.18);
  }

  .segs {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 9px;
  }
  .seg .lab {
    display: block;
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${dim};
    margin-bottom: 5px;
  }
  .seg .cells {
    display: flex;
    border: 1px solid ${line};
  }

  button {
    border: 0;
    border-radius: 0;
    background: transparent;
    color: ${dim};
    font-family: "IBM Plex Sans", system-ui, sans-serif;
    text-transform: none;
    transition: background 120ms, color 120ms;
  }
  .seg button {
    flex: 1 1 0;
    min-width: 0;
    min-height: 64px;
    border-right: 1px solid ${line};
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 10px;
    letter-spacing: 0.02em;
    line-height: 1.1;
  }
  .seg button:last-of-type {
    border-right: 0;
  }
  .seg button .glyph {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 15px;
    color: ${silver};
  }
  .seg button.on {
    background: rgba(192, 138, 78, 0.14);
    color: ${cream};
  }
  .seg button.on .glyph {
    color: ${stain};
  }

  button.clear {
    min-height: 54px;
    border: 1px solid ${line};
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
`;

const PLACES = [
  { kind: "star", label: "Star", glyph: "●" },
  { kind: "hole", label: "Hole", glyph: "◉" },
  { kind: "clock", label: "Clock", glyph: "◷" },
];

const THROWS = [
  { kind: "asteroid", label: "Asteroid", glyph: "·" },
  { kind: "photon", label: "Light", glyph: "/" },
];

const ControlsComponent = () => {
  const [place, setPlace] = useState("star");
  const [thrown, setThrown] = useState("asteroid");
  const [dial, setDial] = useState(dialFor(0.376));
  const [tip, setTip] = useState(0);
  const [tipShown, setTipShown] = useState(true);

  const canvasRef = useRef(null);
  // Kept in refs, not state: these change every animation frame while a finger
  // is down, and re-rendering the whole panel for each one would make the pad
  // feel exactly as laggy as it must not.
  const gestureRef = useRef(null);
  const ghostsRef = useRef([]);
  // What the wall says is on the plate. A ref, not state: it arrives ten times
  // a second and only the canvas cares.
  const plateRef = useRef(null);
  const geomRef = useRef({ cx: 0, cy: 0, r: 1 });
  const lastSentRef = useRef(0);
  const pendingRef = useRef(null);
  const placeRef = useRef(place);
  // Null rather than a no-op: footron-web's eslint refuses an empty function,
  // and the ref is assigned on every render before the frame loop starts.
  const drawRef = useRef(null);

  placeRef.current = place;

  // Which star the wall says is chosen. Choosing a different one brings the
  // dial to that star's own mass, so the next nudge continues from where it
  // is rather than jumping it to wherever the last star was left.
  const chosenRef = useRef(null);

  const { sendMessage } = useMessaging((message) => {
    if (!message || message.type !== "plate") return;
    plateRef.current = message;
    if (message.sid !== undefined && message.sid !== chosenRef.current) {
      chosenRef.current = message.sid;
      if (typeof message.dial === "number") setDial(message.dial);
    }
  });

  const send = useCallback(
    (body) => {
      try {
        return sendMessage(body);
      } catch (err) {
        // A dropped message is a dropped gesture, not a broken panel.
        return undefined;
      }
    },
    [sendMessage]
  );

  // ---- the pad ----------------------------------------------------------

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 14;
    geomRef.current = { cx, cy, r };

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = plate;
    ctx.fillRect(0, 0, w, h);

    // the launch annulus, dashed: a shot may start out here, a body may not
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(201, 210, 218, 0.03)";
    ctx.fill();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = "rgba(201, 210, 218, 0.22)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // the emulsion
    ctx.beginPath();
    ctx.arc(cx, cy, r * PLACE, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(201, 210, 218, 0.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(201, 210, 218, 0.3)";
    ctx.stroke();

    // the reseau, so the pad reads as the same instrument as the wall
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r * PLACE * i) / 4.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(201, 210, 218, 0.12)";
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.1, cy + Math.sin(a) * r * 0.1);
      ctx.lineTo(cx + Math.cos(a) * r * PLACE, cy + Math.sin(a) * r * PLACE);
      ctx.strokeStyle = "rgba(201, 210, 218, 0.09)";
      ctx.stroke();
    }

    // whichever way is "towards you" on the wall
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, Math.PI * 0.32, Math.PI * 0.68);
    ctx.strokeStyle = "rgba(192, 138, 78, 0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgba(242, 237, 227, 0.38)";
    ctx.font = "9px 'IBM Plex Mono', ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("NEAR EDGE", cx, Math.min(h - 5, cy + r - 8));

    // What is actually on the plate, as the wall last described it. This is
    // the authoritative picture; everything below it is only feedback.
    const plate = plateRef.current;
    if (plate) {
      for (const body of plate.bodies) {
        const bx = cx + body.x * r;
        const by = cy - body.z * r;
        const br = Math.max(5, body.r * r);
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, br * 3.4);
        glow.addColorStop(0, body.k === "hole" ? "rgba(122, 46, 30, 0.5)" : "rgba(192, 138, 78, 0.45)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(bx, by, br * 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fillStyle = body.k === "hole" ? "#000" : cream;
        ctx.fill();
        if (body.s) {
          // the one the dial is about
          ctx.beginPath();
          ctx.arc(bx, by, br + 7, 0, Math.PI * 2);
          ctx.strokeStyle = stain;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.lineWidth = 1;
        }
        if (body.k === "hole") {
          // its surface is its horizon, and the ring outside it the photon sphere
          ctx.strokeStyle = "rgba(192, 138, 78, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      }
      for (const clock of plate.clocks) {
        const gx = cx + clock.x * r;
        const gy = cy - clock.z * r;
        ctx.beginPath();
        ctx.arc(gx, gy, 6, 0, Math.PI * 2);
        ctx.strokeStyle = clock.far ? "rgba(242, 237, 227, 0.45)" : "rgba(242, 237, 227, 0.85)";
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx, gy - 4);
        ctx.strokeStyle = measure;
        ctx.stroke();
      }
    }

    // The "sent" pulse. It covers the round trip and then gets out of the way,
    // so it is a ring that opens and fades rather than an object: the mirror
    // above is what says where things are.
    const now = performance.now();
    const ghosts = ghostsRef.current;
    for (let i = ghosts.length - 1; i >= 0; i--) {
      const age = (now - ghosts[i].at) / GHOST_MS;
      if (age >= 1) {
        ghosts.splice(i, 1);
        continue;
      }
      const gx = cx + ghosts[i].x * r;
      const gy = cy - ghosts[i].z * r;
      ctx.beginPath();
      ctx.arc(gx, gy, 6 + age * 22, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(192, 138, 78, " + (1 - age) + ")";
      ctx.stroke();
    }

    // the finger, echoed locally so the gesture never waits on the network
    const gesture = gestureRef.current;
    if (gesture) {
      const ox = cx + gesture.x0 * r;
      const oy = cy - gesture.z0 * r;
      const tx = cx + gesture.x * r;
      const ty = cy - gesture.z * r;
      if (gesture.dragging) {
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = measure;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fillStyle = measure;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(tx, ty, 11, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(242, 237, 227, 0.85)";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = cream;
      ctx.fill();
    }
  }, []);

  drawRef.current = draw;

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      if (drawRef.current) drawRef.current();
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // The tips come round on their own. Fade out, swap, fade in -- so the line
  // never jumps from one sentence to another under a reader's eye.
  useEffect(() => {
    let swap = 0;
    const hold = window.setInterval(() => {
      setTipShown(false);
      swap = window.setTimeout(() => {
        setTip((i) => (i + 1) % TIPS.length);
        setTipShown(true);
      }, FADE_MS);
    }, TIP_MS);
    return () => {
      window.clearInterval(hold);
      window.clearTimeout(swap);
    };
  }, []);

  const pointAt = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const geom = geomRef.current;
    let x = (event.clientX - rect.left - geom.cx) / geom.r;
    let z = -(event.clientY - rect.top - geom.cy) / geom.r;
    const d = Math.hypot(x, z);
    if (d > 1 && d > 0) {
      x /= d;
      z /= d;
    }
    return { x: x, z: z };
  };

  const onDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = pointAt(event);
    gestureRef.current = { x0: p.x, z0: p.z, x: p.x, z: p.z, dragging: false, moved: 0 };
    lastSentRef.current = 0;
    pendingRef.current = null;
    send({ type: "pointer", action: "down", x: p.x, z: p.z });
  };

  const onMove = (event) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    const p = pointAt(event);
    gesture.x = p.x;
    gesture.z = p.z;
    gesture.moved = Math.max(gesture.moved, Math.hypot(p.x - gesture.x0, p.z - gesture.z0));
    // The wall decides what counts as a drag; this is only about when to draw
    // an aim line, so it can afford to be roughly the same number.
    gesture.dragging = gesture.moved > 0.03;

    const now = performance.now();
    if (now - lastSentRef.current >= MOVE_MS) {
      lastSentRef.current = now;
      pendingRef.current = null;
      send({ type: "pointer", action: "move", x: p.x, z: p.z });
    } else {
      pendingRef.current = p;
    }
  };

  const onUp = (event) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    const p = pointAt(event);
    // Always flush the last point before the release: a throttle that drops it
    // aims the shot at wherever the finger happened to be 30ms earlier.
    if (pendingRef.current) send({ type: "pointer", action: "move", x: p.x, z: p.z });
    pendingRef.current = null;
    send({ type: "pointer", action: "up", x: p.x, z: p.z });

    if (gesture.moved <= 0.03) {
      const kind = placeRef.current;
      const inside = Math.hypot(p.x, p.z);
      const at = inside > PLACE ? { x: (p.x / inside) * PLACE, z: (p.z / inside) * PLACE } : p;
      ghostsRef.current.push({ x: at.x, z: at.z, kind: kind, at: performance.now() });
      if (ghostsRef.current.length > 6) ghostsRef.current.shift();
      buzz(12);
    } else {
      buzz(18);
    }
    gestureRef.current = null;
  };

  const onCancel = () => {
    gestureRef.current = null;
    pendingRef.current = null;
    send({ type: "pointer", action: "up", x: 0, z: 0 });
  };

  // ---- the dial ----------------------------------------------------------

  const trackRef = useRef(null);

  const setFromEvent = useCallback(
    (event) => {
      const rect = trackRef.current.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      setDial(t);
      send({ type: "mass", dial: t });
    },
    [send]
  );

  const onDialDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setFromEvent(event);
  };
  const onDialMove = (event) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    setFromEvent(event);
  };

  // ---- the switches ------------------------------------------------------

  const choosePlace = (kind) => {
    setPlace(kind);
    send({ type: "place", kind: kind });
  };

  const chooseThrow = (kind) => {
    setThrown(kind);
    send({ type: "throw", kind: kind });
  };

  const clear = () => {
    send({ type: "clear" });
    ghostsRef.current = [];
    // Do not wait for the next mirror to stop drawing what was just swept off.
    plateRef.current = null;
    buzz(24);
  };

  return (
    <div css={containerStyle}>
      <Global styles={pageStyle} />

      <div className="top">
        <div className="mast">
          <span className="title">Spacetime Sandbox</span>
          <span className="live">
            <i />
            live
          </span>
        </div>
        <div className={tipShown ? "say" : "say out"}>{TIPS[tip]}</div>
      </div>

      <div className="pad">
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
        />
      </div>

      <div className="dock">
        <div className="dial">
          <div className="head">
            <span>Mass</span>
            <b>{describeDial(dial)}</b>
          </div>
          <div
            className="track"
            ref={trackRef}
            onPointerDown={onDialDown}
            onPointerMove={onDialMove}
          >
            <div className="bar" />
            <div className="fill" style={{ width: (dial * 100).toFixed(2) + "%" }} />
            <div className="knob" style={{ left: (dial * 100).toFixed(2) + "%" }} />
          </div>
        </div>

        <div className="segs">
          <div className="seg">
            <span className="lab">Tap to place</span>
            <div className="cells">
              {PLACES.map((item) => (
                <Button
                  key={item.kind}
                  type="button"
                  disableRipple
                  className={item.kind === place ? "on" : ""}
                  onClick={() => choosePlace(item.kind)}
                >
                  <span className="glyph">{item.glyph}</span>
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="seg">
            <span className="lab">Drag to throw</span>
            <div className="cells">
              {THROWS.map((item) => (
                <Button
                  key={item.kind}
                  type="button"
                  disableRipple
                  className={item.kind === thrown ? "on" : ""}
                  onClick={() => chooseThrow(item.kind)}
                >
                  <span className="glyph">{item.glyph}</span>
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Button type="button" disableRipple className="clear" onClick={clear}>
          Clear the plate
        </Button>
      </div>
    </div>
  );
};

export default ControlsComponent;
