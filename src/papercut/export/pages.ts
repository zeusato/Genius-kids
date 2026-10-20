// Tài liệu hướng dẫn (plan mục 7.4): bìa → các bước (6 bước/trang) → mẫu 1:1 → PDF A4; và thẻ PNG chia sẻ.
// Không in tên bé (quyết định 15/10). Chữ tiếng Việt vẽ sẵn trên canvas nên PDF không cần nhúng font.
import { makePdf, type PdfPage } from '../../lib/export/pdf';
import type { Op, PaperSpec } from '../model';
import { drawStep, INK, SOFT } from './diagrams';
import { buildSteps, type Step } from './steps';
import { drawOverlay, drawPrintedSheet, PAGE_H, PAGE_W, ruler, type TemplateNotes } from './template';

const FONT = '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif';
const M = 70, ACCENT = '#e8590c', LINE = '#e3e7ec';
type G = CanvasRenderingContext2D;

function canvas(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); return { c, g }; }
function txt(g: G, s: string, x: number, y: number, size: number, o: { weight?: number; color?: string; align?: CanvasTextAlign; max?: number } = {}) {
  g.font = `${o.weight ?? 500} ${size}px ${FONT}`; g.fillStyle = o.color ?? INK; g.textAlign = o.align ?? 'left'; g.textBaseline = 'alphabetic'; g.fillText(s, x, y, o.max);
}
/** Ngắt dòng theo bề rộng; trả số dòng đã vẽ. */
function para(g: G, s: string, x: number, y: number, w: number, size: number, lh = 1.35, o: { weight?: number; color?: string; maxLines?: number } = {}) {
  g.font = `${o.weight ?? 500} ${size}px ${FONT}`;
  const words = s.split(/\s+/), lines: string[] = [];
  let cur = '';
  for (const word of words) { const t = cur ? `${cur} ${word}` : word; if (g.measureText(t).width > w && cur) { lines.push(cur); cur = word; } else cur = t; }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, o.maxLines ?? 99);
  shown.forEach((l, i) => txt(g, l, x, y + i * size * lh, size, { weight: o.weight, color: o.color }));
  return shown.length;
}
function footer(g: G, name: string, n: number) {
  g.strokeStyle = LINE; g.lineWidth = 2; g.beginPath(); g.moveTo(M, PAGE_H - 70); g.lineTo(PAGE_W - M, PAGE_H - 70); g.stroke();
  txt(g, `${name} · Xưởng Cắt Giấy · Genius Kids`, M, PAGE_H - 38, 20, { color: SOFT });
  txt(g, String(n), PAGE_W - M, PAGE_H - 38, 20, { color: SOFT, align: 'right' });
}
function badge(g: G, n: number, x: number, y: number, r = 26) {
  g.fillStyle = ACCENT; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  txt(g, String(n), x, y + r * 0.36, r, { weight: 800, color: '#fff', align: 'center' });
}

/** Các bước cần đánh số (bỏ bước "Thành phẩm" ra riêng). */
const numbered = (steps: Step[]) => steps.filter(s => s.kind !== 'result');

export interface DocInput { spec: PaperSpec; ops: readonly Op[]; name: string; hero?: HTMLCanvasElement | null; signal?: AbortSignal }
export interface DocOutput { steps: Step[]; pages: HTMLCanvasElement[]; pdf(): Blob; card(): HTMLCanvasElement }

