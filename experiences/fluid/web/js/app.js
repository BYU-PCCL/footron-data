// Glue: camera -> painters -> fluid splats, plus the corner preview, attract
// mode and the on-wall stats.

import { Detector, startCamera, listCameras } from './detector.js';
import { Tracker, FINGERTIPS } from './tracking.js';
import { PainterField } from './painters.js';

const CFG = window.APP_CONFIG || {};
const T = Object.assign({
    paintPoint: 'hand',
    minVisibility: 0.5,
    requireRaisedArms: false,
    mirror: true,
    mapScaleX: 1.0, mapScaleY: 1.0, mapOffsetX: 0.0, mapOffsetY: 0.0,
    smoothing: 0.5,
    matchRadius: 0.22,
    trackTimeout: 0.4,
    splatForce: 6000,
    maxSpeed: 2.5,
    minSpeed: 0.05,
    holdInterval: 0,
    colorCycle: 2.5,
}, CFG.tracking || {});
const MOTION = Object.assign({
    responseTime: 0.09,
    prediction: 0.85,
    maxLead: 0.25,
    velocitySmoothing: 0.5,
    coastTime: 0.35,
    fadeTime: 0.4,
}, CFG.motion || {});
const BALLS = Object.assign({
    visible: true, radius: 0.055,
}, CFG.balls || {});
const DET = Object.assign({
    backend: 'pose', mode: 'auto', frames: 'auto', model: 'lite', fps: 24,
    numPoses: 4, numHands: 4,
    minDetectionConfidence: 0.5, minPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
}, CFG.detector || {});
const PREVIEW = Object.assign({ visible: true, width: 320, skeleton: true }, CFG.preview || {});
const ATTRACT = Object.assign({ enabled: true, idleAfterSeconds: 10, intervalSeconds: 3 }, CFG.attract || {});

const Fluid = window.Fluid;

const video = document.getElementById('preview-video');
const overlay = document.getElementById('preview-overlay');
const overlayCtx = overlay.getContext('2d');
const previewBox = document.getElementById('preview');
const previewFrame = document.getElementById('preview-frame');
const previewStatus = document.getElementById('preview-status');
const hud = document.getElementById('hud');

const tracker = new Tracker(Object.assign({ backend: DET.backend }, T));
const field = new PainterField(Object.assign({ maxSpeed: T.maxSpeed }, MOTION));
let detector = null;
let lastHandTime = -Infinity;
let lastAttract = 0;
let fpsSmoothed = 0;
let lastRaf = performance.now();

// ---------------------------------------------------------------------------
// Camera space -> wall space
//
// The camera looks back at the user, so left/right is flipped to put the paint
// under the hand they are pointing with. Image y runs downwards while the
// simulation's y runs upwards, hence the second flip.

function mapToWall (x, y) {
    let sx = T.mirror ? 1 - x : x;
    let sy = 1 - y;
    sx = 0.5 + (sx - 0.5) * T.mapScaleX + T.mapOffsetX;
    sy = 0.5 + (sy - 0.5) * T.mapScaleY + T.mapOffsetY;
    return { x: sx, y: sy };
}

// The inverse, for drawing balls back onto the camera preview.
function wallToImage (x, y) {
    const sx = 0.5 + (x - 0.5 - T.mapOffsetX) / T.mapScaleX;
    const sy = 0.5 + (y - 0.5 - T.mapOffsetY) / T.mapScaleY;
    return { x: T.mirror ? 1 - sx : sx, y: 1 - sy };
}

// Same aspect-ratio correction the simulation applies to mouse deltas, so a
// diagonal gesture stays diagonal on a very wide wall.
function correctDelta (dx, dy) {
    const aspect = Fluid.canvas.width / Fluid.canvas.height;
    if (aspect > 1) dy /= aspect;
    else dx *= aspect;
    return [dx, dy];
}

// ---------------------------------------------------------------------------
// Painting
//
// Every ball splats once per render frame, using its own velocity. Because a
// frame's movement is exactly velocity * dt, this is the same quantity the
// simulation's own mouse handler feeds in per frame — so the stroke is
// continuous, and both the force and the amount of dye stay the same whether
// the wall is running at 30fps or 144fps.

