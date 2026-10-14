// Đặt tính cộng, trừ, nhân theo SGK (thuần, có test). Hỗ trợ số thập phân và nhân với số nhiều chữ số.
// Trừ có nhớ kiểu SGK Việt Nam: số nhớ được THÊM vào chữ số hàng bên trái của số trừ.
export type ColOp = '+' | '-' | '×';
export interface ColRow { kind: 'a' | 'b' | 'partial' | 'result'; cells: Record<number, string>; comma: boolean }
export interface ColWrite { row: number; exp: number; ch: string }
export interface ColStep { say: string; writes: ColWrite[]; carry: { exp: number; v: number } | null; comma?: number }
export interface ColResult { op: ColOp; rows: ColRow[]; steps: ColStep[]; minExp: number; maxExp: number; result: number }

export const decOf = (x: number): number => { const s = String(x); return s.includes('e') ? 0 : (s.split('.')[1] ?? '').length; };
const scaled = (x: number, d: number): number => Math.round(x * 10 ** d);
/** các chữ số theo hàng: exp 0 = đơn vị, -1 = phần mười… (không thêm số 0 ở đầu/cuối) */
function cellsOf(x: number, dec: number): Record<number, string> {
    const s = String(scaled(x, dec)).padStart(dec + 1, '0');
    const out: Record<number, string> = {};
    for (let i = 0; i < s.length; i++) out[s.length - 1 - i - dec] = s[i];
    return out;
}
const fmtVN = (x: number) => String(x).replace('.', ',');

export function column(op: ColOp, a: number, b: number): ColResult {
    if (![a, b].every(x => Number.isFinite(x) && x >= 0)) throw new Error('Số không hợp lệ');
    if (op === '-' && a < b) throw new Error('Số bị trừ phải lớn hơn hoặc bằng số trừ');
    return op === '×' ? multiply(a, b) : addSub(op, a, b);
}

function addSub(op: '+' | '-', a: number, b: number): ColResult {
    const da = decOf(a), db = decOf(b), dec = Math.max(da, db);
    // phép trừ: viết thêm chữ số 0 vào phần thập phân của số bị trừ cho đủ hàng
    const aCells = op === '-' ? cellsOf(a, dec) : cellsOf(a, da), bCells = cellsOf(b, db);
    const rows: ColRow[] = [{ kind: 'a', cells: aCells, comma: dec > 0 }, { kind: 'b', cells: bCells, comma: db > 0 }, { kind: 'result', cells: {}, comma: false }];
    const steps: ColStep[] = [];
    if (op === '-' && da < dec) steps.push({ say: `Viết thêm chữ số 0 vào bên phải phần thập phân của số bị trừ: ${fmtVN(a)} = ${a.toFixed(dec).replace('.', ',')}.`, writes: [], carry: null });
    const top = Math.max(...Object.keys(aCells).map(Number), ...Object.keys(bCells).map(Number));
    let c = 0;
    for (let e = -dec; e <= top; e++) {
        const x = aCells[e], y = bCells[e];
        const X = Number(x ?? 0), Y = Number(y ?? 0);
        const last = e === top;
        let say: string, digit: number, nc = 0;
        if (op === '+') {
            const sum = X + Y + c;
            nc = sum >= 10 ? 1 : 0; digit = sum % 10;
            const head = x !== undefined && y !== undefined ? `${X} cộng ${Y} bằng ${X + Y}${c ? `, thêm ${c} bằng ${sum}` : ''}` : c ? `${x ?? y} thêm ${c} bằng ${sum}` : `Hạ ${x ?? y}`;
            if (last && nc) { say = `${head}, viết ${sum}.`; steps.push({ say, writes: [{ row: 2, exp: e, ch: String(digit) }, { row: 2, exp: e + 1, ch: '1' }], carry: null }); c = 0; break; }
            say = `${head}, viết ${digit}${nc ? ' nhớ 1' : ''}.`;
        } else {
            const s = Y + c;
            const pre = c && y !== undefined ? `${Y} thêm 1 bằng ${s}; ` : '';
            if (X >= s) { digit = X - s; say = y === undefined && !c ? `Hạ ${X}, viết ${X}.` : `${pre}${X} trừ ${s} bằng ${digit}, viết ${digit}.`; }
            else { digit = X + 10 - s; nc = 1; say = `${pre}${X} không trừ được ${s}, lấy 1${X} trừ ${s} bằng ${digit}, viết ${digit} nhớ 1.`; }
        }
        steps.push({ say, writes: [{ row: 2, exp: e, ch: String(digit) }], carry: nc ? { exp: e + 1, v: nc } : null });
        c = nc;
    }
    // bỏ chữ số 0 vô nghĩa ở đầu kết quả (phép trừ)
    trimLeading(steps, 2);
    if (dec > 0) steps.push({ say: 'Đặt dấu phẩy ở kết quả thẳng cột với các dấu phẩy ở trên.', writes: [], carry: null, comma: 2 });
    return finish(op, rows, steps);
}

