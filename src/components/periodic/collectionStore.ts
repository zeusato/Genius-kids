// "Tủ sưu tập": nguyên tố bé đã xem (thẻ mở ≥ 3 s hoặc làm thí nghiệm) + tiến độ phụ, lưu localStorage
// theo hồ sơ. Huy hiệu thật nằm ở StudentProfile.periodicBadges (qua updateStudent), như Tế bào/Tiến hóa.

export interface Collection {
    seen: number[];
    fireworks: string[];     // thử thách pháo hoa đã xong
    built: number[];         // Z các nguyên tử đã lắp trong Xưởng
    story: boolean;          // đã xem trọn "Chuyện của vũ trụ"
    mendeleev: boolean;      // đã chạy cỗ máy thời gian qua 1886
    bestFind: number;        // điểm cao nhất Truy tìm (/8)
    dayOpened: string;       // ngày đã mở "Nguyên tố của ngày"
}

const EMPTY: Collection = { seen: [], fireworks: [], built: [], story: false, mendeleev: false, bestFind: 0, dayOpened: '' };
const key = (id?: string) => `ptable_collection_v1_${id || 'guest'}`;

export function loadCollection(studentId?: string): Collection {
    try {
        const raw = localStorage.getItem(key(studentId));
        if (!raw) return { ...EMPTY };
        const p = JSON.parse(raw) as Partial<Collection>;
        return {
            seen: Array.isArray(p.seen) ? p.seen.filter(n => typeof n === 'number') : [],
            fireworks: Array.isArray(p.fireworks) ? p.fireworks : [],
            built: Array.isArray(p.built) ? p.built : [],
            story: !!p.story, mendeleev: !!p.mendeleev,
            bestFind: typeof p.bestFind === 'number' ? p.bestFind : 0,
            dayOpened: typeof p.dayOpened === 'string' ? p.dayOpened : '',
        };
    } catch {
        return { ...EMPTY };
    }
}

export function saveCollection(c: Collection, studentId?: string): Collection {
    try { localStorage.setItem(key(studentId), JSON.stringify(c)); } catch { /* chế độ riêng tư — bỏ qua */ }
    return c;
}

export function addUnique<T>(arr: T[], v: T): T[] { return arr.includes(v) ? arr : [...arr, v]; }

export interface BadgeDef { id: string; icon: string; title: string; desc: string; progress: (c: Collection) => [number, number] }

const count = (c: Collection, zs: number[]) => zs.filter(z => c.seen.includes(z)).length;
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const PERIODIC_BADGES: BadgeDef[] = [
    { id: 'first20', icon: '🥇', title: '20 nguyên tố đầu tiên', desc: 'Sưu tầm đủ từ Hydrogen tới Calcium — đúng yêu cầu lớp 7!', progress: c => [count(c, range(1, 20)), 20] },
    { id: 'alkali', icon: '💥', title: 'Gia đình kim loại kiềm', desc: 'Đủ nhóm 1: Li, Na, K, Rb, Cs, Fr', progress: c => [count(c, [3, 11, 19, 37, 55, 87]), 6] },
    { id: 'noble', icon: '🎈', title: 'Hội khí hiếm', desc: 'Đủ He, Ne, Ar, Kr, Xe, Rn, Og', progress: c => [count(c, [2, 10, 18, 36, 54, 86, 118]), 7] },
    { id: 'collector50', icon: '🗄️', title: 'Nhà sưu tầm', desc: 'Sưu tầm 50 nguyên tố', progress: c => [Math.min(50, c.seen.length), 50] },
    { id: 'stardust', icon: '✨', title: 'Bụi sao', desc: 'Nghe trọn "Chuyện của vũ trụ"', progress: c => [c.story ? 1 : 0, 1] },
    { id: 'mendeleev', icon: '📜', title: 'Mendeleev nhí', desc: 'Chạy cỗ máy thời gian qua năm 1886', progress: c => [c.mendeleev ? 1 : 0, 1] },
    { id: 'fireworks', icon: '🎆', title: 'Nghệ nhân pháo hoa', desc: 'Hoàn thành 3 thử thách pháo hoa', progress: c => [Math.min(3, c.fireworks.length), 3] },
    { id: 'builder', icon: '⚛️', title: 'Kỹ sư nguyên tử', desc: 'Lắp 10 nguyên tử khác nhau', progress: c => [Math.min(10, c.built.length), 10] },
    { id: 'detective', icon: '🔎', title: 'Thám tử nguyên tố', desc: 'Truy tìm đúng từ 6/8 câu', progress: c => [Math.min(6, c.bestFind), 6] },
];

export function earnedBadges(c: Collection): string[] {
    return PERIODIC_BADGES.filter(b => { const [a, n] = b.progress(c); return a >= n; }).map(b => b.id);
}
