// Hộp va chạm tự động (mục 4.2 bước 6): voxel hoá tam giác, lấp đầy theo cột đứng, gộp tham lam thành hộp vuông góc.
// Đơn vị LDU nguyên. Núm không có trong tam giác (đã tách) nên không nằm trong hộp; engine xử lý núm riêng.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/**
 * @param {{p:number[], dbl?:boolean}[]} tris
 * @param {{res?:number, maxBoxes?:number}} [opt]
 * @returns {{boxes:number[][], res:number}} mỗi hộp [x0,y0,z0,x1,y1,z1]
 */
export function collisionBoxes(tris, opt = {}) {
  // Luôn dùng 2 LDU: lưới thô hơn làm hộp phình tới 4 LDU → hai mảnh chỉ chạm nhau cũng bị coi là va chạm.
  const maxBoxes = opt.maxBoxes ?? 96;
  opt = { res: 2, ...opt };
  carve = opt.carve || [];
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const t of tris) for (let i = 0; i < 9; i++) { const k = i % 3; min[k] = Math.min(min[k], t.p[i]); max[k] = Math.max(max[k], t.p[i]); }
  // Ô voxel có thể thò ra ngoài hộp bao thật (lưới làm tròn xuống) → cắt về hộp bao, làm tròn 0,5 LDU.
  const r = v => Math.round(v * 2) / 2;
  const clamp = b => [r(Math.max(b[0], min[0])), r(Math.max(b[1], min[1])), r(Math.max(b[2], min[2])), r(Math.min(b[3], max[0])), r(Math.min(b[4], max[1])), r(Math.min(b[5], max[2]))];
  for (const res of opt.res ? [opt.res] : [2, 4, 8]) {
    const boxes = voxelBoxes(tris, res);
    if (boxes.length <= maxBoxes || res === 8 || opt.res) return { boxes: (boxes.length <= maxBoxes ? boxes : mergeToLimit(boxes, maxBoxes)).map(clamp).filter(b => b[3] > b[0] && b[4] > b[1] && b[5] > b[2]), res };
  }
}

