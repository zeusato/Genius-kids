// ============================================================================
//  Hiển thị công thức cho trẻ (plugin remark cho react-markdown):
//  - Phân số "3/4" → tử số trên, mẫu số dưới, có gạch phân số.
//  - Hỗn số "2 3/4" (phần phân số < 1) → phần nguyên + phân số.
//  - Dấu trừ " - " giữa hai số → " − ".
//  CHỈ đổi cách hiển thị: dữ liệu câu, chấm điểm (parseValue) và TTS vẫn dùng chuỗi "a/b".
//  Không đụng ngày tháng ("ngày 27/1", "2/9/2026") và đơn vị chữ ("km/giờ").
// ============================================================================

interface MdNode { type: string; value?: string; children?: MdNode[]; data?: Record<string, unknown> }
interface HNode { type: 'element' | 'text'; tagName?: string; properties?: Record<string, unknown>; children?: HNode[]; value?: string }

const FRACTION = /(?<![\p{L}\d/,.])(?<![Nn]gày[  ])(?:(\d+)[  ](?=\d+\/\d))?(\d+)\/(\d+)(?![\d/])/gu;
const MINUS = /(?<=[\p{L}\d)²³%°] )-(?= [\d(])/gu; // "16 - 8", "28 cm - 1 cm"; không đụng "1-2", "thứ Hai - thứ Ba"

const span = (cls: string, children: HNode[]): HNode => ({ type: 'element', tagName: 'span', properties: { className: [cls] }, children });
const text = (value: string): HNode => ({ type: 'text', value });
const fraction = (num: string, den: string): HNode => span('mfrac', [span('mfrac-num', [text(num)]), span('mfrac-den', [text(den)])]);

function mathNode(whole: string | undefined, num: string, den: string): MdNode {
    return {
        type: 'mathFraction',
        data: {
            hName: 'span',
            hProperties: { className: [whole ? 'mmixed' : 'mfrac-wrap'], role: 'math', 'aria-label': whole ? `${whole} và ${num} phần ${den}` : `${num} phần ${den}` },
            hChildren: whole ? [span('mmixed-whole', [text(whole)]), fraction(num, den)] : [fraction(num, den)],
        },
    };
}

/** Tách một đoạn chữ thành chữ thường + phân số / hỗn số (để dựng HTML). */
export function splitMathText(value: string): MdNode[] {
    const s = value.replace(MINUS, '−');
    const out: MdNode[] = [];
    let last = 0;
    for (const m of s.matchAll(FRACTION)) {
        const num = m[2], den = m[3];
        let whole: string | undefined = m[1];
        let start = m.index ?? 0;
        const end = start + m[0].length;
        if (Number(den) === 0) continue;
        // "3 5/2" không phải hỗn số (phần phân số ≥ 1): giữ số 3, chỉ dựng phân số 5/2
        if (whole && Number(num) >= Number(den)) { start += whole.length + 1; whole = undefined; }
        if (start > last) out.push({ type: 'text', value: s.slice(last, start) });
        out.push(mathNode(whole, num, den));
        last = end;
    }
    if (last < s.length) out.push({ type: 'text', value: s.slice(last) });
    return out;
}

const SKIP = new Set(['inlineCode', 'code', 'inlineMath', 'math', 'html']);
function walk(node: MdNode) {
    if (!node.children) return;
    const next: MdNode[] = [];
    for (const child of node.children) {
        if (child.type === 'text' && child.value) next.push(...splitMathText(child.value));
        else { if (!SKIP.has(child.type)) walk(child); next.push(child); }
    }
    node.children = next;
}

/** remark plugin: phân số / hỗn số xếp tử–mẫu, dấu trừ chuẩn. */
export function remarkMathText() {
    return (tree: MdNode) => walk(tree);
}