export async function buildDocument({ spec, ops, name, hero, signal }: DocInput): Promise<DocOutput> {
  await document.fonts?.ready;
  signal?.throwIfAborted();
  const steps = buildSteps(spec, ops), list = numbered(steps), result = steps[steps.length - 1];
  const pages: HTMLCanvasElement[] = [];
  const yield_ = () => new Promise<void>(r => setTimeout(r, 0)).then(() => signal?.throwIfAborted());

  // ---- Mẫu in trước (để biết bước nào cần "lật xấp") ----
  const tmpl = canvas(PAGE_W, PAGE_H);
  txt(tmpl.g, 'MẪU IN TỈ LỆ THẬT', M, 100, 26, { weight: 700, color: ACCENT });
  txt(tmpl.g, 'Giấy in sẵn nét', M, 160, 48, { weight: 800 });
  para(tmpl.g, 'Cắt tờ giấy theo viền ngoài. Gấp theo nét đứt xanh sao cho mặt có nét in luôn nằm ở phía ngoài, rồi cắt theo nét đỏ. Phần tô xám là phần bỏ đi.', M, 210, PAGE_W - 2 * M, 24, 1.35, { color: SOFT });
  ruler(tmpl.g, M, 300);
  const notes: TemplateNotes = drawPrintedSheet(tmpl.g, steps, spec, { x: M, y: 340, w: PAGE_W - 2 * M, h: PAGE_H - 340 - 110 });
  if (notes.scale < 0.999) txt(tmpl.g, `Hình đã thu nhỏ còn ${Math.round(notes.scale * 100)}% cho vừa trang.`, M, PAGE_H - 96, 22, { color: ACCENT, weight: 700 });
  await yield_();

  // ---- Bìa ----
  {
    const { c, g } = canvas(PAGE_W, PAGE_H);
    g.fillStyle = '#fff4ec'; g.fillRect(0, 0, PAGE_W, 300);
    txt(g, 'HƯỚNG DẪN CẮT GIẤY', M, 110, 28, { weight: 700, color: ACCENT });
    txt(g, name, M, 190, 64, { weight: 800, max: PAGE_W - 2 * M });
    txt(g, new Date().toLocaleDateString('vi-VN'), M, 250, 28, { color: SOFT });
    const hb = { x: M, y: 340, w: PAGE_W - 2 * M, h: 820 };
    g.fillStyle = '#f6f3ee'; g.beginPath(); g.roundRect(hb.x, hb.y, hb.w, hb.h, 28); g.fill();
    if (hero) {
      const k = Math.min(hb.w / hero.width, hb.h / hero.height), w = hero.width * k, h = hero.height * k;
      g.save(); g.beginPath(); g.roundRect(hb.x, hb.y, hb.w, hb.h, 28); g.clip(); g.drawImage(hero, hb.x + (hb.w - w) / 2, hb.y + (hb.h - h) / 2, w, h); g.restore();
    } else drawStep(g, result, spec, hb, 3);
    const stats: [string, string][] = [[String(list.length), 'bước'], [String(list.filter(s => s.kind === 'fold').length), 'lần gấp'], [String(list.filter(s => s.kind === 'cut').reduce((a, s) => a + (s.kind === 'cut' ? s.marks.length : 0), 0)), 'nét cắt / lỗ']];
    stats.forEach(([v, l], i) => { const x = M + i * 370; g.fillStyle = '#f4f7fb'; g.beginPath(); g.roundRect(x, 1200, 340, 160, 24); g.fill(); txt(g, v, x + 28, 1285, 64, { weight: 800 }); txt(g, l, x + 28, 1335, 24, { color: SOFT }); });
    para(g, (steps[0] as Extract<Step, { kind: 'paper' }>).text, M, 1430, PAGE_W - 2 * M, 26);
    para(g, 'An toàn: dùng kéo đầu tròn. Khi cắt lỗ ở giữa tờ giấy, hãy nhờ người lớn giúp.', M, 1530, PAGE_W - 2 * M, 24, 1.35, { color: SOFT });
    footer(g, name, 1); pages.push(c);
  }
  await yield_();

  // ---- Các bước: 2 cột × 3 hàng ----
  const cw = (PAGE_W - 2 * M - 40) / 2, ch = 460, top = 170;
  for (let i = 0; i < list.length; i += 6) {
    const { c, g } = canvas(PAGE_W, PAGE_H);
    txt(g, i === 0 ? 'Các bước' : 'Các bước (tiếp)', M, 120, 48, { weight: 800 });
    list.slice(i, i + 6).forEach((st, k) => {
      const x = M + (k % 2) * (cw + 40), y = top + Math.floor(k / 2) * (ch + 30), idx = steps.indexOf(st);
      g.fillStyle = '#f7f9fc'; g.beginPath(); g.roundRect(x, y, cw, ch, 22); g.fill();
      drawStep(g, st, spec, { x: x + 10, y: y + 10, w: cw - 20, h: 310 }, 2.4);
      badge(g, i + k + 1, x + 34, y + 36);
      let text = st.text;
      if (st.kind === 'cut' && notes.partial.includes(idx)) text = `${text} (Dùng mẫu đặt lên xấp ở cuối tài liệu.)`;
      para(g, text, x + 22, y + 360, cw - 44, 24, 1.3, { maxLines: 4 });
    });
    footer(g, name, pages.length + 1); pages.push(c);
    await yield_();
  }

  // ---- Mẫu in: trang A + các trang B ----
  footer(tmpl.g, name, pages.length + 1); pages.push(tmpl.c);
  const cuts = steps.flatMap(s => (s.kind === 'cut' ? [{ s, n: list.indexOf(s) + 1 }] : []));
  for (let i = 0; i < cuts.length; i += 2) {
    const { c, g } = canvas(PAGE_W, PAGE_H);
    txt(g, 'MẪU IN TỈ LỆ THẬT', M, 100, 26, { weight: 700, color: ACCENT });
    txt(g, 'Mẫu đặt lên xấp giấy', M, 160, 48, { weight: 800 });
    para(g, 'Cắt mẫu theo viền đen, đặt lên xấp giấy đã gấp cho khớp mép, đồ theo nét đỏ rồi cắt.', M, 210, PAGE_W - 2 * M, 24, 1.35, { color: SOFT });
    ruler(g, M, 300);
    const pair = cuts.slice(i, i + 2), h = (PAGE_H - 360 - 110) / pair.length;
    pair.forEach((x, k) => {
      const y = 340 + k * h;
      txt(g, `Bước ${x.n}`, M, y + 30, 28, { weight: 800, color: ACCENT });
      const scale = drawOverlay(g, x.s, spec, { x: M, y: y + 50, w: PAGE_W - 2 * M, h: h - 70 });
      if (scale < 0.999) txt(g, `(thu nhỏ ${Math.round(scale * 100)}%)`, M + 140, y + 30, 22, { color: SOFT });
    });
    footer(g, name, pages.length + 1); pages.push(c);
    await yield_();
  }

  const pdf = () => {
    const out: PdfPage[] = pages.map(p => {
      const data = atob(p.toDataURL('image/jpeg', 0.9).split(',')[1]), bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) bytes[i] = data.charCodeAt(i);
      return { jpeg: bytes, width: p.width, height: p.height };
    });
    return new Blob([makePdf(out) as BlobPart], { type: 'application/pdf' });
  };
  return { steps, pages, pdf, card: () => shareCard(steps, spec, name, hero ?? null) };
}

