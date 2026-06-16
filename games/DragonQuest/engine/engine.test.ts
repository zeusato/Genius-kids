import { describe, it, expect } from 'vitest';
import { makeRng } from './rng';
import { generateMap } from './map';
import { rollDice, calculateTeleport, getRandomBuff, calculateBossQuestions } from './mechanics';
import { addBuff } from './buffs';
import { reducer, initialState, getMedal } from './reducer';
import { questionToSpeech } from './dialogue';
import { BuffType, GameState, MapTile, TileType } from './types';
import { MAP_LENGTH, MAX_HP, TILE_DISTRIBUTION } from './constants';
import type { SpeedQuestion } from '../../SpeedMath/speedMathEngine';

const q = (over: Partial<SpeedQuestion> = {}): SpeedQuestion => ({
    id: 'q', type: 'math', content: '1 + 1 = ?', correctAnswer: '2', timeLimit: 10, ...over,
});

/** State đang chơi với bàn cờ seed cố định. */
const playing = (): GameState => reducer(initialState(), { type: 'START', mapTiles: generateMap(makeRng(1)) });

describe('map — sinh bàn cờ tất định', () => {
    it('đúng độ dài, ô cuối là Boss và chỉ có 1 boss', () => {
        const m = generateMap(makeRng(7));
        expect(m.length).toBe(MAP_LENGTH);
        expect(m[MAP_LENGTH - 1].type).toBe(TileType.Boss);
        expect(m.filter(t => t.type === TileType.Boss).length).toBe(1);
    });

    it('phân bố loại ô khớp tỉ lệ', () => {
        const m = generateMap(makeRng(7));
        const exBoss = MAP_LENGTH - 1;
        const count = (t: TileType) => m.filter(x => x.type === t).length;
        expect(count(TileType.Combat)).toBe(Math.floor(exBoss * TILE_DISTRIBUTION.combat));
        expect(count(TileType.Buff)).toBe(Math.floor(exBoss * TILE_DISTRIBUTION.buff));
        expect(count(TileType.Teleport)).toBe(Math.floor(exBoss * TILE_DISTRIBUTION.teleport));
    });

    it('cùng seed → cùng bàn cờ; khác seed → khác', () => {
        const a = generateMap(makeRng(42)).map(t => t.type);
        const b = generateMap(makeRng(42)).map(t => t.type);
        const c = generateMap(makeRng(43)).map(t => t.type);
        expect(a).toEqual(b);
        expect(a).not.toEqual(c);
    });
});

describe('mechanics — thuần', () => {
    it('xúc xắc luôn trong [1,6]', () => {
        const rng = makeRng(99);
        for (let i = 0; i < 500; i++) {
            const v = rollDice(rng);
            expect(v).toBeGreaterThanOrEqual(1);
            expect(v).toBeLessThanOrEqual(6);
        }
    });

    it('teleport: khoảng cách trong [-8,8], vị trí kẹp [0, len-1], cờ lùi đúng', () => {
        const rng = makeRng(5);
        for (let i = 0; i < 500; i++) {
            const t = calculateTeleport(25, MAP_LENGTH, rng);
            expect(t.distance).toBeGreaterThanOrEqual(-8);
            expect(t.distance).toBeLessThanOrEqual(8);
            expect(t.newPosition).toBeGreaterThanOrEqual(0);
            expect(t.newPosition).toBeLessThanOrEqual(MAP_LENGTH - 1);
            expect(t.isBackward).toBe(t.distance < 0);
        }
    });

    it('teleport kẹp biên dưới khi lùi quá đầu bàn', () => {
        const rng = makeRng(2);
        for (let i = 0; i < 50; i++) {
            const t = calculateTeleport(1, MAP_LENGTH, rng);
            expect(t.newPosition).toBeGreaterThanOrEqual(0);
        }
    });

    it('số câu hỏi boss = 5 − số kiếm, sàn 3', () => {
        expect(calculateBossQuestions(0)).toBe(5);
        expect(calculateBossQuestions(1)).toBe(4);
        expect(calculateBossQuestions(2)).toBe(3);
        expect(calculateBossQuestions(5)).toBe(3); // không xuống dưới sàn
    });

    it('getRandomBuff chỉ trả về buff hợp lệ', () => {
        const rng = makeRng(11);
        const valid = new Set(Object.values(BuffType));
        for (let i = 0; i < 100; i++) expect(valid.has(getRandomBuff(rng))).toBe(true);
    });
});

describe('buffs — addBuff cap & hồi máu', () => {
    const base = { holySword: 0, holyGrail: 0, flyingCloak: false };

    it('kiếm thánh tối đa 2', () => {
        let s = addBuff(base, 3, BuffType.HolySword, MAX_HP);
        s = addBuff(s.buffs, s.hp, BuffType.HolySword, MAX_HP);
        const s3 = addBuff(s.buffs, s.hp, BuffType.HolySword, MAX_HP);
        expect(s3.buffs.holySword).toBe(2);
    });

    it('chén thánh hồi 1 máu nhưng không vượt maxHp', () => {
        const low = addBuff(base, 1, BuffType.HolyGrail, MAX_HP);
        expect(low.hp).toBe(2);
        const full = addBuff(base, MAX_HP, BuffType.HolyGrail, MAX_HP);
        expect(full.hp).toBe(MAX_HP);
    });

    it('áo choàng bật cờ', () => {
        expect(addBuff(base, 3, BuffType.FlyingCloak, MAX_HP).buffs.flyingCloak).toBe(true);
    });
});

