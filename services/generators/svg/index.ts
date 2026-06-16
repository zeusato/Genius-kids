// ============================================================================
//  Bộ SVG dùng chung — các hàm vẽ TỈ LỆ ĐÚNG, có nhãn, an toàn viewBox.
//  Mọi generator nên dùng các hàm ở đây thay vì tự ghép chuỗi SVG.
//  Xem style.ts cho palette/typography/svgWrap/fitScale.
// ============================================================================

import {
    PALETTE, STROKE_W, svgWrap, label, fitScale, escapeXml,
    type ColorKey, fillOf, strokeOf,
} from './style';

export { PALETTE } from './style';
export type { ColorKey } from './style';

const PAD = 34; // lề chứa nhãn + bóng
const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
    const a = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const sector = (cx: number, cy: number, r: number, start: number, end: number): string => {
    const [x1, y1] = polar(cx, cy, r, start);
    const [x2, y2] = polar(cx, cy, r, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
};

// ---------------------------------------------------------------------------
//  HÌNH HỌC PHẲNG (tỉ lệ theo số đo thật)
// ---------------------------------------------------------------------------

export interface ShapeOpts { color?: ColorKey; unit?: string; }

/** Hình chữ nhật dài×rộng (tỉ lệ đúng), nhãn cạnh. */
export function rectSVG(w: number, h: number, opts: ShapeOpts = {}): string {
    const { color = 'blue', unit = 'cm' } = opts;
    const s = fitScale(Math.max(w, h), 210);
    const pw = w * s, ph = h * s;
    const vbW = pw + PAD * 2, vbH = ph + PAD * 2;
    return svgWrap(vbW, vbH,
        `<rect x="${PAD}" y="${PAD}" width="${pw}" height="${ph}" rx="6" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}"/>`
        + label(PAD + pw / 2, PAD + ph + 16, `${w}${unit}`)
        + label(PAD - 16, PAD + ph / 2, `${h}${unit}`, { anchor: 'middle' }));
}

/** Hình vuông cạnh `side`. */
export function squareSVG(side: number, opts: ShapeOpts = {}): string {
    const { color = 'green', unit = 'cm' } = opts;
    const s = fitScale(side, 190);
    const a = side * s;
    return svgWrap(a + PAD * 2, a + PAD * 2,
        `<rect x="${PAD}" y="${PAD}" width="${a}" height="${a}" rx="6" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}"/>`
        + label(PAD + a / 2, PAD + a + 16, `${side}${unit}`));
}

/** Hình bình hành đáy×cao (vẽ xiên, vạch chiều cao). */
export function parallelogramSVG(base: number, height: number, opts: ShapeOpts = {}): string {
    const { color = 'blue', unit = 'cm' } = opts;
    const s = fitScale(Math.max(base, height), 180);
    const b = base * s, hgt = height * s, skew = Math.min(50, b * 0.35);
    const vbW = b + skew + PAD * 2, vbH = hgt + PAD * 2;
    const x0 = PAD, yB = PAD + hgt;
    const pts = `${x0 + skew},${PAD} ${x0 + skew + b},${PAD} ${x0 + b},${yB} ${x0},${yB}`;
    return svgWrap(vbW, vbH,
        `<polygon points="${pts}" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}"/>`
        + `<line x1="${x0 + skew}" y1="${PAD}" x2="${x0 + skew}" y2="${yB}" stroke="${PALETTE.accent}" stroke-width="2" stroke-dasharray="5,4"/>`
        + label(x0 + skew + b / 2, yB + 16, `đáy ${base}${unit}`)
        + label(x0 + skew - 14, PAD + hgt / 2, `h ${height}${unit}`, { anchor: 'end' }));
}

/** Hình thoi theo hai đường chéo d1 (ngang) × d2 (dọc). */
export function rhombusSVG(d1: number, d2: number, opts: ShapeOpts = {}): string {
    const { color = 'purple', unit = 'cm' } = opts;
    const s = fitScale(Math.max(d1, d2), 190);
    const w = d1 * s, h = d2 * s, cx = PAD + w / 2, cy = PAD + h / 2;
    const pts = `${cx},${PAD} ${PAD + w},${cy} ${cx},${PAD + h} ${PAD},${cy}`;
    return svgWrap(w + PAD * 2, h + PAD * 2,
        `<polygon points="${pts}" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}"/>`
        + `<line x1="${PAD}" y1="${cy}" x2="${PAD + w}" y2="${cy}" stroke="${PALETTE.accent}" stroke-width="2" stroke-dasharray="5,4"/>`
        + `<line x1="${cx}" y1="${PAD}" x2="${cx}" y2="${PAD + h}" stroke="${PALETTE.accent}" stroke-width="2" stroke-dasharray="5,4"/>`
        + label(cx, cy - 6, `${d1}${unit}`, { size: 13 })
        + label(cx + 18, cy + h / 4, `${d2}${unit}`, { size: 13, anchor: 'start' }));
}

/** Hình thang: đáy bé, đáy lớn, chiều cao (tỉ lệ đúng, căn giữa). */
export function trapezoidSVG(top: number, bottom: number, height: number, opts: ShapeOpts = {}): string {
    const { color = 'orange', unit = 'cm' } = opts;
    const s = fitScale(Math.max(top, bottom, height), 180);
    const tw = top * s, bw = bottom * s, h = height * s, off = (bw - tw) / 2;
    const vbW = bw + PAD * 2, vbH = h + PAD * 2;
    const pts = `${PAD + off},${PAD} ${PAD + off + tw},${PAD} ${PAD + bw},${PAD + h} ${PAD},${PAD + h}`;
    return svgWrap(vbW, vbH,
        `<polygon points="${pts}" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}"/>`
        + `<line x1="${PAD + off}" y1="${PAD}" x2="${PAD + off}" y2="${PAD + h}" stroke="${PALETTE.accent}" stroke-width="2" stroke-dasharray="5,4"/>`
        + label(PAD + off + tw / 2, PAD - 14, `${top}${unit}`)
        + label(PAD + bw / 2, PAD + h + 16, `${bottom}${unit}`)
        + label(PAD + off - 14, PAD + h / 2, `h ${height}${unit}`, { anchor: 'end' }));
}

/**
 * Tam giác: theo đáy×chiều cao (vẽ vạch cao) HOẶC theo 3 cạnh (chu vi).
 * Truyền {base,height} hoặc {sides:[a,b,c]}.
 */
export function triangleSVG(spec: { base?: number; height?: number; sides?: [number, number, number] }, opts: ShapeOpts = {}): string {
    const { color = 'yellow', unit = 'cm' } = opts;
    if (spec.sides) {
        const [a, b, c] = spec.sides;
        // Vẽ tam giác minh hoạ (không cần đúng tuyệt đối hình dạng) nhưng nhãn đúng cạnh.
        const W = 260, H = 180;
        const A: [number, number] = [PAD, PAD + 110], B: [number, number] = [PAD + 200, PAD + 110], C: [number, number] = [PAD + 120, PAD];
        return svgWrap(W + PAD * 2, H + PAD,
            `<polygon points="${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}"/>`
            + label((A[0] + B[0]) / 2, A[1] + 16, `${c}${unit}`)
            + label((A[0] + C[0]) / 2 - 12, (A[1] + C[1]) / 2, `${a}${unit}`, { anchor: 'end' })
            + label((B[0] + C[0]) / 2 + 12, (B[1] + C[1]) / 2, `${b}${unit}`, { anchor: 'start' }));
    }
    const base = spec.base || 8, height = spec.height || 5;
    const s = fitScale(Math.max(base, height), 180);
    const bw = base * s, h = height * s, apexX = PAD + bw * 0.42;
    const vbW = bw + PAD * 2, vbH = h + PAD * 2;
    return svgWrap(vbW, vbH,
        `<polygon points="${PAD},${PAD + h} ${PAD + bw},${PAD + h} ${apexX},${PAD}" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}"/>`
        + `<line x1="${apexX}" y1="${PAD}" x2="${apexX}" y2="${PAD + h}" stroke="${PALETTE.accent}" stroke-width="2" stroke-dasharray="5,4"/>`
        + label(PAD + bw / 2, PAD + h + 16, `đáy ${base}${unit}`)
        + label(apexX + 10, PAD + h / 2, `h ${height}${unit}`, { anchor: 'start' }));
}

/** Hình tròn bán kính r, vẽ bán kính có nhãn. */
export function circleSVG(radius: number, opts: ShapeOpts & { showRadius?: boolean } = {}): string {
    const { color = 'yellow', unit = 'cm', showRadius = true } = opts;
    const s = fitScale(radius, 95);
    const r = radius * s, cx = PAD + r, cy = PAD + r;
    return svgWrap(r * 2 + PAD * 2, r * 2 + PAD * 2,
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}"/>`
        + (showRadius
            ? `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${PALETTE.accent}" stroke-width="2"/>`
            + `<circle cx="${cx}" cy="${cy}" r="3" fill="${PALETTE.ink}"/>`
            + label(cx + r / 2, cy - 12, `r ${radius}${unit}`, { color: PALETTE.accent })
            : ''));
}

