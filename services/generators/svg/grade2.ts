// ============================================================================
//  Hình cho Lớp 2–3: đặt tính dọc, đường gấp khúc, điểm–đoạn–đường, tứ giác,
//  lịch tháng, cân đĩa, biểu đồ tranh, kiểm đếm, túi bi, khối trăm–chục–đơn vị.
// ============================================================================
import { PALETTE, svgWrap, label, escapeXml, fillOf, strokeOf, STROKE_W, type ColorKey } from './style';
import { fmt } from '../../study/value';

const mono = (x: number, y: number, t: string, size = 30, color: string = PALETTE.ink, anchor = 'end') =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="central" font-size="${size}" font-weight="800" fill="${color}" font-family="ui-monospace,Consolas,monospace">${escapeXml(t)}</text>`;

/** Đặt tính dọc (chưa có kết quả, hoặc `showResult`). Các chữ số thẳng cột. */
export function columnArithSVG(a: number, b: number, op: '+' | '-' | '×', showResult = false): string {
    const r = op === '+' ? a + b : op === '-' ? a - b : a * b;
    const digits = Math.max(String(a).length, String(b).length, String(r).length);
    const cw = 22, W = digits * cw + 70, right = W - 20;
    let body = mono(right, 30, String(a)) + mono(right, 70, String(b)) + mono(right - digits * cw - 14, 50, op === '-' ? '−' : op, 28, PALETTE.redStroke, 'middle');
    body += `<line x1="${right - digits * cw - 4}" y1="94" x2="${right + 4}" y2="94" stroke="${PALETTE.ink}" stroke-width="3"/>`;
    body += showResult ? mono(right, 120, String(r), 30, PALETTE.greenStroke) : `<rect x="${right - digits * cw}" y="104" width="${digits * cw}" height="32" rx="6" fill="#fff7d6" stroke="${PALETTE.yellowStroke}" stroke-width="2" stroke-dasharray="5 4"/>`;
    return svgWrap(W, 148, body, { shadow: false, maxW: 220 });
}

/** Đường gấp khúc ABCD… với độ dài từng đoạn (cm). */
export function polylineSVG(lengths: number[], unit = 'cm'): string {
    const names = 'ABCDEFG';
    const pts: [number, number][] = [[20, 120]];
    const scale = Math.min(26, 300 / lengths.reduce((s, x) => s + x, 0) * 1.6);
    lengths.forEach((l, i) => { const [x, y] = pts[i]; const up = i % 2 === 0 ? -1 : 1; const dx = l * scale * 0.8, dy = up * l * scale * 0.55; pts.push([x + dx, Math.max(20, Math.min(170, y + dy))]); });
    const W = Math.max(...pts.map(p => p[0])) + 30, H = 200;
    let body = `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${PALETTE.blueStroke}" stroke-width="${STROKE_W}" stroke-linejoin="round"/>`;
    pts.forEach(([x, y], i) => { body += `<circle cx="${x}" cy="${y}" r="4.5" fill="${PALETTE.ink}"/>` + label(x, y + (i % 2 === 0 ? 18 : -16), names[i], { size: 15 }); });
    lengths.forEach((l, i) => { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; body += label((x1 + x2) / 2 + 14, (y1 + y2) / 2, `${l}${unit}`, { size: 14, color: PALETTE.redStroke }); });
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 420) });
}

/** Điểm / đoạn thẳng / đường thẳng / đường cong / ba điểm (thẳng hàng hay không). */
export function linesSVG(kind: 'segment' | 'line' | 'curve' | 'collinear' | 'notCollinear', names = 'ABC'): string {
    const [n1, n2, n3] = names.split('');
    const W = 320, H = 150, c = PALETTE.blueStroke;
    const dot = (x: number, y: number, n: string) => `<circle cx="${x}" cy="${y}" r="5" fill="${PALETTE.ink}"/>` + label(x, y - 18, n, { size: 16 });
    let body = '';
    if (kind === 'segment') body = `<line x1="60" y1="90" x2="260" y2="90" stroke="${c}" stroke-width="${STROKE_W}"/>` + dot(60, 90, n1) + dot(260, 90, n2);
    else if (kind === 'line') body = `<line x1="10" y1="100" x2="310" y2="70" stroke="${c}" stroke-width="${STROKE_W}"/>` + dot(90, 92, n1) + dot(230, 78, n2);
    else if (kind === 'curve') body = `<path d="M20 110 C 90 10, 160 150, 300 50" fill="none" stroke="${c}" stroke-width="${STROKE_W}"/>`;
    else if (kind === 'collinear') body = `<line x1="40" y1="110" x2="280" y2="50" stroke="${PALETTE.grayStroke}" stroke-width="1.5" stroke-dasharray="5 5"/>` + dot(60, 105, n1) + dot(160, 80, n2) + dot(260, 55, n3);
    else body = dot(60, 105, n1) + dot(160, 50, n2) + dot(260, 105, n3);
    return svgWrap(W, H, body, { shadow: false, maxW: 340 });
}

