/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useCallback, useRef, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import { Box, Button } from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import ShuffleIcon from "@material-ui/icons/Shuffle";
import ReplayIcon from "@material-ui/icons/Replay";

/*
 * Phone controls for `color-codes` (What Color Is This?).
 *
 * Two panels in one, because the wall has two modes and they want completely
 * different things from a phone:
 *
 *   Watching -- the wall is playing its own run. Speed, pause, a new colour.
 *               Same three controls as the other exhibits in this family.
 *   Playing  -- the wall is asking a question. Four buttons, and nothing else
 *               that could be pressed by accident while somebody is deciding.
 *
 * The wall is the authority in both. It owns the round, the score and which
 * mode is running, and sends this panel a `state` message every time any of
 * those changes -- so a second visitor picking up a phone mid-round sees the
 * round that is already on the wall, and two phones never disagree.
 *
 * Deliberately absent: the colour itself. The panel could easily draw the
 * swatch, and then a visitor would play the whole game with their back to the
 * exhibit. The codes are here; the colour is on the wall. Once an answer is in
 * there is nothing left to give away, so the swatches appear then -- that is
 * the part worth looking at twice.
 *
 * Message formats -- these names are exactly the `case` labels in
 * handleMessage() in web/index.html:
 *
 *   Switch mode:       { type: "mode", value: "game" | "show" }
 *   Answer:            { type: "answer", index: 0..3 }
 *   Another colour:    { type: "next" }
 *   Speed:             { type: "speed", value: <number 0.6 .. 2.0> }
 *   Pause / resume:    { type: "pause", value: <boolean> }
 *   New colour:        { type: "shuffle" }
 *   Hand the wall back:{ type: "resume" }
 *
 * And back the other way, from the wall, on every change:
 *
 *   { type: "state", mode: "show" }
 *   { type: "state", mode: "game", round, notation, options: [string x4],
 *     picked, correct, revealed, swatches: [hex x4] | null, right, asked }
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

const LETTERS = ["A", "B", "C", "D"];

const NOTATION_BLURB = {
  hex: "Hex — two digits per channel, in base 16. FF is 255, 00 is 0.",
  rgb: "rgb() — how much red, green and blue, each from 0 to 255.",
  hsl: "hsl() — the hue angle first, then saturation and lightness.",
};

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

  /* One option. Big enough to hit without looking down for long, because the
     thing worth looking at is across the room. */
  .option {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    justify-content: flex-start;
    text-transform: none;
    font-family: "IBM Plex Mono", ui-monospace, Consolas, monospace;
    font-size: 17px;
    font-weight: 600;
    padding: 14px 14px;
  }

  .letter {
    font-weight: 700;
    opacity: 0.55;
    min-width: 18px;
  }

  .chip {
    width: 30px;
    height: 30px;
    border-radius: 4px;
    margin-left: auto;
    border: 1px solid rgba(0, 0, 0, 0.2);
    flex: none;
  }

  .verdict {
    font-size: 20px;
    font-weight: 700;
    margin: 18px 0 4px;
  }

  .verdict.right {
    color: #1b7f4d;
  }

  .verdict.wrong {
    color: #b3261e;
  }

  .score {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.55);
    margin: 0 0 4px;
  }
