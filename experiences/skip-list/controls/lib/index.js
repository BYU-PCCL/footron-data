/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useCallback, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import { Box, Button } from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import ShuffleIcon from "@material-ui/icons/Shuffle";
import ReplayIcon from "@material-ui/icons/Replay";

/*
 * Phone controls for `skip-list`.
 *
 * The wall plays the run on a loop whether anyone is here or not, so this
 * panel is not required for the exhibit to work -- it is for the visitor who
 * wants to sit on the part they did not follow, or who wants to see it happen
 * again with different data.
 *
 * Deliberately three controls and no more. There is no knob here for the
 * height cap or how many values get dealt: that changes what the captions
 * on the wall say, and a panel that can put the wall's narration out of
 * step with its picture is worse than no panel.
 *
 * Message formats -- these names are exactly the `case` labels in
 * handleMessage() in web/index.html:
 *
 *   Speed:             { type: "speed", value: <number 0.6 .. 2.0> }
 *   Pause / resume:    { type: "pause", value: <boolean> }
 *   New data:          { type: "shuffle" }
 *   Hand the wall back:{ type: "resume" }
 *
 * The wall ignores anything it does not recognize, so a panel newer than the
 * deployed build degrades instead of throwing.
 */

/* The wall clamps to this range, so the panel offers nothing outside it. */
const SPEEDS = [
  { label: "Slow", value: 0.7 },
  { label: "Normal", value: 1 },
  { label: "Fast", value: 1.6 },
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
    margin: 22px 0 8px;
  }

  .q {
    margin: 0 0 14px;
    font-size: 15px;
    font-style: italic;
    color: rgba(0, 0, 0, 0.6);
  }

  .foot {
    margin: 18px 0 0;
    font-size: 12.5px;
    color: rgba(0, 0, 0, 0.55);
  }
`;

const ControlsComponent = () => {
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);

  const { sendMessage } = useMessaging();

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
    /* Sent as the value rather than as a bare toggle, so the button's label
       and the wall still agree if a message is ever dropped. */
    await sendMessage({ type: "pause", value: next });
  }, [paused, sendMessage]);

  const shuffle = useCallback(async () => {
    setPaused(false);
    await sendMessage({ type: "shuffle" });
  }, [sendMessage]);

  /* Hands the wall back: normal speed, running, from the top. */
  const release = useCallback(async () => {
    setSpeed(1);
    setPaused(false);
    await sendMessage({ type: "resume" });
  }, [sendMessage]);

  return (
    <div css={containerStyle}>
      <p>
        <b>
          A sorted linked list with express lanes built over it, where a
          coin flip decides who gets one. The wall builds one and then
          searches it.
        </b>
      </p>

      <p className="q">Skip List</p>

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

      <div className="head">This run</div>

      <Box display="flex" flexWrap="wrap" style={{ gap: "8px" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
          onClick={togglePause}
        >
          {paused ? "Resume" : "Pause"}
        </Button>
        <Button variant="outlined" startIcon={<ShuffleIcon />} onClick={shuffle}>
          New data
        </Button>
        <Button variant="outlined" startIcon={<ReplayIcon />} onClick={release}>
          Start over
        </Button>
      </Box>

      <p className="foot">
        <b>New data</b> deals a fresh set — different values, different coin
        flips, a different search — and plays it again from the start.
        <b>Start over</b> does the same and puts the speed back to normal.
      </p>
    </div>
  );
};

export default ControlsComponent;
