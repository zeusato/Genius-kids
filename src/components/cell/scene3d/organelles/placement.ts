import * as THREE from 'three';
import { randomDirection, Vec3 } from '../noise';
import { ShellShape, shellRadius } from '../shell';

export interface Avoid {
    center: Vec3;
    radius: number;
}

export interface ScatterOptions {
    rMin: number;        // tỉ lệ bán kính vỏ (0..1) — gần tâm nhất
    rMax: number;        // tỉ lệ bán kính vỏ — sát màng nhất
    avoid?: Avoid[];     // tránh nhân, Golgi, không bào...
    minGap: number;      // khoảng cách tối thiểu giữa hai điểm
    center?: Vec3;       // tâm vỏ (mặc định gốc)
    reject?: (p: THREE.Vector3) => boolean; // loại vùng hình dạng bất kỳ (vd bên trong không bào)
}

// Điểm p có nằm trong siêu elip (tâm c, nửa kích thước half, số mũ e) phóng to thêm margin không
export function insideSuperellipsoid(p: THREE.Vector3, c: Vec3, half: [number, number, number], exp: number, margin = 0, round = false): boolean {
    const x = Math.abs(p.x - c[0]) / (half[0] + margin);
    const y = Math.abs(p.y - c[1]) / (half[1] + margin);
    const z = Math.abs(p.z - c[2]) / (half[2] + margin);
    const s = round ? Math.pow(x, exp) + Math.pow(y * y + z * z, exp / 2) : Math.pow(x, exp) + Math.pow(y, exp) + Math.pow(z, exp);
    return s < 1;
}

// Rải điểm ngẫu nhiên trong vùng tế bào chất (loại trừ vùng cấm, giữ khoảng cách) — rejection sampling
export function scatterInShell(rand: () => number, count: number, shape: ShellShape, o: ScatterOptions): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    const c = new THREE.Vector3(...(o.center ?? [0, 0, 0]));
    let guard = 0;
    while (out.length < count && guard < count * 400) {
        guard++;
        const [dx, dy, dz] = randomDirection(rand);
        const R = shellRadius(dx, dy, dz, shape);
        const f = o.rMin + (o.rMax - o.rMin) * Math.cbrt(rand());
        const p = new THREE.Vector3(dx, dy, dz).multiplyScalar(R * f).add(c);
        if (o.avoid?.some((a) => p.distanceTo(new THREE.Vector3(...a.center)) < a.radius)) continue;
        if (o.reject?.(p)) continue;
        if (out.some((q) => q.distanceTo(p) < o.minGap)) continue;
        out.push(p);
    }
    return out;
}

// Chọn bản đại diện của một nhóm (ty thể, tiêu thể...) làm điểm neo nhãn: nằm về phía `slot` (mỗi
// nhóm một hướng khác nhau → nhãn các nhóm không dồn một chỗ) và vẫn quay về phía camera mặc định.
export function pickAnchor(points: THREE.Vector3[], slot: Vec3, viewDir: Vec3, exclude: THREE.Vector3[] = [], minSep = 0.6): number {
    const s = new THREE.Vector3(...slot).normalize();
    const v = new THREE.Vector3(...viewDir).normalize();
    let best = 0, bestScore = -Infinity;
    const d = new THREE.Vector3();
    points.forEach((p, i) => {
        if (exclude.some((e) => e.distanceTo(p) < minSep)) return;
        d.copy(p).normalize();
        const score = d.dot(s) * 1.2 + d.dot(v) * 0.6 + p.length() * 0.08;
        if (score > bestScore) { bestScore = score; best = i; }
    });
    return best;
}

