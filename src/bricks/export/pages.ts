// Dựng các trang A4 của tài liệu lắp ghép trên canvas (plan mục 11.1–11.2), rồi ghép PDF.
import type { World } from '../engine/world';
import type { PartLibrary } from '../render/loader';
import { Materials } from '../render/materials';
import { IconRenderer } from '../render/icons';
import { Shooter, VIEWS } from '../render/shooter';
import { buildBom, realSize, type BomRow } from './bom';
import { baseplateHint, buildSteps, type Step } from './steps';
import { makePdf, type PdfPage } from './pdf';

const W = 1240, H = 1754, M = 70;
const FONT = '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif';
const INK = '#1b2a34', SOFT = '#5b6b7a', LINE = '#dbe3ec', ACCENT = '#2d8cff';

export interface DocInput { world: World; lib: PartLibrary; name: string; author?: string; /** chế độ bé: 3 mảnh mỗi bước (mục 11.4) */ maxPerStep?: number; signal?: AbortSignal; onProgress?: (done: number, total: number) => void }
export interface DocOutput { pages: HTMLCanvasElement[]; bom: BomRow[]; steps: Step[]; pdf(): Promise<Blob> }

function page() { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); return { c, g }; }
function txt(g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, opt: { weight?: number; color?: string; align?: CanvasTextAlign; max?: number } = {}) {
  g.font = `${opt.weight ?? 500} ${size}px ${FONT}`; g.fillStyle = opt.color ?? INK; g.textAlign = opt.align ?? 'left'; g.textBaseline = 'alphabetic';
  g.fillText(s, x, y, opt.max);
}
function footer(g: CanvasRenderingContext2D, name: string, n: number) {
  g.strokeStyle = LINE; g.lineWidth = 2; g.beginPath(); g.moveTo(M, H - 70); g.lineTo(W - M, H - 70); g.stroke();
  txt(g, `${name} · Xưởng Lắp Ghép`, M, H - 38, 20, { color: SOFT });
  txt(g, String(n), W - M, H - 38, 20, { color: SOFT, align: 'right' });
}
const loadImg = (url: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { g.beginPath(); g.roundRect(x, y, w, h, r); }

export async function buildDocument({ world, lib, name, author, maxPerStep = 6, onProgress, signal }: DocInput): Promise<DocOutput> {
  await document.fonts?.ready;
  signal?.throwIfAborted();
  const bom = buildBom(world), steps = buildSteps(world, maxPerStep), size = realSize(world), base = baseplateHint(world);
  const shooter = new Shooter(lib, world), mats = new Materials(world.catalog, 'high'), icons = new IconRenderer(lib, mats);
  const total = 1 + 6 + steps.length + bom.length;
  let done = 0;
  const tick = () => { signal?.throwIfAborted(); onProgress?.(++done, total); };
  const pages: HTMLCanvasElement[] = [];
  try {
    // ---- Bìa ----
    { const { c, g } = page();
      g.fillStyle = '#eef5ff'; g.fillRect(0, 0, W, 300);
      txt(g, 'TÀI LIỆU LẮP GHÉP', M, 110, 28, { weight: 700, color: ACCENT });
      txt(g, name, M, 190, 64, { weight: 800, max: W - 2 * M });
      txt(g, [author ? `Mô hình của ${author}` : '', new Date().toLocaleDateString('vi-VN')].filter(Boolean).join(' · '), M, 250, 28, { color: SOFT });
      const hero = await shooter.shot(VIEWS.iso, 1100, 860); tick();
      g.drawImage(hero, 70, 330);
      const stats: [string, string][] = [[String(bom.reduce((a, r) => a + r.qty, 0)), 'mảnh'], [String(bom.length), 'loại mảnh'], [size ? `${size.w} × ${size.d} × ${size.h}` : '—', 'cm (dài × rộng × cao)']];
      stats.forEach(([v, l], i) => {
        const x = M + i * 370; roundRect(g, x, 1240, 340, 170, 24); g.fillStyle = '#f4f7fb'; g.fill();
        txt(g, v, x + 28, 1325, i === 2 ? 42 : 64, { weight: 800 }); txt(g, l, x + 28, 1380, 24, { color: SOFT });
      });
      txt(g, `${steps.length} bước lắp · danh sách mảnh ở trang 3`, M, 1500, 26, { color: SOFT });
      footer(g, name, 1); pages.push(c); }

    // ---- Sáu góc nhìn ----
    { const { c, g } = page();
      txt(g, 'Sáu góc nhìn', M, 120, 48, { weight: 800 });
      const keys = ['front', 'back', 'left', 'right', 'top', 'isoBack'] as const;
      for (let i = 0; i < keys.length; i++) {
        const x = M + (i % 2) * 560, y = 170 + Math.floor(i / 2) * 500;
        const img = await shooter.shot(VIEWS[keys[i]], 540, 430); tick();
        roundRect(g, x, y, 540, 470, 20); g.fillStyle = '#f7f9fc'; g.fill();
        g.drawImage(img, x, y);
        txt(g, VIEWS[keys[i]].label, x + 20, y + 458, 24, { weight: 700, color: SOFT });
        // Góc Trước có thước cm (mục 11.1): vạch mỗi 1 cm theo bề ngang thật của mô hình
        const span = keys[i] === 'front' && size ? shooter.span(VIEWS.front, 540, 430) : null;
        if (span && size && size.w > 0) {
          const y0 = y + 415, x0 = x + span.x0, x1 = x + span.x1, perCm = (x1 - x0) / size.w;
          g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke();
          for (let k = 0; k <= Math.floor(size.w + 1e-6); k++) { const tx = x0 + k * perCm, long = k % 5 === 0; g.beginPath(); g.moveTo(tx, y0); g.lineTo(tx, y0 - (long ? 12 : 6)); g.stroke(); }
          g.beginPath(); g.moveTo(x1, y0); g.lineTo(x1, y0 - 12); g.stroke();
          txt(g, `${size.w.toLocaleString('vi-VN')} cm`, x + 520, y + 458, 22, { weight: 700, color: INK, align: 'right' });
        }
      }
      footer(g, name, 2); pages.push(c); }

    // ---- Danh sách mảnh ----
    const icon = async (r: BomRow) => r.part ? loadImg(await icons.icon(r.part, r.color ?? 'white')).catch(() => null) : null;
    const PER = 10; let n = 3;
    for (let start = 0; start < bom.length; start += PER) {
      const { c, g } = page();
      txt(g, start ? 'Danh sách mảnh (tiếp)' : 'Danh sách mảnh', M, 120, 48, { weight: 800 });
      if (!start) txt(g, 'Đánh dấu ☐ khi tìm đủ. Số lớn là số lượng cần có.', M, 165, 24, { color: SOFT });
      const rows = bom.slice(start, start + PER);
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i], y = 200 + i * 130;
        roundRect(g, M, y, W - 2 * M, 118, 18); g.fillStyle = i % 2 ? '#fff' : '#f7f9fc'; g.fill();
        const im = await icon(r); tick();
        if (im) g.drawImage(im, M + 10, y + 5, 108, 108);
        else { roundRect(g, M + 22, y + 20, 80, 80, 14); g.fillStyle = r.hex; g.fill(); }
        txt(g, r.nameVi, M + 140, y + 50, 30, { weight: 700, max: 520 });
        roundRect(g, M + 140, y + 70, 28, 28, 7); g.fillStyle = r.hex; g.fill(); g.strokeStyle = LINE; g.stroke();
        txt(g, r.colorVi, M + 180, y + 93, 24, { color: SOFT, max: 360 });
        txt(g, `${r.rb || r.ldraw} · màu ${r.rbColor ?? r.ldrawColor}`, M + 560, y + 93, 18, { color: '#8a97a3' });
        if (r.rare) txt(g, `⚠ màu này hiếm/không có thật${r.suggest ? ` — thay bằng ${r.suggest}` : ''}`, M + 560, y + 50, 20, { color: '#c2410c', max: 330 });
        txt(g, `×${r.qty}`, W - M - 110, y + 78, 52, { weight: 800, align: 'right' });
        g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(W - M - 70, y + 38, 42, 42);
      }
      if (start + PER >= bom.length) txt(g, `Tổng: ${bom.reduce((a, r) => a + r.qty, 0)} mảnh`, W - M, 200 + rows.length * 130 + 50, 32, { weight: 800, align: 'right' });
      footer(g, name, n++); pages.push(c);
    }

    // ---- Các bước lắp: 4 bước mỗi trang ----
    const shown: number[] = [];
    let stepView: 'iso' | 'isoBack' = 'iso';
    const partIcon = new Map<string, HTMLImageElement | null>();
    for (let s = 0; s < steps.length; s += 4) {
      const { c, g } = page();
      txt(g, 'Các bước lắp', M, 120, 48, { weight: 800 });
      for (let k = 0; k < 4 && s + k < steps.length; k++) {
        const st = steps[s + k], x = M + (k % 2) * 560, y = 160 + Math.floor(k / 2) * 770;
        shown.push(...st.pieces);
        // Góc nhìn (mục 11.4): giữ góc của bước trước nếu còn thấy ≥ 50 % mảnh mới; không thì lấy góc thấy nhiều hơn.
        const keep = shooter.visible(VIEWS[stepView], shown, st.pieces);
        let view = stepView;
        if (keep < 0.5) { const other = stepView === 'iso' ? 'isoBack' : 'iso'; if (shooter.visible(VIEWS[other], shown, st.pieces) > keep) view = other; }
        const turned = view !== stepView; stepView = view;
        const img = await shooter.shot(VIEWS[view], 540, 540, [...shown], st.pieces); tick();
        roundRect(g, x, y, 540, 740, 22); g.fillStyle = '#f7f9fc'; g.fill();
        g.drawImage(img, x, y + 180);
        g.fillStyle = ACCENT; g.beginPath(); g.arc(x + 52, y + 52, 34, 0, Math.PI * 2); g.fill();
        txt(g, String(s + k + 1), x + 52, y + 66, 38, { weight: 800, color: '#fff', align: 'center' });
        if (st.hard) txt(g, 'Mẹo: lắp cụm này riêng rồi ghép vào', x + 100, y + 60, 18, { color: '#c2410c', max: 420 });
        if (turned) txt(g, view === 'isoBack' ? '↻ Xoay mô hình ra phía sau' : '↻ Xoay mô hình về phía trước', x + 520, y + 718, 20, { weight: 700, color: ACCENT, align: 'right' });
        if (st.bridge) txt(g, `Đặt hai cụm cách nhau ${st.bridge.gap} núm${base ? `, hoặc dùng tấm nền ${base.w}×${base.d}` : ''}`, x + 100, y + (st.hard ? 84 : 60), 18, { color: '#0f766e', max: 420 });
        // khung mảnh cần cho bước
        const need = new Map<string, { part: string; color: string; qty: number }>();
        for (const id of st.pieces) { const p = world.pieces.get(id)!, key = p.part + '|' + p.color; const e = need.get(key) ?? { part: p.part, color: p.color, qty: 0 }; e.qty++; need.set(key, e); }
        let ix = x + 24; const iy = y + 96;
        for (const e of [...need.values()].slice(0, 6)) {
          const key = e.part + '|' + e.color;
          if (!partIcon.has(key)) partIcon.set(key, await loadImg(await icons.icon(e.part, e.color)).catch(() => null));
          const im = partIcon.get(key);
          if (im) g.drawImage(im, ix, iy, 64, 64);
          txt(g, `${e.qty}×`, ix + 62, iy + 72, 24, { weight: 800 });
          ix += 84;
        }
      }
      footer(g, name, n++); pages.push(c);
    }

    // ---- Cho người lớn + ghi công ----
    { const { c, g } = page();
      txt(g, 'Cho người lớn', M, 120, 48, { weight: 800 });
      const lines = [
        'Mua gạch: tìm theo kích thước (ví dụ “gạch 2×4”) và màu ở shop gạch xếp hình tương thích,',
        'hoặc theo mã mảnh in nhỏ trong danh sách (mã Rebrickable/LDraw — phần lớn trùng mã BrickLink).',
        'Màu thiếu: thay bằng màu gần nhất; mô hình vẫn lắp đúng vì hình dạng mảnh không đổi.',
        'Nút “Xuất” tạo LDraw (.ldr); CSV mua hàng chỉ có khi đã đối chiếu đủ mã. Mở .ldr',
        'bằng BrickLink Studio/LeoCAD để xem 3D hoặc làm sách hướng dẫn chi tiết.',
        base ? `Mô hình gồm nhiều cụm rời trên bàn: đặt các cụm đúng khoảng cách ghi ở từng bước, hoặc dùng tấm nền ${base.w}×${base.d} núm.` : 'Mô hình gồm nhiều cụm rời trên bàn: đặt các cụm đúng khoảng cách theo ô núm, hoặc dùng tấm nền.',
      ];
      lines.forEach((l, i) => txt(g, l, M, 200 + i * 46, 24, { color: INK, max: W - 2 * M }));
      txt(g, 'Ghi công', M, 560, 32, { weight: 800 });
      const credits = [
        'Hình mảnh ghép: LDraw.org Parts Library — tác giả cộng đồng LDraw, giấy phép CC BY 2.0/4.0.',
        'Điểm nối: LDCad Shadow Library (Roland Melkert và cộng tác viên), CC BY-SA 4.0.',
        'Dữ liệu màu và độ phổ biến: Rebrickable.com.',
        'Không liên kết và không được bảo trợ bởi bất kỳ hãng đồ chơi nào.',
      ];
      credits.forEach((l, i) => txt(g, l, M, 610 + i * 40, 22, { color: SOFT, max: W - 2 * M }));
      footer(g, name, n++); pages.push(c); }
  } finally { shooter.dispose(); icons.dispose(); mats.dispose(); }

  return {
    pages, bom, steps,
    async pdf() {
      const out: PdfPage[] = [];
      for (const p of pages) {
        const blob = await new Promise<Blob>((res, rej) => p.toBlob(b => (b ? res(b) : rej(Error('Không tạo được ảnh trang'))), 'image/jpeg', 0.88));
        out.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), width: W, height: H });
      }
      return new Blob([makePdf(out)], { type: 'application/pdf' });
    },
  };
}
