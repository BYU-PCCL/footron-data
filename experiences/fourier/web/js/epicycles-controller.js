import {
  getFourierData,
  resample2dData,
  scaleAndShift2dData,
} from "./just-fourier-things.js";
import { slurp, clampedSlurp, easeOutSine, bounce, clamp } from "./util.js";
import { basicStyle } from "./color.js";

import CanvasController from "./canvas-controller.js";

export default class EpicyclesController {
  constructor(id) {
    // config values
    this.maxNumPathPoints = 4096;
    this.period = 120; // Time for a default full cycle. Note: Can be slowed or sped up by setPeriod()
    this.zoomEaseTime = 5; // How long a zoom takes
    this.minRenderAmplitude = 0.01;
    this.easeTime = 5; // how many seconds to chase an update
    this.easingMethod = "bounce";
    this.fillAmount = 0.75 // How much of the canvas the path can take up (at default zoom)

    this.id = id;
    this.drawSteps = [];

    this.leftCanvasController = new CanvasController("leftCanvas",);
    this.leftCanvasController.fullscreen(true)
    this.rightCanvasController = new CanvasController("rightCanvas");
    this.rightCanvasController.minimize(true)
    this.lastTime = Date.now();

    // Listener for fullscreen changes
    window.addEventListener("resize", (evt) => this.onResize(evt));
    this.isTransitioning = false
    document.addEventListener('transitionstart', event => {
      const { target } = event;
      if (target != this.leftCanvasController.container) return
      console.log("Transistion!")
      this.isTransitioning = true;
      const onFinish = event => {
        if (event.target !== target) return;
        target.removeEventListener('transitioncancel', onFinish);
        target.removeEventListener('transitionend', onFinish);
        this.isTransitioning = false;
        this.onResize()
      };
      target.addEventListener('transitioncancel', onFinish);
      target.addEventListener('transitionend', onFinish);
    })

    this.animate = true;

    this.fourierOrigin = { x: 0, y: 0 } // the offset from the top left given by the first fourier term
    // [ {freq, amplitude, phase } ]
    this.sourceFourierData = []; // Ground truth
    this.changingSourceFourierData = []; // Ground truth
    this.targetFourierData = []; // Altered
    this.currentFourierData = [];
    this.easeStartFourierData = []; // copy of current to calculate ease
    this.currentNumFourierTerms = 0;
    this.totalNumFourierTerms = 0;
    this.lastNonZeroIndex = -1;

    // [ {x, y} ]
    this.numPathPoints = this.maxNumPathPoints;
    this.sourceFourierPath = [];
    this.currentFourierPath = [];

    this.animAmt = 0;
    this.niceAnimAmt = 0;
    this.followIndex = null;

    this.followPoint = { x: 0, y: 0 }

    this.startZoom = {
      scale: 1,
      xCenter: 0,
      yCenter: 0
    }
    this.currentZoom = {
      scale: 1,
      xCenter: 0,
      yCenter: 0
    }
    this.targetZoom = {
      zoom: 1,
      xCenter: 0,
      yCenter: 0
    }
    this.zoomEaseAmt = 0;
    this.zoomFinishedEasing = true

    this.pathDirty = false;

    this.easeAmt = 0;
    this.finishedEasing = true;

    this.boxCoords = { x: 0, y: 0, width: 0, height: 0 };
    this.startBoxCoords = { x: 0, y: 0, width: 0, height: 0 };

    this.fullscreen = "left";
  }

  setFullscreen(fullscreenTarget) {
    if (fullscreenTarget == "left") {
      this.fullscreen = "left";
      this.leftCanvasController.minimize(false)
      this.rightCanvasController.fullscreen(false)
      this.rightCanvasController.minimize(true)
      this.leftCanvasController.fullscreen(true)
    } else if (fullscreenTarget == "right") {
      this.fullscreen == "right";
      this.rightCanvasController.minimize(false)
      this.leftCanvasController.fullscreen(false)
      this.leftCanvasController.minimize(true)
      this.rightCanvasController.fullscreen(true)
    } else {
      this.fullscreen = "both"
      this.leftCanvasController.fullscreen(false)
      this.rightCanvasController.fullscreen(false)
      this.leftCanvasController.minimize(false)
      this.rightCanvasController.minimize(false)
    }
  }

