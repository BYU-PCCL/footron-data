/** @jsxImportSource @emotion/react */
/**
 * A Day in the Sky — phone controls.
 *
 * This is the whole interface: the wall has no keyboard, no mouse and no
 * touchscreen, so every adjustment a visitor can make happens here. The box at
 * the top is the point of it — "fly to Tokyo" is the thing every visitor
 * actually wants, and it is the one thing no other input could ever offer — and
 * the pad, the zoom and the clock below it steer what the box lands on.
 *
 * Message formats (keep in sync with src/footron.js in the Planes repo):
 *   Go to a place: { type: "goto", value: "LHR" | "tokyo" | "heathrow" }
 *   Random plane:  { type: "random" }
 *   Drag:          { type: "orbit", dx: <-1…1>, dy: <-1…1> }   pad fractions
 *   Zoom:          { type: "zoom", value: <delta in zoom units> }
 *   Clock:         { type: "clock", action: "play" | "pause" }
 *   Time of day:   { type: "seek", value: <0…86399 seconds UTC> }
 *   Speed:         { type: "speed", value: 300 | 600 | 1200 }
 *   Hand back:     { type: "release" }
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import IconButton from "@material-ui/core/IconButton";
import Slider from "@material-ui/core/Slider";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import CasinoIcon from "@material-ui/icons/Casino";
import FlightTakeoffIcon from "@material-ui/icons/FlightTakeoff";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";
import { useMessaging } from "@footron/controls-client";

// Airports with real traffic on the day being shown, spread around the world so
// the chips are not four cities in one time zone. Salt Lake City is first because
// it is the sky the people standing in front of the wall live under, and a visitor
// who recognises the shape of their own airport believes the rest of the map.
//
// These are matched on the wall by city name against the day's own airport list,
// and scripts/verify.mjs fails if any of them stops resolving — so a rebuild on a
// different day cannot quietly leave a dead chip on somebody's phone.
const PLACES = [
  "Salt Lake City",
  "London",
  "Atlanta",
  "Tokyo",
  "Dubai",
  "Amsterdam",
  "Los Angeles",
  "Sydney",
];

const SPEEDS = [300, 600, 1200];
const ZOOM_STEP = 0.7;       // zoom units per tap, about 1.6× of scale
const DRAG_HZ = 20;          // orbit messages per second while a finger is down
const DAY = 86400;

const clock = (t) => {
  const s = Math.max(0, Math.min(DAY - 1, Math.floor(t)));
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(
    Math.floor((s % 3600) / 60)
  ).padStart(2, "0")}`;
};

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

/* The pad is deliberately large and empty. A drag on a phone is aimed at the
   wall, not at the phone, so the target has to be findable without looking. */
const padStyle = css`
  position: relative;
  height: 180px;
  border-radius: 14px;
  border: 1px dashed rgba(140, 175, 220, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  touch-action: none;
  user-select: none;
  transition: border-color 150ms ease, background-color 150ms ease;
  &[data-dragging="true"] {
    border-style: solid;
    border-color: rgba(120, 200, 255, 0.9);
    background: rgba(120, 200, 255, 0.09);
  }
`;

const padLabelStyle = css`
  pointer-events: none;
  opacity: 0.65;
  font-size: 13px;
  line-height: 1.5;
  padding: 0 20px;
`;

const timeRowStyle = css`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const clockStyle = css`
  font-variant-numeric: tabular-nums;
  min-width: 5.5ch;
  font-size: 15px;
