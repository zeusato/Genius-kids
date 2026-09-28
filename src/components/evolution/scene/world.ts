// Trạng thái dùng chung của cảnh (KHÔNG phải React state): bố cục đã chiếu, ribbon, texture trạng thái
// từng cành/từng node, uniform chung, hoạt ảnh chọn/dòng dõi/hóa đá/morph thang thời gian.
// Mọi thay đổi theo frame đi qua đây (useFrame gọi world.update) — không setState theo frame.
import * as THREE from 'three';
import { EVOLUTION_TREE_DATA } from '../../../data/evolutionData';
import { EXTINCT } from '../../../data/evolution/times';
import { TEXTBOOK_GROUPS, TextbookGroup } from '../../../data/evolution/overlays';
import { buildTree, EvoTree, pathToRoot, idx } from '../engine/tree';
import { NodeTimes, resolveTimes } from '../engine/times';
import { buildFracLUT, frac, maAtFrac } from '../engine/timeScale';
import { TIME_EVENTS } from '../../../data/evolution/events';
import {
    buildRibbon, fanBounds, layoutPolar, LAYOUT, Orientation, pointOnBranchAtFrac, PolarLayout, project, Projected,
    RibbonBuffers, subtreeBounds, tipRadius, updateRibbon,
} from '../engine/layout';

export interface AtlasInfo { size: number; cell: number; cols: number; items: Record<string, { i: number; aspect: number; rep?: string }> }

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const LUT_SIZE = 2048;
const NAVY = new THREE.Color('#0a1428');
const RUST = new THREE.Color('#4a2414');

export class EvoWorld {
    readonly tree: EvoTree;
    readonly times: NodeTimes;
    readonly polar: PolarLayout;
    readonly ribbon: RibbonBuffers;
    readonly ribbonColorLinear: Float32Array;
    pr: Projected;
    orientation: Orientation;
    /** 0 = mỗi đại một vòng, 1 = thời gian thật */
    mix: number;
    private mixFrom = 0;
    private mixTo = 0;
    private mixT = 1;
    /** Thời điểm cỗ máy thời gian (Ma, 0 = hôm nay). */
    nowMa = 0;
    /** Đang xem quá khứ (cỗ máy thời gian / mở màn) → ngọn "cưỡi" mặt trước thời gian. */
    timeActive = false;
    /** Hoạt ảnh thời gian: chạy đều theo bán kính (không theo năm) để cây "mọc" với tốc độ đều mắt. */
    private timeAnim: { fromF: number; toF: number; dur: number; t: number; done?: () => void } | null = null;
    private lastNowMa = 0;
    /** Gọi khi thời gian đi qua mốc sự kiện theo chiều về hiện tại. */
    onEvent: ((eventId: string) => void) | null = null;
    /** Tăng mỗi khi vị trí thay đổi (đổi hướng màn, morph) — component so sánh để cập nhật buffer. */
    geometryVersion = 0;

    readonly branchCount: number;
    readonly branchState: Uint8Array;     // RGBA: dòng dõi phủ, mờ, hóa đá, nhấp nháy
    readonly branchTex: THREE.DataTexture;
    readonly overlayData: Uint8Array;     // RGBA: màu + mặt nạ lớp phủ
    readonly overlayTex: THREE.DataTexture;
    readonly lut: Float32Array;
    readonly lutTex: THREE.DataTexture;
    private petrify: Float32Array;
    private dim: Float32Array;
    private fill: Float32Array;

    readonly uniforms = {
        uTime: { value: 0 },
        uNowFrac: { value: 1.001 },
        uFrontOn: { value: 0 },
        uTier: { value: 1 },
        uPxPerUnit: { value: 1 },
        uWind: { value: 0.6 },
        uOrient: { value: 0 },
        uShock: { value: new THREE.Vector2(0, 0) },     // x = bán kính chuẩn hóa, y = cường độ
        uSkyTint: { value: new THREE.Color('#0a1428') },
        uFrost: { value: 0 },
        uOverlayOn: { value: 0 },
        uR: { value: LAYOUT.R },
    };

