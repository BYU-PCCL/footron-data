// import EpicyclesController from "./epicycles-controller.js";
import { fouriestData } from "./fourier-data/fouriest.js";
import { peaceData } from "./fourier-data/peace.js";
import { sailorData } from "./fourier-data/sailor.js";
import { yLogoData } from "./fourier-data/y-logo.js";
import { triangleData } from "./fourier-data/triangle.js";
import { squareData } from "./fourier-data/square.js";
import { lineData } from "./fourier-data/line.js";
import { poData } from "./fourier-data/po.js";
import { rickData } from "./fourier-data/rick.js";
import { mooreData5 } from "./fourier-data/moore.js";
import { fourierData } from "./fourier-data/fourier.js";
import { pentagonData } from "./fourier-data/pentagon.js";
import { hexagonData } from "./fourier-data/hexagon.js";

import "./message-handler.js";
// import { palette } from "./color.js";
// import Slideshow from "./slideshow.js";
// import { slides } from "./slides.js";
import { isAprilFools } from "./util.js";

// const controller = new EpicyclesController("standardCanvas");
// const show = new Slideshow("slideDisplay", slides, setImage);

const data = {
  "Line": lineData,
  "Triangle": triangleData,
  "Square": squareData,
  "Sailor": sailorData,
  "Moore curve": mooreData5,
  "Y logo": yLogoData,
  "Peace": peaceData,
  "Fourier": fourierData,
  "Fouriest": fouriestData,
  "Pentagon": pentagonData,
  "Hexagon": hexagonData,
  "Po": poData,
  "Rick": rickData,
}
// const ATTRIBUTION_ELEMENT = document.getElementById("attribution")

let randomChoices = [
  sailorData, mooreData5, triangleData, yLogoData, peaceData, poData
]
if (isAprilFools()) randomChoices.push(rickData);

// function init() {
//   initializeOdometer();
//   // Initialize fourier controller
//   controller.drawSteps.push(
//     { canvas: "leftCanvas", type: "clear" },
//     {
//       canvas: "leftCanvas",
//       dataType: "path",
//       type: "path",
//       source: "current",
//       style: { color: palette.white, alpha: 1, lineWidth: 4 },
//     },
//     {
//       canvas: "leftCanvas",
//       dataType: "fourier",
//       type: "circles",
//       source: "current",
//       circleStyle: { color: palette.cyan, alpha: 0.5 },
//       lineStyle: { color: palette.white, alpha: 1, lineWidth: 2.5 },
//       highlightStyle: { color: palette.black, alpha: 1 },
//       highlightIndex: null,
//     }
//   );
//   controller.drawSteps.push(
//     { canvas: "rightCanvas", type: "clear" },
//     {
//       canvas: "rightCanvas",
//       dataType: "path",
//       type: "path",
//       source: "source",
//       style: { color: palette.white, alpha: 1, lineWidth: 4 },
//     },
//     {
//       canvas: "rightCanvas",
//       dataType: "fourier",
//       type: "circles",
//       source: "source",
//       circleStyle: { color: palette.cyan, alpha: 0.5 },
//       lineStyle: { color: palette.white, alpha: 1, lineWidth: 2.5 },
//       highlightStyle: { color: palette.black, alpha: 1 },
//       highlightIndex: null,
//     },
//     {
//       canvas: "rightCanvas",
//       dataType: "box",
//       type: "box",
//       style: { color: palette.fadableOrange, alpha: 1, lineWidth: 2.5 }
//     }
//   );


//   // To let me play around with things in the console.
//   window.controller = controller;
//   setImage(null, true);

//   controller.start();
//   // show.startShow()
// }

// // control methods
// function attribution(text) {
//   ATTRIBUTION_ELEMENT.className = "hidden"
//   console.log("hidding")
//   setTimeout(() => {
//     console.log("Showing")
//     ATTRIBUTION_ELEMENT.innerText = text;
//     ATTRIBUTION_ELEMENT.className = ""
//   }, 1000)
// }

// export function setImage(image, fromZero = false, transition = false) {
//   let imageData;
//   if (Object.keys(data).includes(image)) {
//     console.log("setting image: ", image)
//     imageData = data[image]
//   } else {
//     console.log("choosing random image")
//     imageData = randomChoices[Math.floor(Math.random() * randomChoices.length)]
//   }
//   controller.setSource(imageData, fromZero, transition)
//   controller.rightCanvasController.setText(controller.sourceFourierData.length);
//   controller.leftCanvasController.setText(controller.currentNumFourierTerms);
//   if (imageData === fourierData) {
//     attribution("Joseph Fourier Portrait by Stewart@Biocinematics")
//   } else attribution(image);
//   return controller.totalNumFourierTerms
// }

// export function setImageFromPoints() {
//   return
//   // controller.setPathFromPoints(trianglePoints)
// }

// export function query() {
//   controller.query();
// }

// export function maxTerm() {
//   return controller.totalNumFourierTerms;
// }

// export function termInfo() {
//   console.log("Sending" + controller.currentNumFourierTerms)
//   return {
//     maxNumTerms: controller.totalNumFourierTerms,
//     currentNumTerms: controller.currentNumFourierTerms
//   }
// }

// export function queryTerm(term) {
//   return { ...controller.currentFourierData[term], maxTerm: controller.totalNumFourierTerms, queryTermResult: true };
// }

// export function editTerm(term, phase, amplitude) {
//   controller.setEpicycle(term, phase, amplitude);
// }

// export function setPeriod(seconds) {
//   controller.setPeriod(seconds);
// }

// export function setFourierAmt(amount) {
//   controller.setFourierAmt(amount);
//   controller.leftCanvasController.setText(controller.currentNumFourierTerms)
// }

// export function changeFourierAmt(amount) {
//   controller.changeFourierAmt(amount);
//   controller.leftCanvasController.setText(controller.currentNumFourierTerms)
// }

// export function setTerm(index, amplitude, phase) {
//   controller.setEpicycle(index, phase, amplitude);
// }

// export function setZoom(zoom, x = 0, y = 0) {
//   controller.setZoom(zoom);
// }

// export function resetZoom() {
//   controller.setZoom(1);
//   setFollowIndex(null);
//   fullscreen("left")
// }

// export function setFollowIndex(index) {
//   controller.setFollowIndex(index)
// }

// export function toggleFollow() {
//   if (null === controller.followIndex) {
//     let followIndex = 65
//     while (controller.targetFourierData[followIndex].amplitude > 1) {
//       followIndex++
//     }
//     setFollowIndex(followIndex)
//   } else setFollowIndex(null)
// }

// export function toggleOriginal() {
//   if (controller.fullscreen == "left") fullscreen("both");
//   else fullscreen("left");
// }

// export function fullscreen(fullscreenTarget) {
//   controller.setFullscreen(fullscreenTarget)
// }

// export function startShow() {
//   return
// }

// export function stopShow() {
//   return
// }

function initializeOdometer() {
  console.log("initializing")
  window.odometerOptions = {
    auto: false, // Don't automatically initialize everything with class 'odometer'
    format: '(dddd)', // Change how digit groups are formatted, and how many digits are shown after the decimal point
    duration: 1000, // Change how long the javascript expects the CSS animation to take
  };
  console.log(odometerOptions)
}

// init();