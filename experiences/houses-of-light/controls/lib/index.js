/** @jsxImportSource @emotion/react */
/**
 * Houses of Light — phone controls.
 *
 * The wall runs itself. Everything here is optional, and that shapes the
 * design: there is no state a visitor has to set up before the piece makes
 * sense, and nothing they can leave it stuck in. Walk away and the wall
 * returns to its own loop within a minute.
 *
 * The ordering is the design decision. Regions come first, because a visitor
 * knows where they are from and does not know the name of a temple — "Pacific"
 * is a question they can answer in one tap, and the wall answering it by
 * turning a globe to Tahiti is the moment they realise the thing across the
 * room is listening. Skip and hold come after, where the people who want them
 * will look.
 *
 * Message formats — keep in sync with web/src/footron.js:
 *   { type: "region",  value: "utah" | "europe" | … }
 *   { type: "next"  }
 *   { type: "pause",   value: <bool> }
 *   { type: "release" }
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import Typography from "@material-ui/core/Typography";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import SkipNextIcon from "@material-ui/icons/SkipNext";
import { useMessaging } from "@footron/controls-client";

// Ids only — the wall owns the boxes behind each one (REGIONS in
// web/src/footron.js), so a region can be re-drawn without shipping a new
// controls bundle. The sub-labels name a temple a visitor might have heard of,
// because "Europe" is abstract and "Bern, Freiberg, Rome" is a place.
const REGIONS = [
  { key: "utah",           label: "Utah",          note: "Salt Lake, St. George, Manti" },
  { key: "north-america",  label: "North America", note: "Washington D.C., Laie, Cardston" },
  { key: "latin-america",  label: "Latin America", note: "México City, São Paulo, Lima" },
  { key: "europe",         label: "Europe",        note: "Bern, Freiberg, Rome" },
  { key: "africa-mideast", label: "Africa",        note: "Johannesburg, Accra, Aba" },
  { key: "asia",           label: "Asia",          note: "Tokyo, Manila, Taipei" },
  { key: "pacific",        label: "Pacific",       note: "Laie, Papeete, Hamilton" },
];

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  max-width: 420px;
  margin: 0 auto;
`;

const hintStyle = css`
  opacity: 0.7;
  line-height: 1.5;
`;

const sectionTitleStyle = css`
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: -8px;
`;

const chipsStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const chipStyle = css`
  height: auto;
  padding: 6px 2px;
  .MuiChip-label {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.3;
  }
  .MuiChip-label small {
    font-size: 11px;
    opacity: 0.65;
  }
`;

const rowStyle = css`
  display: flex;
  flex-direction: row;
  gap: 12px;
`;

const TempleControls = () => {
  const { sendMessage } = useMessaging();
  const [paused, setPaused] = useState(false);

  // The wall releases a held photograph after 45 seconds of quiet. Mirroring
  // that here means the Hold button un-presses itself at the same moment the
  // wall stops honouring it, rather than claiming to still be in charge.
  const idle = useRef(null);
  const touch = useCallback(() => {
    clearTimeout(idle.current);
    idle.current = setTimeout(() => setPaused(false), 45000);
  }, []);
  useEffect(() => () => clearTimeout(idle.current), []);

  const region = useCallback((key) => {
    sendMessage({ type: "region", value: key });
    setPaused(false);
    touch();
  }, [sendMessage, touch]);

  const togglePause = useCallback(() => {
    setPaused((prev) => {
      const value = !prev;
      sendMessage({ type: "pause", value });
      return value;
    });
    touch();
  }, [sendMessage, touch]);

  const release = useCallback(() => {
    sendMessage({ type: "release" });
    setPaused(false);
    clearTimeout(idle.current);
  }, [sendMessage]);

  return (
    <div css={containerStyle}>
      <Typography variant="body2" css={hintStyle}>
        Every photograph on the wall is a real temple, freely licensed, ranked
        by a model trained on what people call a good photograph. Send it
        somewhere.
      </Typography>

      <div css={sectionTitleStyle}>Take me somewhere</div>
      <div css={chipsStyle}>
        {REGIONS.map((r) => (
          <Chip
            key={r.key}
            css={chipStyle}
            label={<><span>{r.label}</span><small>{r.note}</small></>}
            onClick={() => region(r.key)}
            clickable
          />
        ))}
      </div>

      <div css={rowStyle}>
        <Button
          onClick={togglePause}
          startIcon={paused ? <PlayArrowIcon /> : <PauseIcon />}
          variant="outlined"
          fullWidth
        >
          {paused ? "Resume" : "Hold"}
        </Button>
        <Button
          onClick={() => { sendMessage({ type: "next" }); touch(); }}
          startIcon={<SkipNextIcon />}
          variant="outlined"
          fullWidth
        >
          Next
        </Button>
      </div>

      <Button onClick={release} variant="outlined" fullWidth>
        Let the wall carry on
      </Button>

      <Typography variant="body2" css={hintStyle}>
        Leave it alone for 45 seconds and the wall goes back to its own tour, so
        there is nothing here you can leave it stuck in.
      </Typography>
    </div>
  );
};

export default TempleControls;
