import WilsonMaze from "./algorithms/wilson.js"
import TraversalMaze from "./algorithms/random-traversal.js"
import BacktrackerMaze from "./algorithms/recursive-backtracker.js"
import PrimMaze from "./algorithms/prim.js"

import { drawBorderedMaze, drawUnborderedMaze } from "./drawing.js"

import { config } from "./config.js"

let mazeConstructors = {
  backtracker: BacktrackerMaze,
  prim: PrimMaze,
  traversal: TraversalMaze,
  wilson: WilsonMaze
}

let defaultMazes = ["backtracker", "prim", "traversal"]

let mazeObjects = {
  large: {
    maze: null,
    canvas: null,
    ctx: null,
    imageData: null
  },
  backtracker: {
    maze: null,
    canvas: null,
    ctx: null,
    imageData: null
  },
  prim: {
    maze: null,
    canvas: null,
    ctx: null,
    imageData: null
  },
  traversal: {
    maze: null,
    canvas: null,
    ctx: null,
    imageData: null
  }
}

var animationFrameToCancel

// Waiting to receive the OffScreenCanvas
self.onmessage = (event) => {
  if (event.data.type === "init") {
    let canvases = event.data.canvases

    for (const canvas in canvases) {
      mazeObjects[canvas].canvas = canvases[canvas]
      mazeObjects[canvas].ctx = canvases[canvas].getContext("2d")
    }

    for (const key in event.data.config) {
      config[key] = event.data.config[key]
    }

    setupAndBegin()
  } else if (event.data.type === "config") {
    for (const key in event.data.config) {
      config[key] = event.data.config[key]
    }

    console.log(config)

    setupAndBegin()
  } else if (event.data.type === "resize") {
    for (const canvas in event.data.sizes) {
      mazeObjects[canvas].canvas.width = event.data.sizes[canvas].width
      mazeObjects[canvas].canvas.height = event.data.sizes[canvas].height
    }

    adjustImageSmoothing()

    if (!animationFrameToCancel) drawMazes() // otherwise maze canvases will be blank
  }
}

function setupAndBegin() {
  if (animationFrameToCancel) cancelAnimationFrame(animationFrameToCancel)

  createMazes()
  startMazeGeneration()

  adjustImageSmoothing()

  requestAnimationFrame(start)
}

function adjustImageSmoothing() {
  for (const canvas in mazeObjects) {
    let imageDataSize =
      config.cells > 100 ? config.cells + 2 : config.cells * (6 + 2) + 2

    // this only has to be in the resize function, since it's called at the beginning
    mazeObjects[canvas].ctx.imageSmoothingEnabled =
      mazeObjects[canvas].canvas.height < imageDataSize ? true : false
  }
}

function createMazes() {
  let imageDataSize =
    config.cells > 100 ? config.cells + 2 : config.cells * (6 + 2) + 2

  let showBorders = config.cells <= 100 ? true : false

  if (config.focusMaze) {
    let mazeConstructor = mazeConstructors[config.focusMaze]

    mazeObjects.large.maze = new mazeConstructor(config.cells, showBorders)

    mazeObjects.large.maze.onComplete(({ solution }) =>
      postSolutionMessage("large", solution.length)
    )

    mazeObjects.large.imageData = mazeObjects.large.ctx.createImageData(
      imageDataSize,
      imageDataSize
    )

    let buffer = mazeObjects.large.imageData.data

    for (var i = 0; i < buffer.length; i += 4) {
      buffer[i] = 255 // red
      buffer[i + 1] = 255 // green
      buffer[i + 2] = 255 // blue
      buffer[i + 3] = 255 // alpha
    }
  } else {
    for (const maze of defaultMazes) {
      mazeObjects[maze].maze = new mazeConstructors[maze](
        config.cells,
        showBorders
      )
      mazeObjects[maze].maze.onComplete(({ solution }) =>
        postSolutionMessage(maze, solution.length)
      )

      mazeObjects[maze].imageData = mazeObjects[maze].ctx.createImageData(
        imageDataSize,
        imageDataSize
      )

      let buffer = mazeObjects[maze].imageData.data

      for (var i = 0; i < buffer.length; i += 4) {
        buffer[i] = 255 // red
        buffer[i + 1] = 255 // green
        buffer[i + 2] = 255 // blue
        buffer[i + 3] = 255 // alpha
      }
    }
  }
}

function startMazeGeneration() {
  if (config.focusMaze) {
    mazeObjects.large.maze.generate()
  } else {
    for (const maze of defaultMazes) {
      mazeObjects[maze].maze.generate()
    }
  }
}

function drawMaze(mazeObject) {
  if (config.cells > 100) {
    drawUnborderedMaze(mazeObject, config.cells)
  } else {
    drawBorderedMaze(mazeObject, config.cells)
  }
}

function drawMazes() {
  // draws correct mazes, then returns true if all mazes are completed
  let completed = null

  if (config.focusMaze) {
    completed = mazeObjects.large.maze.completed
    drawMaze(mazeObjects.large)
  } else {
    for (const maze of defaultMazes) {
      if (completed !== false) completed = mazeObjects[maze].maze.completed // if any maze is not completed, completed will be false
      drawMaze(mazeObjects[maze])
    }
  }

  return completed
}

var filterStrength = 20
var frameTime = 0,
  lastLoop = new Date(),
  thisLoop

function start() {
  var thisFrameTime = (thisLoop = new Date()) - lastLoop
  frameTime += (thisFrameTime - frameTime) / filterStrength
  lastLoop = thisLoop

  let completed = drawMazes()

  if (!completed) {
    console.log((1000 / frameTime).toFixed(0) + "fps")

    animationFrameToCancel = requestAnimationFrame(start)
  } else {
    animationFrameToCancel = null
    console.log("completed!!!")
  }
}

function postSolutionMessage(maze, length) {
  self.postMessage({
    type: "solution",
    maze: maze,
    solutionLength: length
  })
}