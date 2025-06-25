// import FFT from "./fft.js";
// import { slurp } from "./util.js";

// /**
//  * Do the fourier thing using a bunch of complex points
//  *
//  * @param {Array<Number>} points Array of points, alternative with re, im pairs. Length must be a power of 2
//  */
// export function getFourierData(points) {
//   if (points.length == 0) {
//     return [];
//   }
//   const numPoints = points.length / 2;
//   const fft = new FFT(numPoints);

//   const out = fft.createComplexArray();
//   fft.transform(out, points);

//   // Transform into an API of points I find friendlier.
//   const fftData = [];
//   for (let i = 0; i < numPoints; i++) {
//     // to reorder the frequencies a little nicer, we pick from the front and back altermatively
//     const j = i % 2 == 0 ? i / 2 : numPoints - (i + 1) / 2;
//     const x = out[2 * j];
//     const y = out[2 * j + 1];
//     const freq = ((j + numPoints / 2) % numPoints) - numPoints / 2;
//     fftData.push({
//       freq: freq,
//       // a little expensive
//       amplitude: Math.sqrt(x * x + y * y) / numPoints,
//       // a lottle expensive :(
//       phase: Math.atan2(y, x),
//     });
//   }
//   // fftData.sort((a, b) => b.amplitude - a.amplitude);
//   return fftData;
// }

// /**
//  *
//  * @param {Array<Number>} points Array of values of some wave. Must be a power of 2.
//  */
// export function getRealFourierData(points) {
//   if (points.length == 0) {
//     return [];
//   }
//   const numPoints = points.length;
//   const fft = new FFT(numPoints);

//   const formatedPoints = fft.createComplexArray();
//   fft.toComplexArray(points, formatedPoints);

//   const out = fft.createComplexArray();
//   fft.transform(out, formatedPoints);

//   // Transform into an API of points I find friendlier.
//   const fftData = [];
//   // We only have to read the first half of this because of symmetry things.
//   for (let i = 0; i < numPoints / 2; i++) {
//     const x = out[2 * i];
//     const y = out[2 * i + 1];
//     const freq = i;
//     fftData.push({
//       freq: freq,
//       // a little expensive
//       // Also we gotta multiply this by 2 to account for the other side that
//       amplitude: (2 * Math.sqrt(x * x + y * y)) / numPoints,
//       // a lottle expensive :(
//       phase: Math.atan2(y, x),
//     });
//   }
//   // fftData.sort((a, b) => b.amplitude - a.amplitude);
//   return fftData;
// }

// export function scaleAndShift2dData(
//   points,
//   canvasWidth = 100,
//   canvasHeight = 100,
//   scalePercent = 0.8
// ) {
//   // scale and center points to canvas size
//   // find the bounding box of the points
//   let minX = points[0].x;
//   let minY = points[0].y;
//   let maxX = points[0].x;
//   let maxY = points[0].y;
//   for (let i = 1; i < points.length; i += 1) {
//     minX = Math.min(minX, points[i].x);
//     maxX = Math.max(maxX, points[i].x);
//     minY = Math.min(minY, points[i].y);
//     maxY = Math.max(maxY, points[i].y);
//   }

//   let startBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

//   let scale = Math.min(
//     (canvasWidth * scalePercent) / (maxX - minX),
//     (canvasHeight * scalePercent) / (maxY - minY)
//   );
//   for (let i = 0; i < points.length; i += 1) {
//     points[i].x *= scale;
//     points[i].y *= scale;
//   }
//   minX *= scale;
//   minY *= scale;
//   maxX *= scale;
//   maxY *= scale;

//   // shift points to be centered
//   const xShift = canvasWidth / 2 - (maxX + minX) / 2;
//   const yShift = canvasHeight / 2 - (maxY + minY) / 2;
//   for (let i = 0; i < points.length; i += 1) {
//     points[i].x += xShift;
//     points[i].y += yShift;
//   }
//   minX += xShift;
//   maxX += xShift;
//   minY += yShift;
//   maxY += yShift;

//   let endBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

//   return { data: points, boxCoords: endBox, startBoxCoords: startBox };
// }

// /**
//  * Transforms a list of x, y points into input appropriate for a fourier transform.
//  */
// export function resample2dData(points, numSamples) {
//   if (points.length == 0) {
//     // Can't resample if we don't have ANY points
//     console.error("No points to resample")
//     return [];
//   }
//   let newPoints = [];
//   for (let i = 0; i < numSamples; i++) {
//     let position = points.length * (i / numSamples);
//     let index = Math.floor(position);
//     let nextIndex = (index + 1) % points.length;
//     let amt = position - index;
//     newPoints.push(
//       /* x */ slurp(points[index].x, points[nextIndex].x, amt),
//       /* y */ slurp(points[index].y, points[nextIndex].y, amt)
//     );
//   }
//   return newPoints;
// }
