// Bố cục "quạt thời gian": góc theo thứ tự ngọn, bán kính theo thời gian. TS thuần, khớp
// docs/evolution-tree-wow/prototype-layout.mjs (đã chạy trên dữ liệu thật — ảnh sketch-v2.webp).
import { SECTOR_COLOR, SECTOR_WEIGHT, SectorId } from '../../../data/evolution/sectors';
import { frac, fracEras, maAtFrac } from './timeScale';
import type { NodeTimes } from './times';
import type { EvoTree } from './tree';

export const LAYOUT = {
    R: 1000,
    SPAN_START: Math.PI + 0.035,
    SPAN_END: -0.035,
    SECTOR_GAP: 0.6 * Math.PI / 180,
    SAMPLES: 32,
    BEND: 0.45,        // góc đổi hết trong 45% đầu cành
    W0: 1.1, W1: 1.5,  // nửa độ dày cành = W0 + W1·√leafCount (đơn vị thế giới)
    TAPER: 1.15,       // gốc cành dày hơn ngọn cành
    TIP_FRAC: 0.42, TIP_MAX: 20,
    ORGANIC: 0.006,    // độ cong nhẹ (rad) cho cành dài
} as const;

export type Orientation = 'landscape' | 'portrait';

export interface BranchPolar {
    node: number;          // cành dẫn TỚI node này (từ cha)
    theta: Float32Array;   // SAMPLES+1
    ma: Float32Array;      // SAMPLES+1
    halfW0: number;        // nửa độ dày ở gốc cành
    halfW1: number;        // nửa độ dày ở ngọn cành
    dist0: number;         // quãng đường từ gốc cây tới đầu cành (mix 0)
    len: number;           // độ dài cành (mix 0)
}

export interface PolarLayout {
    theta: Float32Array;       // góc từng node
    leafSpan: Float32Array;    // bề rộng góc của từng node (ngọn = phần góc riêng; node trong = tổng)
    branches: BranchPolar[];   // theo thứ tự node (bỏ gốc) — branchOf[node] = chỉ số
    branchOf: Int32Array;
}

const smooth = (x: number) => x * x * (3 - 2 * x);
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (Math.abs(h) % 1000) / 1000; };

export function layoutPolar(t: EvoTree, times: NodeTimes): PolarLayout {
    const n = t.nodes.length;
    const theta = new Float32Array(n);
    const leafSpan = new Float32Array(n);
    const { R, SPAN_START, SPAN_END, SECTOR_GAP, SAMPLES, BEND, W0, W1, TAPER, ORGANIC } = LAYOUT;
    // --- góc ngọn ---
    const leaves = t.leaves;
    const weight = (i: number) => SECTOR_WEIGHT[t.nodes[i].sector as Exclude<SectorId, 'trunk'>] ?? 1;
    let gaps = 0, wsum = 0;
    leaves.forEach((l, k) => { if (k && t.nodes[leaves[k - 1]].sector !== t.nodes[l].sector) gaps++; wsum += weight(l); });
    const unit = (SPAN_START - SPAN_END - gaps * SECTOR_GAP) / wsum;
    let a = SPAN_START;
    leaves.forEach((l, k) => {
        if (k && t.nodes[leaves[k - 1]].sector !== t.nodes[l].sector) a -= SECTOR_GAP;
        const w = weight(l) * unit;
        theta[l] = a - w / 2;
        leafSpan[l] = w;
        a -= w;
    });
    // --- góc node trong: trung điểm góc các con ---
    for (let i = n - 1; i >= 0; i--) {
        const node = t.nodes[i];
        if (node.isLeaf) continue;
        let lo = Infinity, hi = -Infinity, span = 0;
        for (const c of node.children) { lo = Math.min(lo, theta[c]); hi = Math.max(hi, theta[c]); span += leafSpan[c]; }
        theta[i] = (lo + hi) / 2;
        leafSpan[i] = span;
    }
    // --- cành ---
    const branches: BranchPolar[] = [];
    const branchOf = new Int32Array(n).fill(-1);
    const endDist = new Float64Array(n);
    for (let i = 1; i < n; i++) {
        const node = t.nodes[i];
        const p = node.parent;
        const th = new Float32Array(SAMPLES + 1), ma = new Float32Array(SAMPLES + 1);
        const fp = fracEras(times.ma[p]), fc = fracEras(times.endMa[i]);
        const rp = R * fp, rc = R * fc;
        const straightLen = Math.abs(rc - rp) + Math.abs(theta[i] - theta[p]) * rp;
        const organic = straightLen > 150 ? ORGANIC * Math.min(1, straightLen / 400) : 0;
        const phase = hash(node.id) * Math.PI * 2;
        let len = 0, px = 0, py = 0;
        for (let k = 0; k <= SAMPLES; k++) {
            const s = k / SAMPLES;
            th[k] = theta[p] + (theta[i] - theta[p]) * smooth(Math.min(1, s / BEND)) + organic * Math.sin(Math.PI * s) * Math.sin(9 * s + phase);
            const f = fp + (fc - fp) * s;
            ma[k] = maAtFrac(f, 0);
            const x = R * f * Math.cos(th[k]), y = R * f * Math.sin(th[k]);
            if (k) len += Math.hypot(x - px, y - py);
            px = x; py = y;
        }
        const halfW = W0 + W1 * Math.sqrt(node.leafCount);
        branchOf[i] = branches.length;
        branches.push({ node: i, theta: th, ma, halfW0: halfW * TAPER, halfW1: halfW, dist0: endDist[p], len });
        endDist[i] = endDist[p] + len;
    }
    return { theta, leafSpan, branches, branchOf };
}

