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
// Bản thô cho thiên thể chỉ vài pixel (vệ tinh, Pluto, nhân sao chổi) và vỏ khí quyển:
// 360 tam giác thay vì 2.976 — mắt thường không phân biệt được ở kích thước đó
export const LOW_SPHERE = new THREE.SphereGeometry(1, 16, 12);
export const SHELL_SPHERE = new THREE.SphereGeometry(1, 32, 24);

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
    ringNormal?: THREE.Vector3; // pháp tuyến mặt phẳng vành (world) — để góc tới nơi luôn thấy vành mở
    spinGroup?: THREE.Object3D; // group tự quay — để xoay một địa danh (Vết Đỏ Lớn, Việt Nam...) ra trước camera
}
export type BodyRegistry = Record<string, BodyEntry>;

// API Scene3D expose ra page (nút zoom +/-)
export interface Scene3DApi {
    zoomIn: () => void;
    zoomOut: () => void;
    skipIntro: () => void;
    triggerStorm: () => void; // bão Mặt Trời → cực quang
}

// Mỗi component trong Canvas gắn phần API của mình (render ở React root riêng nên không biết thứ tự)
export function mergeApi(ref: { current: Scene3DApi | null }, part: Partial<Scene3DApi>): void {
    ref.current = { ...(ref.current ?? { zoomIn() {}, zoomOut() {}, skipIntro() {}, triggerStorm() {} }), ...part };
}

// Nhãn tên (Html) đăng ký để LabelDeclutter ẩn khi: nằm sau Mặt Trời, đang được focus,
// hoặc đè lên nhãn gần camera hơn (nhãn đè từng "cướp" cú chạm của bé)
export interface LabelEntry {
    id: string;
    anchor: THREE.Object3D;
    offsetY: number;
    // ref (không phải element) — nội dung <Html> render ở React root riêng nên element có sau
    el: { readonly current: HTMLElement | null };
}
export type LabelRegistry = Map<string, LabelEntry>;

export function supportsWebGL(): boolean {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
        return false;
    }
}
