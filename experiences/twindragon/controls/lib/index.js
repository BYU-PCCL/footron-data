/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
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


const padStyle = css`
  width: 100%;
  max-width: 220px;
  margin: 0 auto;

  .frame {
    position: relative;
    width: 100%;
  }

  /* Percentage padding is relative to WIDTH, so this keeps the pad square
     without relying on aspect-ratio support in the phone's browser. */
  .frame::before {
    content: "";
    display: block;
    padding-bottom: 100%;
  }

  .pad {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.22);
    background: #eaeef5;
    overflow: hidden;
    /* Without this the browser claims the drag for scrolling and pinch-zoom
       and the pad only sees the first pointermove. */
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
    cursor: grab;
  }

  .pad:active {
    cursor: grabbing;
    background: #e2e8f2;
  }

  .cross {
    position: absolute;
    background: rgba(0, 0, 0, 0.13);
  }
  .cross.h {
    left: 8%;
    right: 8%;
    top: 50%;
    height: 1px;
  }
  .cross.v {
    top: 8%;
    bottom: 8%;
    left: 50%;
    width: 1px;
  }

  .dot {
    position: absolute;
    width: 26px;
    height: 26px;
    margin: -13px 0 0 -13px;
    border-radius: 50%;
    background: rgba(63, 116, 209, 0.9);
    box-shadow: 0 0 0 6px rgba(63, 116, 209, 0.18);
    pointer-events: none;
  }

  .hint {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    margin-top: -0.6em;
    text-align: center;
    font-size: 13px;
    color: rgba(0, 0, 0, 0.38);
    pointer-events: none;
  }
`;

// Dragging the full height of the pad travels one screen height on the wall.
const PAN_GAIN = 1.0;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Drag-to-pan surface. It sends RELATIVE deltas as fractions of its own size
// and keeps no idea of where the view actually is -- the wall scales them by
// its current zoom and clamps the result, so it stays the single owner of the
// position. That also means the pad works identically at any zoom depth
// instead of needing to know the coordinate range it is addressing.
const TrackPad = ({ onPan }) => {
  const padRef = useRef(null);
  const lastRef = useRef(null);
  const pendingRef = useRef([0, 0]);
  const rafRef = useRef(null);
  const [dot, setDot] = useState(null);

  // Coalesce to at most one message per frame: pointermove fires far more
  // often than that on a phone, and each send is a websocket message.
  const flush = useCallback(() => {
    rafRef.current = null;
    const [dx, dy] = pendingRef.current;
    pendingRef.current = [0, 0];
    if (dx !== 0 || dy !== 0) onPan(dx, dy);
  }, [onPan]);

  const queue = useCallback(
    (dx, dy) => {
      pendingRef.current[0] += dx;
      pendingRef.current[1] += dy;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flush);
      }
    },
    [flush]
  );

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const onPointerDown = (event) => {
    const rect = padRef.current.getBoundingClientRect();
    // Capture so a drag that slides off the pad keeps being delivered here
    // instead of stopping dead the moment the finger crosses the edge.
    event.currentTarget.setPointerCapture(event.pointerId);
    lastRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    setDot({
      x: clamp01((event.clientX - rect.left) / rect.width) * 100,
      y: clamp01((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const onPointerMove = (event) => {
    const last = lastRef.current;
    if (last === null || last.id !== event.pointerId) return;
    const rect = padRef.current.getBoundingClientRect();
    // Both axes are normalised by the same edge so the gesture is isotropic,
    // and y is flipped because screen-down is negative on the wall.
    const scale = PAN_GAIN / rect.height;
    queue((event.clientX - last.x) * scale, -(event.clientY - last.y) * scale);
    lastRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    setDot({
      x: clamp01((event.clientX - rect.left) / rect.width) * 100,
      y: clamp01((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const onPointerUp = (event) => {
    if (lastRef.current !== null && lastRef.current.id !== event.pointerId) return;
    lastRef.current = null;
    setDot(null);
  };

  return (
    <div css={padStyle}>
      <div className="frame">
        <div
          className="pad"
          ref={padRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="cross h" />
          <div className="cross v" />
          {dot === null ? (
            <div className="hint">drag to move</div>
          ) : (
            <div className="dot" style={{ left: dot.x + "%", top: dot.y + "%" }} />
          )}
        </div>
      </div>
    </div>
  );
};

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

  const pan = useCallback(
    async (dx, dy) => {
      await sendMessage({ type: "pan", dx, dy });
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

      <p>
        <b>Or drag to move around:</b>
      </p>

      <TrackPad onPan={pan} />
    </div>
  );
};

export default ControlsComponent;
