// ============================================================================
//  Bộ SVG dùng chung — NGÔN NGỮ HÌNH ẢNH thống nhất cho mọi generator.
//  Trước đây mỗi file tự vẽ SVG (nét mảnh, font nhỏ, màu lệch, vẽ cố định không
//  theo số đo, dễ tràn khung). File này gom palette/typography + tiện ích bọc
//  <svg> chuẩn (viewBox + scale-to-fit + đổ bóng) để mọi hình tỉ lệ đúng, có
//  nhãn rõ, an toàn khung và responsive.
// ============================================================================

/** Bảng màu thân thiện trẻ em (đồng bộ tông Tailwind của app). */
export const PALETTE = {
    blueFill: '#dbeafe', blueStroke: '#2563eb',
    greenFill: '#dcfce7', greenStroke: '#16a34a',
    yellowFill: '#fef9c3', yellowStroke: '#ca8a04',
    orangeFill: '#ffedd5', orangeStroke: '#ea580c',
    redFill: '#fee2e2', redStroke: '#dc2626',
    purpleFill: '#f3e8ff', purpleStroke: '#9333ea',
    pinkFill: '#fce7f3', pinkStroke: '#db2777',
    grayFill: '#e5e7eb', grayStroke: '#64748b',
    ink: '#0f172a', muted: '#475569', accent: '#ef4444', white: '#ffffff',
} as const;

export type ColorKey = 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'pink' | 'gray';

export const fillOf = (c: ColorKey) => PALETTE[`${c}Fill` as const];
export const strokeOf = (c: ColorKey) => PALETTE[`${c}Stroke` as const];

export const STROKE_W = 3;
export const FONT = "'Baloo 2','Nunito',system-ui,sans-serif";
export const LABEL_SIZE = 15;

let filterSeq = 0;

/**
 * Bọc nội dung trong <svg> chuẩn: viewBox + tỉ lệ giữ (xMidYMid meet) + max-width
 * 100% để co theo khung (không tràn) + filter đổ bóng mềm dùng chung.
 * `pad` thêm lề quanh nội dung để bóng/nhãn không bị cắt.
 */
export function svgWrap(
    width: number,
    height: number,
    body: string,
    opts: { shadow?: boolean; maxW?: number } = {},
): string {
    const { shadow = true, maxW = Math.min(width, 360) } = opts;
    const fid = `dq-sh-${filterSeq++}`;
    const defs = shadow
        ? `<defs><filter id="${fid}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.18"/></filter></defs>`
        : '';
    const g = shadow ? `<g filter="url(#${fid})">${body}</g>` : body;
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" `
        + `preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" `
        + `font-family="${FONT}" style="max-width:${maxW}px;width:100%;height:auto;display:block;margin:0 auto">`
        + `${defs}${g}</svg>`;
}

/** Nhãn văn bản căn giữa, có viền trắng mảnh để nổi trên mọi nền. */
export function label(x: number, y: number, text: string, opts: { size?: number; color?: string; anchor?: 'start' | 'middle' | 'end' } = {}): string {
    const { size = LABEL_SIZE, color = PALETTE.ink, anchor = 'middle' } = opts;
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" `
        + `font-size="${size}" font-weight="700" fill="${color}" `
        + `paint-order="stroke" stroke="${PALETTE.white}" stroke-width="3" stroke-linejoin="round">${escapeXml(text)}</text>`;
}

/** Escape ký tự XML trong nhãn (đề phòng nội dung động). */
export function escapeXml(s: string): string {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Tính HỆ SỐ TỈ LỆ để hình lớn nhất theo số đo thật vừa khung mục tiêu mà không
 * tràn: maxValue → targetPx, kẹp trong [minScale, maxScale] để hình nhỏ không
 * tí hon, hình lớn không vượt khung.
 */
export function fitScale(maxValue: number, targetPx: number, minScale = 6, maxScale = 40): number {
    if (maxValue <= 0) return maxScale;
    return Math.max(minScale, Math.min(maxScale, targetPx / maxValue));
}
