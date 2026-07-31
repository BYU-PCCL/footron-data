// Browser-side hand tracking.
//
// Replaces the PyTorch PoseNet process that used to run next to the app in a
// container: MediaPipe's hand landmarker runs in WebGL/WASM right here, and
// every hand in frame becomes an independently tracked "painter".

import { FilesetResolver, HandLandmarker } from '../vendor/mediapipe/vision_bundle.mjs';

const WASM_PATH = new URL('../vendor/mediapipe/wasm', import.meta.url).href;
const MODEL_PATH = new URL('../vendor/mediapipe/hand_landmarker.task', import.meta.url).href;

// Landmark indices, for readability.
export const WRIST = 0;
export const FINGERTIPS = [4, 8, 12, 16, 20];   // thumb, index, middle, ring, pinky
const INDEX_TIP = 8;
const PALM = [0, 5, 9, 13, 17];                 // wrist + finger bases

// Wireframe used by the corner preview.
export const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],             // thumb
    [0, 5], [5, 6], [6, 7], [7, 8],             // index
    [5, 9], [9, 10], [10, 11], [11, 12],        // middle
    [9, 13], [13, 14], [14, 15], [15, 16],      // ring
    [13, 17], [17, 18], [18, 19], [19, 20],     // pinky
    [0, 17],                                    // palm edge
];

const DEFAULTS = {
    maxHands: 4,
    paintPoint: 'index',
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    smoothing: 0.45,
    matchRadius: 0.22,
    trackTimeout: 0.4,
};

let nextTrackId = 1;

// One tracked hand. Coordinates stay in raw camera-image space (0..1, origin
// top-left) — mirroring and mapping onto the wall happen in app.js, so the
// preview overlay and the splats can share the same numbers.
class Track {
    constructor (point, landmarks, handedness, now) {
        this.id = nextTrackId++;
        this.handedness = handedness;
        this.x = point.x;
        this.y = point.y;
        this.prevX = point.x;
        this.prevY = point.y;
        this.landmarks = landmarks;
        this.tips = FINGERTIPS.map(i => ({
            x: landmarks[i].x, y: landmarks[i].y,
            prevX: landmarks[i].x, prevY: landmarks[i].y,
        }));
        this.firstSeen = now;
        this.lastSeen = now;
        this.lastSplat = 0;
        this.isNew = true;
        this.color = null;          // assigned by app.js
        this.colorSetAt = now;
    }

    update (point, landmarks, handedness, now, smoothing) {
        const a = 1 - smoothing;
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += (point.x - this.x) * a;
        this.y += (point.y - this.y) * a;
        for (let i = 0; i < FINGERTIPS.length; i++) {
            const tip = this.tips[i];
            const lm = landmarks[FINGERTIPS[i]];
            tip.prevX = tip.x;
            tip.prevY = tip.y;
            tip.x += (lm.x - tip.x) * a;
            tip.y += (lm.y - tip.y) * a;
        }
        this.landmarks = landmarks;
        this.handedness = handedness;
        this.lastSeen = now;
        this.isNew = false;
    }
}

function paintPointOf (landmarks, mode) {
    if (mode === 'palm' || mode === 'fingertips') {
        let x = 0, y = 0;
        for (const i of PALM) { x += landmarks[i].x; y += landmarks[i].y; }
        return { x: x / PALM.length, y: y / PALM.length };
    }
    return { x: landmarks[INDEX_TIP].x, y: landmarks[INDEX_TIP].y };
}

export class HandTracker {
    constructor (options = {}) {
        this.options = Object.assign({}, DEFAULTS, options);
        this.tracks = [];
        this.landmarker = null;
        this.delegate = null;       // 'GPU' or 'CPU', once known
        this.lastVideoTime = -1;
        this.lastResult = null;
        this.frameId = 0;           // bumped once per processed camera frame
        this.frameDt = 1 / 30;      // seconds between the last two of those
        this.lastFrameTime = 0;
    }

