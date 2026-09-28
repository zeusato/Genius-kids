import { describe, expect, it } from 'vitest';
import { CELL_DATA } from './cellData';
import { CELL_STORIES } from './cellStory';
import { FIND_PROMPTS, FIND_ROUNDS } from './cellQuizData';

describe('nội dung Khám Phá Tế Bào', () => {
    it.each(CELL_DATA.map((c) => [c.id, c] as const))('%s: mỗi bộ phận có đủ biểu tượng, so sánh vui, câu tự giới thiệu', (_id, cell) => {
        const ids = new Set<string>();
        for (const o of cell.organelles) {
            expect(ids.has(o.id), `trùng id ${o.id}`).toBe(false);
            ids.add(o.id);
            expect(o.emoji.trim().length).toBeGreaterThan(0);
            expect(o.short.trim().length).toBeGreaterThan(2);
            expect(o.kid.startsWith('Tớ là')).toBe(true);
            for (const field of ['summary', 'structure', 'function', 'location', 'analogy'] as const) {
                expect(o.details[field].trim().length, `${o.id}.${field}`).toBeGreaterThan(5);
            }
            expect(o.color).toMatch(/^#[0-9a-f]{6}$/i);
        }
    });

    it('mỗi loại tế bào có đúng một vùng tế bào chất (chọn khi chạm khoảng trống)', () => {
        for (const cell of CELL_DATA) {
            expect(cell.organelles.filter((o) => o.id.startsWith('cytoplasm'))).toHaveLength(1);
        }
    });

    it('trò Truy tìm: mọi mục tiêu có thật trong tế bào và đủ số vòng chơi', () => {
        for (const cell of CELL_DATA) {
            const prompts = FIND_PROMPTS[cell.id];
            expect(prompts.length).toBeGreaterThanOrEqual(FIND_ROUNDS);
            const ids = new Set(cell.organelles.map((o) => o.id));
            for (const p of prompts) {
                expect(ids.has(p.target), `${cell.id}: ${p.target}`).toBe(true);
                expect(p.easy.trim().length).toBeGreaterThan(5);
                expect(p.hard.trim().length).toBeGreaterThan(5);
            }
            expect(new Set(prompts.map((p) => p.target)).size).toBe(prompts.length);
        }
    });

    it('kích thước thật cho thước đo: động vật ~20 µm, lá ~50 µm, vi khuẩn ~2 µm', () => {
        expect(CELL_STORIES.animal.umPerUnit * 2.45 * 2).toBeCloseTo(20, 0);
        expect(CELL_STORIES.plant.umPerUnit * 3.0 * 2).toBeCloseTo(50, 0);
        expect(CELL_STORIES.bacteria.umPerUnit * 2.5 * 2).toBeCloseTo(2, 1);
    });

    it('thực vật không có trung thể (sai phổ biến trong hình minh họa)', () => {
        const plant = CELL_DATA.find((c) => c.id === 'plant')!;
        expect(plant.organelles.some((o) => o.id === 'centrosome')).toBe(false);
    });

    it('vi khuẩn không có nhân thật, chỉ có vùng nhân', () => {
        const bac = CELL_DATA.find((c) => c.id === 'bacteria')!;
        expect(bac.organelles.some((o) => o.id === 'nucleus')).toBe(false);
        expect(bac.organelles.some((o) => o.id === 'nucleoid')).toBe(true);
    });
});