    // chọn node
    selected: number | null = null;
    private lineage: number[] = [];               // chỉ số cành từ gốc → node
    private inSubtree = new Uint8Array(0);
    private selT = 1;
    private pulseSet = new Set<number>();
    private pulseT = 0;
    overlay: TextbookGroup | null = null;
    private overlayMembers = new Uint8Array(0);

    /** Vị trí hiện tại của từng node (2 số) + hiển thị (0/1) — Tips/Knots đọc mỗi frame. */
    readonly nodePos: Float32Array;
    readonly nodeVisible: Float32Array;
    readonly tipR: Float32Array;
    readonly youAreHere: number;

    constructor(orientation: Orientation, mix = 0) {
        this.tree = buildTree(EVOLUTION_TREE_DATA);
        this.times = resolveTimes(this.tree);
        this.polar = layoutPolar(this.tree, this.times);
        this.orientation = orientation;
        this.mix = mix; this.mixTo = mix;
        this.pr = project(this.tree, this.polar, this.times, mix, orientation);
        this.ribbon = buildRibbon(this.tree, this.polar, this.pr);
        this.ribbonColorLinear = this.ribbon.color.map(srgbToLinear);
        this.branchCount = this.polar.branches.length;
        this.branchState = new Uint8Array(this.branchCount * 4);
        this.branchTex = new THREE.DataTexture(this.branchState, this.branchCount, 1, THREE.RGBAFormat);
        this.branchTex.needsUpdate = true;
        this.overlayData = new Uint8Array(this.branchCount * 4);
        this.overlayTex = new THREE.DataTexture(this.overlayData, this.branchCount, 1, THREE.RGBAFormat);
        this.overlayTex.needsUpdate = true;
        this.lut = buildFracLUT(mix, LUT_SIZE);
        this.lutTex = new THREE.DataTexture(this.lut, LUT_SIZE, 1, THREE.RedFormat, THREE.FloatType);
        this.lutTex.minFilter = this.lutTex.magFilter = THREE.NearestFilter;
        this.lutTex.needsUpdate = true;
        this.petrify = new Float32Array(this.branchCount);
        this.dim = new Float32Array(this.branchCount);
        this.fill = new Float32Array(this.branchCount);
        const n = this.tree.nodes.length;
        this.nodePos = new Float32Array(n * 2);
        this.nodeVisible = new Float32Array(n).fill(1);
        this.tipR = new Float32Array(n);
        for (const nd of this.tree.nodes) this.tipR[nd.i] = nd.isLeaf ? tipRadius(this.polar, nd.i) : 2 + 0.8 * Math.sqrt(nd.leafCount);
        this.youAreHere = idx(this.tree, 'humans');
        this.uniforms.uOrient.value = orientation === 'portrait' ? 1 : 0;
        // nhóm tuyệt chủng hóa đá ngay từ đầu (đang ở "hôm nay")
        for (const id of Object.keys(EXTINCT)) this.petrify[this.polar.branchOf[idx(this.tree, id)]] = 1;
        this.syncNodePositions();
        this.writeState();
    }

    // ---------- hình học ----------
    setOrientation(o: Orientation) {
        if (o === this.orientation) return;
        this.orientation = o;
        this.uniforms.uOrient.value = o === 'portrait' ? 1 : 0;
        this.reproject();
    }

    /** Morph thang thời gian (1,2 s). */
    setMixTarget(target: 0 | 1) {
        if (target === this.mixTo && this.mixT >= 1) return;
        this.mixFrom = this.mix; this.mixTo = target; this.mixT = 0;
    }
    get mixTarget() { return this.mixTo; }

