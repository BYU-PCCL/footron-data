/** @jsxImportSource @emotion/react */
/**
 * Snow Crystal Lab -- phone controls.
 *
 * The wall has no input of its own, so this is the whole interface. What it
 * offers is a sky: five numbers that describe the air a snow crystal is
 * falling through. The crystal on the wall responds to them as it grows, which
 * means a visitor can change the weather halfway down and watch the crystal
 * change what it is doing -- start a column in warm air, lift it into cold air
 * with the updraft, and grow a plate on each end of it. That is a real
 * snowflake, a capped column, and building one by hand is the best thing in
 * here.
 *
 * Message formats (keep in sync with handleMessage in web/index.html):
 *   Change the sky:   { type: "param", key: "groundTemp", value: -8.5 }
 *   Known recipe:     { type: "preset", value: <index into presets[]> }
 *   Start again:      { type: "new" }
 *   Random sky:       { type: "random" }
 *   Hand it back:     { type: "auto" }
 *   Ask for state:    { type: "hello" }
 *
 * The wall replies with { type: "state", params, habit, auto, presets }.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";
import { useMessaging } from "@footron/controls-client";

// Mirrors PARAMS in web/index.html. Kept as a literal rather than driven off
// the wall's state message so the sliders are usable the instant the page
// opens, before the first message has arrived.
const SLIDERS = [
  {
    key: "seedAltitude",
    name: "Where it starts",
    min: 500,
    max: 7000,
    step: 50,
    format: (v) => `${Math.round(v / 10) * 10} m up`,
    note: "How high the first speck of ice forms. Higher is colder.",
    restarts: true,
  },
  {
    key: "groundTemp",
    name: "Temperature at the ground",
    min: -30,
    max: 8,
    step: 0.5,
    format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} °C`,
    note: "Above freezing and the crystal melts before it lands.",
  },
  {
    key: "lapseRate",
    name: "Cooling with height",
    min: 1.5,
    max: 10,
    step: 0.1,
    format: (v) => `−${v.toFixed(1)} °C every km`,
    note: "Steeper means the crystal crosses more kinds of air on the way down.",
  },
  {
    key: "humidity",
    name: "How much vapour",
    min: -0.25,
    max: 1.0,
    step: 0.01,
    format: (v) =>
      v <= 0 ? "drier than ice — it evaporates" : `${Math.round(v * 100)}% of what a cloud holds`,
    note: "Wet air branches. Dry air makes plain, flat plates.",
  },
  {
    key: "updraft",
    name: "Updraft",
    min: -0.6,
    max: 1.8,
    step: 0.05,
    format: (v) =>
      Math.abs(v) < 0.03
        ? "still air"
        : `${v > 0 ? "rising" : "sinking"} ${Math.abs(v).toFixed(2)} m/s`,
    note: "Push hard enough and the crystal climbs into colder air instead of falling.",
  },
];

const DEFAULTS = {
  seedAltitude: 2000,
  groundTemp: -12.5,
  lapseRate: 2.4,
  humidity: 0.9,
  updraft: 0.05,
};

// A finger on a Material slider produces far more events than a websocket
// wants. Deltas are held and flushed on a timer instead; the wall applies
// whatever it last heard, so dropping intermediate values costs nothing.
const SEND_HZ = 12;

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 22px 24px 34px;
  max-width: 460px;
  margin: 0 auto;

  p {
    margin: 0;
  }
`;

const introStyle = css`
  line-height: 1.55;
  b {
    font-weight: 600;
  }
`;

const nowStyle = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(120, 180, 240, 0.1);
  border: 1px solid rgba(120, 180, 240, 0.22);
`;

const nowLabelStyle = css`
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.65;
`;

const nowValueStyle = css`
  font-size: 17px;
  font-weight: 600;
  text-align: right;
`;

const sliderStyle = css`
  display: flex;
  flex-direction: column;
  gap: 2px;

  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
  }

  .name {
    font-size: 15px;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
    opacity: 0.9;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .note {
    font-size: 12px;
    line-height: 1.4;
    opacity: 0.6;
  }

  /* A slider aimed at a wall across the room is aimed by feel, not by sight,
     so the target is deliberately larger than the Material default. */
  .MuiSlider-root {
    padding: 16px 0;
  }
  .MuiSlider-thumb {
    width: 26px;
    height: 26px;
    margin-top: -12px;
    margin-left: -13px;
  }
  .MuiSlider-rail,
  .MuiSlider-track {
    height: 5px;
    border-radius: 3px;
  }
