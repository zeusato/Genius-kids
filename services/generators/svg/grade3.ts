// ============================================================================
//  Hình cho Lớp 3–4: hình tròn (tâm, bán kính, đường kính), trung điểm, góc,
//  đa giác có tên đỉnh, nhiệt kế, lưới ô vuông (diện tích), tứ giác có số đo.
// ============================================================================
import { PALETTE, svgWrap, label, fillOf, strokeOf, STROKE_W, type ColorKey } from './style';

const pt = (x: number, y: number, n: string, dx = 0, dy = -16) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${PALETTE.ink}"/>` + label(x + dx, y + dy, n, { size: 16 });

/** Hình tròn tâm O; tô đậm đoạn được hỏi: bán kính OA hoặc đường kính AB. */
export function circlePartsSVG(show: 'radius' | 'diameter' | 'both', names = 'OAB', r = 70): string {
    const [o, a, b] = names.split('');
    const cx = 110, cy = 100, W = 220, H = 200;
    let body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillOf('yellow')}" stroke="${strokeOf('yellow')}" stroke-width="${STROKE_W}"/>`;
    if (show !== 'radius') body += `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${PALETTE.blueStroke}" stroke-width="3"/>` + pt(cx - r, cy, a, -12) + pt(cx + r, cy, b, 12);
    if (show !== 'diameter') { const x = cx + r * Math.cos(-1.0), y = cy + r * Math.sin(-1.0); body += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${PALETTE.redStroke}" stroke-width="3"/>` + pt(x, y, show === 'both' ? 'C' : a, 10, -12); }
    body += pt(cx, cy, o, 0, 18);
    return svgWrap(W, H, body, { maxW: 240 });
}

/** Đoạn thẳng AB và điểm M nằm giữa (đúng trung điểm nếu `exact`), có vạch chia đơn vị. */
export function midpointSVG(len: number, at: number, names = 'AMB'): string {
    const [a, m, b] = names.split('');
    const u = Math.min(36, 280 / len), x0 = 24, y = 70, W = x0 * 2 + len * u;
    let body = `<line x1="${x0}" y1="${y}" x2="${x0 + len * u}" y2="${y}" stroke="${PALETTE.blueStroke}" stroke-width="${STROKE_W}"/>`;
    for (let i = 0; i <= len; i++) body += `<line x1="${x0 + i * u}" y1="${y + 6}" x2="${x0 + i * u}" y2="${y + 14}" stroke="${PALETTE.grayStroke}" stroke-width="1.5"/>`;
    body += pt(x0, y, a) + pt(x0 + len * u, y, b) + pt(x0 + at * u, y, m);
    return svgWrap(W, 110, body, { shadow: false, maxW: Math.min(W, 380) });
}

/** Góc đỉnh O có số đo `deg` (0–180), tia thứ hai quay NGƯỢC chiều kim đồng hồ phía trên tia ngang. */
export function angleShapeSVG(deg: number, opts: { showDegree?: boolean; names?: string; protractor?: boolean; noMark?: boolean } = {}): string {
    const [n1, o, n2] = (opts.names ?? 'AOB').split('');
    const r = 120, cx = deg > 90 ? 150 : 40, cy = 150, W = (deg > 90 ? 150 : 40) + r + 40, H = 180;
    const rad = deg * Math.PI / 180, x2 = cx + r * Math.cos(rad), y2 = cy - r * Math.sin(rad);
    let body = '';
    if (opts.protractor) {
        body += `<path d="M ${cx - 100} ${cy} A 100 100 0 0 1 ${cx + 100} ${cy} Z" fill="#eef6ff" stroke="${PALETTE.blueStroke}" stroke-width="1.5" opacity=".9"/>`;
        for (let d = 0; d <= 180; d += 10) {
            const t = d * Math.PI / 180, rr = d % 30 === 0 ? 86 : 92;
            body += `<line x1="${cx + rr * Math.cos(t)}" y1="${cy - rr * Math.sin(t)}" x2="${cx + 100 * Math.cos(t)}" y2="${cy - 100 * Math.sin(t)}" stroke="${PALETTE.blueStroke}" stroke-width="1.2"/>`;
            if (d % 30 === 0) body += `<text x="${cx + 74 * Math.cos(t)}" y="${cy - 74 * Math.sin(t)}" text-anchor="middle" dominant-baseline="central" font-size="10" fill="${PALETTE.blueStroke}">${d}</text>`;
        }
    }
    body += `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${PALETTE.ink}" stroke-width="${STROKE_W}" stroke-linecap="round"/>`
        + `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${PALETTE.ink}" stroke-width="${STROKE_W}" stroke-linecap="round"/>`;
    if (!opts.protractor && !opts.noMark) body += deg === 90
        ? `<polyline points="${cx + 18},${cy} ${cx + 18},${cy - 18} ${cx},${cy - 18}" fill="none" stroke="${PALETTE.redStroke}" stroke-width="2"/>`
        : `<path d="M ${cx + 28} ${cy} A 28 28 0 0 0 ${cx + 28 * Math.cos(rad)} ${cy - 28 * Math.sin(rad)}" fill="none" stroke="${PALETTE.redStroke}" stroke-width="2"/>`;
    body += pt(cx, cy, o, 0, 18) + pt(cx + r, cy, n2, 0, 18) + pt(x2, y2, n1, 10, -10);
    if (opts.showDegree) body += label(cx + 46 * Math.cos(rad / 2), cy - 46 * Math.sin(rad / 2) - 6, `${deg}°`, { color: PALETTE.redStroke, size: 15 });
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 340) });
}

