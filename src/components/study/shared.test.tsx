import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Md } from './shared';

const inline = (s: string) => renderToStaticMarkup(<Md inline>{s}</Md>);

describe('Md inline', () => {
    it('giữ ký hiệu so sánh và chuỗi giống cú pháp khối Markdown', () => {
        expect(inline('>')).toBe('<span>&gt;</span>');
        expect(inline('<')).toBe('<span>&lt;</span>');
        expect(inline('=')).toBe('<span>=</span>');
        expect(inline('- 5')).toBe('<span>- 5</span>');
        expect(inline('1. Tính')).toBe('<span>1. Tính</span>');
        expect(inline('# 3')).toBe('<span># 3</span>');
        expect(inline('> ; < ; =')).toBe('<span>&gt; ; &lt; ; =</span>');
    });

    it('vẫn dựng phân số và chữ đậm', () => {
        expect(inline('3/4')).toContain('class="mfrac"');
        expect(inline('**Tính:** 1/2')).toContain('<strong>Tính:</strong>');
    });
});
