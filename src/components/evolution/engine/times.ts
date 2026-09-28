// Gán thời gian cho mọi node (data-spec F1) + câu hiển thị thời gian.
import { CHAIN_NOTES, EXTINCT, LEAF_FIRST, SPLIT_TIMES } from '../../../data/evolution/times';
import { EARTH_MA, formatMa, fracEras, maAtFrac } from './timeScale';
import type { EvoTree } from './tree';

export interface NodeTimes {
    /** Thời điểm của node (Ma): node rẽ nhánh = tổ tiên chung; ngọn = mốc cuối (0 hoặc lúc tuyệt chủng). */
    ma: Float64Array;
    /** Mốc cuối của cành dẫn tới node (= ma, giữ riêng cho dễ đọc). */
    endMa: Float64Array;
    /** 1 = nội suy (node chuỗi một con) — không hiện con số. */
    approx: Uint8Array;
}

export function resolveTimes(t: EvoTree): NodeTimes {
    const n = t.nodes.length;
    const ma = new Float64Array(n).fill(NaN);
    const approx = new Uint8Array(n);
    const endOf = (i: number) => {
        const node = t.nodes[i];
        if (node.isLeaf) return EXTINCT[node.id]?.endMa ?? 0;
        return SPLIT_TIMES[node.id].ma;
    };
    ma[0] = EARTH_MA;
    const assign = (i: number) => {
        const node = t.nodes[i];
        if (i !== 0 && Number.isNaN(ma[i])) {
            if (SPLIT_TIMES[node.id]) ma[i] = SPLIT_TIMES[node.id].ma;
            else if (node.isLeaf) ma[i] = endOf(i);
            else {
                // chuỗi node một-con liền nhau: cách đều theo bán kính (thang đại) giữa cha và mốc kế tiếp
                const chain: number[] = [];
                let c = i;
                while (t.nodes[c].children.length === 1 && !SPLIT_TIMES[t.nodes[c].id]) { chain.push(c); c = t.nodes[c].children[0]; }
                const tEnd = t.nodes[c].isLeaf ? endOf(c) : SPLIT_TIMES[t.nodes[c].id]?.ma;
                if (tEnd === undefined) throw new Error(`Node rẽ nhánh thiếu thời gian: ${t.nodes[c].id}`);
                const fA = fracEras(ma[node.parent]), fB = fracEras(tEnd);
                chain.forEach((x, k) => { ma[x] = maAtFrac(fA + (fB - fA) * (k + 1) / (chain.length + 1), 0); approx[x] = 1; });
            }
        }
        node.children.forEach(assign);
    };
    assign(0);
    return { ma, endMa: ma, approx };
}

const VAGUE = 'Rất xa xưa. Các nhà khoa học vẫn đang tìm hiểu chính xác.';

/** Câu thời gian trên thẻ (data-spec F2). */
export function displayTime(t: EvoTree, times: NodeTimes, i: number): string {
    const node = t.nodes[i];
    const id = node.id;
    if (i === 0) return 'Sự sống bắt đầu từ hơn 3,7 tỷ năm trước, có thể còn sớm hơn.';
    if (EXTINCT[id]) return EXTINCT[id].show.replace(/^./, c => c.toUpperCase());
    if (LEAF_FIRST[id]) return cap(LEAF_FIRST[id].show);
    const s = SPLIT_TIMES[id];
    if (s) {
        if (s.show) return cap(s.show);
        if (s.conf !== 'thap') return cap(`tổ tiên chung sống ${formatMa(s.ma)}`);
        return VAGUE;
    }
    if (CHAIN_NOTES[id]) return CHAIN_NOTES[id];
    if (node.isLeaf) return 'Vẫn đang sống ngày nay.';
    return 'Chưa có số liệu thời gian chính xác cho nhóm này.';
}

/** Câu thời gian của tổ tiên chung (dùng cho trò chơi) — luôn có một câu hiểu được. */
export function ancestorTime(t: EvoTree, times: NodeTimes, i: number): string {
    const s = SPLIT_TIMES[t.nodes[i].id];
    if (s && s.conf !== 'thap') return formatMa(s.ma);
    if (s?.show) return s.show;
    return times.ma[i] >= 1000 ? 'hơn 1 tỷ năm trước' : formatMa(times.ma[i]);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