/** Hình hộp chữ nhật (chiếu xiên, TỈ LỆ theo dài/rộng/cao), nhãn 3 cạnh. */
export function box3dSVG(length: number, width: number, height: number, opts: ShapeOpts = {}): string {
    const { color = 'blue', unit = 'cm' } = opts;
    const s = fitScale(Math.max(length, width, height), 130, 8, 26);
    const L = length * s, H = height * s, D = width * s * 0.6; // chiều sâu chiếu xiên
    const dx = D * 0.85, dy = -D * 0.5;
    const x0 = PAD, y0 = PAD - dy; // chừa chỗ cho mặt trên
    const F = `${x0},${y0} ${x0 + L},${y0} ${x0 + L},${y0 + H} ${x0},${y0 + H}`;        // mặt trước
    const top = `${x0},${y0} ${x0 + dx},${y0 + dy} ${x0 + L + dx},${y0 + dy} ${x0 + L},${y0}`;
    const side = `${x0 + L},${y0} ${x0 + L + dx},${y0 + dy} ${x0 + L + dx},${y0 + dy + H} ${x0 + L},${y0 + H}`;
    const vbW = L + dx + PAD * 2, vbH = H - dy + PAD * 2;
    return svgWrap(vbW, vbH,
        `<polygon points="${top}" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="2"/>`
        + `<polygon points="${side}" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="2" opacity="0.75"/>`
        + `<polygon points="${F}" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}"/>`
        + label(x0 + L / 2, y0 + H + 16, `dài ${length}${unit}`, { size: 13 })
        + label(x0 + L + dx / 2 + 6, y0 + dy / 2 + H + 8, `rộng ${width}${unit}`, { size: 13, anchor: 'start' })
        + label(x0 - 12, y0 + H / 2, `cao ${height}${unit}`, { size: 13, anchor: 'end' }));
}

