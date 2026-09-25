/** @jsxImportSource @emotion/react */
/* eslint-disable @typescript-eslint/no-unused-vars -- shared kit: each panel uses a subset */
/*
 * Shared kit for the Data Structures phone panels. scripts/package-single.py
 * prepends this to a panel file (e.g. crdt.js) to make one controls module.
 *
 * Footron's controls app wraps the panel in its own header (the experience
 * title) and a light MUI theme with BYU navy as primary, so panels don't
 * repeat the title or paint a background of their own. Spatial controls are
 * small dark cards — a window onto the wall.
 *
 * Lint (footron-web .eslintrc): eslint:recommended, react/recommended,
 * @typescript-eslint/recommended. So: no empty functions, keys on every list,
 * and no prop-taking sub-components (react/prop-types) — shared pieces are
 * plain render functions called as {footer(wall)}.
 *
 * Protocol (see web/footron.js): the phone sends {type:"action", value},
 * {type:"input", name, value}, pause/speed/release; the wall sends
 * {type:"state", …, panel} whenever its panel state changes.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Slider from "@material-ui/core/Slider";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { useMessaging } from "@footron/controls-client";

const NAVY = "#001E4C";
const INK = "#1b2330";
const MUTED = "#5d6778";
const WALL = { bg: "#0a0d12", dim: "#8a92a4", ink: "#e3e6ed", teal: "#6cc3b2", amber: "#e2b25f", rose: "#d27b83", violet: "#a48bd6", line: "rgba(190,200,220,0.22)" };

const pageStyle = css`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 18px 8px;
  max-width: 480px;
  margin: 0 auto;
  color: ${INK};
  font-family: "Roboto", "Helvetica Neue", Arial, sans-serif;
`;
const leadStyle = css`
  font-size: 16px;
  line-height: 1.45;
  margin: 0;
`;
const labelStyle = css`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${MUTED};
  margin: 4px 0 -8px;
`;
const cardStyle = css`
  border-radius: 14px;
  background: #f4f7fc;
  border: 1px solid #dde4ef;
  padding: 14px 16px;
`;
const choiceStyle = (on) => css`
  display: block;
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  border-radius: 12px;
  border: 2px solid ${on ? NAVY : "#dde4ef"};
  background: ${on ? "#e9eef8" : "#fff"};
  color: ${INK};
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active {
    transform: scale(0.99);
  }
`;
const choiceTitle = css`
  display: block;
  font-size: 16px;
  font-weight: 600;
`;
const choiceNote = css`
  display: block;
  font-size: 13px;
  line-height: 1.35;
  color: ${MUTED};
  margin-top: 2px;
`;
const stackStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const chipsStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;
const chipStyle = (on) => css`
  padding: 10px 14px;
  border-radius: 999px;
  border: 2px solid ${on ? NAVY : "#cfd8e6"};
  background: ${on ? NAVY : "#fff"};
  color: ${on ? "#fff" : INK};
  font: 500 15px "Roboto Mono", "SF Mono", Menlo, monospace;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`;
const gridStyle = css`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;
const bigButton = css`
  min-height: 52px;
  text-transform: none;
  font-size: 15px;
  border-radius: 12px;
`;
const padStyle = css`
  width: 100%;
  display: block;
  border-radius: 14px;
  background: ${WALL.bg};
  touch-action: none;
  user-select: none;
`;
const readoutStyle = css`
  font: 500 14px "Roboto Mono", "SF Mono", Menlo, monospace;
  color: ${MUTED};
  margin: -6px 0 0;
`;
const rowStyle = css`
  display: flex;
  gap: 10px;
  align-items: center;
`;
const hintStyle = css`
  font-size: 13px;
  color: ${MUTED};
  line-height: 1.45;
  margin: 0;
`;

// The wall: its live state, and ways to talk to it.
function useWall() {
  const [state, setState] = useState(null);
  // stable, so the controls client doesn't re-register the listener every render
  const onMessage = useCallback((msg) => {
    if (msg && msg.type === "state") setState(msg);
  }, []);
  const { sendMessage } = useMessaging(onMessage);
  const send = useCallback((msg) => Promise.resolve(sendMessage(msg)).catch(() => undefined), [sendMessage]);

  // ask for the wall's state once connected; again shortly in case the socket was still opening
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current) return undefined;
    greeted.current = true;
    send({ type: "hello" });
    const t = setTimeout(() => send({ type: "hello" }), 1500);
    return () => clearTimeout(t);
  }, [send]);

  // live inputs (drags, sliders) are coalesced to 15 per second: only the latest matters
  const pending = useRef(null);
  useEffect(() => {
    const t = setInterval(() => {
      const p = pending.current;
      if (!p) return;
      pending.current = null;
      send({ type: "input", name: p.name, value: p.value });
    }, 1000 / 15);
    return () => clearInterval(t);
  }, [send]);

  const input = useCallback((name, value) => { pending.current = null; send({ type: "input", name, value }); }, [send]);
  const live = useCallback((name, value) => { pending.current = { name, value }; }, []);
  const action = useCallback((id) => send({ type: "action", value: id }), [send]);
  const pause = useCallback((v) => send({ type: "pause", value: v }), [send]);
  const speed = useCallback((v) => send({ type: "speed", value: v }), [send]);
  const release = useCallback(() => send({ type: "release" }), [send]);
  return { state, panel: state ? state.panel : null, input, live, action, pause, speed, release };
}

// A normalised {x, y} in [0, 1] from a pointer event on an element.
function pointAt(e, el) {
  const r = el.getBoundingClientRect();
  const clamp = (v) => Math.max(0, Math.min(1, v));
  return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) };
}

// A canvas sized to its CSS box at device resolution; returns ctx and size.
function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const g = canvas.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  return { g, w, h };
}

function section(title) {
  return <div css={labelStyle}>{title}</div>;
}

function choices(items, selected, onPick) {
  return (
    <div css={stackStyle}>
      {items.map((it) => (
        <button key={it.id} type="button" css={choiceStyle(it.id === selected)} onClick={() => onPick(it.id)}>
          <span css={choiceTitle}>{it.title}</span>
          {it.note ? <span css={choiceNote}>{it.note}</span> : null}
        </button>
      ))}
    </div>
  );
}

function chips(items, selected, onPick) {
  return (
    <div css={chipsStyle}>
      {items.map((it) => (
        <button key={it.id} type="button" css={chipStyle(it.id === selected)} onClick={() => onPick(it.id)}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

function slider(label, value, min, max, step, fmt, onLive, onCommit) {
  return (
    <div>
      <div css={rowStyle}>
        <span css={css`flex: 1; font-size: 15px; font-weight: 500;`}>{label}</span>
        <span css={css`font: 600 15px "Roboto Mono", Menlo, monospace; color: ${NAVY};`}>{fmt(value)}</span>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(_, v) => onLive(v)}
        onChangeCommitted={(_, v) => onCommit(v)}
        aria-label={label}
      />
    </div>
  );
}

// Pause, speed, and handing the wall back: the same at the bottom of every panel.
function footer(wall) {
  const s = wall.state || {};
  const paused = !!s.paused;
  const cur = typeof s.speed === "number" ? s.speed : 1;
  return (
    <>
      <div css={css`height: 1px; background: #dde4ef; margin: 6px 0 0;`} />
      <div css={rowStyle}>
        <Button onClick={() => wall.pause(!paused)} startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />} variant="outlined" color="primary" css={css`flex: 1; border-radius: 12px; text-transform: none;`}>
          {paused ? "Play" : "Pause"}
        </Button>
        {[0.5, 1, 2].map((v) => (
          <Button key={v} onClick={() => wall.speed(v)} variant={cur === v ? "contained" : "outlined"} color="primary" css={css`min-width: 52px; border-radius: 12px;`}>
            {v}×
          </Button>
        ))}
      </div>
      <Button onClick={wall.release} variant="text" color="primary" css={css`text-transform: none;`}>
        Let the wall carry on by itself
      </Button>
      <p css={hintStyle}>Leave it for a minute and the wall goes back to playing on its own.</p>
    </>
  );
}

/*
 * How AI Search Finds Things — phone panel.
 * A dark map of the wall's points: tap anywhere and the wall searches for the
 * 5 points nearest your tap, measuring only a fraction of them. The wall
 * sends { pts[[x, y]], q, found[], checked, recall } as `panel`.
 */
