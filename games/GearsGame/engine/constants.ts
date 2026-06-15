// ============================================================================
//  GearsGame — Single source of truth cho mọi hằng số.
//  Trước đây các hằng (CANVAS_HEIGHT, quy đổi teeth<->radius, tốc độ motor...)
//  rải rác và mâu thuẫn giữa 3 file. Toàn bộ gom về đây.
// ============================================================================

/** Không gian thiết kế (design space). Mọi toạ độ trong engine/levelgen đều
 *  nằm trong hệ này; render scale-to-fit nên generator & màn hình luôn khớp. */
export const CANVAS = { W: 800, H: 460 } as const;

/** Lề vùng đặt bánh răng trong design space. */
export const PLAY = {
    top: 50,
    bottom: CANVAS.H - 50,
    left: 45,
    right: CANVAS.W - 45,
} as const;

/** Quy đổi DUY NHẤT giữa số răng và bán kính (module của bánh răng).
 *  radius = teeth * PX_PER_TOOTH  ⇒ teeth ∝ radius, nên tỉ số tốc độ theo
 *  răng và theo bán kính trùng nhau (sửa lỗi belt dùng teeth thay vì radius). */
export const PX_PER_TOOTH = 3;
export const teethToRadius = (teeth: number) => teeth * PX_PER_TOOTH;
export const radiusToTeeth = (radius: number) => Math.round(radius / PX_PER_TOOTH);

/** Các cỡ bánh răng người chơi có thể chọn (số răng). */
export const GEAR_SIZES = [8, 12, 16] as const;
export const SIZE_LABEL: Record<number, string> = { 8: 'S', 12: 'M', 16: 'L' };

/** Dung sai ăn khớp TƯƠNG ĐỐI theo kích thước (không còn ±8px tuyệt đối).
 *  Hai bánh ăn khớp khi |khoảng cách tâm - (r1+r2)| <= max(MIN, ratio*(r1+r2)). */
export const MESH_TOL_RATIO = 0.1;
export const MESH_TOL_MIN = 5;
/** Khe hở nhỏ khi đặt bánh răng cho khỏi đè nhau. */
export const PLACE_GAP = 3;

/** Cấu hình motor mặc định. speed = vòng/giây (đơn vị tốc độ góc nội bộ). */
export const MOTOR = { teeth: 12, dir: 1 as 1 | -1, speed: 1 };

/** Tốc độ góc -> độ/giây khi hiển thị (để vòng quay "êm" cho trẻ nhìn). */
export const DEG_PER_SPEED = 90;

/** Ngưỡng coi hai tốc độ là "khác nhau" khi kiểm tra quá-ràng-buộc. */
export const SPEED_EPS = 1e-3;

/** Màu theo vai trò / trạng thái — dùng chung cho mọi nơi vẽ bánh răng. */
export const COLORS = {
    motor: '#22c55e',
    target: '#f43f5e',
    anchor: '#94a3b8',
    gear: '#facc15',
    toolboxGear: '#f59e0b',
    jammed: '#ef4444',
    stroke: '#1f2937',
} as const;
