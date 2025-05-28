import { useRef, useEffect } from "react";

type TermCanvasProps = {
  phase: number;
  amplitude: number;
  maxAmplitude: number;
};

const width = 300;
const height = width;
const midX = width / 2;
const midY = midX;

function drawArc(
  context: CanvasRenderingContext2D,
  radius: number,
  rotation: number,
  color: string,
  alpha: number,
  lineWidth: number
) {
  context.beginPath();
  context.globalAlpha = alpha;
  context.lineWidth = width * lineWidth;
  context.strokeStyle = color;
  context.arc(midX, midY, radius, 0, rotation, rotation < 0);
  context.stroke();
  context.globalAlpha = 1;
}

function fillArc(
  context: CanvasRenderingContext2D,
  radius: number,
  rotation: number,
  color: string,
  alpha: number
) {
  const start = rotation < 0 ? rotation : 0;
  const end = rotation < 0 ? 0 : rotation;
  context.beginPath();
  context.moveTo(midX, midY);
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.arc(midX, midY, radius, start, end);
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
  const rY = midY + Math.sin(phase) * amplitude;
  context.beginPath();
  context.globalAlpha = alpha;
  context.lineWidth = width * lineWidth;
  context.strokeStyle = color;
  context.moveTo(midX, midY);
  context.lineTo(rX, rY);
  context.stroke();
  context.globalAlpha = 1;
}

export default function TermCanvas({
  phase,
  amplitude,
  maxAmplitude,
}: TermCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    function draw(context: CanvasRenderingContext2D) {
      if (context) {
        const full = 2 * Math.PI
        // A little buffer so the circle stays on screen
        const onCanvasMaxAmplitude = width / 2.2;
        const onCanvasAmplitude =
          (onCanvasMaxAmplitude * Math.abs(amplitude)) / maxAmplitude;
        const onCanvasPhase = amplitude > 0 ? phase : -1 * phase;
        // currentPhasefill
        fillArc(context, onCanvasAmplitude, phase, "yellow", 0.3);
        fillArc(context, onCanvasAmplitude, phase, "yellow", 0.2);
        // Max Circle
        drawArc(context, onCanvasMaxAmplitude, full, "lightgray", 1, 0.03);
        drawArc(context, onCanvasMaxAmplitude, full, "lightgray", 0.5, 0.02);
        // Start Radius
        drawRadius(context, onCanvasMaxAmplitude, 0, "lightgray", 1, 0.03);
        drawRadius(context, onCanvasMaxAmplitude, 0, "lightgray", 0.5, 0.02);
        // currentCircle
        drawArc(context, onCanvasAmplitude, full, "black", 1, 0.02);
        drawArc(context, onCanvasAmplitude, full, "black", 0.5, 0.01);
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
        // currentPhase
        drawArc(context, onCanvasMaxAmplitude, phase, "yellow", 1, 0.03);
        drawArc(context, onCanvasMaxAmplitude, phase, "yellow", 0.5, 0.02);
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
  }, [phase, amplitude]);

  return <canvas ref={canvasRef} className="full" />;
}
