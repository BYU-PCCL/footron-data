/** @jsxImportSource @emotion/react */
// Phone controls panel for NODE ZERO (alg-infect).
//
// This file is compiled by footron-data's build-controls CI job against a
// checkout of BYU-PCCL/footron-web, so it can only import what that repo
// provides: react, @footron/controls-client, @material-ui/core, and
// @emotion/react. Do not add a package.json next to it — the build copies
// controls/lib verbatim, and footron-web's eslint config (react/prop-types is
// an error there) lints it, so components take no props.
//
// Protocol (keep in sync with src/input/phone.ts in the app repo):
//
//   { type: "pad", action: "left"|"right"|"up"|"down"|"confirm"|"back" }
//
// Every button press is one discrete action — the wall folds these into the
// same PadAction stream its physical gamepad produces. The arrows move the lit
// button on whatever screen the wall is showing, A presses it, B backs out.
import { css, Global } from "@emotion/react";
import React, { useCallback, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import Button from "@material-ui/core/Button";

const gold = "#ffd23e";
const cyan = "#38d9ff";
const ink = "#0a0d17";
const panel = "#10152a";
const line = "#2a3354";
const dim = "#8b95b8";

// footron-web frames the panel between a 64px header and a 64px "more
// experiences" footer on a near-white page. Painting the page itself dark
// means nothing pale ever shows through under the panel, whatever the phone's
// viewport does with its address bar.
const pageStyle = css`
  body {
    background: ${ink};
  }
`;

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 14px 22px;
  box-sizing: border-box;
  /* fill to the footer: header (64) + footer clearance (64). The dvh line wins
     on browsers that know it and tracks the visible viewport as chrome hides. */
  min-height: calc(100vh - 128px);
  min-height: calc(100dvh - 128px);
  background: radial-gradient(120% 90% at 50% 0%, #131b36 0%, ${ink} 70%);
  border-radius: 14px 14px 0 0;

  @keyframes nz-scan {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.9; }
  }

  .masthead {
    text-align: center;
    padding: 2px 0;
  }
  .masthead .title {
    font-weight: 800;
    font-size: 26px;
    letter-spacing: 0.3em;
    margin-right: -0.3em;
    color: whitesmoke;
    text-shadow: 0 0 18px rgba(56, 217, 255, 0.65), 0 0 40px rgba(56, 217, 255, 0.3);
  }
  .masthead .sub {
    margin-top: 4px;
    font-size: 12px;
    letter-spacing: 0.24em;
    margin-right: -0.24em;
    color: ${dim};
  }
  .masthead .live {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin: 0 8px 1px 0;
    border-radius: 50%;
    background: ${gold};
    box-shadow: 0 0 8px ${gold};
    animation: nz-scan 2.2s ease-in-out infinite;
  }

  button {
    border: 1px solid ${line};
    border-radius: 14px;
    font-weight: bolder;
    color: whitesmoke;
    background-color: ${panel};
    transition: transform 90ms ease, box-shadow 90ms ease;
  }
  button:active {
    transform: scale(0.96);
  }

  /* a d-pad cross: the cursor moves the same way on the wall */
  .dpad {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 74px 74px 74px;
    gap: 10px;
  }
  .dpad button {
    font-size: 32px;
    color: ${cyan};
    text-shadow: 0 0 14px rgba(56, 217, 255, 0.7);
    min-width: 0;
  }
  .dpad button:active {
    box-shadow: 0 0 26px rgba(56, 217, 255, 0.35), inset 0 0 18px rgba(56, 217, 255, 0.15);
  }
  .dpad .up { grid-column: 2; grid-row: 1; }
  .dpad .left { grid-column: 1; grid-row: 2; }
  .dpad .right { grid-column: 3; grid-row: 2; }
  .dpad .down { grid-column: 2; grid-row: 3; }
  /* every arrow is the same glyph: left and right are the up arrow turned, so a phone
     can't swap them for its emoji triangles (U+25C0/25B6 have an emoji presentation) */
  .dpad .arrow { display: inline-block; line-height: 1; }
  .dpad .left .arrow { transform: rotate(-90deg); }
  .dpad .right .arrow { transform: rotate(90deg); }
  .dpad .down .arrow { transform: rotate(180deg); }
  .dpad .hub {
    grid-column: 2;
    grid-row: 2;
    display: grid;
    place-items: center;
    font-size: 11px;
    letter-spacing: 0.2em;
    color: ${dim};
    opacity: 0.7;
  }

  button.back {
    height: 56px;
    font-size: 15px;
    letter-spacing: 0.16em;
    color: ${dim};
  }

  button.confirm {
    height: 92px;
    font-size: 24px;
    letter-spacing: 0.16em;
    color: ${ink};
    background: linear-gradient(180deg, #ffe07a 0%, ${gold} 55%, #e0b428 100%);
    border-color: ${gold};
    box-shadow: 0 0 24px rgba(255, 210, 62, 0.35);
  }
  button.confirm:active {
    box-shadow: 0 0 40px rgba(255, 210, 62, 0.6);
  }

  .foot {
    margin-top: auto;
    padding-top: 8px;
    text-align: center;
    font-size: 12px;
    letter-spacing: 0.14em;
    color: ${dim};
    opacity: 0.8;
  }
`;

const ControlsComponent = () => {
  const [lastAction, setLastAction] = useState(null);

  const { sendMessage } = useMessaging(() => {
    // the wall sends nothing the panel needs yet; presses are fire-and-forget
  });

  const press = useCallback(
    async (action) => {
      setLastAction(action);
      await sendMessage({ type: "pad", action: action });
    },
    [sendMessage]
  );

  return (
    <div css={containerStyle}>
      <Global styles={pageStyle} />
      <div className="masthead">
        <div className="title">NODE ZERO</div>
        <div className="sub">
          <span className="live" />
          INFECTION CONTROL LINK
        </div>
      </div>
      <div className="dpad">
        <Button type="button" disableRipple className="up" onClick={() => press("up")}>
          <span className="arrow">▲</span>
        </Button>
        <Button type="button" disableRipple className="left" onClick={() => press("left")}>
          <span className="arrow">▲</span>
        </Button>
        <div className="hub">AIM</div>
        <Button type="button" disableRipple className="right" onClick={() => press("right")}>
          <span className="arrow">▲</span>
        </Button>
        <Button type="button" disableRipple className="down" onClick={() => press("down")}>
          <span className="arrow">▲</span>
        </Button>
      </div>
      <Button
        type="button"
        disableRipple
        className="confirm"
        onClick={() => press("confirm")}
      >
        A — select
      </Button>
      <Button
        type="button"
        disableRipple
        className="back"
        onClick={() => press("back")}
      >
        B — back
      </Button>
      <div className="foot">
        {lastAction ? "signal sent: " + lastAction : "arrows move · A select · B back"}
      </div>
    </div>
  );
};

export default ControlsComponent;
