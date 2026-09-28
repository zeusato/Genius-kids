import * as THREE from 'three';
import { createNoise3, createRandom, Vec3 } from '../noise';
import { merge, tubeThrough } from '../geo';
import { ShellShape, shellRadius } from '../shell';

// === Hình học lưới nội chất (thuần — không React/R3F, test được bằng vitest) ===

// Điểm p có nằm trong vỏ (thu nhỏ theo hệ số k) không
export function insideShell(p: THREE.Vector3, shape: ShellShape, k: number): boolean {
    const len = p.length();
    if (len < 1e-6) return true;
    return len < shellRadius(p.x / len, p.y / len, p.z / len, shape) * k;
}

export interface ERShapeParams {
    nucleusCenter: Vec3;
    nucleusRadius: number;
    facing: Vec3;       // hướng tâm của "chỏm" lưới nội chất hạt (tính từ tâm nhân)
    spread?: number;    // nửa góc phủ (rad)
    seed: string;
    labelDir?: Vec3;
    tubes?: number;
    bounds: ShellShape;  // mặt trong màng tế bào — mọi ống/tấm phải nằm TRONG (lưới nội chất không xuyên màng)
    avoid?: { center: Vec3; radius: number }[]; // vùng cầu không được chui vào (Golgi...)
    reject?: (p: THREE.Vector3) => boolean;      // vùng hình dạng bất kỳ (không bào)
}

export interface ERGeometry {
    sheets: THREE.BufferGeometry;
    smooth: THREE.BufferGeometry;
    ribosomes: THREE.Matrix4[];
    labelPoint: THREE.Vector3;
}

