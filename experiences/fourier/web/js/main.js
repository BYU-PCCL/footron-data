import "./message-handler.js";
import * as fourierData from "./fourier-data/index.js"
import EpicyclesController from "./epicycles-controller.js";
import { palette } from "./color.js";
import Slideshow from "./slideshow.js";
import { slides } from "./slides.js"
import { bounce, inOutExpo, isAprilFools, sinEaseInOut } from "./util.js";


// Config variables
const DISPLAY_ATTRIBUTION_SECONDS = 5
const DEFAULT_SLIDE_DURATION = 7
const AUTO_START_SHOW_IN = 15 // How many seconds to wait before starting the slideshow on load
const CONTINUE_SHOW_AFTER = 40 // After input has stopped, how long to wait before starting again.
const MAX_NUM_PATH_POINTS = 2048;
const MIN_NUM_PATH_POINTS = 1024;
const PERIOD = 120; // Time for a default full cycle. Note: Can be slowed or sped up by setPeriod()
const ZOOM_EASE_TIME = 5; // How long a zoom takes
const MIN_RENDER_AMPLITUDE = 0.01;
const EASE_TIME = 3; // how many seconds to chase an update
const EASE_FUNCTION = sinEaseInOut; // There are a couple of these in utils.js
const ZOOM_EASE_FUNCTION = inOutExpo;
const FILL_AMOUNT = 0.75 // How much of the canvas the path can take up (at default zoom)
const GOAL_FRAME_RATE = 0.05
const MINIMAL_CHUNK = 256;
// Render styles
const LEFT_PATH_STYLE = { color: palette.white, alpha: 1, lineWidth: 4 }
const LEFT_CIRCLES_STYLE = { color: palette.cyan, alpha: 0.5 }
const LEFT_RADIUS_STYLE = { color: palette.white, alpha: 1, lineWidth: 2.5 }
const LEFT_HIGHLIGHT_STYLE = { color: palette.pink, alpha: 1 }
const RIGHT_PATH_STYLE = { color: palette.white, alpha: 1, lineWidth: 4 }
const RIGHT_CIRCLES_STYLE = { color: palette.cyan, alpha: 0.5 }
const RIGHT_RADIUS_STYLE = { color: palette.white, alpha: 0.8, lineWidth: 2.5 }
const RIGHT_HIGHLIGHT_STYLE = { color: palette.white, alpha: 1, lineWidth: 4 }
const RIGHT_ZOOM_BOX_STYLE = { color: palette.fadableOrange, alpha: 1, lineWidth: 2.5 }


const SHOW = new Slideshow("slideDisplay", slides, DEFAULT_SLIDE_DURATION, CONTINUE_SHOW_AFTER, AUTO_START_SHOW_IN);
const RENDER_STEPS = [
    { canvas: "leftCanvas", type: "clear" },
    {
        canvas: "leftCanvas",
        dataType: "path",
        type: "path",
        source: "current",
        style: LEFT_PATH_STYLE,
    },
    {
        canvas: "leftCanvas",
        dataType: "fourier",
        type: "circles",
        source: "current",
        circleStyle: LEFT_CIRCLES_STYLE,
        lineStyle: LEFT_RADIUS_STYLE,
        highlightStyle: LEFT_HIGHLIGHT_STYLE,
        highlightIndex: null,
    },
    { canvas: "rightCanvas", type: "clear" },
    {
        canvas: "rightCanvas",
        dataType: "path",
        type: "path",
        source: "source",
        style: RIGHT_PATH_STYLE,
    },
    {
        canvas: "rightCanvas",
        dataType: "fourier",
        type: "circles",
        source: "source",
        circleStyle: RIGHT_CIRCLES_STYLE,
        lineStyle: RIGHT_RADIUS_STYLE,
        highlightStyle: RIGHT_HIGHLIGHT_STYLE,
        highlightIndex: null,
    },
    {
        canvas: "rightCanvas",
        dataType: "box",
        type: "box",
        style: RIGHT_ZOOM_BOX_STYLE
    }
]
const DATA = {
    "Line": fourierData.lineData,
    "Triangle": fourierData.triangleData,
    "Square": fourierData.squareData,
    "Sailor": fourierData.sailorData,
    "Moore curve": fourierData.mooreData5,
    "Y logo": fourierData.yLogoData,
    "Peace": fourierData.peaceData,
    "Fourier": fourierData.fourierData,
    "Fouriest": fourierData.fouriestData,
    "Pentagon": fourierData.pentagonData,
    "Hexagon": fourierData.hexagonData,
    "Po": fourierData.poData,
    "Rick": fourierData.rickData,
    "Infinity": fourierData.infinityData
}
const ATTRIBUTIONS = {
    "Peace": "Peace, Jez Swanson",
    "Fourier": "Joseph Fourier by Stewart@Biocinematics",
    "Fouriest": "Font: Clement Numbers",
    "Rick": "Never gonna give you up!",
    "Sailor": "BYU Sailor Logo"
}
const ATTRIBUTION_ELEMENT = document.getElementById("attribution")
const ATTRIBUTION_TIMEOUTS = []
const CONTROLLER = new EpicyclesController(
    "standardCanvas", RENDER_STEPS, MAX_NUM_PATH_POINTS, MIN_NUM_PATH_POINTS,
    PERIOD, EASE_TIME, ZOOM_EASE_TIME, EASE_FUNCTION, ZOOM_EASE_FUNCTION, 
    MIN_RENDER_AMPLITUDE, FILL_AMOUNT, GOAL_FRAME_RATE, MINIMAL_CHUNK);