function paintBall (ball, now, dt) {
    if (!ball.color || now - ball.colorSetAt > T.colorCycle) {
        ball.color = Fluid.generateColor();
        ball.colorSetAt = now;
    }

    const speed = Math.hypot(ball.vx, ball.vy);
    const rate = Math.min(3, dt * 60);          // dye per frame -> dye per second
    const fade = Math.max(0, Math.min(1, ball.fade));

    if (speed > T.minSpeed) {
        const [cdx, cdy] = correctDelta(ball.vx * dt, ball.vy * dt);
        Fluid.splat(ball.x, ball.y, cdx * T.splatForce, cdy * T.splatForce,
                    scaleColor(ball.color, rate * fade));
        ball.lastSplat = now;
        return;
    }

    // A painter held still leaves a glow, so people get feedback before they
    // work out that motion is what paints. Off by default for the pose
    // backend, where everyone in frame carries two painters around with them.
    if (T.holdInterval > 0 && now - (ball.lastSplat || 0) > T.holdInterval) {
        const a = Math.random() * Math.PI * 2;
        const [cdx, cdy] = correctDelta(Math.cos(a) * 0.0025, Math.sin(a) * 0.0025);
        Fluid.splat(ball.x, ball.y, cdx * T.splatForce, cdy * T.splatForce,
                    scaleColor(ball.color, fade));
        ball.lastSplat = now;
    }
}

function scaleColor (c, k) {
    return { r: c.r * k, g: c.g * k, b: c.b * k };
}

// Detections do not paint. They only tell the balls where to go.
function onDetections (detections) {
    const now = performance.now() / 1000;
    const tracks = tracker.update(detections, now);
    field.setTargets(tracks.map(t => {
        const p = mapToWall(t.x, t.y);
        return { id: t.id, x: p.x, y: p.y };
    }), now);
    if (tracks.length > 0) lastHandTime = now;
}

// Brightened painter colour for the ball's rim and meniscus, so it reads
// against a black wall.
function ballTint (c) {
    const max = Math.max(c.r, c.g, c.b, 1e-6);
    return { r: c.r / max, g: c.g / max, b: c.b / max };
}

// ---------------------------------------------------------------------------
// Attract mode — the wall entertains itself when nobody is in front of it.
// Ported from do_something_random() in the old container's main.py.

function attractSplat () {
    if (Math.random() > 0.9) {
        Fluid.multipleSplats(Math.floor(Math.random() * 20) + 5);
        return;
    }
    let sx = Math.random();
    let sy = Math.random();
    const dx = (Math.random() - 0.5) * 300;
    const dy = (Math.random() - 0.5) * 300;
    const color = Fluid.generateColor();
    const steps = Math.floor(Math.random() * 20) + 1;
    for (let i = 0; i <= steps; i++) {
        Fluid.splat(sx, sy, dx, dy, color);
        sx += 0.0002 * dx;
        sy += 0.0002 * dy;
    }
}

// ---------------------------------------------------------------------------
// Preview

function colorToCss (c, alpha = 1) {
    // Splat colours are dim on purpose; scale to full brightness for the UI.
    const max = Math.max(c.r, c.g, c.b, 1e-6);
    return `rgba(${Math.round(255 * c.r / max)},${Math.round(255 * c.g / max)},${Math.round(255 * c.b / max)},${alpha})`;
}

function resizeOverlay () {
    const rect = overlay.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (w > 0 && h > 0 && (overlay.width !== w || overlay.height !== h)) {
        overlay.width = w;
        overlay.height = h;
    }
}

