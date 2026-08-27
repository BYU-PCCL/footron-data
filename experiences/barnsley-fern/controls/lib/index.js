/** @jsxImportSource @emotion/react */
/**
 * Barnsley's Fern — phone controls.
 *
 * This is the whole interface. The wall has no keyboard, no mouse and no
 * touchscreen, so every adjustment a visitor can make happens here.
 *
 * The ordering is the main design decision in this file. A visitor has the wall
 * for a couple of minutes and will not read it, so the named plants come first:
 * one tap and the fern on the wall is visibly a different plant, which is the
 * moment someone understands that the thing across the room is listening to
 * them. The five knobs come after, because they are the actual point of the
 * piece — each one reaches into a matrix, and the coefficients on the wall move
 * while you hold it — but they only land once you already believe you are
 * driving.
 *
 * Message formats (keep in sync with footron.js in this repo):
 *   Knob:      { type: "knob", key: "turn2" | …, value: <number>, live: <bool> }
 *              live:true while a finger is down, live:false on release
 *   Plant:     { type: "preset", value: "barnsley" | … | "random" }
 *   New walk:  { type: "walk" }
 *   Pause:     { type: "pause", value: <bool> }
 *   Hand back: { type: "release" }
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { useMessaging } from "@footron/controls-client";

// Ids only — the wall owns the numbers behind each one (PRESETS in footron.js),
// so a plant can be re-tuned without shipping a new controls bundle. The
// sub-labels say what the plant looks like rather than which knob moved,
// because "leaflets swept up" is checkable from across the room and
// "twistLeaf = 38°" is not.
const PLANTS = [
  { key: "barnsley", label: "Barnsley's", note: "the original" },
  { key: "crozier", label: "Crozier", note: "curls into a hook" },
  { key: "feather", label: "Feather", note: "broad, leaflets up" },
  { key: "arch", label: "Arch", note: "long and thin" },
  { key: "spiral", label: "Spiral", note: "coils in on itself" },
];

// Mirrors KNOBS in app.js — same order, same bounds, same formatting, so the
// number under a finger here is the number on the wall. The wall clamps
// everything again on arrival; these bounds are a courtesy, not the guarantee.
const KNOBS = [
  {
    key: "turn2",
    label: "Stem curl",
    note: "turns f₂ — straight, or curled like a fiddlehead",
    min: -18, max: 18, step: 0.25, def: 0,
    fmt: (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}°`,
  },
  {
    key: "scale2",
    label: "Shrink",
    note: "scales f₂ — how many leaflets fit before it runs out",
    min: 0.88, max: 1.09, step: 0.002, def: 1,
    fmt: (v) => `${(0.85085 * v).toFixed(3)}×`,
  },
  {
    key: "twistLeaf",
    label: "Leaflet twist",
    note: "turns f₃ and f₄ — sweeps the bottom leaflets up or down",
    min: -50, max: 50, step: 0.5, def: 0,
    fmt: (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}°`,
  },
  {
    key: "scaleLeaf",
    label: "Leaflet size",
    note: "scales f₃ and f₄ — side-shoots, or leaflets that rival the plant",
    min: 0.5, max: 1.7, step: 0.01, def: 1,
    fmt: (v) => `${v.toFixed(2)}×`,
  },
  {
    key: "p2",
    label: "Dice weight",
    note: "odds of f₂ against the leaflets — where the points go, not the shape",
    min: 0.62, max: 0.94, step: 0.002, def: 0.85,
    fmt: (v) => `p = ${v.toFixed(2)}`,
  },
];

// Live messages per second while a finger is down. The wall redraws a thin
// sketch of the plant once a frame no matter how many arrive, so more than this
// buys nothing and a socket full of them arrives late and reads as lag.
const LIVE_HZ = 15;

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  max-width: 420px;
  margin: 0 auto;
`;

const hintStyle = css`
  opacity: 0.7;
  line-height: 1.5;
`;

const sectionTitleStyle = css`
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: -8px;
`;

const plantsStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const chipStyle = css`
  height: auto;
  padding: 6px 2px;
  .MuiChip-label {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.3;
  }
  .MuiChip-label small {
    font-size: 11px;
    opacity: 0.65;
  }
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

const noteStyle = css`
  font-size: 11px;
  opacity: 0.5;
  line-height: 1.4;
  margin-top: -2px;
`;

const rowStyle = css`
  display: flex;
  flex-direction: row;
  gap: 12px;
`;

const defaults = () => {
  const out = {};
  KNOBS.forEach((k) => { out[k.key] = k.def; });
  return out;
};

const FernControls = () => {
  const { sendMessage } = useMessaging();

  // A mirror of the wall's knobs. The wall never reports back, so this is what
  // this phone has asked for rather than what the wall is showing — which is
  // the right place for a slider to sit, and honest as long as nothing else is
  // driving the wall at the same time.
  const [values, setValues] = useState(defaults);
  const [plant, setPlant] = useState("barnsley");
  const [paused, setPaused] = useState(false);

  // One pending live value, flushed on a timer. A finger produces `onChange`
  // far faster than the wall needs it and only the most recent position
  // matters, so keep the last one and drop the rest.
  const pending = useRef(null);
  const timer = useRef(null);

  const flush = useCallback(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    sendMessage({ type: "knob", key: p.key, value: p.value, live: true });
  }, [sendMessage]);

  useEffect(() => {
    timer.current = setInterval(flush, 1000 / LIVE_HZ);
    return () => clearInterval(timer.current);
  }, [flush]);

  const slide = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    pending.current = { key, value };
  }, []);

  // On release the wall re-measures the attractor and draws the plant properly,
  // which is the expensive half — so it happens once, when the finger lifts.
  const commit = useCallback(
    (key, value) => {
      pending.current = null;
      setPlant(null);   // these are nobody's numbers now
      sendMessage({ type: "knob", key, value, live: false });
    },
    [sendMessage]
  );

  const pickPlant = useCallback(
    (key) => {
      setPlant(key);
      sendMessage({ type: "preset", value: key });
      // The wall moves all five knobs for a named plant, so mirror them or the
      // sliders below would sit at stale positions. Only the shapes this UI can
      // name are mirrored; "Random plant" is the wall's own dice, so the
      // sliders are left showing that we no longer know.
      const preset = {
        barnsley: { turn2: 0, scale2: 1, twistLeaf: 0, scaleLeaf: 1, p2: 0.85 },
        crozier: { turn2: 15, scale2: 1.015, twistLeaf: 14, scaleLeaf: 1.05, p2: 0.86 },
        feather: { turn2: 0, scale2: 0.985, twistLeaf: 38, scaleLeaf: 1.35, p2: 0.72 },
        arch: { turn2: -4, scale2: 1.06, twistLeaf: -12, scaleLeaf: 0.72, p2: 0.9 },
        spiral: { turn2: -16, scale2: 1.03, twistLeaf: 26, scaleLeaf: 1.15, p2: 0.8 },
      }[key];
      if (preset) setValues(preset);
    },
    [sendMessage]
  );

  const randomPlant = useCallback(() => {
    setPlant(null);
    sendMessage({ type: "preset", value: "random" });
  }, [sendMessage]);

  const togglePause = useCallback(() => {
    setPaused((prev) => {
      const value = !prev;
      sendMessage({ type: "pause", value });
      return value;
    });
  }, [sendMessage]);

  const release = useCallback(() => {
    sendMessage({ type: "release" });
    setValues(defaults());
    setPlant("barnsley");
    setPaused(false);
  }, [sendMessage]);

  return (
    <div css={containerStyle}>
      <Typography variant="body2" css={hintStyle}>
        One point, four rules, and a die. Nothing on the wall draws a leaf — the
        fern is just everywhere the walk can go. Change the rules and it becomes
        a different plant.
      </Typography>

      <div css={sectionTitleStyle}>Plants</div>
      <div css={plantsStyle}>
        {PLANTS.map((p) => (
          <Chip
            key={p.key}
            css={chipStyle}
            label={<><span>{p.label}</span><small>{p.note}</small></>}
            onClick={() => pickPlant(p.key)}
            color={p.key === plant ? "primary" : "default"}
            variant={p.key === plant ? "default" : "outlined"}
            clickable
          />
        ))}
        <Chip
          css={chipStyle}
          label={<><span>Random plant</span><small>all five, at once</small></>}
          onClick={randomPlant}
          color="secondary"
          clickable
        />
      </div>

      <div css={sectionTitleStyle}>The matrices</div>
      <Typography variant="body2" css={hintStyle}>
        Each knob turns or scales one of the four maps. Hold one and watch the
        coefficients on the wall move with it.
      </Typography>

      {KNOBS.map((k) => (
        <div key={k.key}>
          <div css={labelRowStyle}>
            <span>{k.label}</span>
            <span css={valueStyle}>{k.fmt(values[k.key])}</span>
          </div>
          <Slider
            value={values[k.key]}
            min={k.min}
            max={k.max}
            step={k.step}
            onChange={(_, value) => slide(k.key, value)}
            onChangeCommitted={(_, value) => commit(k.key, value)}
            aria-label={k.label}
          />
          <div css={noteStyle}>{k.note}</div>
        </div>
      ))}

      <div css={rowStyle}>
        <Button
          onClick={togglePause}
          startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
          variant="outlined"
          fullWidth
        >
          {paused ? "Run" : "Freeze"}
        </Button>
        <Button
          onClick={() => sendMessage({ type: "walk" })}
          variant="outlined"
          fullWidth
        >
          New walk
        </Button>
      </div>

      <Button onClick={release} variant="outlined" fullWidth>
        Let the wall carry on
      </Button>

      <Typography variant="body2" css={hintStyle}>
        Leave it alone for 45 seconds and the wall puts Barnsley&rsquo;s own
        numbers back, so there is nothing here you can leave it stuck in.
      </Typography>
    </div>
  );
};

export default FernControls;
