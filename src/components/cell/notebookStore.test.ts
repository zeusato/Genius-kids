import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadNotebook, markSeen } from './notebookStore';

describe('Sổ tay khám phá (localStorage theo hồ sơ)', () => {
    let store: Record<string, string>;
    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', {
            getItem: (k: string) => (k in store ? store[k] : null),
            setItem: (k: string, v: string) => { store[k] = v; }
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    it('hồ sơ mới: sổ trống', () => {
        expect(loadNotebook('s1')).toEqual({ animal: [], plant: [], bacteria: [] });
    });

    it('đánh dấu một lần, không trùng lặp, tách riêng từng học sinh', () => {
        let nb = loadNotebook('s1');
        nb = markSeen(nb, 'animal', 'nucleus', 's1');
        nb = markSeen(nb, 'animal', 'nucleus', 's1');
        nb = markSeen(nb, 'plant', 'vacuole', 's1');
        expect(loadNotebook('s1')).toEqual({ animal: ['nucleus'], plant: ['vacuole'], bacteria: [] });
        expect(loadNotebook('s2')).toEqual({ animal: [], plant: [], bacteria: [] });
    });

    it('dữ liệu hỏng / localStorage lỗi → không vỡ trang', () => {
        store['cell_notebook_v1_s1'] = '{hỏng';
        expect(loadNotebook('s1')).toEqual({ animal: [], plant: [], bacteria: [] });
        vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
        const nb = markSeen(loadNotebook('s1'), 'bacteria', 'flagellum', 's1');
        expect(nb.bacteria).toEqual(['flagellum']);
    });
});
