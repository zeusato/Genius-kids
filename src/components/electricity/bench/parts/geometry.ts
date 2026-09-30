import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Hình học dùng chung cho mọi linh kiện (tạo lười, một lần mỗi phiên). Kích thước theo lưới bàn:
 * thân ≤ 2,1 × 1,3 ô, hai cọc ở x = ±0,8, mặt đế cao 0,26.
 */
export const BASE_TOP = 0.26;
const cache = new Map<string, THREE.BufferGeometry>();
function get(name: string, make: () => THREE.BufferGeometry) {
    let g = cache.get(name);
    if (!g) { g = make(); cache.set(name, g); }
    return g;
}
const lifted = (g: THREE.BufferGeometry, y: number) => { g.translate(0, y, 0); return g; };
/** Đường cong cho bằng một hàm (lò xo, dây tóc, cuộn dây). */
class FnCurve extends THREE.Curve<THREE.Vector3> {
    constructor(private f: (t: number, v: THREE.Vector3) => THREE.Vector3) { super(); }
    getPoint(t: number, v = new THREE.Vector3()) { return this.f(t, v); }
}

export const GEO = {
    base: () => get('base', () => lifted(new RoundedBoxGeometry(2.0, BASE_TOP, 1.12, 4, 0.1), BASE_TOP / 2)),
    baseBattery: () => get('baseBattery', () => lifted(new RoundedBoxGeometry(2.04, 0.3, 1.18, 4, 0.12), 0.15)),
    baseSmall: () => get('baseSmall', () => lifted(new RoundedBoxGeometry(1.8, 0.24, 1.0, 4, 0.1), 0.12)),
    baseRound: () => get('baseRound', () => lifted(new THREE.CylinderGeometry(0.42, 0.46, 0.22, 32), 0.11)),
    well: () => get('well', () => lifted(new RoundedBoxGeometry(1.34, 0.08, 1.0, 3, 0.04), 0.3)),
    /** Cọc đồng: thân + đai ốc lục giác + nắp tròn, gộp một khối để vẽ instanced. */
    post: () => get('post', () => {
        const stem = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 14); stem.translate(0, 0.15, 0);
        const nut = new THREE.CylinderGeometry(0.16, 0.16, 0.09, 6); nut.translate(0, 0.1, 0);
        const cap = new THREE.SphereGeometry(0.11, 16, 10); cap.translate(0, 0.31, 0);
        const merged = mergeGeometries([stem.toNonIndexed(), nut.toNonIndexed(), cap.toNonIndexed()])!;
        merged.computeVertexNormals();
        return merged;
    }),
    lug: () => get('lug', () => { const g = new THREE.TorusGeometry(0.12, 0.034, 8, 20); g.rotateX(Math.PI / 2); return g; }),
    postRing: () => get('postRing', () => { const g = new THREE.RingGeometry(0.2, 0.3, 32); g.rotateX(-Math.PI / 2); return g; }),
    cellBody: () => get('cellBody', () => { const g = new THREE.CylinderGeometry(0.15, 0.15, 0.78, 28); g.rotateX(Math.PI / 2); return g; }),
    cellBand: () => get('cellBand', () => { const g = new THREE.CylinderGeometry(0.154, 0.154, 0.26, 28); g.rotateX(Math.PI / 2); return g; }),
    cellNub: () => get('cellNub', () => { const g = new THREE.CylinderGeometry(0.055, 0.055, 0.05, 16); g.rotateX(Math.PI / 2); return g; }),
    cellDisc: () => get('cellDisc', () => { const g = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 20); g.rotateX(Math.PI / 2); return g; }),
    spring: () => get('spring', () => {
        const path = new FnCurve((t, v) => v.set(0.07 * Math.cos(t * Math.PI * 10), 0.07 * Math.sin(t * Math.PI * 10), -0.06 + 0.12 * t));
        return new THREE.TubeGeometry(path, 80, 0.012, 5);
    }),
    socket: () => get('socket', () => lifted(new THREE.CylinderGeometry(0.27, 0.3, 0.34, 28), BASE_TOP + 0.17)),
    socketRing: () => get('socketRing', () => { const g = new THREE.TorusGeometry(0.285, 0.02, 8, 36); g.rotateX(Math.PI / 2); return g; }),
    /** Bầu thủy tinh tiện theo profile bóng tròn cổ điển. */
    glass: () => get('glass', () => {
        const prof = [[0.23, 0], [0.25, 0.08], [0.31, 0.2], [0.43, 0.38], [0.5, 0.56], [0.49, 0.71], [0.42, 0.85], [0.28, 0.94], [0.0, 0.98]]
            .map(([r, y]) => new THREE.Vector2(r, y));
        return new THREE.LatheGeometry(prof, 44);
    }),
    filament: () => get('filament', () => {
        const helix = new FnCurve((t, v) => v.set(-0.17 + 0.34 * t, 0.045 * Math.sin(t * Math.PI * 14), 0.045 * Math.cos(t * Math.PI * 14)));
        return new THREE.TubeGeometry(helix, 160, 0.011, 5);
    }),
    filamentHalf: () => get('filamentHalf', () => {
        const helix = new FnCurve((t, v) => v.set(-0.17 + 0.13 * t, 0.045 * Math.sin(t * Math.PI * 5.4), 0.045 * Math.cos(t * Math.PI * 5.4)));
        return new THREE.TubeGeometry(helix, 60, 0.011, 5);
    }),
    support: () => get('support', () => new THREE.CylinderGeometry(0.008, 0.008, 0.42, 5)),
    halo: () => get('halo', () => new THREE.SphereGeometry(0.8, 28, 14)),
    pool: () => get('pool', () => { const g = new THREE.PlaneGeometry(3.4, 3.4); g.rotateX(-Math.PI / 2); g.translate(0, 0.02, 0); return g; }),
    strip: () => get('strip', () => new THREE.BoxGeometry(0.42, 0.03, 0.12)),
    hinge: () => get('hinge', () => new THREE.BoxGeometry(0.2, 0.3, 0.3)),
    jaw: () => get('jaw', () => new THREE.BoxGeometry(0.18, 0.32, 0.045)),
    blade: () => get('blade', () => { const g = new THREE.BoxGeometry(1.0, 0.05, 0.12); g.translate(0.5, 0, 0); return g; }),
    handle: () => get('handle', () => { const g = new THREE.CapsuleGeometry(0.11, 0.26, 6, 14); return g; }),
    buttonHousing: () => get('buttonHousing', () => lifted(new THREE.CylinderGeometry(0.34, 0.37, 0.18, 32), BASE_TOP + 0.09)),
    buttonCap: () => get('buttonCap', () => new THREE.CylinderGeometry(0.25, 0.26, 0.14, 32)),
    dome: () => get('dome', () => new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)),
    stand: () => get('stand', () => new THREE.CylinderGeometry(0.05, 0.05, 0.48, 10)),
    coil: () => get('coil', () => { const g = new THREE.CylinderGeometry(0.13, 0.13, 0.36, 18); g.rotateZ(Math.PI / 2); return g; }),
    ball: () => get('ball', () => new THREE.SphereGeometry(0.075, 14, 10)),
    arm: () => get('arm', () => { const g = new THREE.BoxGeometry(0.03, 0.34, 0.03); g.translate(0, 0.17, 0); return g; }),
    buzzerBody: () => get('buzzerBody', () => lifted(new THREE.CylinderGeometry(0.36, 0.37, 0.26, 32), BASE_TOP + 0.13)),
    buzzerTop: () => get('buzzerTop', () => { const g = new THREE.RingGeometry(0.06, 0.3, 32); g.rotateX(-Math.PI / 2); return g; }),
    cradle: () => get('cradle', () => lifted(new RoundedBoxGeometry(0.7, 0.26, 0.6, 3, 0.08), BASE_TOP + 0.13)),
    can: () => get('can', () => { const g = new THREE.CylinderGeometry(0.26, 0.26, 0.6, 28); g.rotateX(Math.PI / 2); return g; }),
    fanBlade: () => get('fanBlade', () => { const g = new THREE.SphereGeometry(0.3, 18, 10); g.scale(0.42, 1, 0.12); g.translate(0, 0.28, 0); return g; }),
    hub: () => get('hub', () => new THREE.SphereGeometry(0.09, 12, 8)),
    ledBody: () => get('ledBody', () => new THREE.CylinderGeometry(0.17, 0.18, 0.26, 24)),
    ledTop: () => get('ledTop', () => new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
    ledRim: () => get('ledRim', () => new THREE.CylinderGeometry(0.2, 0.2, 0.04, 24)),
    leg: () => get('leg', () => new THREE.CylinderGeometry(0.012, 0.012, 1, 6)),
    lead: () => get('lead', () => { const g = new THREE.CylinderGeometry(0.018, 0.018, 1, 6); g.rotateZ(Math.PI / 2); return g; }),
    resistorBody: () => get('resistorBody', () => { const g = new THREE.CapsuleGeometry(0.13, 0.42, 6, 16); g.rotateZ(Math.PI / 2); return g; }),
    band: () => get('band', () => { const g = new THREE.CylinderGeometry(0.137, 0.137, 0.045, 20); g.rotateZ(Math.PI / 2); return g; }),
    rheoCore: () => get('rheoCore', () => { const g = new THREE.CylinderGeometry(0.16, 0.16, 1.2, 24); g.rotateZ(Math.PI / 2); return g; }),
    rheoWinding: () => get('rheoWinding', () => {
        const helix = new FnCurve((t, v) => v.set(-0.58 + 1.16 * t, 0.17 * Math.cos(t * Math.PI * 60), 0.17 * Math.sin(t * Math.PI * 60)));
        return new THREE.TubeGeometry(helix, 900, 0.012, 4);
    }),
    rail: () => get('rail', () => new THREE.BoxGeometry(1.3, 0.04, 0.06)),
    slider: () => get('slider', () => new THREE.BoxGeometry(0.14, 0.2, 0.22)),
    meterBody: () => get('meterBody', () => new RoundedBoxGeometry(1.1, 0.72, 0.26, 4, 0.08)),
    meterFace: () => get('meterFace', () => new THREE.PlaneGeometry(0.92, 0.56)),
    needle: () => get('needle', () => { const g = new THREE.BoxGeometry(0.02, 0.36, 0.01); g.translate(0, 0.18, 0); return g; }),
    fuseCap: () => get('fuseCap', () => { const g = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 18); g.rotateZ(Math.PI / 2); return g; }),
    fuseTube: () => get('fuseTube', () => { const g = new THREE.CylinderGeometry(0.1, 0.1, 0.56, 20, 1, true); g.rotateZ(Math.PI / 2); return g; }),
    fuseWire: () => get('fuseWire', () => { const g = new THREE.CylinderGeometry(0.012, 0.012, 0.56, 5); g.rotateZ(Math.PI / 2); return g; }),
    nail: () => get('nail', () => { const g = new THREE.CylinderGeometry(0.055, 0.055, 1.25, 12); g.rotateZ(Math.PI / 2); return g; }),
    nailHead: () => get('nailHead', () => { const g = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 16); g.rotateZ(Math.PI / 2); return g; }),
    magnetCoil: (turns: number) => get(`magnetCoil${turns}`, () => {
        const helix = new FnCurve((t, v) => v.set(-0.36 + 0.72 * t, 0.085 * Math.cos(t * Math.PI * 2 * turns), 0.085 * Math.sin(t * Math.PI * 2 * turns)));
        return new THREE.TubeGeometry(helix, turns * 14, 0.02, 5);
    }),
    crankArm: () => get('crankArm', () => { const g = new THREE.BoxGeometry(0.08, 0.42, 0.06); g.translate(0, 0.21, 0); return g; }),
    crankKnob: () => get('crankKnob', () => { const g = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12); g.rotateX(Math.PI / 2); return g; }),
    lemon: () => get('lemon', () => { const g = new THREE.SphereGeometry(0.5, 32, 20); g.scale(1.1, 0.72, 0.78); return g; }),
    potato: () => get('potato', () => {
        const g = new THREE.SphereGeometry(0.5, 32, 20); const p = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) {
            const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.07 * Math.sin(x * 9 + y * 4) * Math.cos(z * 7 - y * 3);
            p.setXYZ(i, x * n * 1.15, y * n * 0.72, z * n * 0.82);
        }
        g.computeVertexNormals(); return g;
    }),
    electrode: () => get('electrode', () => new THREE.BoxGeometry(0.2, 0.5, 0.03)),
    clipSleeve: () => get('clipSleeve', () => { const g = new THREE.CapsuleGeometry(0.1, 0.3, 6, 14); g.rotateZ(Math.PI / 2); return g; }),
    clipJaw: () => get('clipJaw', () => new THREE.BoxGeometry(0.34, 0.04, 0.14)),
    sampleRod: () => get('sampleRod', () => { const g = new THREE.CylinderGeometry(0.07, 0.07, 0.72, 14); g.rotateZ(Math.PI / 2); return g; }),
    doorFrame: () => get('doorFrame', () => new THREE.BoxGeometry(0.08, 0.62, 0.08)),
    doorPanel: () => get('doorPanel', () => { const g = new THREE.BoxGeometry(0.72, 0.58, 0.05); g.translate(0.36, 0, 0); return g; }),
    shadowDisc: () => get('shadowDisc', () => { const g = new THREE.CircleGeometry(0.5, 24); g.rotateX(-Math.PI / 2); return g; }),
};

/** Khung viền chọn: chữ nhật bo góc rỗng quanh thân linh kiện. */
export function outlineGeometry(w: number, d: number, r: number, thick: number) {
    const rr = (s: THREE.Path, W: number, D: number, R: number) => {
        s.moveTo(-W / 2 + R, -D / 2); s.lineTo(W / 2 - R, -D / 2); s.quadraticCurveTo(W / 2, -D / 2, W / 2, -D / 2 + R);
        s.lineTo(W / 2, D / 2 - R); s.quadraticCurveTo(W / 2, D / 2, W / 2 - R, D / 2); s.lineTo(-W / 2 + R, D / 2);
        s.quadraticCurveTo(-W / 2, D / 2, -W / 2, D / 2 - R); s.lineTo(-W / 2, -D / 2 + R); s.quadraticCurveTo(-W / 2, -D / 2, -W / 2 + R, -D / 2);
    };
    const shape = new THREE.Shape(); rr(shape, w, d, r);
    const hole = new THREE.Path(); rr(hole, w - thick * 2, d - thick * 2, Math.max(0.01, r - thick)); shape.holes.push(hole);
    const g = new THREE.ShapeGeometry(shape, 10); g.rotateX(-Math.PI / 2); return g;
}