/** Hàng hình đánh số, gồm cả tứ giác "méo" để nhận biết. */
export function polygonsRowSVG(items: ('quad' | 'square' | 'rect' | 'triangle' | 'pentagon' | 'circle')[]): string {
    const cell = 104, W = items.length * cell + 16, H = 140;
    const shape = (k: string, cx: number) => {
        const cy = 60;
        const pts: Record<string, string> = {
            quad: `${cx - 40},${cy + 30} ${cx - 22},${cy - 34} ${cx + 38},${cy - 22} ${cx + 30},${cy + 34}`,
            square: `${cx - 34},${cy - 34} ${cx + 34},${cy - 34} ${cx + 34},${cy + 34} ${cx - 34},${cy + 34}`,
            rect: `${cx - 44},${cy - 24} ${cx + 44},${cy - 24} ${cx + 44},${cy + 24} ${cx - 44},${cy + 24}`,
            triangle: `${cx},${cy - 38} ${cx + 42},${cy + 32} ${cx - 42},${cy + 32}`,
            pentagon: `${cx},${cy - 40} ${cx + 38},${cy - 12} ${cx + 24},${cy + 34} ${cx - 24},${cy + 34} ${cx - 38},${cy - 12}`,
        };
        if (k === 'circle') return `<circle cx="${cx}" cy="${cy}" r="38" fill="${fillOf('pink')}" stroke="${strokeOf('pink')}" stroke-width="${STROKE_W}"/>`;
        const col: ColorKey = ({ quad: 'blue', square: 'green', rect: 'orange', triangle: 'yellow', pentagon: 'purple' } as Record<string, ColorKey>)[k];
        return `<polygon points="${pts[k]}" fill="${fillOf(col)}" stroke="${strokeOf(col)}" stroke-width="${STROKE_W}" stroke-linejoin="round"/>`;
    };
    const body = items.map((k, i) => {
        const cx = 8 + i * cell + cell / 2;
        return shape(k, cx) + `<circle cx="${cx}" cy="122" r="14" fill="${PALETTE.ink}"/><text x="${cx}" y="123" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="800" fill="#fff">${i + 1}</text>`;
    }).join('');
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 460) });
}

/** Lịch một tháng: `startWeekday` (0=CN) là thứ của ngày 1; `mark` = ngày được khoanh. */
export function calendarMonthSVG(month: number, startWeekday: number, days: number, mark?: number): string {
    const head = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const col0 = (startWeekday + 6) % 7; // cột của ngày 1 (thứ Hai = 0)
    const cw = 44, ch = 34, W = 7 * cw + 20, rows = Math.ceil((col0 + days) / 7), H = 70 + rows * ch + 10;
    let body = `<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="12" fill="#fff" stroke="${PALETTE.grayStroke}" stroke-width="2"/>`
        + label(W / 2, 24, `THÁNG ${month}`, { size: 17, color: PALETTE.blueStroke });
    head.forEach((h, i) => { body += label(10 + i * cw + cw / 2, 54, h, { size: 13, color: i === 6 ? PALETTE.redStroke : PALETTE.muted }); });
    for (let d = 1; d <= days; d++) {
        const k = col0 + d - 1, r = Math.floor(k / 7), c = k % 7, x = 10 + c * cw + cw / 2, y = 70 + r * ch + ch / 2;
        if (d === mark) body += `<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="${PALETTE.redStroke}" stroke-width="2.5"/>`;
        body += `<text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="central" font-size="15" font-weight="700" fill="${c === 6 ? PALETTE.redStroke : PALETTE.ink}">${d}</text>`;
    }
    return svgWrap(W, H, body, { shadow: false, maxW: 360 });
}

