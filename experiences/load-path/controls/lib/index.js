/** @jsxImportSource @emotion/react */
/* eslint-disable react/prop-types */
// PadGuides takes a prop, and footron-web's eslint config makes react/prop-types an error
// (CI= does not soften it). footron-web has no prop-types package to satisfy it with.
/**
 * Load Path — phone controls.
 *
 * This is the whole interface: the wall has no keyboard, no mouse and no
 * touchscreen, so everything a visitor can do happens here.
 *
 * The ordering is the main design decision. A visitor has the wall for a couple
 * of minutes and will not read, so the guided lessons come first: one tap and
 * the wall visibly sets itself up and grows a bridge, which is the moment
 * someone understands the thing across the room is listening. Building a bridge
 * from the three sliders comes next, then looking back over how it was grown,
 * and last the part that takes a minute of attention — painting a bridge of
 * your own on the pad and seeing whether you can beat the algorithm.
 *
 * The wall never reports back (like the other exhibits), so nothing here can
 * claim to know what the wall is showing. Every control is a command that is
 * safe to send at any time; the wall quietly ignores one that doesn't apply
 * (a "test" before anything has grown, say).
 *
 * Messages: see protocol.js here and src/footron.js on the wall.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import Slider from "@material-ui/core/Slider";
import Typography from "@material-ui/core/Typography";
import { useMessaging } from "@footron/controls-client";
import {
  RANGES,
  LESSONS,
  BRUSH_RANGE,
  NUM_ELEM_X,
  DRAG_HZ,
  spotToColumn,
  weightKg,
  weightFraction,
  formatKg,
  msg,
} from "./protocol";

const containerStyle = css`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  max-width: 420px;
  margin: 0 auto;
`;

const chipsStyle = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const rowStyle = css`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
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

const labelRowStyle = css`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 13px;
  opacity: 0.85;
`;

const valueStyle = css`
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
  text-align: right;
`;

/* The pad is the design area of the wall, in miniature and the same 2:1 shape:
   the two supports at the bottom corners and an arrow where the weight will
   land, exactly as they are on the wall. A pad that didn't agree with the view
   would make every stroke land somewhere surprising. */
const padStyle = css`
  position: relative;
  aspect-ratio: 2 / 1;
  border-radius: 14px;
  border: 1px dashed rgba(230, 192, 123, 0.5);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
  touch-action: none;
  user-select: none;
  &[data-dragging="true"] {
    border-style: solid;
    border-color: rgba(230, 192, 123, 0.95);
  }
`;

