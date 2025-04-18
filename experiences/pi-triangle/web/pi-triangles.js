// CONSTANTS

const ONE_THIRD = 1 / 3
const TWO_THIRDS = 2 / 3

let getSmallerDimension = () =>
  window.innerWidth < window.innerHeight
    ? window.innerWidth
    : window.innerHeight

let getRad = () => getSmallerDimension() / 3

let RAD = getRad()

const WHITE = "#FFFAFB"
const RED = "#FB3640"
const GREEN = "#82D173"
const SHAPE_BACKGROUND = "#848586"

let LARGE_TEXT
let SMALL_TEXT

const PI_DIGITS = 15 // as far as it will go accurately

const MAX_TRIANGLES = 250000000 // this is enough triangles to calculate PI to 15 digits

const PI_TEXT = Math.PI.toFixed(PI_DIGITS)

function setup() {
  RAD = getRad()
  LARGE_TEXT = getSmallerDimension() / 10
  SMALL_TEXT = getSmallerDimension() / 30

  createCanvas(windowWidth, windowHeight)
}

function windowResized() {
  LARGE_TEXT = getSmallerDimension() / 10
  SMALL_TEXT = getSmallerDimension() / 30

  RAD = getRad()

  resizeCanvas(windowWidth, windowHeight)
}

// CONFIG

let sides = 4
let isAutoplaying = true

function updateSides() {
  if (sides > MAX_TRIANGLES) {
    clearInterval(autoPlayTimeout)

    setTimeout(() => {
      sides = 4
      autoPlayTimeout = setInterval(updateSides, 1000)
    }, 6000)
    // sides = 4
  } else if (sides > 15) {
    sides *= 2
    sides = Math.floor(sides)
  } else {
    sides++
  }
}

let autoPlayTimeout = setInterval(updateSides, 1000)

// DRAW LOOP

function draw() {
  background("#182825")

  // TITLE

  push()
  fill(GREEN)
  textAlign(CENTER, CENTER)
  translate(width * 0.75, 0)
  textSize(LARGE_TEXT * 0.75)
  text("Calculate", 0, 0, width * 0.25, height * 0.1)
  textSize(LARGE_TEXT * 1.5)
  fill(WHITE)
  text("π", 0, 90, width * 0.25, height * 0.15)
  textSize(SMALL_TEXT * 1.25)
  fill(GREEN)
  text("with", 0, 240, width * 0.25, height * 0.1)
  textSize(LARGE_TEXT * 0.75)
  text("Triangles!", 0, 325, width * 0.25, height * 0.1)

  pop()

  // ACTUAL VALUE OF PI

  push()
  translate(width * 0.95, height * 0.5)

  fill(WHITE)
  textSize(SMALL_TEXT)
  textAlign(RIGHT, CENTER)
  textStyle(BOLD)
  text("Actual value of π", 0, 0)
  textStyle(NORMAL)
  text(PI.toFixed(PI_DIGITS)+"...", 0, 50)
  pop()

  // ESTIMATED VALUE OF PI

  push()
  translate(width * 0.95, height * 0.5 + 150)

  fill(WHITE)
  textSize(SMALL_TEXT)
  textAlign(RIGHT, CENTER)
  textStyle(BOLD)
  text("Estimated value of π", 0, 0)
  textStyle(NORMAL)

  let calculatedArea = polygonArea(sides, RAD / RAD).toFixed(PI_DIGITS)

  let textArray = []

  let isMatchingSoFar = true

  for (let i = 0; i < calculatedArea.length; i++) {
    if (calculatedArea[i] === PI_TEXT[i] && isMatchingSoFar) {
      textArray.push([calculatedArea[i], GREEN]) // green
    } else {
      isMatchingSoFar = false
      textArray.push([calculatedArea[i], RED]) // red
    }
  }
  textArray.push( "..." )
  textArray.push( "..." )
  textArray.push( "..." )
  drawText(0, 50, textArray, true)
  pop()

  // POLYGON

  push()
  inscribedPolygon(0, 0, RAD, sides)
  pop()
}

function polygon(x, y, radius, npoints) {
  if (sides < 5000) {
    let angle = TWO_PI / npoints
    beginShape()
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a - PI / 2) * radius
      let sy = y + sin(a - PI / 2) * radius
      vertex(sx, sy)
    }
    endShape(CLOSE)
    strokeWeight(0.5)
    for (let n = 0; n < npoints; n += 1) {
      let angle = (TWO_PI / npoints) * n

      let sx = x + cos(angle - PI / 2) * radius
      let sy = y + sin(angle - PI / 2) * radius
      line(0, 0, sx, sy)
    }
  } else {
    fill(WHITE)
    circle(x, y, radius * 2)
  }
}

function inscribedPolygon(x, y, radius, sides) {
  push()
  translate(width * 0.5, height * 0.5)

  stroke(WHITE)
  fill(SHAPE_BACKGROUND)
  polygon(x, y, radius, sides)
  textAlign(CENTER, CENTER)
  textSize(SMALL_TEXT)
  fill(WHITE)
  text(sides + " triangles", 0, -RAD * 1.25)
  pop()
}

let polygonArea = (n, r) => {
  let res = ((n * r * r) / 2) * Math.sin((2 * Math.PI) / n)
  return res
}

// https://stackoverflow.com/questions/52614829/p5-js-change-text-color-in-for-a-single-word-in-a-sentence

function drawText(x, y, text_array, noCenter) {
  push()
  textAlign(LEFT)

  var pos_x = noCenter
    ? x - totalWidth(text_array)
    : x - totalWidth(text_array) / 2

  for (var i = 0; i < text_array.length; ++i) {
    var part = text_array[i]
    var t = part[0]
    var c = part[1]
    var w = textWidth(t)
    fill(c)
    text(t, pos_x, y)
    pos_x += w
  }

  pop()
}

function totalWidth(text_array) {
  var totalWidth = 0

  for (var i = 0; i < text_array.length; ++i) {
    var part = text_array[i]
    var t = part[0]
    var w = textWidth(t)

    totalWidth += w
  }

  return totalWidth
}
