// Turning landmark detections into painters.
//
// Two backends, same output: a list of "painters", each a point on screen that
// keeps its identity (and therefore its colour and its stroke) across frames.
//
//   'pose'  full-body pose, painting from the ends of the arms. Detects a
//           whole person, so it still works at 3-4 m where a hand is only a
//           few dozen pixels wide. One painter per raised arm.
//   'hands' hand landmarker, painting from a fingertip. Much finer control,
//           but needs the hand to fill a decent part of the frame — good for
//           a kiosk, not for a room.
//
// No MediaPipe imports here on purpose: this is the part with the judgement
// calls in it, so it stays plain data-in/data-out.

// ---- Pose (33 landmarks) ---------------------------------------------------

const POSE = {
    LEFT:  { wrist: 15, pinky: 17, index: 19, thumb: 21, elbow: 13, shoulder: 11, hip: 23 },
    RIGHT: { wrist: 16, pinky: 18, index: 20, thumb: 22, elbow: 14, shoulder: 12, hip: 24 },
};

export const POSE_CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],       // arms + shoulders
    [11, 23], [12, 24], [23, 24],                           // torso
    [23, 25], [25, 27], [24, 26], [26, 28],                 // legs
    [15, 17], [15, 19], [15, 21], [17, 19],                 // left hand
    [16, 18], [16, 20], [16, 22], [18, 20],                 // right hand
];

// ---- Hands (21 landmarks) --------------------------------------------------

export const FINGERTIPS = [4, 8, 12, 16, 20];
const INDEX_TIP = 8;
const PALM = [0, 5, 9, 13, 17];

export const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17],
];

// ---------------------------------------------------------------------------

const DEFAULTS = {
    backend: 'pose',
    paintPoint: 'hand',        // pose: 'hand' | 'wrist';  hands: 'index' | 'palm' | 'fingertips'
    minVisibility: 0.5,        // pose only: how sure the model must be about the arm
    requireRaisedArms: false,  // pose only: only paint from arms lifted above the elbow
    smoothing: 0.5,
    matchRadius: 0.22,
    trackTimeout: 0.4,
};

const vis = lm => (lm && lm.visibility !== undefined ? lm.visibility : 1);

// Where a pose's arm ends. The wrist landmark is the most reliable one at a
// distance; index and pinky push the point out into the hand itself when the
// model is confident about them.
function armPoint (lm, side, opts) {
    const P = POSE[side];
    const wrist = lm[P.wrist];
    if (!wrist || vis(wrist) < opts.minVisibility) return null;

    if (opts.requireRaisedArms) {
        const elbow = lm[P.elbow];
        // Image y grows downwards, so "above" means a smaller y.
        if (elbow && wrist.y > elbow.y) return null;
    }

    if (opts.paintPoint === 'wrist') return { x: wrist.x, y: wrist.y };

    const index = lm[P.index], pinky = lm[P.pinky];
    const good = [index, pinky].filter(p => p && vis(p) >= opts.minVisibility);
    if (good.length === 0) return { x: wrist.x, y: wrist.y };

    let x = 0, y = 0;
    for (const p of good) { x += p.x; y += p.y; }
    return { x: x / good.length, y: y / good.length };
}

function handPoint (lm, opts) {
    if (opts.paintPoint === 'palm' || opts.paintPoint === 'fingertips') {
        let x = 0, y = 0;
        for (const i of PALM) { x += lm[i].x; y += lm[i].y; }
        return { x: x / PALM.length, y: y / PALM.length };
    }
    return { x: lm[INDEX_TIP].x, y: lm[INDEX_TIP].y };
}

// A detection frame (landmark arrays + optional labels) -> candidate painters.
export function painterCandidates (detections, opts) {
    const out = [];
    if (opts.backend === 'pose') {
        for (let i = 0; i < detections.length; i++) {
            const lm = detections[i].landmarks;
            for (const side of ['LEFT', 'RIGHT']) {
                const point = armPoint(lm, side, opts);
                if (point) out.push({ point, landmarks: lm, side, person: i });
            }
        }
    } else {
        for (let i = 0; i < detections.length; i++) {
            const lm = detections[i].landmarks;
            out.push({
                point: handPoint(lm, opts),
                landmarks: lm,
                side: detections[i].label || '',
                person: i,
            });
        }
    }
    return out;
}

