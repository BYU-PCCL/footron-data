/** @jsxImportSource @emotion/react */
/* eslint-disable react/prop-types */
/*
 * The panel is built inside footron-web, whose eslint config extends
 * `plugin:react/recommended` — so `react/prop-types` is an error, not a warning.
 * Every other experience's panel is a single component that takes no props at
 * all and never trips it; this one is the first with helpers underneath, and
 * SurfaceMap holds hooks so it cannot be flattened into a plain call.
 *
 * Satisfying the rule properly would mean `import PropTypes from "prop-types"`,
 * and footron-web does not depend on prop-types — it would resolve today only
 * as a transitive dependency of react-scripts, and break on the day that stops
 * being true. Runtime prop checking earns little here regardless: both helpers
 * are private to this file and have exactly one caller each.
 */
/**
 * Gradient Descent — phone controls.
 *
 * The wall has no mouse, so this panel is not an accessory to the exhibit; it
 * is the entire input to it. Everything that used to be an on-screen control
 * lives here, and the map in the middle is the important one: the original
 * interaction was *click the surface to drop a ball*, and a tap on that map is
 * that click.
 *
 * The map is drawn here rather than mirrored from the wall because a phone
 * cannot see the wall's camera and should not need to. It evaluates the same
 * height functions the wall does — see SURFACES below, which is a transcription
 * of src/surfaces.ts and is checked against it by scripts/test-controls.ts, so
 * a new surface cannot land on the wall and quietly leave this map lying.
 *
 * Message formats — keep in sync with src/footron.ts in the Gradient Descent repo:
 *
 *   Surface:  { type: "surface", value: "bowl" }
 *   Mode:     { type: "mode",    value: "gd" | "physics" }
 *   Tunable:  { type: "param",   name: "lr" | "momentum" | "gravity" | "friction" | "speed", value: <n> }
 *   Drop:     { type: "drop",    x: <-1…1>, z: <-1…1> }
 *   Scatter:  { type: "scatter", count: <1…24> }
 *   Clear:    { type: "clear" }
 *   Pause:    { type: "pause",   action: "play" | "pause" }
 *   Step:     { type: "step" }
 *   Orbit:    { type: "orbit",   dx: <-1…1>, dy: <-1…1> }   pad fractions
 *   Zoom:     { type: "zoom",    value: <delta> }
 *   View:     { type: "view",    value: "reset" | "top" | "side" }
 *   Release:  { type: "release" }
 *
 * The wall ignores anything it doesn't recognize and clamps numbers rather than
 * rejecting them, so a panel newer than the deployed build degrades instead of
 * throwing.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import IconButton from "@material-ui/core/IconButton";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";
import ClearIcon from "@material-ui/icons/Clear";
import GrainIcon from "@material-ui/icons/Grain";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";
import { useMessaging } from "@footron/controls-client";

/**
 * The surfaces, transcribed from src/surfaces.ts.
 *
 * Only `f` is needed here — the map is a picture of height, and the gradient is
 * the wall's business. `suggestedLr` comes along because picking a surface on
 * the wall resets the learning rate to it, and the slider under this map has to
 * follow or it will be showing a number the wall is not using.
 */
const SURFACES = [
  {
    id: "bowl",
    name: "Bowl",
    blurb: "One valley. Every ball finds it.",
    f: (x, z) => 0.15 * (x * x + z * z),
    domain: 5,
    suggestedLr: 0.5,
  },
  {
    id: "doubleWell",
    name: "Double Well",
    blurb: "Two valleys, one deeper. Land in the shallow one and you stay.",
    f: (x, z) => {
      const q = x * x - 9;
      return 0.02 * q * q + 0.1 * x + 0.2 * z * z;
    },
    domain: 5,
    suggestedLr: 0.3,
  },
  {
    id: "eggCrate",
    name: "Egg Crate",
    blurb: "Dimples everywhere. Almost nowhere is the best place.",
    f: (x, z) => 0.08 * (x * x + z * z) + 1.2 * Math.sin(x) * Math.cos(z),
    domain: 5,
    suggestedLr: 0.25,
  },
  {
    id: "himmelblau",
    name: "Himmelblau",
    blurb: "Four minima, all equally good. Where you start decides.",
    f: (x, z) => {
      const a = x * x + z - 11;
      const b = x + z * z - 7;
      return 0.008 * (a * a + b * b);
    },
    domain: 5,
    suggestedLr: 0.15,
  },
  {
    id: "saddle",
    name: "Saddle",
    blurb: "A ridge between two valleys. Drop on the crest and stall.",
    f: (x, z) => 0.15 * x * x - 0.15 * z * z + 0.004 * z * z * z * z,
    domain: 5,
    suggestedLr: 0.4,
  },
  {
    id: "ripple",
    name: "Ripple",
    blurb: "A bowl full of bumps. Very easy to get trapped.",
    f: (x, z) =>
      0.08 * (x * x + z * z) -
      0.35 * (Math.cos(2.5 * x) + Math.cos(2.5 * z)) +
      0.7,
    domain: 5,
    suggestedLr: 0.15,
  },
];

