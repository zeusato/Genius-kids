// Dựng SVG từ dữ liệu hình (VisualSpec) — dữ liệu nhỏ được lưu thay cho chuỗi SVG.
import * as KIT from './index';

export type VisualFn = { [K in keyof typeof KIT]: (typeof KIT)[K] extends (...a: any[]) => string ? K : never }[keyof typeof KIT];
export interface VisualSpec { fn: VisualFn | string; args: unknown[] }

export const isVisualFn = (fn: string): fn is VisualFn => typeof (KIT as Record<string, unknown>)[fn] === 'function';

export function renderVisual(spec: VisualSpec | undefined | null): string | undefined {
    if (!spec || !isVisualFn(spec.fn)) return undefined;
    try {
        return ((KIT as unknown as Record<string, (...a: unknown[]) => string>)[spec.fn])(...(spec.args || []));
    } catch {
        return undefined;
    }
}

/** Hình của một câu: ưu tiên visualSvg có sẵn, không có thì dựng từ `visual`. */
export const visualOf = (q: { visualSvg?: string; visual?: VisualSpec }): string | undefined => q.visualSvg || renderVisual(q.visual);
