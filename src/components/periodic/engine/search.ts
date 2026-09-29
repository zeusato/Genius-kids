// Tìm nguyên tố: không phân biệt dấu; tên SGK, tên cũ, tiếng Anh, bí danh, ký hiệu, số hiệu. TS thuần.
import { normalizeVi } from '../../../utils/text';
import type { ElementFull } from './elements';

export function searchElements(all: ElementFull[], q: string, limit = 10): ElementFull[] {
    const nq = normalizeVi(q);
    if (!nq) return [];
    const scored: { e: ElementFull; s: number }[] = [];
    for (const e of all) {
        let s = 0;
        if (String(e.atomicNumber) === nq) s = 120;
        else if (e.symbol.toLowerCase() === nq) s = 110;
        else {
            for (const t of e.aliases.map(normalizeVi)) {
                if (t === nq) s = Math.max(s, 100);
                else if (t.startsWith(nq)) s = Math.max(s, 80);
                else if (t.split(' ').some(w => w.startsWith(nq))) s = Math.max(s, 60);
                else if (nq.length >= 3 && t.includes(nq)) s = Math.max(s, 40);
            }
        }
        if (s > 0) scored.push({ e, s });
    }
    return scored.sort((a, b) => b.s - a.s || a.e.atomicNumber - b.e.atomicNumber).slice(0, limit).map(x => x.e);
}
