import * as THREE from 'three';
import type { Point } from '../engine/route';
import { POST_Y, WIRE_Y, toWorld } from './layout';

/**
 * Đường cong 3D của một sợi dây từ đường đi trên lưới nửa ô (route.ts):
 * nhô lên khỏi cọc, nằm sát mặt bàn qua các điểm gấp (bo góc), rồi vòng lên cọc kia.
 * Chỉ là dữ liệu trình bày; không bao giờ đưa vào bộ giải.
 */
export function wirePoints(route: Point[], portrait: boolean): THREE.Vector3[] {
    const world = route.map(([x, z]) => toWorld(x, z, portrait));
    const a = world[0], b = world[world.length - 1];
    const A = new THREE.Vector3(a[0], POST_Y - 0.04, a[1]), B = new THREE.Vector3(b[0], POST_Y - 0.04, b[1]);
    const inner = world.slice(1, -1);
    if (!inner.length) {
        // Hai cọc sát nhau: một vòng cung nhẹ.
        const mid = A.clone().lerp(B, 0.5); mid.y = POST_Y + 0.15 + A.distanceTo(B) * 0.05;
        return densify([A, A.clone().add(new THREE.Vector3(0, 0.22, 0)), mid, B.clone().add(new THREE.Vector3(0, 0.22, 0)), B]);
    }
    const toward = (p: THREE.Vector3, q: [number, number], d: number) => {
        const v = new THREE.Vector3(q[0] - p.x, 0, q[1] - p.z); if (v.lengthSq() < 1e-9) v.set(1, 0, 0); v.normalize();
        return new THREE.Vector3(p.x + v.x * d, WIRE_Y, p.z + v.z * d);
    };
    const poly = [
        A, new THREE.Vector3(A.x, A.y + 0.16, A.z), toward(A, inner[0], 0.32),
        ...inner.map(([x, z]) => new THREE.Vector3(x, WIRE_Y, z)),
        toward(B, inner[inner.length - 1], 0.32), new THREE.Vector3(B.x, B.y + 0.16, B.z), B,
    ];
    const pts = [poly[0]];
    for (let i = 1; i < poly.length - 1; i++) {
        const v = poly[i], pin = poly[i - 1], pout = poly[i + 1];
        const r = Math.min(0.3, v.distanceTo(pin) / 2, v.distanceTo(pout) / 2);
        if (r < 1e-4) { pts.push(v.clone()); continue; }
        const p0 = v.clone().addScaledVector(pin.clone().sub(v).normalize(), r), p2 = v.clone().addScaledVector(pout.clone().sub(v).normalize(), r);
        for (let k = 0; k <= 5; k++) {
            const t = k / 5, u = 1 - t;
            pts.push(new THREE.Vector3().addScaledVector(p0, u * u).addScaledVector(v, 2 * u * t).addScaledVector(p2, t * t));
        }
    }
    pts.push(poly[poly.length - 1]);
    return densify(pts);
}

/** Chia đều ~0,1 đơn vị để TubeGeometry và electron chạy mượt; bỏ điểm trùng. */
function densify(pts: THREE.Vector3[]): THREE.Vector3[] {
    const out: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
        const n = Math.max(1, Math.ceil(pts[i].distanceTo(pts[i + 1]) / 0.1));
        for (let k = 0; k < n; k++) out.push(pts[i].clone().lerp(pts[i + 1], k / n));
    }
    out.push(pts[pts.length - 1].clone());
    return out.filter((p, i) => i === 0 || p.distanceToSquared(out[i - 1]) > 1e-8);
}

/** Đường cong dùng chung cho vỏ, lõi và electron của một dây. */
export function wireCurve(points: THREE.Vector3[]) { return new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5); }

/** Dây tạm khi đang kéo: võng nhẹ giữa cọc và ngón tay. */
export function dragPoints(from: [number, number], to: [number, number]): THREE.Vector3[] {
    const A = new THREE.Vector3(from[0], POST_Y - 0.04, from[1]), B = new THREE.Vector3(to[0], POST_Y + 0.05, to[1]);
    const mid = A.clone().lerp(B, 0.5); mid.y = Math.max(WIRE_Y + 0.05, POST_Y - 0.1 - A.distanceTo(B) * 0.06);
    return densify([A, A.clone().add(new THREE.Vector3(0, 0.2, 0)), mid, B]);
}