/** Cân đĩa: hai vật (emoji) kèm nhãn khối lượng hoặc không; nghiêng về bên nặng. */
export function balanceSVG(left: { e: string; kg?: number; w: number }, right: { e: string; kg?: number; w: number }): string {
    const tilt = left.w === right.w ? 0 : left.w > right.w ? 8 : -8;
    const W = 320, H = 210;
    const pan = (x: number, y: number, it: { e: string; kg?: number }) => `<path d="M${x - 55} ${y} Q${x} ${y + 26} ${x + 55} ${y}" fill="${fillOf('gray')}" stroke="${strokeOf('gray')}" stroke-width="2.5"/>`
        + `<text x="${x}" y="${y - 22}" text-anchor="middle" dominant-baseline="central" font-size="40">${escapeXml(it.e)}</text>`
        + (it.kg !== undefined ? label(x, y - 52, `${it.kg} kg`, { size: 15, color: PALETTE.redStroke }) : '');
    const ly = 100 + tilt * 2, ry = 100 - tilt * 2;
    const body = `<rect x="150" y="104" width="20" height="80" fill="#a8a29e"/><rect x="110" y="184" width="100" height="14" rx="5" fill="#78716c"/>`
        + `<line x1="80" y1="${ly - 20}" x2="240" y2="${ry - 20}" stroke="#57534e" stroke-width="6" stroke-linecap="round"/><circle cx="160" cy="${(ly + ry) / 2 - 20}" r="7" fill="#57534e"/>`
        + `<line x1="80" y1="${ly - 20}" x2="80" y2="${ly + 10}" stroke="#57534e" stroke-width="2"/><line x1="240" y1="${ry - 20}" x2="240" y2="${ry + 10}" stroke="#57534e" stroke-width="2"/>`
        + pan(80, ly + 10, left) + pan(240, ry + 10, right);
    return svgWrap(W, H, body, { shadow: false, maxW: 360 });
}

/** Biểu đồ tranh: mỗi hàng một nhãn + số biểu tượng (mỗi biểu tượng = `per` đơn vị). */
export function pictographSVG(rows: { label: string; n: number }[], emoji: string, per = 1, title = ''): string {
    const cell = 34, lw = 92, maxN = Math.max(...rows.map(r => Math.ceil(r.n / per))), W = lw + maxN * cell + 24, top = title ? 34 : 10;
    const H = top + rows.length * 44 + (per > 1 ? 34 : 12);
    let body = title ? label(W / 2, 18, title, { size: 15 }) : '';
    rows.forEach((r, i) => {
        const y = top + i * 44 + 22;
        body += `<rect x="6" y="${y - 20}" width="${W - 12}" height="40" rx="8" fill="${i % 2 ? '#fff' : '#f6f3e8'}"/>` + label(10, y, r.label, { size: 14, anchor: 'start' });
        for (let k = 0; k < Math.ceil(r.n / per); k++) body += `<text x="${lw + k * cell + cell / 2}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="26">${escapeXml(emoji)}</text>`;
    });
    if (per > 1) body += label(W / 2, H - 14, `Mỗi ${emoji} chỉ ${per} đơn vị`, { size: 13, color: PALETTE.muted });
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 440) });
}

/** Bảng kiểm đếm bằng vạch (cứ 5 vạch gạch chéo một bó). */
export function tallySVG(rows: { label: string; n: number }[]): string {
    const lw = 100, W = 340, H = rows.length * 44 + 16;
    let body = '';
    rows.forEach((r, i) => {
        const y = 8 + i * 44 + 22;
        body += `<rect x="6" y="${y - 20}" width="${W - 12}" height="40" rx="8" fill="${i % 2 ? '#fff' : '#f6f3e8'}"/>` + label(12, y, r.label, { size: 14, anchor: 'start' });
        for (let k = 0; k < r.n; k++) {
            const g = Math.floor(k / 5), j = k % 5, x0 = lw + g * 44;
            if (j < 4) body += `<line x1="${x0 + j * 8}" y1="${y - 12}" x2="${x0 + j * 8}" y2="${y + 12}" stroke="${PALETTE.ink}" stroke-width="2.5" stroke-linecap="round"/>`;
            else body += `<line x1="${x0 - 5}" y1="${y + 10}" x2="${x0 + 30}" y2="${y - 10}" stroke="${PALETTE.redStroke}" stroke-width="2.5" stroke-linecap="round"/>`;
        }
    });
    return svgWrap(W, H, body, { shadow: false, maxW: 360 });
}

