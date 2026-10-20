import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { World, add3 } from '../engine/world';
import { History } from '../engine/history';
import { SAMPLES, buildSample } from '../content/samples';
import { buildBom, realSize } from './bom';
import { baseplateHint, buildSteps } from './steps';
import { fromLdraw, toLdraw, toBricklinkXml, toRebrickableCsv } from './files';
import { makePdf } from '../../lib/export/pdf';
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
  it('cổng hai trụ rời: bước thanh ngang ghi khoảng cách giữa hai cụm, gợi ý tấm nền vừa đủ; chế độ bé tối đa 3 mảnh/bước', () => {
    const w = new World(catalog);
    for (const x of [-30, 30]) for (let i = 0; i < 3; i++) w.add('3005', 'red', [x, -24 * (i + 1), 0], 0);
    w.add('3710', 'blue', [0, -80, 0], 0);   // tấm 1×4 nằm trên đỉnh hai trụ
    expect(w.floating().size).toBe(0);
    const steps = buildSteps(w), bar = steps.find(s => s.pieces.includes(7))!;
    expect(bar.bridge).toEqual({ gap: 2 });
    expect(steps.filter(s => s.bridge)).toHaveLength(1);
    expect(baseplateHint(w)).toEqual({ w: 4, d: 1 });
    expect(baseplateHint(built('nha'))).toBeNull();
    expect(buildSteps(built('lau-dai'), 3).every(s => s.pieces.length <= 3)).toBe(true);
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
  const pieces = (w: World) => [...w.pieces.values()].map(p => [p.part, p.color, p.pos.join(), p.o].join('|'));
  it('LDraw round-trip: 10 mẫu xuất .ldr rồi đọc lại ra đúng mô hình, đúng thứ tự lắp', () => {
    for (const s of SAMPLES) {
      const w = built(s.id), again = new World(catalog);
      const r = fromLdraw(again, toLdraw(w, s.name, buildSteps(w)));
      expect(r, s.id).toEqual({ added: w.pieces.size, unknown: [], rejected: 0 });
      const order = buildSteps(w).flatMap(st => st.pieces).map(id => w.pieces.get(id)!);
      expect(pieces(again), s.id).toEqual(order.map(p => [p.part, p.color, p.pos.join(), p.o].join('|')));
    }
  });
  it('LDraw round-trip: mọi mảnh × mọi hướng khác nhau, kể cả bộ ghép (cửa sổ, cửa, bánh)', { timeout: 60000 }, () => {
    const colors = catalog.palette.map(c => c.key);
    let n = 0;
    const w = new World(catalog), again = new World(catalog);  // dùng lại: World mới phải tính lại 24 hướng của mảnh
    for (const key of Object.keys(catalog.parts)) {
      const def = w.def(key);
      for (let o = 0; o < 24; o++) {
        if (def.symClass[o] !== o) continue;
        w.clear(); again.clear();
        w.add(key, colors[n++ % colors.length], [10, -400, 30], o);
        const r = fromLdraw(again, toLdraw(w, key));
        expect(r, `${key} o${o}`).toEqual({ added: 1, unknown: [], rejected: 0 });
        expect(pieces(again), `${key} o${o}`).toEqual(pieces(w));
      }
    }
    expect(n).toBeGreaterThan(1000);
  });
  it('LDraw: dòng mảnh lạ hoặc bộ ghép thiếu mảnh con thì báo, không đoán', () => {
    const w = new World(catalog); w.add('kit-window-1x2x2', 'red', [10, -400, 30], 0);
    const text = toLdraw(w, 'x').split('\r\n').filter(l => !l.includes('60601.dat')).join('\r\n') + '\r\n1 4 0 0 0 1 0 0 0 1 0 0 0 1 99999.dat\r\n';
    expect(fromLdraw(new World(catalog), text)).toEqual({ added: 0, unknown: ['60592', '99999'], rejected: 0 });
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
