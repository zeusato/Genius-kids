// Dòng SNAP_* của LDCad (https://www.melkert.net/LDCad/tech/meta) → điểm nối của Xưởng Lắp Ghép.
// Hình trụ của snap kéo dài theo trục −Y cục bộ, gốc (base) nằm ở `pos` (hoặc giữa nếu center=true).

const num = s => s.trim().split(/\s+/).map(Number);

/** "[gender=F] [secs=R 6 4] [pos=0 24 0]" → {gender:'F', secs:'R 6 4', pos:'0 24 0'} */
export function parseParams(text) {
  const out = {};
  for (const m of text.matchAll(/\[([^=\]]+)=([^\]]*)\]/g)) out[m[1].trim().toLowerCase()] = m[2].trim();
  return out;
}

export function parseSnapLine(kind, text) {
  const p = parseParams(text);
  const type = { SNAP_CYL: 'cyl', SNAP_CLEAR: 'clear', SNAP_INCL: 'incl', SNAP_CLP: 'clp', SNAP_FGR: 'fgr', SNAP_GEN: 'gen' }[kind] || 'other';
  const s = {
    type, id: p.id, group: p.group,
    pos: p.pos ? num(p.pos) : [0, 0, 0],
    ori: p.ori ? num(p.ori) : [1, 0, 0, 0, 1, 0, 0, 0, 1],
    grid: p.grid, center: p.center === 'true', slide: p.slide === 'true',
    scale: (p.scale || 'none').toLowerCase(), mirror: (p.mirror || (type === 'cyl' ? 'cor' : 'none')).toLowerCase(),
  };
  if (type === 'cyl') {
    s.gender = (p.gender || 'M').toUpperCase();
    s.caps = (p.caps || 'one').toLowerCase();
    s.secs = [];
    const t = (p.secs || '').trim().split(/\s+/).filter(Boolean);
    for (let i = 0; i + 2 < t.length; i += 3) s.secs.push({ shape: t[i], r: Number(t[i + 1]), len: Number(t[i + 2]) });
  } else if (type === 'clp') {
    s.gender = 'F'; s.r = Number(p.radius ?? 4); s.len = Number(p.length ?? 8);
  } else if (type === 'gen' || type === 'fgr') {
    s.gender = (p.gender || p.genderofs || 'M').toUpperCase();
  } else if (type === 'incl') s.ref = p.ref;
  return s;
}

/** Snap của file con có được thừa kế qua phép biến đổi này không. */
export function snapAllowed(s, rigid, mirrored) {
  if (!rigid && s.scale === 'none') return false;
  if (mirrored && s.mirror === 'none') return false;
  return true;
}

/** Áp ma trận LDraw [x y z a..i] lên snap. */
export function transformSnap(s, m) {
  const R = m.slice(3), o = s.ori, p = s.pos;
  const ori = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) ori.push(R[r * 3] * o[c] + R[r * 3 + 1] * o[3 + c] + R[r * 3 + 2] * o[6 + c]);
  return {
    ...s, ori,
    pos: [R[0] * p[0] + R[1] * p[1] + R[2] * p[2] + m[0], R[3] * p[0] + R[4] * p[1] + R[5] * p[2] + m[1], R[6] * p[0] + R[7] * p[1] + R[8] * p[2] + m[2]],
  };
}

const round = v => Math.round(v * 1000) / 1000;
/** Trục cắm: −Y cục bộ của snap, làm tròn về một trong 6 hướng nếu thẳng trục. */
export function snapAxis(s) {
  const a = [-s.ori[1], -s.ori[4], -s.ori[7]];
  const l = Math.hypot(...a) || 1;
  return a.map(v => round(v / l));
}
/** Điểm gốc của snap (đầu hở của lỗ / chân của núm). */
export function snapBase(s) {
  if (!s.center) return s.pos.map(round);
  const len = s.type === 'cyl' ? s.secs.reduce((a, b) => a + b.len, 0) : s.len || 0;
  const ax = snapAxis(s);
  return s.pos.map((v, i) => round(v - ax[i] * len / 2));
}

