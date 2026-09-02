/** @jsxImportSource @emotion/react */
// Phone controls for "Learning to Walk".
//
// This file is compiled by footron-data's build-controls CI job against a checkout of
// BYU-PCCL/footron-web, so it can only import what that repo provides: react,
// @footron/controls-client, @material-ui/core, @material-ui/icons and @emotion/react. Do not add a
// package.json next to it -- the build copies controls/lib verbatim -- and keep everything in one
// component that takes no props, because footron-web's eslint config makes react/prop-types an
// error rather than a warning.
//
// PROTOCOL -- keep in sync with the header of src/watch/footron.js in the walking_AI repo.
//
//   { type: "pause",   value: bool }
//   { type: "speed",   value: 0..1 }            simulation rate, 1x .. 8x
//   { type: "camera",  value: "arena" | "champion" }
//   { type: "orbit",   dx: -1..1, dy: -1..1 }   relative drag, normalised screen units
//   { type: "zoom",    value: -1..1 }           relative; positive is closer
//   { type: "push",    strength: 0..1 }
//   { type: "gravity", value: 0..1 }            0 = 0.15x earth, 1 = 1.6x
//   { type: "slope",   value: -1..1 }           positive is downhill ahead
//   { type: "wind",    value: -1..1 }
//   { type: "restart", }
//   { type: "release", }
//
// The wall clamps every number it receives and ignores types it does not know, so this panel can
// gain a control before the deployed wall build understands it without taking the exhibit down.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import { useMessaging } from "@footron/controls-client";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";
import PauseIcon from "@material-ui/icons/Pause";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import RefreshIcon from "@material-ui/icons/Refresh";
import ZoomInIcon from "@material-ui/icons/ZoomIn";
import ZoomOutIcon from "@material-ui/icons/ZoomOut";

const containerStyle = css`
  padding: 16px 16px 32px;
  overflow-x: hidden;
  h2 {
    margin: 0 0 4px;
    font-size: 1rem;
    font-weight: 600;
  }
  .hint {
    margin: 0 0 20px;
    font-size: 0.8rem;
    line-height: 1.4;
    opacity: 0.7;
  }
  .group {
    margin-bottom: 22px;
  }
  .group > .label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0.55;
    margin-bottom: 2px;
  }
  .row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .row > * {
    flex: 1;
  }
  .row > .fixed {
    flex: 0 0 auto;
  }
`;

// A drag surface rather than a slider pair: orbiting a 3D scene by two numbers is miserable, and a
// pad is the one control here that has to feel direct.
const padStyle = css`
  position: relative;
  height: 160px;
  border-radius: 12px;
  border: 1px dashed rgba(128, 128, 128, 0.5);
  background: rgba(128, 128, 128, 0.08);
  touch-action: none;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  opacity: 0.75;
`;

const pushStyle = css`
  height: 56px;
  font-size: 1rem;
  font-weight: 600;
`;