/** Hộp / túi chứa bi các màu (cho câu chắc chắn – có thể – không thể). */
export function bagSVG(balls: { color: ColorKey; n: number }[]): string {
    const all = balls.flatMap(b => Array.from({ length: b.n }, () => b.color));
    const perRow = 5, r = 15, W = 260, rows = Math.ceil(all.length / perRow), H = 60 + rows * 36 + 20;
    let body = `<path d="M30 40 L230 40 L215 ${H - 10} L45 ${H - 10} Z" fill="#fdf6e3" stroke="#a16207" stroke-width="3" stroke-linejoin="round"/><rect x="24" y="30" width="212" height="14" rx="6" fill="#d6b98c" stroke="#a16207" stroke-width="2"/>`;
    all.forEach((c, i) => { const x = 70 + (i % perRow) * 30 + (Math.floor(i / perRow) % 2) * 8, y = 72 + Math.floor(i / perRow) * 34; body += `<circle cx="${x}" cy="${y}" r="${r}" fill="${strokeOf(c)}" stroke="${PALETTE.ink}" stroke-width="1.5"/><circle cx="${x - 5}" cy="${y - 5}" r="4" fill="#fff" opacity=".6"/>`; });
    return svgWrap(W, H, body, { shadow: false, maxW: 280 });
}

/** Khối trăm – chục – đơn vị gọn nhẹ (tấm trăm = 1 hình vuông kẻ lưới bằng pattern). */
export function placeValueSVG(value: number): string {
    const h = Math.floor(value / 100), t = Math.floor((value % 100) / 10), u = value % 10;
    const s = 70, rod = 7, W0 = 12;
    let x = W0, y = 12, body = `<defs><pattern id="pv-grid" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="${PALETTE.blueFill}" stroke="${PALETTE.blueStroke}" stroke-width=".6"/></pattern><pattern id="pv-rod" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="${PALETTE.greenFill}" stroke="${PALETTE.greenStroke}" stroke-width=".6"/></pattern></defs>`;
    const rowLimit = 5;
    for (let i = 0; i < h; i++) { const cx = W0 + (i % rowLimit) * (s + 8), cy = 12 + Math.floor(i / rowLimit) * (s + 8); body += `<rect x="${cx}" y="${cy}" width="${s}" height="${s}" fill="url(#pv-grid)" stroke="${PALETTE.blueStroke}" stroke-width="2"/>`; }
    const hRows = Math.max(1, Math.ceil(h / rowLimit));
    x = W0 + Math.min(h, rowLimit) * (s + 8) + (h ? 10 : 0);
    for (let i = 0; i < t; i++) body += `<rect x="${x + i * (rod + 5)}" y="${y}" width="${rod}" height="${s}" fill="url(#pv-rod)" stroke="${PALETTE.greenStroke}" stroke-width="1.5"/>`;
    x += t * (rod + 5) + (t ? 12 : 0);
    for (let i = 0; i < u; i++) body += `<rect x="${x + (i % 3) * 11}" y="${y + Math.floor(i / 3) * 11}" width="8" height="8" fill="${PALETTE.orangeFill}" stroke="${PALETTE.orangeStroke}" stroke-width="1.2"/>`;
    x += (u ? 3 * 11 : 0) + 12;
    const W = Math.max(140, x), H = 12 + hRows * (s + 8) + 6;
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 460) });
}

/** Tờ tiền / đồng xu Việt Nam theo danh sách mệnh giá (nhãn theo SGK: "1000 đồng", "10 000 đồng"). */
export function notesSVG(notes: number[]): string {
    const color: Record<number, ColorKey> = { 100: 'gray', 200: 'orange', 500: 'yellow', 1000: 'green', 2000: 'purple', 5000: 'blue', 10000: 'orange', 20000: 'blue', 50000: 'pink', 100000: 'green' };
    const noteW = 120, noteH = 58, perRow = 3, gap = 12, rows = Math.ceil(notes.length / perRow) || 1;
    const W = Math.min(notes.length, perRow) * (noteW + gap) + gap, H = rows * (noteH + gap) + gap;
    const body = notes.map((d, i) => {
        const x = gap + (i % perRow) * (noteW + gap), y = gap + Math.floor(i / perRow) * (noteH + gap), c = color[d] || 'green';
        return `<rect x="${x}" y="${y}" width="${noteW}" height="${noteH}" rx="8" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="2"/>`
            + `<rect x="${x + 6}" y="${y + 6}" width="${noteW - 12}" height="${noteH - 12}" rx="5" fill="none" stroke="${strokeOf(c)}" stroke-width="1" opacity=".6"/>`
            + label(x + noteW / 2, y + noteH / 2, `${fmt(d)} đồng`, { size: 15 });
    }).join('');
    return svgWrap(W, H, body, { maxW: Math.min(W, 420) });
}
