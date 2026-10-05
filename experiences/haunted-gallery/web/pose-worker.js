/**
 * The pose worker: MediaPipe Pose Landmarker, off the page's thread.
 *
 * Hand-written plain JavaScript, a CLASSIC worker, and it lives in public/ on
 * purpose: the same bytes run in dev and on the wall, with no bundler between
 * them and nothing newer than ES2017 for Chromium 93 to choke on. The runtime
 * (`vision_bundle.js`, an IIFE that defines a global `Vision`) and the model are
 * vendored beside it by scripts/vendor-mediapipe.mjs; every URL here is
 * relative to this file, so the experience works from whatever folder the wall
 * serves it out of.
 *
 * Protocol (src/input/camera.ts is the other end):
 *
 *   in   {type:"init", delegates:["GPU","CPU"], numPoses, minDetection, minPresence}
 *   out  {type:"ready", delegate}  |  {type:"error", fatal:true, message}
 *
 *   in   {type:"frame", id, bitmap, single}   bitmap is an ImageBitmap, transferred in;
 *        `single` asks for the one-person landmarker (see below)
 *   out  {type:"result", id, ms, poses}
 *        poses: one Float32Array(99) per person, x, y, visibility for each of the
 *        33 landmarks, x and y normalised to the bitmap, buffers transferred out
 *   out  {type:"error", id, fatal:false, message}   when one frame throws
 *
 *   in   {type:"close"}
 *
 * Two landmarkers, because the model's cost is ~35 ms for the detector plus
 * ~25 ms for every person it reports, and the number it may report is fixed
 * when the graph is built: `one` reports at most two people (the one the crop
 * is aimed at, and the neighbour who is sometimes the more obvious of the pair)
 * and is used for the crop round somebody already tracked, `many` reports up to `numPoses` and is
 * used to scan. Following one person with the scanning graph in a busy
 * corridor would spend most of each inference on bystanders.
 *
 * The bitmap is closed in a `finally`, so a frame that throws still frees its
 * pixels. Frames never leave this worker except as landmark numbers.
 */
"use strict";

importScripts("mediapipe/vision_bundle.js");

var one = null;
var many = null;

function describe(err) {
  return String((err && err.message) || err);
}

async function init(msg) {
  var wasmRoot = new URL("mediapipe/wasm", self.location.href).href;
  var modelUrl = new URL("mediapipe/pose_landmarker_lite.task", self.location.href).href;
  var fileset = await Vision.FilesetResolver.forVisionTasks(wasmRoot);
  var delegates = msg.delegates && msg.delegates.length ? msg.delegates : ["GPU", "CPU"];
  var lastErr = null;
  function make(delegate, numPoses) {
    return Vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: modelUrl, delegate: delegate },
      runningMode: "IMAGE",
      numPoses: numPoses,
      minPoseDetectionConfidence: msg.minDetection == null ? 0.5 : msg.minDetection,
      minPosePresenceConfidence: msg.minPresence == null ? 0.5 : msg.minPresence,
      outputSegmentationMasks: false,
    });
  }
  for (var i = 0; i < delegates.length; i++) {
    try {
      many = await make(delegates[i], msg.numPoses || 3);
      one = await make(delegates[i], 2);
      warm(many);
      warm(one);
      self.postMessage({ type: "ready", delegate: delegates[i] });
      return;
    } catch (err) {
      lastErr = err;
      if (many) many.close();
      many = null;
      one = null;
    }
  }
  throw lastErr || new Error("no delegate could start");
}

/**
 * The first inference of a landmarker compiles its shaders, and in Chromium 93
 * with the gallery drawing beside it that took 5-7 s each, measured - long
 * enough to look like a dead worker to the page. Spend it here, on a blank
 * picture, before saying "ready"; the page allows a minute for that.
 */
function warm(landmarker) {
  try {
    landmarker.detect(new ImageData(256, 256));
  } catch (err) {
    // A blank frame that cannot be read is not a reason to refuse real ones.
  }
}

function frame(msg) {
  var bitmap = msg.bitmap;
  try {
    var landmarker = msg.single ? one : many;
    if (!landmarker) throw new Error("pose worker not initialised");
    var t0 = performance.now();
    var result = landmarker.detect(bitmap);
    var ms = performance.now() - t0;
    var poses = [];
    var buffers = [];
    var lms = (result && result.landmarks) || [];
    for (var p = 0; p < lms.length; p++) {
      var a = new Float32Array(99);
      for (var k = 0; k < 33; k++) {
        var l = lms[p][k];
        a[k * 3] = l ? l.x : 0;
        a[k * 3 + 1] = l ? l.y : 0;
        a[k * 3 + 2] = l && l.visibility !== undefined ? l.visibility : 0;
      }
      poses.push(a);
      buffers.push(a.buffer);
    }
    self.postMessage({ type: "result", id: msg.id, ms: ms, poses: poses }, buffers);
  } catch (err) {
    self.postMessage({ type: "error", id: msg.id, fatal: false, message: describe(err) });
  } finally {
    if (bitmap && bitmap.close) bitmap.close();
  }
}

self.onmessage = function (ev) {
  var msg = ev.data;
  if (msg.type === "init") {
    init(msg).catch(function (err) {
      self.postMessage({ type: "error", fatal: true, message: describe(err) });
    });
  } else if (msg.type === "frame") {
    frame(msg);
  } else if (msg.type === "close") {
    if (one) one.close();
    if (many) many.close();
    one = null;
    many = null;
  }
};
