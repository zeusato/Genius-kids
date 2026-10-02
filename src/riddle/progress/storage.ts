import { validRound, type RoundState } from '../engine/round';

// Mọi truy cập localStorage của Đố Vui đều bọc try/catch: chế độ riêng tư / bộ nhớ đầy không được làm hỏng ván chơi.
const draftKey = (owner: string) => `riddle-draft:${owner}`;
const legacyKey = (owner: string) => `sphinx_profile_${owner}`;
const DRAFT_TTL = 24 * 3600 * 1000;

export function readDraft(owner: string, now = Date.now()): RoundState | null {
    try {
        const raw = localStorage.getItem(draftKey(owner));
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!validRound(s) || s.owner !== owner || s.phase === 'summary' || now - Date.parse(s.updatedAt) > DRAFT_TTL) { localStorage.removeItem(draftKey(owner)); return null; }
        return s;
    } catch { return null; }
}
export function saveDraft(s: RoundState): void {
    try { localStorage.setItem(draftKey(s.owner), JSON.stringify({ ...s, updatedAt: new Date().toISOString() })); } catch { /* chơi tiếp, chỉ không tiếp tục được sau khi tải lại */ }
}
export function clearDraft(owner: string): void {
    try { localStorage.removeItem(draftKey(owner)); } catch { /* noop */ }
}

/** Danh sách câu đã giải ở bản cũ; null nếu không có. */
export function readLegacyIds(owner: string): string[] | null {
    try {
        const raw = localStorage.getItem(legacyKey(owner));
        if (!raw) return null;
        const v = JSON.parse(raw);
        return Array.isArray(v?.answeredRiddleIds) ? v.answeredRiddleIds.filter((x: unknown) => typeof x === 'string') : null;
    } catch { return null; }
}
export function clearLegacy(owner: string): void {
    try { localStorage.removeItem(legacyKey(owner)); } catch { /* noop */ }
}
export function clearRiddleData(owner: string): void { clearDraft(owner); clearLegacy(owner); }