`;

const chipsStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .MuiChip-root {
    height: 34px;
    font-size: 13px;
  }
`;

const buttonsStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .MuiButton-root {
    flex: 1 1 44%;
    min-height: 44px;
  }
`;

const headingStyle = css`
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.6;
`;

const ControlsComponent = () => {
  const [values, setValues] = useState(DEFAULTS);
  const [habit, setHabit] = useState("");
  const [auto, setAuto] = useState(true);
  const [presets, setPresets] = useState([]);

  // Slider values are owned locally the moment a finger touches one, so the
  // knob never jumps back under the finger when a state message crosses in
  // flight. The wall's values are only adopted while nothing is being dragged.
  const dragging = useRef(false);
  const pending = useRef({});

  const { sendMessage } = useMessaging((message) => {
    if (!message || message.type !== "state") return;
    setHabit(message.habit || "");
    setAuto(!!message.auto);
    if (Array.isArray(message.presets)) setPresets(message.presets);
    if (message.params && !dragging.current) {
      setValues((prev) => ({ ...prev, ...message.params }));
    }
  });

  useEffect(() => {
    sendMessage({ type: "hello" });
  }, [sendMessage]);

  const flush = useCallback(() => {
    const keys = Object.keys(pending.current);
    if (!keys.length) return;
    const snapshot = pending.current;
    pending.current = {};
    keys.forEach((key) => sendMessage({ type: "param", key, value: snapshot[key] }));
  }, [sendMessage]);

  useEffect(() => {
    const id = setInterval(flush, 1000 / SEND_HZ);
    return () => {
      clearInterval(id);
      flush();
    };
  }, [flush]);

  const onSlide = useCallback((key, value) => {
    dragging.current = true;
    setValues((prev) => ({ ...prev, [key]: value }));
    pending.current[key] = value;
  }, []);

  const onRelease = useCallback(
    (key, value) => {
      dragging.current = false;
      pending.current[key] = value;
      flush();
    },
    [flush]
  );

  const simple = useCallback(
    (type) => () => {
      pending.current = {};
      sendMessage({ type });
    },
    [sendMessage]
  );

  const pickPreset = useCallback(
    (index) => () => {
      pending.current = {};
      sendMessage({ type: "preset", value: index });
    },
    [sendMessage]
  );

  return (
    <div css={containerStyle}>
      <Typography css={introStyle}>
        <b>A snowflake is a record of the sky it fell through.</b> Set the weather here and
        watch the crystal on the wall grow in it. Change something halfway down and it will
        change what it is doing, the way a real one does.
      </Typography>

      <div css={nowStyle}>
        <div css={nowLabelStyle}>{auto ? "Growing on its own" : "You have the sky"}</div>
        <div css={nowValueStyle}>{habit || "…"}</div>
      </div>

      {(presets.length ? presets : []).length > 0 && (
        <div>
          <div css={headingStyle}>Grow me a…</div>
          <div css={chipsStyle} style={{ marginTop: 8 }}>
            {presets.map((name, index) => (
              <Chip
                key={name}
                label={name}
                clickable
                color="primary"
                variant="outlined"
                onClick={pickPreset(index)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div css={headingStyle}>Or build your own sky</div>
      </div>

      {SLIDERS.map((s) => (
        <div css={sliderStyle} key={s.key}>
          <div className="head">
            <span className="name">{s.name}</span>
            <span className="value">{s.format(values[s.key])}</span>
          </div>
          <Slider
            min={s.min}
            max={s.max}
            step={s.step}
            value={values[s.key]}
            onChange={(_, v) => onSlide(s.key, v)}
            onChangeCommitted={(_, v) => onRelease(s.key, v)}
          />
          <span className="note">
            {s.note}
            {s.restarts ? " Changing this starts a new crystal." : ""}
          </span>
        </div>
      ))}

      <div css={buttonsStyle}>
        <Button variant="contained" color="primary" onClick={simple("new")}>
          Grow it again
        </Button>
        <Button variant="contained" color="primary" onClick={simple("random")}>
          Surprise me
        </Button>
        <Button variant="outlined" color="primary" onClick={simple("auto")}>
          Hand it back
        </Button>
      </div>

      <Typography variant="body2" style={{ opacity: 0.6, lineHeight: 1.5 }}>
        The wall goes back to running itself half a minute after you stop.
      </Typography>
    </div>
  );
};

export default ControlsComponent;
