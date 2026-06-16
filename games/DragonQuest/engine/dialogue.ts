// ============================================================================
//  Kho thoại + chuyển câu hỏi sang văn nói tiếng Việt cho TTS.
//  Tách riêng để dễ bổ sung và để TTS đọc tự nhiên.
// ============================================================================

import { SpeedQuestion } from '../../SpeedMath/speedMathEngine';
import { BuffType } from './types';
import { Rng, pick } from './rng';

export const COMBAT_DIALOGUES = [
    'Muốn đi qua đây ư? Trả lời câu hỏi của ta trước đã!',
    'Ngươi nghĩ dễ vượt qua à? Hãy chứng minh đi!',
    'Trả lời sai là ta ăn thịt ngươi đó nhé!',
    'Hừ! Xem nào, ngươi có thông minh không?',
    'Ta sẽ chặn đường ngươi tại đây!',
];

export const BUFF_DIALOGUES = [
    'Nếu ngươi trả lời đúng, ta sẽ ban cho ngươi một điều ước.',
    'Hãy chứng tỏ bản lĩnh, phần thưởng đang chờ!',
    'Một câu hỏi nhỏ, phần thưởng lớn.',
    'Ngươi muốn sức mạnh? Trả lời câu hỏi này đi!',
    'Ta thấy ngươi có duyên, hãy nhận phép thuật của ta!',
];

export const BOSS_DIALOGUES = [
    'Ngươi thật to gan khi dám đến đây!',
    'Ta sẽ thiêu rụi ngươi bằng ngọn lửa tri thức!',
    'Muốn đánh bại ta? Trả lời hết câu hỏi này đi!',
    'Sai một câu thôi… và ngươi sẽ cháy thành tro!',
    'Cuối cùng ngươi cũng tới! Chuẩn bị chiến đấu!',
    'Đây là trận chiến cuối cùng của ngươi!',
];

/** Khen khi trả lời đúng. */
export const CORRECT_DIALOGUES = [
    'Giỏi lắm!',
    'Chính xác!',
    'Tuyệt vời, đúng rồi!',
    'Quá thông minh!',
    'Hoan hô, bạn làm được rồi!',
];

/** Động viên khi trả lời sai. */
export const WRONG_DIALOGUES = [
    'Tiếc quá, thử lại nhé!',
    'Chưa đúng rồi, cố lên!',
    'Sai mất rồi, đừng nản nhé!',
    'Suýt nữa thôi, lần sau nhé!',
];

/** Thoại khi chiến thắng boss. */
export const WIN_DIALOGUES = [
    'Tuyệt vời! Bạn đã đánh bại rồng thần!',
    'Chiến thắng vẻ vang! Bạn là nhà vô địch!',
    'Hoan hô! Vương quốc đã được giải cứu!',
];

/** Thoại khi thua. */
export const LOSE_DIALOGUES = [
    'Ôi không, bạn đã hết mạng rồi. Thử lại nhé!',
    'Đừng buồn, lần sau bạn sẽ thắng!',
    'Rồng thần quá mạnh, hãy luyện tập thêm nhé!',
];

/** Thoại theo từng tình huống dịch chuyển. */
export const TELEPORT_FORWARD_DIALOGUES = ['Cơn lốc thần kỳ đưa bạn tiến lên!', 'Vù một cái, bạn bay về phía trước!'];
export const TELEPORT_BACKWARD_DIALOGUES = ['Ối! Cơn lốc kéo bạn lùi lại!', 'Xui rồi, bạn bị thổi ngược về sau!'];
export const TELEPORT_PROTECTED_DIALOGUES = ['Áo Choàng Bay đã bảo vệ bạn!', 'May quá, áo choàng giúp bạn đứng yên!'];

/** Câu thông báo khi nhận từng loại buff (cho TTS + hiển thị). */
export const BUFF_AWARD_DIALOGUES: Record<BuffType, string> = {
    [BuffType.HolySword]: 'Bạn nhận được Kiếm Thánh! Boss sẽ dễ hơn đấy.',
    [BuffType.HolyGrail]: 'Bạn nhận được Chén Thánh và hồi một máu!',
    [BuffType.FlyingCloak]: 'Bạn nhận được Áo Choàng Bay, miễn nhiễm dịch chuyển lùi!',
};

/** Lấy ngẫu nhiên một câu trong pool (seeded). */
export const pickDialogue = (rng: Rng, pool: readonly string[]): string => pick(rng, pool);

/**
 * Chuyển nội dung câu hỏi thành văn nói tiếng Việt cho TTS.
 * - Câu toán: đổi ký hiệu (× → nhân, ÷ → chia, =, +, − , ? → mấy).
 * - Các loại khác (quiz/color/shape/clock/typing): nội dung vốn đã là câu
 *   tiếng Việt tự nhiên ("Màu này là màu gì?") → đọc thẳng.
 */
export function questionToSpeech(q: Pick<SpeedQuestion, 'type' | 'content'>): string {
    if (q.type !== 'math') return q.content;
    return q.content
        .replace(/×/g, ' nhân ')
        .replace(/÷/g, ' chia ')
        .replace(/\+/g, ' cộng ')
        .replace(/−/g, ' trừ ')
        .replace(/-/g, ' trừ ')
        .replace(/=/g, ' bằng ')
        .replace(/\?/g, ' mấy')
        .replace(/\s+/g, ' ')
        .trim();
}
