// Ánh xạ pixel CSS ↔ thế giới. Camera luôn đứng ở tư thế "nhà" (0, 0, CAM_Z) nhìn về gốc, fov cố định,
// nên mặt z = 0 khớp tuyến tính với màn hình: ô DOM → tọa độ thế giới bằng getBoundingClientRect.
// Sân khấu nguyên tố xoay VẬT (không xoay camera) để ánh xạ này luôn đúng — mẫu vật "nhô ra khỏi ô" chính xác.
import * as THREE from 'three';

export const CAM_Z = 10;
export const FOV = 35;

export interface Viewport { w: number; h: number }

/** Số đơn vị thế giới trên 1 px ở mặt z = 0. */
export const worldPerPx = (vp: Viewport) => (2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / vp.h;

export function pxToWorld(x: number, y: number, vp: Viewport, out = new THREE.Vector3()): THREE.Vector3 {
    const k = worldPerPx(vp);
    return out.set((x - vp.w / 2) * k, -(y - vp.h / 2) * k, 0);
}

/** Tâm và cạnh (px) của ô nguyên tố trên màn hình, hoặc null nếu không thấy. */
export function cellRect(z: number): { x: number; y: number; size: number } | null {
    const el = document.querySelector<HTMLElement>(`button[data-z="${z}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width };
}

/** Cache vị trí tâm mọi ô (px) — đọc lại khi resize/scroll, không đọc layout mỗi frame. */
export class CellRects {
    readonly x = new Float32Array(119);
    readonly y = new Float32Array(119);
    readonly s = new Float32Array(119);
    version = 0;
    refresh(): void {
        document.querySelectorAll<HTMLElement>('button[data-z]').forEach(el => {
            const z = Number(el.dataset.z), r = el.getBoundingClientRect();
            this.x[z] = r.left + r.width / 2; this.y[z] = r.top + r.height / 2; this.s[z] = r.width;
        });
        this.version++;
    }
}

/** Vùng sân khấu (px) chừa chỗ cho thẻ: màn ngang → thẻ bên phải 400 px; màn dọc → thẻ dưới 46 %. */
export function stageFrame(vp: Viewport): { cx: number; cy: number; size: number; portrait: boolean } {
    const portrait = vp.w < 760 || vp.h > vp.w * 1.05;
    if (portrait) {
        // chừa thanh trên (60 px), HUD + thẻ thu gọn ở dưới (~270 px)
        const top = 60, bottom = vp.h - 270;
        return { cx: vp.w / 2, cy: (top + bottom) / 2, size: Math.min(vp.w * 0.6, bottom - top - 20), portrait };
    }
    const w = vp.w - Math.min(420, vp.w * 0.42);
    return { cx: w / 2, cy: vp.h / 2 + 10, size: Math.min(w * 0.7, vp.h * 0.62), portrait };
}