const ControlsComponent = () => {
  const { sendMessage } = useMessaging();

  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(0.29); // ~3x, the wall's idle rate
  const [follow, setFollow] = useState(false);
  const [gravity, setGravity] = useState(0.59); // ~1.0x earth on the wall's 0.15..1.6 mapping
  const [slope, setSlope] = useState(0);
  const [wind, setWind] = useState(0);

  // One message per animation frame, not one per pointermove. A drag on a phone fires well over a
  // hundred move events a second and the wall only redraws sixty times, so the rest are socket
  // traffic that can never be seen.
  const pending = useRef(null);
  const frame = useRef(0);

  const flush = useCallback(() => {
    frame.current = 0;
    const message = pending.current;
    pending.current = null;
    if (message) {
      sendMessage(message);
    }
  }, [sendMessage]);

  const queue = useCallback(
    (message) => {
      pending.current = message;
      if (!frame.current) {
        frame.current = requestAnimationFrame(flush);
      }
    },
    [flush]
  );

  useEffect(
    () => () => {
      if (frame.current) {
        cancelAnimationFrame(frame.current);
      }
    },
    []
  );

  const send = useCallback((message) => sendMessage(message), [sendMessage]);

  const togglePause = useCallback(() => {
    setPaused((was) => {
      send({ type: "pause", value: !was });
      return !was;
    });
  }, [send]);

  const onSpeed = useCallback(
    (event, value) => {
      setSpeed(value);
      queue({ type: "speed", value });
    },
    [queue]
  );

  const onGravity = useCallback(
    (event, value) => {
      setGravity(value);
      queue({ type: "gravity", value });
    },
    [queue]
  );

  const onSlope = useCallback(
    (event, value) => {
      setSlope(value);
      queue({ type: "slope", value });
    },
    [queue]
  );

  const onWind = useCallback(
    (event, value) => {
      setWind(value);
      queue({ type: "wind", value });
    },
    [queue]
  );

  const setCamera = useCallback(
    (next) => {
      setFollow(next);
      send({ type: "camera", value: next ? "champion" : "arena" });
    },
    [send]
  );

  // Deltas are normalised against the pad's own size, so the wall never has to know anything about
  // the phone's screen.
  const drag = useRef(null);

  const onPointerDown = useCallback((event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const box = event.currentTarget.getBoundingClientRect();
    drag.current = { x: event.clientX, y: event.clientY, w: box.width, h: box.height };
  }, []);

  const onPointerMove = useCallback(
    (event) => {
      const from = drag.current;
      if (!from) {
        return;
      }
      queue({
        type: "orbit",
        dx: (event.clientX - from.x) / from.w,
        dy: (event.clientY - from.y) / from.h,
      });
      drag.current = { ...from, x: event.clientX, y: event.clientY };
    },
    [queue]
  );

  const onPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  return (
    <div css={containerStyle}>
      <h2>Learning to Walk</h2>
      <p className="hint">
        Sixteen humanoids are being scored on the wall right now. Make life harder for them and see
        which gaits survive it.
      </p>

      <div className="group">
        <span className="label">Interfere</span>
        <Button
          css={pushStyle}
          fullWidth
          variant="contained"
          color="secondary"
          onClick={() => send({ type: "push", strength: 1 })}
        >
          Shove one over
        </Button>
      </div>

      <div className="group">
        <span className="label">Ground tilt</span>
        <Slider
          min={-1}
          max={1}
          step={0.05}
          value={slope}
          marks={[
            { value: -1, label: "uphill" },
            { value: 0, label: "flat" },
            { value: 1, label: "downhill" },
          ]}
          onChange={onSlope}
        />
      </div>

      <div className="group">
        <span className="label">Gravity</span>
        <Slider
          min={0}
          max={1}
          step={0.02}
          value={gravity}
          marks={[
            { value: 0, label: "moon" },
            { value: 1, label: "heavy" },
          ]}
          onChange={onGravity}
        />
      </div>

      <div className="group">
        <span className="label">Sideways wind</span>
        <Slider
          min={-1}
          max={1}
          step={0.05}
          value={wind}
          marks={[
            { value: -1, label: "left" },
            { value: 0, label: "still" },
            { value: 1, label: "right" },
          ]}
          onChange={onWind}
        />
      </div>

      <div className="group">
        <span className="label">Camera</span>
        <div className="row">
          <Button
            variant={follow ? "outlined" : "contained"}
            color="primary"
            onClick={() => setCamera(false)}
          >
            Whole arena
          </Button>
          <Button
            variant={follow ? "contained" : "outlined"}
            color="primary"
            onClick={() => setCamera(true)}
          >
            Follow leader
          </Button>
        </div>
        <div
          css={padStyle}
          style={{ marginTop: 10 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          drag to turn the view
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <IconButton className="fixed" onClick={() => send({ type: "zoom", value: 0.4 })}>
            <ZoomInIcon />
          </IconButton>
          <IconButton className="fixed" onClick={() => send({ type: "zoom", value: -0.4 })}>
            <ZoomOutIcon />
          </IconButton>
          <Typography variant="caption" style={{ opacity: 0.6, textAlign: "right" }}>
            zoom
          </Typography>
        </div>
      </div>

      <div className="group">
        <span className="label">Time</span>
        <div className="row">
          <IconButton className="fixed" onClick={togglePause}>
            {paused ? <PlayArrowIcon /> : <PauseIcon />}
          </IconButton>
          <Slider min={0} max={1} step={0.05} value={speed} onChange={onSpeed} />
        </div>
        <Typography variant="caption" style={{ opacity: 0.6 }}>
          slower &rarr; faster
        </Typography>
      </div>

      <div className="group">
        <span className="label">Start over</span>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => send({ type: "restart" })}
        >
          New generation zero
        </Button>
        <Button
          fullWidth
          style={{ marginTop: 8 }}
          onClick={() => send({ type: "release" })}
        >
          Put everything back
        </Button>
      </div>
    </div>
  );
};

export default ControlsComponent;
