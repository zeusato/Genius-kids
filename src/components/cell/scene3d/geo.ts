import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ShellShape, shellRadius } from './shell';
import { Noise3, Vec3 } from './noise';

// === Tiện ích dựng hình procedural dùng chung ===

const sphereCache = new Map<string, THREE.SphereGeometry>();

// Mặt cầu đơn vị dùng chung cho mọi vỏ (shader tự đẩy ra hình dạng thật)
export function unitSphere(w: number, h: number): THREE.SphereGeometry {
    const key = `${w}x${h}`;
    let g = sphereCache.get(key);
    if (!g) {
        g = new THREE.SphereGeometry(1, w, h);
        sphereCache.set(key, g);
    }
    return g;
}

// Hình vỏ tĩnh trên CPU (không sóng) — làm vùng chạm (raycast) cho vỏ vốn biến dạng trên GPU
export function bakedShell(shape: ShellShape, w = 48, h = 32): THREE.BufferGeometry {
    const g = new THREE.SphereGeometry(1, w, h);
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).normalize();
        v.multiplyScalar(shellRadius(v.x, v.y, v.z, shape));
        p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    g.computeBoundingSphere();
    return g;
}

// Gắn màu đỉnh đồng nhất (để gộp nhiều khối khác màu vào 1 draw call)
export function colorize(g: THREE.BufferGeometry, color: THREE.ColorRepresentation): THREE.BufferGeometry {
    const c = new THREE.Color(color);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return g;
}

// Bỏ thuộc tính không dùng để mergeGeometries không lệch nhau (uv/uv1/tangent...)
export function stripTo(g: THREE.BufferGeometry, keep: string[]): THREE.BufferGeometry {
    for (const name of Object.keys(g.attributes)) {
        if (!keep.includes(name)) g.deleteAttribute(name);
    }
    return g;
}

export function merge(parts: THREE.BufferGeometry[], keep: string[] = ['position', 'normal']): THREE.BufferGeometry {
    const prepared = parts.map((p) => {
        const g = p.index ? p.toNonIndexed() : p;
        return stripTo(g, keep);
    });
    const out = mergeGeometries(prepared, false);
    if (!out) throw new Error('merge: thuộc tính hình khối không khớp');
    out.computeBoundingSphere();
    return out;
}

// Ma trận đặt một khối tại p, xoay trục +Y của nó theo hướng dir, scale s
const _up = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
export function alignMatrix(p: Vec3 | THREE.Vector3, dir: Vec3 | THREE.Vector3, s: number | Vec3 = 1, spin = 0): THREE.Matrix4 {
    const d = Array.isArray(dir) ? _v.set(dir[0], dir[1], dir[2]) : _v.copy(dir);
    d.normalize();
    _q.setFromUnitVectors(_up, d);
    if (spin) _q.multiply(new THREE.Quaternion().setFromAxisAngle(_up, spin));
    const pos = Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : p.clone();
    const sc = Array.isArray(s) ? new THREE.Vector3(s[0], s[1], s[2]) : new THREE.Vector3(s, s, s);
    return new THREE.Matrix4().compose(pos, _q.clone(), sc);
}

// Ống mềm đi qua các điểm (Catmull-Rom) — dùng cho chất nhiễm sắc, ADN, lưới nội chất trơn
export function tubeThrough(points: THREE.Vector3[], radius: number, segments: number, radial = 6, closed = false): THREE.TubeGeometry {
    const curve = new THREE.CatmullRomCurve3(points, closed, 'catmullrom', 0.5);
    return new THREE.TubeGeometry(curve, segments, radius, radial, closed);
}

// Đi bộ ngẫu nhiên mượt bên trong một quả cầu (tâm c, bán kính R) — sợi rối tự nhiên
export function randomWalkInSphere(
    rand: () => number, noise: Noise3, start: THREE.Vector3, steps: number, stepLen: number, center: THREE.Vector3, R: number, seedOffset = 0
): THREE.Vector3[] {
    const pts: THREE.Vector3[] = [start.clone()];
    const dir = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const p = start.clone();
    for (let i = 0; i < steps; i++) {
        const t = i * 0.35 + seedOffset;
        dir.x += noise(t, 0.3 + seedOffset, 1.7) * 0.9;
        dir.y += noise(1.3 + seedOffset, t, 4.1) * 0.9;
        dir.z += noise(7.7, 2.1 + seedOffset, t) * 0.9;
        dir.normalize();
        p.addScaledVector(dir, stepLen);
        const off = p.clone().sub(center);
        if (off.length() > R) {
            // chạm vỏ → bẻ hướng vào trong
            off.setLength(R * 0.98);
            p.copy(center).add(off);
            dir.addScaledVector(off.clone().normalize(), -1.6).normalize();
        }
        pts.push(p.clone());
    }
    return pts;
}
