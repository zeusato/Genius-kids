import { Grade } from '../../../types';
import { isPreschool } from '../../utils/grade';

export type ModeId = 'study' | 'game' | 'library' | 'riddle' | 'piano' | 'science' | 'alphabet' | 'counting' | 'colors';
export type GameId = 'farm' | 'caro' | 'coding' | 'memory' | 'sound-memory' | 'speed-math' | 'dragon-quest' | 'math-racing' | 'sudoku' | 'gears-menu' | 'gears-build' | 'gears-guess' | 'horse-race' | 'o-an-quan' | 'co-ti-phu' | 'board-games' | 'co-vua' | 'co-tuong';
export type ScienceId = 'solar-system' | 'planet-maker' | 'periodic-table' | 'electricity' | 'cell-biology' | 'evolution';
export type ArtId = ModeId | GameId | `science-${ScienceId}`;
export type Level = 'easy' | 'medium' | 'hard';
export interface HubEntry<T extends string> { id: T; title: string; subtitle: string; description: string; art: ArtId; label: string }

const modes: HubEntry<ModeId>[] = [
    { id: 'study', title: 'Ôn Luyện', subtitle: 'Mỗi ngày một chút tiến bộ', description: 'Luyện toán theo lớp của em.', art: 'study', label: 'TOÁN HỌC' },
    { id: 'game', title: 'Trò Chơi', subtitle: 'Những thế giới đang chờ em', description: 'Chơi vui, khám phá điều mới.', art: 'game', label: 'HỌC QUA TRÒ CHƠI' },
    { id: 'library', title: 'Thư Viện', subtitle: 'Mở sách, mở một thế giới', description: 'Đọc sách và tìm điều em tò mò.', art: 'library', label: 'ĐỌC & KHÁM PHÁ' },
    { id: 'riddle', title: 'Đố Vui Nhân Sư', subtitle: 'Sphinx Riddle', description: 'Thử tài suy luận cùng Nhân sư.', art: 'riddle', label: 'SUY LUẬN' },
    { id: 'piano', title: 'Piano Nhí', subtitle: 'Phòng nhạc trong vườn', description: 'Làm quen nốt nhạc, tập đàn và tự sáng tạo.', art: 'piano', label: 'ÂM NHẠC & SÁNG TẠO' },
    { id: 'science', title: 'Khoa Học', subtitle: 'Một vũ trụ để khám phá', description: 'Từ thế giới tí hon đến các vì sao.', art: 'science', label: 'TÒ MÒ & TÌM HIỂU' },
];
const preschoolModes: HubEntry<ModeId>[] = [
    { id: 'alphabet', title: 'Bảng Chữ Cái', subtitle: 'Những người bạn A–Z', description: 'Làm quen chữ cái tiếng Anh.', art: 'alphabet', label: 'HỌC CHỮ' },
    { id: 'counting', title: 'Đếm Số', subtitle: 'Mỗi vật một con số', description: 'Cùng đếm từ 1 đến 10.', art: 'counting', label: 'HỌC ĐẾM' },
    { id: 'colors', title: 'Màu Sắc & Hình Dạng', subtitle: 'Thế giới nhiều sắc màu', description: 'Nhận biết màu sắc và hình dạng.', art: 'colors', label: 'QUAN SÁT' },
];
export const BOARD_GAME_CATALOG: HubEntry<GameId>[] = [
    { id: 'co-ti-phu', title: 'Cờ Tỉ Phú', subtitle: 'Phố Nhỏ Tỉ Phú', description: 'Mở cửa tiệm, xây khu phố và cùng cả nhà trở thành tỉ phú.', art: 'co-ti-phu', label: '2–4 NGƯỜI · CÙNG MỘT MÁY' },
    { id: 'o-an-quan', title: 'Ô Ăn Quan', subtitle: 'Sân đình tí hon', description: 'Chọn ô, rải dân và tìm nước hay. Cùng bạn hoặc thử tài với máy.', art: 'o-an-quan', label: '2 NGƯỜI · CÙNG MỘT MÁY' },
    { id: 'horse-race', title: 'Cờ Cá Ngựa', subtitle: 'Cuộc đua trong vườn', description: 'Rủ bạn cùng chơi, thi tài với máy và đưa ngựa về chuồng.', art: 'horse-race', label: '2–4 NGƯỜI · CÙNG MỘT MÁY' },
    { id: 'co-vua', title: 'Cờ Vua', subtitle: 'Vườn cờ trí tuệ', description: 'Khám phá 64 ô cờ, luyện cùng máy hoặc đấu trí với bạn.', art: 'co-vua', label: '1–2 NGƯỜI · CHIẾN THUẬT' },
    { id: 'co-tuong', title: 'Cờ Tướng', subtitle: 'Kỳ Viên', description: 'Bày quân giữa khu vườn, cùng tìm những nước cờ hay.', art: 'co-tuong', label: '1–2 NGƯỜI · CHIẾN THUẬT' },
    { id: 'caro', title: 'Cờ Ca-rô', subtitle: 'Góc giấy ô ly', description: 'Một nét X, một vòng O. Nối năm quân, cùng tìm nước hay.', art: 'caro', label: '1–2 NGƯỜI · X & O' },
];
export const GAME_CATALOG: HubEntry<GameId>[] = [
    { id: 'board-games', title: 'Board games', subtitle: 'Cùng ngồi vào bàn', description: 'Những bàn cờ quen thuộc, những cuộc vui cùng bạn bè và gia đình.', art: 'board-games', label: 'CÙNG CHƠI · CÙNG SUY NGHĨ' },
    { id: 'farm', title: 'Làng Mầm', subtitle: 'Một góc bình yên', description: 'Gieo hạt, xây nhà, khám phá vùng đất và nuôi lớn nông trại của riêng mình.', art: 'farm', label: 'NÔNG TRẠI & KHÁM PHÁ' },
    { id: 'coding', title: 'Lập Trình Nhí', subtitle: 'Biệt đội Rover', description: 'Dẫn rover đi thám hiểm hành tinh bằng những khối lệnh.', art: 'coding', label: 'LẬP TRÌNH & SÁNG TẠO' },
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
    return isPreschool(grade) ? [...preschoolModes, ...modes.filter(m => ['game', 'library', 'piano', 'science'].includes(m.id))] : modes;
}
export const SCIENCE_CATALOG: (HubEntry<ScienceId> & { route: `/science/${ScienceId}`; allowPreschool: boolean })[] = [
    { id: 'solar-system', title: 'Khám Phá Hệ Mặt Trời', subtitle: 'Một chuyến đi vào vũ trụ', description: 'Ghé thăm các hành tinh và ngắm thế giới ngoài Trái Đất.', art: 'science-solar-system', label: 'THIÊN VĂN', route: '/science/solar-system', allowPreschool: true },
    { id: 'planet-maker', title: 'Xưởng Hành Tinh', subtitle: 'Tạo thế giới của riêng em', description: 'Nặn núi, thêm biển và phủ xanh hành tinh của em.', art: 'science-planet-maker', label: 'SÁNG TẠO', route: '/science/planet-maker', allowPreschool: true },
    { id: 'periodic-table', title: 'Bảng Tuần Hoàn', subtitle: 'Những viên gạch của vật chất', description: 'Làm quen các nguyên tố và quan sát mô hình nguyên tử.', art: 'science-periodic-table', label: 'HÓA HỌC', route: '/science/periodic-table', allowPreschool: false },
    { id: 'electricity', title: 'Điện & Mạch Điện', subtitle: 'Tự tay thắp sáng bóng đèn', description: 'Nối linh kiện, thử công tắc và xem dòng điện chuyển động.', art: 'science-electricity', label: 'VẬT LÝ', route: '/science/electricity', allowPreschool: false },
    { id: 'cell-biology', title: 'Khám Phá Tế Bào', subtitle: 'Cả thế giới trong một điều nhỏ', description: 'Nhìn vào tế bào động vật, thực vật và vi khuẩn.', art: 'science-cell-biology', label: 'SINH HỌC', route: '/science/cell-biology', allowPreschool: true },
    { id: 'evolution', title: 'Cây Tiến Hóa', subtitle: 'Lần theo những nhánh sự sống', description: 'Tìm hiểu nguồn gốc và sự đa dạng của các loài sinh vật.', art: 'science-evolution', label: 'THẾ GIỚI TỰ NHIÊN', route: '/science/evolution', allowPreschool: false },
];
export function scienceFor(grade?: Grade) {
    return isPreschool(grade) ? SCIENCE_CATALOG.filter(item => item.allowPreschool) : SCIENCE_CATALOG;
}
export function isBoardGame(id: GameId) { return BOARD_GAME_CATALOG.some(game => game.id === id); }
export function boardGamesFor(grade?: Grade) {
    return isPreschool(grade) ? BOARD_GAME_CATALOG.filter(game => game.id === 'horse-race' || game.id === 'o-an-quan' || game.id === 'caro') : BOARD_GAME_CATALOG;
}
export function gameParent(id: GameId) {
    return isBoardGame(id) ? '?play=board-games' : id.startsWith('gears-') && id !== 'gears-menu' ? '?play=gears-menu' : '';
}
export function gamesFor(grade?: Grade) {
    return isPreschool(grade) ? GAME_CATALOG.filter(g => g.id === 'farm' || g.id === 'memory' || g.id === 'sound-memory' || g.id === 'board-games') : GAME_CATALOG;
}
export interface LegacyFlags { memory: boolean; sound: boolean; dragon: boolean; racing?: boolean }
export interface GameEntry { id: GameId; classic: boolean; level: Level; needsSetup: boolean; requestedLevel?: Level }
// Apply the same grade gate to cards, direct links and browser Forward.
export function resolveEntry(params: URLSearchParams, grade: Grade | undefined, flags: LegacyFlags): GameEntry | null {
    const id = params.get('play') as GameId;
    if (![...GAME_CATALOG, ...BOARD_GAME_CATALOG, ...GEAR_CATALOG].some(g => g.id === id)) return null;
    if (isPreschool(grade) && id !== 'farm' && id !== 'board-games' && id !== 'memory' && id !== 'sound-memory' && id !== 'horse-race' && id !== 'o-an-quan' && id !== 'caro') return null;
    const classic = ['memory', 'sound-memory', 'dragon-quest', 'math-racing', 'gears-build', 'gears-guess'].includes(id) && (params.get('edition') === 'classic' || (id === 'memory' ? flags.memory : id === 'sound-memory' ? flags.sound : id === 'dragon-quest' ? flags.dragon : id === 'math-racing' && !!flags.racing));
    const raw = params.get('level');
    const valid = ['easy', 'medium', 'hard'].includes(raw || '') && !(isPreschool(grade) && raw === 'hard');
    const modernSetup = ['math-racing', 'gears-build', 'gears-guess'].includes(id);
    const needsLevel = classic;
    return { id, classic, level: (needsLevel || modernSetup) && valid ? raw as Level : 'easy', needsSetup: needsLevel && !valid,
        ...(modernSetup && !classic && valid ? { requestedLevel: raw as Level } : {}) };
}
export function gameTitle(id: GameId) {
    return [...GAME_CATALOG, ...BOARD_GAME_CATALOG, ...GEAR_CATALOG].find(g => g.id === id)?.title || 'Trò chơi';
}
