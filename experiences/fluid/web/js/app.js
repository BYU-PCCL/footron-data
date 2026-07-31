// Glue: camera -> hand tracks -> fluid splats, plus the corner preview,
// attract mode and the on-wall HUD.

import {
    HandTracker, startCamera, listCameras,
    HAND_CONNECTIONS, FINGERTIPS,
} from './handtracking.js';

const CFG = window.APP_CONFIG || {};
const T = Object.assign({
    maxHands: 4,
    paintPoint: 'index',
    mirror: true,
    mapScaleX: 1.0, mapScaleY: 1.0, mapOffsetX: 0.0, mapOffsetY: 0.0,
    smoothing: 0.45,
    splatForce: 6000,
    maxSpeed: 2.5,
    deadZone: 0.0015,
    holdInterval: 0.12,
    colorCycle: 2.5,
}, CFG.tracking || {});
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

let tracker = null;
let cameraOk = false;
let lastHandTime = -Infinity;
let lastAttract = 0;
let lastProcessedFrame = -1;
let fpsSmoothed = 0;
let lastRaf = performance.now();

// ---------------------------------------------------------------------------
// Camera space -> wall space
//
// The camera looks back at the user, so left/right is flipped to put the paint
// under the hand the user is pointing with. Image y runs downwards while the
// simulation's y runs upwards, hence the second flip.

function mapToWall (x, y) {
    let sx = T.mirror ? 1 - x : x;
    let sy = 1 - y;
    sx = 0.5 + (sx - 0.5) * T.mapScaleX + T.mapOffsetX;
    sy = 0.5 + (sy - 0.5) * T.mapScaleY + T.mapOffsetY;
    return { x: sx, y: sy };
}

// Same aspect-ratio correction the simulation applies to mouse/touch deltas,
// so a diagonal gesture stays diagonal on a very wide wall.
function correctDelta (dx, dy) {
    const aspect = Fluid.canvas.width / Fluid.canvas.height;
    if (aspect > 1) dy /= aspect;
    else dx *= aspect;
    return [dx, dy];
}

// ---------------------------------------------------------------------------
// Painting

// Turn one point's motion between camera frames into a splat.
function paintPoint (x, y, prevX, prevY, color, dt, force) {
    const p = mapToWall(x, y);
    const q = mapToWall(prevX, prevY);

    // Normalise to "movement per 60Hz frame" so stroke strength does not
    // depend on how fast the detector happens to be running.
    const norm = Math.min(4, (1 / 60) / dt);
    let dx = (p.x - q.x) * norm;
    let dy = (p.y - q.y) * norm;

    const speed = Math.hypot(dx, dy);
    const maxPerFrame = T.maxSpeed / 60;
    if (speed > maxPerFrame) {
        dx *= maxPerFrame / speed;
        dy *= maxPerFrame / speed;
    }

    const moved = speed > T.deadZone;
    if (!moved) return false;

    const [cdx, cdy] = correctDelta(dx, dy);
    Fluid.splat(p.x, p.y, cdx * force, cdy * force, color);
    return true;
}

// A hand held still still leaves a glow, so users get feedback before they
// figure out that motion is what paints.
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
    if (T.paintPoint === 'fingertips') {
        // Five thinner strokes instead of one, so an open hand smears.
        for (const tip of track.tips)
            painted = paintPoint(tip.x, tip.y, tip.prevX, tip.prevY,
                                 track.color, dt, T.splatForce * 0.6) || painted;
    } else {
        painted = paintPoint(track.x, track.y, track.prevX, track.prevY,
                             track.color, dt, T.splatForce);
    }

    if (painted) track.lastSplat = now;
    else if (now - track.lastSplat > T.holdInterval) {
        paintHold(track.x, track.y, track.color, T.splatForce);
        track.lastSplat = now;
    }
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
    const r = Math.round(255 * c.r / max);
    const g = Math.round(255 * c.g / max);
    const b = Math.round(255 * c.b / max);
    return `rgba(${r},${g},${b},${alpha})`;
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

