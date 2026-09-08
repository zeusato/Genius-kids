import { Timbre } from '../audio/voices';
export interface Phrase { kind: 'melody' | 'rhythm'; notes: number[]; beats: number[]; length: number }
export interface SoundMission { id: string; number: number; chapter: number; title: string; detail: string; timbre: Timbre; bpm: number; pads: number; phrases: Phrase[] }
const melody = (...notes: number[]): Phrase => ({ kind: 'melody', notes, beats: notes.map((_, i) => i), length: notes.length });
const rhythm = (beats: number[], notes = beats.map(() => 0), length = 4): Phrase => ({ kind: 'rhythm', notes, beats, length });
export const CHAPTERS = [
    { title: 'Lời chào của gỗ', subtitle: 'Những nốt nhạc đầu tiên', gift: 'Bạn Gấu & sân khấu Khu vườn', color: '#e99c55' },
    { title: 'Khu vườn ngân nga', subtitle: 'Lắng nghe cao và thấp', gift: 'Chuông ngân & bạn Thỏ', color: '#81aa9b' },
    { title: 'Bước chân của nhịp', subtitle: 'Gõ, nghỉ, rồi cùng hòa nhịp', gift: 'Dàn trống trong phòng sáng tác', color: '#8797cc' },
    { title: 'Đêm nhạc của mình', subtitle: 'Cả ban nhạc cùng biểu diễn', gift: 'Phím mềm, 16 ô & sân khấu Lễ hội', color: '#c48ba3' },
];
const rows: [string, string, Phrase[]][] = [
    ['Xin chào, nốt nhạc!', 'Nghe hai tiếng, rồi chạm hai phím.', [melody(0, 2), melody(1, 3), melody(2, 0)]],
    ['Hai tiếng giống nhau', 'Cùng một phím, hai lần chạm riêng.', [melody(0, 0), melody(2, 2), melody(3, 3, 0)]],
    ['Chiếc thang nhỏ', 'Ba nốt nhạc bước lên cao.', [melody(0, 1, 2), melody(1, 2, 3), melody(2, 1, 0)]],
    ['Đi rồi về', 'Nốt đầu cũng là nốt cuối.', [melody(0, 2, 0), melody(1, 3, 1), melody(2, 0, 2)]],
    ['Hai người bạn', 'Ghi nhớ từng nhóm hai tiếng.', [melody(0, 1, 0, 1), melody(2, 3, 2, 3), melody(0, 0, 2, 2)]],
    ['Buổi diễn đầu tiên', 'Ba câu nhạc quen, một sân khấu mới.', [melody(0, 1, 2), melody(3, 1, 3), melody(0, 2, 1, 0)]],
    ['Chim cao, suối thấp', 'Lắng nghe hai đầu của giai điệu.', [melody(0, 3, 0), melody(3, 0, 3), melody(0, 1, 3, 0)]],
    ['Chào bạn La', 'Thêm một phím vàng thật cao.', [melody(3, 4), melody(2, 3, 4), melody(4, 2, 0)]],
    ['Gõ cửa khu vườn', 'Hai tiếng lặp, một tiếng mới.', [melody(1, 1, 3), melody(4, 4, 2), melody(0, 0, 2, 3)]],
    ['Tiếng gọi, lời đáp', 'Những câu nhạc có điểm tựa.', [melody(0, 2, 3, 2), melody(1, 3, 4, 3), melody(4, 3, 1, 0)]],
    ['Dòng suối uốn quanh', 'Chia giai điệu dài thành nhóm nhỏ.', [melody(0, 1, 2, 1, 0), melody(2, 3, 4, 3, 2), melody(0, 2, 3, 3, 2, 0)]],
    ['Khu vườn hòa ca', 'Đàn chuông kể ba câu chuyện.', [melody(0, 2, 3, 4), melody(4, 3, 2, 3, 2), melody(0, 0, 2, 3, 2, 0)]],
    ['Bốn bước chân', 'Đợi đếm bốn nhịp rồi gõ theo.', [rhythm([0, 1, 2, 3]), rhythm([0, 1, 2, 3]), rhythm([0, 1, 2, 3])]],
    ['Khoảng lặng biết hát', 'Ô trống là lúc đôi tay nghỉ.', [rhythm([0, 2, 3]), rhythm([0, 1, 3]), rhythm([0, 2])]],
    ['Bùm và tách', 'Trống trầm và tiếng vỗ tay thay phiên.', [rhythm([0, 1, 2, 3], [0, 1, 0, 1]), rhythm([0, 2, 3], [0, 0, 1]), rhythm([0, 1, 3], [1, 0, 1])]],
    ['Đường nhịp dài', 'Hai nhóm bốn nhịp nối nhau.', [rhythm([0, 1, 2, 3, 4, 5, 6, 7], undefined, 8), rhythm([0, 2, 4, 6], [0, 1, 0, 1], 8), rhythm([0, 1, 3, 4, 5, 7], [0, 1, 1, 0, 1, 1], 8)]],
    ['Cặp bước tí hon', 'Có hai tiếng nhanh nằm cạnh nhau.', [rhythm([0, 1, 1.5, 3]), rhythm([0, .5, 2, 3]), rhythm([0, 1, 2, 2.5, 3], [0, 1, 0, 0, 1])]],
    ['Ngày hội trống', 'Gõ cả tiếng trống lẫn khoảng lặng.', [rhythm([0, 1, 2, 3], [0, 1, 0, 1]), rhythm([0, .5, 2, 3], [0, 0, 1, 1]), rhythm([0, 2, 3, 4, 6, 7], [0, 0, 1, 0, 0, 1], 8)]],
    ['Ban nhạc thức giấc', 'Gửi giai điệu của mình tới sân khấu.', [melody(0, 2, 3, 2), melody(1, 2, 4, 3), melody(0, 2, 3, 4, 2, 0)]],
    ['Lời đáp của trống', 'Nghe câu trống, rồi đáp lại.', [rhythm([0, 1, 2, 3], [0, 1, 0, 1]), rhythm([0, 1, 1.5, 3], [0, 1, 1, 0]), rhythm([0, 2, 3, 4, 6, 7], [0, 1, 1, 0, 1, 1], 8)]],
    ['Một câu chuyện mới', 'Phím mềm đem đến màu âm khác.', [melody(2, 3, 4, 2), melody(0, 1, 3, 2, 0), melody(0, 2, 4, 4, 3, 0)]],
    ['Nhịp cầu âm nhạc', 'Từng nhóm nhịp, rồi nối lại.', [rhythm([0, .5, 2, 3], [0, 0, 1, 0]), rhythm([0, 1, 3, 4, 5, 7], [0, 1, 1, 0, 1, 1], 8), rhythm([0, 1, 2, 2.5, 3], [0, 1, 0, 0, 1])]],
    ['Chuyền lượt cho bạn', 'Giai điệu và nhịp trống lần lượt lên sân khấu.', [melody(0, 2, 3, 2, 0), rhythm([0, 1, 2, 3], [0, 1, 0, 1]), melody(4, 3, 2, 1, 0)]],
    ['Đêm nhạc tí hon', 'Ba phần biểu diễn. Sau đó, tự viết bài của mình!', [melody(0, 2, 3, 4, 2, 0), rhythm([0, 1, 3, 4, 5, 7], [0, 1, 1, 0, 1, 1], 8), melody(0, 1, 2, 3, 2, 0)]],
];
export const SOUND_MISSIONS: SoundMission[] = rows.map(([title, detail, phrases], i) => ({ id: `band-${i + 1}`, number: i + 1, chapter: Math.floor(i / 6), title, detail, phrases, timbre: i < 11 ? 'wood' : i < 20 ? 'bell' : 'keys', bpm: i < 12 ? 88 : i < 16 ? 80 : i < 18 ? 86 : 92, pads: i < 7 ? 4 : 5 }));
export function phraseFor(mission: SoundMission, index: number, seed: number): Phrase {
    const p = mission.phrases[index];
    // Keep authored contours; the alternate seed mirrors the complete motif.
    return { ...p, beats: [...p.beats], notes: p.kind === 'melody' && (seed >>> 0) % 2 ? p.notes.map(n => mission.pads - 1 - n) : [...p.notes] };
}
