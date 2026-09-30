import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Part, postIds } from '../engine/circuit';
import type { Glyph } from './materials';

/**
 * Nét mực cho góc nhìn Sơ đồ (kí hiệu theo SGK/IEC). Tọa độ 2D: x dọc theo hai cọc, y hướng lên màn hình
 * (= −z cục bộ). Hàm thuần: cùng linh kiện → cùng nét.
 */
export type P2 = [number, number];
export interface Stroke { points: P2[]; width: number; closed?: boolean }
export interface SymbolSpec { strokes: Stroke[]; dots: { at: P2; r: number }[]; glyphs: { ch: Glyph; at: P2; size: number }[] }

const W = 0.065;
const line = (a: P2, b: P2, width = W): Stroke => ({ points: [a, b], width });
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 28): P2[] => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as P2; });
const circle = (cx: number, cy: number, r: number, width = W): Stroke => ({ points: arc(cx, cy, r, 0, Math.PI * 2, 40).slice(0, -1), width, closed: true });
const rect = (cx: number, cy: number, w: number, h: number, width = W): Stroke => ({ points: [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]], width, closed: true });

export function symbolFor(part: Part): SymbolSpec {
    const s: SymbolSpec = { strokes: [], dots: [], glyphs: [] };
    const leads = (inner: number) => { s.strokes.push(line([-0.8, 0], [-inner, 0]), line([inner, 0], [0.8, 0])); };
    switch (part.kind) {
        case 'battery': case 'lemon': case 'potato': {
            const cells = part.kind === 'battery' ? (part.cells ?? []) : [{ polarity: 1 as const, present: true, charge01: 1 }];
            const n = Math.max(1, cells.length), pitch = 0.3, span = (n - 1) * pitch + 0.14;
            s.strokes.push(line([-0.8, 0], [-span / 2, 0]), line([span / 2, 0], [0.8, 0]));
            cells.forEach((cell, i) => {
                const x = -span / 2 + i * pitch, long = cell.polarity === 1 ? x + 0.14 : x, short = cell.polarity === 1 ? x : x + 0.14;
                if (!cell.present) { s.strokes.push({ points: [[x, 0.12], [x + 0.14, -0.12]], width: 0.03 }); return; }
                s.strokes.push(line([long, -0.3], [long, 0.3], 0.05), line([short, -0.15], [short, 0.15], 0.13));
                if (i < n - 1) s.strokes.push(line([x + 0.14, 0], [x + pitch, 0]));
                if (i === n - 1 || n === 1) s.glyphs.push({ ch: '+', at: [(cell.polarity === 1 ? long : short) + (cell.polarity === 1 ? 0.14 : -0.14), 0.36], size: 0.26 });
            });
            break;
        }
        case 'bulb': {
            leads(0.34); s.strokes.push(circle(0, 0, 0.34));
            const k = 0.34 * Math.SQRT1_2; s.strokes.push(line([-k, -k], [k, k], 0.055), line([-k, k], [k, -k], 0.055));
            break;
        }
        case 'switch': {
            leads(0.42); s.dots.push({ at: [-0.42, 0], r: 0.075 }, { at: [0.42, 0], r: 0.075 });
            const closed = part.actuator === 'doorContact' ? !part.doorClosed : !!part.closed;
            s.strokes.push(line([-0.42, 0], closed ? [0.42, 0] : [0.36, 0.34]));
            break;
        }
        case 'button': {
            leads(0.36); s.dots.push({ at: [-0.36, 0], r: 0.07 }, { at: [0.36, 0], r: 0.07 });
            const y = part.closed ? 0.04 : 0.2;
            s.strokes.push(line([-0.38, y], [0.38, y]), line([0, y], [0, y + 0.24]));
            break;
        }
        case 'spdt': {
            s.strokes.push(line([-0.8, 0], [-0.4, 0]), line([0.46, 0.45], [0.8, 0.45]), line([0.46, -0.45], [0.8, -0.45]));
            s.dots.push({ at: [-0.4, 0], r: 0.075 }, { at: [0.46, 0.45], r: 0.075 }, { at: [0.46, -0.45], r: 0.075 });
            s.strokes.push(line([-0.4, 0], part.position ? [0.44, -0.4] : [0.44, 0.4]));
            break;
        }
        case 'led': {
            leads(0.22); s.strokes.push({ points: [[-0.22, 0.24], [0.2, 0], [-0.22, -0.24]], width: W, closed: true }, line([0.2, -0.24], [0.2, 0.24]));
            for (const dx of [0, 0.16]) s.strokes.push(line([0.02 + dx, 0.24], [0.2 + dx, 0.42], 0.04), { points: [[0.12 + dx, 0.41], [0.2 + dx, 0.42], [0.19 + dx, 0.34]], width: 0.04 });
            break;
        }
        case 'resistor': case 'sample': leads(0.34); s.strokes.push(rect(0, 0, 0.68, 0.24)); break;
        case 'rheostat': leads(0.34); s.strokes.push(rect(0, 0, 0.68, 0.24), line([-0.32, -0.3], [0.3, 0.3], 0.045), { points: [[0.18, 0.28], [0.3, 0.3], [0.28, 0.18]], width: 0.045 }); break;
        case 'fuse': leads(0.32); s.strokes.push(rect(0, 0, 0.64, 0.22), line([-0.32, 0], [0.32, 0], 0.04)); break;
        case 'ammeter': case 'voltmeter': case 'motor': case 'generator':
            leads(0.32); s.strokes.push(circle(0, 0, 0.32));
            s.glyphs.push({ ch: part.kind === 'ammeter' ? 'A' : part.kind === 'voltmeter' ? 'V' : part.kind === 'motor' ? 'M' : 'G', at: [0, 0], size: 0.42 });
            break;
        case 'bell': case 'buzzer':
            leads(0.34); s.strokes.push({ points: [...arc(0, 0, 0.34, 0, Math.PI, 24)], width: W }, line([-0.34, 0], [0.34, 0]));
            if (part.kind === 'bell') s.strokes.push(line([0, 0], [0.1, -0.2], 0.04)); else s.strokes.push(line([-0.12, 0.06], [-0.12, 0.2], 0.04), line([0.12, 0.06], [0.12, 0.2], 0.04));
            break;
        case 'electromagnet': {
            leads(0.36);
            const humps: P2[] = []; for (let k = 0; k < 4; k++) humps.push(...arc(-0.27 + k * 0.18, 0, 0.09, Math.PI, 0, 10));
            s.strokes.push({ points: humps, width: 0.05 }, line([-0.38, -0.16], [0.38, -0.16], 0.05));
            break;
        }
        case 'junction': s.dots.push({ at: [0, 0], r: 0.11 }); break;
    }
    return s;
}