/** The wall's height ramp, so the map and the surface are the same object. */
const RAMP = [
  [0.0, 0x1e, 0x3a, 0x8a],
  [0.25, 0x0e, 0x74, 0x90],
  [0.5, 0x15, 0x80, 0x3d],
  [0.7, 0xca, 0x8a, 0x04],
  [0.85, 0xea, 0x58, 0x0c],
  [1.0, 0xb9, 0x1c, 0x1c],
];

/**
 * Sample resolution of the map. The canvas is drawn at this size and stretched
 * by CSS, which costs one bilinear blur and saves evaluating a trigonometric
 * height function a few hundred thousand times on a phone — Ripple and Egg
 * Crate are the expensive ones, and a surface chip that takes half a second to
 * respond feels broken.
 */
const MAP_SAMPLES = 110;

const SPEEDS = [
  { label: "¼×", value: 0.25 },
  { label: "½×", value: 0.5 },
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
  { label: "4×", value: 4 },
];

const VIEWS = [
  { label: "Default", value: "reset" },
  { label: "From above", value: "top" },
  { label: "Side on", value: "side" },
];

const SCATTER_COUNT = 12;
const ZOOM_STEP = 1;
/** Orbit messages per second while a finger is down. */
const DRAG_HZ = 20;

/**
 * Step size rides a log slider: linearly, every usable value is in the first
 * tick and the rest of the travel is nothing but divergence. The top of the
 * range is 10, which is past the point where even the gentlest surface here
 * blows up — see PARAM_RANGES.lr in src/footron.ts on why it needs to be.
 */
const LR_MIN_LOG = -3;
const LR_MAX_LOG = 1;

function rampColor(t) {
  for (let i = 1; i < RAMP.length; i++) {
    if (t <= RAMP[i][0]) {
      const [t0, r0, g0, b0] = RAMP[i - 1];
      const [t1, r1, g1, b1] = RAMP[i];
      const u = (t - t0) / (t1 - t0);
      return [r0 + (r1 - r0) * u, g0 + (g1 - g0) * u, b0 + (b1 - b0) * u];
    }
  }
  return RAMP[RAMP.length - 1].slice(1);
}

/**
 * The tap-to-drop map: a top-down picture of the surface, coloured by height
 * with the wall's own ramp, plus contour lines.
 *
 * The contours are what make it readable as terrain rather than as a smear.
 * Height is normalized per surface, exactly as the wall does when it colours
 * the mesh, so Bowl and Himmelblau both use the full ramp instead of one of
 * them coming out uniformly blue.
 */
function SurfaceMap({ surface, onDrop }) {
  const canvasRef = useRef(null);
  const [marks, setMarks] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const n = MAP_SAMPLES;
    canvas.width = n;
    canvas.height = n;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const d = surface.domain;
    const heights = new Float32Array(n * n);
    let min = Infinity;
    let max = -Infinity;
    for (let j = 0; j < n; j++) {
      const z = ((j / (n - 1)) * 2 - 1) * d;
      for (let i = 0; i < n; i++) {
        const x = ((i / (n - 1)) * 2 - 1) * d;
        const h = surface.f(x, z);
        heights[j * n + i] = h;
        if (h < min) min = h;
        if (h > max) max = h;
      }
    }

    const range = max - min || 1;
    const img = ctx.createImageData(n, n);
    for (let k = 0; k < n * n; k++) {
      const t = (heights[k] - min) / range;
      const [r, g, b] = rampColor(t);
      // 12 bands of height, drawn by darkening the pixels where a band changes.
      // Cheaper than tracing real isolines and, at this size, indistinguishable.
      const band = Math.floor(t * 12);
      const prev = k % n === 0 ? band : Math.floor(((heights[k - 1] - min) / range) * 12);
      const above = k < n ? band : Math.floor(((heights[k - n] - min) / range) * 12);
      const edge = band !== prev || band !== above ? 0.55 : 1;
      img.data[k * 4] = r * edge;
      img.data[k * 4 + 1] = g * edge;
      img.data[k * 4 + 2] = b * edge;
      img.data[k * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    setMarks([]);
  }, [surface]);

  const tap = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
      onDrop(fx * 2 - 1, fy * 2 - 1);
      // A dot where the finger landed. The wall is the real feedback, but it is
      // across the room and a ball takes a moment to fall — without this the
      // tap feels like it missed and people tap again.
      setMarks((prev) => [...prev.slice(-11), { x: fx, y: fy, id: Date.now() + Math.random() }]);
    },
    [onDrop]
  );

  return (
    <div css={mapWrapStyle}>
      <canvas ref={canvasRef} css={mapCanvasStyle} onPointerDown={tap} />
      {marks.map((m) => (
        <span
          key={m.id}
          css={markStyle}
          style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
        />
      ))}
    </div>
  );
}

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 420px;
  margin: 0 auto;
