import * as THREE from 'three';
import { colorize, merge } from '../geo';

// Hình khối dùng chung giữa nhiều bào quan

let ribosomeGeo: THREE.BufferGeometry | null = null;

// Ribôxôm = tiểu đơn vị lớn + tiểu đơn vị nhỏ ("người tuyết" tí hon), 2 tông màu
export function getRibosomeGeometry(): THREE.BufferGeometry {
    if (ribosomeGeo) return ribosomeGeo;
    const big = colorize(new THREE.IcosahedronGeometry(1, 1), '#e9d5ff');
    const small = colorize(new THREE.IcosahedronGeometry(0.72, 1).translate(0.62, 0.5, 0.1), '#c4b5fd');
    ribosomeGeo = merge([big, small], ['position', 'normal', 'color']);
    return ribosomeGeo;
}

// Túi màng nhỏ (túi tiết, túi vận chuyển): cầu mịn vừa đủ
let vesicleGeo: THREE.BufferGeometry | null = null;
export function getVesicleGeometry(): THREE.BufferGeometry {
    if (!vesicleGeo) vesicleGeo = new THREE.SphereGeometry(1, 20, 14);
    return vesicleGeo;
}

// Protein kênh xuyên màng: 5 múi xếp vòng quanh một lỗ (trục +Y)
export function channelProteinGeometry(color: string, inner: string): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        parts.push(colorize(new THREE.CapsuleGeometry(0.34, 1.5, 4, 8).translate(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42), i % 2 ? color : inner));
    }
    return merge(parts, ['position', 'normal', 'color']);
}

// Glycoprotein: thân mảnh + chùm "đường" trên đỉnh (như cây kẹo mút)
export function glycoproteinGeometry(stem: string, sugar: string): THREE.BufferGeometry {
    const parts: THREE.BufferGeometry[] = [
        colorize(new THREE.CylinderGeometry(0.16, 0.22, 1.6, 6).translate(0, 0.3, 0), stem),
        colorize(new THREE.SphereGeometry(0.4, 10, 8).translate(0, -0.5, 0), stem)
    ];
    const beads: [number, number, number, number][] = [
        [0, 1.25, 0, 0.3], [0.28, 1.55, 0.1, 0.24], [-0.26, 1.5, -0.08, 0.24], [0.05, 1.85, -0.2, 0.2], [-0.1, 1.9, 0.22, 0.18]
    ];
    for (const [x, y, z, r] of beads) parts.push(colorize(new THREE.IcosahedronGeometry(r, 1).translate(x, y, z), sugar));
    return merge(parts, ['position', 'normal', 'color']);
}

// Protein ngoại vi: khối tròn dẹt nằm bám mặt màng
export function peripheralProteinGeometry(color: string): THREE.BufferGeometry {
    return merge([colorize(new THREE.SphereGeometry(1, 12, 10).scale(1, 0.6, 0.85), color)], ['position', 'normal', 'color']);
}

// Lỗ nhân: vòng xuyến + nút ở giữa (trục +Y)
export function nuclearPoreGeometry(ring: string, plug: string): THREE.BufferGeometry {
    return merge([
        colorize(new THREE.TorusGeometry(1, 0.38, 8, 18).rotateX(Math.PI / 2), ring),
        colorize(new THREE.CylinderGeometry(0.42, 0.42, 0.55, 10), plug)
    ], ['position', 'normal', 'color']);
}

// Dịch điểm theo Lissajous chậm — bào quan "trôi" trong tế bào chất
export function driftOffset(out: THREE.Vector3, t: number, phase: number, amp: number): THREE.Vector3 {
    return out.set(
        Math.sin(t * 0.21 + phase) * amp,
        Math.sin(t * 0.17 + phase * 1.7) * amp * 0.8,
        Math.cos(t * 0.19 + phase * 2.3) * amp
    );
}
