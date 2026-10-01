// ============================================================================
//  Hình cho Mầm non / Lớp 1: nhóm đồ vật, hàng quy luật, hình biến thể, khối,
//  to–nhỏ, vị trí, ô màu đánh số, cảnh buổi trong ngày. Dùng svgWrap/label chung.
// ============================================================================
import { PALETTE, svgWrap, label, escapeXml, fillOf, strokeOf, STROKE_W, type ColorKey } from './style';

const emo = (x: number, y: number, e: string, size = 36) =>
    `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${size}">${escapeXml(e)}</text>`;
const badge = (x: number, y: number, n: string | number) =>
    `<circle cx="${x}" cy="${y}" r="15" fill="${PALETTE.ink}"/>` + `<text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="central" font-size="17" font-weight="800" fill="#fff">${n}</text>`;

/** Các nhóm đồ vật đặt cạnh nhau trong khung bo tròn, có nhãn "Nhóm 1/2" (hoặc nhãn riêng). */
export function groupsSVG(groups: { emoji: string; n: number; label?: string }[], opts: { perRow?: number } = {}): string {
    const perRow = opts.perRow ?? 3, cell = 44, gap = 22;
    const boxes = groups.map(g => {
        const rows = Math.max(1, Math.ceil(g.n / perRow));
        return { w: Math.max(1, Math.min(perRow, g.n)) * cell + 24, h: rows * cell + 24 };
    });
    const H = Math.max(...boxes.map(b => b.h)) + 40;
    let x = 10, body = '';
    groups.forEach((g, gi) => {
        const b = boxes[gi];
        body += `<rect x="${x}" y="10" width="${b.w}" height="${H - 46}" rx="18" fill="#fffdf4" stroke="${PALETTE.grayStroke}" stroke-width="2" stroke-dasharray="6 5"/>`;
        for (let i = 0; i < g.n; i++) {
            const r = Math.floor(i / perRow), c = i % perRow;
            body += emo(x + 12 + c * cell + cell / 2, 22 + r * cell + cell / 2, g.emoji, 32);
        }
        body += label(x + b.w / 2, H - 16, g.label ?? `Nhóm ${gi + 1}`, { size: 16 });
        x += b.w + gap;
    });
    const W = x - gap + 10;
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 420) });
}

/** Một hàng đồ vật; `null` = ô dấu hỏi. `flag`: cờ "bắt đầu" ở đầu hàng (số thứ tự). */
export function rowSVG(items: (string | null)[], opts: { flag?: boolean } = {}): string {
    const cell = 58, start = opts.flag ? 54 : 12;
    const W = start + items.length * cell + 12, H = 92;
    let body = opts.flag ? `<line x1="22" y1="20" x2="22" y2="80" stroke="${PALETTE.ink}" stroke-width="3"/><polygon points="24,20 48,29 24,38" fill="${PALETTE.redStroke}"/>` : '';
    items.forEach((e, i) => {
        const cx = start + i * cell + cell / 2;
        if (e === null) body += `<rect x="${cx - 24}" y="22" width="48" height="48" rx="12" fill="#fff7d6" stroke="${PALETTE.yellowStroke}" stroke-width="3" stroke-dasharray="6 4"/>` + label(cx, 46, '?', { size: 28 });
        else body += emo(cx, 46, e, 38);
    });
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 460) });
}

export type ShapeKind = 'square' | 'rectangle' | 'circle' | 'triangle';
function shapePath(kind: ShapeKind, cx: number, cy: number, s: number, color: ColorKey, rotate = 0): string {
    const f = fillOf(color), st = strokeOf(color);
    let el = '';
    if (kind === 'circle') el = `<circle cx="${cx}" cy="${cy}" r="${s * 0.5}" fill="${f}" stroke="${st}" stroke-width="${STROKE_W}"/>`;
    else if (kind === 'square') el = `<rect x="${cx - s * 0.45}" y="${cy - s * 0.45}" width="${s * 0.9}" height="${s * 0.9}" rx="5" fill="${f}" stroke="${st}" stroke-width="${STROKE_W}"/>`;
    else if (kind === 'rectangle') el = `<rect x="${cx - s * 0.6}" y="${cy - s * 0.32}" width="${s * 1.2}" height="${s * 0.64}" rx="5" fill="${f}" stroke="${st}" stroke-width="${STROKE_W}"/>`;
    else el = `<polygon points="${cx},${cy - s * 0.5} ${cx + s * 0.55},${cy + s * 0.42} ${cx - s * 0.55},${cy + s * 0.42}" fill="${f}" stroke="${st}" stroke-width="${STROKE_W}" stroke-linejoin="round"/>`;
    return rotate ? `<g transform="rotate(${rotate} ${cx} ${cy})">${el}</g>` : el;
}

