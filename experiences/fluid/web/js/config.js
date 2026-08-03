// Installation settings for the fluid wall.
//
// Plain data: edit on site, reload the page, done. Everything has a default in
// code, so deleting a key you do not care about is safe.

// ---------------------------------------------------------------------------
// Performance preset. Start here if the wall stutters.
//
//   'quality'      everything on, full resolution. Wants a strong GPU.
//   'balanced'     the default: 3/4 render scale, half the dye resolution,
//                  no sunrays. Reads almost identically from a few metres.
//   'performance'  for a big wall or a busy scene — noticeably softer, but it
//                  will hold 60fps with several people painting.
//
// Cost, roughly in order of impact on a wall-sized canvas:
//   fluid.RENDER_SCALE    quadratic in every full-screen pass
//   fluid.DYE_RESOLUTION  quadratic; the advection pass is the sim's hot spot
//   fluid.SUNRAYS/BLOOM   several extra full-screen passes each
//   detector.fps          inference cost per second
//   detector.model        'full' is ~2x 'lite' for a small accuracy gain
//   detector.numPoses     each extra person is another landmark pass
const PRESET = 'quality';

const PRESETS = {
    quality: {
        fluid: { RENDER_SCALE: 1.0, DYE_RESOLUTION: 1024, SIM_RESOLUTION: 128,
                 BLOOM: false, SUNRAYS: true, SHADING: true, PRESSURE_ITERATIONS: 20 },
        detector: { fps: 30, model: 'lite' },
    },
    balanced: {
        fluid: { RENDER_SCALE: 0.75, DYE_RESOLUTION: 512, SIM_RESOLUTION: 128,
                 BLOOM: true, SUNRAYS: false, SHADING: true, PRESSURE_ITERATIONS: 20 },
        detector: { fps: 24, model: 'lite' },
    },
    performance: {
        fluid: { RENDER_SCALE: 0.6, DYE_RESOLUTION: 384, SIM_RESOLUTION: 96,
                 BLOOM: false, SUNRAYS: false, SHADING: true, PRESSURE_ITERATIONS: 12 },
        detector: { fps: 15, model: 'lite' },
    },
};

window.APP_CONFIG = {

    // ---- Fluid simulation -------------------------------------------------
    // Overrides for the config block in js/fluid.js.
    fluid: Object.assign({
        DENSITY_DISSIPATION: 1,
        VELOCITY_DISSIPATION: 0.2,
        SPLAT_RADIUS: 0.25,
        SPLAT_FORCE: 6000,
        MAX_PIXEL_RATIO: 1,     // a video wall is 1:1; HiDPI scaling just costs
    }, PRESETS[PRESET].fluid),

    // ---- Camera -----------------------------------------------------------
    camera: {
        width: 1280,            // detection quality at distance comes from here
        height: 720,
        fps: 30,                // capture rate; detector.fps is the inference rate
        deviceId: null,         // press "L" in the app to list device ids
        facingMode: 'user',
    },

    // ---- Detector ---------------------------------------------------------
    detector: Object.assign({
        // 'pose'  full-body pose, painting from the ends of the arms. Works at
        //         3-4 m, where a hand is only a few dozen pixels across.
        // 'hands' hand landmarker: fingertip precision, but the hand has to
        //         fill a good part of the frame. Kiosk distance only.
        backend: 'pose',

        // Where inference runs. 'auto' uses a worker thread when the browser
        // allows it, so inference never blocks the simulation; 'main' is the
        // old single-threaded behaviour, for debugging.
        mode: 'auto',
        frames: 'auto',         // 'auto' | 'bitmap' (force the copy path)

        numPoses: 4,            // people tracked at once (pose backend)
        numHands: 4,            // hands tracked at once (hands backend)

        minDetectionConfidence: 0.5,   // lower finds distant people, costs noise
        minPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
    }, PRESETS[PRESET].detector),

    // ---- Painting ---------------------------------------------------------
    tracking: {
        // pose backend:  'hand' (out at the fingers) | 'wrist' (steadiest)
        // hands backend: 'index' | 'palm' | 'fingertips'
        paintPoint: 'hand',

        minVisibility: 0.5,        // pose: how sure the model must be about an arm
        requireRaisedArms: false,  // pose: only paint from arms lifted above the elbow

        // The camera faces the audience, so left/right is flipped to put the
        // paint under the hand people are pointing with. Turn off if the
        // camera feed is already mirrored.
        mirror: true,

        // Zoom of the camera frame onto the wall, about the frame centre.
        // Above 1 means people reach the wall edges with a smaller gesture —
        // worth raising when the camera sees a much wider area than the wall.
        mapScaleX: 1.0,
        mapScaleY: 1.0,
        mapOffsetX: 0.0,
        mapOffsetY: 0.0,

        // Leave at 0: the ball physics below does the smoothing now, and
        // averaging detections on top of it only adds lag.
        smoothing: 0,
        matchRadius: 0.22,         // frame-widths a painter may jump per frame
        trackTimeout: 0.8,         // seconds a lost painter keeps its colour

        splatForce: 1000,
        maxSpeed: 2.5,             // clamp, wall-widths per second
        minSpeed: 0.05,            // slower than this counts as "still"
        holdInterval: 0,           // seconds between soft splats from a still
                                   // painter; 0 disables (sensible for pose,
                                   // where everyone in frame has two of them)
        colorCycle: 2.5,           // seconds before a painter picks a new colour
    },

    // ---- Painter motion ---------------------------------------------------
    // Detections arrive at ~10-25Hz; the wall renders at 60. Each painter is a
    // ball that is integrated every render frame and chases its detection with
    // a critically damped spring, and the ball is what paints — so strokes are
    // continuous instead of arriving in bursts. See js/painters.js.
    motion: {
        // Seconds for a ball to converge on its target. Lower is snappier and
        // more faithful to the camera; higher is smoother and more floaty.
        // Below ~0.05 the detection staircase starts to show through again.
        responseTime: 0.09,

        // How much to trust the target's velocity between detections. 0 means
        // the ball only ever heads for the last detected position, which lags
        // by about one detection interval. 1 extrapolates a full interval
        // ahead: no lag on steady sweeps, but overshoot on sudden stops.
        prediction: 0.85,
        maxLead: 0.25,             // never extrapolate further ahead (s)
        velocitySmoothing: 0.5,    // averaging on the target velocity estimate

        coastTime: 0.35,           // a lost painter glides this long
        fadeTime: 0.4,             // and fades out over this long
    },

    // ---- Painter balls ----------------------------------------------------
    // Glass spheres drawn where the painters are, refracting the fluid under
    // them. Purely cosmetic; toggle live with "b".
    balls: {
        visible: true,
        radius: 0.055,             // fraction of the wall height
    },

    // ---- Webcam preview (lower-right corner) ------------------------------
    preview: {
        visible: true,
        width: 320,
        skeleton: true,
    },

    // ---- Attract mode -----------------------------------------------------
    attract: {
        enabled: true,
        idleAfterSeconds: 10,
        intervalSeconds: 3,
    },

    // ---- Captions ---------------------------------------------------------
    captions: {
        enabled: true,
        in: 300,
        stay: 5000,
        out: 300,
        delaynext: 6000,
    },
};

