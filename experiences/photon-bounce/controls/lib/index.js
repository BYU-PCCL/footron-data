/** @jsxImportSource @emotion/react */
// Phone controls panel for Photon Bounce.
//
// This file is compiled by footron-data's build-controls CI job against a
// checkout of BYU-PCCL/footron-web, so it can only import what that repo
// provides: react, @footron/controls-client, @material-ui/core, and
// @emotion/react. Do not add a package.json next to it — the build copies
// controls/lib verbatim, and footron-web's eslint config (react/prop-types is
// an error there) lints it, so components take no props.
//
// FILENAME: this source is .jsx so the local harness in ../src can bundle it
// with no special plugin config, but footron deploys it as index.js -- the
// packaging step renames it. footron-web compiles JSX in .js happily; Vite
// does not, and fighting that was not worth the plumbing.
//
// This is the ONLY implementation of the panel. ../src is a thin local
// harness that renders this same file against the bundled dev relay, so what
// is developed and viewport-tested here is exactly what ships.
//
// Protocol (keep in sync with experience/messages.js in the app repo):
//
//   phone -> wall:  { type: "move",  x: 0..1, y: 0..1, h: 0..1 }
//   wall  -> phone: { type: "stats", samples, paths }
//
// `y` is depth into the room, not screen height — it is named for the wire
// field. `h` is the lamp's height, driven by the slider.
import { css } from "@emotion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMessaging } from "@footron/controls-client";

const THROTTLE_MS = 33;

// Room dimensions, mirrored from experience/config.js ROOM.MAX / MARGIN. The
// pad is a true plan view, so these are the numbers shown to the visitor.
const ROOM_W = 4.0;
const ROOM_D = 3.6;
const ROOM_H = 3.0;
const ROOM_MARGIN = 0.15;

// Matches experience/ui.js setMeter() exactly, so the phone and the wall show
// the same fill for the same sample count.
const meterFrac = (samples) =>
  Math.min(1, Math.log2(1 + samples) / Math.log2(1 + 1024));

// Cosmetic furniture footprints (room is 4 x 3.6 in x/z), drawn on the pad.
const FOOTPRINTS = [
  { x: 0.15 / 4, z: 0.5 / 3.6, w: 1.3 / 4, d: 1.1 / 3.6, label: "desk" },
  { x: 2.6 / 4, z: 0.0 / 3.6, w: 1.3 / 4, d: 0.35 / 3.6, label: "shelf" },
  { x: 2.55 / 4, z: 0.55 / 3.6, w: 0.9 / 4, d: 0.8 / 3.6, label: "chair" },
  { x: 1.55 / 4, z: 0.45 / 3.6, w: 1.6 / 4, d: 1.2 / 3.6, label: "rug" },
];

const accent = "#e8a765";
const blueprint = "143, 184, 216";
const bg = "#0a0a12";
const inkStrong = "rgba(255,255,255,0.85)";
const ink = "rgba(255,255,255,0.55)";
const inkFaint = "rgba(255,255,255,0.38)";
const TOUCH = 44; // minimum comfortable touch target, in px

