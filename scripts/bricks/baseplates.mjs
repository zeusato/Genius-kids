// Nhóm "Tấm nền" (yêu cầu chủ dự án 15/10): tấm đế vuông/chữ nhật cỡ lớn để lắp mô hình lên trên.
// Máy không có tools/ldraw nên dựng hình học theo thủ tục (khối tấm + núm dùng chung studs.bin) và NỐI vào catalog có sẵn.
// Mã LDraw/Rebrickable là của tấm thật → danh sách mảnh, .ldr, Studio nhận đúng. Các dòng cũng có trong parts-v1.csv
// (nhóm base) nên lần chạy bricks-parts.mjs đầy đủ sau này sẽ thay bằng hình học LDraw thật.
//   node scripts/bricks/baseplates.mjs        (chạy lại được: gỡ nhóm cũ rồi thêm lại)
import fs from 'node:fs';
import { buildMesh, packMesh } from './mesh.mjs';

export const BASEPLATES = [
  // key = mã LDraw, rộng × dài (núm), dày (LDU), tên Việt, tên gốc
  { key: '41539', w: 8, d: 8, h: 8, nameVi: 'Tấm nền 8×8', nameEn: 'Plate 8 x 8' },
  { key: '92438', w: 8, d: 16, h: 8, nameVi: 'Tấm nền 8×16', nameEn: 'Plate 8 x 16' },
  { key: '91405', w: 16, d: 16, h: 8, nameVi: 'Tấm nền 16×16', nameEn: 'Plate 16 x 16' },
  { key: '3811', w: 32, d: 32, h: 4, nameVi: 'Đế mỏng 32×32', nameEn: 'Baseplate 32 x 32' },
];

/** Khối hộp (toạ độ LDraw: Y xuống, mặt trên y = 0) — mỗi tam giác quay ra ngoài. */
function boxTris(x0, x1, z0, z1, h) {
  const c = [(x0 + x1) / 2, h / 2, (z0 + z1) / 2], tris = [];
  const quad = (a, b, cc, d) => [[a, b, cc], [a, cc, d]].forEach(t => {
    const u = t[1].map((v, i) => v - t[0][i]), w = t[2].map((v, i) => v - t[0][i]);
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const m = t.reduce((s, p) => s.map((v, i) => v + p[i] / 3), [0, 0, 0]).map((v, i) => v - c[i]);
    const tri = n[0] * m[0] + n[1] * m[1] + n[2] * m[2] >= 0 ? t : [t[0], t[2], t[1]];
    tris.push({ p: tri.flat(), c: 16, dbl: false });
  });
  const P = (x, y, z) => [x, y, z];
  quad(P(x0, 0, z0), P(x1, 0, z0), P(x1, 0, z1), P(x0, 0, z1));     // trên
  quad(P(x0, h, z0), P(x1, h, z0), P(x1, h, z1), P(x0, h, z1));     // dưới
  quad(P(x0, 0, z0), P(x1, 0, z0), P(x1, h, z0), P(x0, h, z0));     // các mặt bên
  quad(P(x0, 0, z1), P(x1, 0, z1), P(x1, h, z1), P(x0, h, z1));
  quad(P(x0, 0, z0), P(x0, 0, z1), P(x0, h, z1), P(x0, h, z0));
  quad(P(x1, 0, z0), P(x1, 0, z1), P(x1, h, z1), P(x1, h, z0));
  return tris;
}

export function baseplatePart(b, addBin) {
  const x0 = -b.w * 10, x1 = b.w * 10, z0 = -b.d * 10, z1 = b.d * 10;
  const mesh = buildMesh({ tris: boxTris(x0, x1, z0, z1, b.h), edges: [] });
  const packed = packMesh(mesh);
  const conns = [], studs = [];
  for (let i = 0; i < b.w; i++) for (let k = 0; k < b.d; k++) {
    const x = x0 + 10 + i * 20, z = z0 + 10 + k * 20;
    conns.push({ k: 's', p: [x, 0, z], a: [0, -1, 0] }, { k: 'a', p: [x, b.h, z], a: [0, -1, 0] });
    studs.push({ k: 's', m: [x, 0, z, 1, 0, 0, 0, 1, 0, 0, 0, 1], c: 16 });
  }
  return {
    name: b.nameVi, group: 'base', ldraw: b.key, rb: b.key, faces: mesh.triCount,
    bbox: [[x0, 0, z0], [x1, b.h, z1]],
    mesh: { vc: packed.vertexCount, i32: packed.index32, pos: addBin(packed.arrays.pos), nrm: addBin(packed.arrays.nrm), idx: addBin(packed.arrays.idx), groups: packed.groups },
    boxes: [[x0, 0, z0, x1, b.h, z1]], conns, studs,
    bom: [{ ldraw: b.key, color: 'self', qty: 1, name: b.nameEn }],
    colors: null, procedural: true,
  };
}

if (process.argv[1]?.endsWith('baseplates.mjs')) {
  const file = 'public/bricks/catalog.json', cat = JSON.parse(fs.readFileSync(file, 'utf8'));
  const chunks = []; let size = 0;
  const addBin = typed => {
    const off = size, bytes = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    chunks.push(bytes); size += bytes.length;
    const pad = (4 - (size % 4)) % 4; if (pad) { chunks.push(Buffer.alloc(pad)); size += pad; }
    return [off, typed.length];
  };
  for (const [k, p] of Object.entries(cat.parts)) if (p.group === 'base') delete cat.parts[k];
  cat.groups = cat.groups.filter(g => g.id !== 'base');
  for (const b of BASEPLATES) cat.parts[b.key] = baseplatePart(b, addBin);
  // nhóm đứng ĐẦU khay: đặt tấm nền trước rồi lắp lên trên
  cat.groups.unshift({ id: 'base', nameVi: 'Tấm nền', parts: BASEPLATES.map(b => b.key), bin: 'parts/base.bin' });
  fs.writeFileSync('public/bricks/parts/base.bin', Buffer.concat(chunks));
  fs.writeFileSync(file, JSON.stringify(cat));
  console.log('tấm nền', BASEPLATES.length, '· base.bin', size, 'byte');
}
