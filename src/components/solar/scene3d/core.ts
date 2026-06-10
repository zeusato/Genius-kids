import * as THREE from 'three';

// Đồng hồ mô phỏng — ref thuần, KHÔNG BAO GIỜ là React state (tránh re-render mỗi frame).
// UI (nút ⏸/🐢/🐇/🚀) ghi thẳng vào timeScale; mọi useFrame đọc từ đây.
export interface SimClock {
    t: number;          // thời gian mô phỏng tích lũy (giây)
    timeScale: number;  // 0 = dừng, 1/5/20 = tốc độ
}

export function createSimClock(): SimClock {
    return { t: 0, timeScale: 1 };
}

// Texture đặt trong public/textures — phải đi qua BASE_URL vì app deploy ở /Genius-kids/
export function texUrl(name: string): string {
    return `${import.meta.env.BASE_URL}textures/${name}.webp`;
}

// Một SphereGeometry dùng chung cho TẤT CẢ hành tinh (scale per-mesh) — gần như 0 chi phí geometry
export const SHARED_SPHERE = new THREE.SphereGeometry(1, 48, 32);
// Bản nét hơn cho modal chi tiết
export const DETAIL_SPHERE = new THREE.SphereGeometry(1, 64, 48);

// Texture glow cho Mặt Trời — vẽ canvas, không cần file
let glowTexture: THREE.CanvasTexture | null = null;
export function getGlowTexture(): THREE.CanvasTexture {
    if (glowTexture) return glowTexture;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255, 230, 180, 1)');
    g.addColorStop(0.3, 'rgba(255, 170, 70, 0.5)');
    g.addColorStop(0.7, 'rgba(255, 140, 40, 0.12)');
    g.addColorStop(1, 'rgba(255, 130, 30, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    glowTexture = new THREE.CanvasTexture(canvas);
    return glowTexture;
}

// Registry: PlanetMesh đăng ký group + bán kính để CameraRig bay tới đúng vị trí hiện tại
export interface BodyEntry {
    object: THREE.Object3D;
    radius: number; // bán kính hiển thị (scene units)
}
export type BodyRegistry = Record<string, BodyEntry>;

// API Scene3D expose ra page (nút zoom +/-)
export interface Scene3DApi {
    zoomIn: () => void;
    zoomOut: () => void;
}
