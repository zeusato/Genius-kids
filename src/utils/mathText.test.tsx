import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { describe, expect, it } from 'vitest';
import { remarkMathText } from './mathText';

const html = (md: string) => renderToStaticMarkup(
    <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm, remarkMathText]} rehypePlugins={[rehypeKatex]} components={{ p: 'span' }}>{md}</ReactMarkdown>,
);
const frac = (n: string, d: string) => `<span class="mfrac"><span class="mfrac-num">${n}</span><span class="mfrac-den">${d}</span></span>`;

describe('remarkMathText — phân số xếp tử/mẫu', () => {
    it('phân số trong đề, lựa chọn, bảng', () => {
        expect(html('Rút gọn phân số 6/30')).toContain(frac('6', '30'));
        expect(html('3/4')).toBe(`<span><span class="mfrac-wrap" role="math" aria-label="3 phần 4">${frac('3', '4')}</span></span>`);
        expect(html('| A |\n|---|\n| 1/2 |')).toContain(frac('1', '2'));
        expect(html('**Tính:** 2/5 + 1/5 = ?')).toContain(`<strong>Tính:</strong> <span class="mfrac-wrap" role="math" aria-label="2 phần 5">${frac('2', '5')}</span> + `);
    });

    it('hỗn số: phần nguyên + phân số bé hơn 1', () => {
        expect(html('Chuyển hỗn số 8 1/2 thành phân số')).toContain(`<span class="mmixed" role="math" aria-label="8 và 1 phần 2"><span class="mmixed-whole">8</span>${frac('1', '2')}</span>`);
        // phần phân số ≥ 1 → số 3 đứng riêng
        expect(html('3 5/2')).toBe(`<span>3 <span class="mfrac-wrap" role="math" aria-label="5 phần 2">${frac('5', '2')}</span></span>`);
        // có dấu phép tính ở giữa → không phải hỗn số
        expect(html('1 + 3/7')).toContain(`1 + <span class="mfrac-wrap"`);
    });

    it('không đụng ngày tháng, đơn vị, LaTeX có sẵn', () => {
        expect(html('Từ ngày 27/1 đến ngày 31/1')).toBe('<span>Từ ngày 27/1 đến ngày 31/1</span>');
        expect(html('Ngày 2/9 là Quốc khánh')).not.toContain('mfrac');
        expect(html('Hạn chót 2/9/2026')).not.toContain('mfrac');
        expect(html('Vận tốc 45 km/giờ')).not.toContain('mfrac');
        expect(html('$\\frac{1}{2}$')).toContain('katex');
    });

    it('dấu trừ giữa hai số là "−"', () => {
        expect(html('16 - 8 = 8')).toBe('<span>16 − 8 = 8</span>');
        expect(html('8/7 - 1/14')).toContain(' − ');
        expect(html('28 cm - 1 cm = 27 cm')).toBe('<span>28 cm − 1 cm = 27 cm</span>');
        expect(html('lớp 1-2')).toBe('<span>lớp 1-2</span>');
        expect(html('thứ Hai - thứ Ba')).toBe('<span>thứ Hai - thứ Ba</span>');
    });
});