// ---------------------------------------------------------------------------
// Query-string overrides, for trying settings on the wall without editing this
// file:
//
//   ?preset=performance          whole preset
//   ?backend=hands&fps=15        detector
//   ?renderScale=0.5&dye=384     simulation
//   ?mode=main                   run inference on the main thread (debugging)
//   ?paintPoint=wrist&mapScaleX=1.3
//   ?responseTime=0.05&prediction=1   painter feel
//   ?balls=false                      no glass spheres
(function () {
    const q = new URLSearchParams(location.search);
    if (!q.toString()) return;
    const C = window.APP_CONFIG;
    const num = (k, f) => { if (q.has(k)) f(Number(q.get(k))); };
    const str = (k, f) => { if (q.has(k)) f(q.get(k)); };
    const bool = (k, f) => { if (q.has(k)) f(q.get(k) !== 'false' && q.get(k) !== '0'); };

    str('preset', v => {
        if (!PRESETS[v]) return;
        Object.assign(C.fluid, PRESETS[v].fluid);
        Object.assign(C.detector, PRESETS[v].detector);
    });
    num('renderScale', v => C.fluid.RENDER_SCALE = v);
    num('dye', v => C.fluid.DYE_RESOLUTION = v);
    num('sim', v => C.fluid.SIM_RESOLUTION = v);
    bool('bloom', v => C.fluid.BLOOM = v);
    bool('sunrays', v => C.fluid.SUNRAYS = v);
    str('backend', v => C.detector.backend = v);
    str('model', v => C.detector.model = v);
    str('mode', v => C.detector.mode = v);
    str('frames', v => C.detector.frames = v);
    num('fps', v => C.detector.fps = v);
    num('numPoses', v => C.detector.numPoses = v);
    num('numHands', v => C.detector.numHands = v);
    num('camWidth', v => C.camera.width = v);
    num('camHeight', v => C.camera.height = v);
    str('paintPoint', v => C.tracking.paintPoint = v);
    num('mapScaleX', v => C.tracking.mapScaleX = v);
    num('mapScaleY', v => C.tracking.mapScaleY = v);
    num('smoothing', v => C.tracking.smoothing = v);
    num('holdInterval', v => C.tracking.holdInterval = v);
    num('minSpeed', v => C.tracking.minSpeed = v);
    num('responseTime', v => C.motion.responseTime = v);
    num('prediction', v => C.motion.prediction = v);
    num('ballRadius', v => C.balls.radius = v);
    bool('balls', v => { C.balls.visible = v; C.fluid.BALLS = v; });
    bool('raisedArms', v => C.tracking.requireRaisedArms = v);
    bool('mirror', v => C.tracking.mirror = v);
    bool('preview', v => C.preview.visible = v);
    bool('attract', v => C.attract.enabled = v);
    bool('captions', v => C.captions.enabled = v);
})();