    private reproject() {
        this.pr = project(this.tree, this.polar, this.times, this.mix, this.orientation, this.pr);
        updateRibbon(this.ribbon, this.polar, this.pr);
        buildFracLUT(this.mix, LUT_SIZE, this.lut);
        this.lutTex.needsUpdate = true;
        this.geometryVersion++;
    }

    bounds(): [number, number, number, number] { return fanBounds(this.orientation); }
    subtreeBox(i: number) { return subtreeBounds(this.tree, this.polar, this.pr, i); }

    fracOf(ma: number) { return frac(ma, this.mix); }

    // ---------- chọn / lớp phủ / nhấp nháy ----------
    select(i: number | null) {
        this.selected = i;
        this.selT = 0;
        const n = this.tree.nodes.length;
        this.inSubtree = new Uint8Array(n);
        this.lineage = [];
        if (i === null) return;
        this.lineage = pathToRoot(this.tree, i).reverse().slice(1).map(k => this.polar.branchOf[k]);
        const mark = (k: number) => { this.inSubtree[k] = 1; this.tree.nodes[k].children.forEach(mark); };
        mark(i);
    }

    setOverlay(groupId: string | null) {
        this.overlay = groupId ? TEXTBOOK_GROUPS.find(g => g.id === groupId) ?? null : null;
        const n = this.tree.nodes.length;
        this.overlayMembers = new Uint8Array(n);
        this.overlayData.fill(0);
        if (this.overlay) {
            const parts = this.overlay.parts ?? [{ label: this.overlay.label, color: this.overlay.color, members: this.overlay.members ?? [] }];
            for (const part of parts) {
                const c = new THREE.Color(part.color);
                const mark = (k: number) => {
                    this.overlayMembers[k] = 1;
                    const b = this.polar.branchOf[k];
                    if (b >= 0) {
                        this.overlayData[b * 4] = Math.round(c.r * 255);
                        this.overlayData[b * 4 + 1] = Math.round(c.g * 255);
                        this.overlayData[b * 4 + 2] = Math.round(c.b * 255);
                        this.overlayData[b * 4 + 3] = 255;
                    }
                    this.tree.nodes[k].children.forEach(mark);
                };
                for (const id of part.members) mark(idx(this.tree, id));
            }
        }
        this.overlayTex.needsUpdate = true;
        this.uniforms.uOverlayOn.value = this.overlay ? 1 : 0;
    }

    pulse(ids: string[]) {
        this.pulseSet = new Set(ids.map(id => idx(this.tree, id)));
        this.pulseT = 0;
    }

    isVisibleNode(i: number) { return this.nodeVisible[i] > 0.5; }
    isDimmed(i: number) { const b = this.polar.branchOf[i]; return b >= 0 && this.branchState[b * 4 + 1] > 128; }

    /** Chọn node gần điểm (tọa độ cây) nhất: ngọn > nút > cành. null nếu không trúng. */
    pick(x: number, y: number, ppu: number): number | null {
        const t = this.tree;
        let best: number | null = null, bestD = Infinity, bestPri = 9;
        const consider = (i: number, d: number, pri: number) => { if (pri < bestPri || (pri === bestPri && d < bestD)) { best = i; bestD = d; bestPri = pri; } };
        for (const n of t.nodes) {
            if (!this.isVisibleNode(n.i) || n.i === 0) continue;
            const dx = this.nodePos[n.i * 2] - x, dy = this.nodePos[n.i * 2 + 1] - y;
            const d = Math.hypot(dx, dy);
            const rPx = Math.max(this.tipR[n.i] * ppu, n.isLeaf ? 22 : 14);
            if (d * ppu <= rPx) consider(n.i, d, n.isLeaf ? 0 : 1);
        }
        if (best !== null) return best;
        const S = LAYOUT.SAMPLES + 1;
        const nowF = this.uniforms.uNowFrac.value;
        this.polar.branches.forEach((b, bi) => {
            const w = Math.max(b.halfW1 * ppu, 10);
            for (let k = 0; k < S; k++) {
                const j = bi * S + k;
                if (this.pr.sampleFrac[j] > nowF) break;
                const d = Math.hypot(this.pr.sampleXY[j * 2] - x, this.pr.sampleXY[j * 2 + 1] - y);
                if (d * ppu <= w) consider(b.node, d, 2);
            }
        });
        return best;
    }

