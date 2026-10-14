import type { Op, Page } from '../model';
import { effectiveOps, random } from '../engine/core';
const color = (c: string) => /^#[0-9a-f]{6}$/i.test(c) ? c : '#ffffff';
const path = (d: string) => /^[MLZCQAHVSTmlzcqahvst0-9., eE+\-]*$/.test(d) ? d : '';
const coordinate = (value: number | undefined, fallback: number) => Number.isFinite(value) ? value : fallback;
export function paintMarkup(page: Page, ops: Op[], prefix = 'p', transparent = false, overlay = false) {
    let defs = '', body = '';
    for (const r of page.regions) {
        const id = `${prefix}-${r.id}`, d = path(r.d);
        defs += `<clipPath id="${id}"><path d="${d}" clip-rule="evenodd"/></clipPath>`;
        if (transparent && r.bg)
            continue;
        let content = overlay ? '' : `<path d="${d}" fill="white" fill-rule="evenodd"/>`;
        effectiveOps(ops, r.id).forEach((op, i) => {
            const oid = `${id}-${i}`, c = color(op.color);
            let fill = c;
            if (op.kind === 'fill') {
                if (op.style === 'gradient') {
                    defs += `<radialGradient id="${oid}" gradientUnits="userSpaceOnUse" cx="${coordinate(op.at?.[0],r.anchor[0])}" cy="${coordinate(op.at?.[1],r.anchor[1])}" r="${Math.max(r.bbox[2]-r.bbox[0],r.bbox[3]-r.bbox[1])}"><stop stop-color="${c}"/><stop offset="1" stop-color="${color(op.color2||'#ffffff')}"/></radialGradient>`;
                    fill = `url(#${oid})`;
                }
                else if (['crayon', 'glitter', 'watercolor', 'rainbow'].includes(op.style)) {
                    if (op.style === 'rainbow') {
                        defs += '<linearGradient id="' + oid + '">' + ['#ef6579', '#ffc654', '#85c778', '#68bced', '#ac83de'].map((c, j) => '<stop offset="' + j / 4 + '" stop-color="' + c + '"/>').join('') + '</linearGradient>';
                    }
                    else {
                        const rnd = random(op.seed);
                        let marks = '';
                        for (let k = 0; k < 28; k++) {
                            const x = (rnd() * 60).toFixed(1), y = (rnd() * 60).toFixed(1);
                            marks += op.style === 'glitter' ? '<path d="M' + x + ' ' + (+y - 3) + 'v6m-3-3h6" stroke="white"/>' : '<circle cx="' + x + '" cy="' + y + '" r="' + (rnd() * 2 + 1).toFixed(1) + '" fill="white" opacity=".55"/>';
                        }
                        defs += '<pattern id="' + oid + '" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="' + c + '"/>' + (op.style === 'watercolor' ? '<rect width="60" height="60" fill="white" opacity=".5"/>' : marks) + '</pattern>';
                    }
                    fill = 'url(#' + oid + ')';
                }
                else if (op.style !== 'solid') {
                    const mark = op.style === 'scales' ? '<path d="M-20 0Q0 40 20 0Q40 40 60 0M0 20Q20 60 40 20" fill="none" stroke="white" stroke-width="3"/>' : op.style === 'bricks' ? '<path d="M0 0H40M0 20H40M20 0V20M0 20V40M40 20V40" stroke="white" stroke-width="3"/>' : op.style === 'clouds' ? '<path d="M6 26Q-2 15 10 16Q10 2 22 9Q34 3 33 16Q44 20 34 27Z"/>' : op.style === 'dots' ? '<circle cx="10" cy="10" r="5"/>' : op.style === 'stripes' ? '<path d="M0 0L40 40M-20 0L20 40M20 0L60 40" stroke="white" stroke-width="8"/>' : op.style === 'checks' ? '<path d="M0 0H20V20H0ZM20 20H40V40H20Z"/>' : op.style === 'hearts' ? '<path d="M20 30C-2 16 8 0 20 12C32 0 42 16 20 30Z"/>' : '<path d="M20 3L25 15H38L28 24L31 37L20 29L9 37L12 24L2 15H15Z"/>';
                    defs += `<pattern id="${oid}" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="${c}"/><g fill="white" opacity=".55">${mark}</g></pattern>`;
                    fill = `url(#${oid})`;
                }
                content += `<path d="${d}" fill="${fill}" fill-rule="evenodd"/>`;
            }
            else {
                const pd = op.pts.map((v, j) => j % 2 ? ' ' + v : (j ? 'L' : 'M') + v).join('') + 'l.01 0';
                let opacity = op.brush === 'watercolor' ? .32 : 1;
                if (op.brush === 'erase')
                    fill = '#ffffff';
                if (op.brush === 'rainbow') {
                    defs += `<linearGradient id="${oid}">${['#ef6579', '#ffc654', '#85c778', '#68bced', '#ac83de'].map((c, j) => `<stop offset="${j / 4}" stop-color="${c}"/>`).join('')}</linearGradient>`;
                    fill = `url(#${oid})`;
                }
                if (op.brush === 'crayon' || op.brush === 'glitter') {
                    const rnd = random(op.seed);
                    let specks = '';
                    for (let k = 0; k < 20; k++) {
                        const x = (rnd() * 60).toFixed(1), y = (rnd() * 60).toFixed(1);
                        specks += op.brush === 'crayon' ? `<circle cx="${x}" cy="${y}" r="${(rnd() * 2 + 1).toFixed(1)}" fill="white" opacity=".65"/>` : `<path d="M${x} ${+y - 3}v6m-3-3h6" stroke="white" stroke-width="1.5"/>`;
                    }
                    defs += `<pattern id="${oid}" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="${c}"/>${specks}</pattern>`;
                    fill = `url(#${oid})`;
                }
                content += `<path d="${pd}" fill="none" stroke="${fill}" stroke-width="${Math.max(1, Math.min(250, op.size))}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
            }
        });
        body += `<g clip-path="url(#${id})" data-region="${r.id}">${content}</g>`;
    }
    return `<defs>${defs}</defs>${body}${!overlay && !page.ink ? page.regions.map(r => `<path d="${path(r.d)}" fill="none" stroke="#273b46" stroke-width="3" pointer-events="none"/>`).join('') : ''}<path d="${path(page.ink)}" fill="#182b36" fill-rule="evenodd" pointer-events="none"/>`;
}
export function svgDocument(page: Page, ops: Op[], transparent = false) { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${page.size} ${page.size}" width="${page.size}" height="${page.size}">${transparent ? '' : `<rect width="${page.size}" height="${page.size}" fill="white"/>`}${paintMarkup(page, ops, 'export', transparent)}</svg>`; }
export async function pngData(page: Page, ops: Op[], size = 512, transparent = false, trim = false) { const url = URL.createObjectURL(new Blob([svgDocument(page, ops, transparent)], { type: 'image/svg+xml' })); const canvas = document.createElement('canvas'); canvas.width = canvas.height = size; try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, size, size);
    if (trim) {
        const rgba = ctx.getImageData(0, 0, size, size).data;
        let left = size, top = size, right = 0, bottom = 0;
        for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++)
                if (rgba[(y * size + x) * 4 + 3] > 10) {
                    left = Math.min(left, x);
                    right = Math.max(right, x);
                    top = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                }
        if (right > left && bottom > top) {
            const cropped = document.createElement('canvas');
            cropped.width = right - left + 1;
            cropped.height = bottom - top + 1;
            cropped.getContext('2d')!.drawImage(canvas, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
            const data = cropped.toDataURL('image/png');
            cropped.width = cropped.height = 0;
            return data;
        }
    }
    return canvas.toDataURL('image/png');
}
finally {
    URL.revokeObjectURL(url);
    canvas.width = canvas.height = 0;
} }
export function download(data: string, name: string) { const a = document.createElement('a'); a.href = data; a.download = name; a.click(); }
export async function sharePng(page: Page, ops: Op[]) { const data = await pngData(page, ops, 2048), blob = await (await fetch(data)).blob(), file = new File([blob], page.id + '.png', { type: 'image/png' }); if (navigator.canShare?.({ files: [file] }))
    await navigator.share({ files: [file], title: page.title });
else
    download(data, page.id + '.png'); }
export function printPage(page: Page) { const win = window.open('', '_blank'); if (!win)
    throw Error('Trình duyệt đang chặn cửa sổ in.'); win.document.write(`<html><head><title>Tranh tô màu</title><style>@page{size:A4;margin:12mm}svg{width:100%;height:auto}body{margin:0}</style></head><body>${svgDocument(page, [])}</body></html>`); win.document.close(); setTimeout(() => { if (!win.closed)
    win.print(); }, 600); }
