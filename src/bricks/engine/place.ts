// Tìm vị trí đặt cho mảnh đang cầm (plan mục 7.4): mục tiêu = điểm nối tự do gần chỗ chạm, ứng viên = ghép
// một điểm nối bù của mảnh đang cầm vào mục tiêu theo các hướng làm trùng trục, chấm điểm rồi kiểm tra hợp lệ.
import { ORIENTS, YAW, rot } from './orient';
import { pick, type Hit } from './pick';
import type { ConnKind, V3 } from './types';
import { add3, isGroundStud, type Check, type Problem, type World } from './world';

export interface Candidate { part: string; pos: V3; o: number; ok: boolean; reason?: Problem; joins: Check['joins']; lift?: Check['lift']; score: number }
export interface SuggestOptions {
  prev?: Candidate | null;     // ứng viên trước (chống giật)
  bottomUpOnly?: boolean;      // chế độ bé: chỉ lắp chồng từ trên xuống (mục 7.7)
  radius?: number;             // bán kính tìm mục tiêu (LDU)
  maxChecks?: number;
  ignore?: Set<number>;        // khi dời một mảnh: bỏ qua chính nó
  wantOptions?: number;
  noClimb?: boolean;           // nội bộ: không thử leo lên lần nữa        // dừng sau khi đủ số ứng viên hợp lệ (mặc định 1; nút ↻ cần nhiều hơn)
}
export interface Suggestion { best: Candidate | null; options: Candidate[]; target: Hit }

const COMPLEMENT: Record<ConnKind, ConnKind> = { s: 'a', a: 's', p: 'h', h: 'p' };
const UPRIGHT = new Set(YAW);
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const eq = (a: V3, b: V3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);

interface Target { k: ConnKind; p: V3; a: V3 }

function targetsFor(world: World, hit: Hit, radius: number, opt: SuggestOptions): Target[] {
  const out: Target[] = [];
  if (hit.kind === 'ground') {
    const gx = Math.round((hit.point[0] - 10) / 20), gz = Math.round((hit.point[2] - 10) / 20), n = Math.ceil(radius / 20);
    for (let i = -n; i <= n; i++) for (let k = -n; k <= n; k++) {
      const p: V3 = [(gx + i) * 20 + 10, 0, (gz + k) * 20 + 10];
      if (isGroundStud(p, [0, -1, 0]) && Math.hypot(p[0] - hit.point[0], p[2] - hit.point[2]) <= radius) out.push({ k: 's', p, a: [0, -1, 0] });
    }
    return out;
  }
  const piece = world.pieces.get(hit.id)!;
  for (const c of piece.geo.conns) {
    // Chỉ nhận điểm nối "mở ra" phía mặt được chạm: núm nhô ra theo pháp tuyến, lỗ mở miệng theo pháp tuyến.
    // (Chạm mặt trên tấm thì không được ra lỗ ở mặt dưới — dù cùng trục đứng.)
    const outward = c.k === 's' || c.k === 'p' ? c.a : ([-c.a[0], -c.a[1], -c.a[2]] as V3);
    if (dot(outward, hit.normal) < 0.99) continue;
    const p = add3(c.p, piece.pos);
    // nằm trên (gần) mặt được chạm; núm/chốt nhô ra nên mặt chạm có thể ở xa gốc tới hết chiều dài chốt
    const depth = dot(sub(p, hit.point), hit.normal);
    if (depth > 8 || depth < (c.k === 's' || c.k === 'p' ? -18 : -8)) continue;
    if (len(sub(p, hit.point)) > radius) continue;
    if (opt.bottomUpOnly && !(c.k === 's' && eq(c.a, [0, -1, 0]))) continue;
    out.push({ k: c.k, p, a: c.a });
  }
  return out;
}

/**
 * Gợi ý vị trí cho mảnh `part` với hướng ưa thích `prefO` khi tia chạm `hit`.
 * Mặt không có điểm nối song song (thành bên gạch thường) → "rơi": bắn tia thẳng xuống từ ngoài mặt đó.
 */