export interface Projected {
    nodeXY: Float32Array;     // 2 số / node
    nodeFrac: Float32Array;   // bán kính chuẩn hóa của node
    sampleXY: Float32Array;   // 2 số / mẫu, cành nối tiếp nhau
    sampleFrac: Float32Array; // 1 số / mẫu
}

/** Màn dọc: cây VẪN mọc từ dưới lên (giữ ẩn dụ gốc ở đất, hôm nay là bầu trời) nhưng quạt được kéo giãn theo
 * chiều đứng thành vòm elip để lấp đầy màn cao — bán kính chuẩn hóa (= thời gian) không đổi. */
export const PORTRAIT_STRETCH = 1.7;
export function rotate(o: Orientation, x: number, y: number): [number, number] {
    return o === 'portrait' ? [x, y * PORTRAIT_STRETCH] : [x, y];
}

export function project(t: EvoTree, p: PolarLayout, times: NodeTimes, mix: number, o: Orientation, out?: Projected): Projected {
    const n = t.nodes.length, S = LAYOUT.SAMPLES + 1, R = LAYOUT.R;
    const pr = out ?? {
        nodeXY: new Float32Array(n * 2), nodeFrac: new Float32Array(n),
        sampleXY: new Float32Array(p.branches.length * S * 2), sampleFrac: new Float32Array(p.branches.length * S),
    };
    for (let i = 0; i < n; i++) {
        const f = frac(times.ma[i], mix);
        const [x, y] = rotate(o, R * f * Math.cos(p.theta[i]), R * f * Math.sin(p.theta[i]));
        pr.nodeXY[i * 2] = x; pr.nodeXY[i * 2 + 1] = y; pr.nodeFrac[i] = f;
    }
    p.branches.forEach((b, bi) => {
        for (let k = 0; k < S; k++) {
            const f = frac(b.ma[k], mix);
            const [x, y] = rotate(o, R * f * Math.cos(b.theta[k]), R * f * Math.sin(b.theta[k]));
            const j = bi * S + k;
            pr.sampleXY[j * 2] = x; pr.sampleXY[j * 2 + 1] = y; pr.sampleFrac[j] = f;
        }
    });
    return pr;
}

export interface RibbonBuffers {
    position: Float32Array; normal: Float32Array; halfW: Float32Array; side: Float32Array; s: Float32Array; frac: Float32Array;
    dist: Float32Array; branch: Float32Array; color: Float32Array; index: Uint32Array;
}

