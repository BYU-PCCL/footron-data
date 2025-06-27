import { palette } from "./color.js";
import InfoPanel from "./info-panel.js";

import { basicStyle } from "./color.js";

export default class CanvasController {
  constructor(id, fullscreen = false) {
    this.id = id;
    this.width = 0
    this.height = 0
    this.canvas = document.getElementById(id);
    this.container = this.canvas.parentElement
    this.onResize();
    this.isTransitioning = false;


    /** @type {CanvasRenderingContext2D} */
    this.context = this.canvas.getContext("2d");
    this.infoPanel = new InfoPanel(this.canvas);
    this.animate = true;

    // What percentage of the path to draw
    this.animatePathAmt = true;
    this.pathDirty = false;
    this.minRenderAmplitude = 0.1;

    this.zoom = {
      scale: 1,
      xCenter: this.canvas.width / 2,
      yCenter: this.canvas.height / 2,
    }
  }

  fullscreen(makeFullscreen) {
    if (makeFullscreen) {
      this.container.classList.add("fullscreen");
    } else {
      this.container.classList.remove("fullscreen")
    }
  }

  minimize(makeMinimized) {
    if (makeMinimized) {
      this.container.classList.add("minimized");
    } else {
      this.container.classList.remove("minimized")
    }
  }

  // print values to console
  query() {
    console.log(`Canvas ${this.id}:`)
    this.drawSteps.forEach(step => {
      console.log(step)
    });
  }

  getDimensions() {
    return { x: this.width, y: this.height }
  }

  // set attatched element text
  setText(text) {
    this.infoPanel.updateNum(text)
  }

  drawFrame(animAmt, drawSteps) {
    let start = Date.now();

    for (let i = 0; i < drawSteps.length; i++) {
      const e = drawSteps[i];
      switch (e.type) {
        case "path":
          this.drawPath(e.data, e.style);
          break;
        case "circles":
          this.drawCircles(
            e.data,
            animAmt,
            e.circleStyle,
            e.lineStyle,
            e.highlightStyle,
            e.highlightIndex
          );
          break;
        case "circle":
          this.drawCircle(e.x, e.y, e.radius, e.angle, e.style);
          break;
        case "box":
          this.drawBox(e.boxCoords, e.style);
          break;
        case "clear":
          this.clear();
          break;
        case "fade":
          this.fade();
          break;
        default:
          console.error(`Unknown render step: ${e.type}`);
          break;
      }
    }
  }

  transformPoint(start, center, full, scale) {
    return scale * (start - center) + full / 2;
  }
  transformX(start) {
    return this.zoom.scale * (start - this.zoom.xCenter) + this.width / 2;
  }
  transformY(start) {
    return this.zoom.scale * (start - this.zoom.yCenter) + this.height / 2;
  }

  // Takes an array of {x: number, y: number} elements and draws them to the canvas
  drawPath(path, style = basicStyle) {
    this.context.globalAlpha = style.alpha;
    this.context.strokeStyle = style.color;
    this.context.lineWidth = style.lineWidth;
    this.context.beginPath();
    this.context.moveTo(
      this.transformX(path[0].x),
      this.transformY(path[0].y))
    for (let i = 1; i < path.length - 1; i++) {
      this.context.lineTo(
        this.transformX(path[i + 1].x),
        this.transformY(path[i + 1].y));
      }
    this.context.closePath();
    this.context.stroke();
    this.context.globalAlpha = 1;
  }

  // Takes an array of fourier data and draws each circle to the canvas with a connecting line
  drawCircles(
    fourierData,
    animAmt,
    circleStyle = basicStyle,
    lineStyle = basicStyle,
    highlightStyle = basicStyle,
    highlightIndex = null
  ) {
    if (fourierData.length == 0) {
      return;
    }
    let numFouriers = fourierData.length;
    // only draw up to the last circle larger than the min.
    for (let i = 1; i < numFouriers; i++) {
      if (fourierData[numFouriers - i].amplitude > this.minRenderAmplitude) {
        numFouriers = 1 + fourierData.length - i;
        break;
      }
    }

    let runningX = 0;
    let runningY = 0;
    let lastX, lastY;
    const theta = 2 * Math.PI * animAmt
    for (let i = 0; i < numFouriers; i++) {
      const amplitude = fourierData[i].amplitude;
      const angle = theta * fourierData[i].freq + fourierData[i].phase;
      lastX = runningX;
      lastY = runningY
      runningX += amplitude * Math.cos(angle);
      runningY += amplitude * Math.sin(angle);

      if (i == 0) {
        continue; // we skip the first one because we just don't care about rendering the constant term
      }

      if (i == highlightIndex)
        this.drawCircle(lastX, lastY, amplitude, angle, highlightStyle);
      else this.drawCircle(lastX, lastY, amplitude, angle, circleStyle);
      this.drawLine(lastX, lastY, runningX, runningY, lineStyle); // Draw the line to the new position
    }
    this.context.globalAlpha = 1;
  }

  drawCircle(x, y, radius, angle, style = basicStyle) {
    radius = Math.abs(radius * this.zoom.scale)
    this.context.beginPath();
    this.context.globalAlpha = style.alpha;
    this.context.strokeStyle = style.color;
    this.context.lineWidth = style.lineWidth;
    this.context.arc(this.transformX(x), this.transformY(y), radius, angle - Math.PI, angle + Math.PI);
    this.context.stroke();
  }

  drawLine(x1, y1, x2, y2, style = basicStyle) {
    this.context.beginPath();
    this.context.moveTo(this.transformX(x1), this.transformY(y1));
    this.context.globalAlpha = style.alpha;
    this.context.strokeStyle = style.color;
    this.context.lineWidth = style.lineWidth;
    this.context.lineTo(this.transformX(x2), this.transformY(y2));
    this.context.stroke();
  }

  drawBox(boxCoords, style = basicStyle) {
    this.context.beginPath();
    if (style.alpha) {
      let color = "rgb(" + style.color + " / " + style.alpha + "%)"
      this.context.strokeStyle = color
    } else {
      this.context.strokeStyle = style.color;
    }
    
    this.context.lineWidth = style.lineWidth;
    this.context.rect(
      boxCoords.x,
      boxCoords.y,
      boxCoords.width,
      boxCoords.height
    );
    this.context.stroke();
  }

  clear() {
    // Clear the previous frame
    this.context.resetTransform();
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  fade() {
    // draw a translucent rectangle over the frame
    this.context.resetTransform();
    this.context.fillStyle = "#000a";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  onResize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }
}
