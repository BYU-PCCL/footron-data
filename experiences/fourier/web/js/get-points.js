// Pulls the first path element in the page and prints out an array of evenly spaced {x: number, y: number} coordinates in the console

let path = document.getElementsByTagName("path")[0];
let length = path.getTotalLength();
let numPoints = 4096;
let points = [];
for (let i = 0; i < numPoints; i++) {
  let point = path.getPointAtLength((length * i) / numPoints);
  points.push(point);
  // s += '' + point.x + ',' + point.y + '\n'
}

// Turn into a string of things
let s = points.reduce(
  (s, point) => s + "{x:" + point.x + ",y:" + point.y + "},\n",
  ""
);
console.log(s);