const panelStyle = css`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 16px;
  gap: 14px;
  background: ${bg};
  color: ${inkStrong};
  font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  touch-action: none;

  header h1 {
    font-size: 20px;
    font-weight: 600;
    font-variant-caps: small-caps;
    letter-spacing: 0.16em;
    margin: 0;
  }
  header .sub {
    font-size: 13px;
    color: ${ink};
    margin: 3px 0 0;
  }

  /* The row must NOT grow: its height comes from the pad's aspect ratio, and
     the height column stretches to match. Giving the row flex:1 would make the
     row height definite, and aspect-ratio would then resolve the pad's WIDTH
     from that height — which is exactly the bug that made this panel unusable
     on a phone, blowing the pad out to 761px inside a 350px column. */
  .plan-row {
    display: flex;
    gap: 12px;
    align-items: stretch;
    margin-top: auto;
  }

  .pad {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
    aspect-ratio: 4 / 3.6;
    background: rgba(${blueprint}, 0.05);
    border: 1px solid rgba(${blueprint}, 0.35);
    border-radius: 10px;
    touch-action: none;
  }
  /* Corner registration ticks — plan-drawing vernacular, and they mark the
     draggable area's true extent, which the rounded border alone blurs. */
  .pad::before,
  .pad::after {
    content: "";
    position: absolute;
    width: 14px;
    height: 14px;
    border: 1px solid rgba(${blueprint}, 0.55);
    pointer-events: none;
  }
  .pad::before {
    top: 6px;
    left: 6px;
    border-right: 0;
    border-bottom: 0;
  }
  .pad::after {
    bottom: 6px;
    right: 6px;
    border-left: 0;
    border-top: 0;
  }

  .footprint {
    position: absolute;
    border: 1px solid rgba(${blueprint}, 0.3);
    border-radius: 3px;
    background: rgba(${blueprint}, 0.05);
    pointer-events: none;
    overflow: hidden;
  }
  /* Labels sit at each footprint's top-left, the way a plan drawing tags a
     space. Centring them stacks the chair's label on the rug's, since the
     chair footprint sits inside the rug's. */
  .footprint span {
    position: absolute;
    top: 3px;
    left: 5px;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(${blueprint}, 0.6);
    white-space: nowrap;
  }

  .lamp-dot {
    position: absolute;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      #ffe0b0 0%,
      ${accent} 55%,
      rgba(232, 167, 101, 0) 100%
    );
    box-shadow: 0 0 24px 6px rgba(232, 167, 101, 0.45);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .height-col {
    flex: 0 0 ${TOUCH}px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .height-cap {
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${inkFaint};
  }
  /* Visible track is a 4px hairline; the input itself is 44px wide so the grab
     region clears the minimum touch target without a fat-looking rail. */
  .height {
    -webkit-appearance: none;
    appearance: none;
    writing-mode: vertical-lr;
    direction: rtl; /* top of travel = ceiling */
    flex: 1;
    width: ${TOUCH}px;
    margin: 0;
    background: transparent;
  }
  .height::-webkit-slider-runnable-track {
    width: 4px;
    height: 100%;
    border-radius: 2px;
    background: rgba(${blueprint}, 0.25);
  }
  .height::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    border: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-left: -10px; /* centre the 24px thumb on the 4px track */
    background: radial-gradient(circle, #ffe0b0 0%, ${accent} 60%, #c2854b 100%);
    box-shadow: 0 0 14px 3px rgba(232, 167, 101, 0.4);
  }
  .height::-moz-range-track {
    width: 4px;
    border-radius: 2px;
    background: rgba(${blueprint}, 0.25);
  }
  .height::-moz-range-thumb {
    border: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: ${accent};
    box-shadow: 0 0 14px 3px rgba(232, 167, 101, 0.4);
  }
  .height:focus-visible {
    outline: 2px solid ${accent};
    outline-offset: 3px;
  }

  .plan-note {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: ${inkFaint};
  }
  .plan-note .cap {
    text-transform: uppercase;
  }
  .plan-note .h-read {
    font-variant-numeric: tabular-nums;
    color: ${ink};
  }

  /* Mirrors the wall's convergence meter so the phone and the wall read as one
     instrument. The reset — the counter collapsing when the lamp moves — is
     the exhibit's whole lesson, so it gets the most prominent number here. */
  .meter {
    margin-bottom: auto;
  }
  .meter-label {
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${inkFaint};
    margin-bottom: 6px;
  }
  .meter-count {
    font-size: 30px;
    font-weight: 300;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.01em;
    color: ${inkStrong};
  }
  .meter-bar {
    height: 4px;
    margin-top: 12px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.12);
    overflow: hidden;
  }
  .meter-fill {
    height: 100%;
    border-radius: 2px;
    background: ${accent};
    box-shadow: 0 0 10px rgba(232, 167, 101, 0.45);
    transition: width 400ms ease;
  }
  .meter-status {
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.35;
    color: ${ink};
    min-height: 2.7em;
    transition: opacity 300ms ease;
  }

  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${inkFaint};
  }

  /* Grouping wrappers are inert in portrait — the column lays out their
     children directly — and become real columns in the landscape rule below. */
  .left,
  .right {
    display: contents;
  }

  /* Landscape phones: height is the scarce axis, so the pad is driven from its
     height and aspect-ratio derives the width — the reverse of the rule above. */
  @media (orientation: landscape) and (max-height: 560px) {
    flex-direction: row;
    gap: 16px;
    align-items: stretch;
    padding: 12px;

    .left,
    .right {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }
    .left {
      flex: 1 1 auto;
    }
    .right {
      flex: 0 0 42%;
    }
    .plan-row {
      flex: 1 1 auto;
      min-height: 0;
      margin-top: 0;
      justify-content: flex-start;
    }
    .pad {
      height: 100%;
      width: auto;
      flex: 0 1 auto;
      max-width: 100%;
    }
    .meter {
      margin-bottom: 0;
    }
    .meter-count {
      font-size: 24px;
    }
    .meter-status {
      min-height: 0;
    }
    header h1 {
      font-size: 17px;
    }
    header .sub {
      font-size: 12px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .meter-fill,
    .meter-status {
      transition: none;
    }
  }
`;

