import { describe, expect, it } from 'vitest';
import { validate } from '../../../scripts/riddle-validate.mjs';
import { RIDDLES } from './index';
import { judge } from '../engine/judge';
import { makeTiles, tilesAnswer } from '../engine/tiles';
import { GATES } from './gates';
import { seeded } from '../engine/fixtures';

describe('kho câu đố v2', () => {
    it('đạt quy chuẩn soạn', () => {
        expect(validate(RIDDLES)).toEqual([]);
    });
    it('mọi đáp án và cách gọi khác đều được chấm đúng', () => {
        const bad = RIDDLES.filter(r => [r.answer, ...r.accept].some(a => !['correct', 'spelling'].includes(judge(r, a))));
        expect(bad.map(r => r.id)).toEqual([]);
    });
    it('không đáp án nhiễu nào bị chấm đúng', () => {
        const bad = RIDDLES.filter(r => r.choices.some(c => ['correct', 'spelling'].includes(judge(r, c.text))));
        expect(bad.map(r => `${r.id}: ${r.choices.map(c => c.text).join('/')}`)).toEqual([]);
    });
    it('ghép chữ luôn ghép lại được đúng đáp án', () => {
        const rng = seeded(11);
        const bad = RIDDLES.filter(r => r.kind !== 'math').filter(r => {
            const t = makeTiles(r, rng);
            return judge(r, tilesAnswer(t, t.solution.map((text, i) => ({ id: `${i}`, text })))) === 'wrong' || t.solution.length > 12;
        });
        expect(bad.map(r => r.id)).toEqual([]);
    });
    it('mỗi cổng đều có câu, đủ để mở cổng', () => {
        for (const g of GATES) expect(RIDDLES.filter(r => r.gate === g.id).length, g.id).toBeGreaterThanOrEqual(10);
    });
});