/**
 * Kiểu nối v1 (D3): núm r6 ↔ lỗ r6 (tròn hoặc vuông); chốt/thanh r4 ↔ lỗ r4. Còn lại để dành v2.
 * Với snap đực, núm có thể nằm sau một đoạn khác (ví dụ tấm tròn 1×1: R 10 3 rồi R 6 4) → gốc dời theo trục.
 * @returns {{kind:string, shift:number}}
 */
export function classify(s) {
  if (s.type === 'cyl') {
    if (!s.secs.length) return { kind: 'other', shift: 0 };
    if (s.gender === 'F') {
      const { shape, r } = s.secs[0], S = shape.toUpperCase();
      if ((S === 'R' || S === 'S') && r === 6) return { kind: 'antistud', shift: 0 };
      if (S === 'R' && r === 4) return { kind: 'pinhole', shift: 0 };
      return { kind: S === 'A' || r === 8 ? 'technic' : 'other', shift: 0 };
    }
    let shift = 0;
    for (const { shape, r, len } of s.secs) {
      const S = shape.toUpperCase();
      if (S === 'R' && r === 6) return { kind: 'stud', shift };
      if (S === 'R' && r === 4) return { kind: 'pin', shift };
      shift += len;
    }
    return { kind: s.secs.some(x => x.shape.toUpperCase() === 'A' || x.r === 8) ? 'technic' : 'other', shift: 0 };
  }
  return { kind: s.type === 'clp' ? 'clip' : s.type === 'fgr' ? 'hinge' : s.type === 'gen' ? 'generic' : 'other', shift: 0 };
}
export const V1_KINDS = new Set(['stud', 'antistud', 'pin', 'pinhole']);

/**
 * Chuẩn hoá về dạng chung: `pos` = chân núm (đực) hoặc MIỆNG lỗ (cái), `axis` = hướng cắm vào/nhô ra.
 * Hình trụ chạy từ đầu A (start = pos, hoặc pos lùi nửa chiều dài nếu center) theo trục e tới đầu B (end).
 * caps (đặc tả LDCad): đực đóng ở A; cái 'one'/'B' đóng ở B → miệng ở A; cái 'A' → miệng ở B; 'none' → hở cả hai đầu.
 * Đực caps 'B' (hiếm) → chân ở B, hướng ngược lại.
 */
export function cylEnds(s) {
  const e = snapAxis(s), L = s.secs.reduce((a, b) => a + b.len, 0);
  const start = s.center ? s.pos.map((v, i) => v - e[i] * L / 2) : s.pos.slice();
  const end = start.map((v, i) => v + e[i] * L), neg = e.map(v => -v || 0);
  const rev = { ...s, secs: [...s.secs].reverse() };
  if (s.gender === 'M') return s.caps === 'b' ? [{ p: end, a: neg, s: rev }] : [{ p: start, a: e, s }];
  if (s.caps === 'a') return [{ p: end, a: neg, s: rev }];
  if (s.caps === 'none') return [{ p: start, a: e, s }, { p: end, a: neg, s: rev }];
  return [{ p: start, a: e, s }];
}

/** Danh sách snap → điểm nối gọn, đã khử trùng. */
export function toConnectors(snaps) {
  const seen = new Set(), out = [];
  const push = (kind, pos, axis, len, s) => {
    const key = kind + '|' + pos.join(',') + '|' + axis.join(',');
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ kind, pos, axis, len: round(len), ...(s.group ? { group: s.group } : {}), ...(s.gender ? { gender: s.gender } : {}) });
  };
  for (const s of snaps) {
    if (s.type === 'clear' || s.type === 'incl') continue;
    if (s.type !== 'cyl') { push(classify(s).kind, snapBase(s), snapAxis(s), s.len || 0, s); continue; }
    for (const end of cylEnds(s)) {
      const { kind, shift } = classify(end.s), L = end.s.secs.reduce((a, b) => a + b.len, 0);
      push(kind, end.p.map((v, i) => round(v + end.a[i] * shift)), end.a.map(round), L - shift, s);
    }
  }
  return out;
}
