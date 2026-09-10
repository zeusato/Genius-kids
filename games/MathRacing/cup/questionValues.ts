export function numericValue(text: string): number | null {
    const s = text.replace(/\s/g, '').replace(',', '.');
    if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s);
    const f = s.match(/^(-?\d+)\/(\d+)$/);
    return f && Number(f[2]) !== 0 ? Number(f[1]) / Number(f[2]) : null;
}
export function answerKey(text: string | number): string {
    const s = String(text).trim(), n = numericValue(s);
    return n === null ? s.replace(/\s+/g, ' ').toLowerCase() : Number(n.toFixed(9)).toString();
}
/** Small arithmetic parser, without eval. Fraction literals remain atomic. */
export function expressionValue(expression: string): number | null {
    const input = expression.replace(/(?<=\d)[ \u00a0\u202f](?=\d{3}(?:\D|$))/g, '').replace(/−/g, '-').trim();
    const tokens = input.match(/\d+(?:,\d+)?(?:\/\d+)?|[()+\-×÷*:]/g);
    if (!tokens || tokens.join('') !== input.replace(/\s/g, '')) return null;
    let i = 0;
    const atom = (): number => {
        const t = tokens[i++];
        if (t === '(') { const v = sum(); if (tokens[i++] !== ')') throw new Error('parenthesis'); return v; }
        if (t === '-') return -atom();
        const v = numericValue(t || ''); if (v === null) throw new Error('number'); return v;
    };
    const product = (): number => { let v = atom(); while (['×', '*', '÷', ':'].includes(tokens[i])) { const op = tokens[i++], rhs = atom(); v = op === '×' || op === '*' ? v * rhs : v / rhs; } return v; };
    const sum = (): number => { let v = product(); while (['+', '-'].includes(tokens[i])) { const op = tokens[i++], rhs = product(); v = op === '+' ? v + rhs : v - rhs; } return v; };
    try { const v = sum(); return i === tokens.length && Number.isFinite(v) ? v : null; } catch { return null; }
}
