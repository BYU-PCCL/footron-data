/** @jsxImportSource @emotion/react */
/* eslint-disable react/prop-types */
/*
 * SettingRow takes props, and footron-web's eslint config extends
 * `plugin:react/recommended`, where `react/prop-types` is an error rather than
 * a warning -- so it fails the build outright, and `CI=` in the workflow does
 * not save it the way it does an ordinary warning. Satisfying the rule properly
 * would mean `import PropTypes from "prop-types"`, which footron-web does not
 * depend on directly; it resolves today only as a transitive dependency of
 * react-scripts. Same wall twindragon and gradient-descent hit, same way out.
 * Runtime prop checking earns nothing here anyway: SettingRow is private to
 * this file and every call site is a few lines below.
 */
import { css } from "@emotion/react";
import React, { useCallback, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import { Box, Button, Slider } from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import SkipNextIcon from "@material-ui/icons/SkipNext";

/*
 * Phone controls for `leaves` (Wasatch Fall).
 *
 * This panel is the ONLY way to drive the scene. The wall page carries no
 * buttons and no sliders at all -- the standalone version's bottom action bar
 * and its `C` controls panel were both stripped out of
 * experiences/leaves/web/index.html, because the wall has no pointer and
 * nothing on it is touchable. Every control the standalone page had lives here
 * instead, and the message names below are exactly the `case` labels in that
 * file's handleMessage().
 *
 * The wall never sends anything back -- it mounts a Messaging client and only
 * adds a listener. So this panel is write-only and owns its own copy of the
 * state, seeded from the wall's defaults. That stays honest because the wall
 * never changes these values on its own: it rolls one season into the next
 * without ever pausing, so `playing` cannot drift out from under us. The two
 * places it DOES force a value are `replay` and `newWoods`, which both call
 * setPlaying(true) on the wall -- mirrored below -- and `resume`, which resets
 * everything to defaults.
 */

// The wall's starting values: model.js DEFAULT_CONTROLS, plus speed and density,
// which are renderer settings the model has no field for and which the wall
// holds in its own CTL object at 1x.
const DEFAULTS = {
  temp: 0,
  cloud: 25,
  wind: 3,
  winterPrecip: 1,
  precip: 1,
  latitude: 40.65,
  speed: 1,
  density: 1,
};

const times = (v) => v.toFixed(2) + " ×";

/*
 * Ranges and steps are the standalone page's sliders, and they match the
 * CTL_RANGE table the wall clamps against -- so the panel cannot ask for a
 * value the wall will silently reel back in, and the number shown on the phone
 * is always the number the model got.
 *
 * Order is not the standalone page's. The three settings named in
 * config.json's action_hints ("make the autumn colder or warmer", "clear the
 * clouds for brighter reds", "bring the wind up") come first, so that someone
 * who picked up the phone because of a hint on the wall finds that control
 * without scrolling. The remaining three are the slower, less legible knobs.
 */
const ENVIRONMENT = [
  {
    msg: "temp",
    label: "Temperature",
    min: -6,
    max: 6,
    step: 0.5,
    // Signed, because which side of the baseline you are on is the whole point:
    // warm and frost-free is the brilliant autumn, a freeze ends the reds.
    format: (v) => (v >= 0 ? "+" : "") + v.toFixed(1) + " °C",
  },
  {
    msg: "cloud",
    label: "Cloud cover",
    min: 0,
    max: 100,
    step: 1,
    format: (v) => v + " %",
  },
  {
    msg: "wind",
    label: "Mean wind",
    min: 0,
    max: 12,
    step: 0.25,
    format: (v) => v.toFixed(1) + " m/s",
  },
  {
    msg: "winterPrecip",
    label: "Winter precip (Jan–Mar)",
    min: 0.3,
    max: 1.8,
    step: 0.05,
    format: times,
  },
  {
    msg: "precip",
    label: "In-season rain",
    min: 0,
    max: 3,
    step: 0.05,
    format: times,
  },
  {
    msg: "latitude",
    label: "Latitude",
    min: 30,
    max: 46,
    step: 0.5,
    format: (v) => v.toFixed(1) + " °N",
  },
];

// Not weather: these two are the clock and the renderer, which is why the panel
// keeps them in their own sections rather than in the list above.
const SPEED = { msg: "speed", label: "Speed", min: 0.25, max: 6, step: 0.25, format: times };
const DENSITY = { msg: "density", label: "Leaf density", min: 0.3, max: 1.6, step: 0.05, format: times };

const containerStyle = css`
  padding: 16px;
  overflow-x: hidden;

  p {
    margin: 0 0 16px;
  }

  .head {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(0, 0, 0, 0.5);
    margin: 22px 0 6px;
  }

  .setting + .setting {
    margin-top: 6px;
  }

  .setting label {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 14px;
  }

  /* Tabular figures so the readout does not jitter sideways mid-drag, which on
     a phone reads as the label itself being dragged. */
  .setting label b {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  /* The MUI default leaves a slider row taller than its own thumb; on a phone
     that spreads seven of these over more than a screen for no reason. */
  .setting .MuiSlider-root {
    padding: 8px 0;
    display: block;
  }

  .foot {
    margin: 18px 0 0;
    font-size: 12.5px;
    color: rgba(0, 0, 0, 0.55);
  }
`;

// One labelled slider. `spec` is a row out of the tables above, so the range,
// the step and the readout format all travel together and cannot drift apart.
const SettingRow = ({ spec, value, onChange, onChangeCommitted }) => (
  <div className="setting">
    <label>
      <span>{spec.label}</span>
      <b>{spec.format(value)}</b>
    </label>
    <Slider
      min={spec.min}
      max={spec.max}
      step={spec.step}
      value={value}
      onChange={onChange}
      onChangeCommitted={onChangeCommitted}
    />
  </div>
);

const ControlsComponent = () => {
  const [values, setValues] = useState(DEFAULTS);
  const [playing, setPlaying] = useState(true);

  const { sendMessage } = useMessaging();

  // Everything except density: write it through as it moves, so the hillside
  // answers under your thumb. These are cheap on the wall -- a field write plus,
  // on day 0 only, one re-seeded environment day.
  const setLive = useCallback(
    async (msg, value) => {
      setValues((prev) => ({ ...prev, [msg]: value }));
      await sendMessage({ type: msg, value });
    },
    [sendMessage]
  );

  // Density is the exception. On the wall it runs buildScene(), which lays out
  // every tree and all ~9,600 leaves from scratch, so it moves on release only:
  // dragging it live would rebuild the whole hillside on every pointermove.
  const setDensityLocal = useCallback((event, value) => {
    setValues((prev) => ({ ...prev, density: value }));
  }, []);

  const commitDensity = useCallback(
    async (event, value) => {
      await sendMessage({ type: "density", value });
    },
    [sendMessage]
  );

  const togglePlay = useCallback(async () => {
    const next = !playing;
    setPlaying(next);
    // Sent explicitly rather than as a bare toggle, so the button's label and
    // the wall agree even if a message is ever dropped.
    await sendMessage({ type: "play", value: next });
  }, [playing, sendMessage]);

  // The wall pauses itself on a step, so the button has to follow it down or it
  // would still be offering to pause an already-frozen season.
  const step = useCallback(async () => {
    setPlaying(false);
    await sendMessage({ type: "step" });
  }, [sendMessage]);

  // Both of these call setPlaying(true) on the wall.
  const replay = useCallback(async () => {
    setPlaying(true);
    await sendMessage({ type: "replay" });
  }, [sendMessage]);

  const newWoods = useCallback(async () => {
    setPlaying(true);
    await sendMessage({ type: "newWoods" });
  }, [sendMessage]);

  // Hands the wall back: defaults, full density, playing. The wall's `resume`
  // resets all eight values, so the panel resets all eight too.
  const resume = useCallback(async () => {
    setValues(DEFAULTS);
    setPlaying(true);
    await sendMessage({ type: "resume" });
  }, [sendMessage]);

  return (
    <div css={containerStyle}>
      <p>
        <b>
          Every leaf on this hillside is simulated one autumn day at a time.
          Cold nights build the reds, sunlight makes them brighter, and wind
          only carries off leaves the tree has already let go. Change the
          weather and watch the season answer.
        </b>
      </p>

      <div className="head">Season</div>

      <Box display="flex" alignItems="center" style={{ gap: "8px" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={playing ? <PauseIcon /> : <PlayArrowIcon />}
          onClick={togglePlay}
        >
          {playing ? "Pause" : "Play"}
        </Button>
        <Button variant="outlined" startIcon={<SkipNextIcon />} onClick={step}>
          A day
        </Button>
      </Box>

      <Box mt={1}>
        <SettingRow
          spec={SPEED}
          value={values.speed}
          onChange={(event, value) => setLive("speed", value)}
        />
      </Box>

      <div className="head">Weather</div>

      {ENVIRONMENT.map((spec) => (
        <SettingRow
          key={spec.msg}
          spec={spec}
          value={values[spec.msg]}
          onChange={(event, value) => setLive(spec.msg, value)}
        />
      ))}

      <div className="head">Hillside</div>

      <SettingRow
        spec={DENSITY}
        value={values.density}
        onChange={setDensityLocal}
        onChangeCommitted={commitDensity}
      />

      <Box display="flex" flexWrap="wrap" mt={2} style={{ gap: "8px" }}>
        <Button variant="contained" color="primary" onClick={newWoods}>
          New hillside
        </Button>
        <Button variant="outlined" onClick={replay}>
          Replay season
        </Button>
        <Button variant="outlined" onClick={resume}>
          Reset
        </Button>
      </Box>

      <p className="foot">
        Weather takes effect going forward &mdash; a leaf already brown does not
        go back. Replay the season to see a change from the first green day.
      </p>
    </div>
  );
};

export default ControlsComponent;
