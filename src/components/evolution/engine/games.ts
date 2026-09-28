// Logic 3 trò chơi — thuần, RNG có seed truyền vào.
import { JOURNEY_STOPS, KeyNext, MYSTERY_KEY, RelativesQ } from '../../../data/evolution/games';
import { idx, isAncestor, mrca, EvoTree, pathToRoot } from './tree';

/** Đáp án đúng theo cấu trúc cây: lựa chọn có tổ tiên chung với a SÂU hơn. null = hòa (câu hỏng). */
export function relativesAnswer(t: EvoTree, q: RelativesQ): string | null {
    const a = idx(t, q.a), b = idx(t, q.b), c = idx(t, q.c);
    const db = t.nodes[mrca(t, a, b)].depth, dc = t.nodes[mrca(t, a, c)].depth;
    return db === dc ? null : db > dc ? q.b : q.c;
}

export function keyTruth(t: EvoTree, qid: string, targetId: string): boolean {
    return isAncestor(t, idx(t, MYSTERY_KEY[qid].truth), idx(t, targetId));
}

export function keyStep(qid: string, yes: boolean): KeyNext {
    const q = MYSTERY_KEY[qid];
    return yes ? q.yes : q.no;
}

/** Đi hết khóa bằng câu trả lời đúng cho target — trả về kết quả cuối (để kiểm khóa). */
export function solveKey(t: EvoTree, start: string, targetId: string): { result: string; path: string[] } {
    const path: string[] = [];
    let cur: KeyNext = { q: start };
    for (let guard = 0; 'q' in cur && guard < 40; guard++) {
        path.push(cur.q);
        cur = keyStep(cur.q, keyTruth(t, cur.q, targetId));
    }
    return { result: 'result' in cur ? cur.result : '', path };
}

/** Các điểm dừng từ ngọn về gốc. */
export function journeyStops(t: EvoTree, leafId: string): number[] {
    return pathToRoot(t, idx(t, leafId)).slice(1).filter(i => JOURNEY_STOPS.has(t.nodes[i].id));
}

export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let x = Math.imul(a ^ (a >>> 15), 1 | a);
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

export function pickRound<T>(bank: T[], n: number, rnd: () => number): T[] {
    const a = [...bank];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a.slice(0, n);
}
