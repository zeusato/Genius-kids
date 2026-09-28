import * as THREE from 'three';

// === Hạ tầng dùng chung của scene tế bào ===

// Đồng hồ mô phỏng — ref thuần, KHÔNG BAO GIỜ là React state (tránh re-render mỗi frame).
// clock.t: thời gian "sinh học" (bào quan trôi, túi hàng chạy) — dừng khi timeScale = 0.
export interface SimClock {
    t: number;
    timeScale: number;
}

export function createSimClock(): SimClock {
    return { t: 0, timeScale: 1 };
}

// Thời gian "môi trường" cho MỌI shader (màng phập phồng, hạt lơ lửng, ánh sáng nhấp nháy) — luôn
// chạy kể cả khi đồng hồ sinh học dừng lúc camera bay. Một object uniform dùng chung: ClockTicker
// ghi .value mỗi frame, mọi material tham chiếu cùng object nên không phải cập nhật từng cái.
export const SHARED_TIME = { value: 0 };

// Registry: mỗi bào quan đăng ký một Object3D (điểm neo) + bán kính để camera bay tới đúng chỗ
// và lớp nhãn biết đặt tên ở đâu.
export interface BodyEntry {
    object: THREE.Object3D;   // tâm để camera bay tới
    radius: number;
    label?: THREE.Object3D;   // điểm đặt nhãn (mặc định = object)
    // vỏ bọc (màng/thành) — nhãn luôn hiện kể cả khi điểm neo nằm ngoài cửa sổ cắt
    shell?: boolean;
}
export type BodyRegistry = Record<string, BodyEntry>;

// API CellScene3D expose ra page
export interface Scene3DApi {
    zoomIn: () => void;
    zoomOut: () => void;
    skipIntro: () => void;
    // khoảng cách camera → mục tiêu hiện tại (HUD tính thước đo/độ phóng đại mỗi frame)
    viewDistance: () => number;
    fovDeg: () => number;
    setWater: (v: number) => void; // thí nghiệm tưới nước (tế bào thực vật)
    // dòng thời gian thí nghiệm phân chia (động vật) / nhân đôi (vi khuẩn)
    timeline: (which: 'mitosis' | 'fission') => { t: number; playing: boolean };
}

export const NOOP_API: Scene3DApi = {
    zoomIn() { },
    zoomOut() { },
    skipIntro() { },
    viewDistance: () => 10,
    fovDeg: () => 45,
    setWater() { },
    timeline: () => ({ t: 0, playing: false })
};

// Mỗi component trong Canvas gắn phần API của mình (render ở React root riêng nên không biết thứ tự)
export function mergeApi(ref: { current: Scene3DApi | null }, part: Partial<Scene3DApi>): void {
    ref.current = { ...(ref.current ?? NOOP_API), ...part };
}

export function supportsWebGL(): boolean {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
        return false;
    }
}

// Trạng thái focus truyền xuống bào quan: 'this' = đang được chọn, 'other' = bào quan khác đang
// được chọn (mờ đi), 'none' = không chọn gì
export type FocusState = 'none' | 'this' | 'other';

export function focusStateOf(id: string | string[], focusedId: string | null): FocusState {
    if (!focusedId) return 'none';
    const ids = Array.isArray(id) ? id : [id];
    return ids.includes(focusedId) ? 'this' : 'other';
}