// Lưới nội chất hạt: nhiều tấm màng xếp lớp ôm lấy nhân, gợn sóng, mép rách tự nhiên và có lỗ thủng,
// lấm tấm ribôxôm (nên mới gọi là "hạt"). Lưới nội chất trơn: các ống mảnh tỏa ra tế bào chất.
export function buildER(p: ERShapeParams, high: boolean): ERGeometry {
    const noise = createNoise3(`${p.seed}-er`);
    const rand = createRandom(`${p.seed}-er`);
    const C = new THREE.Vector3(...p.nucleusCenter);
    const F = new THREE.Vector3(...p.facing).normalize();
    const U = new THREE.Vector3().crossVectors(F, Math.abs(F.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
    const V = new THREE.Vector3().crossVectors(F, U);
    const rN = p.nucleusRadius;
    const alphaMax = p.spread ?? 1.95;
    const NA = high ? 44 : 28;
    const NB = high ? 120 : 76;
    const sheetCount = high ? 4 : 3;

    const positions: number[] = [];
    const indices: number[] = [];
    const edgePts: THREE.Vector3[] = [];
    const dir = new THREE.Vector3();
    for (let k = 0; k < sheetCount; k++) {
        const base = positions.length / 3;
        const r0 = rN * (1.2 + k * 0.17);
        const keep: boolean[] = [];
        for (let a = 0; a <= NA; a++) {
            const alpha = (a / NA) * alphaMax;
            for (let b = 0; b <= NB; b++) {
                const beta = (b / NB) * Math.PI * 2;
                dir.copy(F).multiplyScalar(Math.cos(alpha))
                    .addScaledVector(U, Math.cos(beta) * Math.sin(alpha))
                    .addScaledVector(V, Math.sin(beta) * Math.sin(alpha));
                const ripple = rN * (0.055 * Math.sin(beta * 5 + k * 1.3 + alpha * 3.2) + 0.07 * noise(dir.x * 2.2 + k, dir.y * 2.2, dir.z * 2.2 - k));
                const r = r0 + ripple;
                positions.push(C.x + dir.x * r, C.y + dir.y * r, C.z + dir.z * r);
                const edge = alpha / alphaMax + 0.28 * noise(dir.x * 1.7 + k * 7, dir.y * 1.7, dir.z * 1.7);
                const hole = noise(dir.x * 6 + k * 3, dir.y * 6, dir.z * 6 + k) > 0.52;
                const pt = new THREE.Vector3(C.x + dir.x * r, C.y + dir.y * r, C.z + dir.z * r);
                // tấm nào chạm sát màng tế bào hoặc lấn vào không bào/Golgi thì cắt bỏ
                const blocked = !insideShell(pt, p.bounds, 0.93) || (p.avoid?.some((a) => pt.distanceTo(new THREE.Vector3(...a.center)) < a.radius) ?? false) || (p.reject?.(pt) ?? false);
                const ok = edge < 0.86 && !hole && !blocked;
                keep.push(ok);
                if (ok && edge > 0.8 && rand() < 0.08 && k === sheetCount - 1) {
                    edgePts.push(new THREE.Vector3(C.x + dir.x * r, C.y + dir.y * r, C.z + dir.z * r));
                }
            }
        }
        const row = NB + 1;
        for (let a = 0; a < NA; a++) {
            for (let b = 0; b < NB; b++) {
                const i0 = a * row + b, i1 = i0 + 1, i2 = i0 + row, i3 = i2 + 1;
                if (keep[i0] && keep[i1] && keep[i2] && keep[i3]) {
                    indices.push(base + i0, base + i2, base + i1, base + i1, base + i2, base + i3);
                }
            }
        }
    }
    const sheets = new THREE.BufferGeometry();
    sheets.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    sheets.setIndex(indices);
    sheets.computeVertexNormals();
    sheets.computeBoundingSphere();

    // Ribôxôm bám trên tấm màng — chọn tam giác ngẫu nhiên, lệch ra ngoài theo pháp tuyến
    const ribosomes: THREE.Matrix4[] = [];
    const triCount = indices.length / 3;
    const target = high ? 520 : 220;
    const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3();
    const nrm = new THREE.Vector3(), pt = new THREE.Vector3();
    const q = new THREE.Quaternion();
    for (let i = 0; i < target && triCount > 0; i++) {
        const t = Math.floor(rand() * triCount) * 3;
        pa.fromArray(positions, indices[t] * 3);
        pb.fromArray(positions, indices[t + 1] * 3);
        pc.fromArray(positions, indices[t + 2] * 3);
        let u = rand(), v = rand();
        if (u + v > 1) { u = 1 - u; v = 1 - v; }
        pt.copy(pa).addScaledVector(pb.clone().sub(pa), u).addScaledVector(pc.clone().sub(pa), v);
        nrm.subVectors(pb, pa).cross(pc.clone().sub(pa)).normalize();
        // hướng ra phía tế bào chất (xa tâm nhân) là mặt có ribôxôm
        if (nrm.dot(pt.clone().sub(C)) < 0) nrm.negate();
        pt.addScaledVector(nrm, rN * 0.03);
        q.setFromEuler(new THREE.Euler(rand() * 6.28, rand() * 6.28, rand() * 6.28));
        const s = rN * (0.024 + rand() * 0.008);
        ribosomes.push(new THREE.Matrix4().compose(pt.clone(), q.clone(), new THREE.Vector3(s, s, s)));
    }

    // Lưới nội chất trơn: ống mảnh đi bộ ngẫu nhiên từ mép lưới hạt ra ngoài
    const tubeParts: THREE.BufferGeometry[] = [];
    const tubeCount = Math.min(edgePts.length, p.tubes ?? (high ? 9 : 5));
    for (let i = 0; i < tubeCount; i++) {
        const start = edgePts[Math.floor((i / tubeCount) * edgePts.length)];
        const pts: THREE.Vector3[] = [start.clone()];
        const out = start.clone().sub(C).normalize();
        const cur = start.clone();
        const d = out.clone();
        for (let s = 0; s < 11; s++) {
            d.x += noise(s * 0.4, i * 1.7, 0.5) * 0.9;
            d.y += noise(i * 2.3, s * 0.4, 1.5) * 0.9;
            d.z += noise(3.3, i * 0.9, s * 0.4) * 0.9;
            d.addScaledVector(out, 0.35).normalize();
            const next = cur.clone().addScaledVector(d, rN * 0.14);
            // chạm màng tế bào / nhân / vùng cấm → quay đầu vào trong (không bao giờ chọc thủng màng)
            const hitsWall = !insideShell(next, p.bounds, 0.88);
            const hitsNucleus = next.distanceTo(C) < rN * 1.12;
            const hitsAvoid = (p.avoid?.some((a) => next.distanceTo(new THREE.Vector3(...a.center)) < a.radius) ?? false) || (p.reject?.(next) ?? false);
            if (hitsWall || hitsNucleus || hitsAvoid) {
                if (hitsWall) d.addScaledVector(next.clone().normalize(), -1.4);
                if (hitsNucleus) d.addScaledVector(next.clone().sub(C).normalize(), 1.4);
                d.normalize();
                out.copy(d);
                continue;
            }
            cur.copy(next);
            pts.push(cur.clone());
        }
        if (pts.length < 4) continue;
        tubeParts.push(tubeThrough(pts, rN * 0.034, high ? 60 : 36, high ? 7 : 5));
    }
    const smooth = tubeParts.length ? merge(tubeParts) : new THREE.BufferGeometry();

    const ld = new THREE.Vector3(...(p.labelDir ?? p.facing)).normalize();
    const labelPoint = C.clone().addScaledVector(ld, rN * (1.2 + (sheetCount - 1) * 0.17) + rN * 0.1);
    return { sheets, smooth, ribosomes, labelPoint };
}