/** Hình lập phương cạnh `edge`. */
export function cubeSVG(edge: number, opts: ShapeOpts = {}): string {
    return box3dSVG(edge, edge, edge, { color: 'purple', ...opts });
}

/** Góc `deg` độ (0–180): hai tia + cung + nhãn số đo. */
export function angleSVG(deg: number, opts: { color?: ColorKey } = {}): string {
    const { color = 'blue' } = opts;
    const cx = PAD + 20, cy = PAD + 150, r = 150, arcR = 46;
    const [x2, y2] = polar(cx, cy, r, 90 + deg); // tia thứ 2 quay từ phương ngang
    const [ax, ay] = [cx + r, cy];
    const [arc1x, arc1y] = [cx + arcR, cy];
    const [arc2x, arc2y] = polar(cx, cy, arcR, 90 + deg);
    const large = deg > 180 ? 1 : 0;
    return svgWrap(r + PAD * 2, 180 + PAD,
        `<line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}" stroke-linecap="round"/>`
        + `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}" stroke-linecap="round"/>`
        + `<path d="M ${arc1x} ${arc1y} A ${arcR} ${arcR} 0 ${large} 0 ${arc2x.toFixed(1)} ${arc2y.toFixed(1)}" fill="none" stroke="${PALETTE.accent}" stroke-width="2"/>`
        + `<circle cx="${cx}" cy="${cy}" r="4" fill="${PALETTE.ink}"/>`
        + label(cx + 64, cy - 26, `${deg}°`, { color: PALETTE.accent, size: 17 }));
}

// ---------------------------------------------------------------------------
//  ĐỒNG HỒ
// ---------------------------------------------------------------------------