/** Dải băng phẳng (tam giác) cho một nét, nối góc kiểu miter có giới hạn. */
export function strokeGeometry(st: Stroke, y: number): THREE.BufferGeometry {
    const pts = st.points, n = pts.length, pos: number[] = [], idx: number[] = [];
    const seg = (i: number) => { const a = pts[(i + n) % n], b = pts[(i + 1 + n) % n]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l] as P2; };
    for (let i = 0; i < n; i++) {
        const hasPrev = st.closed || i > 0, hasNext = st.closed || i < n - 1;
        const n1 = hasPrev ? seg(i - 1) : seg(i), n2 = hasNext ? seg(i) : seg(i - 1);
        let mx = n1[0] + n2[0], my = n1[1] + n2[1]; const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
        const scale = (st.width / 2) / Math.max(0.35, mx * n1[0] + my * n1[1]);
        let [px, py] = pts[i];
        // Kéo dài hai đầu nét hở nửa bề rộng để nối liền với nét khác.
        if (!st.closed && (i === 0 || i === n - 1)) { const t = i === 0 ? seg(0) : seg(n - 2), dir = i === 0 ? -1 : 1; px += -t[1] * -dir * st.width / 2 * -1; py += t[0] * -dir * st.width / 2 * -1; }
        pos.push(px + mx * scale, y, -(py + my * scale), px - mx * scale, y, -(py - my * scale));
    }
    const segs = st.closed ? n : n - 1;
    for (let i = 0; i < segs; i++) { const a = i * 2, b = ((i + 1) % n) * 2; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    // Dải băng chỉ cần thấy từ trên xuống; đảm bảo mặt hướng +y cho cả hai chiều quấn.
    g.computeVertexNormals();
    return g;
}

export function discGeometry(at: P2, r: number, y: number) { const g = new THREE.CircleGeometry(r, 20); g.rotateX(-Math.PI / 2); g.translate(at[0], y, -at[1]); return g; }

/** Gộp toàn bộ nét + chấm của một kí hiệu thành một khối (một lượt vẽ). */
export function symbolGeometry(spec: SymbolSpec, y: number): THREE.BufferGeometry | null {
    const list = [...spec.strokes.map(s => strokeGeometry(s, y).toNonIndexed()), ...spec.dots.map(d => discGeometry(d.at, d.r, y).toNonIndexed())];
    if (!list.length) return null;
    list.forEach(g => { for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k); });
    return mergeGeometries(list);
}

/** Chấm nối (junction): cọc có từ hai dây trở lên, tức ≥ 3 vật dẫn gặp nhau. Chỉ dựa trên kết nối thật. */
export function junctionPosts(parts: Part[], wires: { a: { partId: string; postId: string }; b: { partId: string; postId: string } }[]) {
    const count = new Map<string, number>();
    for (const w of wires) for (const e of [w.a, w.b]) count.set(`${e.partId}:${e.postId}`, (count.get(`${e.partId}:${e.postId}`) ?? 0) + 1);
    return parts.flatMap(p => postIds(p).filter(id => (count.get(`${p.id}:${id}`) ?? 0) >= (p.kind === 'junction' ? 3 : 2)).map(id => ({ partId: p.id, postId: id })));
}