const ControlsComponent = () => {
  const [pos, setPos] = useState({ x: 0.25, y: 0.28, h: 0.45 });
  const [paths, setPaths] = useState(0);
  const [samples, setSamples] = useState(0);
  const [restarted, setRestarted] = useState(false);
  const [restartMine, setRestartMine] = useState(false);

  const lastSent = useRef(0);
  const trailing = useRef(null);
  const pending = useRef(null);
  const prevSamples = useRef(0);
  const restartTimer = useRef(null);

  const { sendMessage } = useMessaging((message) => {
    if (!message || message.type !== "stats") return;
    setPaths(message.paths);
    setSamples(message.samples);
    // The accumulator restarting is the exhibit's core lesson, and the phone
    // is where the visitor is looking when they cause it. Surface it: a large
    // drop in the sample count means the wall threw its image away.
    if (message.samples < prevSamples.current / 2) {
      // The attract loop also moves the lamp. Only claim the visitor caused
      // the restart if they sent a move just before it.
      setRestartMine(Date.now() - lastSent.current < 1500);
      setRestarted(true);
      if (restartTimer.current !== null) clearTimeout(restartTimer.current);
      restartTimer.current = setTimeout(() => setRestarted(false), 2600);
    }
    prevSamples.current = message.samples;
  });

  useEffect(
    () => () => {
      if (trailing.current !== null) clearTimeout(trailing.current);
      if (restartTimer.current !== null) clearTimeout(restartTimer.current);
    },
    []
  );

  // Leading+trailing throttle: fires immediately if outside the window,
  // otherwise stashes the latest position and schedules exactly one trailing
  // send for the remaining time. Repeated calls within the window update the
  // pending position but do NOT push the timer back, so a continuous drag
  // delivers ~1 message per THROTTLE_MS instead of collapsing into a single
  // send at drag start and end.
  const sendMove = useCallback(
    (p) => {
      pending.current = p;
      const now = Date.now();
      const elapsed = now - lastSent.current;
      if (elapsed >= THROTTLE_MS) {
        if (trailing.current !== null) {
          clearTimeout(trailing.current);
          trailing.current = null;
        }
        const toSend = pending.current;
        pending.current = null;
        lastSent.current = now;
        sendMessage({ type: "move", x: toSend.x, y: toSend.y, h: toSend.h });
      } else if (trailing.current === null) {
        trailing.current = setTimeout(() => {
          trailing.current = null;
          const toSend = pending.current;
          pending.current = null;
          if (toSend) {
            lastSent.current = Date.now();
            sendMessage({ type: "move", x: toSend.x, y: toSend.y, h: toSend.h });
          }
        }, THROTTLE_MS - elapsed);
      }
    },
    [sendMessage]
  );

  const onPad = useCallback(
    (e) => {
      if (e.buttons === 0 && e.type !== "pointerdown") return;
      if (e.type === "pointerdown") {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) {
          /* no active pointer to capture — ignore */
        }
      }
      const r = e.currentTarget.getBoundingClientRect();
      const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
      const x = clamp((e.clientX - r.left) / r.width);
      const z = clamp((e.clientY - r.top) / r.height);
      setPos((p) => {
        const np = { x: x, y: z, h: p.h };
        sendMove(np);
        return np;
      });
    },
    [sendMove]
  );

  const onHeight = useCallback(
    (e) => {
      const h = Number(e.target.value);
      setPos((p) => {
        const np = { x: p.x, y: p.y, h: h };
        sendMove(np);
        return np;
      });
    },
    [sendMove]
  );

  // Height in metres, clamped the way the experience clamps it.
  const heightM = Math.min(
    ROOM_H - ROOM_MARGIN,
    Math.max(ROOM_MARGIN, pos.h * ROOM_H)
  );

  const status = restarted
    ? restartMine
      ? "You moved the light, so the wall threw its image away and started over."
      : "The light moved, so the wall threw its image away and started over."
    : samples > 0
    ? "Every path is one ray of light traced through the room."
    : "Drag the lamp to light the room.";

  return (
    <div css={panelStyle}>
      <div className="left">
        <header>
          <h1>Photon Bounce</h1>
          <p className="sub">Drag the lamp &mdash; watch the wall</p>
        </header>

        <div className="plan-row">
          <div className="pad" onPointerDown={onPad} onPointerMove={onPad}>
            {FOOTPRINTS.map((f) => (
              <div
                key={f.label}
                className="footprint"
                style={{
                  left: `${f.x * 100}%`,
                  top: `${f.z * 100}%`,
                  width: `${f.w * 100}%`,
                  height: `${f.d * 100}%`,
                }}
              >
                <span>{f.label}</span>
              </div>
            ))}
            <div
              className="lamp-dot"
              style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
            />
          </div>
          <div className="height-col">
            <span className="height-cap">Ceil</span>
            <input
              className="height"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={pos.h}
              onChange={onHeight}
              aria-label={`Lamp height, ${heightM.toFixed(1)} metres`}
            />
            <span className="height-cap">Floor</span>
          </div>
        </div>

        <div className="plan-note">
          <span>
            {ROOM_W.toFixed(1)} &times; {ROOM_D.toFixed(1)} m{" "}
            <span className="cap">&mdash; plan view</span>
          </span>
          <span className="h-read">
            {heightM.toFixed(1)} m <span className="cap">high</span>
          </span>
        </div>
      </div>

      <div className="right">
        <div className="meter">
          <div className="meter-label">Light paths traced</div>
          <div className="meter-count">{paths.toLocaleString()}</div>
          <div className="meter-bar">
            <div
              className="meter-fill"
              style={{ width: `${meterFrac(samples) * 100}%` }}
            />
          </div>
          <p className="meter-status">{status}</p>
        </div>

        <footer>
          <span>Study &mdash; dusk</span>
        </footer>
      </div>
    </div>
  );
};

export default ControlsComponent;
