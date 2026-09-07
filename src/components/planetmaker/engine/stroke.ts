export type Point = [number, number, number];
/** Fixed spacing across pointer events; event frequency does not change brush strength. */
export class StrokeSampler {
    private previous: Point | null = null;
    private remaining = 0;
    reset() { this.previous = null; this.remaining = 0; }
    sample(point: Point, spacing: number): Point[] {
        if (!this.previous) { this.previous = [...point]; this.remaining = spacing; return [[...point]]; }
        const from = this.previous, delta = point.map((v, i) => v - from[i]), length = Math.hypot(...delta), result: Point[] = [];
        let distance = this.remaining;
        while (distance <= length + 1e-9 && length > 0) { result.push(from.map((v, i) => v + delta[i] * distance / length) as Point); distance += spacing; }
        this.remaining = distance - length; this.previous = [...point]; return result;
    }
}
