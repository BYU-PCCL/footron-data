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
 * realise the thing across the room is listening. The fleet list comes next,
 * because naming a ship and watching the other side turn toward her is the
 * second thing they try. Camera and weather are further down, where the people
 * who want them will look.
 *
 * Message formats — keep in sync with web/src/footron.js:
 *   { type: "fire",   value: "crimson" | "azure" | "both" }
 *   { type: "target", value: <ship index> }
 *   { type: "camera", value: "orbit" | "follow" | "cinematic" }
 *   { type: "storm",  value: <bool> }
 *   { type: "reset"  }
 *   { type: "replay" }
 *   { type: "release" }
 *
 * The wall pushes { type: "fleet", ships: [...] } every second and a half so
 * this list stays honest as hulls are lost and fleets re-raised.
 */
import React, { useCallback, useEffect, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";

const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 20px 18px 30px;
    color: #f2ece0;
  `,
  section: css`
    display: flex;
    flex-direction: column;
    gap: 9px;
  `,
  label: css`
    font-size: 11px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    opacity: 0.55;
  `,
  row: css`
    display: flex;
    gap: 9px;
  `,
  fire: css`
    flex: 1;
    min-height: 62px;
    font-weight: 600;
    letter-spacing: 0.1em;
  `,
  ship: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 12px 15px;
    text-transform: none;
    letter-spacing: 0.02em;
  `,
  bar: css`
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.14);
    overflow: hidden;
  `,
  note: css`
    font-size: 12px;
    opacity: 0.5;
    line-height: 1.5;
  `,
};

const FACTION_COLOUR = { crimson: "#ff6b62", azure: "#5fb8ff" };

export default function Controls({ messaging }) {
  const [fleet, setFleet] = useState([]);
  const [stormy, setStormy] = useState(false);

  useEffect(() => {
    if (!messaging) return;
    // the wall is the source of truth for who is still afloat
    return messaging.addMessageListener?.((msg) => {
      if (msg && msg.type === "fleet" && Array.isArray(msg.ships)) setFleet(msg.ships);
    });
  }, [messaging]);

  const send = useCallback(
    (payload) => { try { messaging?.sendMessage?.(payload); } catch (e) {} },
    [messaging]
  );

  const afloat = fleet.filter((s) => s.state !== "lost");

  return (
    <div css={styles.root}>
      <div css={styles.section}>
        <span css={styles.label}>Give fire</span>
        <div css={styles.row}>
          <Button
            css={styles.fire}
            variant="contained"
            style={{ background: FACTION_COLOUR.crimson, color: "#170a09" }}
            onClick={() => send({ type: "fire", value: "crimson" })}
          >
            Crimson
          </Button>
          <Button
            css={styles.fire}
            variant="contained"
            style={{ background: FACTION_COLOUR.azure, color: "#04121d" }}
            onClick={() => send({ type: "fire", value: "azure" })}
          >
            Azure
          </Button>
        </div>
        <Button variant="outlined" onClick={() => send({ type: "fire", value: "both" })}>
          Everyone, all at once
        </Button>
      </div>

      {afloat.length > 0 && (
        <div css={styles.section}>
          <span css={styles.label}>Mark a ship</span>
          {afloat.map((s) => (
            <Button
              key={s.index}
              css={styles.ship}
              variant="outlined"
              disabled={s.state === "sinking"}
              onClick={() => send({ type: "target", value: s.index })}
            >
              <span>{s.name}</span>
              <span css={styles.bar}>
                <span
                  style={{
                    display: "block",
                    height: "100%",
                    width: `${s.integrity}%`,
                    background: FACTION_COLOUR[s.faction] || "#fff",
                  }}
                />
              </span>
            </Button>
          ))}
          <Typography css={styles.note}>
            The other fleet will come round to bring its guns to bear — they are
            in ports, not turrets.
          </Typography>
        </div>
      )}

      <div css={styles.section}>
        <span css={styles.label}>The wall</span>
        <div css={styles.row}>
          <Button variant="outlined" onClick={() => send({ type: "camera", value: "orbit" })}>
            Orbit
          </Button>
          <Button variant="outlined" onClick={() => send({ type: "camera", value: "follow" })}>
            Follow
          </Button>
          <Button variant="outlined" onClick={() => send({ type: "camera", value: "cinematic" })}>
            Cinematic
          </Button>
        </div>
        <Button
          variant="outlined"
          onClick={() => { setStormy(!stormy); send({ type: "storm", value: !stormy }); }}
        >
          {stormy ? "Calm the sea" : "Summon a squall"}
        </Button>
      </div>

      <div css={styles.section}>
        <div css={styles.row}>
          <Button variant="text" onClick={() => send({ type: "replay" })}>
            Replay the explainer
          </Button>
          <Button variant="text" onClick={() => send({ type: "reset" })}>
            Raise a fresh fleet
          </Button>
        </div>
      </div>
    </div>
  );
}