function drawPreview () {
    if (!PREVIEW.visible) return;
    resizeOverlay();
    const W = overlay.width, H = overlay.height;
    overlayCtx.clearRect(0, 0, W, H);
    const s = W / 640;
    const tracks = tracker.visibleTracks;

    // Skeletons first, one per detected body or hand, underneath the dots.
    if (PREVIEW.skeleton) {
        overlayCtx.strokeStyle = 'rgba(255,255,255,0.5)';
        overlayCtx.lineWidth = 2 * s;
        overlayCtx.beginPath();
        for (const det of tracker.detections) {
            for (const [a, b] of tracker.connections) {
                const p = det.landmarks[a], q = det.landmarks[b];
                if (!p || !q) continue;
                overlayCtx.moveTo(p.x * W, p.y * H);
                overlayCtx.lineTo(q.x * W, q.y * H);
            }
        }
        overlayCtx.stroke();
    }

    // Detection targets: small hollow marks, so it is obvious at a glance how
    // far the balls are trailing what the camera actually sees.
    overlayCtx.strokeStyle = 'rgba(255,255,255,0.6)';
    overlayCtx.lineWidth = 1.5 * s;
    for (const track of tracks) {
        overlayCtx.beginPath();
        overlayCtx.arc(track.x * W, track.y * H, 5 * s, 0, Math.PI * 2);
        overlayCtx.stroke();
    }

    // Then the balls themselves — what is actually painting.
    for (const ball of field.balls) {
        const css = ball.color ? colorToCss(ball.color, Math.max(0, Math.min(1, ball.fade))) : '#ffffff';
        const p = wallToImage(ball.x, ball.y);
        const px = p.x * W, py = p.y * H;
        overlayCtx.beginPath();
        overlayCtx.arc(px, py, 13 * s, 0, Math.PI * 2);
        overlayCtx.strokeStyle = css;
        overlayCtx.lineWidth = 3 * s;
        overlayCtx.stroke();
        overlayCtx.beginPath();
        overlayCtx.arc(px, py, 6 * s, 0, Math.PI * 2);
        overlayCtx.fillStyle = css;
        overlayCtx.fill();
    }

    for (const track of tracks) {
        if (PREVIEW.skeleton && track.tips) {
            overlayCtx.fillStyle = 'rgba(255,255,255,0.85)';
            for (const i of FINGERTIPS) {
                const p = track.landmarks[i];
                overlayCtx.beginPath();
                overlayCtx.arc(p.x * W, p.y * H, 3.5 * s, 0, Math.PI * 2);
                overlayCtx.fill();
            }
        }
    }
}

function setStatus (text) {
    previewStatus.textContent = text;
}

// ---------------------------------------------------------------------------
// Main loop
//
// Inference is not driven from here — the worker delivers results as they
// finish. This loop only draws the preview, runs attract mode, and keeps the
// stats fresh, so a slow detector can never stall the simulation.

function frame () {
    if (!Fluid) return;
    requestAnimationFrame(frame);

    const nowMs = performance.now();
    const now = nowMs / 1000;
    const rafDt = (nowMs - lastRaf) / 1000;
    lastRaf = nowMs;
    fpsSmoothed += ((rafDt > 0 ? 1 / rafDt : 0) - fpsSmoothed) * 0.05;

    // The balls move and paint every frame, whatever the detector is doing.
    // A long frame (tab restored, GC pause) must not teleport them.
    const dt = Math.min(0.05, Math.max(1 / 1000, rafDt));
    field.step(dt, now);
    for (const ball of field.balls) paintBall(ball, now, dt);

    if (Fluid.config.BALLS && BALLS.visible) {
        Fluid.setBalls(field.balls.map(b => ({
            x: b.x, y: b.y,
            r: BALLS.radius,
            alpha: Math.max(0, Math.min(1, b.fade)),
            color: ballTint(b.color || { r: 1, g: 1, b: 1 }),
        })));
    } else {
        Fluid.setBalls(null);
    }

    if (detector) {
        detector.tick(nowMs);       // no-op unless we fell back to main-thread
        drawPreview();
    }

    if (ATTRACT.enabled &&
        now - lastHandTime > ATTRACT.idleAfterSeconds &&
        now - lastAttract > ATTRACT.intervalSeconds) {
        attractSplat();
        lastAttract = now;
    }

    if (hud.dataset.on === 'true') {
        const idle = now - lastHandTime > ATTRACT.idleAfterSeconds;
        const painters = tracker.visibleTracks.length;
        // How far the balls are behind the detections right now: the honest
        // measure of whether responseTime/prediction are tuned.
        let lag = 0;
        for (const b of field.balls)
            lag = Math.max(lag, Math.hypot(b.x - b.tx, b.y - b.ty));
        hud.textContent =
            `render ${fpsSmoothed.toFixed(0)}fps ${Fluid.canvas.width}x${Fluid.canvas.height} ` +
            `(scale ${Fluid.config.RENDER_SCALE}, dye ${Fluid.config.DYE_RESOLUTION}` +
            `${Fluid.config.BLOOM ? ', bloom' : ''}${Fluid.config.SUNRAYS ? ', sunrays' : ''})\n` +
            `detect ${(1 / tracker.frameDt).toFixed(0)}fps ` +
            `${detector ? detector.detectMs.toFixed(1) : '--'}ms ` +
            `${DET.backend}/${DET.model} ${detector ? detector.mode + '/' + detector.delegate : '--'} ` +
            `cap ${DET.fps}fps ${video.videoWidth || 0}x${video.videoHeight || 0}\n` +
            `painters ${painters} · balls ${field.balls.length} · ` +
            `bodies ${tracker.detections.length} · ` +
            `lag ${(lag * 100).toFixed(1)}% · ` +
            (idle ? 'attract' : 'interactive');
    }
}

