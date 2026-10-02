import { describe, expect, it } from 'vitest';
import { answerKey, parseNumber } from './normalize';
import { judge } from './judge';
import { makeTiles, tilesAnswer } from './tiles';
import { dailyId, gateStones, journeyGate, planRound, targetLevel } from './planner';
import { createRound, roundReducer, sealsFor, type RoundState } from './round';
import { emptyProgress } from '../progress/model';
import { fx, pool, seeded } from './fixtures';
import { roundStars } from './rewards';

describe('normalize', () => {
    it('thống nhất dấu, từ chỉ loại, từ địa phương, NFD', () => {
        expect(answerKey('Hoà bình')).toBe(answerKey('hòa bình'));
        expect(answerKey('nước Thuỷ')).toBe(answerKey('nước thủy'));
        expect(answerKey('con mèo'.normalize('NFD'))).toBe(answerKey('mèo'));
        expect(answerKey('trái thơm')).toBe(answerKey('quả dứa'));
        expect(answerKey('Cái chén!')).toBe(answerKey('bát'));
        expect(answerKey('ngô', { strip: true })).toBe('ngo');
    });
    it('đọc số bằng chữ', () => {
        expect(parseNumber('12')).toBe(12);
        expect(parseNumber('mười hai')).toBe(12);
        expect(parseNumber('hai mươi mốt')).toBe(21);
        expect(parseNumber('một trăm linh năm')).toBe(105);
        expect(parseNumber('một trăm hai mươi')).toBe(120);
        expect(parseNumber('con mèo')).toBeNull();
    });
});

describe('judge', () => {
    const r = fx('A');
    it('không bao giờ khớp mẩu chữ', () => {
        for (const bad of ['ng', 'on', 'gà mái', 'trống', 'con gà trống mái']) expect(judge(r, bad)).not.toMatch(/correct|spelling/);
        expect(judge(fx('B', { answer: 'Giày', accept: [], close: [] }), 'ày')).toBe('wrong');
    });
    it('từ chỉ loại mang nghĩa được thiếu nhưng không được khác', () => {
        const rose = fx('R', { answer: 'Hoa hồng', accept: [], close: [] });
        expect(judge(rose, 'hồng')).toBe('correct');
        expect(judge(rose, 'bông hồng')).toBe('correct');
        expect(judge(rose, 'quả hồng')).toBe('wrong');
        const bag = fx('S', { answer: 'Cái cặp', accept: ['cặp sách'], close: [] });
        expect(judge(bag, 'sách')).toBe('wrong');
        expect(judge(bag, 'cặp sách')).toBe('correct');
        expect(judge(fx('D', { answer: 'Quả dứa', accept: [], close: [] }), 'trái thơm')).toBe('correct');
    });
    it('đúng / thiếu dấu / gần đúng', () => {
        expect(judge(r, 'Gà trống')).toBe('correct');
        expect(judge(r, 'chú gà trống')).toBe('correct');
        expect(judge(r, 'ga trong')).toBe('spelling');
        expect(judge(r, 'gà')).toBe('close');
        expect(judge(r, 'con vịt')).toBe('wrong');
    });
    it('gõ nhầm 1 chữ ở đáp án dài là chính tả, nhưng không biến đáp án nhiễu thành đúng', () => {
        const long = fx('C', { answer: 'Con chuồn chuồn', accept: [], close: [], choices: [{ text: 'Con chuồn chuồng' }, { text: 'Con ong' }, { text: 'Con bướm' }] });
        expect(judge(long, 'chuồn chuôn')).toBe('spelling');
        expect(judge(long, 'chuồn chuồng')).toBe('wrong');
    });
    it('toán mẹo so theo giá trị', () => {
        const m = fx('M', { kind: 'math', gate: 'tricks', answer: '3', accept: ['ba'], close: [] });
        expect(judge(m, ' 3 ')).toBe('correct');
        expect(judge(m, 'ba')).toBe('correct');
        expect(judge(m, '4')).toBe('wrong');
    });
    it('tiếng Anh không phân biệt hoa thường, mạo từ', () => {
        const e = fx('E', { lang: 'en', gate: 'world', answer: 'Clock', accept: ['a clock'], close: [] });
        expect(judge(e, 'the CLOCK')).toBe('correct');
        expect(judge(e, 'clo')).toBe('wrong');
    });
});

describe('tiles', () => {
    it('tiếng Việt: điền sẵn từ chỉ loại, mỗi tiếng một ô, có tiếng nhiễu', () => {
        const t = makeTiles(fx('A'), seeded());
        expect(t.prefix).toBe('Con');
        expect(t.solution).toEqual(['gà', 'trống']);
        expect(t.tiles.length).toBeGreaterThan(2);
        expect(t.tiles.map(x => x.text)).toEqual(expect.arrayContaining(['gà', 'trống']));
        expect(judge(fx('A'), tilesAnswer(t, t.solution.map((text, i) => ({ id: `s${i}`, text }))))).toBe('correct');
    });
    it('tiếng Anh: ghép chữ cái, từ dài ghép theo cụm', () => {
        const e = makeTiles(fx('E', { lang: 'en', gate: 'world', answer: 'Echo' }), seeded());
        expect(e.solution).toEqual(['E', 'C', 'H', 'O']);
        const long = makeTiles(fx('L', { lang: 'en', gate: 'world', answer: 'Umbrella' }), seeded());
        expect(long.solution.join('')).toBe('UMBRELLA');
        expect(long.solution.length).toBeLessThan(8);
        const two = makeTiles(fx('T', { lang: 'en', gate: 'world', answer: 'Letter M' }), seeded());
        expect(two.gaps).toEqual([6]);
    });
});

