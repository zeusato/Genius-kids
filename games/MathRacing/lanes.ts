// Hình học làn đường — NGUỒN SỰ THẬT DÙNG CHUNG cho xe, đáp án và mặt đường.
// Trước đây mỗi nơi tự hardcode 16.66/50/83.33% trong khi đường lại vẽ phối cảnh
// 3D ⇒ đáp án "trôi" ra ngoài mặt đường. Gom về đây để mọi thứ luôn khớp.

/** Mép đường tính theo % bề ngang khung chơi (chừa cỏ hai bên). */
export const ROAD_LEFT = 8;
export const ROAD_RIGHT = 92;

/** Tâm 3 làn (trái / giữa / phải) — chia đều mặt đường. */
export const LANE_LEFT = ['22%', '50%', '78%'] as const;

/** 2 vạch phân làn nằm giữa các làn. */
export const DIVIDER_LEFT = ['36%', '64%'] as const;

/** Lấy vị trí trái (%) cho một làn, mặc định làn giữa nếu sai chỉ số. */
export const laneLeft = (lane: number): string => LANE_LEFT[lane] ?? '50%';
