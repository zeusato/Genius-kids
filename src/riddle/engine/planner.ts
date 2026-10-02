import type { GateId, Riddle, RiddleLang, RiddleLevel } from '../content/types';
import { GATES, GATE_STONES } from '../content/gates';
import type { RiddleProgress } from '../progress/model';
import { answerKey } from './normalize';

type Rng = () => number;
export type RoundKind = 'journey' | 'gate' | 'review' | 'daily' | 'replay';

export const localDay = (d: Date = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const roundSize = (grade: number) => (grade <= 1 ? 4 : 5);
export const maxLevel = (grade: number): RiddleLevel => (grade <= 2 ? 2 : 3);
export const langOf = (gate: GateId): RiddleLang => (gate === 'world' ? 'en' : 'vi');
const eligible = (gate: GateId, grade: number) => (GATES.find(g => g.id === gate)?.minGrade ?? 1) <= grade;

/** Mức câu tiếp theo: làm tròn chỉ số, 20% số câu lấy thấp hơn một mức để giữ tự tin. */
export function targetLevel(rating: number, grade: number, rng: Rng): RiddleLevel {
    let lv = Math.round(rating);
    if (rng() < 0.2) lv -= 1;
    return Math.max(1, Math.min(maxLevel(grade), lv)) as RiddleLevel;
}

export const isSolved = (p: RiddleProgress, id: string) => !!p.solved[id] && p.solved[id].seals > 0;

export function gateStones(p: RiddleProgress, gate: GateId, pool: Riddle[]): number {
    return Math.min(GATE_STONES, pool.filter(r => r.gate === gate && isSolved(p, r.id)).length);
}
export function gateCounts(p: RiddleProgress, gate: GateId, pool: Riddle[]) {
    const list = pool.filter(r => r.gate === gate);
    return { total: list.length, solved: list.filter(r => isSolved(p, r.id)).length };
}

/** Cổng hành trình: cổng đầu tiên (theo thứ tự) chưa mở, hợp lớp, còn câu chưa giải. */
export function journeyGate(p: RiddleProgress, grade: number, pool: Riddle[]): GateId | null {
    const open = GATES.filter(g => eligible(g.id, grade));
    const pending = open.find(g => !p.gates[g.id] && pool.some(r => r.gate === g.id && !isSolved(p, r.id) && r.level <= maxLevel(grade)));
    if (pending) return pending.id;
    let best: GateId | null = null, most = 0;
    for (const g of open) {
        const n = pool.filter(r => r.gate === g.id && !isSolved(p, r.id)).length;
        if (n > most) { most = n; best = g.id; }
    }
    return best;
}

function pickByLevel(cands: Riddle[], level: RiddleLevel, rng: Rng): Riddle | undefined {
    for (const d of [0, -1, 1, -2, 2]) {
        const at = cands.filter(r => r.level === level + d);
        if (at.length) return at[Math.floor(rng() * at.length)];
    }
    return undefined;
}

export interface PlanOptions { pool: Riddle[]; progress: RiddleProgress; grade: number; kind: RoundKind; gate?: GateId; now?: Date; rng?: Rng; size?: number }

export function planRound(o: PlanOptions): string[] {
    const { pool, progress: p, grade } = o;
    const rng = o.rng ?? Math.random, now = o.now ?? new Date();
    const size = o.size ?? roundSize(grade);
    const byId = new Map(pool.map(r => [r.id, r]));
    const picked: Riddle[] = [];
    const answers = new Set<string>();
    const take = (r: Riddle | undefined) => {
        if (!r || picked.includes(r) || answers.has(answerKey(r.answer))) return false;
        picked.push(r); answers.add(answerKey(r.answer)); return true;
    };
    const due = p.review.filter(x => byId.has(x.id) && x.due <= now.toISOString()).sort((a, b) => a.due.localeCompare(b.due));

    if (o.kind === 'daily') return [dailyId(localDay(now), pool)].filter(Boolean) as string[];
    if (o.kind === 'review') {
        const all = [...due, ...p.review.filter(x => byId.has(x.id) && !due.includes(x)).sort((a, b) => a.due.localeCompare(b.due))];
        for (const x of all) { if (picked.length >= size) break; take(byId.get(x.id)); }
        return picked.map(r => r.id);
    }

    const gate = o.gate ?? journeyGate(p, grade, pool);
    if (!gate) return [];
    const lang = langOf(gate);
    const lvMax = maxLevel(grade);
    const fresh = (g: GateId) => pool.filter(r => r.gate === g && !isSolved(p, r.id) && !p.review.some(x => x.id === r.id) && (o.kind === 'gate' || r.level <= lvMax));
    let newSlots = size;
    if (o.kind === 'journey') {
        const rev = due.map(x => byId.get(x.id)!).find(r => langOf(r.gate) === lang);
        if (take(rev)) newSlots--;
        // Xen một câu của cổng khác cùng ngôn ngữ để không học dồn một chủ đề.
        const others = GATES.filter(g => g.id !== gate && eligible(g.id, grade) && langOf(g.id) === lang).map(g => g.id);
        if (others.length && size >= 4) {
            const other = others[Math.floor(rng() * others.length)];
            if (take(pickByLevel(fresh(other), targetLevel(p.rating[lang], grade, rng), rng))) newSlots--;
        }
    }
    let cands = fresh(gate);
    for (let i = 0; i < newSlots && cands.length; i++) {
        const lv = o.kind === 'gate' ? targetLevel(p.rating[lang], 3, rng) : targetLevel(p.rating[lang], grade, rng);
        const r = pickByLevel(cands, lv, rng);
        cands = cands.filter(c => c !== r);
        if (!take(r)) i--;
    }
    // Hết câu mới: chơi lại câu cũ của cổng (ít dấu ấn trước).
    if (picked.length < size) {
        const again = pool.filter(r => r.gate === gate && !picked.includes(r)).sort((a, b) => (p.solved[a.id]?.seals ?? 0) - (p.solved[b.id]?.seals ?? 0) || rng() - 0.5);
        for (const r of again) { if (picked.length >= size) break; take(r); }
    }
    // Câu ôn đặt giữa chặng, không mở đầu bằng câu khó.
    return shuffleKeepFirstEasy(picked, rng).map(r => r.id);
}

function shuffleKeepFirstEasy(list: Riddle[], rng: Rng): Riddle[] {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    const easiest = a.reduce((m, r, i) => (r.level < a[m].level ? i : m), 0);
    [a[0], a[easiest]] = [a[easiest], a[0]];
    return a;
}

/** Câu đố hôm nay: cùng một câu cho mọi hồ sơ trong ngày. */
export function dailyId(day: string, pool: Riddle[]): string | undefined {
    const list = pool.filter(r => r.lang === 'vi' && r.level <= 2 && (r.kind === 'object' || r.kind === 'logic')).sort((a, b) => a.id.localeCompare(b.id));
    if (!list.length) return undefined;
    let h = 2166136261;
    for (const c of day) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return list[(h >>> 0) % list.length].id;
}