function drawPreview (tracks) {
    if (!PREVIEW.visible) return;
    resizeOverlay();
    const W = overlay.width, H = overlay.height;
    overlayCtx.clearRect(0, 0, W, H);
    const s = W / 640;   // line weights scale with the preview size

    for (const track of tracks) {
        const css = track.color ? colorToCss(track.color) : '#ffffff';

        if (PREVIEW.skeleton && track.landmarks) {
            overlayCtx.strokeStyle = colorToCss(track.color || { r: 1, g: 1, b: 1 }, 0.75);
            overlayCtx.lineWidth = 3 * s;
            overlayCtx.beginPath();
            for (const [a, b] of HAND_CONNECTIONS) {
                const p = track.landmarks[a], q = track.landmarks[b];
                overlayCtx.moveTo(p.x * W, p.y * H);
                overlayCtx.lineTo(q.x * W, q.y * H);
            }
            overlayCtx.stroke();

            overlayCtx.fillStyle = 'rgba(255,255,255,0.85)';
            for (const i of FINGERTIPS) {
                const p = track.landmarks[i];
                overlayCtx.beginPath();
                overlayCtx.arc(p.x * W, p.y * H, 3.5 * s, 0, Math.PI * 2);
                overlayCtx.fill();
            }
        }

        // The paint point itself: a filled dot with a halo, in the colour that
        // hand is currently painting with.
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
    }
}

function setStatus (text) {
    previewStatus.textContent = text;
}

// ---------------------------------------------------------------------------
// Main loop

function frame () {
    requestAnimationFrame(frame);

    const nowMs = performance.now();
    const now = nowMs / 1000;
    const rafDt = (nowMs - lastRaf) / 1000;
    lastRaf = nowMs;
    fpsSmoothed += ((rafDt > 0 ? 1 / rafDt : 0) - fpsSmoothed) * 0.05;

    let tracks = [];
    if (cameraOk && tracker) {
        tracks = tracker.detect(video, nowMs);

        // Only paint on frames the detector actually processed — otherwise a
        // 120Hz display would replay the same hand position as "no movement".
        if (tracker.frameId !== lastProcessedFrame) {
            lastProcessedFrame = tracker.frameId;
            for (const track of tracks) paintTrack(track, now, tracker.frameDt);
            if (tracks.length > 0) lastHandTime = now;
        }
        drawPreview(tracks);
    }

    if (ATTRACT.enabled &&
        now - lastHandTime > ATTRACT.idleAfterSeconds &&
        now - lastAttract > ATTRACT.intervalSeconds) {
        attractSplat();
        lastAttract = now;
    }

    if (hud.dataset.on === 'true') {
        const idle = now - lastHandTime > ATTRACT.idleAfterSeconds;
        hud.textContent =
            `${fpsSmoothed.toFixed(0)} fps render · ` +
            `${tracker ? (1 / tracker.frameDt).toFixed(0) : '--'} fps track (${tracker ? tracker.delegate : '--'}) · ` +
            `hands ${tracks.length}/${T.maxHands} · ` +
            `paint ${T.paintPoint} · ` +
            `${video.videoWidth || 0}x${video.videoHeight || 0} · ` +
            `${Fluid.canvas.width}x${Fluid.canvas.height} · ` +
            (idle ? 'attract' : 'interactive');
    }
}

// ---------------------------------------------------------------------------
// Startup

async function main () {
    if (PREVIEW.width) previewBox.style.width = PREVIEW.width + 'px';
    previewBox.classList.toggle('off', !PREVIEW.visible);
    previewFrame.style.transform = T.mirror ? 'scaleX(-1)' : 'none';

    requestAnimationFrame(frame);   // fluid + attract mode run regardless

    setStatus('starting camera…');
    try {
        await startCamera(video, CFG.camera || {});
        cameraOk = true;
    } catch (err) {
        console.error('Camera failed:', err);
        setStatus('no camera: ' + (err.message || err.name));
        previewBox.classList.add('error');
        return;
    }

    setStatus('loading hand tracker…');
    try {
        tracker = await new HandTracker(T).load();
    } catch (err) {
        console.error('Hand tracker failed to load:', err);
        setStatus('hand tracker failed: ' + (err.message || err));
        previewBox.classList.add('error');
        cameraOk = false;
        return;
    }

    setStatus(`${video.videoWidth}x${video.videoHeight} · ${tracker.delegate}`);
    // Once tracking is live the status line is just clutter on a video wall.
    setTimeout(() => setStatus(''), 5000);
}

// Handles for tuning from the console on site (and for tests): live config,
// the tracker, and the camera->wall mapping.
window.FluidWall = {
    config: T,
    preview: PREVIEW,
    attract: ATTRACT,
    mapToWall,
    paintTrack,
    attractSplat,
    get tracker () { return tracker; },
    get tracks () { return tracker ? tracker.visibleTracks : []; },
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
