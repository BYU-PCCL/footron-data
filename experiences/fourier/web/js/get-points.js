// Pulls the path elementS in the page and then, in the console, calculates and 
// prints both the x, y data, as well as the fourier series.
import { getFourierData, resample2dData, scaleAndShift2dData } from "./just-fourier-things.js";

// Config parameters
const BOUNDING_WIDTH = 1024; // Size of the canvas in pixels this will be displayed on (The wall is 2736 x 1216)
const BOUNDING_HEIGHT = 1024;
const FILL_PROPORTION = 0.9; // Max proportion of the canvas the shape will fill in either dimension
const NUM_PATH_SAMPLES = 4096; // These will be *evenly* spaced along the length of the path
const NUM_FOURIER_SERIES_TERMS = 2048;


const paths = document.getElementsByTagName("path");

if (paths) {
  console.log(`${paths.length} path elements found.`);
  for (let path of paths) {
    calculatePath(path);
  }
} else {
  console.log("No path element found in page.");
}

function calculatePath(path) {
  let length = path.getTotalLength();
  let points = [];

  for (let i = 0; i < NUM_PATH_SAMPLES; i++) {
    let point = path.getPointAtLength((length * i) / NUM_PATH_SAMPLES);
    points.push({ x: point.x, y: point.y });
  }
  let scaledAndCentered = scaleAndShift2dData(points, BOUNDING_WIDTH, BOUNDING_HEIGHT, FILL_PROPORTION);
  let fourierData = resample2dData(
    scaledAndCentered.data,
    1 << (31 - Math.clz32(scaledAndCentered.data.length)) // next power of 2: 5 -> 4, 16 -> 16
  );
  fourierData = getFourierData(fourierData);
  fourierData = fourierData.slice(0, NUM_FOURIER_SERIES_TERMS);

  console.log(fourierData.length + " terms calculated from " + points.length + " points");
  console.log({ path: scaledAndCentered.data, fourierSeries: fourierData });
}
