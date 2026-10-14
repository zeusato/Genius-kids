import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { World, add3 } from '../engine/world';
import { History } from '../engine/history';
import { SAMPLES, buildSample } from '../content/samples';
import { buildBom, realSize } from './bom';
import { buildSteps } from './steps';
import { toLdraw, toBricklinkXml, toRebrickableCsv } from './files';
import { makePdf } from './pdf';
import type { Catalog } from '../engine/types';

const catalog: Catalog = JSON.parse(fs.readFileSync('public/bricks/catalog.json', 'utf8'));
const built = (id: string) => { const w = new World(catalog), h = new History(w); buildSample(w, h, SAMPLES.find(s => s.id === id)!); return w; };

describe('danh sách mảnh', () => {
  it('tổng số lượng = số mảnh thật (bộ ghép bung ra)', () => {
    for (const s of SAMPLES) {
      const w = built(s.id);
      const expected = [...w.pieces.values()].reduce((a, p) => a + catalog.parts[p.part].bom.reduce((x, b) => x + b.qty, 0), 0);
      expect(buildBom(w).reduce((a, r) => a + r.qty, 0), s.id).toBe(expected);
    }
  });
  it('nhà: cửa sổ bung thành khung + kính trong suốt; kích thước thật > 0', () => {
    const rows = buildBom(built('nha'));
    expect(rows.some(r => r.ldraw === '60601' && r.fixed === 47 && r.colorVi === 'Trong suốt')).toBe(true);
    const sz = realSize(built('nha'))!;
    expect(sz.w).toBeGreaterThan(4); expect(sz.h).toBeGreaterThan(3);
  });
});

describe('các bước lắp', () => {
  it('phát lại từng bước: mỗi mảnh chạm bàn hoặc nối vào phần đã lắp; ra đúng mô hình gốc', () => {
    for (const s of SAMPLES) {
      const w = built(s.id), steps = buildSteps(w);
      const ids = steps.flatMap(st => st.pieces);
      expect(new Set(ids).size, s.id).toBe(w.pieces.size);
      expect(steps.every(st => st.pieces.length <= 6), s.id).toBe(true);
      const replay = new World(catalog), done = new Set<number>();
      for (const st of steps) {
        for (const id of st.pieces) {
          const p = w.pieces.get(id)!;
          const conns = p.geo.conns.map(c => ({ ...c, p: add3(c.p, p.pos) }));
          const ok = p.bbox[4] >= -2.5 || replay.joinsOf(conns).some(j => j.other !== 'ground');
          expect(ok, `${s.id}: mảnh ${p.part}#${id} lơ lửng khi lắp`).toBe(true);
        }
        for (const id of st.pieces) { const p = w.pieces.get(id)!; replay.add(p.part, p.color, p.pos, p.o, id); done.add(id); }
      }
      expect(replay.pieces.size).toBe(w.pieces.size);
    }
  });
  it('mái hiên không lên trước trụ đỡ', () => {
    const w = built('nha'), steps = buildSteps(w);
    const stepOf = (id: number) => steps.findIndex(s => s.pieces.includes(id));
    const roof = [...w.pieces.values()].find(p => p.part === '3958' && p.color === 'blue')!;
    const pillars = [...w.pieces.values()].filter(p => p.part === '3005');
    for (const p of pillars) expect(stepOf(p.id)).toBeLessThan(stepOf(roof.id));
  });
});

describe('file cho người lớn', () => {
  it('LDraw: mỗi mảnh thật một dòng, có 0 STEP, toạ độ khớp mảnh đầu', () => {
    const w = built('xe-dua'), steps = buildSteps(w), text = toLdraw(w, 'Xe đua', steps);
    const lines = text.split(/\r?\n/).filter(l => l.startsWith('1 '));
    const expected = [...w.pieces.values()].reduce((a, p) => a + catalog.parts[p.part].bom.length, 0);
    expect(lines).toHaveLength(expected);
    expect(text.match(/^0 STEP/gm)?.length).toBe(steps.length - 1);
    const first = w.pieces.get(steps[0].pieces[0])!, f = lines[0].split(' ');
    expect(f.slice(2, 5).map(Number)).toEqual(first.pos);
  });
  it('không đoán mã cửa hàng khi thiếu mapping', () => {
    const rows = buildBom(built('lau-dai'));
    expect(() => toBricklinkXml(rows)).toThrow('BrickLink');
    const mapping = Object.fromEntries(rows.map(r => [`${r.ldraw}|${r.ldrawColor}`, { part: r.ldraw, color: 5 }]));
    expect(toBricklinkXml(rows, mapping).match(/<COLOR>5<\/COLOR>/g)?.length).toBe(rows.length);
    expect(() => toRebrickableCsv([{ ...rows[0], rb: null }])).toThrow('Rebrickable');
    expect(toRebrickableCsv([{ ...rows[0], rb: '3001', rbColor: 4 }])).toContain('3001,4,');
  });
});

describe('PDF', () => {
  it('cấu trúc hợp lệ: xref trỏ đúng đối tượng', () => {
    const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const pdf = makePdf([{ jpeg: fakeJpeg, width: 10, height: 14 }, { jpeg: fakeJpeg, width: 10, height: 14 }]);
    const s = new TextDecoder('latin1').decode(pdf);
    expect(s.startsWith('%PDF-1.4')).toBe(true);
    const xref = Number(/startxref\n(\d+)/.exec(s)![1]);
    expect(s.slice(xref, xref + 4)).toBe('xref');
    const offs = [...s.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map(m => Number(m[1]));
    offs.forEach((o, i) => expect(s.slice(o, o + 10)).toMatch(new RegExp(`^${i + 1} 0 obj`)));
    expect(/\/Count 2/.test(s)).toBe(true);
  });
});
