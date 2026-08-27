/** @jsxImportSource @emotion/react */
/**
 * Wave Lab — phone controls.
 *
 * This is the whole interface: the wall has no keyboard, no mouse and no
 * touchscreen, so every adjustment a visitor can make happens here.
 *
 * The ordering is deliberate and is the main design decision in this file. A
 * visitor has the wall for a couple of minutes and will not read it, so the
 * things with the largest, fastest, most obvious effect come first — the
 * weather buttons and the rogue wave — and the fine sliders come after. The
 * beach pad is high up too, because touching a spot on the wall and seeing a
 * splash appear there is the moment someone understands that this thing is
 * listening to them.
 *
 * Message formats (keep in sync with src/footron.js in the Wave Lab repo):
 *   Sea state:   { type: "mood", value: "glassy" | "surf" | "storm" }
 *   Rogue wave:  { type: "rogue" }
 *   One slider:  { type: "swell", key: "amplitude" | …, value: <number> }
 *   Coastline:   { type: "coast", value: "reef" | "pier" | … }
 *   Light:       { type: "light", value: "day" | "sunset" | "night" }
 *   Demo:        { type: "lesson", value: "reefbreak" | … }
 *   Tap/drag:    { type: "touch", x: <0…1>, y: <0…1>, tool: "splash" | … }
 *   Overlays:    { type: "view", key: "flow" | "depth" | "section" | "pause",
 *                  value: <bool> }
 *   Reset:       { type: "reset" }      Flatten: { type: "calm" }
 *
 * There is deliberately no "hand back" message. The wall returns to its attract
 * loop 45 seconds after the last touch whatever happens, so a button for it was
 * a second way to do the thing that already happens by itself — and one more
 * control between a visitor and the beach.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";
import BoltIcon from "@material-ui/icons/FlashOn";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { useMessaging } from "@footron/controls-client";

const MOODS = [
  { key: "glassy", label: "Glassy" },
  { key: "surf", label: "Surf's up" },
  { key: "storm", label: "Storm" },
];

const COASTS = [
  { key: "classic", label: "Classic" },
  { key: "sandbar", label: "Sandbars" },
  { key: "coves", label: "Coves" },
  { key: "reef", label: "Reef" },
  { key: "pier", label: "Pier" },
  { key: "jetty", label: "Jetties" },
  { key: "flat", label: "Flats" },
];

const LIGHTS = [
  { key: "day", label: "Midday" },
  { key: "sunset", label: "Sunset" },
  { key: "night", label: "Moonlight" },
];

// Only the sliders a visitor can feel the result of within a second or two.
// Sand drift and time speed are real controls on the wall's own panel, but they
// pay off over a minute, which is longer than anyone holds a phone still.
const SLIDERS = [
  { key: "amplitude", label: "Wave height", min: 0.05, max: 1.4, step: 0.01,
    fmt: (v) => `${(v * 2).toFixed(1)} m` },
  { key: "frequency", label: "Period", min: 0.03, max: 0.18, step: 0.005,
    fmt: (v) => `${(1 / v).toFixed(0)} s` },
  { key: "angle", label: "Direction", min: -45, max: 45, step: 1,
    fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}°` },
  { key: "chop", label: "Chop", min: 0, max: 1, step: 0.01,
    fmt: (v) => `${(v * 100).toFixed(0)}%` },
  { key: "wind", label: "Wind", min: 0, max: 1, step: 0.01,
    fmt: (v) => `${(v * 100).toFixed(0)}%` },
  { key: "tide", label: "Tide", min: -1.5, max: 1.5, step: 0.05,
    fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)} m` },
];

// What a tap on the pad does. "Splash" leads because it is the one whose effect
// is unmistakable — a ring spreads from exactly where the finger went. The
// beach-stuff tool drops an umbrella, a palm, a towel, a chair or a sandcastle,
// so it is named for what it does rather than for one of the five things it
// might give you.
const TOOLS = [
  { key: "splash", label: "Splash" },
  { key: "toy", label: "Drop a toy" },
  { key: "raise", label: "Pile sand" },
  { key: "dig", label: "Dig" },
  { key: "prop", label: "Beach stuff" },
  { key: "river", label: "River" },
];

const LESSONS = [
  { key: "shoal", label: "Shoaling" },
  { key: "rip", label: "Rip current" },
  { key: "refract", label: "Refraction" },
  { key: "groin", label: "Groin trap" },
  { key: "reefbreak", label: "Reef break" },
  { key: "pierscour", label: "Pier scour" },
  { key: "delta", label: "River delta" },
  { key: "surge", label: "Storm surge" },
];

const VIEWS = [
  { key: "flow", label: "Currents" },
  { key: "section", label: "Cross-section" },
  { key: "depth", label: "Depth map" },
];

const DRAG_HZ = 18; // touch messages per second while a finger is down

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 18px;
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

const hintStyle = css`
  opacity: 0.7;
  line-height: 1.5;
`;

const labelRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  opacity: 0.85;
`;

const valueStyle = css`
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
`;

const sectionTitleStyle = css`
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: -8px;
`;

/* The pad is the wall, in miniature and the same shape. Sea on the left, beach
   on the right, matching what the visitor is looking at — a pad that did not
   agree with the view would make every tap land somewhere surprising. */