function hexToRgb(hex: string): [number, number, number] {
    const v = parseInt(hex.slice(1), 16);
    return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

/** Màu phát sáng của sector (sRGB 0..1). */
export function sectorRgb(sector: SectorId): [number, number, number] { return hexToRgb(SECTOR_COLOR[sector]); }

export function buildRibbon(t: EvoTree, p: PolarLayout, pr: Projected): RibbonBuffers {
    const S = LAYOUT.SAMPLES + 1, B = p.branches.length, V = B * S * 2;
    const buf: RibbonBuffers = {
        position: new Float32Array(V * 3), normal: new Float32Array(V * 2), halfW: new Float32Array(V), side: new Float32Array(V), s: new Float32Array(V), frac: new Float32Array(V),
        dist: new Float32Array(V), branch: new Float32Array(V), color: new Float32Array(V * 3),
        index: new Uint32Array(B * (S - 1) * 6),
    };
    let ii = 0;
    p.branches.forEach((b, bi) => {
        const node = t.nodes[b.node];
        const cA = sectorRgb(t.nodes[node.parent].sector); // thân trắng xanh → màu sector: cành "chuyển màu" dần
        const cB = sectorRgb(node.sector);
        for (let k = 0; k < S; k++) {
            const s = k / (S - 1);
            for (let side = 0; side < 2; side++) {
                const v = (bi * S + k) * 2 + side;
                buf.side[v] = side ? 1 : -1;
                buf.s[v] = s;
                buf.dist[v] = b.dist0 + b.len * s;
                buf.branch[v] = bi;
                for (let c = 0; c < 3; c++) buf.color[v * 3 + c] = cA[c] + (cB[c] - cA[c]) * smooth(s);
            }
            if (k < S - 1) {
                const a0 = (bi * S + k) * 2;
                buf.index.set([a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2], ii);
                ii += 6;
            }
        }
    });
    updateRibbon(buf, p, pr);
    return buf;
}

/** Cập nhật vị trí + frac (khi đổi hướng màn hoặc morph thang thời gian). */
export function updateRibbon(buf: RibbonBuffers, p: PolarLayout, pr: Projected): void {
    const S = LAYOUT.SAMPLES + 1;
    p.branches.forEach((b, bi) => {
        for (let k = 0; k < S; k++) {
            const j = bi * S + k;
            const k0 = Math.max(0, k - 1), k1 = Math.min(S - 1, k + 1);
            let tx = pr.sampleXY[(bi * S + k1) * 2] - pr.sampleXY[(bi * S + k0) * 2];
            let ty = pr.sampleXY[(bi * S + k1) * 2 + 1] - pr.sampleXY[(bi * S + k0) * 2 + 1];
            const L = Math.hypot(tx, ty) || 1;
            tx /= L; ty /= L;
            const w = b.halfW0 + (b.halfW1 - b.halfW0) * (k / (S - 1));
            const x = pr.sampleXY[j * 2], y = pr.sampleXY[j * 2 + 1];
            for (let side = 0; side < 2; side++) {
                const v = j * 2 + side, sg = side ? 1 : -1;
                buf.position[v * 3] = x - ty * w * sg;
                buf.position[v * 3 + 1] = y + tx * w * sg;
                buf.position[v * 3 + 2] = 0;
                buf.normal[v * 2] = -ty * sg;
                buf.normal[v * 2 + 1] = tx * sg;
                buf.halfW[v] = w;
                buf.frac[v] = pr.sampleFrac[j];
            }
        }
    });
}

/** Bán kính ngọn (đơn vị thế giới). */
export function tipRadius(p: PolarLayout, i: number): number {
    return Math.min(LAYOUT.TIP_MAX, LAYOUT.TIP_FRAC * LAYOUT.R * p.leafSpan[i]);
}

/** Hộp bao cây con của node i (gồm cả các mẫu cành bên dưới). */
export function subtreeBounds(t: EvoTree, p: PolarLayout, pr: Projected, i: number): [number, number, number, number] {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const S = LAYOUT.SAMPLES + 1;
    const add = (x: number, y: number) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
    add(pr.nodeXY[i * 2], pr.nodeXY[i * 2 + 1]);
    const walk = (c: number) => {
        const bi = p.branchOf[c];
        if (bi >= 0 && c !== i) for (let k = 0; k < S; k += 4) add(pr.sampleXY[(bi * S + k) * 2], pr.sampleXY[(bi * S + k) * 2 + 1]);
        add(pr.nodeXY[c * 2], pr.nodeXY[c * 2 + 1]);
        t.nodes[c].children.forEach(walk);
    };
    walk(i);
    return [minX, minY, maxX, maxY];
}

/** Điểm trên cành (dẫn tới node i) tại bán kính chuẩn hóa f — dùng cho ngọn "cưỡi" mặt trước thời gian. */
export function pointOnBranchAtFrac(p: PolarLayout, pr: Projected, i: number, f: number): [number, number] {
    const bi = p.branchOf[i];
    const S = LAYOUT.SAMPLES + 1;
    if (bi < 0) return [pr.nodeXY[i * 2], pr.nodeXY[i * 2 + 1]];
    const base = bi * S;
    let lo = 0, hi = S - 1;
    if (f >= pr.sampleFrac[base + hi]) return [pr.sampleXY[(base + hi) * 2], pr.sampleXY[(base + hi) * 2 + 1]];
    if (f <= pr.sampleFrac[base]) return [pr.sampleXY[base * 2], pr.sampleXY[base * 2 + 1]];
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pr.sampleFrac[base + m] < f) lo = m; else hi = m; }
    const f0 = pr.sampleFrac[base + lo], f1 = pr.sampleFrac[base + hi];
    const u = f1 > f0 ? (f - f0) / (f1 - f0) : 0;
    return [
        pr.sampleXY[(base + lo) * 2] + (pr.sampleXY[(base + hi) * 2] - pr.sampleXY[(base + lo) * 2]) * u,
        pr.sampleXY[(base + lo) * 2 + 1] + (pr.sampleXY[(base + hi) * 2 + 1] - pr.sampleXY[(base + lo) * 2 + 1]) * u,
    ];
}

/** Hộp bao toàn quạt theo hướng màn. */
export function fanBounds(o: Orientation): [number, number, number, number] {
    const R = LAYOUT.R;
    const lx = -R * 1.02, hx = R * 1.02, ly = -R * 0.06, hy = R * 1.02;
    if (o === 'landscape') return [lx, ly, hx, hy];
    return [lx, ly * PORTRAIT_STRETCH, hx, hy * PORTRAIT_STRETCH];
}
