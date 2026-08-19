import { Typography } from "@material-ui/core";
import React from "react";

type TermCanvasProps = {
  phase: number;
  amplitude: number;
  initialPhase: number;
  initialAmplitude: number;
  disabled: boolean;
};

// canvas size, not screen
const width = 300;
const height = width;
const midX = width / 2;
const midY = midX;

function drawArc(
  context: CanvasRenderingContext2D,
  radius: number,
  arcStart: number,
  arcEnd: number,
  color: string,
  alpha: number,
  lineWidth: number
) {
  const start = Math.max(arcStart, arcEnd);
  const end = Math.min(arcStart, arcEnd);
  context.beginPath();
  context.globalAlpha = alpha;
  context.lineWidth = width * lineWidth;
  context.strokeStyle = color;
  context.arc(midX, midY, radius, -start, -end);
  context.stroke();
  context.globalAlpha = 1;
}

function fillArc(
  context: CanvasRenderingContext2D,
  radius: number,
  fillStart: number,
  fillEnd: number,
  color: string,
  alpha: number
) {
  const start = Math.max(fillStart, fillEnd);
  const end = Math.min(fillStart, fillEnd);
  context.beginPath();
  context.moveTo(midX, midY);
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.arc(midX, midY, radius, -start, -end);
  context.lineTo(midX, midY);
  context.fill();
  context.globalAlpha = 1;
}

function drawRadius(
  context: CanvasRenderingContext2D,
  amplitude: number,
  phase: number,
  color: string,
  alpha: number,
  lineWidth: number
) {
  const rX = midX + Math.cos(phase) * amplitude;
  const rY = midY - Math.sin(phase) * amplitude;
  context.beginPath();
  context.globalAlpha = alpha;
  context.lineWidth = width * lineWidth;
  context.strokeStyle = color;
  context.moveTo(midX, midY);
  context.lineTo(rX, rY);
  context.stroke();
  context.globalAlpha = 1;
}

function getDisplayPercentages(initial: number, current: number) {
  let initialPercentage = 0.5;
  let currentPercentage = initial == 0 ? 1 : current / (2 * initial);
  if (current > 2 * initial) {
    currentPercentage = 1;
    initialPercentage = initial / current;
  }
  return {
    initialPercentage: initialPercentage,
    currentPercentage: currentPercentage,
  };
}

const TermCanvas = ({
  phase,
  amplitude,
  initialPhase,
  initialAmplitude,
  disabled,
}: TermCanvasProps): JSX.Element => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const frameRef = React.useRef<number>(0);

  React.useEffect(() => {
    function draw(context: CanvasRenderingContext2D) {
      if (context) {
        const { initialPercentage, currentPercentage } = getDisplayPercentages(
          initialAmplitude,
          amplitude
        );
        const full = 2 * Math.PI;
        // A little buffer so the circle stays on screen
        const onCanvasMaxAmplitude = width / 2.2;
        const onCanvasAmplitude = onCanvasMaxAmplitude * currentPercentage;
        const onCanvasInitialAmplitude =
          onCanvasMaxAmplitude * initialPercentage;
        const onCanvasPhase = amplitude >= 0 ? phase : -1 * phase;
        // currentPhasefill
        fillArc(
          context,
          onCanvasAmplitude,
          onCanvasPhase,
          initialPhase,
          "yellow",
          0.3
        );
        fillArc(
          context,
          onCanvasAmplitude,
          onCanvasPhase,
          initialPhase,
          "yellow",
          0.2
        );
        // Initial Circle
        drawArc(
          context,
          onCanvasInitialAmplitude,
          0,
          full,
          "lightgray",
          1,
          0.03
        );
        drawArc(
          context,
          onCanvasInitialAmplitude,
          0,
          full,
          "lightgray",
          0.5,
          0.02
        );
        // Start Radius
        drawRadius(
          context,
          onCanvasInitialAmplitude,
          initialPhase,
          "lightgray",
          1,
          0.03
        );
        drawRadius(
          context,
          onCanvasInitialAmplitude,
          initialPhase,
          "lightgray",
          0.5,
          0.02
        );
        // currentPhase
        drawArc(context, onCanvasInitialAmplitude, initialPhase, phase, "yellow", 1, 0.03);
        drawArc(context, onCanvasInitialAmplitude, initialPhase, phase, "yellow", 0.5, 0.02);
        // currentCircle
        drawArc(context, onCanvasAmplitude, 0, full, "black", 1, 0.02);
        drawArc(context, onCanvasAmplitude, 0, full, "black", 0.5, 0.01);
        // Current Radius
        context.lineCap = "round";
        drawRadius(context, onCanvasAmplitude, onCanvasPhase, "blue", 1, 0.03);
        drawRadius(
          context,
          onCanvasAmplitude,
          onCanvasPhase,
          "blue",
          0.5,
          0.02
        );
      }
    }

    if (canvasRef.current) {
      const context = canvasRef.current.getContext("2d");

      if (context) {
        context.canvas.height = height;
        context.canvas.width = width;

        frameRef.current = requestAnimationFrame(() => draw(context));
      }
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [phase, amplitude, initialPhase, initialAmplitude]);

  return (
    <>
      {disabled ? (
        <Typography className="term-canvas">Loading...</Typography>
      ) : (
        <canvas ref={canvasRef} className="term-canvas" />
      )}
    </>
  );
};

export default TermCanvas;