let carve = [];
function voxelBoxes(tris, h) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const t of tris) for (let i = 0; i < 9; i++) { const k = i % 3; min[k] = Math.min(min[k], t.p[i]); max[k] = Math.max(max[k], t.p[i]); }
  if (!isFinite(min[0])) return [];
  const o = min.map(v => Math.floor(v / h) * h), n = max.map((v, k) => Math.max(1, Math.ceil((v - o[k]) / h)));
  const [nx, ny, nz] = n, grid = new Uint8Array(nx * ny * nz);
  const at = (x, y, z) => x + nx * (y + ny * z);
  const mark = p => {
    const x = Math.floor((p[0] - o[0]) / h), y = Math.floor((p[1] - o[1]) / h), z = Math.floor((p[2] - o[2]) / h);
    if (x >= 0 && y >= 0 && z >= 0 && x < nx && y < ny && z < nz) grid[at(x, y, z)] = 1;
  };
  for (const t of tris) {
    const a = t.p.slice(0, 3), b = t.p.slice(3, 6), c = t.p.slice(6, 9);
    const nn = cross(sub(b, a), sub(c, a)), len = Math.hypot(...nn) || 1;
    // lệch vào trong một chút để mặt nằm đúng trên ranh giới ô rơi vào ô bên trong
    const bias = t.dbl ? [0, 0, 0] : nn.map(v => -(v / len) * 0.01 * h);
    const steps = Math.max(1, Math.ceil(Math.max(Math.hypot(...sub(b, a)), Math.hypot(...sub(c, a)), Math.hypot(...sub(c, b))) / (h / 3)));
    for (let i = 0; i <= steps; i++) for (let j = 0; j <= steps - i; j++) {
      const u = i / steps, v = j / steps, w = 1 - u - v;
      mark([0, 1, 2].map(k => a[k] * w + b[k] * u + c[k] * v + bias[k]));
    }
  }
  // Lấp phần ruột kín: loang từ ngoài vào qua các ô rỗng; ô nào không tới được là đặc.
  // (Khoang hở dưới đáy gạch, đĩa, mái vòm vẫn rỗng → núm của mảnh bên dưới được phép nằm trong đó.)
  const outside = new Uint8Array(grid.length), stack = [];
  const seed = (x, y, z) => { const i = at(x, y, z); if (!grid[i] && !outside[i]) { outside[i] = 1; stack.push(i); } };
  for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) { seed(x, y, 0); seed(x, y, nz - 1); }
  for (let x = 0; x < nx; x++) for (let z = 0; z < nz; z++) { seed(x, 0, z); seed(x, ny - 1, z); }
  for (let y = 0; y < ny; y++) for (let z = 0; z < nz; z++) { seed(0, y, z); seed(nx - 1, y, z); }
  while (stack.length) {
    const i = stack.pop(), x = i % nx, y = Math.floor(i / nx) % ny, z = Math.floor(i / (nx * ny));
    if (x > 0) seed(x - 1, y, z); if (x < nx - 1) seed(x + 1, y, z);
    if (y > 0) seed(x, y - 1, z); if (y < ny - 1) seed(x, y + 1, z);
    if (z > 0) seed(x, y, z - 1); if (z < nz - 1) seed(x, y, z + 1);
  }
  for (let i = 0; i < grid.length; i++) if (!outside[i]) grid[i] = 1;
  // Khoét thể tích điểm nối của chính mảnh: núm/chốt (engine kiểm riêng) và lòng lỗ nhận (chỗ núm mảnh khác cắm vào).
  for (const c of carve) {
    for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const i = at(x, y, z);
      if (!grid[i]) continue;
      const v = [o[0] + (x + 0.5) * h - c.p[0], o[1] + (y + 0.5) * h - c.p[1], o[2] + (z + 0.5) * h - c.p[2]];
      const along = v[0] * c.a[0] + v[1] * c.a[1] + v[2] * c.a[2];
      if (along <= 0 || along >= c.len) continue;
      const rad = Math.hypot(v[0] - c.a[0] * along, v[1] - c.a[1] * along, v[2] - c.a[2] * along);
      if (rad < c.r + 2.5) grid[i] = 0; // nới 2,5: voxel ở thành lòng lỗ/chân núm vẫn bị khoét
    }
  }
  // Gộp tham lam: X → Z → Y.
  const used = new Uint8Array(grid.length), boxes = [];
  for (let y = 0; y < ny; y++) for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) {
    if (!grid[at(x, y, z)] || used[at(x, y, z)]) continue;
    let x1 = x; while (x1 + 1 < nx && grid[at(x1 + 1, y, z)] && !used[at(x1 + 1, y, z)]) x1++;
    const rowOk = (zz, yy) => { for (let xx = x; xx <= x1; xx++) if (!grid[at(xx, yy, zz)] || used[at(xx, yy, zz)]) return false; return true; };
    let z1 = z; while (z1 + 1 < nz && rowOk(z1 + 1, y)) z1++;
    const layerOk = yy => { for (let zz = z; zz <= z1; zz++) if (!rowOk(zz, yy)) return false; return true; };
    let y1 = y; while (y1 + 1 < ny && layerOk(y1 + 1)) y1++;
    for (let yy = y; yy <= y1; yy++) for (let zz = z; zz <= z1; zz++) for (let xx = x; xx <= x1; xx++) used[at(xx, yy, zz)] = 1;
    boxes.push([o[0] + x * h, o[1] + y * h, o[2] + z * h, o[0] + (x1 + 1) * h, o[1] + (y1 + 1) * h, o[2] + (z1 + 1) * h]);
  }
  return boxes;
}

/** Gộp cặp hộp có hộp bao chung tăng thể tích ít nhất cho tới khi đủ số lượng (bảo thủ: chỉ phình ra). */
function mergeToLimit(boxes, limit) {
  const vol = b => (b[3] - b[0]) * (b[4] - b[1]) * (b[5] - b[2]);
  const join = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[3], b[3]), Math.max(a[4], b[4]), Math.max(a[5], b[5])];
  const list = boxes.slice();
  while (list.length > limit) {
    let best = null;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const u = join(list[i], list[j]), cost = vol(u) - vol(list[i]) - vol(list[j]);
      if (!best || cost < best.cost) best = { i, j, u, cost };
    }
    list.splice(best.j, 1); list.splice(best.i, 1, best.u);
  }
  return list;
}