/** Đa giác có tên đỉnh (tam giác ABC / tứ giác MNPQ), không ghi số đo. */
export function namedPolygonSVG(n: 3 | 4, names: string, color: ColorKey = 'green'): string {
    const pts: [number, number][] = n === 3 ? [[40, 160], [250, 160], [150, 30]] : [[40, 150], [80, 40], [240, 50], [260, 160]];
    const offs: [number, number][] = n === 3 ? [[-14, 10], [14, 10], [0, -16]] : [[-14, 10], [-10, -14], [12, -12], [14, 12]];
    let body = `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${fillOf(color)}" stroke="${strokeOf(color)}" stroke-width="${STROKE_W}" stroke-linejoin="round"/>`;
    pts.forEach(([x, y], i) => { body += pt(x, y, names[i], offs[i][0], offs[i][1]); });
    return svgWrap(300, 200, body, { maxW: 320 });
}

/** Tứ giác có số đo 4 cạnh. */
export function quadSidesSVG(a: number, b: number, c: number, d: number, unit = 'cm'): string {
    const P: [number, number][] = [[50, 160], [70, 40], [250, 30], [280, 165]];
    let body = `<polygon points="${P.map(p => p.join(',')).join(' ')}" fill="${fillOf('blue')}" stroke="${strokeOf('blue')}" stroke-width="${STROKE_W}" stroke-linejoin="round"/>`;
    const mids: [number, number, 'start' | 'end' | 'middle'][] = [[40, 100, 'end'], [160, 20, 'middle'], [282, 98, 'start'], [165, 182, 'middle']];
    body += label(mids[0][0], mids[0][1], `${a} ${unit}`, { anchor: 'end' }) + label(mids[1][0], mids[1][1], `${b} ${unit}`) + label(mids[2][0], mids[2][1], `${c} ${unit}`, { anchor: 'start' }) + label(mids[3][0], mids[3][1], `${d} ${unit}`);
    return svgWrap(340, 200, body, { maxW: 360 });
}

/** Nhiệt kế (°C) chỉ `t` độ, thang 0..max. */
export function thermometerSVG(t: number, max = 50): string {
    const top = 20, bottom = 230, h = bottom - top, x = 80, y = bottom - (t / max) * h;
    let body = `<rect x="${x - 10}" y="${top - 6}" width="20" height="${h + 6}" rx="10" fill="#fff" stroke="${PALETTE.grayStroke}" stroke-width="2"/>`
        + `<rect x="${x - 5}" y="${y}" width="10" height="${bottom - y + 6}" fill="${PALETTE.redStroke}"/><circle cx="${x}" cy="${bottom + 16}" r="16" fill="${PALETTE.redStroke}"/>`;
    for (let v = 0; v <= max; v += 5) {
        const yy = bottom - (v / max) * h;
        body += `<line x1="${x + 12}" y1="${yy}" x2="${x + (v % 10 === 0 ? 26 : 20)}" y2="${yy}" stroke="${PALETTE.ink}" stroke-width="1.5"/>`;
        if (v % 10 === 0) body += `<text x="${x + 32}" y="${yy}" dominant-baseline="central" font-size="12" font-weight="700" fill="${PALETTE.ink}">${v}</text>`;
    }
    body += `<text x="${x - 20}" y="${top}" text-anchor="end" font-size="13" font-weight="800" fill="${PALETTE.muted}">°C</text>`;
    return svgWrap(160, 270, body, { shadow: false, maxW: 170 });
}

/** Lưới ô vuông 1 cm² tô màu một hình chữ nhật w×h (hoặc ô tô tuỳ ý `cells`). */
export function gridAreaSVG(cols: number, rows: number, filled: [number, number][] | 'all'): string {
    const u = Math.min(30, 300 / Math.max(cols, rows)), W = cols * u + 20, H = rows * u + 20;
    let body = '';
    const set = new Set(filled === 'all' ? [] : filled.map(([c, r]) => `${c},${r}`));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const on = filled === 'all' || set.has(`${c},${r}`);
        body += `<rect x="${10 + c * u}" y="${10 + r * u}" width="${u}" height="${u}" fill="${on ? fillOf('green') : '#fff'}" stroke="${on ? strokeOf('green') : PALETTE.grayFill}" stroke-width="1.2"/>`;
    }
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 360) });
}
