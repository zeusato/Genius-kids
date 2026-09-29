/** Trạng thái đổi liên tục của sân khấu: trang ghi (kéo/cuộn), canvas đọc mỗi frame. File nhỏ, không kéo three/R3F. */
export interface StageLive {
    rotX: number; rotY: number;       // mục tiêu xoay do kéo
    zoom: number;                     // mục tiêu tầng 0..3
    zoomNow: number;                  // tầng hiện tại (sân khấu ghi, HUD đọc)
    dragging: boolean;
    expStart: number;                 // performance.now() lúc bấm ▶ thí nghiệm (đồng hồ thật)
}
export const createStageLive = (): StageLive => ({ rotX: 0.15, rotY: 0, zoom: 0, zoomNow: 0, dragging: false, expStart: 0 });
