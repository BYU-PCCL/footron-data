/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useCallback, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import { Box, Button } from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import ShuffleIcon from "@material-ui/icons/Shuffle";

/*
 * Phone controls for `data-structures` (Four Ways to Remember).
 *
 * The wall plays all four structures on a loop whether anyone is here or not,
 * so this panel is not required for the exhibit to work -- it is for the
 * visitor who wants the one they came for, or who wants to sit on the part
 * they did not follow.
 *
 * Deliberately four controls and no more. There is no knob here for the number
 * of bits in the filter or the height cap of the skip list: those change what
 * the captions on the wall say, and a panel that can put the wall's narration
 * out of step with its picture is worse than no panel.
 *
 * Message formats -- these names are exactly the `case` labels in
 * handleMessage() in experiences/data-structures/web/index.html:
 *
 *   Pick a structure:  { type: "show", value: "bloom" | "skiplist" | "unionfind" | "cuckoo" }
 *   Speed:             { type: "speed", value: <number 0.6 .. 2.0> }
 *   Pause / resume:    { type: "pause", value: <boolean> }
 *   New data:          { type: "shuffle" }
 *   Hand the wall back:{ type: "resume" }
 *
 * The wall ignores anything it does not recognize, so a panel newer than the
 * deployed build degrades instead of throwing.
 */

/* Keep in step with the `id` and `name` of each scene in web/*.js. The wall
   warns and does nothing if it is sent an id it does not have, so a drift here
   is a dead button rather than a broken exhibit. */
const STRUCTURES = [
  {
    id: "bloom",
    name: "Bloom filter",
    question: "Have I seen this before?",
    blurb: "A set that never stores what you put in it. Answers in four bytes, and is allowed to be wrong in exactly one direction.",
  },
  {
    id: "skiplist",
    name: "Skip list",
    question: "What comes next?",
    blurb: "A sorted linked list with express lanes over the top, and a coin flip decides who gets one. O(log n) with no rebalancing.",
  },
  {
    id: "unionfind",
    name: "Union-Find",
    question: "Are these two connected?",
    blurb: "An array of integers that tracks which things are in the same group. Watch a four-deep chain flatten in a single pass.",
  },
  {
    id: "cuckoo",
    name: "Cuckoo hashing",
    question: "Where did I put it?",
    blurb: "Two tables, two hashes, two places a key may live. Inserting can shove keys around; a lookup is always exactly two probes.",
  },
];

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

  /* One button per structure, stacked: the names are too long to sit side by
     side on a phone without wrapping mid-word. */
  .picks {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pick {
    display: block;
    width: 100%;
    text-align: left;
    text-transform: none;
    padding: 10px 14px;
    line-height: 1.35;
  }
  .pick .nm {
    display: block;
    font-size: 15px;
    font-weight: 600;
  }
  .pick .q {
    display: block;
    font-size: 12.5px;
    opacity: 0.7;
  }

  .blurb {
    margin: 10px 2px 0;
    font-size: 12.5px;
    color: rgba(0, 0, 0, 0.55);
    min-height: 3.4em; /* holds the longest one so the buttons never jump */
  }

  .foot {
    margin: 18px 0 0;
    font-size: 12.5px;
    color: rgba(0, 0, 0, 0.55);
  }
`;

const ControlsComponent = () => {
  /* null means the wall is running its own cycle, which is how it starts and
     what "Let it cycle" goes back to. */
  const [picked, setPicked] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);

  const { sendMessage } = useMessaging();

  const choose = useCallback(
    async (id) => {
      setPicked(id);
      /* Picking anything always starts it running: a structure chosen while
         the wall is frozen would otherwise look like the button did nothing.
         The wall clears its own pause on `show`, and this mirrors it. */
      setPaused(false);
      await sendMessage({ type: "show", value: id });
    },
    [sendMessage]
  );

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

  /* Hands the wall back: off the chosen structure, normal speed, running. */
  const release = useCallback(async () => {
    setPicked(null);
    setSpeed(1);
    setPaused(false);
    await sendMessage({ type: "resume" });
  }, [sendMessage]);

  const current = STRUCTURES.find((s) => s.id === picked);

  return (
    <div css={containerStyle}>
      <p>
        <b>
          Four data structures most courses never get to, each one built to
          answer a single question quickly. The wall plays all four in turn —
          pick one to stay on it.
        </b>
      </p>

      <div className="head">Show me</div>

      <div className="picks">
        {STRUCTURES.map((s) => (
          <Button
            key={s.id}
            className="pick"
            variant={picked === s.id ? "contained" : "outlined"}
            color={picked === s.id ? "primary" : "default"}
            onClick={() => choose(s.id)}
          >
            <span className="nm">{s.name}</span>
            <span className="q">{s.question}</span>
          </Button>
        ))}
      </div>

      <p className="blurb">
        {current
          ? current.blurb
          : "Nothing picked, so the wall is playing all four in turn, about half a minute each."}
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
        <Button variant="outlined" onClick={release}>
          Let it cycle
        </Button>
      </Box>

      <p className="foot">
        <b>New data</b> deals a fresh set — different names in the filter,
        different coin flips, a different chain of evictions — and plays the
        structure on the wall again from the start.
      </p>
    </div>
  );
};

export default ControlsComponent;
