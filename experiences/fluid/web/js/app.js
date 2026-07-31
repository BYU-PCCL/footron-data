// Glue: camera -> painters -> fluid splats, plus the corner preview, attract
// mode and the on-wall stats.

import { Detector, startCamera, listCameras } from './detector.js';
import { Tracker, FINGERTIPS } from './tracking.js';

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
    deadZone: 0.0015,
    maxSubSteps: 4,
    holdInterval: 0,
    colorCycle: 2.5,
}, CFG.tracking || {});
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

// One painter's motion between two detections becomes a short stroke.
//
// dt is the time since the last detection, which is well below the render rate
// — the detector might be running at 20Hz against a 60Hz wall. Velocity is
// normalised to "movement per 60Hz frame" and the gap is filled with that many
// splats along the path, so the stroke looks the same as painting at 60Hz and
// stops depending on how fast inference happens to be.
function paintPoint (x, y, prevX, prevY, color, dt, force) {
    const p = mapToWall(x, y);
    const q = mapToWall(prevX, prevY);

    const norm = Math.min(4, (1 / 60) / dt);
    let dx = (p.x - q.x) * norm;
    let dy = (p.y - q.y) * norm;

    const speed = Math.hypot(dx, dy);
    const maxPerFrame = T.maxSpeed / 60;
    if (speed > maxPerFrame) {
        dx *= maxPerFrame / speed;
        dy *= maxPerFrame / speed;
    }
    if (speed <= T.deadZone) return false;

    const [cdx, cdy] = correctDelta(dx, dy);
    const steps = Math.max(1, Math.min(T.maxSubSteps, Math.round(dt * 60)));
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        Fluid.splat(q.x + (p.x - q.x) * t, q.y + (p.y - q.y) * t,
                    cdx * force, cdy * force, color);
    }
    return true;
}

// A painter held still leaves a glow, so people get feedback before they work
// out that motion is what paints. Off by default for the pose backend, where
// everyone in frame carries two painters around with them.
function paintHold (x, y, color, force) {
    const p = mapToWall(x, y);
    const a = Math.random() * Math.PI * 2;
    const m = 0.0025;
    const [cdx, cdy] = correctDelta(Math.cos(a) * m, Math.sin(a) * m);
    Fluid.splat(p.x, p.y, cdx * force, cdy * force, color);
}

function paintTrack (track, now, dt) {
    if (!track.color || now - track.colorSetAt > T.colorCycle) {
        track.color = Fluid.generateColor();
        track.colorSetAt = now;
    }

    let painted = false;
    if (T.paintPoint === 'fingertips' && track.tips) {
        // Five thinner strokes instead of one, so an open hand smears.
        for (const tip of track.tips)
            painted = paintPoint(tip.x, tip.y, tip.prevX, tip.prevY,
                                 track.color, dt, T.splatForce * 0.6) || painted;
    } else {
        painted = paintPoint(track.x, track.y, track.prevX, track.prevY,
                             track.color, dt, T.splatForce);
    }

    if (painted) track.lastSplat = now;
    else if (T.holdInterval > 0 && now - track.lastSplat > T.holdInterval) {
        paintHold(track.x, track.y, track.color, T.splatForce);
        track.lastSplat = now;
    }
}

// Results arrive from the detector thread whenever inference finishes.
function onDetections (detections) {
    const now = performance.now() / 1000;
    const tracks = tracker.update(detections, now);
    for (const track of tracks) paintTrack(track, now, tracker.frameDt);
    if (tracks.length > 0) lastHandTime = now;
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

    // Then the painters, in the colour each one is currently painting with.
    for (const track of tracks) {
        const css = track.color ? colorToCss(track.color) : '#ffffff';
        const px = track.x * W, py = track.y * H;
        overlayCtx.beginPath();
        overlayCtx.arc(px, py, 13 * s, 0, Math.PI * 2);
        overlayCtx.strokeStyle = css;
        overlayCtx.lineWidth = 3 * s;
        overlayCtx.stroke();
        overlayCtx.beginPath();
        overlayCtx.arc(px, py, 6 * s, 0, Math.PI * 2);
        overlayCtx.fillStyle = css;
        overlayCtx.fill();

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
        hud.textContent =
            `render ${fpsSmoothed.toFixed(0)}fps ${Fluid.canvas.width}x${Fluid.canvas.height} ` +
            `(scale ${Fluid.config.RENDER_SCALE}, dye ${Fluid.config.DYE_RESOLUTION}` +
            `${Fluid.config.BLOOM ? ', bloom' : ''}${Fluid.config.SUNRAYS ? ', sunrays' : ''})\n` +
            `detect ${(1 / tracker.frameDt).toFixed(0)}fps ` +
            `${detector ? detector.detectMs.toFixed(1) : '--'}ms ` +
            `${DET.backend}/${DET.model} ${detector ? detector.mode + '/' + detector.delegate : '--'} ` +
            `cap ${DET.fps}fps ${video.videoWidth || 0}x${video.videoHeight || 0}\n` +
            `painters ${painters} · bodies ${tracker.detections.length} · ` +
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
    detectorConfig: DET,
    preview: PREVIEW,
    attract: ATTRACT,
    tracker,
    mapToWall,
    paintTrack,
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