`;

const rowStyle = css`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
`;

const chipsStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const groupStyle = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const groupLabelStyle = css`
  opacity: 0.6;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

const hintStyle = css`
  opacity: 0.7;
  line-height: 1.5;
`;

const mapWrapStyle = css`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.16);
`;

const mapCanvasStyle = css`
  width: 100%;
  height: 100%;
  display: block;
  /* The map is a picture, not a scrollable surface: without this a tap that
     drifts a pixel is swallowed as a page pan and no ball is dropped. */
  touch-action: none;
`;

const markStyle = css`
  position: absolute;
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
  pointer-events: none;
`;

const padStyle = css`
  height: 96px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;

  &[data-dragging="true"] {
    border-style: solid;
    background: rgba(255, 255, 255, 0.07);
  }
`;

const sliderLabelStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const sliderValueStyle = css`
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
`;

/** A labelled slider that reports its value continuously but sends on release. */
function Tunable({ label, value, display, min, max, step, onPreview, onCommit }) {
  return (
    <div css={groupStyle}>
      <div css={sliderLabelStyle}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" css={sliderValueStyle}>
          {display}
        </Typography>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(_, v) => onPreview(v)}
        onChangeCommitted={(_, v) => onCommit(v)}
        aria-label={label}
      />
    </div>
  );
}

/**
 * How long the panel ignores the wall after the panel itself said something.
 *
 * Every control here sends and then hears its own change back, and the round
 * trip is not instant. Without this, dragging a slider means a stream of state
 * messages arriving mid-gesture carrying the value from two hundred
 * milliseconds ago, each one yanking the handle backwards under the finger. A
 * second is longer than the round trip and shorter than a visitor's pause
 * between two deliberate actions.
 */
const ECHO_QUIET_MS = 1000;

