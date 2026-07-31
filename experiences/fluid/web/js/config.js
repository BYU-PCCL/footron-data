// Installation settings for the fluid wall.
//
// This file is plain data: edit it on site, reload the page, done. Everything
// here has a sane default in code, so it is safe to delete a key you do not
// care about.

window.APP_CONFIG = {

    // ---- Fluid simulation -------------------------------------------------
    // Overrides for the WebGL-Fluid-Simulation config block in js/fluid.js.
    fluid: {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1024,
        DENSITY_DISSIPATION: 1,
        VELOCITY_DISSIPATION: 0.2,
        SPLAT_RADIUS: 0.25,
        SPLAT_FORCE: 6000,
        BLOOM: true,
        SUNRAYS: true,
    },

    // ---- Camera -----------------------------------------------------------
    camera: {
        width: 1280,
        height: 720,
        // Leave null to use the default camera, or paste a deviceId string.
        // Press "L" in the running app to list device ids in the console.
        deviceId: null,
        facingMode: 'user',
    },

    // ---- Hand tracking ----------------------------------------------------
    tracking: {
        maxHands: 4,               // how many painters can be active at once

        // Where on the hand the paint comes from:
        //   'index'      - tip of the index finger (pointing at the wall)
        //   'palm'       - centre of the palm (steadiest)
        //   'fingertips' - all five fingertips splat independently
        paintPoint: 'index',

        // The camera sees the user, so left/right must be flipped for the
        // paint to land where the user is pointing. Turn this off if the
        // camera is mounted behind the wall / already mirrored.
        mirror: true,

        // Zoom of the camera frame onto the wall, about the frame centre.
        // >1 means the user reaches the wall edges with a smaller gesture.
        mapScaleX: 1.0,
        mapScaleY: 1.0,
        mapOffsetX: 0.0,           // shift, in wall widths, after scaling
        mapOffsetY: 0.0,

        // Detector thresholds (0..1). Raise if the wall reacts to noise,
        // lower if hands are missed at a distance.
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,

        smoothing: 0.45,           // 0 = no smoothing, 0.9 = very sluggish
        matchRadius: 0.22,         // frame-widths a hand may jump between frames
        trackTimeout: 0.4,         // seconds a lost hand keeps its identity/colour

        splatForce: 6000,          // stroke strength
        maxSpeed: 2.5,             // clamp on hand speed, wall-widths/second
        deadZone: 0.0015,          // movement below this is treated as "still"
        holdInterval: 0.12,        // seconds between soft splats from a still hand
        colorCycle: 2.5,           // seconds before a painter picks a new colour
    },

    // ---- Webcam preview (lower-right corner) ------------------------------
    preview: {
        visible: true,
        width: 320,                // px
        skeleton: true,            // draw the hand wireframe over the video
    },

    // ---- Attract mode -----------------------------------------------------
    // Random splats when nobody is playing, so the wall is never blank.
    attract: {
        enabled: true,
        idleAfterSeconds: 10,      // no hands for this long -> attract mode
        intervalSeconds: 3,        // time between random strokes
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