// ---------------------------------------------------------------------------
// Startup

async function main () {
    if (!Fluid) {
        // fluid.js threw during setup; say so once instead of failing 60x a
        // second in the render loop.
        setStatus('simulation failed to start — see the console');
        previewBox.classList.add('error');
        return;
    }

    if (PREVIEW.width) previewBox.style.width = PREVIEW.width + 'px';
    previewBox.classList.toggle('off', !PREVIEW.visible);
    previewFrame.style.transform = T.mirror ? 'scaleX(-1)' : 'none';

    requestAnimationFrame(frame);   // fluid + attract mode run regardless

    setStatus('starting camera…');
    let stream;
    try {
        stream = await startCamera(video, CFG.camera || {});
    } catch (err) {
        console.error('Camera failed:', err);
        setStatus('no camera: ' + (err.message || err.name));
        previewBox.classList.add('error');
        return;
    }

    setStatus(`loading ${DET.backend} model…`);
    try {
        detector = new Detector(DET);
        detector.onResult = onDetections;
        detector.onError = msg => console.warn('detector:', msg);
        await detector.start(video, stream);
    } catch (err) {
        console.error('Detector failed to load:', err);
        setStatus('detector failed: ' + (err.message || err));
        previewBox.classList.add('error');
        detector = null;
        return;
    }

    console.log(`fluid wall: ${DET.backend}/${DET.model} on ${detector.mode} (${detector.delegate}), ` +
                `${video.videoWidth}x${video.videoHeight} @ ${DET.fps}fps cap`);
    setStatus(`${video.videoWidth}x${video.videoHeight} · ${detector.delegate} · ${detector.mode}`);
    // Once tracking is live the status line is just clutter on a video wall.
    setTimeout(() => setStatus(''), 5000);
}

// Handles for tuning from the console on site (and for tests): live config,
// the tracker, and the camera->wall mapping.
window.FluidWall = {
    config: T,
    motion: MOTION,
    balls: BALLS,
    detectorConfig: DET,
    preview: PREVIEW,
    attract: ATTRACT,
    tracker,
    field,
    mapToWall,
    wallToImage,
    paintBall,
    attractSplat,
    get detector () { return detector; },
    get tracks () { return tracker.visibleTracks; },
    // Live perf tuning: FluidWall.setQuality({RENDER_SCALE: 0.6, SUNRAYS: false})
    setQuality (overrides) { Object.assign(Fluid.config, overrides); },
    setDetectFps (fps) { if (detector) detector.setFps(fps); DET.fps = fps; },
};

window.addEventListener('keydown', e => {
    switch (e.key.toLowerCase()) {
        case 'h':
            PREVIEW.visible = !PREVIEW.visible;
            previewBox.classList.toggle('off', !PREVIEW.visible);
            break;
        case 'c':
            document.getElementById('captions').classList.toggle('hidden');
            break;
        case 'b':
            BALLS.visible = !BALLS.visible;
            break;
        case 'd':
            hud.dataset.on = hud.dataset.on === 'true' ? 'false' : 'true';
            hud.classList.toggle('hidden');
            break;
        case 'f':
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
            break;
        case 'l':
            listCameras().then(cams => {
                console.table(cams.map(c => ({ label: c.label, deviceId: c.deviceId })));
            });
            break;
    }
});

main();
