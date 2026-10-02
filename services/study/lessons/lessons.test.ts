// Kiểm chuẩn toàn bộ nội dung Học bài (docs/study-learn-plan.md mục 6).
import { describe, expect, it } from 'vitest';
import '../../mathEngine';
import { Grade } from '../../../types';
import { SKILLS, SKILL_MAP } from '../catalog';
import { templateLevels } from '../registry';
import { isVisualFn, renderVisual } from '../../generators/svg/render';
import { withGeneratorRandom } from '../../generators/random';
import { questionToSpeech } from '../../../src/utils/questionSpeech';
import { LESSON_INDEX, PUBLISHED_GRADES } from './manifest';
import { lessonPages, tryIndex } from './pages';
import { lengthLint, lessonStrings, mathLint, notationLint } from './lint';
import { buildTry, tryLevels, TRY_COUNT } from './try';
import { nb } from './build';
import type { ExploreSpec, Lesson, LessonBook, VisualSpec, WidgetSpec } from './types';
import mn from './content/mn';
import g1 from './content/g1';
import g2 from './content/g2';
import g3 from './content/g3';
import g4 from './content/g4';
import g5 from './content/g5';

const BOOKS: Record<Grade, LessonBook> = { [Grade.Preschool]: mn, [Grade.Grade1]: g1, [Grade.Grade2]: g2, [Grade.Grade3]: g3, [Grade.Grade4]: g4, [Grade.Grade5]: g5 };
const ALL: [Grade, Lesson][] = (Object.entries(BOOKS) as unknown as [string, LessonBook][]).flatMap(([g, b]) => Object.values(b).map(l => [Number(g) as Grade, l] as [Grade, Lesson]));

const svgOk = (spec: VisualSpec) => { const svg = renderVisual(spec); return !!svg && svg.startsWith('<svg') && !/NaN|undefined/.test(svg); };
function* blocksOf(l: Lesson) { for (const k of l.know) yield* k.blocks; }
const widgets = (l: Lesson): WidgetSpec[] => [...blocksOf(l)].flatMap(b => (b.t === 'widget' ? [b.widget] : [])).concat(l.forms.flatMap(f => (f.example.replay ? [f.example.replay] : [])));
const visuals = (l: Lesson): VisualSpec[] => [
    ...[...blocksOf(l)].flatMap(b => (b.t === 'pic' ? [b.visual] : [])),
    ...(l.hook?.visual ? [l.hook.visual] : []),
    ...l.forms.flatMap(f => [f.example.visual, ...f.example.steps.map(s => s.visual)].filter((v): v is VisualSpec => !!v)),
];

/** Bộ giá trị điều khiển để quét explore: min/init/max từng điều khiển + 30 bộ ngẫu nhiên. */
function exploreSamples(spec: ExploreSpec, rnd = Math.random): Record<string, number>[] {
    const keys = Object.keys(spec.controls);
    const init = Object.fromEntries(keys.map(k => [k, spec.controls[k].init]));
    const out: Record<string, number>[] = [init];
    for (const k of keys) for (const x of [spec.controls[k].min, spec.controls[k].max]) out.push({ ...init, [k]: x });
    for (let i = 0; i < 30; i++) out.push(Object.fromEntries(keys.map(k => { const c = spec.controls[k], st = c.step ?? 1; return [k, c.min + st * Math.floor(rnd() * (Math.floor((c.max - c.min) / st) + 1))]; })));
    return out.filter(v => !spec.valid || spec.valid(v) === null);
}

describe('manifest', () => {
    it('LESSON_INDEX khớp nội dung từng lớp', () => {
        for (const [g, book] of Object.entries(BOOKS)) expect([...LESSON_INDEX[Number(g) as Grade]].sort(), `lớp ${g}`).toEqual(Object.keys(book).sort());
    });
    it('mỗi bài đúng kỹ năng, đúng lớp, khoá = skillId', () => {
        for (const [g, book] of Object.entries(BOOKS)) for (const [id, l] of Object.entries(book)) {
            expect(l.skillId).toBe(id);
            expect(SKILL_MAP.get(id)?.grade, id).toBe(Number(g));
        }
    });
    it('lớp đã phát hành có bài cho mọi kỹ năng có template', () => {
        for (const g of PUBLISHED_GRADES) {
            if (g === Grade.Preschool) continue; // MN: bảng nối hoạt động (GĐ5)
            const missing = SKILLS.filter(s => s.grade === g && templateLevels(s.id).length && !BOOKS[g][s.id]).map(s => s.id);
            expect(missing, `lớp ${g}`).toEqual([]);
        }
    });
});

describe.each(ALL.map(([g, l]) => [l.skillId, g, l] as const))('bài %s', (_id, grade, l) => {
    it('cấu trúc, độ dài, số lượng', () => {
        expect(lengthLint(l, grade)).toEqual([]);
        expect(new Set(l.forms.map(f => f.id)).size).toBe(l.forms.length);
        for (const n of l.needs ?? []) expect(SKILL_MAP.has(n), n).toBe(true);
        expect(tryIndex(lessonPages(l))).toBeGreaterThan(0);
    });
    it('mức của dạng / Em thử có template', () => {
        const avail = templateLevels(l.skillId);
        for (const f of l.forms) if (f.level) expect(avail, f.id).toContain(f.level);
        for (const t of l.tryLevels ?? []) expect(avail).toContain(t);
        expect(tryLevels(l)).toHaveLength(TRY_COUNT);
    });
    it('Em thử sinh được câu khác nhau', () => {
        let seed = 1;
        for (let i = 0; i < 20; i++) {
            const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
            const qs = withGeneratorRandom(rnd, () => buildTry(l));
            expect(new Set(qs.map(q => q.questionText + JSON.stringify(q.visual ?? ''))).size).toBeGreaterThanOrEqual(2);
            for (const q of qs) expect(q.skillId).toBe(l.skillId);
        }
    });
    it('hình vẽ được', () => {
        for (const v of visuals(l)) { expect(isVisualFn(String(v.fn)), String(v.fn)).toBe(true); expect(svgOk(v), String(v.fn)).toBe(true); }
    });
    it('widget hợp lệ; explore quét đủ giá trị', () => {
        for (const w of widgets(l)) {
            if (w.w === 'explore') {
                const samples = exploreSamples(w);
                expect(samples.length).toBeGreaterThan(3);
                for (const v of samples) {
                    expect(svgOk(w.visual(v)), JSON.stringify(v)).toBe(true);
                    const cap = nb(w.caption(v));
                    expect(cap).not.toMatch(/NaN|undefined/);
                    expect(mathLint(cap), cap).toEqual([]);
                    expect(notationLint(cap), cap).toEqual([]);
                }
            } else if (w.w === 'long-division') { expect(w.b).toBeGreaterThan(0); expect(w.a).toBeGreaterThan(0); }
            else if (w.w === 'column') { expect(w.a).toBeGreaterThanOrEqual(0); expect(w.b).toBeGreaterThanOrEqual(0); if (w.op === '-') expect(w.a).toBeGreaterThanOrEqual(w.b); }
            else if (w.w === 'place-value') expect(w.int).toBeGreaterThan(0);
        }
    });
    it('phép tính đúng, ký hiệu đúng, đọc to được', () => {
        for (const s of lessonStrings(l)) {
            if (!s.wrong) expect(mathLint(s.text), s.where).toEqual([]);
            expect(notationLint(s.text), s.where).toEqual([]);
            const spoken = questionToSpeech(s.text);
            expect(spoken, s.where).not.toMatch(/\d\s*[×]\s*\d/);
        }
    });
});