/** Một hình phẳng với màu / góc xoay / cỡ tuỳ chọn (để bé nhận ra hình ở mọi tư thế). */
export function shapeVariantSVG(kind: ShapeKind, color: ColorKey = 'blue', rotate = 0, scale = 1): string {
    return svgWrap(200, 180, shapePath(kind, 100, 90, 120 * scale, color, rotate), { maxW: 220 });
}

/** Hàng hình đánh số 1..n (chọn "Hình số mấy là…"). */
export function shapesRowSVG(items: { kind: ShapeKind; color: ColorKey; rotate?: number }[]): string {
    const cell = 104, W = items.length * cell + 16, H = 140;
    const body = items.map((it, i) => shapePath(it.kind, 8 + i * cell + cell / 2, 60, 74, it.color, it.rotate ?? 0) + badge(8 + i * cell + cell / 2, 122, i + 1)).join('');
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 460) });
}

export type SolidKind = 'sphere' | 'cylinder' | 'cube' | 'box';
/** Khối cầu / trụ / lập phương / hộp chữ nhật vẽ có bóng sáng. */
export function solidSVG(kind: SolidKind, color: ColorKey = 'blue'): string {
    const f = fillOf(color), st = strokeOf(color), sw = STROKE_W;
    let body = '';
    if (kind === 'sphere') body = `<circle cx="100" cy="92" r="66" fill="${f}" stroke="${st}" stroke-width="${sw}"/><ellipse cx="100" cy="92" rx="66" ry="18" fill="none" stroke="${st}" stroke-width="1.5" stroke-dasharray="5 4"/><circle cx="76" cy="66" r="13" fill="#fff" opacity=".7"/>`;
    else if (kind === 'cylinder') body = `<path d="M50 44 L50 140 A50 16 0 0 0 150 140 L150 44" fill="${f}" stroke="${st}" stroke-width="${sw}"/><ellipse cx="100" cy="44" rx="50" ry="16" fill="#fff" stroke="${st}" stroke-width="${sw}"/>`;
    else {
        const w = kind === 'cube' ? 90 : 120, h = 90, d = 30, x = 100 - (w + d) / 2, y = 50;
        body = `<polygon points="${x},${y + d} ${x + d},${y} ${x + d + w},${y} ${x + w},${y + d}" fill="#fff" stroke="${st}" stroke-width="${sw}" stroke-linejoin="round"/>`
            + `<polygon points="${x + w},${y + d} ${x + d + w},${y} ${x + d + w},${y + h} ${x + w},${y + d + h}" fill="${st}" opacity=".35" stroke="${st}" stroke-width="${sw}" stroke-linejoin="round"/>`
            + `<rect x="${x}" y="${y + d}" width="${w}" height="${h}" fill="${f}" stroke="${st}" stroke-width="${sw}"/>`;
    }
    return svgWrap(200, 180, body, { maxW: 220 });
}

/** Một đồ vật (emoji) cỡ lớn. */
export function bigEmojiSVG(e: string): string {
    return svgWrap(160, 150, emo(80, 75, e, 96), { shadow: false, maxW: 180 });
}

/** Hai vật khác cỡ / cao / dài, đánh số 1 và 2. */
export function sizePairSVG(kind: 'big' | 'tall' | 'long', firstBigger: boolean, emoji = '🐻'): string {
    const W = 320, H = 200;
    let body = '';
    const a = firstBigger ? 1 : 0.55, b = firstBigger ? 0.55 : 1;
    if (kind === 'big') {
        body = emo(85, 92, emoji, 110 * a) + emo(235, 92, emoji, 110 * b);
    } else if (kind === 'tall') {
        const h1 = 140 * a, h2 = 140 * b;
        body = `<rect x="70" y="${170 - h1}" width="30" height="${h1}" rx="6" fill="${fillOf('orange')}" stroke="${strokeOf('orange')}" stroke-width="3"/>`
            + `<circle cx="85" cy="${170 - h1}" r="34" fill="${fillOf('green')}" stroke="${strokeOf('green')}" stroke-width="3"/>`
            + `<rect x="220" y="${170 - h2}" width="30" height="${h2}" rx="6" fill="${fillOf('orange')}" stroke="${strokeOf('orange')}" stroke-width="3"/>`
            + `<circle cx="235" cy="${170 - h2}" r="34" fill="${fillOf('green')}" stroke="${strokeOf('green')}" stroke-width="3"/>`;
    } else {
        const l1 = 260 * a, l2 = 260 * b;
        const pencil = (y: number, l: number) => `<rect x="30" y="${y}" width="${l - 26}" height="26" rx="4" fill="${fillOf('yellow')}" stroke="${strokeOf('yellow')}" stroke-width="3"/><polygon points="${30 + l - 26},${y} ${30 + l},${y + 13} ${30 + l - 26},${y + 26}" fill="#f5d0a9" stroke="${strokeOf('yellow')}" stroke-width="3"/>`;
        body = pencil(40, l1) + pencil(120, l2);
        return svgWrap(W, H, body + badge(14, 53, 1) + badge(14, 133, 2), { shadow: false, maxW: 360 });
    }
    return svgWrap(W, H, body + badge(85, 186, 1) + badge(235, 186, 2), { shadow: false, maxW: 360 });
}

