/** @jsxImportSource @emotion/react */
/**
 * Ghost Fleet — phone controls.
 *
 * The wall fights its own battle and explains itself without help. Everything
 * here is optional, which shapes the design: there is no state a visitor has
 * to set up before the piece makes sense, and nothing they can leave it stuck
 * in. Walk away and the wall returns to its own loop inside a minute.
 *
 * Ordering is the design decision. Give fire comes first, because it is the
 * one thing a visitor wants to do to a ship and it needs no explanation — the
 * wall answering with six guns going off in sequence is the moment they
 * realise the thing across the room is listening. Naming a ship comes next,
 * because watching the other fleet turn toward her is the second thing they
 * try. Camera and weather sit further down, where the people who want them
 * will look.
 *
 * Send-only, like every other panel in this repository: `useMessaging` is the
 * whole interface and the wall never replies. The ship names are fixed at
 * build time so the list needs no live state — a ship already lost is simply
 * ignored by the wall, which is the right failure for a control a visitor is
 * pressing at a distance.
 *
 * Message formats — keep in sync with web/src/footron.js:
 *   { type: "fire",   value: "crimson" | "azure" | "both" }
 *   { type: "target", value: <ship index> }
 *   { type: "camera", value: "orbit" | "follow" | "cinematic" }
 *   { type: "storm",  value: <bool> }
 *   { type: "reset"  }
 *   { type: "replay" }
 *   { type: "release" }
 */
import React, { useCallback, useState } from "react";
import { css } from "@emotion/react";
import { useMessaging } from "@footron/controls-client";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

const rootStyle = css`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 18px 32px;
`;

const sectionStyle = css`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const labelStyle = css`
  font-size: 11px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  opacity: 0.55;
`;

const rowStyle = css`
  display: flex;
  gap: 10px;
`;

const fireStyle = css`
  flex: 1;
  min-height: 64px;
  font-weight: 600;
  letter-spacing: 0.1em;
`;

const shipStyle = css`
  justify-content: flex-start;
  text-transform: none;
  letter-spacing: 0.02em;
  padding: 13px 16px;
`;

const hintStyle = css`
  opacity: 0.55;
  line-height: 1.5;
`;

const CRIMSON = "#ff6b62";
const AZURE = "#5fb8ff";

/* Indices match the fleet layout the wall builds in sim/world.js. */
const SHIPS = [
  { index: 0, name: "Vermillion Oath", colour: CRIMSON },
  { index: 1, name: "Ash & Ember", colour: CRIMSON },
  { index: 2, name: "Cold Meridian", colour: AZURE },
  { index: 3, name: "Salt Lantern", colour: AZURE },
];

const FleetControls = () => {
  const { sendMessage } = useMessaging();
  const [stormy, setStormy] = useState(false);

  const send = useCallback(
    (payload) => {
      sendMessage(payload);
    },
    [sendMessage]
  );

  const toggleStorm = useCallback(() => {
    setStormy((was) => {
      send({ type: "storm", value: !was });
      return !was;
    });
  }, [send]);

  return (
    <div css={rootStyle}>
      <div css={sectionStyle}>
        <span css={labelStyle}>Give fire</span>
        <div css={rowStyle}>
          <Button
            css={fireStyle}
            variant="contained"
            style={{ background: CRIMSON, color: "#170a09" }}
            onClick={() => send({ type: "fire", value: "crimson" })}
          >
            Crimson
          </Button>
          <Button
            css={fireStyle}
            variant="contained"
            style={{ background: AZURE, color: "#04121d" }}
            onClick={() => send({ type: "fire", value: "azure" })}
          >
            Azure
          </Button>
        </div>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => send({ type: "fire", value: "both" })}
        >
          Everyone, all at once
        </Button>
      </div>

      <div css={sectionStyle}>
        <span css={labelStyle}>Mark a ship</span>
        {SHIPS.map((ship) => (
          <Button
            key={ship.index}
            css={shipStyle}
            variant="outlined"
            fullWidth
            style={{ borderLeft: `3px solid ${ship.colour}` }}
            onClick={() => send({ type: "target", value: ship.index })}
          >
            {ship.name}
          </Button>
        ))}
        <Typography variant="body2" css={hintStyle}>
          The other fleet comes round to bring its guns to bear &mdash; they are
          in ports, not turrets, so a ship has to manoeuvre before she can
          answer.
        </Typography>
      </div>

      <div css={sectionStyle}>
        <span css={labelStyle}>The wall</span>
        <div css={rowStyle}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => send({ type: "camera", value: "orbit" })}
          >
            Orbit
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => send({ type: "camera", value: "follow" })}
          >
            Follow
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => send({ type: "camera", value: "cinematic" })}
          >
            Cinematic
          </Button>
        </div>
        <Button variant="outlined" fullWidth onClick={toggleStorm}>
          {stormy ? "Calm the sea" : "Summon a squall"}
        </Button>
      </div>

      <div css={sectionStyle}>
        <div css={rowStyle}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => send({ type: "replay" })}
          >
            Replay the opening
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => send({ type: "reset" })}
          >
            Fresh fleet
          </Button>
        </div>
      </div>

      <Button
        variant="outlined"
        fullWidth
        onClick={() => send({ type: "release" })}
      >
        Let the wall carry on
      </Button>

      <Typography variant="body2" css={hintStyle}>
        Leave it alone for forty seconds and the wall takes itself back, so
        there is nothing here you can leave it stuck in.
      </Typography>
    </div>
  );
};

export default FleetControls;