function trimLeading(steps: ColStep[], row: number) {
    const ws = steps.flatMap(s => s.writes.filter(w => w.row === row)).sort((p, q) => q.exp - p.exp);
    for (const w of ws) { if (w.exp <= 0 || w.ch !== '0') break; w.ch = ''; }
}

function multiply(a: number, b: number): ColResult {
    const da = decOf(a), db = decOf(b);
    const A = scaled(a, da), B = scaled(b, db);
    const aCells = cellsOf(a, da), bCells = cellsOf(b, db);
    const rows: ColRow[] = [{ kind: 'a', cells: aCells, comma: da > 0 }, { kind: 'b', cells: bCells, comma: db > 0 }];
    const steps: ColStep[] = [];
    const aDigits = String(A).split('').reverse().map(Number);
    const bDigits = String(B).split('').reverse().map(Number);
    const many = bDigits.length > 1;
    const base = -(da + db); // hàng thấp nhất của tích (theo exp hiển thị)
    const partialRows: number[] = [];
    bDigits.forEach((m, j) => {
        const row = rows.length;
        rows.push({ kind: many ? 'partial' : 'result', cells: {}, comma: false });
        partialRows.push(row);
        let c = 0;
        aDigits.forEach((d, i) => {
            const p = d * m + c, last = i === aDigits.length - 1, exp = base + i + j;
            const head = `${m} nhân ${d} bằng ${d * m}${c ? `, thêm ${c} bằng ${p}` : ''}`;
            const lead = i === 0 && many ? (j === 0 ? `Lấy ${m} nhân với ${A}: ` : `Lấy ${m} nhân với ${A}, viết tích riêng lùi sang trái một cột: `) : '';
            if (last) {
                const writes = String(p).split('').reverse().map((ch, k) => ({ row, exp: exp + k, ch }));
                steps.push({ say: `${lead}${head}, viết ${p}.`, writes, carry: null });
            } else {
                const nc = Math.floor(p / 10);
                steps.push({ say: `${lead}${head}, viết ${p % 10}${nc ? ` nhớ ${nc}` : ''}.`, writes: [{ row, exp, ch: String(p % 10) }], carry: nc ? { exp: exp + 1, v: nc } : null });
                c = nc;
            }
        });
    });
    if (many) {
        const row = rows.length;
        rows.push({ kind: 'result', cells: {}, comma: false });
        // cộng các tích riêng theo cột
        const cols: Record<number, number[]> = {};
        for (const s of steps) for (const w of s.writes) (cols[w.exp] ??= []).push(Number(w.ch));
        const exps = Object.keys(cols).map(Number).sort((p, q) => p - q);
        let c = 0;
        exps.forEach((e, k) => {
            const ds = cols[e], sum = ds.reduce((x, y) => x + y, 0) + c, last = k === exps.length - 1;
            const head = ds.length > 1 ? `${ds.join(' cộng ')} bằng ${sum - c}${c ? `, thêm ${c} bằng ${sum}` : ''}` : c ? `${ds[0]} thêm ${c} bằng ${sum}` : `Hạ ${ds[0]}`;
            const lead = k === 0 ? 'Cộng các tích riêng: ' : '';
            if (last) steps.push({ say: `${lead}${head}, viết ${sum}.`, writes: String(sum).split('').reverse().map((ch, i) => ({ row, exp: e + i, ch })), carry: null });
            else { const nc = Math.floor(sum / 10); steps.push({ say: `${lead}${head}, viết ${sum % 10}${nc ? ` nhớ ${nc}` : ''}.`, writes: [{ row, exp: e, ch: String(sum % 10) }], carry: nc ? { exp: e + 1, v: nc } : null }); c = nc; }
        });
    }
    const res = rows.length - 1;
    // tích có chữ số 0 ở đầu không cần viết (vd 0,5 × 1)
    trimLeading(steps.filter(s => s.writes.some(w => w.row === res)), res);
    const k = da + db;
    if (k > 0) steps.push({ say: `Hai thừa số có tất cả ${k} chữ số ở phần thập phân, dùng dấu phẩy tách ở tích ra ${k} chữ số kể từ phải sang trái.`, writes: [], carry: null, comma: res });
    return finish('×', rows, steps);
}

function finish(op: ColOp, rows: ColRow[], steps: ColStep[]): ColResult {
    const res = rows.length - 1;
    // ghi kết quả cuối cùng vào các hàng (để vẽ khi đã xong tất cả bước)
    const full = rows.map(r => ({ ...r, cells: { ...r.cells } }));
    for (const s of steps) for (const w of s.writes) if (w.ch) full[w.row].cells[w.exp] = w.ch;
    const exps = full.flatMap(r => Object.keys(r.cells).map(Number));
    const cells = full[res].cells;
    const ks = Object.keys(cells).map(Number);
    const result = ks.reduce((sum, e) => sum + Number(cells[e]) * 10 ** e, 0);
    return { op, rows, steps, minExp: Math.min(...exps, 0), maxExp: Math.max(...exps, 0), result: Math.round(result * 1e9) / 1e9 };
}