`;

const PlanesControls = () => {
  const { sendMessage } = useMessaging();
  const [text, setText] = useState("");
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(600);
  const [t, setT] = useState(null); // null until someone moves the slider
  const [dragging, setDragging] = useState(false);

  // Drag deltas are accumulated and flushed on a timer rather than sent per
  // touchmove: a finger produces events far faster than the globe needs them,
  // and a socket full of 2-pixel nudges arrives late and feels like lag.
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

  const go = useCallback(
    (value) => {
      const trimmed = (value || "").trim();
      if (!trimmed) return;
      sendMessage({ type: "goto", value: trimmed });
      setText("");
    },
    [sendMessage]
  );

  const random = useCallback(() => sendMessage({ type: "random" }), [sendMessage]);

  const zoom = useCallback(
    (delta) => sendMessage({ type: "zoom", value: delta }),
    [sendMessage]
  );

  const togglePlay = useCallback(() => {
    setPlaying((prev) => {
      const next = !prev;
      sendMessage({ type: "clock", action: next ? "play" : "pause" });
      return next;
    });
  }, [sendMessage]);

  const pickSpeed = useCallback(
    (value) => {
      setSpeed(value);
      setPlaying(true);
      sendMessage({ type: "speed", value });
    },
    [sendMessage]
  );

  // Only on release: dragging the slider would otherwise send a seek per pixel,
  // and each one clears the wall's selection and resets the day's framing.
  const seek = useCallback(
    (_, value) => sendMessage({ type: "seek", value: Math.round(value) }),
    [sendMessage]
  );

  const release = useCallback(() => {
    sendMessage({ type: "release" });
    setPlaying(true);
    setSpeed(600);
    setT(null);
  }, [sendMessage]);

  return (
    <div css={containerStyle}>
      <Typography variant="body2" css={hintStyle}>
        Every plane in the sky over one real day. Type a city or an airport code and
        the wall flies there. It knows every airport that saw a flight that day.
      </Typography>

      <form
        css={rowStyle}
        onSubmit={(e) => {
          e.preventDefault();
          go(text);
        }}
      >
        <TextField
          label="city or airport code"
          variant="outlined"
          value={text}
          onChange={(e) => setText(e.target.value)}
          inputProps={{
            maxLength: 40,
            autoCapitalize: "none",
            autoCorrect: "off",
            spellCheck: false,
          }}
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          endIcon={<FlightTakeoffIcon />}
          disabled={!text.trim()}
        >
          Go
        </Button>
      </form>

      <div css={chipsStyle}>
        {PLACES.map((place) => (
          <Chip key={place} label={place} onClick={() => go(place)} variant="outlined" clickable />
        ))}
      </div>

      <div
        css={padStyle}
        data-dragging={dragging}
        ref={padRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Typography variant="body2" css={padLabelStyle}>
          {dragging ? "turning the globe…" : "drag here to turn the globe"}
        </Typography>
      </div>

      <div css={rowStyle}>
        <IconButton onClick={() => zoom(ZOOM_STEP)} aria-label="zoom in">
          <ZoomInIcon />
        </IconButton>
        <IconButton onClick={() => zoom(-ZOOM_STEP)} aria-label="zoom out">
          <ZoomOutIcon />
        </IconButton>
        <Button onClick={random} startIcon={<CasinoIcon />} variant="outlined">
          Random flight
        </Button>
      </div>

      <div css={timeRowStyle}>
        <IconButton
          onClick={togglePlay}
          color="primary"
          aria-label={playing ? "hold the clock" : "run the clock"}
        >
          {playing ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <Slider
          value={t ?? 0}
          min={0}
          max={DAY - 1}
          step={300}
          onChange={(_, value) => setT(value)}
          onChangeCommitted={seek}
          aria-label="time of day, UTC"
        />
        <span css={clockStyle}>{t == null ? "UTC" : clock(t)}</span>
      </div>

      <div css={chipsStyle}>
        {SPEEDS.map((value) => (
          <Chip
            key={value}
            label={`${value}×`}
            onClick={() => pickSpeed(value)}
            color={value === speed ? "primary" : "default"}
            variant={value === speed ? "default" : "outlined"}
            clickable
          />
        ))}
      </div>

      <Button onClick={release} variant="outlined" fullWidth>
        Let the wall carry on
      </Button>

      <Typography variant="body2" css={hintStyle}>
        If you stop for 20 seconds the wall goes back to turning by itself, so there
        is nothing here you can leave it stuck in.
      </Typography>
    </div>
  );
};

export default PlanesControls;
