/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useCallback, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import { Box, Button, Slider } from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";

/*
 * Phone controls for `trickortreat` (The Candy Route).
 *
 * This panel is the standalone page's bottom action bar, moved off the wall.
 * That bar -- house count, speed, pause, new block, and the keyboard shortcuts
 * it advertised -- was stripped out of experiences/trickortreat/web/index.html,
 * because the wall has no pointer and no keyboard and nothing on it was ever
 * touchable. The message names below are exactly the `case` labels in that
 * file's handleMessage().
 *
 * The wall never sends anything back -- it mounts a Messaging client and only
 * adds a listener -- so this panel is write-only and owns its own copy of the
 * state, seeded from the wall's defaults. That stays honest because the wall
 * never moves these values on its own: at the end of the finale it lays out a
 * fresh block and starts over, without ever changing the house count, the speed
 * or whether it is paused.
 */

// The wall's constants, and they have to agree with it: MIN_N/MAX_N are what it
// clamps against, so the number on the phone is always the number it used, and
// EXACT_MAX is where it stops running Held-Karp at all.
const MIN_N = 6;
const MAX_N = 24;
const DEFAULT_N = 12;
const EXACT_MAX = 15;

// The three speeds the action bar offered, unchanged.
const SPEEDS = [
  { label: "Slow", value: 0.65 },
  { label: "Normal", value: 1 },
  { label: "Fast", value: 1.9 },
];

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

  .readout {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 14px;
  }

  /* Tabular figures so the count does not jitter sideways mid-drag, which on a
     phone reads as the label itself being dragged. */
  .readout b {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  /* The MUI default leaves a slider row taller than its own thumb, which is
     wasted height on a phone. */
  .MuiSlider-root {
    padding: 8px 0;
    display: block;
  }

  .note {
    margin: 2px 0 0;
    font-size: 12.5px;
    color: rgba(0, 0, 0, 0.55);
    min-height: 2.6em; /* holds both notes so the buttons below never jump */
  }

  .foot {
    margin: 18px 0 0;
    font-size: 12.5px;
    color: rgba(0, 0, 0, 0.55);
  }
`;

const ControlsComponent = () => {
  const [houses, setHouses] = useState(DEFAULT_N);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);

  const { sendMessage } = useMessaging();

  /*
   * The house count moves on release only. On the wall it runs generate(),
   * which re-scatters the block, re-solves it four ways -- Held-Karp included,
   * which is exponential -- and restarts the run from the top. Dragging it live
   * would do all of that on every pointermove.
   */
  const commitHouses = useCallback(
    async (event, value) => {
      // The wall clears its own pause when it lays out a new block, so the
      // button here has to follow it or it would offer to resume a block that
      // is already running.
      setPaused(false);
      await sendMessage({ type: "houses", value });
    },
    [sendMessage]
  );

  // Speed is a bare number on the wall, so it can go as it is pressed.
  const chooseSpeed = useCallback(
    async (value) => {
      setSpeed(value);
      await sendMessage({ type: "speed", value });
    },
    [sendMessage]
  );

  const togglePause = useCallback(async () => {
    const next = !paused;
    setPaused(next);
    // Sent as the value rather than as a bare toggle, so the button's label and
    // the wall still agree if a message is ever dropped.
    await sendMessage({ type: "pause", value: next });
  }, [paused, sendMessage]);

  // Also clears the pause on the wall, mirrored here.
  const newBlock = useCallback(async () => {
    setPaused(false);
    await sendMessage({ type: "newBlock" });
  }, [sendMessage]);

  // Hands the wall back: twelve houses, normal speed, running.
  const resume = useCallback(async () => {
    setHouses(DEFAULT_N);
    setSpeed(1);
    setPaused(false);
    await sendMessage({ type: "resume" });
  }, [sendMessage]);

  return (
    <div css={containerStyle}>
      <p>
        <b>
          Four trick-or-treaters walk the same block four different ways: any old
          order, always-nearest-house, untangling the crossings, and one that
          checks enough to prove it found the shortest route there is. Add houses
          and watch which of them can keep up.
        </b>
      </p>

      <div className="head">Houses</div>

      <div className="readout">
        <span>Houses on the block</span>
        <b>{houses}</b>
      </div>
      <Slider
        min={MIN_N}
        max={MAX_N}
        step={1}
        value={houses}
        onChange={(event, value) => setHouses(value)}
        onChangeCommitted={commitHouses}
      />
      <p className="note">
        {houses > EXACT_MAX
          ? `Over ${EXACT_MAX} houses the perfect route costs more than it is worth to work out, so the green ghost sits this one out.`
          : "The green ghost can still prove its route is the shortest one."}
      </p>

      <div className="head">Speed</div>

      <Box display="flex" style={{ gap: "8px" }}>
        {SPEEDS.map((option) => (
          <Button
            key={option.label}
            fullWidth
            variant={speed === option.value ? "contained" : "outlined"}
            color={speed === option.value ? "primary" : "default"}
            onClick={() => chooseSpeed(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </Box>

      <div className="head">The block</div>

      <Box display="flex" flexWrap="wrap" style={{ gap: "8px" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
          onClick={togglePause}
        >
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button variant="outlined" onClick={newBlock}>
          New block
        </Button>
        <Button variant="outlined" onClick={resume}>
          Reset
        </Button>
      </Box>

      <p className="foot">
        Changing the number of houses lays out a new block and starts the four of
        them over from the beginning.
      </p>
    </div>
  );
};

export default ControlsComponent;
