// Kiểu dùng chung của lõi Ôn Luyện (không phụ thuộc React).
import type { Grade, Question } from '../../types';

/** Mạch kiến thức. explore: Mầm non (màu sắc, thời gian). */
export type Strand = 'number' | 'geometry' | 'measurement' | 'statistics' | 'probability' | 'explore';
/** M1 nhận biết · M2 hiểu / làm được · M3 vận dụng (Thông tư 27). */
export type Level = 1 | 2 | 3;
export type Term = 1 | 2;
/** Khớp topicId của thành tích topic_mastery (src/data/achievements.json). */
export type OpTag = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'geometry' | 'fractions';

export interface SkillDef {
    id: string;
    grade: Grade;
    topicId: string;
    strand: Strand;
    term: Term;
    title: string;
    levels: Level[];
    advanced?: boolean;
    ops?: OpTag[];
    /** Kỹ năng bọc generator cũ (chưa chuyển sang template). Ẩn khỏi giao diện kỹ năng. */
    legacy?: boolean;
}

export interface GenOpts { skillId?: string; level?: Level }
export type Generated = Omit<Question, 'id' | 'topicId'>;
export interface Template {
    skillId: string;
    level: Level;
    weight?: number;
    make: () => Generated;
    /** Luật riêng của template; trả chuỗi mô tả lỗi hoặc null. Chạy trong invariants.test. */
    check?: (q: Generated) => string | null;
    /** Câu có số thập phân hợp lệ (bỏ qua kiểm "dấu phẩy nhóm nghìn"). */
    decimal?: boolean;
}

export type CompactQuestion = Omit<Question, 'visualSvg'>;

// ---------------------------------------------------------------------------
//  Tiến độ (lưu ở StudentProfile.study)
// ---------------------------------------------------------------------------
export interface SkillState {
    /** số lần làm */ a: number;
    /** số lần đúng ngay lần đầu */ c: number;
    /** độ thành thạo 0..1 */ m: number;
    /** mức gợi ý cho lần sau */ lvl: Level;
    /** lần làm gần nhất (ISO) */ last: string;
}
export interface ReviewItem { key: string; skillId: string; q: CompactQuestion; step: 0 | 1 | 2 | 3; due: string }
export interface StudyProgress {
    version: 1;
    skills: Record<string, SkillState>;
    review: ReviewItem[];
    /** 'YYYY-MM-DD' (giờ địa phương) → số câu, số câu đúng; giữ 60 ngày */
    days: Record<string, { n: number; c: number }>;
    streak: { count: number; last: string };
    /** ngày (YYYY-MM-DD) đã hoàn thành "Ôn hôm nay" gần nhất */
    dailyDone?: string;
    prefs: { tts?: boolean; showAdvanced?: boolean };
}
