export type TracePoint = [number, number];
export interface TraceStroke { instruction: string; points: TracePoint[] }
export interface TraceLetter { strokes: TraceStroke[] }
export interface TraceState { stroke: number; point: number }
export const initialTraceState = (): TraceState => ({ stroke: 0, point: 0 });
const distance = (a: TracePoint, b: TracePoint) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function resample(points: TracePoint[]): TracePoint[] {
    const result = [points[0]];
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i], count = Math.ceil(distance(a, b) / 5);
        for (let n = 1; n <= count; n++) result.push([a[0] + (b[0] - a[0]) * n / count, a[1] + (b[1] - a[1]) * n / count]);
    }
    return result;
}
const line = (...xy: number[]): TracePoint[] => resample(Array.from({ length: xy.length / 2 }, (_, i) => [xy[i * 2], xy[i * 2 + 1]]));
function curve(start: TracePoint, ...segments: [TracePoint, TracePoint, TracePoint][]): TracePoint[] {
    const result: TracePoint[] = [start];
    for (const [a, b, end] of segments) {
        for (let i = 1; i <= 36; i++) {
            const t = i / 36, u = 1 - t;
            result.push([u ** 3 * start[0] + 3 * u ** 2 * t * a[0] + 3 * u * t ** 2 * b[0] + t ** 3 * end[0], u ** 3 * start[1] + 3 * u ** 2 * t * a[1] + 3 * u * t ** 2 * b[1] + t ** 3 * end[1]]);
        }
        start = end;
    }
    return resample(result);
}
const stroke = (instruction: string, points: TracePoint[]): TraceStroke => ({ instruction, points });
const down = (x: number) => stroke('Kéo từ trên xuống dưới.', line(x, 85, x, 320));
const across = (y: number, left = 125, right = 280) => stroke('Kéo từ trái sang phải.', line(left, y, right, y));
const oval = () => curve([200, 85], [[73, 85], [73, 320], [200, 320]], [[327, 320], [327, 85], [200, 85]]);
const upperBowl = () => curve([130, 85], [[300, 70], [300, 210], [130, 200]]);

/** Simple print capitals. The same sampled paths drive the outline, demo and scoring. */
export const TRACE_LETTERS: Record<string, TraceLetter> = {
    a: { strokes: [stroke('Từ đỉnh, kéo chéo xuống bên trái.', line(200, 85, 120, 320)), stroke('Từ đỉnh, kéo chéo xuống bên phải.', line(200, 85, 280, 320)), across(235, 151, 249)] },
    b: { strokes: [down(130), stroke('Vòng sang phải, rồi trở về giữa.', upperBowl()), stroke('Vòng sang phải, rồi trở về chân chữ.', curve([130, 200], [[315, 185], [315, 335], [130, 320]]))] },
    c: { strokes: [stroke('Vòng sang trái, xuống dưới rồi cong lên.', curve([278, 120], [[220, 42], [103, 72], [103, 202]], [[103, 329], [225, 355], [278, 287]]))] },
    d: { strokes: [down(130), stroke('Vòng sang phải, xuống dưới rồi về chân chữ.', curve([130, 85], [[340, 60], [340, 345], [130, 320]]))] },
    e: { strokes: [down(130), across(85, 130), across(202, 130, 260), across(320, 130)] },
    f: { strokes: [down(130), across(85, 130), across(202, 130, 260)] },
    g: { strokes: [stroke('Vòng sang trái, xuống dưới rồi cong lên.', curve([275, 120], [[220, 42], [103, 72], [103, 202]], [[103, 334], [288, 360], [288, 230]])), stroke('Kéo ngang vào trong chữ.', line(288, 230, 214, 230))] },
    h: { strokes: [down(125), down(275), across(202, 125, 275)] },
    i: { strokes: [across(85, 135, 265), down(200), across(320, 135, 265)] },
    j: { strokes: [across(85, 135, 275), stroke('Kéo xuống rồi cong sang trái.', [...line(255, 85, 255, 259), ...curve([255, 259], [[255, 350], [125, 346], [125, 270]])])] },
    k: { strokes: [down(130), stroke('Kéo chéo từ bên phải về giữa.', line(280, 85, 130, 205)), stroke('Từ giữa, kéo chéo xuống bên phải.', line(130, 205, 280, 320))] },
    l: { strokes: [down(135), across(320, 135, 280)] },
    m: { strokes: [down(115), stroke('Kéo chéo xuống giữa rồi lên bên phải.', line(115, 85, 200, 235, 285, 85)), down(285)] },
    n: { strokes: [down(125), stroke('Kéo chéo từ trên trái xuống dưới phải.', line(125, 85, 275, 320)), down(275)] },
    o: { strokes: [stroke('Vòng sang trái, xuống dưới rồi khép vòng tròn.', oval())] },
    p: { strokes: [down(130), stroke('Vòng sang phải rồi trở về giữa.', upperBowl())] },
    q: { strokes: [stroke('Vòng sang trái, xuống dưới rồi khép vòng tròn.', oval()), stroke('Thêm nét chéo nhỏ ở chân chữ.', line(232, 265, 295, 334))] },
    r: { strokes: [down(130), stroke('Vòng sang phải rồi trở về giữa.', upperBowl()), stroke('Kéo chéo từ giữa xuống bên phải.', line(200, 202, 283, 320))] },
    s: { strokes: [stroke('Cong sang trái, vòng sang phải rồi về bên trái.', curve([278, 117], [[230, 54], [109, 72], [109, 151]], [[109, 217], [285, 190], [285, 260]], [[285, 344], [155, 354], [110, 284]]))] },
    t: { strokes: [across(85, 115, 285), down(200)] },
    u: { strokes: [stroke('Kéo xuống, cong ở đáy rồi kéo lên.', [...line(125, 85, 125, 250), ...curve([125, 250], [[125, 345], [275, 345], [275, 250]]), ...line(275, 250, 275, 85)])] },
    v: { strokes: [stroke('Kéo chéo xuống giữa rồi kéo lên bên phải.', line(120, 85, 200, 320, 280, 85))] },
    w: { strokes: [stroke('Xuống, lên, xuống, rồi lên như hai ngọn núi.', line(95, 85, 145, 320, 200, 180, 255, 320, 305, 85))] },
    x: { strokes: [stroke('Kéo chéo từ trên trái xuống dưới phải.', line(125, 85, 275, 320)), stroke('Kéo chéo từ trên phải xuống dưới trái.', line(275, 85, 125, 320))] },
    y: { strokes: [stroke('Kéo chéo từ bên trái xuống giữa.', line(125, 85, 200, 202)), stroke('Từ bên phải, về giữa rồi kéo thẳng xuống.', line(275, 85, 200, 202, 200, 320))] },
    z: { strokes: [stroke('Sang phải, chéo xuống trái rồi sang phải.', line(120, 85, 280, 85, 120, 320, 280, 320))] },
};