const padStyle = css`
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  border: 1px dashed rgba(140, 175, 220, 0.5);
  background: linear-gradient(
    to right,
    rgba(18, 62, 96, 0.55) 0%,
    rgba(38, 130, 150, 0.45) 55%,
    rgba(214, 196, 156, 0.5) 82%,
    rgba(226, 210, 172, 0.6) 100%
  );
  overflow: hidden;
  touch-action: none;
  user-select: none;
  transition: border-color 150ms ease;
  &[data-dragging="true"] {
    border-style: solid;
    border-color: rgba(120, 200, 255, 0.9);
  }
`;

const padLabelStyle = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  text-align: center;
  padding: 0 20px;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 3px rgba(0, 20, 40, 0.6);
`;

const WaveLabControls = () => {
  const { sendMessage } = useMessaging();

  // Mirrors of the wall's state. The wall never reports back, so these are what
  // this phone has asked for rather than what the wall is showing — which is
  // the right thing for a slider to sit at, and honest as long as nothing else
  // is driving the wall at the same time.
  const [values, setValues] = useState({
    amplitude: 0.55, frequency: 0.095, angle: 0, chop: 0.35, wind: 0.25, tide: 0,
  });
  const [coast, setCoast] = useState("classic");
  const [light, setLight] = useState("day");
  const [tool, setTool] = useState("splash");
  const [views, setViews] = useState({ flow: false, section: false, depth: false });
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const padRef = useRef(null);
  const pending = useRef(null);

  // A finger produces touchmove events far faster than the wall needs them, and
  // a socket full of them arrives late and feels like lag. Only the most recent
  // position matters for a drag, so keep one and flush it on a timer.
  const flush = useCallback(() => {
    const at = pending.current;
    if (!at) return;
    pending.current = null;
    sendMessage({ type: "touch", x: at.x, y: at.y, tool: at.tool });
  }, [sendMessage]);

  useEffect(() => {
    if (!dragging) return;
    const id = setInterval(flush, 1000 / DRAG_HZ);
    return () => {
      clearInterval(id);
      flush(); // whatever was pending when the finger lifted still counts
    };
  }, [dragging, flush]);

  const at = useCallback((e) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      padRef.current?.setPointerCapture?.(e.pointerId);
      const p = at(e);
      if (!p) return;
      setDragging(true);
      sendMessage({ type: "touch", x: p.x, y: p.y, tool });
    },
    [at, sendMessage, tool]
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!dragging) return;
      const p = at(e);
      // Only the continuous tools want a drag; tapping "drop a toy" twenty
      // times because a finger wandered is not what anyone meant.
      if (p && (tool === "splash" || tool === "raise" || tool === "dig")) {
        pending.current = { ...p, tool };
      }
    },
    [at, dragging, tool]
  );

  const onPointerUp = useCallback(() => setDragging(false), []);

  const slide = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // On release only. Dragging a slider would otherwise send a message per pixel,
  // and rebuilding the sea state sixty times a second is how you make a
  // simulation stutter from a phone.
  const commit = useCallback(
    (key, value) => sendMessage({ type: "swell", key, value }),
    [sendMessage]
  );

  const pickMood = useCallback(
    (value) => {
      sendMessage({ type: "mood", value });
      // The wall's mood presets set several sliders at once, so mirror them or
      // the sliders below would sit at stale positions.
      const preset = {
        glassy: { amplitude: 0.16, frequency: 0.06, chop: 0.05, wind: 0.04, angle: 4 },
        surf: { amplitude: 0.72, frequency: 0.085, chop: 0.4, wind: 0.35, angle: 16 },
        storm: { amplitude: 1.1, frequency: 0.14, chop: 0.95, wind: 0.95, angle: -32 },
      }[value];
      if (preset) setValues((prev) => ({ ...prev, ...preset }));
    },
    [sendMessage]
  );

  const pickCoast = useCallback(
    (value) => {
      setCoast(value);
      sendMessage({ type: "coast", value });
    },
    [sendMessage]
  );

  const pickLight = useCallback(
    (value) => {
      setLight(value);
      sendMessage({ type: "light", value });
    },
    [sendMessage]
  );

  const toggleView = useCallback(
    (key) => {
      setViews((prev) => {
        const value = !prev[key];
        sendMessage({ type: "view", key, value });
        return { ...prev, [key]: value };
      });
    },
    [sendMessage]
  );

  const togglePause = useCallback(() => {
    setPaused((prev) => {
      const value = !prev;
      sendMessage({ type: "view", key: "pause", value });
      return value;
    });
  }, [sendMessage]);

  return (
    <div css={containerStyle}>
      <Typography variant="body2" css={hintStyle}>
        A real stretch of coast, solved wave by wave. Set the weather, then touch
        the beach below — the wall is listening to exactly where your finger goes.
      </Typography>

      <div css={chipsStyle}>
        {MOODS.map((m) => (
          <Chip key={m.key} label={m.label} onClick={() => pickMood(m.key)} clickable
            variant="outlined" />
        ))}
        <Chip
          label="Rogue wave"
          onClick={() => sendMessage({ type: "rogue" })}
          icon={<BoltIcon />}
          color="secondary"
          clickable
        />
      </div>

      <div css={sectionTitleStyle}>Touch the beach</div>
      <div
        css={padStyle}
        data-dragging={dragging}
        ref={padRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span css={padLabelStyle}>
          {dragging ? "" : "tap or drag — open sea on the left, sand on the right"}
        </span>
      </div>

      <div css={chipsStyle}>
        {TOOLS.map((t) => (
          <Chip
            key={t.key}
            label={t.label}
            onClick={() => setTool(t.key)}
            color={t.key === tool ? "primary" : "default"}
            variant={t.key === tool ? "default" : "outlined"}
            clickable
          />
        ))}
      </div>

      <div css={sectionTitleStyle}>The swell</div>
      {SLIDERS.map((s) => (
        <div key={s.key}>
          <div css={labelRowStyle}>
            <span>{s.label}</span>
            <span css={valueStyle}>{s.fmt(values[s.key])}</span>
          </div>
          <Slider
            value={values[s.key]}
            min={s.min}
            max={s.max}
            step={s.step}
            onChange={(_, value) => slide(s.key, value)}
            onChangeCommitted={(_, value) => commit(s.key, value)}
            aria-label={s.label}
          />
        </div>
      ))}

      <div css={sectionTitleStyle}>Coastline</div>
      <div css={chipsStyle}>
        {COASTS.map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            onClick={() => pickCoast(c.key)}
            color={c.key === coast ? "primary" : "default"}
            variant={c.key === coast ? "default" : "outlined"}
            clickable
          />
        ))}
      </div>

      <div css={sectionTitleStyle}>Light</div>
      <div css={chipsStyle}>
        {LIGHTS.map((l) => (
          <Chip
            key={l.key}
            label={l.label}
            onClick={() => pickLight(l.key)}
            color={l.key === light ? "primary" : "default"}
            variant={l.key === light ? "default" : "outlined"}
            clickable
          />
        ))}
      </div>

      <div css={sectionTitleStyle}>Show me why</div>
      <div css={chipsStyle}>
        {LESSONS.map((l) => (
          <Chip
            key={l.key}
            label={l.label}
            onClick={() => sendMessage({ type: "lesson", value: l.key })}
            variant="outlined"
            clickable
          />
        ))}
      </div>

      <div css={sectionTitleStyle}>Instruments</div>
      <div css={chipsStyle}>
        {VIEWS.map((v) => (
          <Chip
            key={v.key}
            label={v.label}
            onClick={() => toggleView(v.key)}
            color={views[v.key] ? "primary" : "default"}
            variant={views[v.key] ? "default" : "outlined"}
            clickable
          />
        ))}
      </div>

      <div css={rowStyle}>
        <Button
          onClick={togglePause}
          startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
          variant="outlined"
          fullWidth
        >
          {paused ? "Run" : "Freeze"}
        </Button>
        <Button onClick={() => sendMessage({ type: "calm" })} variant="outlined" fullWidth>
          Flatten
        </Button>
        <Button onClick={() => sendMessage({ type: "reset" })} variant="outlined" fullWidth>
          New beach
        </Button>
      </div>

      <Typography variant="body2" css={hintStyle}>
        Leave it alone for 45 seconds and the wall goes back to running the surf
        by itself, so there is nothing here you can leave it stuck in and nothing
        to hand back when you are done.
      </Typography>
    </div>
  );
};

export default WaveLabControls;
