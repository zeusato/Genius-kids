// ============================================================================
//  DragonQuest — NGUỒN SỰ THẬT DUY NHẤT cho mọi hằng số.
//  Trước đây luật chơi, mốc thời gian và "magic number" rải khắp component
//  (vd parent đợi 1700ms để khớp tay với animation 1500ms của DiceRoll). Gom hết
//  về đây để engine/hook/UI luôn đồng bộ và dễ chỉnh cân bằng.
// ============================================================================

/** Tổng số ô của bàn cờ (ô cuối luôn là Boss). */
export const MAP_LENGTH = 50;

/** Tỉ lệ phân bố loại ô (không tính ô Boss). Phần còn lại là ô thường. */
export const TILE_DISTRIBUTION = {
    combat: 0.4,
    buff: 0.2,
    teleport: 0.15,
} as const;

/** Máu khởi đầu & trần máu. */
export const START_HP = 3;
export const MAX_HP = 3;

/** Trần số lượng từng buff. */
export const BUFF_CAPS = {
    holySword: 2, // mỗi kiếm giảm 1 câu hỏi boss
    holyGrail: 3, // mỗi chén hồi 1 máu (kẹp theo MAX_HP)
} as const;

/** Điểm thưởng theo loại sự kiện. */
export const SCORE = {
    combat: 10,
    buff: 15,
    boss: 20,
} as const;

/** Điểm tối đa danh nghĩa truyền lên onComplete (giữ như bản cũ). */
export const MAX_SCORE = 300;

/** Số câu hỏi boss = BASE − số kiếm thánh, sàn tại MIN. */
export const BOSS_QUESTIONS_BASE = 5;
export const BOSS_QUESTIONS_MIN = 3;

/** Biên độ dịch chuyển: khoảng cách trong [-RANGE, +RANGE]. */
export const TELEPORT_RANGE = 8;

// --- MỐC THỜI GIAN (ms) ---
/** Thời lượng animation gieo xúc xắc trước khi ra kết quả. */
export const DICE_MS = 1100;
/** Thời gian nhân vật nhảy qua MỖI ô. */
export const STEP_MS = 300;
/** Khoảng dừng sau khi tới ô đích trước khi kích hoạt sự kiện. */
export const LAND_DELAY_MS = 350;
/** Thời gian hiển thị feedback đúng/sai trong modal trước khi đóng. */
export const FEEDBACK_MS = 1100;
/** Thời lượng overlay dịch chuyển. */
export const TELEPORT_MS = 5000;

// --- DUCKING NHẠC NỀN KHI ĐỌC TTS ---
/** Âm lượng nhạc nền khi đang đọc (giảm tạm). */
export const DUCK_VOLUME = 0.12;
/** Âm lượng nhạc nền mặc định của app (services/musicManager khởi tạo 0.4). */
export const MUSIC_VOLUME = 0.4;

// --- HÌNH HỌC BÀN CỜ (camera bám nhân vật) ---
/** Kích thước ô & khoảng cách theo breakpoint (px, trong hệ toạ độ board). */
export const BOARD = {
    mobile: { tile: 56, gapX: 18, gapY: 30, padding: 24 },
    desktop: { tile: 72, gapX: 28, gapY: 46, padding: 44 },
} as const;
/** Dưới ngưỡng này coi là mobile (khớp Tailwind md = 768). */
export const MOBILE_BREAKPOINT = 768;