describe('planner', () => {
    const P = pool(['animals', 'plants', 'objects', 'nature', 'words', 'tricks', 'world', 'vietnam'], 30);
    it('hành trình bắt đầu ở cổng đầu, 5 câu, không trùng đáp án, có xen cổng khác', () => {
        const p = emptyProgress(3);
        for (let s = 1; s < 200; s++) {
            const ids = planRound({ pool: P, progress: p, grade: 3, kind: 'journey', rng: seeded(s) });
            expect(ids).toHaveLength(5);
            expect(new Set(ids).size).toBe(5);
            expect(ids.filter(id => id.startsWith('animals')).length).toBeGreaterThanOrEqual(3);
            expect(ids.some(id => id.startsWith('world') || id.startsWith('vietnam'))).toBe(false);
        }
    });
    it('lớp 1 chặng 4 câu, không quá mức 2, không vào cổng Đất Việt', () => {
        const p = emptyProgress(1);
        const map = new Map(P.map(r => [r.id, r]));
        for (let s = 1; s < 100; s++) {
            const ids = planRound({ pool: P, progress: p, grade: 1, kind: 'journey', rng: seeded(s) });
            expect(ids).toHaveLength(4);
            expect(ids.every(id => map.get(id)!.level <= 2 && !id.startsWith('vietnam'))).toBe(true);
        }
    });
    it('mức thích ứng: chỉ số cao → câu khó hơn, 20% hạ một mức', () => {
        const rng = seeded(3);
        const lv = Array.from({ length: 1000 }, () => targetLevel(2.6, 5, rng));
        const three = lv.filter(x => x === 3).length;
        expect(three).toBeGreaterThan(700);
        expect(three).toBeLessThan(900);
    });
    it('đủ 10 câu thì cổng đầy đá, hành trình chuyển cổng khi cổng đã mở', () => {
        const p = emptyProgress(3);
        P.filter(r => r.gate === 'animals').slice(0, 10).forEach(r => { p.solved[r.id] = { at: new Date().toISOString(), seals: 2, mode: 'choice' }; });
        expect(gateStones(p, 'animals', P)).toBe(10);
        p.gates.animals = { opened: new Date().toISOString() };
        expect(journeyGate(p, 3, P)).toBe('plants');
    });
    it('câu đố hôm nay cố định theo ngày', () => {
        expect(dailyId('2026-10-02', P)).toBe(dailyId('2026-10-02', P));
        const days = new Set(Array.from({ length: 30 }, (_, i) => dailyId(`2026-11-${String(i + 1).padStart(2, '0')}`, P)));
        expect(days.size).toBeGreaterThan(15);
    });
    it('ôn lại lấy câu đến hạn trước', () => {
        const p = emptyProgress(3);
        p.review = [{ id: 'plants-1', due: '2030-01-01T00:00:00.000Z', misses: 1 }, { id: 'animals-2', due: '2020-01-01T00:00:00.000Z', misses: 1 }];
        expect(planRound({ pool: P, progress: p, grade: 3, kind: 'review' })[0]).toBe('animals-2');
    });
});

describe('round', () => {
    const riddles = [fx('A'), fx('B', { answer: 'Con mèo', accept: [], close: [] })];
    const start = () => roundReducer(createRound({ id: 'r1', owner: 'u', kind: 'journey', riddles }), { type: 'ready' });
    it('đúng ngay: 3 dấu ấn; sang câu sau; hết thì tổng kết', () => {
        let s: RoundState = start();
        s = roundReducer(s, { type: 'submit', riddle: riddles[0], input: 'gà trống' });
        expect(s.phase).toBe('feedback');
        expect(s.items[0].seals).toBe(3);
        s = roundReducer(s, { type: 'next' });
        expect(s.phase).toBe('reading');
        s = roundReducer(roundReducer(s, { type: 'ready' }), { type: 'reveal' });
        expect(s.items[1].seals).toBe(0);
        s = roundReducer(s, { type: 'next' });
        expect(s.phase).toBe('summary');
    });
    it('gần đúng không tính lần sai; sai 2 lần tự mở gợi ý; không bao giờ âm', () => {
        let s = start();
        s = roundReducer(s, { type: 'submit', riddle: riddles[0], input: 'gà' });
        expect(s.items[0].tries).toBe(0);
        expect(s.items[0].verdict).toBe('close');
        s = roundReducer(s, { type: 'submit', riddle: riddles[0], input: 'vịt' });
        s = roundReducer(s, { type: 'submit', riddle: riddles[0], input: 'chim' });
        expect(s.items[0].hints).toBe(1);
        s = roundReducer(s, { type: 'submit', riddle: riddles[0], input: 'gà trống' });
        expect(s.items[0].seals).toBe(1);
    });
    it('đổi sang chọn đáp án là nhận trợ giúp', () => {
        expect(sealsFor({ revealed: false, tries: 0, hints: 0, downgraded: true })).toBe(1);
        expect(sealsFor({ revealed: false, tries: 1, hints: 1, downgraded: false })).toBe(2);
    });
    it('sao chặng: làm tròn lên, tối đa 5', () => {
        expect(roundStars(0)).toBe(0);
        expect(roundStars(1)).toBe(1);
        expect(roundStars(15)).toBe(5);
        expect(roundStars(40)).toBe(5);
    });
});