/** Đồng hồ kim: giờ (kim ngắn, đậm) + phút (kim dài, đỏ) + số + vạch phút. */
export function clockSVG(hour: number, minute: number): string {
    const cx = 110, cy = 110, R = 96;
    const toRad = (deg: number) => (deg - 90) * Math.PI / 180;
    const hAngle = (hour % 12 + minute / 60) * 30;
    const mAngle = minute * 6;
    const hx = cx + 50 * Math.cos(toRad(hAngle)), hy = cy + 50 * Math.sin(toRad(hAngle));
    const mx = cx + 74 * Math.cos(toRad(mAngle)), my = cy + 74 * Math.sin(toRad(mAngle));
    let ticks = '';
    for (let i = 0; i < 60; i++) {
        const a = toRad(i * 6), big = i % 5 === 0;
        const r1 = R - (big ? 12 : 6);
        ticks += `<line x1="${(cx + r1 * Math.cos(a)).toFixed(1)}" y1="${(cy + r1 * Math.sin(a)).toFixed(1)}" x2="${(cx + R * Math.cos(a) * 0.97).toFixed(1)}" y2="${(cy + R * Math.sin(a) * 0.97).toFixed(1)}" stroke="${big ? PALETTE.ink : PALETTE.grayStroke}" stroke-width="${big ? 2.5 : 1}"/>`;
    }
    let nums = '';
    for (let i = 1; i <= 12; i++) {
        const a = toRad(i * 30);
        nums += label(cx + (R - 24) * Math.cos(a), cy + (R - 24) * Math.sin(a), String(i), { size: 16 });
    }
    return svgWrap(220, 220,
        `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${PALETTE.white}" stroke="${PALETTE.blueStroke}" stroke-width="4"/>`
        + ticks + nums
        + `<line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="${PALETTE.ink}" stroke-width="6" stroke-linecap="round"/>`
        + `<line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="${PALETTE.accent}" stroke-width="4" stroke-linecap="round"/>`
        + `<circle cx="${cx}" cy="${cy}" r="5" fill="${PALETTE.ink}"/>`);
}

// ---------------------------------------------------------------------------
//  PHÂN SỐ
// ---------------------------------------------------------------------------

/** Phân số dạng thanh chia `denom` phần bằng nhau, tô `numer` phần. */
export function fractionBarSVG(numer: number, denom: number, opts: { color?: ColorKey } = {}): string {
    const { color = 'blue' } = opts;
    const W = 300, H = 84, x0 = 10, y0 = 12, barW = W - 20, barH = 60;
    const pw = barW / denom;
    let cells = '';
    for (let i = 0; i < denom; i++) {
        cells += `<rect x="${(x0 + i * pw).toFixed(1)}" y="${y0}" width="${(pw - 2).toFixed(1)}" height="${barH}" rx="3" fill="${i < numer ? fillOf(color) : PALETTE.grayFill}" stroke="${i < numer ? strokeOf(color) : PALETTE.grayStroke}" stroke-width="2"/>`;
    }
    return svgWrap(W, H, cells, { shadow: false, maxW: 300 });
}

/** Phân số dạng hình tròn (bánh) chia `denom`, tô `numer`. */
export function fractionPieSVG(numer: number, denom: number, opts: { color?: ColorKey } = {}): string {
    const { color = 'orange' } = opts;
    const cx = 90, cy = 90, r = 78;
    let parts = '';
    for (let i = 0; i < denom; i++) {
        parts += `<path d="${sector(cx, cy, r, (i * 360) / denom, ((i + 1) * 360) / denom)}" fill="${i < numer ? fillOf(color) : PALETTE.white}" stroke="${strokeOf(color)}" stroke-width="2"/>`;
    }
    return svgWrap(180, 180, parts, { maxW: 180 });
}

// ---------------------------------------------------------------------------
//  TRỤC SỐ & KHỐI TRĂM-CHỤC-ĐƠN VỊ
// ---------------------------------------------------------------------------

/** Trục số từ `from` đến `to`, bước `step`; `marks` để khoanh điểm cần chú ý. */
export function numberLineSVG(from: number, to: number, step: number, marks: number[] = []): string {
    const W = 360, x0 = 24, x1 = W - 24, y = 54, n = Math.round((to - from) / step);
    const dx = (x1 - x0) / n;
    let body = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${PALETTE.ink}" stroke-width="3"/>`;
    body += `<polygon points="${x1},${y} ${x1 - 9},${y - 5} ${x1 - 9},${y + 5}" fill="${PALETTE.ink}"/>`;
    for (let i = 0; i <= n; i++) {
        const x = x0 + i * dx, v = from + i * step;
        body += `<line x1="${x.toFixed(1)}" y1="${y - 6}" x2="${x.toFixed(1)}" y2="${y + 6}" stroke="${PALETTE.ink}" stroke-width="2"/>`;
        body += label(x, y + 20, String(v), { size: 13 });
        if (marks.includes(v)) body += `<circle cx="${x.toFixed(1)}" cy="${y}" r="7" fill="none" stroke="${PALETTE.accent}" stroke-width="3"/>`;
    }
    return svgWrap(W, 84, body, { shadow: false, maxW: 360 });
}

