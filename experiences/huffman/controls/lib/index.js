/** @jsxImportSource @emotion/react */
/**
 * Huffman phone controls.
 *
 * The wall has no keyboard, so this panel *is* the exhibit's input — everything
 * else here is secondary to getting a message onto the wall.
 *
 * It is a menu, not a text field. A free field mostly drew names and hellos:
 * short, all-distinct messages that compress badly and make the exhibit look
 * broken. Every item below is picked to land somewhere worth watching, grouped
 * by the three shapes worth seeing — a word leaning on a few letters, a real
 * sentence where the space wins, and a synthetic string at the edge of what
 * Huffman can do.
 *
 * There was a fourth group, "The long ones" — a page of Moby-Dick and 780 bases
 * of human mitochondrial DNA. They made the algorithm's best argument and the
 * wall's worst picture: too many bits to walk the decode one at a time, so the
 * payoff turned into a summarized sweep. Gone from both copies of the menu.
 *
 * Keep in sync with PICK_GROUPS in src/lib/text.ts; scripts/test-text.ts reads
 * this file as text and fails if the two menus drift apart.
 *
 * Message formats — keep in sync with src/lib/footron.ts in the Huffman repo:
 *
 *   Submit:  { type: "submit", value: "<text>" }
 *   Random:  { type: "random" }
 *   Demo:    { type: "demo", action: "play" | "stop" }
 *   Speed:   { type: "speed", value: <multiplier, 0.25…2> }
 *   Replay:  { type: "replay" }
 *
 * The wall ignores anything it doesn't recognize, so a panel newer than the
 * deployed build degrades instead of throwing.
 */
import React, { useCallback, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import Typography from "@material-ui/core/Typography";
import CasinoIcon from "@material-ui/icons/Casino";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import ReplayIcon from "@material-ui/icons/Replay";
import { useMessaging } from "@footron/controls-client";

/** A pick whose button says its own text, which is most of them. */
const plain = (text) => ({ label: text, text });

const PICK_GROUPS = [
  {
    label: "Words",
    items: [
      "MISSISSIPPI",
      "BOOKKEEPER",
      "ABRACADABRA",
      "SENSELESSNESS",
      "HULLABALOO",
      "COMMITTEE",
      "TENNESSEE",
      "BANANA",
    ].map(plain),
  },
  {
    label: "Sentences",
    items: [
      "TO BE OR NOT TO BE",
      "SHE SELLS SEASHELLS BY THE SEASHORE",
      "HOW MUCH WOOD WOULD A WOODCHUCK CHUCK",
      "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG",
      "NEVER ODD OR EVEN",
    ].map(plain),
  },
  {
    label: "Extremes",
    items: ["AAAAAAAAAB", "ABCDEFGH", "GATTACAGATTACA", "0101010101010101"].map(
      plain
    ),
  },
];

// The wall caps submissions at 1024 characters — about a page of a book, and
// set by how long the sequence takes to play rather than by what fits. Stop it
// here too so a pick can't quietly send more than will be drawn.
const MAX_LENGTH = 1024;

const SPEEDS = [
  { label: "slow", value: 0.5 },
  { label: "normal", value: 1 },
  { label: "fast", value: 2 },
];

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

/* A sentence is too long to sit on one chip line, so picks are buttons whose
   label wraps — a short word stays inline, a tongue twister takes the row. */
const pickStyle = css`
  text-transform: none;
  text-align: left;
  line-height: 1.3;
  padding: 8px 14px;

  .MuiButton-label {
    white-space: normal;
  }
`;

const hintStyle = css`
  opacity: 0.7;
  line-height: 1.5;
`;

const HuffmanControls = () => {
  const { sendMessage } = useMessaging();
  const [sent, setSent] = useState(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  // A submit is a takeover: the wall drops out of its demo reel, so keep the
  // button in step rather than leaving it showing "pause" over a stopped reel.
  const submit = useCallback(
    (value) => {
      const trimmed = (value || "").trim().slice(0, MAX_LENGTH);
      if (!trimmed) return;
      sendMessage({ type: "submit", value: trimmed });
      setPlaying(false);
      setSent(trimmed);
    },
    [sendMessage]
  );

  const setSpeedTo = useCallback(
    (value) => {
      setSpeed(value);
      sendMessage({ type: "speed", value });
    },
    [sendMessage]
  );

  const toggleDemo = useCallback(() => {
    const next = !playing;
    setPlaying(next);
    // The reel takes the wall back, so no pick is on it any more.
    if (next) setSent(null);
    sendMessage({ type: "demo", action: next ? "play" : "stop" });
  }, [playing, sendMessage]);

  return (
    <div css={containerStyle}>
      <Typography variant="h6">Huffman</Typography>
      <Typography variant="body2" css={hintStyle}>
        Pick a message and the wall builds the shortest possible code for it.
        The ones that lean on a few repeated characters squeeze the hardest.
      </Typography>

      {PICK_GROUPS.map((group) => (
        <div key={group.label} css={groupStyle}>
          <Typography variant="caption" css={groupLabelStyle}>
            {group.label}
          </Typography>
          <div css={chipsStyle}>
            {group.items.map((item) => (
              <Button
                key={item.label}
                css={pickStyle}
                variant={item.text === sent ? "contained" : "outlined"}
                color={item.text === sent ? "primary" : "default"}
                onClick={() => submit(item.text)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      ))}

      <div css={rowStyle}>
        <Button
          variant="outlined"
          startIcon={<CasinoIcon />}
          onClick={() => {
            sendMessage({ type: "random" });
            setPlaying(false);
            setSent(null);
          }}
        >
          Random
        </Button>
        <Button
          variant="outlined"
          startIcon={<ReplayIcon />}
          onClick={() => sendMessage({ type: "replay" })}
        >
          Replay
        </Button>
      </div>

      <div css={chipsStyle}>
        {SPEEDS.map((s) => (
          <Chip
            key={s.label}
            label={s.label}
            clickable
            color={speed === s.value ? "primary" : "default"}
            onClick={() => setSpeedTo(s.value)}
          />
        ))}
      </div>

      <Button
        variant="outlined"
        startIcon={playing ? <PauseIcon /> : <PlayArrowIcon />}
        onClick={toggleDemo}
      >
        {playing ? "Stop the demo reel" : "Play the demo reel"}
      </Button>
    </div>
  );
};

export default HuffmanControls;
