// Camera capture and landmark inference plumbing.
//
// Three ways to run, best first. Whatever the browser supports, the result is
// the same: onResult(detections, timestampMs) with landmarks in image space.
//
//   'worker-stream'  camera frames go straight to the worker as VideoFrames.
//                    Zero main-thread cost per frame — the simulation never
//                    waits on inference.
//   'worker-bitmap'  the worker still does inference, but the main thread
//                    grabs each frame as an ImageBitmap first.
//   'main'           everything on the main thread (what the wall did before).

const HERE = import.meta.url;
const WASM_PATH = new URL('../vendor/mediapipe/wasm', HERE).href;

export const MODELS = {
    pose: {
        lite: new URL('../vendor/mediapipe/pose_landmarker_lite.task', HERE).href,
        full: new URL('../vendor/mediapipe/pose_landmarker_full.task', HERE).href,
    },
    hands: {
        lite: new URL('../vendor/mediapipe/hand_landmarker.task', HERE).href,
        full: new URL('../vendor/mediapipe/hand_landmarker.task', HERE).href,
    },
};

export class Detector {
    constructor (cfg) {
        this.cfg = cfg;
        this.mode = null;
        this.delegate = null;
        this.detectMs = 0;
        this.results = 0;       // results delivered to the app
        this.framesIn = 0;      // frames the worker has received
        this.inferences = 0;    // frames it actually ran on (fps cap drops the rest)
        this.onResult = () => {};
        this.onError = () => {};
        this.worker = null;
        this.landmarker = null;     // main-thread fallback only
        this.pumping = false;
        this.frameInFlight = false;
        this.lastPump = 0;
    }

    get modelPath () {
        const family = MODELS[this.cfg.backend] || MODELS.pose;
        return family[this.cfg.model] || family.lite;
    }

    get workerConfig () {
        return {
            backend: this.cfg.backend,
            modelPath: this.modelPath,
            wasmPath: WASM_PATH,
            fps: this.cfg.fps,
            numPoses: this.cfg.numPoses,
            numHands: this.cfg.numHands,
            minDetectionConfidence: this.cfg.minDetectionConfidence,
            minPresenceConfidence: this.cfg.minPresenceConfidence,
            minTrackingConfidence: this.cfg.minTrackingConfidence,
        };
    }

    async start (video, stream) {
        const want = this.cfg.mode || 'auto';
        if (want !== 'main') {
            try {
                await this.#startWorker(video, stream);
                return this.mode;
            } catch (err) {
                if (want === 'worker') throw err;
                console.warn('Worker inference unavailable, falling back to the main thread:', err);
                this.#stopWorker();
            }
        }
        await this.#startMain(video);
        return this.mode;
    }

    async #startWorker (video, stream) {
        // Classic worker on purpose — see the note at the top of the worker.
        this.worker = new Worker(new URL('./detector-worker.js', HERE));

