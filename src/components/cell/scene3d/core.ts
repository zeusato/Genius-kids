import * as THREE from 'three';

// === Hạ tầng dùng chung, port từ solar/scene3d/core.ts (domain-agnostic) ===

// Đồng hồ mô phỏng — ref thuần, KHÔNG BAO GIỜ là React state (tránh re-render mỗi frame).
// Chuyển động nhẹ của bào quan (ty thể trôi, roi vẫy, dòng tế bào chất) đọc từ đây.
export interface SimClock {
    t: number;
    timeScale: number;
}

export function createSimClock(): SimClock {
    return { t: 0, timeScale: 1 };
}

// Registry: mỗi Organelle3D đăng ký group + bán kính để CellCameraRig bay tới đúng vị trí.
export interface BodyEntry {
    object: THREE.Object3D;
    radius: number;
}
export type BodyRegistry = Record<string, BodyEntry>;

// API CellScene3D expose ra page (nút zoom +/-)
export interface Scene3DApi {
    zoomIn: () => void;
    zoomOut: () => void;
}

export function supportsWebGL(): boolean {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
        return false;
    }
}

// === Pool geometry dùng chung cho bào quan ===
// Tất cả bào quan scale từ các primitive này → gần như 0 chi phí geometry, 0 byte tải thêm
// (procedural, không model GLB). Bào quan blobby/đồng dạng nên primitive là đủ đẹp.

export const GEO = {
    // Cầu mịn — nhân, nhân con, tiêu thể, không bào, ribôxôm, túi tiết
    sphere: new THREE.SphereGeometry(1, 32, 24),
    sphereHi: new THREE.SphereGeometry(1, 48, 32), // nhân (tâm điểm fly-to)
    sphereLo: new THREE.SphereGeometry(1, 12, 10), // ribôxôm/lỗ nhân (instanced, nhỏ xíu)
    // Hạt đậu — ty thể (CapsuleGeometry: radius, length, capSeg, radialSeg)
    bean: new THREE.CapsuleGeometry(0.5, 1.0, 6, 16),
    // Đĩa dẹt — grana lục lạp, túi Golgi
    disc: new THREE.CylinderGeometry(1, 1, 0.18, 24),
    // Ống mảnh — gờ răng lược (cristae), pili
    rod: new THREE.CylinderGeometry(0.06, 0.06, 1, 8),
    // Vòng — lỗ nhân, túi Golgi viền
    torus: new THREE.TorusGeometry(0.8, 0.16, 8, 24)
};

// Vật liệu chuẩn cho bào quan đặc — khớp look meshStandard của solar
export function organelleMaterial(color: string, opts: { opacity?: number; emissive?: number } = {}): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0,
        transparent: opts.opacity !== undefined && opts.opacity < 1,
        opacity: opts.opacity ?? 1,
        emissive: new THREE.Color(color),
        emissiveIntensity: opts.emissive ?? 0.12
    });
}
