// Painters as physical objects.
//
// The problem this solves: detections arrive at ~10Hz, the wall renders at
// 60Hz. Splatting straight from detections means six frames of nothing and
// then a burst of dye, however cleverly the burst is spread along the path —
// the eye reads that as stutter no matter how smooth the fluid is.
//
// So detections stop being the thing that paints. Each painter is a ball with
// a position and a velocity, integrated every render frame, and *the ball* is
// what splats — 60 evenly spaced splats a second. Detections only move the
// ball's target. The ball chases it with a critically damped spring, which
// never overshoots and turns a staircase of detections into a continuous line.
//
// Two details make it feel immediate rather than laggy:
//
//   Feed-forward. The spring is solved in the target's moving frame, so a ball
//   chasing a target that is sliding at constant speed converges to moving
//   *with* it. A plain position spring always trails by responseTime * speed.
//
//   Dead reckoning. Between detections the target keeps moving at its last
//   known velocity, so the ball is chasing where the hand is now rather than
//   where it was when the frame was captured.
//
// No imports: this is pure motion, and it can be tested without a browser.

const DEFAULTS = {
    responseTime: 0.09,   // seconds for the ball to converge on its target
    prediction: 0.85,     // 0 = trust only detected positions, 1 = full lead
    maxLead: 0.25,        // never extrapolate further ahead than this (s)
    maxSpeed: 2.5,        // wall-widths per second
    velocitySmoothing: 0.5, // EMA on the *target* velocity estimate, speeding up
    decelResponse: 0.85,    // ...but slowing down is tracked almost at once
    coastTime: 0.35,      // how long a lost painter keeps gliding (s)
    fadeTime: 0.4,        // and how long it takes to fade out (s)
};

let nextBallId = 1;

export class Ball {
    constructor (target, now, options) {
        this.id = nextBallId++;
        this.options = options;
        this.trackId = target.id;
        this.x = target.x;          // wall space, y up, same as splat coords
        this.y = target.y;
        this.vx = 0;
        this.vy = 0;
        this.tx = target.x;         // last detected position
        this.ty = target.y;
        this.tvx = 0;               // and how fast it was moving
        this.tvy = 0;
        this.targetTime = now;
        this.alive = true;
        this.fade = 1;
        this.color = null;          // the app fills these in; they are a
        this.colorSetAt = now;      // rendering concern, not a physical one
    }

    setTarget (x, y, now) {
        const dt = now - this.targetTime;
        if (dt > 0.5) {
            // Gone long enough that the gap says nothing about speed.
            this.tvx = 0;
            this.tvy = 0;
        } else if (dt > 1e-4) {
            const vx = (x - this.tx) / dt;
            const vy = (y - this.ty) / dt;
            // Asymmetric on purpose. Speeding up is averaged, so a noisy
            // landmark cannot fling the ball; slowing down is taken almost at
            // face value, because a stale "still moving" estimate is what
            // makes a ball sail past a hand that has stopped.
            const speeding = Math.hypot(vx, vy) >= Math.hypot(this.tvx, this.tvy);
            const a = speeding ? 1 - this.options.velocitySmoothing
                               : this.options.decelResponse;
            this.tvx += (vx - this.tvx) * a;
            this.tvy += (vy - this.tvy) * a;
        }
        this.tx = x;
        this.ty = y;
        this.targetTime = now;
        this.alive = true;
    }
}

export class PainterField {
    constructor (options = {}) {
        this.options = Object.assign({}, DEFAULTS, options);
        this.balls = [];
    }

    // targets: [{id, x, y}] in wall space, one per visible painter.
    setTargets (targets, now) {
        const seen = new Set();
        for (const t of targets) {
            seen.add(t.id);
            let ball = this.balls.find(b => b.trackId === t.id);
            if (!ball) {
                // Spawn on top of the target, at rest: no swoop in from nowhere.
                ball = new Ball(t, now, this.options);
                this.balls.push(ball);
            } else {
                ball.setTarget(t.x, t.y, now);
            }
        }
        // Painters that vanished keep their momentum and glide to a stop.
        for (const ball of this.balls)
            if (!seen.has(ball.trackId)) ball.alive = false;
    }

    step (dt, now) {
        const o = this.options;
        const w = 1 / Math.max(0.01, o.responseTime);
        const survivors = [];

        for (const b of this.balls) {
            if (b.alive) {
                // Where we believe the target is *now*, and how fast it is going.
                const lead = Math.min(now - b.targetTime, o.maxLead) * o.prediction;
                const gx = b.tx + b.tvx * lead;
                const gy = b.ty + b.tvy * lead;
                const gvx = b.tvx * o.prediction;
                const gvy = b.tvy * o.prediction;

                // Critically damped spring, solved exactly in the target's
                // frame — stable at any dt, and no overshoot.
                const e = Math.exp(-w * dt);
                const ax = b.x - gx, ay = b.y - gy;
                const bx = (b.vx - gvx) + w * ax;
                const by = (b.vy - gvy) + w * ay;
                b.x = gx + gvx * dt + (ax + bx * dt) * e;
                b.y = gy + gvy * dt + (ay + by * dt) * e;
                b.vx = gvx + (bx - w * (ax + bx * dt)) * e;
                b.vy = gvy + (by - w * (ay + by * dt)) * e;
            } else {
                const drag = Math.exp(-dt / Math.max(0.01, o.coastTime));
                b.vx *= drag;
                b.vy *= drag;
                b.x += b.vx * dt;
                b.y += b.vy * dt;
                b.fade -= dt / Math.max(0.01, o.fadeTime);
            }

            const speed = Math.hypot(b.vx, b.vy);
            if (speed > o.maxSpeed) {
                b.vx *= o.maxSpeed / speed;
                b.vy *= o.maxSpeed / speed;
            }

            if (b.fade > 0) survivors.push(b);
        }

        this.balls = survivors;
        return this.balls;
    }
}