const ASPECT = 2.2;   // the wall's search sheets are 2.2× wider than deep

const Panel = () => {
  const wall = useWall();
  const p = wall.panel || {};
  const ref = useRef(null);
  const [tap, setTap] = useState(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const { g, w, h } = fitCanvas(c);
    const X = (x) => 10 + x * (w - 20), Y = (y) => 10 + y * (h - 20);
    const found = new Set(p.found || []);
    (p.pts || []).forEach((pt, i) => {
      g.beginPath();
      g.arc(X(pt[0]), Y(pt[1]), found.has(i) ? 4.5 : 1.8, 0, Math.PI * 2);
      g.fillStyle = found.has(i) ? WALL.amber : "rgba(108,195,178,0.75)";
      g.fill();
    });
    const q = p.q || (tap ? [tap.x, tap.y] : null);
    if (q) {
      g.strokeStyle = WALL.amber;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(X(q[0]), Y(q[1]), 9, 0, Math.PI * 2);
      g.moveTo(X(q[0]) - 14, Y(q[1]));
      g.lineTo(X(q[0]) + 14, Y(q[1]));
      g.moveTo(X(q[0]), Y(q[1]) - 14);
      g.lineTo(X(q[0]), Y(q[1]) + 14);
      g.stroke();
      (p.found || []).forEach((i) => {
        const pt = (p.pts || [])[i];
        if (!pt) return;
        g.strokeStyle = "rgba(226,178,95,0.6)";
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(X(q[0]), Y(q[1]));
        g.lineTo(X(pt[0]), Y(pt[1]));
        g.stroke();
      });
    }
  }, [p, tap]);

  const onTap = (e) => {
    const c = ref.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    // the drawing is inset 10 px on every side
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const pt = { x: clamp((e.clientX - r.left - 10) / (r.width - 20)), y: clamp((e.clientY - r.top - 10) / (r.height - 20)) };
    setTap(pt);
    wall.input("search", pt);
  };

  return (
    <div css={pageStyle}>
      <p css={leadStyle}>
        Tap anywhere on the map. The wall looks for the 5 points closest to your tap — starting high up
        with long jumps, then dropping down for the fine search.
      </p>

      <canvas ref={ref} css={css`${padStyle}; aspect-ratio: ${ASPECT};`} onPointerDown={onTap} />
      <p css={readoutStyle}>
        {p.checked ? `checked ${p.checked} of ${(p.pts || []).length} points · ${Math.round((p.recall || 0) * 100)}% same as checking all` : "tap the map to search there"}
      </p>

      <div css={gridStyle}>
        <Button css={bigButton} variant="outlined" color="primary" onClick={() => wall.action("add")}>Add 20 points</Button>
        <Button css={bigButton} variant="outlined" color="primary" onClick={() => wall.action("rebuild")}>New random graph</Button>
      </div>

      {footer(wall)}
    </div>
  );
};

export default Panel;