/** Khối trăm (10×10) – chục (1×10) – đơn vị cho số ≤ 999 (giá trị vị trí). */
export function baseTenSVG(value: number): string {
    const hundreds = Math.floor(value / 100), tens = Math.floor((value % 100) / 10), units = value % 10;
    const u = 9, gap = 14; let x = 12; const yTop = 12; let body = '';
    const flat = (ox: number) => {
        let g = '';
        for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++)
            g += `<rect x="${ox + c * u}" y="${yTop + r * u}" width="${u - 1}" height="${u - 1}" fill="${PALETTE.blueFill}" stroke="${PALETTE.blueStroke}" stroke-width="0.8"/>`;
        return g;
    };
    for (let i = 0; i < hundreds; i++) { body += flat(x); x += u * 10 + gap; }
    for (let i = 0; i < tens; i++) {
        for (let r = 0; r < 10; r++) body += `<rect x="${x}" y="${yTop + r * u}" width="${u - 1}" height="${u - 1}" fill="${PALETTE.greenFill}" stroke="${PALETTE.greenStroke}" stroke-width="0.8"/>`;
        x += u + 6;
    }
    x += gap;
    for (let i = 0; i < units; i++) { body += `<rect x="${x}" y="${yTop}" width="${u - 1}" height="${u - 1}" rx="1" fill="${PALETTE.orangeFill}" stroke="${PALETTE.orangeStroke}" stroke-width="1"/>`; x += u + 3; }
    const W = Math.max(120, x + 12);
    return svgWrap(W, yTop + u * 10 + 12, body, { shadow: false, maxW: Math.min(W, 360) });
}

// ---------------------------------------------------------------------------
//  BIỂU ĐỒ & THỐNG KÊ
// ---------------------------------------------------------------------------

export interface ChartItem { label: string; value: number; color?: ColorKey; }
const CHART_COLORS: ColorKey[] = ['blue', 'green', 'orange', 'purple', 'pink', 'yellow'];

/** Biểu đồ cột từ danh sách {label,value}. */
export function barChartSVG(items: ChartItem[]): string {
    const W = Math.max(260, items.length * 70 + 40), H = 230, base = 180, top = 24;
    const maxV = Math.max(1, ...items.map(i => i.value));
    const bw = 40, gap = (W - 40) / items.length;
    let body = `<line x1="30" y1="${base}" x2="${W - 10}" y2="${base}" stroke="${PALETTE.ink}" stroke-width="2"/>`;
    items.forEach((it, i) => {
        const c = it.color || CHART_COLORS[i % CHART_COLORS.length];
        const h = ((it.value) / maxV) * (base - top);
        const x = 40 + i * gap;
        body += `<rect x="${x}" y="${base - h}" width="${bw}" height="${h}" rx="4" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="2"/>`;
        body += label(x + bw / 2, base - h - 12, String(it.value), { size: 14 });
        body += label(x + bw / 2, base + 16, it.label, { size: 13 });
    });
    return svgWrap(W, H, body, { maxW: Math.min(W, 360) });
}

/** Biểu đồ hình quạt (đọc tỉ lệ) + chú thích. */
export function pieChartSVG(items: ChartItem[]): string {
    const cx = 95, cy = 95, r = 80, total = Math.max(1, items.reduce((s, i) => s + i.value, 0));
    let acc = 0, body = '', legend = '';
    items.forEach((it, i) => {
        const c = it.color || CHART_COLORS[i % CHART_COLORS.length];
        const start = (acc / total) * 360; acc += it.value; const end = (acc / total) * 360;
        body += `<path d="${sector(cx, cy, r, start, end)}" fill="${fillOf(c)}" stroke="${PALETTE.white}" stroke-width="2"/>`;
        const ly = 24 + i * 26;
        legend += `<rect x="200" y="${ly - 11}" width="16" height="16" rx="3" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="2"/>`
            + label(224, ly - 2, `${it.label}: ${it.value}`, { size: 13, anchor: 'start' });
    });
    return svgWrap(Math.max(360, 230), 200, body + legend, { maxW: 360 });
}

// ---------------------------------------------------------------------------
//  TIỀN VIỆT NAM, ĐẾM VẬT, HÌNH CƠ BẢN
// ---------------------------------------------------------------------------

const MONEY_DENOMS = [50000, 20000, 10000, 5000, 2000, 1000, 500, 200];
const MONEY_COLOR: Record<number, ColorKey> = { 50000: 'pink', 20000: 'blue', 10000: 'orange', 5000: 'blue', 2000: 'purple', 1000: 'green', 500: 'yellow', 200: 'gray' };