const padLabelStyle = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  text-align: center;
  padding: 0 20px;
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.55;
`;

const TRAIL_LIMIT = 400; // how many recent stroke points the pad remembers to draw
const PAD_UNITS = 200; // the pad's drawing space is 200 wide by 100 tall

// Distance from point p to the segment a-b, all in pad units.
const distanceToSegment = (p, a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

// The two bridge supports and the weight's arrow, as SVG in the pad's own 0..1 space.
const PadGuides = ({ spot }) => {
  const x = spot === null ? null : spotToColumn(spot) / NUM_ELEM_X;
  return (
    <svg
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <polygon points="0,84 14,100 0,100" fill="rgba(230,192,123,0.9)" />
      <polygon points="200,84 186,100 200,100" fill="rgba(230,192,123,0.9)" />
      {x !== null && (
        <>
          <line x1={x * 200} y1="0" x2={x * 200} y2="14" stroke="rgba(246,220,157,0.95)" strokeWidth="2" />
          <polygon points={`${x * 200 - 4},10 ${x * 200 + 4},10 ${x * 200},18`} fill="rgba(246,220,157,0.95)" />
        </>
      )}
    </svg>
  );
};

const LoadPathControls = () => {
  const [editing, setEditing] = useState(false);
  const [trail, setTrail] = useState([]);
  // The wall reports whether a finished bridge exists to edit (see sendPhoneState
  // in src/main.js). null until it says: the button stays usable until told
  // otherwise, so a wall that never answers costs the greying-out and nothing else.
  const [canEdit, setCanEdit] = useState(null);
  // Two things about useMessaging's callback matter here. The hook re-registers it
  // whenever its identity changes, so it must be stable (useCallback, not an inline
  // arrow that is new every render). And every registration REPLAYS the recent
  // message history, so handling a message has to be idempotent: `setTrail([])` is a
  // new array each time, which re-rendered, re-registered, replayed, and looped.
  const onWallMessage = useCallback((message) => {
    if (!message || message.type !== "state" || typeof message.canEdit !== "boolean") return;
    setCanEdit(message.canEdit);
    // A new bridge started growing under an open editor: the wall has already left
    // it, so close this end rather than leave a pad that paints nothing.
    if (!message.canEdit) {
      setEditing(false);
      setTrail((prev) => (prev.length ? [] : prev));
    }
  }, []);
  const { sendMessage } = useMessaging(onWallMessage);

  // What THIS phone has asked for. Beyond whether a bridge can be edited, the wall
  // never reports back, so these mirror the wall only as long as nothing else is
  // driving it.
  const [stone, setStone] = useState(620);
  const [weight, setWeight] = useState(0.6);
  const [spot, setSpot] = useState(0.5);
  // Where the weight really lands on the wall, when this phone knows (it set it,
  // or picked a lesson that does). Unknown after the wall was left running by
  // someone else, and then the pad shows no arrow rather than a wrong one.
  const [knownSpot, setKnownSpot] = useState(null);
  const [scrub, setScrub] = useState(1);
  const [brush, setBrush] = useState(1);
  const [erase, setErase] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Once, not per render: sendMessage may change identity and every reply re-renders.
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current) return undefined;
    greeted.current = true;
    const hello = () => Promise.resolve(sendMessage(msg.hello())).catch(() => undefined);
    hello();
    const retry = setTimeout(hello, 1500);
    return () => clearTimeout(retry);
  }, [sendMessage]);

  const padRef = useRef(null);
  const pending = useRef(null);
  const lastScrubSent = useRef(0);

  // --- The paint pad. A finger produces move events far faster than the wall
  // needs; only the newest position matters (the wall joins consecutive points
  // into a line), so keep one and flush it on a timer. ---
  const flush = useCallback(() => {
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    sendMessage(msg.paint(p.x, p.y, p.erase));
  }, [sendMessage]);

  useEffect(() => {
    if (!dragging) return undefined;
    const id = setInterval(flush, 1000 / DRAG_HZ);
    return () => {
      clearInterval(id);
      flush(); // whatever was pending when the finger lifted still counts
    };
  }, [dragging, flush]);

  const at = useCallback((e) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  }, []);

  const remember = useCallback((p) => setTrail((prev) => [...prev.slice(-(TRAIL_LIMIT - 1)), p]), []);

  // The dots are only a memory of where the finger has been, so erasing has to
  // take them out, as it takes the stone out on the wall; otherwise the pad shows
  // a bridge that is no longer there. `from` to `to` is the stretch of finger travel
  // since the last sample, so a fast stroke leaves no dots behind. The reach is the
  // wall's brush radius, (brush + 0.5) grid cells, in pad units.
  const lastPoint = useRef(null);
  const eraseTrail = useCallback(
    (from, to) => {
      const reach = (brush + 0.5) * (PAD_UNITS / NUM_ELEM_X);
      const a = { x: from.x * PAD_UNITS, y: from.y * (PAD_UNITS / 2) };
      const b = { x: to.x * PAD_UNITS, y: to.y * (PAD_UNITS / 2) };
      setTrail((prev) => {
        const kept = prev.filter((dot) => distanceToSegment({ x: dot.x * PAD_UNITS, y: dot.y * (PAD_UNITS / 2) }, a, b) > reach);
        return kept.length === prev.length ? prev : kept;
      });
    },
    [brush]
  );

  const onPointerDown = useCallback(
    (e) => {
      padRef.current?.setPointerCapture?.(e.pointerId);
      const p = at(e);
      if (!p) return;
      setDragging(true);
      lastPoint.current = p;
      if (erase) eraseTrail(p, p);
      else remember(p);
      // The first point goes straight away, so a plain tap paints too.
      sendMessage(msg.paint(p.x, p.y, erase));
    },
    [at, erase, eraseTrail, remember, sendMessage]
  );

  const onPointerMove = useCallback(
    (e) => {
      if (!dragging) return;
      const p = at(e);
      if (!p) return;
      if (erase) eraseTrail(lastPoint.current || p, p);
      else remember(p);
      lastPoint.current = p;
      pending.current = { ...p, erase };
    },
    [at, dragging, erase, eraseTrail, remember]
  );

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    flush();
    sendMessage(msg.strokeEnd());
  }, [dragging, flush, sendMessage]);

  // --- Sliders. The set-up sliders send on release only: the wall just moves a
  // label, so there's nothing to see mid-drag and a message per pixel is noise. ---
  const scrubLive = useCallback(
    (value) => {
      setScrub(value);
      // Scrubbing redraws the wall, so it is worth sending live, but not per pixel.
      const now = Date.now();
      if (now - lastScrubSent.current > 80) {
        lastScrubSent.current = now;
        sendMessage(msg.scrub(value));
      }
    },
    [sendMessage]
  );

  // A run this phone starts leaves nothing to edit until it finishes growing.
  const startedRun = useCallback(() => {
    setCanEdit(false);
    setEditing(false);
    setTrail((prev) => (prev.length ? [] : prev));
  }, []);

  // A lesson sets the stone, the weight and the spot on the wall; move this
  // phone's sliders to match, or they would show something the wall isn't using.
  const pickLesson = useCallback(
    (lesson) => {
      setStone(lesson.material);
      setWeight(weightFraction(lesson.weightKg));
      setSpot(lesson.column / NUM_ELEM_X);
      setKnownSpot(lesson.column / NUM_ELEM_X);
      startedRun();
      sendMessage(msg.lesson(lesson.id));
    },
    [sendMessage]
  );

  // Grow from exactly what the sliders show.
  const grow = useCallback(() => {
    setKnownSpot(spot);
    startedRun();
    sendMessage(msg.grow({ stone, weight, spot }));
  }, [sendMessage, stone, weight, spot, startedRun]);

  const toggleEditor = useCallback(() => {
    const open = !editing;
    setEditing(open);
    setTrail([]);
    sendMessage(msg.yourTurn(open));
  }, [editing, sendMessage]);

  // Start the bridge over: the wall drops any test it is running and empties the
  // grid (see clearDesign in src/challenge.js), and the pad forgets its dots.
  const restart = useCallback(() => {
    setTrail([]);
    setErase(false);
    sendMessage(msg.clear());
  }, [sendMessage]);

  const changeBrush = useCallback(
    (size) => {
      const next = Math.min(BRUSH_RANGE[1], Math.max(BRUSH_RANGE[0], size));
      setBrush(next);
      sendMessage(msg.brush(next));
    },
    [sendMessage]
  );

  const toggleReveal = useCallback(() => {
    setReveal((prev) => {
      sendMessage(msg.reveal(!prev));
      return !prev;
    });
  }, [sendMessage]);

  const kg = weightKg(weight);

  return (
    <div css={containerStyle}>
      <Typography variant="h6">Load Path</Typography>
      <Typography css={hintStyle} variant="body2">
        Watch the wall: an algorithm grows a stone bridge, then a weight is dropped on it to see if it holds.
      </Typography>

      <div css={sectionTitleStyle}>Try a lesson</div>
      <div css={chipsStyle}>
        {LESSONS.map((lesson) => (
          <Chip key={lesson.id} label={lesson.label} clickable color="primary" onClick={() => pickLesson(lesson)} />
        ))}
      </div>

      <div css={sectionTitleStyle}>Build your own</div>
      <div>
        <div css={labelRowStyle}>
          <span>Stone</span>
          <span css={valueStyle}>{stone} kg</span>
        </div>
        <Slider
          min={RANGES.stone[0]}
          max={RANGES.stone[1]}
          step={10}
          value={stone}
          onChange={(_, v) => setStone(v)}
          onChangeCommitted={(_, v) => sendMessage(msg.setup("stone", v))}
        />
      </div>
      <div>
        <div css={labelRowStyle}>
          <span>Weight</span>
          <span css={valueStyle}>{formatKg(kg)}</span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.001}
          value={weight}
          onChange={(_, v) => setWeight(v)}
          onChangeCommitted={(_, v) => sendMessage(msg.setup("weight", v))}
        />
      </div>
      <div>
        <div css={labelRowStyle}>
          <span>Where it lands</span>
          <span css={valueStyle}>{spot < 0.4 ? "near the left" : spot > 0.6 ? "near the right" : "the middle"}</span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={spot}
          onChange={(_, v) => setSpot(v)}
          onChangeCommitted={(_, v) => sendMessage(msg.setup("spot", v))}
        />
      </div>
      <Button variant="contained" color="primary" size="large" onClick={grow}>
        Grow the bridge
      </Button>

      <div css={sectionTitleStyle}>Look back</div>
      <div css={rowStyle}>
        <Button variant="outlined" color="primary" onClick={() => sendMessage(msg.skip())}>
          Skip the explanation
        </Button>
        <Button variant="outlined" color="primary" onClick={() => sendMessage(msg.replay())}>
          Replay
        </Button>
        <Button variant="outlined" color="primary" onClick={() => sendMessage(msg.test())}>
          Test again
        </Button>
      </div>
      <div>
        <div css={labelRowStyle}>
          <span>Scrub through the iterations</span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={scrub}
          onChange={(_, v) => scrubLive(v)}
          onChangeCommitted={(_, v) => sendMessage(msg.scrub(v))}
        />
      </div>

      <div css={sectionTitleStyle}>Your turn: beat the algorithm</div>
      <Typography css={hintStyle} variant="body2">
        Same stone as the algorithm had. Paint a bridge on the pad with your finger, join both supports to the weight, and
        see whether yours sags less or holds more.
      </Typography>
      <Button
        variant={editing ? "outlined" : "contained"}
        color="primary"
        onClick={toggleEditor}
        disabled={canEdit === false}
      >
        {editing ? "Close the editor" : "Open the editor"}
      </Button>
      {canEdit === false && (
        <Typography css={hintStyle} variant="body2">
          Available once the bridge has finished growing.
        </Typography>
      )}

      {editing && (
        <>
          <div
            ref={padRef}
            css={padStyle}
            data-dragging={dragging}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <PadGuides spot={knownSpot} />
            {trail.length === 0 && <div css={padLabelStyle}>Draw here. The wall shows what you build.</div>}
            <svg
              viewBox="0 0 200 100"
              preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            >
              {trail.map((p, i) => (
                <circle key={i} cx={p.x * 200} cy={p.y * 100} r={1.6 + brush * 0.9} fill="rgba(207,195,171,0.55)" />
              ))}
            </svg>
          </div>
          <div css={rowStyle}>
            <Button variant="outlined" color="primary" size="small" onClick={() => changeBrush(brush - 1)}>
              Smaller
            </Button>
            <span css={valueStyle}>brush {brush + 1}</span>
            <Button variant="outlined" color="primary" size="small" onClick={() => changeBrush(brush + 1)}>
              Bigger
            </Button>
            <Chip label="Erase" clickable color={erase ? "secondary" : "default"} onClick={() => setErase((prev) => !prev)} />
          </div>
          <Button variant="outlined" color="secondary" fullWidth onClick={restart}>
            Restart
          </Button>
          <div css={rowStyle}>
            <Button variant="contained" color="primary" onClick={() => sendMessage(msg.testMine())}>
              Test my bridge
            </Button>
            <Button variant="outlined" color="primary" onClick={toggleReveal}>
              {reveal ? "Hide algorithm" : "Reveal algorithm"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default LoadPathControls;