/** Cảnh vị trí: đồ vật ở trên / dưới / bên trái / bên phải cái bàn (theo hướng nhìn của bé). */
export function positionSceneSVG(obj: string, where: 'above' | 'below' | 'left' | 'right'): string {
    const W = 340, H = 220;
    const table = `<rect x="110" y="96" width="120" height="16" rx="5" fill="#c08457" stroke="#7c4a24" stroke-width="3"/>`
        + `<rect x="122" y="112" width="12" height="80" fill="#c08457" stroke="#7c4a24" stroke-width="3"/><rect x="206" y="112" width="12" height="80" fill="#c08457" stroke="#7c4a24" stroke-width="3"/>`
        + `<line x1="20" y1="194" x2="320" y2="194" stroke="${PALETTE.grayStroke}" stroke-width="3"/>`;
    const pos = { above: [170, 62], below: [170, 160], left: [56, 160], right: [284, 160] }[where];
    return svgWrap(W, H, table + emo(pos[0], pos[1], obj, 54), { shadow: false, maxW: 380 });
}

/** Ô màu đánh số 1..n (chọn "Ô số mấy là màu…"); `object` (emoji) đặt phía trên nếu có. */
export function swatchesSVG(hexes: string[], object?: string): string {
    const cell = 86, top = object ? 96 : 10, W = hexes.length * cell + 16, H = top + 118;
    let body = object ? emo(W / 2, 50, object, 72) : '';
    hexes.forEach((h, i) => {
        const x = 8 + i * cell + 8;
        body += `<rect x="${x}" y="${top}" width="${cell - 16}" height="${cell - 16}" rx="14" fill="${h}" stroke="${PALETTE.ink}" stroke-width="2.5"/>` + badge(x + (cell - 16) / 2, top + cell + 8, i + 1);
    });
    return svgWrap(W, H, body, { shadow: false, maxW: Math.min(W, 420) });
}

/** Một ô màu lớn. */
export function swatchSVG(hex: string): string {
    return svgWrap(160, 160, `<rect x="14" y="14" width="132" height="132" rx="22" fill="${hex}" stroke="${PALETTE.ink}" stroke-width="3"/>`, { shadow: false, maxW: 170 });
}

/** Cảnh buổi trong ngày: sáng (mặt trời mọc), trưa (đỉnh đầu), chiều (lặn), tối (trăng sao). */
export function dayPartSVG(part: 'morning' | 'noon' | 'afternoon' | 'night'): string {
    const W = 320, H = 200;
    const sky = { morning: '#ffe7c2', noon: '#bfe3ff', afternoon: '#ffc58f', night: '#1e2a4a' }[part];
    let body = `<rect x="0" y="0" width="${W}" height="${H}" rx="18" fill="${sky}"/>`
        + `<path d="M0 150 Q80 125 160 150 T320 150 L320 200 L0 200 Z" fill="${part === 'night' ? '#2f4a3a' : '#7cc47f'}"/>`
        + `<rect x="120" y="112" width="70" height="52" fill="${part === 'night' ? '#6b5b4b' : '#f2d2a2'}" stroke="#7c4a24" stroke-width="2.5"/><polygon points="112,114 155,82 198,114" fill="#c2552d" stroke="#7c4a24" stroke-width="2.5"/>`
        + `<rect x="146" y="132" width="18" height="32" fill="#7c4a24"/>`;
    if (part === 'night') {
        body += `<circle cx="250" cy="52" r="26" fill="#fef3c7"/><circle cx="262" cy="44" r="24" fill="${sky}"/>`
            + [[40, 30], [90, 60], [190, 26], [60, 90], [220, 96]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="18" fill="#fef3c7">✦</text>`).join('')
            + `<rect x="136" y="122" width="14" height="12" fill="#fde68a"/>`;
    } else {
        const [sx, sy] = { morning: [46, 120], noon: [160, 40], afternoon: [276, 116] }[part];
        body += `<circle cx="${sx}" cy="${sy}" r="${part === 'noon' ? 28 : 24}" fill="${part === 'noon' ? '#fbbf24' : '#fb923c'}"/>`;
    }
    return svgWrap(W, H, body, { shadow: false, maxW: 360 });
}
