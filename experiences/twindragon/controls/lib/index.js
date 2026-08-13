/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useCallback, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import { Box, Button, Slider } from "@material-ui/core";

const containerStyle = css`
  padding: 16px;
  overflow-x: hidden;

  p {
    margin: 0 0 16px;
  }

  .slider {
    display: flex;
    gap: 10px;
    align-items: center;
  }
`;

const PRESETS = [
  "Origin overview",
  "Bottom center",
  "Boundary detail",
  "Deep self-similarity",
];

const ControlsComponent = () => {
  const [zoomVal, setZoomVal] = useState(0);
  const [hueVal, setHueVal] = useState(0);

  const { sendMessage } = useMessaging();

  const updateZoom = useCallback(
    async (event, value) => {
      setZoomVal(value);
      await sendMessage({ type: "zoom", value });
    },
    [sendMessage]
  );

  const updateHue = useCallback(
    async (event, value) => {
      setHueVal(value);
      await sendMessage({ type: "hue", value });
    },
    [sendMessage]
  );

  const jumpToPreset = useCallback(
    async (index) => {
      setZoomVal(0);
      await sendMessage({ type: "preset", value: index });
    },
    [sendMessage]
  );

  const resume = useCallback(async () => {
    // Resume keeps the color choice as-is -- it only hands zoom/pan back
    // to the natural auto-zoom, so only the zoom slider resets.
    setZoomVal(0);
    await sendMessage({ type: "resume" });
  }, [sendMessage]);

  return (
    <div css={containerStyle}>
      <p>
        <b>
          The twindragon fractal is drawn by repeating one simple equation
          forever. Zoom in and the same kind of shape appears again and
          again!
        </b>
      </p>

      <div>
        <div className="slider">
          Zoom:
          <Slider min={0} max={1} step={0.001} value={zoomVal} onChange={updateZoom} />
        </div>
        <div className="slider">
          Color:
          <Slider min={0} max={1} step={0.001} value={hueVal} onChange={updateHue} />
        </div>
      </div>

      <p style={{ marginTop: "15px" }}>
        <b>Or jump to a favorite spot:</b>
      </p>

      <Box display="flex" flexWrap="wrap" justifyContent="center" p={0} m={0}>
        {PRESETS.map((name, index) => (
          <Box p={1} m={2} key={name}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => jumpToPreset(index)}
            >
              {name}
            </Button>
          </Box>
        ))}
      </Box>

      <Box display="flex" flexWrap="wrap" justifyContent="center" p={0} m={0}>
        <Box p={1} m={2}>
          <Button variant="contained" color="primary" onClick={resume}>
            Resume
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default ControlsComponent;
