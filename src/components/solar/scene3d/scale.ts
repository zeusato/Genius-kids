// Công thức tỷ lệ cho scene 3D — nén power-law từ số liệu NASA thật.
// Tỷ lệ thật không thể hiển thị (Jupiter:Mercury = 29,3:1 đường kính; Neptune:Mercury = 78:1
// khoảng cách), nên nén theo MỘT luật nhất quán: thứ tự và cảm giác "xa hơn = chậm hơn,
// to hơn" luôn đúng. Kích thước và tốc độ đã được điều chỉnh để dễ quan sát.

// Khoảng cách quỹ đạo: d = 9.4 × AU^0.48
// Ràng buộc: quỹ đạo Sao Thủy ≥ 2× bán kính Mặt Trời; Sao Hải Vương ≤ ~50 units.
export function orbitRadius(au: number): number {
    return 9.4 * Math.pow(au, 0.48);
}

// Bán kính hành tinh: r = 0.007 × D_km^0.45
export function planetRadius(diameterKm: number): number {
    return 0.007 * Math.pow(diameterKm, 0.45);
}

// Mặt Trời KHÔNG theo công thức (nếu theo sẽ nuốt quỹ đạo Sao Thủy) — cố định.
export const SUN_RADIUS = 2.5;
export const SUN_HIT_RADIUS = 3.0;

// Vùng chạm: hit sphere vô hình to hơn hình ảnh, đủ cho ngón tay trẻ em
// (Sao Thủy ~10px hình ảnh nhưng ~62px vùng chạm ở camera mặc định).
export function hitRadius(visualRadius: number): number {
    return Math.min(Math.max(2.1 * visualRadius, 1.0), 2.6);
}

// Chu kỳ quỹ đạo trong scene (giây, ở tốc độ 1x): T = 16s × (chu kỳ năm)^0.6
// Kepler nén — Mercury 6.8s ... Neptune 342s: "xa hơn = chậm hơn" rõ ràng nhưng vẫn quan sát được.
export function scenePeriodSeconds(periodYears: number): number {
    return 16 * Math.pow(periodYears, 0.6);
}

// Chu kỳ tự quay trong scene (giây): S = 8s × (|giờ|/24)^0.5, giữ DẤU (âm = quay ngược).
// Số vòng quay thật (365 vòng/quỹ đạo) sẽ thành vệt mờ — bắt buộc phải nén.
export function spinPeriodSeconds(rotationHours: number): number {
    const magnitude = 8 * Math.sqrt(Math.abs(rotationHours) / 24);
    return rotationHours < 0 ? -magnitude : magnitude;
}

// Vành đai tiểu hành tinh: 2,2–3,2 AU (NASA) → bán kính scene
export const BELT_INNER = orbitRadius(2.2);
export const BELT_OUTER = orbitRadius(3.2);
export const BELT_CENTER = (BELT_INNER + BELT_OUTER) / 2;

// Camera mặc định nhìn toàn hệ
export const HOME_CAMERA_POSITION: [number, number, number] = [0, 30, 62];
export const HOME_CAMERA_TARGET: [number, number, number] = [0, 0, 0];