/** Thẻ PNG dọc rộng 1080 px để gửi qua Zalo/Messenger (plan mục 7.4). */
export function shareCard(steps: Step[], spec: PaperSpec, name: string, hero: HTMLCanvasElement | null): HTMLCanvasElement {
  const list = numbered(steps), shown = list.slice(0, 12), W = 1080, cell = 500, gap = 20, cols = 2;
  const rows = Math.ceil(shown.length / cols), heroH = 700, H = 170 + heroH + 40 + rows * (cell + gap) + (list.length > shown.length ? 70 : 0) + 110;
  const { c, g } = canvas(W, H);
  g.fillStyle = '#fff4ec'; g.fillRect(0, 0, W, 150);
  txt(g, 'CÁCH CẮT', 50, 62, 26, { weight: 700, color: ACCENT });
  txt(g, name, 50, 125, 54, { weight: 800, max: W - 100 });
  const hb = { x: 40, y: 170, w: W - 80, h: heroH };
  g.fillStyle = '#f6f3ee'; g.beginPath(); g.roundRect(hb.x, hb.y, hb.w, hb.h, 28); g.fill();
  if (hero) { const k = Math.max(hb.w / hero.width, hb.h / hero.height); g.save(); g.beginPath(); g.roundRect(hb.x, hb.y, hb.w, hb.h, 28); g.clip(); g.drawImage(hero, hb.x + (hb.w - hero.width * k) / 2, hb.y + (hb.h - hero.height * k) / 2, hero.width * k, hero.height * k); g.restore(); }
  else drawStep(g, steps[steps.length - 1], spec, hb, 3);
  const cw = (W - 80 - gap) / cols;
  shown.forEach((st, i) => {
    const x = 40 + (i % cols) * (cw + gap), y = 170 + heroH + 40 + Math.floor(i / cols) * (cell + gap);
    g.fillStyle = '#f7f9fc'; g.beginPath(); g.roundRect(x, y, cw, cell, 22); g.fill();
    drawStep(g, st, spec, { x: x + 8, y: y + 8, w: cw - 16, h: 320 }, 2.2);
    badge(g, i + 1, x + 32, y + 34, 24);
    para(g, st.text, x + 20, y + 365, cw - 40, 23, 1.3, { maxLines: 5 });
  });
  let y = 170 + heroH + 40 + rows * (cell + gap);
  if (list.length > shown.length) { txt(g, `… và ${list.length - shown.length} bước nữa trong file PDF.`, 50, y + 40, 26, { color: SOFT }); y += 70; }
  txt(g, 'Xưởng Cắt Giấy · Genius Kids', W / 2, H - 45, 24, { color: SOFT, align: 'center' });
  return c;
}
