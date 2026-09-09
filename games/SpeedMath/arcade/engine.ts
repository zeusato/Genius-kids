import { makeBoard } from './content';
import type { ArcadeRecord, Config, Event, RoundKind, Session } from './model';
export const duration = (c: Config) => c.pace === 'calm' ? 60000 : 45000;
export const roundKinds = (c: Config): RoundKind[] => c.mode === 'cup' ? ['choice', 'match', 'order'] : [c.mode];
export const boardOf = (s: Session) => makeBoard(s.config, s.seed, s.round, s.boardIndex, s.rounds[s.round].kind);
export const normalize = (text: string) => text.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
export function createSession(config: Config, seed: number, id: string, studentId: string): Session {
    return { version: 1, id, studentId, seed: seed >>> 0, config: { ...config }, phase: 'ready', round: 0, boardIndex: 0,
        rounds: roundKinds(config).map(kind => ({ kind, points: 0, attempts: 0, firstCorrect: 0, solved: 0, elapsedMs: 0 })), remainingMs: duration(config), clockAt: 0, paused: false, listening: false,
        combo: 0, bestCombo: 0, selected: null, matched: [], order: [], mistakes: [], wrongPairs: [], input: '', feedback: '', lastCorrect: null, fx: 0, review: [] };
}
function advanceBoard(s: Session) { s.boardIndex++; s.input = ''; s.selected = null; s.matched = []; s.order = []; s.mistakes = []; s.wrongPairs = []; s.phase = 'playing'; }
function finishRound(s: Session) { s.phase = s.round === s.rounds.length - 1 ? 'finished' : 'between'; s.listening = false; s.feedback = 'Vòng chơi đã hoàn thành!'; s.fx++; }
function advanceTime(s: Session, now: number) {
    const delta = Math.max(0, now - s.clockAt);
    s.clockAt = now;
    if (s.phase !== 'playing' || s.paused || s.listening)
        return;
    // A suspended browser must not consume a whole round before visibility handlers run.
    if (delta > 2500) {
        s.paused = true;
        return;
    }
    const elapsed = Math.min(s.remainingMs, delta);
    s.remainingMs -= elapsed;
    // Derive elapsed from the countdown so fractional browser timestamps cannot
    // leave a completed round a few floating-point units short of its duration.
    s.rounds[s.round].elapsedMs = duration(s.config) - s.remainingMs;
    if (s.remainingMs === 0)
        finishRound(s);
}
function mark(s: Session, correct: boolean, unit: string, weight = 10) {
    const r = s.rounds[s.round], first = !s.mistakes.includes(unit);
    r.attempts++;
    s.lastCorrect = correct;
    s.fx++;
    s.listening = false;
    if (correct) {
        r.solved++;
        if (first) {
            r.firstCorrect++;
            s.combo++;
            s.bestCombo = Math.max(s.bestCombo, s.combo);
            const earned = Math.min(200 - r.points, weight + Math.min(5, Math.floor(s.combo / 3)));
            r.points += earned;
            s.feedback = earned === 0 ? 'Năng lượng vòng này đã đầy! Cùng giữ chuỗi đúng nhé.' : s.combo >= 3 ? `Chuỗi ${s.combo} câu đúng! +${earned} điểm` : `Chính xác! +${earned} điểm`;
        }
        else {
            s.feedback = 'Đã ghép đúng. Thử giữ chuỗi ở cặp tiếp theo nhé!';
        }
    }
    else {
        s.combo = 0;
        r.points = Math.max(0, r.points - 2);
        if (first)
            s.mistakes.push(unit);
        s.feedback = 'Chưa đúng. Mình thử lại nhé!';
        if (s.review.length < 30) {
            const b = boardOf(s);
            if (!s.review.some(x => x.prompt === b.prompt && x.answer === b.explanation))
                s.review.push({ prompt: b.prompt, answer: b.explanation });
        }
    }
}
export function reduce(input: Session, e: Event): Session {
    if (e.sessionId !== input.id || !Number.isFinite(e.now) || e.now < input.clockAt || input.phase === 'finished')
        return input;
    const s: Session = { ...input, rounds: input.rounds.map(r => ({ ...r })), matched: [...input.matched], order: [...input.order], mistakes: [...input.mistakes], wrongPairs: [...input.wrongPairs], review: [...input.review] };
    advanceTime(s, e.now);
    if (s.phase === 'finished')
        return s;
    if (e.type === 'pause') {
        s.paused = true;
        s.listening = false;
        return s;
    }
    if (e.type === 'resume') {
        s.paused = false;
        s.clockAt = e.now;
        return s;
    }
    if (e.type === 'tick')
        return s;
    if (s.paused)
        return s;
    if (e.type === 'start' && (s.phase === 'ready' || s.phase === 'between')) {
        if (s.phase === 'between') {
            s.round++;
            s.boardIndex = 0;
            s.selected = null;
            s.matched = [];
            s.order = [];
            s.mistakes = [];
            s.wrongPairs = [];
            s.combo = 0;
        }
        s.remainingMs = duration(s.config);
        s.phase = 'playing';
        s.feedback = 'Sẵn sàng! Mỗi đáp án đúng là một tia sáng.';
        s.lastCorrect = null;
        return s;
    }
    if (e.type === 'next' && (s.phase === 'review' || s.phase === 'boardDone')) {
        advanceBoard(s);
        s.feedback = 'Cùng tiếp tục thắp sáng sân khấu!';
        s.lastCorrect = null;
        return s;
    }
    if (s.phase !== 'playing')
        return s;
    if (e.type === 'listen') {
        s.listening = e.value;
        return s;
    }
    const b = boardOf(s);
    if (!('boardId' in e) || e.boardId !== b.id)
        return s;
    if (e.type === 'input' && b.kind === 'typing') {
        s.input = e.value.slice(0, 150);
        return s;
    }
    if (e.type === 'answer' && (b.kind === 'choice' || b.kind === 'typing')) {
        if (b.kind === 'choice' && !b.options.some(o => o.id === e.value))
            return s;
        if (b.kind === 'typing' && !normalize(e.value))
            return s;
        const correct = b.kind === 'typing' ? normalize(e.value) === normalize(b.answer[0]) : e.value === b.answer[0];
        mark(s, correct, b.id);
        if (correct)
            advanceBoard(s);
        else {
            s.phase = 'review';
            s.feedback = b.explanation;
        }
        return s;
    }
    if (b.kind === 'match') {
        if (e.type === 'select' && b.left!.some(t => t.id === e.value) && !s.matched.includes(e.value)) {
            s.selected = e.value;
            return s;
        }
        if (e.type === 'match' && s.selected !== null && !s.matched.includes(e.value) && b.options.some(t => t.id === e.value)) {
            const unit = s.selected, key = `${unit}:${e.value}`;
            if (s.wrongPairs.includes(key))
                return s;
            const correct = unit === e.value;
            mark(s, correct, unit);
            if (correct) {
                s.matched.push(unit);
                s.selected = null;
                if (s.matched.length === b.left!.length) {
                    s.phase = 'boardDone';
                    s.feedback = 'Tất cả các cặp đã nối đúng!';
                }
            }
            else {
                s.wrongPairs.push(key);
                s.feedback = 'Hai thẻ chưa khớp. Chọn một kết quả khác nhé.';
            }
            return s;
        }
    }
    if (b.kind === 'order') {
        if (e.type === 'place' && b.options.some(o => o.id === e.value) && !s.order.includes(e.value))
            s.order.push(e.value);
        if (e.type === 'remove' && Number.isInteger(e.index) && e.index >= 0 && e.index < s.order.length)
            s.order.splice(e.index, 1);
        if (e.type === 'undo')
            s.order.pop();
        if (e.type === 'check' && s.order.length === b.answer.length) {
            const correct = s.order.every((id, i) => id === b.answer[i]);
            mark(s, correct, b.id, 20);
            s.phase = correct ? 'boardDone' : 'review';
            s.feedback = correct ? 'Xếp đúng rồi! Các thẻ đã ở đúng vị trí.' : b.explanation;
        }
    }
    return s;
}
export function recordOf(s: Session): ArcadeRecord {
    const attempts = s.rounds.reduce((n, r) => n + r.attempts, 0), first = s.rounds.reduce((n, r) => n + r.firstCorrect, 0), accuracy = attempts ? Math.round(first / attempts * 100) : 0;
    const least = Math.min(...s.rounds.map(r => r.points));
    const medal = s.phase !== 'finished' || s.config.mode !== 'cup' ? null : least >= 100 && accuracy >= 90 ? 'gold' : least >= 60 && accuracy >= 80 ? 'silver' : least >= 30 && accuracy >= 60 ? 'bronze' : null;
    return { version: 1, config: s.config, seed: s.seed, rounds: s.rounds, accuracy, bestCombo: s.bestCombo, medal };
}
export function validConfig(v: unknown): v is Config {
    if (!v || typeof v !== 'object')
        return false;
    const c = v as Config;
    return Number.isInteger(c.grade) && c.grade >= 1 && c.grade <= 5 && ['easy', 'medium', 'hard'].includes(c.difficulty) && ['calm', 'challenge'].includes(c.pace) && ['mixed', 'math', 'observe', 'words', 'knowledge'].includes(c.topic) && ['cup', 'choice', 'match', 'order', 'typing'].includes(c.mode) && ['station', 'garden', 'stars'].includes(c.theme);
}
export function validSession(v: unknown): v is Session {
    try {
        if (!v || typeof v !== 'object')
            return false;
        const s = v as Session;
        if (s.version !== 1 || !validConfig(s.config) || typeof s.id !== 'string' || s.id.length > 100 || typeof s.studentId !== 'string' || !Number.isInteger(s.seed) || s.seed < 0 || s.seed > 0xffffffff)
            return false;
        if (!['ready', 'playing', 'review', 'boardDone', 'between', 'finished'].includes(s.phase) || typeof s.paused !== 'boolean' || typeof s.listening !== 'boolean')
            return false;
        if (!Array.isArray(s.rounds) || s.rounds.length !== roundKinds(s.config).length || !Number.isInteger(s.round) || s.round < 0 || s.round >= s.rounds.length)
            return false;
        if (s.phase === 'finished' && (s.round !== s.rounds.length - 1 || s.remainingMs !== 0))
            return false;
        const integer = (n: number, max: number) => Number.isInteger(n) && n >= 0 && n <= max;
        if (!integer(s.boardIndex, 10000) || !integer(s.combo, 10000) || !integer(s.bestCombo, 10000) || s.bestCombo < s.combo || !integer(s.fx, 100000) || !Number.isFinite(s.clockAt) || s.clockAt < 0)
            return false;
        if (!Number.isFinite(s.remainingMs) || s.remainingMs < 0 || s.remainingMs > duration(s.config))
            return false;
        if (typeof s.input !== 'string' || s.input.length > 150)
            return false;
        if (!s.rounds.every((r, i) => r.kind === roundKinds(s.config)[i] && integer(r.points, 200) && integer(r.attempts, 10000) && integer(r.solved, r.attempts) && integer(r.firstCorrect, r.solved) && Number.isFinite(r.elapsedMs) && r.elapsedMs >= 0 && r.elapsedMs <= duration(s.config)))
            return false;
        if (s.rounds.some((r, i) => i < s.round && r.elapsedMs !== duration(s.config)))
            return false;
        if (Math.abs(s.rounds[s.round].elapsedMs + s.remainingMs - duration(s.config)) > 0.01)
            return false;
        if (s.phase === 'finished' && s.rounds.some(r => r.elapsedMs !== duration(s.config)))
            return false;
        const b = boardOf(s), ids = b.options.map(o => o.id);
        if (![s.matched, s.order, s.mistakes, s.wrongPairs].every(a => Array.isArray(a) && a.length <= 30 && a.every(x => typeof x === 'string' && x.length < 100)))
            return false;
        if (new Set(s.matched).size !== s.matched.length || new Set(s.order).size !== s.order.length || ![...s.matched, ...s.order].every(x => ids.includes(x)))
            return false;
        if (s.selected !== null && (!b.left?.some(t => t.id === s.selected) || s.matched.includes(s.selected)))
            return false;
        return typeof s.feedback === 'string' && s.feedback.length < 2000 && [true, false, null].includes(s.lastCorrect) && Array.isArray(s.review) && s.review.length <= 30 && s.review.every(x => typeof x.prompt === 'string' && x.prompt.length < 1000 && typeof x.answer === 'string' && x.answer.length < 2000);
    }
    catch {
        return false;
    }
}