`;

const ControlsComponent = () => {
  /* What the wall says is happening. Everything below reads this rather than
     guessing, so a phone that connects halfway through a round is correct
     immediately. `null` means the wall has not said yet. */
  const [wall, setWall] = useState(null);

  /* These two are the panel's own, because the wall has no opinion to send
     back about them: they only ever move when this phone moves them. */
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);

  /* A tap is acknowledged locally for the moment it takes the wall to answer,
     so a button does not sit there looking unpressed on a slow connection. */
  const [optimistic, setOptimistic] = useState(-1);
  const optimisticRound = useRef(-1);

  const { sendMessage } = useMessaging(
    useCallback((message) => {
      if (!message || message.type !== "state") return;
      setWall(message);
      /* The wall has caught up, or a new round has started: stop pretending. */
      if (message.mode !== "game" || message.round !== optimisticRound.current) {
        setOptimistic(-1);
      } else if (message.picked >= 0) {
        setOptimistic(-1);
      }
    }, [])
  );

  const mode = wall?.mode ?? "show";
  const playing = mode === "game";

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

  const play = useCallback(async () => {
    setPaused(false);
    await sendMessage({ type: "mode", value: "game" });
  }, [sendMessage]);

  const watch = useCallback(async () => {
    setPaused(false);
    setSpeed(1);
    await sendMessage({ type: "mode", value: "show" });
  }, [sendMessage]);

  const answer = useCallback(
    async (index) => {
      optimisticRound.current = wall?.round ?? -1;
      setOptimistic(index);
      await sendMessage({ type: "answer", index });
    },
    [sendMessage, wall]
  );

  const next = useCallback(async () => {
    setOptimistic(-1);
    await sendMessage({ type: "next" });
  }, [sendMessage]);

  /* ------------------------------------------------------------ playing */

  if (playing) {
    const options = wall.options ?? [];
    const revealed = !!wall.revealed;
    const picked = wall.picked >= 0 ? wall.picked : optimistic;
    const waiting = !revealed && optimistic >= 0;

    return (
      <div css={containerStyle}>
        <p>
          <b>Which of these four codes is the color on the wall?</b>
        </p>
        <p className="q">{NOTATION_BLURB[wall.notation] ?? ""}</p>

        {wall.asked > 0 && (
          <p className="score">
            Round {wall.round} · {wall.right} of {wall.asked} right so far
          </p>
        )}

        <Box display="flex" flexDirection="column" style={{ gap: "10px" }}>
          {options.map((code, i) => {
            const isRight = revealed && i === wall.correct;
            const isPicked = i === picked;
            return (
              <Button
                key={code + i}
                className="option"
                variant={isRight || isPicked ? "contained" : "outlined"}
                color={
                  isRight ? "primary" : isPicked && revealed ? "secondary" : "default"
                }
                disabled={revealed || waiting}
                onClick={() => answer(i)}
              >
                <span className="letter">{LETTERS[i]}</span>
                <span>{code}</span>
                {/* Only once the answer is in: before that, this is the whole
                    question and the swatch would be the answer. */}
                {revealed && wall.swatches && (
                  <span
                    className="chip"
                    style={{ background: wall.swatches[i] }}
                    aria-hidden="true"
                  />
                )}
              </Button>
            );
          })}
        </Box>

        {revealed && (
          <div
            className={`verdict ${wall.picked === wall.correct ? "right" : "wrong"}`}
          >
            {wall.picked === wall.correct ? "Right" : "Not this one"}
          </div>
        )}
        {revealed && (
          <p className="foot" style={{ margin: "0 0 4px" }}>
            Every one of the four is a real color — the wall is showing you all
            four of them now.
          </p>
        )}
        {waiting && <p className="foot">Sending&hellip;</p>}

        <div className="head">This round</div>
        <Box display="flex" flexWrap="wrap" style={{ gap: "8px" }}>
          <Button variant="outlined" startIcon={<ShuffleIcon />} onClick={next}>
            {revealed ? "Next color" : "Skip this one"}
          </Button>
          <Button variant="outlined" startIcon={<ReplayIcon />} onClick={watch}>
            Back to watching
          </Button>
        </Box>

        <p className="foot">
          The color is on the wall, not on your phone — that is the whole point.
          Once you answer, the wall draws every option's real color beside its
          code.
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------------ watching */

  return (
    <div css={containerStyle}>
      <p>
        <b>
          One color, written three ways. The wall picks a color and works out
          its hex, its rgb() and its hsl() in front of you.
        </b>
      </p>

      <p className="q">What color is this?</p>

      <div className="head">Play instead</div>

      <Button variant="contained" color="primary" fullWidth onClick={play}>
        Guess the code
      </Button>

      <p className="foot" style={{ margin: "8px 0 0" }}>
        The wall shows a color and four codes; you pick the right one from here.
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
          New color
        </Button>
      </Box>

      <p className="foot">
        <b>New color</b> starts the run again on a color nobody has seen yet —
        the numbers on the wall are worked out from it as it plays, so it is a
        different set of digits every time.
      </p>
    </div>
  );
};

export default ControlsComponent;
