// Landmark inference, off the main thread.
//
// The simulation renders on the main thread every vsync. Running MediaPipe
// there too means each inference blocks a frame, which is what stuttering
// looks like. In here it runs on its own thread and posts results back.
//
// Frames arrive either as a transferred ReadableStream of VideoFrames (no
// main-thread work at all) or as ImageBitmaps posted one at a time.
//
// This is deliberately a *classic* worker, not a module worker: MediaPipe
// loads its WASM glue with importScripts and reads the factory it defines off
// the global scope, which an ES module scope does not provide. Hence the IIFE
// build of the bundle rather than the .mjs the main thread uses.

importScripts('../vendor/mediapipe/vision_bundle.js');
const { FilesetResolver, PoseLandmarker, HandLandmarker } = Vision;

let landmarker = null;
let backend = 'pose';
let minInterval = 0;        // seconds between inferences, from the fps cap
let lastRun = -Infinity;
let busy = false;
let stop = false;

// Rolling inference cost, plus counters so the HUD can tell "no frames are
// arriving" apart from "inference is slow" — they look identical from the
// main thread otherwise.
let detectMs = 0;
let framesIn = 0;
let inferences = 0;

function post (msg, transfer) { self.postMessage(msg, transfer || []); }

async function init (cfg) {
    const fileset = await FilesetResolver.forVisionTasks(cfg.wasmPath);
    backend = cfg.backend;
    minInterval = cfg.fps > 0 ? 1 / cfg.fps : 0;

    const common = {
        baseOptions: { modelAssetPath: cfg.modelPath, delegate: 'GPU' },
        runningMode: 'VIDEO',
        minTrackingConfidence: cfg.minTrackingConfidence,
    };
    const options = backend === 'pose'
        ? Object.assign(common, {
            numPoses: cfg.numPoses,
            minPoseDetectionConfidence: cfg.minDetectionConfidence,
            minPosePresenceConfidence: cfg.minPresenceConfidence,
            outputSegmentationMasks: false,
        })
        : Object.assign(common, {
            numHands: cfg.numHands,
            minHandDetectionConfidence: cfg.minDetectionConfidence,
            minHandPresenceConfidence: cfg.minPresenceConfidence,
        });

    const Task = backend === 'pose' ? PoseLandmarker : HandLandmarker;
    let delegate = 'GPU';
    try {
        landmarker = await Task.createFromOptions(fileset, options);
    } catch (err) {
        // No usable GPU delegate (remote session, odd driver): CPU still works.
        options.baseOptions.delegate = 'CPU';
        landmarker = await Task.createFromOptions(fileset, options);
        delegate = 'CPU';
    }
    return delegate;
}

// Strip the result down to what the main thread needs. Landmarks come back as
// class instances with more fields than we use; plain objects clone cheaply.
function extract (result) {
    const lists = result.landmarks || [];
    const labels = result.handedness || result.handednesses || [];
    const out = [];
    for (let i = 0; i < lists.length; i++) {
        const lm = lists[i];
        const points = new Array(lm.length);
        for (let j = 0; j < lm.length; j++) {
            const p = lm[j];
            points[j] = { x: p.x, y: p.y, visibility: p.visibility };
        }
        out.push({
            landmarks: points,
            label: labels[i] && labels[i][0] ? labels[i][0].categoryName : '',
        });
    }
    return out;
}

function run (frame, timestampMs, nowSec) {
    if (!landmarker || busy) return false;
    if (nowSec - lastRun < minInterval) return false;
    busy = true;
    lastRun = nowSec;
    const t0 = performance.now();
    try {
        const result = landmarker.detectForVideo(frame, timestampMs);
        // Seed the average with the first sample rather than easing up from
        // zero, or the first readings understate the cost several-fold.
        const took = performance.now() - t0;
        detectMs = detectMs ? detectMs + (took - detectMs) * 0.2 : took;
        inferences++;
        post({ type: 'result', detections: extract(result), timestampMs, detectMs });
        return true;
    } catch (err) {
        post({ type: 'error', message: String(err && err.message || err) });
        return false;
    } finally {
        busy = false;
    }
}

// Pull frames straight off the camera track. Frames that arrive while we are
// still working, or inside the fps cap, are dropped immediately — always
// tracking the newest frame instead of falling behind on a queue.
async function consume (readable) {
    const reader = readable.getReader();
    let ts = 0;
    while (!stop) {
        const { value: frame, done } = await reader.read();
        if (done) break;
        framesIn++;
        const now = performance.now();
        // VideoFrame timestamps are microseconds and can restart; keep our own
        // monotonic clock for MediaPipe.
        ts = Math.max(ts + 1, Math.round(now));
        try { run(frame, ts, now / 1000); } finally { frame.close(); }
    }
    reader.releaseLock();
}

self.onmessage = async ev => {
    const msg = ev.data;
    try {
        if (msg.type === 'init') {
            const delegate = await init(msg.config);
            post({ type: 'ready', delegate, backend });
            setInterval(() => post({ type: 'alive', framesIn, inferences, detectMs }), 2000);
        } else if (msg.type === 'stream') {
            consume(msg.readable);
        } else if (msg.type === 'frame') {
            framesIn++;
            const now = performance.now();
            run(msg.bitmap, Math.round(now), now / 1000);
            msg.bitmap.close();
        } else if (msg.type === 'fps') {
            minInterval = msg.fps > 0 ? 1 / msg.fps : 0;
        } else if (msg.type === 'close') {
            stop = true;
            if (landmarker) landmarker.close();
            landmarker = null;
        }
    } catch (err) {
        post({ type: 'error', message: String(err && err.message || err), fatal: msg.type === 'init' });
    }
};