    /** Chạy thời gian tới ma trong dur giây (tuyến tính theo bán kính chuẩn hóa). */
    animateNowTo(ma: number, dur: number, done?: () => void) {
        const fromF = this.nowMa <= 0 ? 1 : frac(this.nowMa, this.mix);
        this.timeAnim = { fromF, toF: ma <= 0 ? 1 : frac(ma, this.mix), dur: Math.max(0.01, dur), t: 0, done };
    }
    stopTimeAnim() { this.timeAnim = null; }
    get timeAnimating() { return !!this.timeAnim; }
    setNow(ma: number) { this.timeAnim = null; this.nowMa = Math.max(0, Math.min(4540, ma)); }

    // ---------- vòng frame ----------
    update(dt: number, elapsed: number) {
        this.uniforms.uTime.value = elapsed;
        if (this.mixT < 1) {
            this.mixT = Math.min(1, this.mixT + dt / 1.2);
            const e = this.mixT < 0.5 ? 2 * this.mixT * this.mixT : 1 - Math.pow(-2 * this.mixT + 2, 2) / 2;
            this.mix = this.mixFrom + (this.mixTo - this.mixFrom) * e;
            this.reproject();
        }
        if (this.timeAnim) {
            const a = this.timeAnim;
            a.t = Math.min(1, a.t + dt / a.dur);
            const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2;
            const f = a.fromF + (a.toF - a.fromF) * e;
            this.nowMa = f >= 0.9999 ? 0 : maAtFrac(f, this.mix);
            if (a.t >= 1) { this.timeAnim = null; a.done?.(); }
        }
        if (this.onEvent && this.nowMa < this.lastNowMa) {
            for (const ev of TIME_EVENTS) if (this.lastNowMa > ev.ma && this.nowMa <= ev.ma) this.onEvent(ev.id);
        }
        this.lastNowMa = this.nowMa;
        const nowFrac = this.nowMa <= 0 ? 1.001 : frac(this.nowMa, this.mix);
        this.uniforms.uNowFrac.value = nowFrac;
        this.uniforms.uFrontOn.value += ((this.timeActive && this.nowMa > 0 ? 1 : 0) - this.uniforms.uFrontOn.value) * Math.min(1, dt * 6);
        // hóa đá: nhóm tuyệt chủng hóa đá khi thời gian đã qua mốc tuyệt chủng
        const k = Math.min(1, dt / 1.2);
        for (const [id, e] of Object.entries(EXTINCT)) {
            const b = this.polar.branchOf[idx(this.tree, id)];
            const target = this.nowMa <= e.endMa ? 1 : 0;
            this.petrify[b] += (target - this.petrify[b]) * (target > this.petrify[b] ? k * 1.6 : 1);
        }
        // dòng dõi phủ dần từ gốc tới node (0,9 s), phần còn lại mờ đi
        this.selT = Math.min(1, this.selT + dt / 0.9);
        const L = this.lineage.length;
        const lineageSet = new Set(this.lineage);
        for (let b = 0; b < this.branchCount; b++) {
            const pos = this.lineage.indexOf(b);
            const fillTarget = pos >= 0 ? Math.min(1, Math.max(0, this.selT * L - pos)) : 0;
            this.fill[b] = pos >= 0 ? fillTarget : this.fill[b] * Math.max(0, 1 - dt * 5);
            const node = this.polar.branches[b].node;
            let dimT = 0;
            if (this.selected !== null && !lineageSet.has(b) && !this.inSubtree[node]) dimT = 1;
            if (this.overlay && !this.overlayMembers[node]) dimT = Math.max(dimT, 0.8);
            this.dim[b] += (dimT - this.dim[b]) * Math.min(1, dt * 5);
        }
        if (this.pulseSet.size) this.pulseT += dt;
        const pulse = this.pulseSet.size ? 0.5 + 0.5 * Math.sin(this.pulseT * 7) : 0;
        if (this.pulseT > 4) { this.pulseSet.clear(); }
        for (let b = 0; b < this.branchCount; b++) {
            const node = this.polar.branches[b].node;
            this.branchState[b * 4] = Math.round(this.fill[b] * 255);
            this.branchState[b * 4 + 1] = Math.round(this.dim[b] * 255);
            this.branchState[b * 4 + 2] = Math.round(this.petrify[b] * 255);
            this.branchState[b * 4 + 3] = this.pulseSet.has(node) ? Math.round(pulse * 255) : 0;
        }
        this.branchTex.needsUpdate = true;
        // không khí có ôxi (2,4–2 tỷ năm), Trái Đất quả cầu tuyết (717–635), sóng xung kích 66 triệu năm
        const ss = THREE.MathUtils.smoothstep;
        const rust = this.timeActive ? ss(this.nowMa, 2000, 2400) : 0;
        this.uniforms.uSkyTint.value.copy(NAVY).lerp(RUST, rust * 0.9);
        const frost = this.timeActive ? ss(this.nowMa, 615, 640) * (1 - ss(this.nowMa, 712, 740)) : 0;
        this.uniforms.uFrost.value += (frost - this.uniforms.uFrost.value) * Math.min(1, dt * 4);
        if (this.shockT < 1) {
            this.shockT = Math.min(1, this.shockT + dt / 1.6);
            const f66 = frac(66, this.mix);
            this.uniforms.uShock.value.set(f66 + (1.04 - f66) * Math.sqrt(this.shockT), 1 - this.shockT);
        } else this.uniforms.uShock.value.y = 0;
        this.syncNodePositions(nowFrac);
    }