  // Kick off the update loop
  start() {
    window.requestAnimationFrame(() => this.everyFrame());
  }

  everyFrame() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.everyFrame());
  }

  /**
   * Debug function to print values to console
   */
  query() {
    let generalMessage = `
    General:
        sourceLength:  ${this.sourceFourierData.length}
        targetLength:  ${this.targetFourierData.length}
        currentLength: ${this.currentFourierData.length}
        easeLength:    ${this.easeStartFourierData.length}

        numFourierTerms: ${this.currentNumFourierTerms}
        numPathPoints:   ${this.numPathPoints}`;
    console.log(generalMessage);

    this.canvases.forEach((canvas) => {
      canvas.query();
    });
    console.log(this.drawSteps);
  }

  setPathFromPoints(path, numPoints = -1, zerosAtStart = false) {
    if (numPoints < 0) {
      numPoints = path.length;
    }
    this.numPathPoints = Math.min(numPoints * 2, this.maxNumPathPoints);
    this.animAmt = 0;
    this.niceAnimAmt = 0;
    let scaledAndCentered = scaleAndShift2dData(path, this.rightCanvasController.width, this.rightCanvasController.height, this.fillAmount);
    this.boxCoords = scaledAndCentered.boxCoords;
    this.startBoxCoords = scaledAndCentered.startBoxCoords;
    // Get the fourier data, also filter out the really small terms.
    let resampledData = resample2dData(
      scaledAndCentered.data,
      1 << (31 - Math.clz32(this.numPathPoints)) // next power of 2
    );
    // console.log("Resampled: ", resampledData)
    this.initializeData(getFourierData(resampledData), zerosAtStart);
    console.log(this.sourceFourierData.length + "/" + numPoints);
    this.resetEase(this.currentFourierData, this.easeStartFourierData);
  }

  initializeData(fourierData, zerosAtStart, transition) {
    if (fourierData[0] == undefined) console.error("Fourier Data is undefined")
    let test = document.getElementById("inProgressTitle")
    test.style = "color: purple;"
    // fourierData.sort((a, b) => b.amplitude - a.amplitude); 
    // // sort by amplitude.  
    // // More efficient (most significant terms first), but less mathmatically correct
    this.sourceFourierData = this.copyArray(fourierData)
    this.targetFourierData = this.copyArray(fourierData)
    if (transition) {
      while (this.targetFourierData > this.currentFourierData) {
        this.currentFourierData.push({ freq: this.targetFourierData[this.currentFourierData.length].freq, phase: 0, amplitude: 0 })
      }
    }
    test.style = "color: red;"
    if (!transition) this.currentFourierData = this.copyArray(fourierData)
    if (zerosAtStart) {
      this.currentFourierData.forEach(function (e) {
        e.amplitude = 0;
        e.phase = 0;
      })
    }
    test.style = "color: orange;"
    let { amplitude, phase } = this.sourceFourierData[0]
    this.fourierOrigin = {
      x: amplitude * Math.cos(phase),
      y: amplitude * Math.sin(phase)
    }
    this.currentFourierData[0] = { ...this.sourceFourierData[0] };
    this.currentNumFourierTerms = this.sourceFourierData.length;
    this.totalNumFourierTerms = this.sourceFourierData.length;
    this.recalculatePath(this.sourceFourierData, this.sourceFourierPath);
    this.recalculatePath(this.currentFourierData, this.currentFourierPath, this.currentFourierData.length, true);
    if (transition) this.resetEase(this.currentFourierData);
  }

  copyArray(array) {
    // return JSON.parse(JSON.stringify(array));
    return structuredClone(array); // this seems to perform a tad better.
  }

  setSource(fourierData, fromZero = false, transition = false) {
    let test = document.getElementById("inProgressTitle")
    
    this.initializeData(fourierData, fromZero, transition)
    test.style = "color: yellow;"
    this.numPathPoints = this.sourceFourierData.length * 2;
    
    test.style = "color: green;"

    this.resetEase(this.currentFourierData, this.easeStartFourierData);
    console.log("done setting source");
  }

  setFourierAmt(amt) {
    let fullLength = this.sourceFourierData.length;
    if (amt <= 1) amt *= fullLength;
    this.currentNumFourierTerms = Math.round(clamp(amt, 2, fullLength));
    for (let i = 1; i < this.currentNumFourierTerms; i++) {
      this.targetFourierData[i] = { ...this.sourceFourierData[i] };
    }
    for (
      let i = this.currentNumFourierTerms;
      i < this.sourceFourierData.length;
      i++
    ) {
      this.targetFourierData[i].amplitude = 0;
    }
    this.resetEase(this.currentFourierData);
    return this.currentNumFourierTerms;
  }

  changeFourierAmt(amt) {
    let fullLength = this.sourceFourierData.length;
    if (Math.abs(amt) < 1) {
      amt *= fullLength;
    }
    amt = Math.round(amt);
    this.currentNumFourierTerms += amt;
    this.currentNumFourierTerms = clamp(
      this.currentNumFourierTerms,
      2,
      fullLength
    );
    this.targetFourierData = structuredClone(this.sourceFourierData.slice());
    for (let i = this.currentNumFourierTerms; i < fullLength; i++) {
      this.targetFourierData[i].amplitude = 0;
    }
    this.resetEase(this.currentFourierData, this.easeStartFourierData);
    return this.currentNumFourierTerms;
  }

  setFollowIndex(index = null) {
    this.followIndex = index
    if (null == index) {
      this.displayBox = false
      this.targetZoom.xCenter = this.rightCanvasController.canvas.width / 2;
      this.targetZoom.yCenter = this.rightCanvasController.canvas.height / 2;
    }
    this.resetZoomEase()
  }

  setZoom(zoom = 1) {
    this.targetZoom.zoom = clamp(zoom, 1, 10);
    this.resetZoomEase()
  }

  // takes a zoom level and a point in the canvas, and returns the offset from the center of the canvas to that point.
  // this is used to calculate the offset of the canvas when zooming in on a point.
  getOffsets(zoom, xPoint, yPoint) {
    let xOffset = xPoint - (this.rightCanvasController.canvas.width / 2) / zoom;
    let yOffset = yPoint - (this.rightCanvasController.canvas.height / 2) / zoom;
    return xOffset, yOffset;
  }

  boxFromZoomPoint(canvas, zoom, xPoint, yPoint) {
    let x, y, width, height;
    width = canvas.canvas.width / zoom
    height = canvas.canvas.height / zoom
    x = xPoint - (width / 2)
    y = yPoint - (height / 2)
    return {
      x: x, y: y, width: width, height: height
    }
  }

  resetZoom() {
    this.targetZoom = {
      zoom: 1,
      xCenter: this.rightCanvasController.canvas.width / 2,
      yCenter: this.rightCanvasController.canvas.height / 2
    }
    this.resetEase(this.currentFourierData);
  }

  resetZoomEase() {
    this.startZoom.scale = this.currentZoom.scale;
    this.startZoom.xCenter = this.currentZoom.xCenter;
    this.startZoom.yCenter = this.currentZoom.yCenter;
    this.zoomFinishedEasing = false
    this.zoomEaseAmt = 0
  }

  easeZoomData(dt, easeFunction) {
    if (this.zoomFinishedEasing) {
      this.currentZoom.xCenter = this.targetZoom.xCenter
      this.currentZoom.yCenter = this.targetZoom.yCenter
      this.currentZoom.scale = this.targetZoom.zoom
      return;
    }

    this.zoomEaseAmt = clamp(this.zoomEaseAmt + dt / this.zoomEaseTime, 0, 1);
    let progress = easeFunction(this.zoomEaseAmt);

    this.currentZoom.xCenter = slurp(this.startZoom.xCenter, this.targetZoom.xCenter, progress)
    this.currentZoom.yCenter = slurp(this.startZoom.yCenter, this.targetZoom.yCenter, progress)
    this.currentZoom.scale = slurp(this.startZoom.scale, this.targetZoom.zoom, progress)

    if (this.zoomEaseAmt >= 1) {
      this.zoomFinishedEasing = true;
    }
  }

  setEpicycle(index, phase = null, amplitude = null) {
    if (index < 0 || index >= this.sourceFourierData.length) {
      return;
    }
    if (!isNaN(amplitude)) this.targetFourierData[index].amplitude = amplitude;
    if (!isNaN(phase)) this.targetFourierData[index].phase = phase;
    this.resetEase(this.currentFourierData);
  }

  resetEpicycles(index = -1) {
    if (index >= this.sourceFourierData.length) {
      return;
    }
    if (index < 0) {
      this.targetFourierData = this.sourceFourierData.map((d) => ({ ...d }));
    } else {
      this.targetFourierData[index].amplitude =
        this.sourceFourierData[index].amplitude;
      this.targetFourierData[index].phase = this.sourceFourierData[index].phase;
    }
    this.resetEase(this.currentFourierData, this.easeStartFourierData);
  }

  setHighlight(index, highlightStyle = basicStyle) {
    this.drawSteps.forEach(step => {
      if (step.type == "circles") {
        step.index = index;
        step.highlightStyle = highlightStyle;
      }
    });
  }

  setPeriod(seconds = 60) {
    if (seconds == 0) return;
    this.period = seconds;
  }

  recalculatePath(data, path, maxFouriers = -1, pathResolution = this.numPathPoints) {
    // then render everything.
    for (let i = 0; i <= pathResolution; i++) {
      this.niceAnimAmt += 1 / this.numPathPoints;
      this.addToPath(data, path, maxFouriers);
    }
    this.niceAnimAmt -= 1;
  }

  update() {
    let curTime = Date.now();
    let dt = (curTime - this.lastTime) / 1000;

    this.findArm()
    this.easeZoomData(dt, easeOutSine)

    if (this.pathDirty) {
      this.recalculatePath(this.currentFourierData, this.currentFourierPath);
      this.pathDirty = false;
    }

    if (!this.finishedEasing) {
      // This call is really expensive, so we give it a max number
      // of terms to calculate during the transition
      this.recalculatePath(
        this.currentFourierData,
        this.currentFourierPath,
        this.currentFourierData.length / 2,
      );
    }
    if (!this.animate) {
      return;
    }

    if (this.easeAmt < 1) {
      this.easeData(
        dt,
        this.easeStartFourierData,
        this.currentFourierData,
        this.targetFourierData,
        easeOutSine
      );
    }

    this.animAmt += (dt / this.period) % 1;

    while (this.animAmt > 1) {
      this.animAmt--;
      this.niceAnimAmt--;
    }

    this.lastTime = curTime;
  }

  /**
   * Causes this.currentFourierData to chase this.targetFourierData
   */
  easeData(dt, start, update, target, easeFunction) {
    if (this.finishedEasing) {
      while (this.currentFourierData.length > this.targetFourierData) {
        this.currentFourierData.pop();
      }
      return;
    }

    this.easeAmt = clamp(this.easeAmt + dt / this.easeTime, 0, 1);

    // calculate the progress of the easing function
    let progress = easeFunction(this.easeAmt);

    // apply the easing function to the data
    for (let i = 0; i < update.length; i++) {
      let targetTerm = i >= target.length ? {amplitude: 0, phase: 0} : target[i];
      let amplitudeError = targetTerm.amplitude - start[i].amplitude;
      update[i].amplitude = start[i].amplitude + progress * amplitudeError;
      let phaseError = targetTerm.phase - start[i].phase;
      update[i].phase = start[i].phase + progress * phaseError;
    }

    if (this.easeAmt >= 1) {
      this.finishedEasing = true;
      this.pathDirty = true;
    }
  }

  resetEase(current) {
    this.startZoom.scale = this.currentZoom.scale
    this.easeStartFourierData = current.map((d) => ({ ...d }));
    this.easeAmt = 0;
    this.finishedEasing = false;
  }

  addToPath(data, path, maxFouriers = -1) {
    if (data.length == 0) {
      return;
    }
    let runningX = 0;
    let runningY = 0;
    const numFouriers = maxFouriers === -1 ? data.length : Math.min(data.length, maxFouriers);
    const theta = 2 * Math.PI * this.niceAnimAmt;

    for (let i = 0; i < numFouriers; i++) {
      const { amplitude, freq, phase } = data[i];
      const angle = theta * freq + phase;
      runningX += amplitude * Math.cos(angle);
      runningY += amplitude * Math.sin(angle);
    }

    path.push({ x: runningX, y: runningY });

    while (path.length > this.numPathPoints + 1) {
      path.shift();
    }
  }

  findArm() {
    if (this.followIndex < 0 || this.followIndex == null) {
      const canvasWidth = this.rightCanvasController.canvas.width;
      const canvasHeight = this.rightCanvasController.canvas.height;
      this.targetZoom.xCenter = canvasWidth / 2;
      this.targetZoom.yCenter = canvasHeight / 2;
      return;
    }

    let runningX = 0;
    let runningY = 0;
    const theta = 2 * Math.PI * this.animAmt;
    const data = this.currentFourierData;

    for (let i = 0; i < this.followIndex; i++) {
      const { amplitude, freq, phase } = data[i];
      const angle = theta * freq + phase;
      runningX += amplitude * Math.cos(angle);
      runningY += amplitude * Math.sin(angle);
    }

    this.targetZoom.xCenter = runningX;
    this.targetZoom.yCenter = runningY;
  }

  renderCanvas(canvas, zoomInfo = null) {
    if (zoomInfo != null) {
      canvas.zoom = zoomInfo
    }
    const filtered = this.drawSteps.filter((step) => step.canvas === canvas.id);
    const currentZoom = this.currentZoom;
    const currentZoomXCenter = currentZoom.xCenter;
    const currentZoomYCenter = currentZoom.yCenter;
    const currentZoomScale = currentZoom.scale;

    filtered.forEach((step) => {
      if (step.dataType === "box") {
        step.boxCoords = this.boxFromZoomPoint(canvas, currentZoomScale, currentZoomXCenter, currentZoomYCenter);
        if (currentZoomScale > 1) step.style.alpha = Math.round(Math.min(currentZoomScale - 1, 1) * 100);
      } else if (step.dataType === "path") {
        step.data = step.source === "source" ? this.sourceFourierPath : this.currentFourierPath;
      } else if (step.dataType === "fourier") {
        step.data = step.source === "source" ? this.sourceFourierData : this.currentFourierData;
      }
    });
    canvas.drawFrame(this.animAmt, filtered);
  }

  render() {
    if (this.isTransitioning) {
      this.onResize()
    }
    this.renderCanvas(this.leftCanvasController, this.currentZoom)
    this.renderCanvas(this.rightCanvasController)
  }

  /**
   * Resize canvases to fit new context
   */
  onResize() {
    this.leftCanvasController.onResize()
    this.rightCanvasController.onResize()
  }
}