describe('reducer — luật chơi', () => {
    it('START đưa về phase playing với bàn cờ đã cấp', () => {
        const s = playing();
        expect(s.phase).toBe('playing');
        expect(s.hp).toBe(3);
        expect(s.mapTiles.length).toBe(MAP_LENGTH);
    });

    it('combat đúng → +10 điểm, đi tiếp', () => {
        let s: GameState = { ...playing(), phase: 'combat' as const, question: q() };
        s = reducer(s, { type: 'ANSWER', correct: true });
        expect(s.score).toBe(10);
        expect(s.phase).toBe('playing');
        expect(s.fx.score).toBe(10);
    });

    it('combat sai → mất 1 máu, còn sống thì đi tiếp', () => {
        let s: GameState = { ...playing(), phase: 'combat' as const };
        s = reducer(s, { type: 'ANSWER', correct: false });
        expect(s.hp).toBe(2);
        expect(s.phase).toBe('playing');
        expect(s.fx.damage).toBe(true);
    });

    it('combat sai khi 1 máu → thua', () => {
        let s: GameState = { ...playing(), hp: 1, phase: 'combat' as const };
        s = reducer(s, { type: 'ANSWER', correct: false });
        expect(s.hp).toBe(0);
        expect(s.phase).toBe('gameover');
        expect(s.result).toBe('lose');
    });

    it('buff đúng → nhận buff + 15 điểm; sai → không phạt', () => {
        let s: GameState = { ...playing(), phase: 'buff' as const };
        s = reducer(s, { type: 'BUFF_ANSWER', correct: true, buff: BuffType.HolySword });
        expect(s.buffs.holySword).toBe(1);
        expect(s.score).toBe(15);
        expect(s.phase).toBe('playing');

        let w: GameState = { ...playing(), phase: 'buff' as const };
        w = reducer(w, { type: 'BUFF_ANSWER', correct: false, buff: BuffType.HolySword });
        expect(w.buffs.holySword).toBe(0);
        expect(w.hp).toBe(3);
        expect(w.phase).toBe('playing');
    });

    it('boss: đúng đủ số câu → thắng', () => {
        let s: GameState = { ...playing(), phase: 'boss' as const, bossLeft: 2, question: q() };
        s = reducer(s, { type: 'BOSS_ANSWER', correct: true, nextQuestion: q() });
        expect(s.phase).toBe('boss');
        expect(s.bossLeft).toBe(1);
        s = reducer(s, { type: 'BOSS_ANSWER', correct: true, nextQuestion: q() });
        expect(s.phase).toBe('gameover');
        expect(s.result).toBe('win');
        expect(s.score).toBe(40);
    });

    it('boss: sai mất máu, hết máu → thua', () => {
        let s: GameState = { ...playing(), hp: 1, phase: 'boss' as const, bossLeft: 3, question: q() };
        s = reducer(s, { type: 'BOSS_ANSWER', correct: false, nextQuestion: q() });
        expect(s.hp).toBe(0);
        expect(s.phase).toBe('gameover');
        expect(s.result).toBe('lose');
    });

    it('boss: sai nhưng còn máu → đếm lùi & câu mới', () => {
        let s: GameState = { ...playing(), hp: 3, phase: 'boss' as const, bossLeft: 3, question: q({ id: 'a' }) };
        s = reducer(s, { type: 'BOSS_ANSWER', correct: false, nextQuestion: q({ id: 'b' }) });
        expect(s.hp).toBe(2);
        expect(s.bossLeft).toBe(2);
        expect(s.question?.id).toBe('b');
        expect(s.phase).toBe('boss');
    });

    it('teleport: được áo choàng bảo vệ → đứng yên, đi tiếp', () => {
        let s: GameState = { ...playing(), phase: 'teleport' as const, teleport: { distance: -5, newPosition: 10, isBackward: true } };
        s = reducer(s, { type: 'RESOLVE_TELEPORT', protectedByCloak: true });
        expect(s.phase).toBe('playing');
        expect(s.teleport).toBeNull();
    });

    it('huy chương theo máu khi thắng', () => {
        const win = (hp: number): GameState => ({ ...initialState(), result: 'win', hp });
        expect(getMedal(win(3))).toBe('gold');
        expect(getMedal(win(2))).toBe('silver');
        expect(getMedal(win(1))).toBe('bronze');
        expect(getMedal({ ...initialState(), result: 'lose', hp: 0 })).toBeNull();
    });
});

describe('dialogue — questionToSpeech', () => {
    it('đổi ký hiệu toán sang văn nói', () => {
        expect(questionToSpeech({ type: 'math', content: '5 × 3 = ?' })).toBe('5 nhân 3 bằng mấy');
        expect(questionToSpeech({ type: 'math', content: '8 ÷ 2 = ?' })).toBe('8 chia 2 bằng mấy');
        expect(questionToSpeech({ type: 'math', content: '4 + ? = 9' })).toBe('4 cộng mấy bằng 9');
    });

    it('loại khác đọc thẳng nội dung', () => {
        expect(questionToSpeech({ type: 'color', content: 'Màu này là màu gì?' })).toBe('Màu này là màu gì?');
    });
});
