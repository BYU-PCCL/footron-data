import {
  getFourierData,
  resample2dData,
  scaleAndShift2dData,
} from "./just-fourier-things.js";
import { slurp, clampedSlurp, easeOutSine, bounce, clamp, easeInOut, sinEaseInOut } from "./util.js";
import { basicStyle } from "./color.js";

import CanvasController from "./canvas-controller.js";

export default class EpicyclesController {
  /**
   * This class does all of the heavy lifting of calculating and animating the full path and the arm of epiccycles
   * @param {string} id ID of the page's controller element
   * @param {integer} maxPathPoints Maximum resolution of the path
   * @param {integer} minPathPoints Minimum
   * @param {number} period Time for a default full cycle. Note: Can be slowed or sped up by setPeriod()
   * @param {number} easeTime How many seconds to chase an update
   * @param {number} zoomEaseTime How long a zoom takes
   * @param {*} easingFunction CSS style function to interpolate between path changes
   * @param {*} zoomEaseFunction CSS style function to interpolate between zoom values
   * @param {number} minRenderAmplitude The size of term to not bother rendering. default is 0.01
   * @param {number} fillAmount How much of the canvas the path can take up (at default zoom)
   * @param {number} goalFrameRate Each frame the amount of calculations will change to attempt to stay above this goal. 40=40 fps
   * @param {integer} minimalChunk Minimum number of terms to calculate each frame regardless of framerate
   */
  constructor(
    id, renderSteps,
    maxPathPoints = 2048, minPathPoints = 1024, 
    period = 120, easeTime = 5, zoomEaseTime = 5, 
    easingFunction = sinEaseInOut, zoomEaseFunction = sinEaseInOut,
    minRenderAmplitude = 0.01, 
    fillAmount = 0.75, goalFrameRate = 20, minimalChunk = 256
  ) {
    this.id = id;
    this.renderSteps = renderSteps;
    this.maxNumPathPoints = maxPathPoints;
    this.minNumPathPoints = minPathPoints;
    this.period = period; 
    this.easeTime = easeTime;
    this.zoomEaseTime = zoomEaseTime;
    this.minRenderAmplitude = minRenderAmplitude;
    this.easeFunction = easingFunction;
    this.zoomEaseFunction = zoomEaseFunction
    this.zoomEaseFunction = 
    this.fillAmount = fillAmount
    this.goalFrameRate = 1 / goalFrameRate
    this.minimalChunk = minimalChunk;

    this.leftCanvasController = new CanvasController("leftCanvas",);
    this.leftCanvasController.fullscreen(true)
    this.rightCanvasController = new CanvasController("rightCanvas");
    this.rightCanvasController.minimize(true)
    // Listener for fullscreen changes
    window.addEventListener("resize", (evt) => this.#onResize(evt));
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
        this.#onResize()
      };
      target.addEventListener('transitioncancel', onFinish);
      target.addEventListener('transitionend', onFinish);
    })
    // Boxes
    this.boxCoords = { x: 0, y: 0, width: 0, height: 0 };
    this.startBoxCoords = { x: 0, y: 0, width: 0, height: 0 };
    // [ {freq, amplitude, phase } ]
    this.sourceFourierData = []; // Ground truth
    this.changingSourceFourierData = []; // Ground truth
    this.targetFourierData = []; // Altered
    this.currentFourierData = [];
    this.easeStartFourierData = []; // copy of current to calculate ease
    this.currentNumFourierTerms = 0;
    // [ {x, y} ]
    this.numPathPoints = this.maxNumPathPoints;
    this.sourceFourierPath = [];
    this.currentFourierPath = [];
    // [ {scale, xCenter, yCenter} ]
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
      scale: 1,
      xCenter: 0,
      yCenter: 0
    }
    // Flags
    this.fullscreen = "left";
    this.pathDirty = false;
    this.finishedEasing = true;
    this.zoomFinishedEasing = true

    this.zoomEaseAmt = 0;
    this.easeAmt = 0;
    this.animAmt = 0;
    this.lastTime = Date.now();
    this.followIndex = null;
    this.imageName = null;
    this.deferredIndex = 0;
    this.calcChunk = 512;
  }

  /**
   * Changes the window mode to maximize the left or right canvas, or display them both
   * @param {string} fullscreenTarget accepts values of "left", "right", or "both"
   */
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

  /**
   * Kick off the update loop
   */
  start() {
    window.requestAnimationFrame(() => this.#everyFrame());
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
    console.log(this.currentFourierPath.length, this.currentFourierPath[0], this.currentFourierPath[10])
    console.log(this.currentFourierData.length, this.currentFourierData[10], this.currentFourierData[20])

    this.leftCanvasController.query();
    this.rightCanvasController.query();
    console.log(this.renderSteps);
  }

  /**
   * 
   * @returns the number of terms that are editable via other methods like setFourierAmt
   */
  maxTerms() {
    return this.sourceFourierData.length
  }

  setEaseFunction(easeFunction) {
    try {
      if (easeFunction(0) == 0 && easeFunction(1) == 1) {
        this.easeFunction = easeFunction
      }
    } catch {
      this.easeFunction = easeInOut
    }
  }

  /**
 * Sets an image from point data instead of fourier terms.
 * This is primarily a development tool to load new images
 * @param {Array.Position} path 
 * @param {integer} numPoints 
 * @param {boolean} zerosAtStart 
 */
  setSourceFromPath(path, numPoints = -1, zerosAtStart = false) {
    if (numPoints < 0) {
      numPoints = path.length * 2;
    }
    this.#setNumPathPoints(numPoints)
    this.animAmt = 0;
    let scaledAndCentered = scaleAndShift2dData(path, this.rightCanvasController.width, this.rightCanvasController.height, this.fillAmount);
    // Get the fourier data, also filter out the really small terms.
    let resampledData = resample2dData(
      scaledAndCentered.data,
      1 << (31 - Math.clz32(this.numPathPoints)) // next power of 2
    );
    // console.log("Resampled: ", resampledData)
    this.#initializeData(getFourierData(resampledData), zerosAtStart);
    console.log(this.sourceFourierData.length + "/" + numPoints);
    this.#resetEase(this.currentFourierData, this.easeStartFourierData);
  }

  /**
   * Changes the data used to calculate the cycle
   * @param {Array.FourierTerm} fourierData 
   * @param {boolean} fromZero starts all amplitudes and phases at zero to allow shape to grow from nothing
   * @param {boolean} transition if set to false, when changing the data the new shape will appear immediately 
   * instead of morphing from the previous one
   */
  setSource(fourierData, fromZero = false, transition = false, imageName = null) {
    this.#initializeData(fourierData, fromZero, transition)
    this.#setNumPathPoints(this.sourceFourierData.length * 2)
    this.#resetEase(this.currentFourierData, this.easeStartFourierData);
    this.imageName = imageName
    console.log("done setting source");
  }

  /**
   * Sets numPathPoints to a value between the min and max
   */
  #setNumPathPoints(numPoints) {
    this.numPathPoints = Math.min(numPoints, this.maxNumPathPoints);
    this.numPathPoints = Math.max(this.numPathPoints, this.minNumPathPoints)
  }

  /**
   * Sets the amplitude of all target terms after the given amt to zero
   * values of 1 or less are treated as percentages of the available terms
   * @param {number} amt 
   * @returns the updated number of terms being used
   */
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
    this.#resetEase(this.currentFourierData);
    return this.currentNumFourierTerms;
  }

  /**
   * Changes the number of terms used to calculate the cycle
   * values of 1 or less are treated as percentages of the available terms
   * @param {number} amt 
   * @returns the updated number of terms being used
   */
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
    this.#resetEase(this.currentFourierData, this.easeStartFourierData);
    return this.currentNumFourierTerms;
  }

  /**
   * Causes the left canvas "camera" to follow the tip a given epicycle
   * Calling with no index given resets the camera to the center
   * @param {integer} index 
   */
  setFollowIndex(index = null) {
    this.followIndex = index
    if (null == index) {
      this.displayBox = false
      this.targetZoom.xCenter = this.rightCanvasController.canvas.width / 2;
      this.targetZoom.yCenter = this.rightCanvasController.canvas.height / 2;
    }
    if (index == -1) {
      this.followIndex = 100
    }
    this.#resetZoomEase()
  }

  /**
   * Causes the camera to zoom in on its current location.
   * Higher numbers are more zoomed in.
   * 1 is the default and 10 is 10 times larger
   * @param {zoom} zoom automatically clamped between 1 and 10
   */
  setZoom(zoom = 1) {
    this.targetZoom.scale = clamp(zoom, 1, 10);
    this.#resetZoomEase()
  }

  /**
   * Returns the "camera" to the center of the screen at the default zoom level
   */
  resetZoom() {
    this.targetZoom = {
      zoom: 1,
      xCenter: this.rightCanvasController.canvas.width / 2,
      yCenter: this.rightCanvasController.canvas.height / 2
    }
    this.#resetEase(this.currentFourierData);
  }

  /**
   * Change the values of an epicycle
   * @param {integer} index 
   * @param {number} phase 
   * @param {amplitude} amplitude 
   */
  setEpicycle(index, phase = null, amplitude = null) {
    if (index < 0 || index >= this.sourceFourierData.length) {
      return;
    }
    if (!isNaN(amplitude)) this.targetFourierData[index].amplitude = amplitude;
    if (!isNaN(phase)) this.targetFourierData[index].phase = phase;
    this.#resetEase(this.currentFourierData);
  }

  /**
   * Resets a specified epicycle to source data
   * @param {integer} index the epicycle to reset
   */
  resetEpicycle(index) {
    if (index >= this.sourceFourierData.length || index < 0) {
      return;
    }
    this.targetFourierData[index].amplitude = this.sourceFourierData[index].amplitude;
    this.targetFourierData[index].phase = this.sourceFourierData[index].phase;
    this.#resetEase(this.currentFourierData, this.easeStartFourierData);
  }

  /**
   * Resets all epicycles to source data
   */
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
    this.#resetEase(this.currentFourierData, this.easeStartFourierData);
  }

  /**
   * Emphasize an epicycle with a style
   * @param {integer} index 
   * @param {*} highlightStyle 
   */
  setHighlight(index, highlightStyle = basicStyle) {
    this.renderSteps.forEach(step => {
      if (step.type == "circles") {
        step.index = index;
        step.highlightStyle = highlightStyle;
      }
    });
  }

  /**
   * Change how long a full cycle takes
   * @param {number} seconds defaults to 60
   */
  setPeriod(seconds = 60) {
    if (seconds == 0) return;
    this.period = seconds;
  }

  // Private methods

  /**
   * Update calculations and render canvases.
   * repeats every frame
   */
  #everyFrame() {
    // const start = Date.now()
    this.#update();
    // const updateTime = Date.now()
    this.#render();
    // const renderTime = Date.now()
    // console.debug(`FPS: ${Math.round(1000 / (renderTime - start))}, update: ${updateTime - start}ms, render: ${renderTime - updateTime}ms`)
    requestAnimationFrame(() => this.#everyFrame());
  }

  #initializeData(fourierData, zerosAtStart, transition) {
    if (fourierData[0] == undefined) console.error("Fourier Data is undefined")
    // fourierData.sort((a, b) => b.amplitude - a.amplitude); 
    // // sort by amplitude.  
    // // More efficient (most significant terms first), but less mathmatically correct
    this.sourceFourierData = this.#copyArray(fourierData)
    this.targetFourierData = this.#copyArray(fourierData)
    if (transition) {
      while (this.targetFourierData > this.currentFourierData) {
        this.currentFourierData.push({ freq: this.targetFourierData[this.currentFourierData.length].freq, phase: 0, amplitude: 0 })
      }
    }
    if (!transition) this.currentFourierData = this.#copyArray(fourierData)
    if (zerosAtStart) {
      this.currentFourierData.forEach(function (e) {
        e.amplitude = 0;
        e.phase = 0;
      })
    }
    if (zerosAtStart || !transition) {
      this.currentFourierData[0] = { ...this.sourceFourierData[0] };
    }
    this.currentNumFourierTerms = this.sourceFourierData.length;
    this.sourceFourierPath = this.#calculatePath(this.sourceFourierData, this.sourceFourierPath);
    if (transition) this.#resetEase(this.currentFourierData);
  }

  #copyArray(array) {
    return JSON.parse(JSON.stringify(array));
    // return structuredClone(array); // this seems to perform a tad better.
    // EXCEPT ON PROD WHERE IT CRASHES!
  }

  #resetZoomEase() {
    this.startZoom.scale = this.currentZoom.scale;
    this.startZoom.xCenter = this.currentZoom.xCenter;
    this.startZoom.yCenter = this.currentZoom.yCenter;
    this.zoomFinishedEasing = false
    this.zoomEaseAmt = 0
  }

  #easeZoomData(dt, easeFunction) {
    if (this.zoomFinishedEasing) {
      this.currentZoom.xCenter = this.targetZoom.xCenter
      this.currentZoom.yCenter = this.targetZoom.yCenter
      this.currentZoom.scale = this.targetZoom.scale
      return;
    }

    this.zoomEaseAmt = clamp(this.zoomEaseAmt + dt / this.zoomEaseTime, 0, 1);
    let progress = easeFunction(this.zoomEaseAmt);

    this.currentZoom.xCenter = slurp(this.startZoom.xCenter, this.targetZoom.xCenter, progress)
    this.currentZoom.yCenter = slurp(this.startZoom.yCenter, this.targetZoom.yCenter, progress)
    this.currentZoom.scale = slurp(this.startZoom.scale, this.targetZoom.scale, progress)
    if (this.zoomEaseAmt >= 1) {
      this.zoomFinishedEasing = true;
    }
  }

  /**
* 
* @param {*} data 
* @param {*} path 
*/
  #calculatePath(data, path) {
    path = this.#partialCalculatePath(data, path, data.length)
    this.deferredIndex = 0
    return path
  }

  /**
   * 
   * @param {*} data 
   * @param {*} path 
   * @param {*} numTerms 
   * @param {*} startTerm 
   */
  #partialCalculatePath(data, path, numTerms = 1, startTerm = 0) {
    while (path.length < this.numPathPoints) {
      path.push({ x: 0, y: 0 });
    }
    if (path.length > this.numPathPoints) {
      path = path.slice(0, this.numPathPoints);
    }
    if (startTerm + numTerms > data.length) {
      numTerms = data.length - startTerm
      console.log("KEEP ME")
    }
    if (numTerms < 1) return path
    for (let i = 0; i < path.length; i++) {
      this.#updatePathPoint(data, path, i, numTerms, startTerm);
    }
    return path
  }

  /**
* 
* @param {*} data 
* @param {*} path 
* @param {integer} index the index of the item in path that will be updated
* @param {integer} numAddedFouriers optional number to specify how many fourier terms should be used in the calculation
*/
  #updatePathPoint(data, path, index, numAddedFouriers = -1, startTerm = 0) {
    if (data.length == 0) {
      console.error("updatePathPoint called with no data")
      return;
    }
    if (index >= path.length) {
      console.error("Trying to set point at index ", index, " outside path ", path.length)
      return;
    }
    if (data.length <= 1) {
      console.error("data.length is only ", data.length)
    }
    if (startTerm >= data.length) {
      console.error("start term is after end of data ")
      return;
    }

    if (numAddedFouriers == -1) {
      numAddedFouriers = data.length - startTerm
    }

    if (numAddedFouriers < 1) {
      console.error("NEGATIVE", data.length - startTerm)
    }


    if (startTerm != 0) {
      path[index] = this.#getPoint(data, index / path.length, numAddedFouriers, startTerm, path[index])
    } else {
      path[index] = this.#getPoint(data, index / path.length, numAddedFouriers)
    }
  }

  /**
   * Find the position of a point at some point in the cycle
   * @param {Array.{freq: number, amplitude: number, phase: number}} data The fourier data used to calculate the point
   * @param {number} percentage The position in the cycle
   * @param {integer} numFouriers How many terms of fourier data to use in the calculation
   * @param {integer} startFourier An offset to ignore the first terms of the data
   * @param {{x: number, y: number}} initialPoint x and y offsets to the calculated point
   * @returns 
   */
  #getPoint(data, percentage, numFouriers, startFourier = 0, initialPoint = { x: 0, y: 0 }) {
    if (percentage < 0 || percentage > 1) {
      console.error("Get point called with bad percentage: " + percentage)
    }
    if (numFouriers < 0) {
      console.error("Get point with negative numFouriers")
    }

    let xChange = 0;
    let yChange = 0;

    const endFourier = Math.min(data.length, numFouriers + startFourier);
    const theta = 2 * Math.PI * percentage;

    for (let i = startFourier; i < endFourier; i++) {
      const { amplitude, freq, phase } = data[i];
      const angle = theta * freq + phase;
      xChange += amplitude * Math.cos(angle);
      yChange += amplitude * Math.sin(angle);
    }
    return ({ x: xChange + initialPoint.x, y: yChange + initialPoint.y })
  }

  #boxFromZoomPoint(canvas, zoom, xPoint, yPoint) {
    let x, y, width, height;
    width = canvas.canvas.width / zoom
    height = canvas.canvas.height / zoom
    x = xPoint - (width / 2)
    y = yPoint - (height / 2)
    return {
      x: x, y: y, width: width, height: height
    }
  }

  #update() {
    let curTime = Date.now();
    let dt = (curTime - this.lastTime) / 1000;
    this.lastTime = curTime

    this.#findArm()
    this.#easeZoomData(dt, easeOutSine)

    if (!this.finishedEasing) {
      this.currentFourierPath = this.#partialCalculatePath(
        this.currentFourierData,
        this.currentFourierPath, this.calcChunk
      );
    } else if (this.pathDirty) {
      this.#partialCalculatePath(
        this.currentFourierData,
        this.currentFourierPath, this.calcChunk, this.deferredIndex
      );
      this.deferredIndex += this.calcChunk
      this.refining = true;
      if (this.deferredIndex >= this.currentFourierData.length) {
        this.pathDirty = false
        this.deferredIndex = 0
      }
    }

    if (this.easeAmt < 1) {
      this.#easeData(
        dt,
        this.easeStartFourierData,
        this.currentFourierData,
        this.targetFourierData,
        this.easeFunction
      );
      this.deferredIndex = 0
    }

    this.animAmt += (dt / this.period) % 1;

    while (this.animAmt > 1) {
      this.animAmt--;
    }
  }

  /**
   * Causes this.currentFourierData to chase this.targetFourierData
   */
  #easeData(dt, start, update, target, easeFunction) {
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
      let targetTerm = i >= target.length ? { amplitude: 0, phase: 0 } : target[i];
      let amplitudeError = targetTerm.amplitude - start[i].amplitude;
      update[i].amplitude = start[i].amplitude + progress * amplitudeError;
      let phaseError = targetTerm.phase - start[i].phase;
      update[i].phase = start[i].phase + progress * phaseError;
    }

    if (this.easeAmt >= 1) {
      this.finishedEasing = true;
      this.deferredIndex = 0
      this.pathDirty = true
    }
  }

  /**
   * Restarts the ease function
   * @param {*} current 
   */
  #resetEase(current) {
    this.startZoom.scale = this.currentZoom.scale
    this.easeStartFourierData = current.map((d) => ({ ...d }));
    this.easeAmt = 0;
    this.finishedEasing = false;
  }

  /**
   * 
   */
  #findArm() {
    if (this.followIndex < 0 || this.followIndex == null) {
      const canvasWidth = this.rightCanvasController.canvas.width;
      const canvasHeight = this.rightCanvasController.canvas.height;
      this.targetZoom.xCenter = canvasWidth / 2;
      this.targetZoom.yCenter = canvasHeight / 2;
      return;
    }

    let { x, y } = this.#getPoint(this.currentFourierData, this.animAmt, this.followIndex);
    this.targetZoom.xCenter = x;
    this.targetZoom.yCenter = y;
  }

  /**
   * Draw the current data to the canvas
   */
  #renderCanvas(canvas, zoomInfo = null) {
    if (zoomInfo != null) {
      canvas.zoom = zoomInfo
    }
    const filtered = this.renderSteps.filter((step) => step.canvas === canvas.id);
    const currentZoom = this.currentZoom;
    const currentZoomXCenter = currentZoom.xCenter;
    const currentZoomYCenter = currentZoom.yCenter;
    const currentZoomScale = currentZoom.scale;

    filtered.forEach((step) => {
      if (step.dataType === "box") {
        step.boxCoords = this.#boxFromZoomPoint(canvas, currentZoomScale, currentZoomXCenter, currentZoomYCenter);
        if (currentZoomScale > 1) step.style.alpha = Math.round(Math.min(currentZoomScale - 1, 1) * 100);
      } else if (step.dataType === "path") {
        step.data = step.source === "source" ? this.sourceFourierPath : this.currentFourierPath;
      } else if (step.dataType === "fourier") {
        step.data = step.source === "source" ? this.sourceFourierData : this.currentFourierData;
      }
    });
    canvas.drawFrame(this.animAmt, filtered);
  }

  /**
   * Causes the call to draw to both canvases
   */
  #render() {
    if (this.isTransitioning) {
      this.#onResize()
    }
    this.#renderCanvas(this.leftCanvasController, this.currentZoom)
    this.#renderCanvas(this.rightCanvasController)
  }

  /**
   * Resize canvases to fit new context
   */
  #onResize() {
    this.leftCanvasController.onResize()
    this.rightCanvasController.onResize()
  }
}
