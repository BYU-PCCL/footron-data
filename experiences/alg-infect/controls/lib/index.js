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
//   { type: "pad", action: "left"|"right"|"up"|"down"|"confirm"|"back"|"map" }
//
// Every button press is one discrete action — the wall folds these into the
// same PadAction stream its physical gamepad produces.
import { css } from "@emotion/react";
import React, { useCallback, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import Button from "@material-ui/core/Button";

const gold = "#ffd23e";
const cyan = "#38d9ff";
const ink = "#0a0d17";
const panel = "#10152a";
const line = "#2a3354";
const dim = "#8b95b8";

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 14px 26px;
  background: radial-gradient(120% 90% at 50% 0%, #131b36 0%, ${ink} 70%);
  border-radius: 14px;

  @keyframes nz-scan {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.9; }
  }

  .masthead {
    text-align: center;
    padding: 4px 0 2px;
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

  .arrows {
    display: flex;
    gap: 14px;
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

  .arrows button {
    flex: 1;
    height: 112px;
    font-size: 36px;
    color: ${cyan};
    text-shadow: 0 0 14px rgba(56, 217, 255, 0.7);
  }
  .arrows button:active {
    box-shadow: 0 0 26px rgba(56, 217, 255, 0.35), inset 0 0 18px rgba(56, 217, 255, 0.15);
  }

  button.map {
    height: 58px;
    font-size: 15px;
    letter-spacing: 0.18em;
    color: ${cyan};
    border-color: rgba(56, 217, 255, 0.45);
  }
  button.map:active {
    box-shadow: 0 0 22px rgba(56, 217, 255, 0.35);
  }

  button.confirm {
    height: 100px;
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

  button.back {
    height: 60px;
    font-size: 15px;
    letter-spacing: 0.16em;
    color: ${dim};
  }

  .foot {
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
      <div className="masthead">
        <div className="title">NODE ZERO</div>
        <div className="sub">
          <span className="live" />
          INFECTION CONTROL LINK
        </div>
      </div>
      <div className="arrows">
        <Button type="button" disableRipple onClick={() => press("left")}>
          ◀
        </Button>
        <Button type="button" disableRipple onClick={() => press("right")}>
          ▶
        </Button>
      </div>
      <Button
        type="button"
        disableRipple
        className="map"
        onClick={() => press("map")}
      >
        ◈ view the map
      </Button>
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
        B — back / rematch
      </Button>
      <div className="foot">
        {lastAction ? "signal sent: " + lastAction : "aim the outbreak, then commit"}
      </div>
    </div>
  );
};

export default ControlsComponent;