const GradientDescentControls = () => {
  // These are opening guesses, not the truth. The wall may have been running for
  // five minutes on Ripple, driven by the attract loop or by whoever had a phone
  // before this one — see the state message below, which is what corrects them.
  const [surfaceId, setSurfaceId] = useState("doubleWell");
  const [mode, setMode] = useState("gd");
  const [lrLog, setLrLog] = useState(Math.log10(0.3));
  const [momentum, setMomentum] = useState(0);
  const [gravity, setGravity] = useState(4);
  const [friction, setFriction] = useState(0.8);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  /**
   * Follow the wall.
   *
   * The wall is the authority: it is the thing a room full of people can see,
   * the attract loop changes surfaces on its own, and another visitor's phone
   * can change them too. It sends this on connection and on every change, so a
   * panel that opened on Double Well while the wall showed Ripple corrects
   * itself rather than sitting there describing a different exhibit.
   */
  const adopt = useRef(0);
  const { sendMessage: send } = useMessaging((message) => {
    if (!message || message.type !== "state") return;
    if (Date.now() < adopt.current) return;
    setSurfaceId(message.surface);
    setMode(message.mode);
    setLrLog(Math.log10(message.lr));
    setMomentum(message.momentum);
    setGravity(message.gravity);
    setFriction(message.friction);
    setSpeed(message.speed);
    setPaused(message.paused);
  });

  /** Say something, and stop listening to our own echo for a moment. */
  const sendMessage = useCallback(
    (body) => {
      adopt.current = Date.now() + ECHO_QUIET_MS;
      return send(body);
    },
    [send]
  );

  const surface = SURFACES.find((s) => s.id === surfaceId) ?? SURFACES[0];

  const param = useCallback(
    (name, value) => sendMessage({ type: "param", name, value }),
    [sendMessage]
  );

  const pickSurface = useCallback(
    (s) => {
      setSurfaceId(s.id);
      // The wall resets the learning rate to the surface's own suggestion, so
      // follow it here — otherwise this slider sits at a number nobody is using
      // and the first nudge of it jumps the wall somewhere unexpected.
      setLrLog(Math.log10(s.suggestedLr));
      setPaused(false);
      sendMessage({ type: "surface", value: s.id });
    },
    [sendMessage]
  );

  const pickMode = useCallback(
    (value) => {
      setMode(value);
      setPaused(false);
      sendMessage({ type: "mode", value });
    },
    [sendMessage]
  );

  const drop = useCallback(
    (x, z) => sendMessage({ type: "drop", x, z }),
    [sendMessage]
  );

  const togglePause = useCallback(() => {
    setPaused((prev) => {
      const next = !prev;
      sendMessage({ type: "pause", action: next ? "pause" : "play" });
      return next;
    });
  }, [sendMessage]);

  // Stepping only means anything while the run is held, and the wall pauses
  // itself on the first step — so mirror that rather than letting this button
  // leave the panel claiming the simulation is running.
  const step = useCallback(() => {
    setPaused(true);
    sendMessage({ type: "step" });
  }, [sendMessage]);

  const pickSpeed = useCallback(
    (value) => {
      setSpeed(value);
      param("speed", value);
    },
    [param]
  );

  // Drag deltas are accumulated and flushed on a timer rather than sent per
  // pointermove: a finger produces events far faster than the camera needs
  // them, and a socket full of two-pixel nudges arrives late and feels like lag.
  const pending = useRef({ dx: 0, dy: 0 });
  const last = useRef(null);
  const padRef = useRef(null);

  const flush = useCallback(() => {
    const { dx, dy } = pending.current;
    if (dx === 0 && dy === 0) return;
    pending.current = { dx: 0, dy: 0 };
    sendMessage({ type: "orbit", dx, dy });
  }, [sendMessage]);

  useEffect(() => {
    if (!dragging) return;
    const id = setInterval(flush, 1000 / DRAG_HZ);
    return () => {
      clearInterval(id);
      flush(); // whatever was left when the finger lifted still counts
    };
  }, [dragging, flush]);

  const onPointerDown = useCallback((e) => {
    padRef.current?.setPointerCapture?.(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
    pending.current = { dx: 0, dy: 0 };
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((e) => {
    const prev = last.current;
    if (!prev) return;
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return;
    // As a fraction of the pad, so a drag means the same thing on any phone.
    pending.current.dx += (e.clientX - prev.x) / rect.width;
    pending.current.dy += (e.clientY - prev.y) / rect.height;
    last.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = useCallback(() => {
    last.current = null;
    setDragging(false);
  }, []);

  const release = useCallback(() => {
    sendMessage({ type: "release" });
    setPaused(false);
    setSpeed(1);
  }, [sendMessage]);

  return (
    <div css={containerStyle}>
      <Typography variant="h6">Gradient Descent</Typography>
      <Typography variant="body2" css={hintStyle}>
        The wall is a landscape and every ball is a guess. Drop one and it walks
        downhill, one step at a time, until it cannot do better — which is not
        always the best place there is.
      </Typography>

      <div css={groupStyle}>
        <Typography variant="caption" css={groupLabelStyle}>
          Landscape
        </Typography>
        <div css={chipsStyle}>
          {SURFACES.map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              clickable
              color={s.id === surfaceId ? "primary" : "default"}
              variant={s.id === surfaceId ? "default" : "outlined"}
              onClick={() => pickSurface(s)}
            />
          ))}
        </div>
        <Typography variant="body2" css={hintStyle}>
          {surface.blurb}
        </Typography>
      </div>

      <div css={groupStyle}>
        <Typography variant="caption" css={groupLabelStyle}>
          Tap the map to drop a ball
        </Typography>
        <SurfaceMap surface={surface} onDrop={drop} />
        <Typography variant="body2" css={hintStyle}>
          Blue is low ground, red is high. Try dropping two balls a finger-width
          apart and watch where they each end up.
        </Typography>
      </div>

      <div css={rowStyle}>
        <Button
          variant="outlined"
          startIcon={<GrainIcon />}
          onClick={() => sendMessage({ type: "scatter", count: SCATTER_COUNT })}
          fullWidth
        >
          Scatter {SCATTER_COUNT}
        </Button>
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={() => sendMessage({ type: "clear" })}
          fullWidth
        >
          Clear
        </Button>
      </div>

      <div css={groupStyle}>
        <Typography variant="caption" css={groupLabelStyle}>
          How they move
        </Typography>
        <div css={chipsStyle}>
          <Chip
            label="Take steps"
            clickable
            color={mode === "gd" ? "primary" : "default"}
            variant={mode === "gd" ? "default" : "outlined"}
            onClick={() => pickMode("gd")}
          />
          <Chip
            label="Roll like marbles"
            clickable
            color={mode === "physics" ? "primary" : "default"}
            variant={mode === "physics" ? "default" : "outlined"}
            onClick={() => pickMode("physics")}
          />
        </div>
      </div>

      {mode === "gd" ? (
        <>
          <Tunable
            label="Step size η"
            value={lrLog}
            display={Math.pow(10, lrLog).toPrecision(2)}
            min={LR_MIN_LOG}
            max={LR_MAX_LOG}
            step={0.01}
            onPreview={setLrLog}
            onCommit={(v) => param("lr", Math.pow(10, v))}
          />
          <Tunable
            label="Momentum β"
            value={momentum}
            display={momentum.toFixed(2)}
            min={0}
            max={0.95}
            step={0.05}
            onPreview={setMomentum}
            onCommit={(v) => param("momentum", v)}
          />
          <Typography variant="body2" css={hintStyle}>
            Turn the step size all the way up and the balls overshoot every
            valley they aim at, then fly off the surface. That is a real failure
            mode, not a bug — it is why picking η is hard.
          </Typography>
        </>
      ) : (
        <>
          <Tunable
            label="Gravity"
            value={gravity}
            display={gravity.toFixed(1)}
            min={1}
            max={10}
            step={0.5}
            onPreview={setGravity}
            onCommit={(v) => param("gravity", v)}
          />
          <Tunable
            label="Friction"
            value={friction}
            display={friction.toFixed(1)}
            min={0.1}
            max={2.5}
            step={0.1}
            onPreview={setFriction}
            onCommit={(v) => param("friction", v)}
          />
          <Typography variant="body2" css={hintStyle}>
            Drop the friction and the marbles keep their speed — enough of it to
            roll straight through a shallow valley and out the other side, which
            is the trick momentum plays in the step-taking mode.
          </Typography>
        </>
      )}

      <div css={groupStyle}>
        <Typography variant="caption" css={groupLabelStyle}>
          Speed
        </Typography>
        <div css={chipsStyle}>
          {SPEEDS.map((s) => (
            <Chip
              key={s.value}
              label={s.label}
              clickable
              color={speed === s.value ? "primary" : "default"}
              variant={speed === s.value ? "default" : "outlined"}
              onClick={() => pickSpeed(s.value)}
            />
          ))}
        </div>
      </div>

      <div css={rowStyle}>
        <Button
          variant="outlined"
          startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
          onClick={togglePause}
          fullWidth
        >
          {paused ? "Run" : "Hold"}
        </Button>
        {mode === "gd" && (
          <Button variant="outlined" startIcon={<SkipNextIcon />} onClick={step} fullWidth>
            One step
          </Button>
        )}
      </div>

      <div css={groupStyle}>
        <Typography variant="caption" css={groupLabelStyle}>
          Camera
        </Typography>
        <div
          css={padStyle}
          data-dragging={dragging}
          ref={padRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <Typography variant="body2" css={hintStyle}>
            {dragging ? "turning…" : "drag here to turn the landscape"}
          </Typography>
        </div>
        <div css={rowStyle}>
          <IconButton
            onClick={() => sendMessage({ type: "zoom", value: ZOOM_STEP })}
            aria-label="zoom in"
          >
            <ZoomInIcon />
          </IconButton>
          <IconButton
            onClick={() => sendMessage({ type: "zoom", value: -ZOOM_STEP })}
            aria-label="zoom out"
          >
            <ZoomOutIcon />
          </IconButton>
          <div css={chipsStyle}>
            {VIEWS.map((v) => (
              <Chip
                key={v.value}
                label={v.label}
                clickable
                variant="outlined"
                onClick={() => sendMessage({ type: "view", value: v.value })}
              />
            ))}
          </div>
        </div>
      </div>

      <Button onClick={release} variant="outlined" fullWidth>
        Let the wall carry on
      </Button>
    </div>
  );
};

export default GradientDescentControls;