    async load () {
        const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
        const opts = {
            baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numHands: this.options.maxHands,
            minHandDetectionConfidence: this.options.minHandDetectionConfidence,
            minHandPresenceConfidence: this.options.minHandPresenceConfidence,
            minTrackingConfidence: this.options.minTrackingConfidence,
        };
        try {
            this.landmarker = await HandLandmarker.createFromOptions(fileset, opts);
            this.delegate = 'GPU';
        } catch (err) {
            // Some drivers (and headless/remote sessions) have no usable GPU
            // delegate; CPU is slower but keeps the wall alive.
            console.warn('GPU delegate unavailable, falling back to CPU:', err);
            opts.baseOptions.delegate = 'CPU';
            this.landmarker = await HandLandmarker.createFromOptions(fileset, opts);
            this.delegate = 'CPU';
        }
        return this;
    }

    // Run the detector if the video has a frame we have not seen yet.
    // Returns the hands on screen right now. `tracker.tracks` additionally
    // holds hands that were lost within the last `trackTimeout` seconds and
    // may yet come back.
    detect (video, nowMs) {
        if (!this.landmarker) return this.visibleTracks;
        if (video.readyState < 2 || video.videoWidth === 0) return this.visibleTracks;

        if (video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = video.currentTime;
            this.lastResult = this.landmarker.detectForVideo(video, nowMs);
            this.#assign(this.lastResult, nowMs / 1000);
        }
        return this.visibleTracks;
    }

    // Match this frame's detections to existing tracks so each hand keeps its
    // identity — and therefore its colour and its velocity — across frames.
    #assign (result, now) {
        this.frameId++;
        if (this.lastFrameTime)
            this.frameDt = Math.min(0.25, Math.max(1 / 240, now - this.lastFrameTime));
        this.lastFrameTime = now;

        const hands = (result && result.landmarks) || [];
        const handedness = (result && (result.handedness || result.handednesses)) || [];

        const detections = hands.map((landmarks, i) => ({
            landmarks,
            point: paintPointOf(landmarks, this.options.paintPoint),
            hand: handedness[i] && handedness[i][0] ? handedness[i][0].categoryName : '',
        }));

        // Greedy nearest-neighbour: shortest pairing wins, then both sides
        // drop out. Same-handedness pairs are preferred by a small bias.
        const pairs = [];
        for (let t = 0; t < this.tracks.length; t++) {
            for (let d = 0; d < detections.length; d++) {
                const track = this.tracks[t];
                const det = detections[d];
                const dx = track.x - det.point.x;
                const dy = track.y - det.point.y;
                let dist = Math.hypot(dx, dy);
                if (track.handedness && det.hand && track.handedness !== det.hand)
                    dist += this.options.matchRadius * 0.5;
                if (dist <= this.options.matchRadius) pairs.push({ t, d, dist });
            }
        }
        pairs.sort((a, b) => a.dist - b.dist);

        const takenTracks = new Set();
        const takenDets = new Set();
        for (const p of pairs) {
            if (takenTracks.has(p.t) || takenDets.has(p.d)) continue;
            takenTracks.add(p.t);
            takenDets.add(p.d);
            const det = detections[p.d];
            this.tracks[p.t].update(det.point, det.landmarks, det.hand, now, this.options.smoothing);
        }

        for (let d = 0; d < detections.length; d++) {
            if (takenDets.has(d)) continue;
            const det = detections[d];
            this.tracks.push(new Track(det.point, det.landmarks, det.hand, now));
        }

        // Drop hands that have been gone long enough to have lost their claim
        // on an identity. A short timeout bridges single dropped frames.
        this.tracks = this.tracks.filter(t => now - t.lastSeen <= this.options.trackTimeout);

        // Only hands seen this frame count as visible.
        for (const t of this.tracks) t.visible = (t.lastSeen === now);
    }

    get visibleTracks () {
        return this.tracks.filter(t => t.visible);
    }
}

// Open the webcam. Returns a playing <video> element.
export async function startCamera (video, cfg = {}) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
        throw new Error('This browser has no camera API (needs https:// or localhost).');

    const video_cfg = {
        width: { ideal: cfg.width || 1280 },
        height: { ideal: cfg.height || 720 },
    };
    if (cfg.deviceId) video_cfg.deviceId = { exact: cfg.deviceId };
    else if (cfg.facingMode) video_cfg.facingMode = cfg.facingMode;

    const stream = await navigator.mediaDevices.getUserMedia({ video: video_cfg, audio: false });
    video.srcObject = stream;
    await video.play();
    // Wait for real dimensions before anyone asks for them.
    if (video.videoWidth === 0)
        await new Promise(res => video.addEventListener('loadeddata', res, { once: true }));
    return video;
}

export async function listCameras () {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'videoinput');
}
