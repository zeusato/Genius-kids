import { step } from './engine';
import type { Session } from './model';

export const FIXED_STEP = 1 / 60;
export const CAMERA_TRAIL = 20;
export interface Pose { distance: number; lane: number }
export interface RaceFrame { racers: Pose[]; moving: boolean }
export type FrameDriver = (now: number) => RaceFrame;

/** One clock for physics and presentation. Render between the last two physics
 * ticks, never the raw 60 Hz positions, including on 90/120/144 Hz displays. */
export class RaceMotion {
    readonly frame: RaceFrame = { racers: [], moving: false };
    stalled = false;
    private session: Session | null = null;
    private previous: Pose[] = [];
    private current: Pose[] = [];
    private last: number | null = null;
    private wasRunning = false;
    private accumulator = 0;

    advance(s: Session | null, now: number, blocked = false): RaceFrame {
        this.stalled = false;
        if (s !== this.session) {
            this.session = s;
            this.last = now;
            this.wasRunning = false;
            this.accumulator = 0;
            this.previous = s?.racers.map(r => ({ distance: r.distance, lane: r.lane })) || [];
            this.current = this.previous.map(r => ({ ...r }));
            this.frame.racers = this.previous.map(r => ({ ...r }));
        }
        const running = !!s && s.phase === 'racing' && !s.paused && !blocked;
        const dt = this.last === null || !this.wasRunning ? 0 : Math.max(0, (now - this.last) / 1000);
        this.wasRunning = running;
        this.last = now;
        this.frame.moving = false;
        // Keep the last displayed pose and interpolation remainder while paused:
        // resuming must not jump to the next tick or catch up time spent away.
        if (!s || !running) return this.frame;
        if (dt > .6) { s.paused = true; this.wasRunning = false; this.stalled = true; return this.frame; }
        this.accumulator += Math.min(dt, .1);
        while (this.accumulator + 1e-10 >= FIXED_STEP) {
            for (let i = 0; i < s.racers.length; i++) Object.assign(this.previous[i], this.current[i]);
            step(s, FIXED_STEP);
            s.racers.forEach((r, i) => { this.current[i].distance = r.distance; this.current[i].lane = r.lane; });
            this.accumulator = Math.max(0, this.accumulator - FIXED_STEP);
        }
        const alpha = this.accumulator / FIXED_STEP;
        this.frame.racers.forEach((r, i) => {
            const a = this.previous[i], b = this.current[i];
            const distance = a.distance + (b.distance - a.distance) * alpha;
            if (Math.abs(distance - r.distance) > 1e-7) this.frame.moving = true;
            r.distance = distance;
            r.lane = a.lane + (b.lane - a.lane) * alpha;
        });
        return this.frame;
    }
}

const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
/** Rivals leave the near-camera area gradually, before intersecting the camera.
 * The far fade also prevents a visibility pop at the draw-distance boundary. */
export function rivalOpacity(relativeDistance: number) {
    return smooth((relativeDistance + 7) / 6) * (1 - smooth((relativeDistance - 180) / 40));
}
