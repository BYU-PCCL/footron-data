/** @jsxImportSource @emotion/react */
// Phone controls panel for Inside a Neural Network.
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
//   { type: "pen", action: "down" | "move", x: 0..1, y: 0..1 }
//   { type: "pen", action: "up" }
//   { type: "clear" }
//   { type: "brain" }
//
// The visitor finger-draws a digit on the canvas below. Strokes render
// locally for immediate feedback while pen events stream to the wall, which
// replays them through the exact same drawing path its mouse uses. Moves are
// throttled to ~30Hz — the wall interpolates straight segments between
// points, so a digit stays smooth.
import { css } from "@emotion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import Button from "@material-ui/core/Button";

const cool = "#4dbfff";
const warm = "#ffa03d";
const ink = "#050510";
const panel = "#0d1226";
const line = "#273258";
const dim = "#8d97b4";

const MOVE_INTERVAL_MS = 33;

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 14px 26px;
  background: radial-gradient(120% 90% at 50% 0%, #101733 0%, ${ink} 70%);
  border-radius: 14px;

  @keyframes nn-breathe {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.9; }
  }

  .masthead {
    text-align: center;
    padding: 4px 0 2px;
  }
  .masthead .title {
    font-weight: 800;
    font-size: 22px;
    letter-spacing: 0.14em;
    margin-right: -0.14em;
    color: whitesmoke;
    text-shadow: 0 0 18px rgba(77, 191, 255, 0.65), 0 0 40px rgba(77, 191, 255, 0.3);
  }
  .masthead .sub {
    margin-top: 4px;
    font-size: 12px;
    letter-spacing: 0.22em;
    margin-right: -0.22em;
    color: ${dim};
  }
  .masthead .live {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin: 0 8px 1px 0;
    border-radius: 50%;
    background: ${warm};
    box-shadow: 0 0 8px ${warm};
    animation: nn-breathe 2.2s ease-in-out infinite;
  }

  .pad-wrap {
    position: relative;
    width: 100%;
  }
  canvas {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    border: 1px solid ${line};
    border-radius: 14px;
    background: #000;
    touch-action: none;
    box-shadow: inset 0 0 30px rgba(77, 191, 255, 0.08), 0 0 22px rgba(77, 191, 255, 0.12);
  }
  .pad-hint {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
    color: ${dim};
    font-size: 17px;
    letter-spacing: 0.12em;
  }

  .row {
    display: flex;
    gap: 14px;
  }

  button {
    border: 1px solid ${line};
    border-radius: 14px;
    font-weight: bolder;
    color: whitesmoke;
    background-color: ${panel};
    transition: transform 90ms ease, box-shadow 90ms ease;
  }
  button:active {
    transform: scale(0.96);
  }

  button.clear {
    flex: 1;
    height: 64px;
    font-size: 17px;
    letter-spacing: 0.16em;
    color: ${cool};
    border-color: rgba(77, 191, 255, 0.45);
  }
  button.clear:active {
    box-shadow: 0 0 22px rgba(77, 191, 255, 0.35);
  }

  button.brain {
    flex: 1;
    height: 64px;
    font-size: 17px;
    letter-spacing: 0.14em;
    color: ${ink};
    background: linear-gradient(180deg, #ffc57a 0%, ${warm} 55%, #e0862e 100%);
    border-color: ${warm};
    box-shadow: 0 0 24px rgba(255, 160, 61, 0.35);
  }
  button.brain:active {
    box-shadow: 0 0 40px rgba(255, 160, 61, 0.6);
  }

  .foot {
    text-align: center;
    font-size: 12px;
    letter-spacing: 0.14em;
    color: ${dim};
    opacity: 0.8;
  }
`;

const ControlsComponent = () => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const lastSentRef = useRef(0);
  const pendingMoveRef = useRef(null);
  const [hasInk, setHasInk] = useState(false);
  const [status, setStatus] = useState("draw a digit 0–9 — it fires through a real neural net");

  const { sendMessage } = useMessaging(() => {
    // the wall sends nothing the panel needs yet; strokes are fire-and-forget
  });

  const send = useCallback(
    async (body) => {
      await sendMessage(body);
    },
    [sendMessage]
  );

  // Backing resolution follows the CSS square so local strokes stay crisp.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = Math.round(canvas.clientWidth * (window.devicePixelRatio || 1));
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, size, size);
  }, []);

  const toNorm = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    return {
      x: clamp((e.clientX - rect.left) / rect.width),
      y: clamp((e.clientY - rect.top) / rect.height),
    };
  };

  const drawLocal = (from, to) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const s = canvas.width;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = s * 0.07; // matches the wall pad's 20/280 stroke ratio
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x * s, from.y * s);
    ctx.lineTo(to.x * s, to.y * s);
    ctx.stroke();
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    const p = toNorm(e);
    drawingRef.current = true;
    lastPointRef.current = p;
    pendingMoveRef.current = null;
    lastSentRef.current = performance.now();
    setHasInk(true);
    drawLocal(p, p);
    send({ type: "pen", action: "down", x: p.x, y: p.y });
  };

  const onPointerMove = (e) => {
    if (!drawingRef.current) return;
    const p = toNorm(e);
    drawLocal(lastPointRef.current, p);
    lastPointRef.current = p;
    // Local ink renders every event; the network only needs ~30Hz. The
    // skipped point is remembered so pen-up can flush the stroke's true end.
    const now = performance.now();
    if (now - lastSentRef.current >= MOVE_INTERVAL_MS) {
      lastSentRef.current = now;
      pendingMoveRef.current = null;
      send({ type: "pen", action: "move", x: p.x, y: p.y });
    } else {
      pendingMoveRef.current = p;
    }
  };

  const onPointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const pending = pendingMoveRef.current;
    pendingMoveRef.current = null;
    if (pending) send({ type: "pen", action: "move", x: pending.x, y: pending.y });
    send({ type: "pen", action: "up" });
    setStatus("lift your finger and hold — the network fires on its own");
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    setStatus("pad cleared — draw another digit");
    send({ type: "clear" });
  }, [send]);

  const brain = useCallback(() => {
    setStatus("rewiring — watch the wall’s network reshape");
    send({ type: "brain" });
  }, [send]);

  return (
    <div css={containerStyle}>
      <div className="masthead">
        <div className="title">INSIDE A NEURAL NETWORK</div>
        <div className="sub">
          <span className="live" />
          DRAW-PAD LINK
        </div>
      </div>
      <div className="pad-wrap">
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {!hasInk && <div className="pad-hint">finger-draw a digit here</div>}
      </div>
      <div className="row">
        <Button type="button" disableRipple className="clear" onClick={clear}>
          clear
        </Button>
        <Button type="button" disableRipple className="brain" onClick={brain}>
          switch brain
        </Button>
      </div>
      <div className="foot">{status}</div>
    </div>
  );
};

export default ControlsComponent;