        const ready = new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('worker did not start in time')), 60000);
            this.worker.onmessage = ev => {
                const msg = ev.data;
                if (msg.type === 'ready') {
                    clearTimeout(timer);
                    this.delegate = msg.delegate;
                    resolve();
                } else if (msg.type === 'result') {
                    this.detectMs = msg.detectMs;
                    this.frameInFlight = false;
                    this.results++;
                    this.onResult(msg.detections, msg.timestampMs);
                } else if (msg.type === 'alive') {
                    this.framesIn = msg.framesIn;
                    this.inferences = msg.inferences;
                    this.detectMs = msg.detectMs;
                } else if (msg.type === 'error') {
                    this.frameInFlight = false;
                    if (msg.fatal) { clearTimeout(timer); reject(new Error(msg.message)); }
                    else this.onError(msg.message);
                }
            };
            this.worker.onerror = e => { clearTimeout(timer); reject(new Error(e.message || 'worker failed')); };
        });

        this.worker.postMessage({ type: 'init', config: this.workerConfig });
        await ready;

        // Preferred: hand the camera track itself to the worker.
        const track = stream && stream.getVideoTracks()[0];
        if (track && typeof MediaStreamTrackProcessor !== 'undefined' && this.cfg.frames !== 'bitmap') {
            const processor = new MediaStreamTrackProcessor({ track });
            this.worker.postMessage({ type: 'stream', readable: processor.readable }, [processor.readable]);
            this.mode = 'worker-stream';
        } else {
            this.#pump(video);
            this.mode = 'worker-bitmap';
        }
    }

    // Fallback frame delivery: copy frames on the main thread and post them.
    // Throttled to the configured rate, one in flight at a time.
    #pump (video) {
        this.pumping = true;
        const tick = async () => {
            if (!this.pumping) return;
            const period = this.cfg.fps > 0 ? 1000 / this.cfg.fps : 0;
            const now = performance.now();
            if (!this.frameInFlight && now - this.lastPump >= period &&
                video.readyState >= 2 && video.videoWidth > 0) {
                this.lastPump = now;
                this.frameInFlight = true;
                try {
                    const bitmap = await createImageBitmap(video);
                    this.worker.postMessage({ type: 'frame', bitmap }, [bitmap]);
                } catch (err) {
                    this.frameInFlight = false;
                }
            }
            setTimeout(tick, 4);
        };
        tick();
    }

    async #startMain (video) {
        const mp = await import('../vendor/mediapipe/vision_bundle.mjs');
        const fileset = await mp.FilesetResolver.forVisionTasks(WASM_PATH);
        const isPose = this.cfg.backend === 'pose';
        const common = {
            baseOptions: { modelAssetPath: this.modelPath, delegate: 'GPU' },
            runningMode: 'VIDEO',
            minTrackingConfidence: this.cfg.minTrackingConfidence,
        };
        const options = isPose
            ? Object.assign(common, {
                numPoses: this.cfg.numPoses,
                minPoseDetectionConfidence: this.cfg.minDetectionConfidence,
                minPosePresenceConfidence: this.cfg.minPresenceConfidence,
                outputSegmentationMasks: false,
            })
            : Object.assign(common, {
                numHands: this.cfg.numHands,
                minHandDetectionConfidence: this.cfg.minDetectionConfidence,
                minHandPresenceConfidence: this.cfg.minPresenceConfidence,
            });
        const Task = isPose ? mp.PoseLandmarker : mp.HandLandmarker;
        try {
            this.landmarker = await Task.createFromOptions(fileset, options);
            this.delegate = 'GPU';
        } catch (err) {
            options.baseOptions.delegate = 'CPU';
            this.landmarker = await Task.createFromOptions(fileset, options);
            this.delegate = 'CPU';
        }
        this.video = video;
        this.lastVideoTime = -1;
        this.mode = 'main';
    }

    // Only the main-thread path needs driving from the render loop; the worker
    // paths deliver results on their own.
    tick (nowMs) {
        if (this.mode !== 'main' || !this.landmarker) return;
        const video = this.video;
        if (video.readyState < 2 || video.videoWidth === 0) return;
        if (video.currentTime === this.lastVideoTime) return;
        const period = this.cfg.fps > 0 ? 1000 / this.cfg.fps : 0;
        if (nowMs - this.lastPump < period) return;
        this.lastPump = nowMs;
        this.lastVideoTime = video.currentTime;

        const t0 = performance.now();
        const result = this.landmarker.detectForVideo(video, nowMs);
        const took = performance.now() - t0;
        this.detectMs = this.detectMs ? this.detectMs + (took - this.detectMs) * 0.2 : took;
        this.results++;

        const lists = result.landmarks || [];
        const labels = result.handedness || result.handednesses || [];
        this.onResult(lists.map((lm, i) => ({
            landmarks: lm,
            label: labels[i] && labels[i][0] ? labels[i][0].categoryName : '',
        })), nowMs);
    }

    setFps (fps) {
        this.cfg.fps = fps;
        if (this.worker) this.worker.postMessage({ type: 'fps', fps });
    }

    #stopWorker () {
        this.pumping = false;
        if (this.worker) {
            this.worker.postMessage({ type: 'close' });
            this.worker.terminate();
            this.worker = null;
        }
    }
}

// ---------------------------------------------------------------------------

export async function startCamera (video, cfg = {}) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
        throw new Error('This browser has no camera API (needs https:// or localhost).');

    const constraints = {
        width: { ideal: cfg.width || 1280 },
        height: { ideal: cfg.height || 720 },
    };
    if (cfg.fps) constraints.frameRate = { ideal: cfg.fps };
    if (cfg.deviceId) constraints.deviceId = { exact: cfg.deviceId };
    else if (cfg.facingMode) constraints.facingMode = cfg.facingMode;

    const stream = await navigator.mediaDevices.getUserMedia({ video: constraints, audio: false });
    video.srcObject = stream;
    await video.play();
    if (video.videoWidth === 0)
        await new Promise(res => video.addEventListener('loadeddata', res, { once: true }));
    return stream;
}

export async function listCameras () {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'videoinput');
}