    private shockT = 1;
    triggerShock() { this.shockT = 0; }

    /** trạng thái node cho Tips: [chọn, mờ, hóa đá, nhấp nháy] 0..1 */
    nodeStateOf(i: number, out: number[]) {
        const b = this.polar.branchOf[i];
        out[0] = this.selected === i ? 1 : 0;
        out[1] = b >= 0 ? this.branchState[b * 4 + 1] / 255 : 0;
        out[2] = b >= 0 ? this.branchState[b * 4 + 2] / 255 : 0;
        out[3] = b >= 0 ? this.branchState[b * 4 + 3] / 255 : 0;
        return out;
    }

    private writeState() {
        for (let b = 0; b < this.branchCount; b++) this.branchState[b * 4 + 2] = Math.round(this.petrify[b] * 255);
        this.branchTex.needsUpdate = true;
    }

    private syncNodePositions(nowFrac = 1.001) {
        const t = this.tree;
        for (const nd of t.nodes) {
            const i = nd.i;
            let x = this.pr.nodeXY[i * 2], y = this.pr.nodeXY[i * 2 + 1];
            let vis = 1;
            if (this.timeActive || nowFrac <= 1) {
                const fSelf = this.pr.nodeFrac[i];
                const fParent = nd.parent >= 0 ? this.pr.nodeFrac[nd.parent] : 0;
                if (nd.isLeaf) {
                    vis = fParent <= nowFrac ? 1 : 0;
                    if (fSelf > nowFrac) [x, y] = pointOnBranchAtFrac(this.polar, this.pr, i, nowFrac);
                } else vis = fSelf <= nowFrac ? 1 : 0;
            }
            this.nodePos[i * 2] = x; this.nodePos[i * 2 + 1] = y;
            this.nodeVisible[i] = vis;
        }
    }
}
