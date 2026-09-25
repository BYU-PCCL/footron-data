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
 * Learned Index — phone panel.
 * Pick the data, drag the allowed error ±ε (fewer lines ↔ bigger search
 * window), and tap a spot on the sorted array to look that key up. The wall
 * sends { data, datasets[], eps, lines, window, look } as `panel`.
 */
const DATA_NOTES = {
  lognormal: "smooth and bunched — a few lines fit it",
  "bursty timestamps": "quiet stretches, then bursts — needs many lines",
  "map coordinates": "a dense city plus scattered points",
};

const Panel = () => {
  const wall = useWall();
  const p = wall.panel || {};
  const [eps, setEps] = useState(null);
  const shown = eps === null ? p.eps || 12 : eps;
  const data = (p.datasets || []).map((d) => ({ id: d, title: d.charAt(0).toUpperCase() + d.slice(1), note: DATA_NOTES[d] || "" }));
  const strip = useRef(null);

  useEffect(() => {
    const c = strip.current;
    if (!c) return;
    const { g, w, h } = fitCanvas(c);
    g.fillStyle = "rgba(120,184,216,0.25)";
    g.fillRect(8, h / 2 - 7, w - 16, 14);
    const L = p.look;
    if (L) {
      const X = (i) => 8 + (i / 1399) * (w - 16);
      const half = Math.max(3, ((p.window || 25) / 1400) * (w - 16) / 2);
      g.fillStyle = "rgba(226,178,95,0.45)";
      g.fillRect(X(L.pred) - half, h / 2 - 12, half * 2, 24);
      g.fillStyle = WALL.amber;
      g.fillRect(X(L.idx) - 1.5, h / 2 - 16, 3, 32);
    }
  }, [p]);

  return (
    <div css={pageStyle}>
      <p css={leadStyle}>
        Instead of an index, the wall fits the data with straight lines that are never more than ±ε
        positions wrong. A lookup follows one line, then searches only a tiny window.
      </p>

      {section("The data")}
      {data.length ? choices(data, p.data, (id) => wall.input("data", id)) : <p css={hintStyle}>Connecting to the wall…</p>}

      {section("Allowed error")}
      {slider(
        "Each line may be off by",
        shown, 4, 40, 1,
        (v) => `±${v}`,
        (v) => setEps(v),
        (v) => { setEps(null); wall.input("eps", v); },
      )}
      <p css={readoutStyle}>{p.lines ? `${p.lines} lines · every lookup searches ${p.window} slots of 1,400` : ""}</p>

      {section("Look up a key")}
      <p css={hintStyle}>Tap somewhere along the sorted array. Amber is the window the model searches.</p>
      <canvas
        ref={strip}
        css={css`${padStyle}; height: 56px;`}
        onPointerDown={(e) => wall.input("lookup", pointAt(e, strip.current).x)}
      />

      {footer(wall)}
    </div>
  );
};

export default Panel;
