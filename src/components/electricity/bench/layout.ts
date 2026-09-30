import * as THREE from 'three';
import { displayPoint } from '../engine/circuit';

/**
 * Hình học trình bày của bàn: đổi tọa độ bàn (14×8 canonical) sang thế giới 3D và tính góc máy vừa khung.
 * Hàm thuần — không đụng tới mạch điện, chỉ đổi cách nhìn.
 */
export const BOARD = { w: 14, d: 8 } as const;
export const POST_Y = 0.5;   // độ cao đầu cọc đồng (điểm dây bắt vào)
export const WIRE_Y = 0.1;   // dây nằm sát mặt bàn

export function boardSize(portrait: boolean) { return portrait ? { W: BOARD.d, D: BOARD.w } : { W: BOARD.w, D: BOARD.d }; }

/** Tọa độ bàn → tọa độ thế giới (tâm bàn ở gốc). */
export function toWorld(x: number, z: number, portrait: boolean): [number, number] {
    const [u, v] = displayPoint(x, z, portrait), { W, D } = boardSize(portrait);
    return [u - W / 2, v - D / 2];
}

export interface Insets { top: number; bottom: number; left: number; right: number }
export interface ViewFit { distance: number; target: [number, number] }

/** Vị trí camera nhìn xuống bàn theo góc ngẩng `elevation` (rad), phương vị cố định: người xem đứng phía +z. */
export function cameraPosition(target: [number, number], distance: number, elevation: number): [number, number, number] {
    return [target[0], distance * Math.sin(elevation), target[1] + distance * Math.cos(elevation)];
}

const tmpCam = new THREE.PerspectiveCamera();
const tmpV = new THREE.Vector3();

function projectBox(W: number, D: number, height: number, fov: number, aspect: number, elevation: number, fit: ViewFit) {
    tmpCam.fov = fov; tmpCam.aspect = aspect; tmpCam.near = 0.1; tmpCam.far = 500; tmpCam.updateProjectionMatrix();
    tmpCam.position.set(...cameraPosition(fit.target, fit.distance, elevation));
    tmpCam.up.set(0, 1, elevation > 1.55 ? -1 : 0).normalize();
    tmpCam.lookAt(fit.target[0], 0, fit.target[1]); tmpCam.updateMatrixWorld();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) for (const y of [-0.3, height]) {
        tmpV.set(x, y, z).project(tmpCam);
        minX = Math.min(minX, tmpV.x); maxX = Math.max(maxX, tmpV.x); minY = Math.min(minY, tmpV.y); maxY = Math.max(maxY, tmpV.y);
    }
    return { minX, maxX, minY, maxY };
}

/**
 * Tìm khoảng cách + điểm nhìn sao cho cả bàn (kể cả bóng đèn cao ~1,4) nằm gọn trong vùng không bị HUD che.
 * `insets` tính theo phần của khung (0..1). Trả về cùng kết quả cho cùng đầu vào (không phụ thuộc thời gian).
 */
export function fitView(W: number, D: number, fov: number, aspect: number, elevation: number, insets: Insets, margin = 0.35, height = 1.4): ViewFit {
    const Wm = W + margin * 2, Dm = D + margin * 2;
    // Vùng NDC còn trống sau khi trừ HUD.
    const left = -1 + insets.left * 2, right = 1 - insets.right * 2, bottom = -1 + insets.bottom * 2, top = 1 - insets.top * 2;
    const fit: ViewFit = { distance: 20, target: [0, 0] };
    for (let pass = 0; pass < 4; pass++) {
        let lo = 1, hi = 200;
        for (let i = 0; i < 32; i++) {
            fit.distance = (lo + hi) / 2;
            const b = projectBox(Wm, Dm, height, fov, aspect, elevation, fit);
            const inside = b.maxX - b.minX <= right - left && b.maxY - b.minY <= top - bottom;
            if (inside) hi = fit.distance; else lo = fit.distance;
        }
        fit.distance = hi;
        // Dời điểm nhìn để tâm khung bao của bàn trùng tâm vùng trống.
        const b = projectBox(Wm, Dm, height, fov, aspect, elevation, fit);
        const dx = (left + right) / 2 - (b.minX + b.maxX) / 2, dy = (bottom + top) / 2 - (b.minY + b.maxY) / 2;
        if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) break;
        // 1 đơn vị NDC ≈ nửa bề rộng nhìn thấy ở khoảng cách hiện tại.
        const halfH = Math.tan(fov * Math.PI / 360) * fit.distance, halfW = halfH * aspect;
        fit.target = [fit.target[0] - dx * halfW, fit.target[1] + dy * halfH / Math.max(0.2, Math.sin(elevation))];
    }
    return fit;
}

/** Góc ngẩng mặc định: ngang hơi thấp để thấy chiều cao bóng đèn, dọc cao hơn cho bàn 8×14. */
export function defaultElevation(portrait: boolean) { return portrait ? 1.08 : 0.98; }
