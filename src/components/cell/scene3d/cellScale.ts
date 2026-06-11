// Tham số kích thước & camera cho từng loại tế bào (port ý tưởng từ solar/scene3d/scale.ts).

export type CellShape = 'blob' | 'box' | 'rod';

export interface CellShapeSpec {
    shape: CellShape;
    // Bán kính/nửa-kích thước thân (scene units) — khớp với shellRadius trong cellData
    radius: number;
    // Tỉ lệ ellipsoid/box [x,y,z] (rod kéo dài theo x)
    dims: [number, number, number];
    camera: [number, number, number];      // vị trí camera home
    minDistance: number;
    maxDistance: number;
}

export const CELL_SHAPES: Record<string, CellShapeSpec> = {
    // Camera đặt GÓC NGHIÊNG (không chiếu thẳng) để thấy chiều sâu 3D ngay từ đầu,
    // tránh nhìn xuyên qua lớp màng/không bào trong mờ thành màn phẳng tối.
    // Động vật: blob cầu mềm, hơi bất đối xứng
    animal: { shape: 'blob', radius: 2.4, dims: [1.05, 0.98, 1.0], camera: [3.5, 2.8, 7.5], minDistance: 2, maxDistance: 22 },
    // Thực vật: hộp bo góc (thành cứng cho hình cố định)
    plant: { shape: 'box', radius: 2.6, dims: [1.12, 1.0, 0.9], camera: [5.5, 4.2, 8.5], minDistance: 2, maxDistance: 24 },
    // Vi khuẩn: hình que (capsule kéo dài)
    bacteria: { shape: 'rod', radius: 1.15, dims: [2.0, 1.0, 1.0], camera: [4, 3, 6.5], minDistance: 1.5, maxDistance: 18 }
};

export function cellShape(id: string): CellShapeSpec {
    return CELL_SHAPES[id] ?? CELL_SHAPES.animal;
}

// Vùng chạm vô hình to hơn hình ảnh — đủ cho ngón tay trẻ em (copy công thức đã tune ở solar).
export function hitRadius(visualRadius: number): number {
    return Math.min(Math.max(2.0 * visualRadius, 0.55), 1.6);
}
