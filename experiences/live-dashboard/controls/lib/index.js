/** @jsxImportSource @emotion/react */
/**
 * Footron phone controls for the Live Dashboard.
 *
 * One button. The wall shows nine live measurements out of a few hundred, drifting
 * in and out on their own; this turns all nine over at once.
 *
 * It used to be a list. The panel offered every one of the 284 measurements with a
 * search box, let a visitor pick all nine, and held their choice for two minutes.
 * It worked, and it was the wrong exhibit: a wall you glance up at had become a
 * menu you operate, and the person operating it spent their turn reading three
 * hundred labels on a phone instead of looking at the thing they had walked over
 * to see. What survived the cut is the part that made people look *up* — press,
 * and the wall visibly turns over.
 *
 * The traffic is one-way, and there is nothing to synchronise: this panel is never
 * told what the wall is showing, so it can be opened, reloaded, backgrounded or
 * handed to somebody else at any moment, and two phones are two people pressing
 * the same button rather than two clients fighting over a session.
 *
 * Message format — keep in sync with src/lib/footron.ts in the Dashboard repo;
 * scripts/check-controls.mts reads this file as text and fails if the two drift:
 *
 *   Shuffle: { type: "shuffle" }
 *
 * The wall ignores anything it does not recognise, so a panel newer than the
 * deployed build degrades instead of throwing.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import ShuffleIcon from "@material-ui/icons/Shuffle";
import { useMessaging } from "@footron/controls-client";
import { COUNT } from "./catalog";

/**
 * Ignore a second press inside this many milliseconds.
 *
 * Not rate limiting — the wall can take it. It is that the tiles turn over one at
 * a time over about fifteen seconds, so a second press two seconds in restarts a
 * shuffle that is still visibly happening, and the wall looks stuck rather than
 * busy. Long enough to cover the visible part, short enough that "again" is
 * always available before anybody gives up on the button.
 */
const SETTLE_MS = 6000;

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 28px 24px;
  max-width: 420px;
  margin: 0 auto;
`;

const hintStyle = css`
  opacity: 0.72;
  line-height: 1.55;
`;

/* One target, thumb-sized, and the only thing on the screen — this is pressed by
   somebody looking at a wall four metres away, not at their hand. */
const buttonStyle = css`
  height: 108px;
  font-size: 21px;
  font-weight: 700;
  border-radius: 18px;
`;

const stateStyle = css`
  min-height: 1.6em;
  text-align: center;
  opacity: 0.6;
`;

const LiveDashboardControls = () => {
  const { sendMessage } = useMessaging();
  const [settling, setSettling] = useState(false);
  const [count, setCount] = useState(0);
  const timer = useRef(null);

  // A timer rather than a timestamp compared during render: nothing else on this
  // screen changes, so there would be no re-render to notice that the wait had
  // elapsed, and the button would sit on "Turning over…" until it was touched.
  useEffect(() => () => clearTimeout(timer.current), []);

  const shuffle = useCallback(() => {
    if (settling) return;
    setSettling(true);
    setCount((n) => n + 1);
    sendMessage({ type: "shuffle" });
    timer.current = setTimeout(() => setSettling(false), SETTLE_MS);
  }, [settling, sendMessage]);

  return (
    <div css={containerStyle}>
      <Typography variant="h6">Live Dashboard</Typography>

      <Typography variant="body2" css={hintStyle}>
        The wall is showing nine live measurements, all of them taken from one spot
        on campus — the Talmage Building. They drift in and out on their own, out
        of {COUNT} of them: the air over Provo, every earthquake on Earth today, the
        aircraft overhead, the Great Salt Lake, Wikipedia being written.
      </Typography>

      <Typography variant="body2" css={hintStyle}>
        Press the button and all nine turn over. Then look up.
      </Typography>

      <Button
        css={buttonStyle}
        fullWidth
        variant="contained"
        color="primary"
        startIcon={<ShuffleIcon />}
        disabled={settling}
        onClick={shuffle}
      >
        {settling ? "Turning over…" : count ? "Shuffle again" : "Shuffle the wall"}
      </Button>

      <Typography variant="caption" css={stateStyle}>
        {count === 0
          ? "Nine of " + COUNT + " measurements are up there right now"
          : count === 1
            ? "You changed all nine"
            : `You have changed the wall ${count} times`}
      </Typography>
    </div>
  );
};

export default LiveDashboardControls;
