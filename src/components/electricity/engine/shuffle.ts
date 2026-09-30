/** Hoán vị cố định theo hạt giống (cùng hạt giống → cùng thứ tự), để đáp án đúng không luôn đứng đầu. */
export function seededOrder(n: number, seed: string): number[] {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    const idx = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        const j = (h >>> 0) % (i + 1);
        [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
}
