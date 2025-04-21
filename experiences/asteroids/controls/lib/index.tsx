/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useCallback, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import { Slider } from "@material-ui/core";

const containerStyle = css`
  padding: 16px;
  overflow-x: hidden;

  p {
    margin: 0 0 16px;
  }
`;

const ControlsComponent = (): JSX.Element => {
  const [number, setNumber] = useState<number | undefined>();

  const { sendMessage } = useMessaging<number>((message) => {
    setNumber(message);
  });

  const updateSlider = useCallback(
    async (event, value) => {
      await sendMessage(value);
    },
    [sendMessage]
  );

  return (
    <div css={containerStyle}>
      <p>
        <b>Move the slider!</b>
      </p>
      <Slider
        min={0}
        max={1}
        onChange={updateSlider}
        step={0.05}
        marks
        defaultValue={0}
      />
      <br />
      <br />
      <div style={{ fontFamily: "monospace", fontSize: "20pt" }}>
        {number || "Loading data..."}
      </div>
    </div>
  );
};

export default ControlsComponent;