let nextTrackId = 1;

// One painter: a point that keeps its identity across frames. Coordinates are
// raw camera-image space (0..1, origin top-left) — mirroring and the mapping
// onto the wall happen in app.js, so the preview and the splats agree.
class Track {
    constructor (cand, now) {
        this.id = nextTrackId++;
        this.side = cand.side;
        this.x = cand.point.x;
        this.y = cand.point.y;
        this.prevX = this.x;
        this.prevY = this.y;
        this.landmarks = cand.landmarks;
        this.tips = null;
        this.firstSeen = now;
        this.lastSeen = now;
        this.lastSplat = 0;
        this.visible = true;
        this.color = null;          // assigned by app.js
        this.colorSetAt = now;
        this.#updateTips(cand, 1);
    }

    // Fingertips exist only on the 21-point hand model; pose painters skip this.
    #updateTips (cand, a) {
        const lm = cand.landmarks;
        if (!lm || lm.length !== 21) return;
        if (!this.tips) {
            this.tips = FINGERTIPS.map(i => ({
                x: lm[i].x, y: lm[i].y, prevX: lm[i].x, prevY: lm[i].y,
            }));
            return;
        }
        for (let i = 0; i < FINGERTIPS.length; i++) {
            const tip = this.tips[i];
            const p = lm[FINGERTIPS[i]];
            tip.prevX = tip.x;
            tip.prevY = tip.y;
            tip.x += (p.x - tip.x) * a;
            tip.y += (p.y - tip.y) * a;
        }
    }

    update (cand, now, smoothing) {
        const a = 1 - smoothing;
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += (cand.point.x - this.x) * a;
        this.y += (cand.point.y - this.y) * a;
        this.landmarks = cand.landmarks;
        this.side = cand.side;
        this.lastSeen = now;
        this.#updateTips(cand, a);
    }
}

export class Tracker {
    constructor (options = {}) {
        this.options = Object.assign({}, DEFAULTS, options);
        this.tracks = [];
        this.detections = [];       // last raw detections, for the preview
        this.frameId = 0;
        this.frameDt = 1 / 30;
        this.lastFrameTime = 0;
    }

    get connections () {
        return this.options.backend === 'pose' ? POSE_CONNECTIONS : HAND_CONNECTIONS;
    }

    // detections: [{landmarks: [{x,y,z,visibility}...], label?}]
    // now: seconds. Returns the painters visible this frame.
    update (detections, now) {
        this.frameId++;
        if (this.lastFrameTime)
            this.frameDt = Math.min(0.25, Math.max(1 / 240, now - this.lastFrameTime));
        this.lastFrameTime = now;
        this.detections = detections;

        const cands = painterCandidates(detections, this.options);

        // Greedy nearest-neighbour: shortest pairing wins, then both sides drop
        // out. Same-side pairs (left arm to left arm) get a small bias so two
        // hands crossing over each other do not swap colours.
        const pairs = [];
        for (let t = 0; t < this.tracks.length; t++) {
            for (let d = 0; d < cands.length; d++) {
                const track = this.tracks[t];
                const c = cands[d];
                let dist = Math.hypot(track.x - c.point.x, track.y - c.point.y);
                if (track.side && c.side && track.side !== c.side)
                    dist += this.options.matchRadius * 0.5;
                if (dist <= this.options.matchRadius) pairs.push({ t, d, dist });
            }
        }
        pairs.sort((a, b) => a.dist - b.dist);

        const takenTracks = new Set();
        const takenCands = new Set();
        for (const p of pairs) {
            if (takenTracks.has(p.t) || takenCands.has(p.d)) continue;
            takenTracks.add(p.t);
            takenCands.add(p.d);
            this.tracks[p.t].update(cands[p.d], now, this.options.smoothing);
        }

        for (let d = 0; d < cands.length; d++)
            if (!takenCands.has(d)) this.tracks.push(new Track(cands[d], now));

        // Keep briefly-lost painters so a dropped frame does not restart the
        // stroke in a new colour.
        this.tracks = this.tracks.filter(t => now - t.lastSeen <= this.options.trackTimeout);
        for (const t of this.tracks) t.visible = (t.lastSeen === now);

        return this.visibleTracks;
    }

    get visibleTracks () {
        return this.tracks.filter(t => t.visible);
    }
}
