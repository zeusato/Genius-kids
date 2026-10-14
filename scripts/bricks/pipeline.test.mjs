// Test các hàm thuần của dây chuyền mảnh (không cần thư viện LDraw).
import { describe, expect, it } from 'vitest';
import { parseSnapLine, toConnectors, transformSnap, snapAllowed } from './snap.mjs';
import { gridOffsets, expandGrid, parseLdraw, mul, apply, det3, isRigid } from './ldraw.mjs';
import { buildMesh, packMesh, octEncode, octDecode } from './mesh.mjs';
import { collisionBoxes } from './collide.mjs';
import { viName } from './names.mjs';

describe('snap', () => {
  it('lưới căn giữa 4×2 bước 20', () => {
    const g = gridOffsets('C 4 C 2 20 20');
    expect(g).toHaveLength(8);
    expect(g[0]).toEqual([-30, 0, -10]);
    expect(gridOffsets('1 2 0 20')).toEqual([[0, 0, 0], [0, 0, 20]]);
  });
  it('lỗ đáy gạch 2×4: 8 lỗ nhận, miệng ở y=24 hướng lên', () => {
    const s = parseSnapLine('SNAP_CYL', '[gender=F] [caps=one] [secs=R 6 20] [pos=0 24 0] [grid=C 4 C 2 20 20]');
    const c = toConnectors(expandGrid(s));
    expect(c).toHaveLength(8);
    expect(c.every(x => x.kind === 'antistud' && x.pos[1] === 24 && x.axis.join() === '0,-1,0')).toBe(true);
  });
  it('caps=A: miệng ở đầu B, hướng ngược lại (tấm trơn tròn 1×1)', () => {
    const s = parseSnapLine('SNAP_CYL', '[gender=F] [caps=A] [secs=R 6 4] [pos=0 4 0] [ori=1 0 0 0 -1 0 0 0 1]');
    const [c] = toConnectors([s]);
    expect(c.pos).toEqual([0, 8, 0]);
    expect(c.axis).toEqual([0, -1, 0]);
  });
  it('núm sau đoạn đế được dời gốc (tấm tròn 1×1)', () => {
    const s = parseSnapLine('SNAP_CYL', '[gender=M] [caps=none] [secs=R 10 3   R 6 4] [pos=0 3 0]');
    const [c] = toConnectors([s]);
    expect(c.kind).toBe('stud');
    expect(c.pos).toEqual([0, 0, 0]);
  });
  it('caps=none cho lỗ: hai miệng, mỗi miệng phân loại theo đoạn ở miệng', () => {
    const s = parseSnapLine('SNAP_CYL', '[gender=F] [caps=none] [secs=R 6 4 R 4 8] [pos=0 8 0]');
    const kinds = toConnectors([s]).map(c => c.kind).sort();
    expect(kinds).toEqual(['antistud', 'pinhole']);
  });
  it('thừa kế: bỏ khi co giãn (trừ khi cho phép), giữ khi xoay', () => {
    const s = parseSnapLine('SNAP_CYL', '[gender=M] [secs=R 6 4]');
    expect(snapAllowed(s, false, false)).toBe(false);
    expect(snapAllowed({ ...s, scale: 'yonly' }, false, false)).toBe(true);
    expect(transformSnap(s, [10, 0, 0, 0, 0, 1, 0, 1, 0, -1, 0, 0]).pos).toEqual([10, 0, 0]);
  });
});

describe('LDraw', () => {
  it('đọc tiêu đề, BFC và lệnh', () => {
    const d = parseLdraw('0 Brick 2 x 4\n0 Name: x.dat\n0 Author: A B\n0 BFC CERTIFY CCW\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 stud.dat\n0 BFC INVERTNEXT\n1 16 0 4 0 1 0 0 0 1 0 0 0 1 box5.dat\n4 16 0 0 0 1 0 0 1 0 1 0 0 1\n');
    expect(d.header.title).toBe('Brick 2 x 4');
    expect(d.header.author).toBe('A B');
    expect(d.certified).toBe(true);
    expect(d.cmds.filter(c => c.t === 1)[1].invert).toBe(true);
  });
  it('ma trận', () => {
    const r = [0, 0, 0, 0, 0, 1, 0, 1, 0, -1, 0, 0];
    expect(apply(mul([5, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], r), 1, 0, 0)).toEqual([5, 0, -1]);
    expect(det3([0, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0, 1])).toBe(-1);
    expect(isRigid([0, 0, 0, 1, 0, 0, 0, -5, 0, 0, 0, 1])).toBe(false);
  });
});

describe('lưới tam giác và hộp va chạm', () => {
  // khối hộp 20×24×20, mặt CCW nhìn từ ngoài
  const cube = () => {
    const v = (x, y, z) => [x ? 10 : -10, y ? 24 : 0, z ? 10 : -10];
    const q = (a, b, c, d) => [{ p: [...a, ...b, ...c], c: 16 }, { p: [...a, ...c, ...d], c: 16 }];
    const tris = [
      ...q(v(0,0,0), v(1,0,0), v(1,0,1), v(0,0,1)), ...q(v(0,1,0), v(0,1,1), v(1,1,1), v(1,1,0)),
      ...q(v(0,0,0), v(0,1,0), v(1,1,0), v(1,0,0)), ...q(v(0,0,1), v(1,0,1), v(1,1,1), v(0,1,1)),
      ...q(v(0,0,0), v(0,0,1), v(0,1,1), v(0,1,0)), ...q(v(1,0,0), v(1,1,0), v(1,1,1), v(1,0,1)),
    ];
    return { tris, edges: [] };
  };
  it('hộp kín → đúng một hộp va chạm khớp hộp bao', () => {
    const { boxes } = collisionBoxes(cube().tris);
    expect(boxes).toEqual([[-10, 0, -10, 10, 24, 10]]);
  });
  it('khoét lòng lỗ nhận', () => {
    const { boxes } = collisionBoxes(cube().tris, { carve: [{ p: [0, 24, 0], a: [0, -1, 0], r: 6, len: 12 }] });
    expect(boxes.length).toBeGreaterThan(1);
  });
  it('đóng gói giữ vị trí ±1/8 LDU và pháp tuyến', () => {
    const m = buildMesh(cube());
    expect(m.triCount).toBe(12);
    const pk = packMesh(m);
    expect(pk.arrays.pos[0] / 8).toBeCloseTo(m.positions[0], 3);
    for (const n of [[0, 0, 1], [0, -1, 0], [0.6, 0.8, 0], [-0.48, 0.6, -0.64]]) {
      const d = octDecode(...octEncode(n));
      expect(d[0] * n[0] + d[1] * n[1] + d[2] * n[2]).toBeGreaterThan(0.995);
    }
  });
});

describe('tên Việt', () => {
  it('kích thước có phân số', () => {
    expect(viName('Brick 2 x 4')).toBe('Gạch 2×4');
    expect(viName('Brick Curved 1 x 2 x 1 1/3 with Curved Top')).toBe('Gạch cong 1×2×1⅓');
    expect(viName('Brick Sloped Inverted 45° 2 x 1')).toBe('Mái dốc ngược 45° 2×1');
  });
});