let goodRandomChoiceNames = ["Sailor", "Triangle", "Y logo", "Peace", "Po", "Hexagon", "Fourier", "Fouriest", "Infinity"]
if (isAprilFools()) goodRandomChoiceNames = ["Rick", "Fourier", "Fouriest", "Y logo"];

function init(drawSteps) {
    initializeOdometer();
    // To let me play around with things in the console.
    window.controller = CONTROLLER;
    setImage(null, true);
    CONTROLLER.start();
}

function attribution(text) {
    if (ATTRIBUTION_ELEMENT.innerText == text) return
    while (ATTRIBUTION_TIMEOUTS.length > 0) {
        window.clearTimeout(ATTRIBUTION_TIMEOUTS.pop())
    }
    if (ATTRIBUTION_ELEMENT.className != "hidden") {
        console.log("Hiding attribution")
        ATTRIBUTION_ELEMENT.className = "hidden"
        ATTRIBUTION_TIMEOUTS.push(setTimeout(() => {
            console.log("Showing attribution")
            ATTRIBUTION_ELEMENT.innerText = text;
            ATTRIBUTION_ELEMENT.className = ""
        }, 1000))
    } else {
        console.log("Showing attribution")
        ATTRIBUTION_ELEMENT.innerText = text;
        ATTRIBUTION_ELEMENT.className = ""
    }
    ATTRIBUTION_TIMEOUTS.push(setTimeout(() => {
        console.log("Hiding attribution")
        ATTRIBUTION_ELEMENT.innerText = text;
        ATTRIBUTION_ELEMENT.className = "hidden"
    }, DISPLAY_ATTRIBUTION_SECONDS * 1000))
}

function initializeOdometer() {
    console.log("initializing")
    window.odometerOptions = {
        auto: false, // Don't automatically initialize everything with class 'odometer'
        format: '(dddd)', // Change how digit groups are formatted, and how many digits are shown after the decimal point
        duration: 1000, // Change how long the javascript expects the CSS animation to take
    };
    console.log(odometerOptions)
}

// control methods that message-handler calls
export function setImage(image, fromZero = false, transition = true) {
    if (Object.keys(DATA).includes(image)) {
        console.log("setting image: ", image)
    } else {
        console.log("Unknown image: " + image)
        const choices = goodRandomChoiceNames.filter((choice) => choice != CONTROLLER.imageName)
        image = choices[Math.floor(Math.random() * choices.length)]
        console.log(`Using random image '${image}' instead`)
    }

    const imageData = DATA[image]
    CONTROLLER.setSource(imageData, fromZero, transition, image)

    CONTROLLER.rightCanvasController.setText(CONTROLLER.sourceFourierData.length);
    CONTROLLER.leftCanvasController.setText(CONTROLLER.currentNumFourierTerms);

    if (ATTRIBUTIONS[image]) {
        attribution(ATTRIBUTIONS[image])
    } else attribution(image);
    return CONTROLLER.maxTerms()
}

export function query() {
    CONTROLLER.query();
}

export function maxTerm() {
    return CONTROLLER.maxTerms();
}

export function termInfo() {
    console.log("Sending" + CONTROLLER.currentNumFourierTerms)
    return {
        maxNumTerms: CONTROLLER.maxTerms(),
        currentNumTerms: CONTROLLER.currentNumFourierTerms
    }
}

export function queryTerm(term) {
    return { ...CONTROLLER.currentFourierData[term], maxTerm: CONTROLLER.sourceFourierData.length, queryTermResult: true };
}

export function editTerm(term, phase, amplitude) {
    CONTROLLER.setEpicycle(term, phase, amplitude);
}

export function resetTerm(term) {
    CONTROLLER.resetEpicycle(term);
}

export function resetAllTerms() {
    CONTROLLER.resetEpicycles();
}

export function setPeriod(seconds) {
    CONTROLLER.setPeriod(seconds);
}

export function setFourierAmt(amount) {
    CONTROLLER.setFourierAmt(amount);
    CONTROLLER.leftCanvasController.setText(CONTROLLER.currentNumFourierTerms)
}

export function changeFourierAmt(amount) {
    CONTROLLER.changeFourierAmt(amount);
    CONTROLLER.leftCanvasController.setText(CONTROLLER.currentNumFourierTerms)
}

export function setTerm(index, amplitude, phase) {
    CONTROLLER.setEpicycle(index, phase, amplitude);
}

export function setZoom(zoom, x = 0, y = 0) {
    CONTROLLER.setZoom(zoom);
}

export function resetZoom() {
    CONTROLLER.setZoom(1);
    setFollowIndex(null);
    fullscreen("left")
}

export function setFollowIndex(index) {
    CONTROLLER.setFollowIndex(index)
}

export function toggleFollow() {
    if (null === CONTROLLER.followIndex) {
        let followIndex = 65
        while (CONTROLLER.targetFourierData[followIndex].amplitude > 1) {
            followIndex++
        }
        setFollowIndex(followIndex)
    } else setFollowIndex(null)
}

export function toggleOriginal() {
    if (CONTROLLER.fullscreen == "left") fullscreen("both");
    else fullscreen("left");
}

export function fullscreen(fullscreenTarget) {
    CONTROLLER.setFullscreen(fullscreenTarget)
}

export function startShow() {
    x = null
    a = x.prop == 5
    SHOW.startShow()
}

export function stopShow() {
    SHOW.stopShow()
}

export function toggleBounceMode() {
    if (CONTROLLER.easeFunction == bounce) {
        CONTROLLER.setEaseFunction(EASE_FUNCTION)
    } else {
        CONTROLLER.setEaseFunction(bounce)
    }
}


init(RENDER_STEPS);