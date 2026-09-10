import { Grade } from '../../../types';
import { isPreschool } from '../../utils/grade';

export type ModeId = 'study' | 'game' | 'library' | 'riddle' | 'coding' | 'science' | 'alphabet' | 'counting' | 'colors';
export type GameId = 'memory' | 'sound-memory' | 'speed-math' | 'dragon-quest' | 'math-racing' | 'sudoku' | 'gears-menu' | 'gears-build' | 'gears-guess';
export type ArtId = ModeId | GameId;
export type Level = 'easy' | 'medium' | 'hard';
export interface HubEntry<T extends string> { id: T; title: string; subtitle: string; description: string; art: ArtId; label: string }

const modes: HubEntry<ModeId>[] = [
    { id: 'study', title: 'Ôn Luyện', subtitle: 'Mỗi ngày một chút tiến bộ', description: 'Luyện toán theo lớp của em.', art: 'study', label: 'TOÁN HỌC' },
    { id: 'game', title: 'Trò Chơi', subtitle: 'Những thế giới đang chờ em', description: 'Chơi vui, khám phá điều mới.', art: 'game', label: 'HỌC QUA TRÒ CHƠI' },
    { id: 'library', title: 'Thư Viện', subtitle: 'Mở sách, mở một thế giới', description: 'Đọc sách và tìm điều em tò mò.', art: 'library', label: 'ĐỌC & KHÁM PHÁ' },
    { id: 'riddle', title: 'Đố Vui Nhân Sư', subtitle: 'Sphinx Riddle', description: 'Thử tài suy luận cùng Nhân sư.', art: 'riddle', label: 'SUY LUẬN' },
    { id: 'coding', title: 'Lập Trình Nhí', subtitle: 'Biệt đội Rover', description: 'Dẫn rover đi thám hiểm hành tinh.', art: 'coding', label: 'SÁNG TẠO' },
    { id: 'science', title: 'Khoa Học', subtitle: 'Một vũ trụ để khám phá', description: 'Từ thế giới tí hon đến các vì sao.', art: 'science', label: 'TÒ MÒ & TÌM HIỂU' },
];
const preschoolModes: HubEntry<ModeId>[] = [
    { id: 'alphabet', title: 'Bảng Chữ Cái', subtitle: 'Những người bạn A–Z', description: 'Làm quen chữ cái tiếng Anh.', art: 'alphabet', label: 'HỌC CHỮ' },
    { id: 'counting', title: 'Đếm Số', subtitle: 'Mỗi vật một con số', description: 'Cùng đếm từ 1 đến 10.', art: 'counting', label: 'HỌC ĐẾM' },
    { id: 'colors', title: 'Màu Sắc & Hình Dạng', subtitle: 'Thế giới nhiều sắc màu', description: 'Nhận biết màu sắc và hình dạng.', art: 'colors', label: 'QUAN SÁT' },
];
export const GAME_CATALOG: HubEntry<GameId>[] = [
    { id: 'memory', title: 'Lật Thẻ', subtitle: 'Đảo Ký Ức', description: 'Tìm cặp hình, làm hòn đảo thêm rực rỡ.', art: 'memory', label: 'GHI NHỚ' },
    { id: 'sound-memory', title: 'Giai Điệu Vui Nhộn', subtitle: 'Ban Nhạc Tí Hon', description: 'Nghe giai điệu, gõ nhịp và viết bài nhạc.', art: 'sound-memory', label: 'ÂM NHẠC' },
    { id: 'speed-math', title: 'Đua Tốc Độ', subtitle: 'Đấu Trường Tia Chớp', description: 'Chọn, nối, xếp để thắp sáng sân khấu!', art: 'speed-math', label: 'PHẢN XẠ & TƯ DUY' },
    { id: 'dragon-quest', title: 'Đại Chiến Rồng Thần', subtitle: 'Hành trình của dũng sĩ', description: 'Cưỡi ngựa qua 5 vùng đất, đánh thức rồng.', art: 'dragon-quest', label: 'PHIÊU LƯU' },
    { id: 'math-racing', title: 'Đường Đua Thần Tốc', subtitle: 'Cúp Sao Băng', description: 'Tính thật chắc, nạp nitro, bứt phá về đích!', art: 'math-racing', label: 'LÁI XE & TÍNH NHẨM' },
    { id: 'sudoku', title: 'Sudoku Logic', subtitle: 'Mỗi con số, một khám phá', description: 'Tìm vị trí đúng cho những con số.', art: 'sudoku', label: 'LOGIC' },
    { id: 'gears-menu', title: 'Kỹ Sư Máy Móc', subtitle: 'Xưởng Sáng Chế', description: 'Lắp ráp, tìm lỗi và đánh thức sáu cỗ máy.', art: 'gears-menu', label: 'LẮP RÁP & SUY LUẬN' },
];
export const GEAR_CATALOG: HubEntry<GameId>[] = [
    { id: 'gears-build', title: 'Lắp Bánh Răng', subtitle: 'Bắt tay chế tạo', description: 'Lắp bánh, nối đai, sửa lỗi và điều chỉnh tốc độ.', art: 'gears-build', label: 'CHẾ TẠO' },
    { id: 'gears-guess', title: 'Đoán Chiều Quay', subtitle: 'Nhìn kỹ, nghĩ khéo', description: 'Dự đoán hướng chuyển động của bánh răng.', art: 'gears-guess', label: 'SUY LUẬN' },
];
export function modesFor(grade?: Grade) {
    return isPreschool(grade) ? [...preschoolModes, ...modes.filter(m => ['game', 'library', 'science'].includes(m.id))] : modes;
}
export function gamesFor(grade?: Grade) {
    return isPreschool(grade) ? GAME_CATALOG.filter(g => g.id === 'memory' || g.id === 'sound-memory') : GAME_CATALOG;
}
export interface LegacyFlags { memory: boolean; sound: boolean; dragon: boolean; racing?: boolean }
export interface GameEntry { id: GameId; classic: boolean; level: Level; needsSetup: boolean; requestedLevel?: Level }
// Apply the same grade gate to cards, direct links and browser Forward.
export function resolveEntry(params: URLSearchParams, grade: Grade | undefined, flags: LegacyFlags): GameEntry | null {
    const id = params.get('play') as GameId;
    if (![...GAME_CATALOG, ...GEAR_CATALOG].some(g => g.id === id)) return null;
    if (isPreschool(grade) && id !== 'memory' && id !== 'sound-memory') return null;
    const classic = ['memory', 'sound-memory', 'dragon-quest', 'math-racing', 'gears-build', 'gears-guess'].includes(id) && (params.get('edition') === 'classic' || (id === 'memory' ? flags.memory : id === 'sound-memory' ? flags.sound : id === 'dragon-quest' ? flags.dragon : id === 'math-racing' && !!flags.racing));
    const raw = params.get('level');
    const valid = ['easy', 'medium', 'hard'].includes(raw || '') && !(isPreschool(grade) && raw === 'hard');
    const modernSetup = ['math-racing', 'gears-build', 'gears-guess'].includes(id);
    const needsLevel = classic;
    return { id, classic, level: (needsLevel || modernSetup) && valid ? raw as Level : 'easy', needsSetup: needsLevel && !valid,
        ...(modernSetup && !classic && valid ? { requestedLevel: raw as Level } : {}) };
}
export function gameTitle(id: GameId) {
    return [...GAME_CATALOG, ...GEAR_CATALOG].find(g => g.id === id)?.title || 'Trò chơi';
}