/** Biểu diễn `amount` đồng bằng các tờ/đồng tiền VN (tham lam theo mệnh giá). */
export function moneySVG(amount: number): string {
    const notes: number[] = [];
    let rest = amount;
    for (const d of MONEY_DENOMS) { while (rest >= d && notes.length < 12) { notes.push(d); rest -= d; } }
    const noteW = 110, noteH = 56, perRow = 3, gap = 12;
    const rows = Math.ceil(notes.length / perRow) || 1;
    const W = perRow * (noteW + gap) + gap, H = rows * (noteH + gap) + gap;
    let body = '';
    notes.forEach((d, i) => {
        const r = Math.floor(i / perRow), c = i % perRow;
        const x = gap + c * (noteW + gap), y = gap + r * (noteH + gap);
        const col = MONEY_COLOR[d] || 'green';
        body += `<rect x="${x}" y="${y}" width="${noteW}" height="${noteH}" rx="8" fill="${fillOf(col)}" stroke="${strokeOf(col)}" stroke-width="2"/>`
            + label(x + noteW / 2, y + noteH / 2, `${d.toLocaleString('vi-VN')}đ`, { size: 15 });
    });
    return svgWrap(W, H, body, { maxW: Math.min(W, 360) });
}

/** Lưới emoji để đếm (mầm non / lớp 1). */
export function countingSVG(emoji: string, n: number, opts: { perRow?: number } = {}): string {
    const perRow = opts.perRow || Math.min(5, Math.max(3, Math.ceil(Math.sqrt(n))));
    const cell = 52, rows = Math.ceil(n / perRow);
    const W = perRow * cell + 16, H = rows * cell + 16;
    let body = '';
    for (let i = 0; i < n; i++) {
        const r = Math.floor(i / perRow), c = i % perRow;
        body += `<text x="${8 + c * cell + cell / 2}" y="${8 + r * cell + cell / 2}" text-anchor="middle" dominant-baseline="central" font-size="36">${escapeXml(emoji)}</text>`;
    }
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 340) });
}

const BASIC_SHAPES: Record<string, (c: ColorKey) => string> = {
    square: c => `<rect x="20" y="20" width="120" height="120" rx="8" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="${STROKE_W}"/>`,
    rectangle: c => `<rect x="14" y="40" width="150" height="84" rx="8" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="${STROKE_W}"/>`,
    circle: c => `<circle cx="90" cy="80" r="62" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="${STROKE_W}"/>`,
    triangle: c => `<polygon points="90,18 158,140 22,140" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="${STROKE_W}"/>`,
};
const SHAPE_COLOR: Record<string, ColorKey> = { square: 'green', rectangle: 'blue', circle: 'red', triangle: 'yellow' };

/** Một hình cơ bản (square/circle/triangle/rectangle), tô đẹp. */
export function shapeSVG(kind: 'square' | 'rectangle' | 'circle' | 'triangle'): string {
    const draw = BASIC_SHAPES[kind];
    return svgWrap(180, 160, draw(SHAPE_COLOR[kind]));
}

/** Lưới nhiều hình cùng loại để đếm (lớp 1). */
export function shapesGridSVG(kind: 'square' | 'rectangle' | 'circle' | 'triangle', count: number): string {
    const c = SHAPE_COLOR[kind], perRow = Math.min(4, count), cell = 70;
    const rows = Math.ceil(count / perRow), W = perRow * cell + 16, H = rows * cell + 16;
    let body = '';
    for (let i = 0; i < count; i++) {
        const r = Math.floor(i / perRow), cx = 8 + (i % perRow) * cell + 10, cy = 8 + r * cell + 10;
        if (kind === 'circle') body += `<circle cx="${cx + 25}" cy="${cy + 25}" r="24" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="2"/>`;
        else if (kind === 'triangle') body += `<polygon points="${cx + 25},${cy} ${cx + 50},${cy + 50} ${cx},${cy + 50}" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="2"/>`;
        else if (kind === 'rectangle') body += `<rect x="${cx - 3}" y="${cy + 8}" width="56" height="34" rx="4" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="2"/>`;
        else body += `<rect x="${cx}" y="${cy}" width="50" height="50" rx="4" fill="${fillOf(c)}" stroke="${strokeOf(c)}" stroke-width="2"/>`;
    }
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 340) });
}