export const traceFinished = (letter: TraceLetter, state: TraceState) => state.stroke === letter.strokes.length && state.point === 0;
export const traceAnchor = (letter: TraceLetter, state: TraceState): TracePoint | null => letter.strokes[state.stroke]?.points[state.point] ?? null;
export const canStartTrace = (letter: TraceLetter, state: TraceState, point: TracePoint) => {
    const anchor = traceAnchor(letter, state);
    return !!anchor && distance(anchor, point) <= 27;
};
export const pointsAttribute = (points: TracePoint[]) => points.map(p => p.map(n => Math.round(n * 10) / 10).join(',')).join(' ');

/** Walk the pointer segment through the corridor in order; a straight shortcut across a curve fails. */
export function advanceTrace(letter: TraceLetter, state: TraceState, from: TracePoint, to: TracePoint): { state: TraceState; offPath: boolean } {
    const points = letter.strokes[state.stroke]?.points;
    if (!points || ![...from, ...to].every(Number.isFinite)) return { state, offPath: false };
    const length = distance(from, to);
    if (length < .25) return { state, offPath: false };
    // A pointer leaving the board must never allocate an unbounded interpolation loop.
    if (length > 700) return { state, offPath: true };
    let index = state.point;
    const steps = Math.ceil(length / 4);
    for (let step = 1; step <= steps; step++) {
        const sample: TracePoint = [from[0] + (to[0] - from[0]) * step / steps, from[1] + (to[1] - from[1]) * step / steps];
        let closest = index, best = Infinity;
        for (let candidate = Math.max(0, index - 3); candidate <= Math.min(points.length - 1, index + 8); candidate++) {
            const d = distance(sample, points[candidate]);
            if (d < best) { closest = candidate; best = d; }
        }
        if (best > 24) return { state: { ...state, point: index }, offPath: true };
        index = Math.max(index, closest);
        if (index >= points.length - 2 && distance(sample, points[points.length - 1]) <= 14) {
            return { state: { stroke: state.stroke + 1, point: 0 }, offPath: false };
        }
    }
    return { state: { ...state, point: index }, offPath: false };
}