export function suggest(world: World, part: string, prefO: number, hit: Hit, opt: SuggestOptions = {}): Suggestion {
  const def = world.def(part);
  const size = Math.max(...[0, 1, 2].map(i => def.src.bbox[1][i] - def.src.bbox[0][i]));
  const radius = opt.radius ?? Math.max(30, size / 2 + 20);
  let targets = targetsFor(world, hit, radius, opt);
  let target = hit;
  if (!targets.length && hit.kind === 'piece') {
    const from = add3(hit.point, [hit.normal[0] * 12, hit.normal[1] * 12 - 0.5, hit.normal[2] * 12]);
    const down = pick(world, from, [0, 1, 0], opt.ignore);
    if (down && (down.kind === 'ground' || down.normal[1] < 0)) { target = down; targets = targetsFor(world, down, radius, opt); }
  }
  const wantUp = !UPRIGHT.has(prefO) ? null : true;
  const raw: Candidate[] = [];
  const seen = new Set<string>();
  const prefClass = def.symClass[prefO];
  for (const t of targets) {
    const need = COMPLEMENT[t.k];
    for (const h of def.src.conns) {
      if (h.k !== need) continue;
      for (let o = 0; o < 24; o++) {
        if (opt.bottomUpOnly && !UPRIGHT.has(o)) continue;
        if (!eq(rot(ORIENTS[o], h.a), t.a)) continue;
        const pos = sub(t.p, rot(ORIENTS[o], h.p)).map(v => Math.round(v * 8) / 8) as V3;
        const k = def.symClass[o] + '|' + pos.join(',');
        if (seen.has(k)) continue;
        seen.add(k);
        // tâm hộp bao của mảnh đặt thử, so với điểm chạm (chỉ tính phần nằm trên mặt chạm)
        const bb = def.oriented(o).bbox, c: V3 = [(bb[0] + bb[3]) / 2 + pos[0], (bb[1] + bb[4]) / 2 + pos[1], (bb[2] + bb[5]) / 2 + pos[2]];
        const dv = sub(c, target.point), along = dot(dv, target.normal);
        const lateral = len(sub(dv, [target.normal[0] * along, target.normal[1] * along, target.normal[2] * along]));
        let score = lateral + (along < 0 ? -along * 2 : 0); // mảnh phải nằm phía ngoài mặt chạm
        if (def.symClass[o] !== prefClass) score += UPRIGHT.has(o) && wantUp ? 12 : 40;
        if (opt.prev && opt.prev.part === part && def.symClass[opt.prev.o] === def.symClass[o] && eq(opt.prev.pos, pos)) score -= 6;
        raw.push({ part, pos, o, ok: false, joins: [], score });
      }
    }
  }
  raw.sort((a, b) => a.score - b.score);
  const maxChecks = opt.maxChecks ?? 48;
  const checked: Candidate[] = [];
  let okCount = 0;
  for (const c of raw.slice(0, maxChecks)) {
    const r = world.check(part, c.pos, c.o, opt.ignore);
    checked.push({ ...c, ok: r.ok, reason: r.reason, joins: r.joins, lift: r.lift });
    if (r.ok && ++okCount >= (opt.wantOptions ?? 1)) break;
  }
  const valid = checked.filter(c => c.ok);
  // Một lựa chọn cho mỗi lớp hướng (cho nút ↻), theo điểm tốt nhất
  const options: Candidate[] = [], classes = new Set<number>();
  for (const c of valid) { const cl = def.symClass[c.o]; if (!classes.has(cl)) { classes.add(cl); options.push(c); } }
  // "Leo lên": chạm mặt ngửa (bàn/mặt trên) mà mọi chỗ đều vướng → thử mặt núm CAO NHẤT nằm dưới vùng chân mảnh,
  // giữ đúng vị trí ngang bé đã nhắm (ví dụ thả tấm mái giữa bốn cột: tia lọt khe xuống nền, mái phải lên đầu cột).
  if (!valid.length && checked.length && !opt.noClimb && target.normal[1] < -0.99) {
    const g = world.shape(part, checked[0].pos, checked[0].o).bbox;
    let top: Hit | null = null;
    for (let x = g[0] + 10; x < g[3]; x += 20) for (let z = g[2] + 10; z < g[5]; z += 20) {
      const h = pick(world, [x, -AREA_TOP, z], [0, 1, 0], opt.ignore);
      if (h && h.kind === 'piece' && h.normal[1] < -0.99 && h.point[1] < target.point[1] - 1 && (!top || h.point[1] < top.point[1])) top = h;
    }
    if (top && top.kind === 'piece') {
      const lifted: Hit = { ...top, point: [target.point[0], top.point[1], target.point[2]] };
      const again = suggest(world, part, prefO, lifted, { ...opt, noClimb: true, radius: Math.max(radius, size) });
      if (again.best?.ok) return again;
    }
  }
  return { best: valid[0] || checked[0] || null, options, target };
}
const AREA_TOP = 4000;
