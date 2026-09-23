/** @jsxImportSource @emotion/react */
/**
 * Houses of Light — phone controls.
 *
 * The wall runs itself. Everything here is optional, and that shapes the
 * design: there is no state a visitor has to set up before the piece makes
 * sense, and nothing they can leave it stuck in. Walk away and the wall
 * returns to its own loop within a minute.
 *
 * Regions are the whole interface, because a visitor knows where they are from
 * and does not know the name of a temple — "Pacific" is a question they can
 * answer in one tap, and the wall answering it by turning a globe to Tahiti is
 * the moment they realise the thing across the room is listening. Each region
 * opens a menu: shuffle through the whole region, or, for the visitor who
 * does know the name of their temple, pick it out.
 *
 * Message formats — keep in sync with web/src/footron.js:
 *   { type: "region", value: "utah" | "europe" | … }
 *   { type: "goto",   value: "<temple id>" }
 */
import React, { useCallback, useState } from "react";
import { css } from "@emotion/react";
import Chip from "@material-ui/core/Chip";
import Divider from "@material-ui/core/Divider";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import ShuffleIcon from "@material-ui/icons/Shuffle";
import { useMessaging } from "@footron/controls-client";
import { TEMPLES } from "./temples";

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

const shuffleStyle = css`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
`;

const TempleControls = () => {
  const { sendMessage } = useMessaging();
  // The open region's menu: which region, and the chip it hangs from.
  const [open, setOpen] = useState(null);
  const close = useCallback(() => setOpen(null), []);

  const shuffle = useCallback((key) => {
    sendMessage({ type: "region", value: key });
    close();
  }, [sendMessage, close]);

  const goto = useCallback((id) => {
    sendMessage({ type: "goto", value: id });
    close();
  }, [sendMessage, close]);

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
            onClick={(e) => setOpen({ key: r.key, anchor: e.currentTarget })}
            clickable
          />
        ))}
      </div>

      <Menu
        anchorEl={open?.anchor}
        open={Boolean(open)}
        onClose={close}
        PaperProps={{ style: { maxHeight: "60vh", minWidth: 240 } }}
      >
        {open && [
          <MenuItem key="shuffle" onClick={() => shuffle(open.key)}>
            <span css={shuffleStyle}><ShuffleIcon fontSize="small" /> Shuffle all</span>
          </MenuItem>,
          <Divider key="divider" />,
          ...(TEMPLES[open.key] || []).map(([id, name]) => (
            <MenuItem key={id} onClick={() => goto(id)}>{name}</MenuItem>
          )),
        ]}
      </Menu>

      <Typography variant="body2" css={hintStyle}>
        Whatever you pick, the wall shows it and then carries on with its own
        tour, so there is nothing here you can leave it stuck in.
      </Typography>
    </div>
  );
};

export default TempleControls;
