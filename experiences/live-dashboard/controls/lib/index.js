/** @jsxImportSource @emotion/react */
/**
 * Footron phone controls for the Footron idle board.
 *
 * The wall shows nine live measurements drifting in and out. This panel is the
 * only way anybody changes which nine — there is no keyboard, no mouse and no
 * touch layer on the wall itself, so a scanned code and a phone is the whole
 * input surface of the exhibit.
 *
 * Three decisions worth knowing about:
 *
 *   **Every tap goes straight to the wall.** There is no "send" button. A
 *   visitor holding a phone four metres from a two-and-a-half-metre screen needs
 *   the wall to answer them, and it does — the tile fades and comes back holding
 *   what they just chose. A batch-then-submit panel makes the wall feel broken
 *   until the last press.
 *
 *   **The message is always the full selection.** `{ type: "board", ids: [...] }`
 *   is idempotent, so this panel can be reloaded, backgrounded or handed to
 *   somebody else and the next tap still puts the wall in a known state. Nothing
 *   here asks the wall what it is showing, and nothing here has to.
 *
 *   **Nine full means the next pick replaces the oldest.** A panel that refuses
 *   the tenth tap is a panel that has to be tidied up before it can be used
 *   again, and nobody tidies up an exhibit they are walking past.
 *
 * Message formats — keep in sync with src/lib/footron.ts in the Dashboard repo;
 * scripts/check-controls.mts reads this file as text and fails if the two drift:
 *
 *   Board:   { type: "board", ids: ["f", "local", ...] }   up to nine, in order
 *   Slot:    { type: "slot", index: 1-9, id: "f" }         one tile
 *   Shuffle: { type: "shuffle" }                           turn the rest over now
 *   Resume:  { type: "resume" }                            let go, start drifting
 *   Pace:    { type: "pace", value: "slow"|"calm"|"quick" }
 *
 * The wall ignores anything it does not recognise, so a panel newer than the
 * deployed build degrades instead of throwing.
 */
import React, { useCallback, useMemo, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import ShuffleIcon from "@material-ui/icons/Shuffle";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { useMessaging } from "@footron/controls-client";
import { ITEMS, SLOTS, TOPICS } from "./catalog";

/** The pace the wall drifts at. Keep in sync with PACES in idle-board.ts. */
const PACE_LABELS = [
  { value: "slow", label: "Slow" },
  { value: "calm", label: "Calm" },
  { value: "quick", label: "Quick" },
];

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  max-width: 480px;
  margin: 0 auto;
`;

const hintStyle = css`
  opacity: 0.7;
  line-height: 1.5;
`;

const labelStyle = css`
  opacity: 0.6;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

/* The nine, in the order they sit on the wall — reading left to right, top row
   first, which is the order the wall pins them in. */
const chosenStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
`;

const rowStyle = css`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
`;

const topicStyle = css`
  margin: 14px 0 6px;
`;

/* Full-width targets, because this is read one-handed while looking up at a
   wall rather than at the phone. */
const itemStyle = css`
  justify-content: flex-start;
  text-align: left;
  text-transform: none;
  line-height: 1.3;
  padding: 10px 14px;
`;

const listStyle = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 52vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const IdleBoardControls = () => {
  const { sendMessage } = useMessaging();
  const [chosen, setChosen] = useState([]);
  const [query, setQuery] = useState("");
  const [pace, setPace] = useState("calm");

  /** Send the whole selection. The only message a pick ever produces. */
  const publish = useCallback(
    (ids) => {
      setChosen(ids);
      sendMessage({ type: "board", ids });
    },
    [sendMessage]
  );

  const toggle = useCallback(
    (id) => {
      if (chosen.includes(id)) {
        publish(chosen.filter((x) => x !== id));
        return;
      }
      // Oldest out, newest in — a full board never becomes a dead end.
      const next = chosen.length >= SLOTS ? chosen.slice(1) : chosen;
      publish([...next, id]);
    },
    [chosen, publish]
  );

  const shuffle = useCallback(() => sendMessage({ type: "shuffle" }), [sendMessage]);

  const drift = useCallback(() => {
    setChosen([]);
    // `resume` rather than an empty board: it says what it means, and the wall
    // hands the tiles back to the rotation without waiting out the hold.
    sendMessage({ type: "resume" });
  }, [sendMessage]);

  const choosePace = useCallback(
    (value) => {
      setPace(value);
      sendMessage({ type: "pace", value });
    },
    [sendMessage]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ITEMS.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 60);
  }, [query]);

  const labelOf = useMemo(
    () => Object.fromEntries(ITEMS.map((i) => [i.id, i.label])),
    []
  );

  const item = (i) => (
    <Button
      key={i.id}
      css={itemStyle}
      fullWidth
      variant={chosen.includes(i.id) ? "contained" : "outlined"}
      color={chosen.includes(i.id) ? "primary" : "default"}
      onClick={() => toggle(i.id)}
    >
      {i.label}
    </Button>
  );

  return (
    <div css={containerStyle}>
      <Typography variant="h6">What is on the wall</Typography>
      <Typography variant="body2" css={hintStyle}>
        The wall shows nine live measurements, drifting in and out. Pick the ones
        you want and they go up as you tap. They hold for two minutes, then the
        wall starts drifting again.
      </Typography>

      <span css={labelStyle}>
        <Typography variant="caption">
          {chosen.length ? `${chosen.length} of ${SLOTS} chosen` : "Nothing chosen — the wall is drifting"}
        </Typography>
      </span>
      <div css={chosenStyle}>
        {chosen.map((id) => (
          <Chip key={id} label={labelOf[id] || id} onDelete={() => toggle(id)} />
        ))}
      </div>

      <div css={rowStyle}>
        <Button fullWidth variant="outlined" startIcon={<ShuffleIcon />} onClick={shuffle}>
          Shuffle the rest
        </Button>
        <Button fullWidth variant="outlined" startIcon={<PlayArrowIcon />} onClick={drift}>
          Let it drift
        </Button>
      </div>

      <div css={rowStyle}>
        {PACE_LABELS.map((p) => (
          <Button
            key={p.value}
            fullWidth
            variant={pace === p.value ? "contained" : "outlined"}
            color={pace === p.value ? "primary" : "default"}
            onClick={() => choosePace(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <TextField
        fullWidth
        size="small"
        variant="outlined"
        placeholder="Search — moon, earthquake, BYU…"
        value={query}
        inputProps={{ spellCheck: false, autoCapitalize: "none" }}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div css={listStyle}>
        {results ? (
          results.length ? (
            results.map(item)
          ) : (
            <Typography variant="body2" css={hintStyle}>
              Nothing matches “{query}”.
            </Typography>
          )
        ) : (
          TOPICS.map((t) => (
            <div key={t.id}>
              <div css={topicStyle}>
                <span css={labelStyle}>
                  <Typography variant="caption">{t.title}</Typography>
                </span>
              </div>
              {t.items.map(item)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IdleBoardControls;
