import { APPROACH, Config, GATE, PACES, Racer, RacingRecord, SEGMENT, Session, normalizeConfig, raceQuestionCount } from './model';
import { questionsFor, rng } from './questions';
import { legacyQuestionsFor } from './legacyQuestions';
import { rivalDecision } from './rivals';
export function createSession(config: Config, seed: number, id: string, studentId: string, questionVersion: 1 | 2 = 2, lengthVersion: 1 | 2 = questionVersion === 1 ? 1 : 2): Session {
    const c = normalizeConfig(config, config.grade), count = raceQuestionCount(c, lengthVersion);
    const random = rng(seed ^ 901), objects: Session['objects'] = [];
    for (let i = 0; i < count; i++) {
        const lane = Math.floor(random() * 3);
        // One clear driving decision per short gap. No cone immediately after
        // starting, and no obstacle/energy collision during the reading zone.
        const cone = c.mode !== 'practice' && (c.mode === 'quick' || c.mission >= 2) && i % 2 === 1;
        objects.push({ id: i, at: i * SEGMENT + 26, lane, type: cone ? 'cone' : 'energy', hit: false });
    }
    const generate = questionVersion === 1 ? legacyQuestionsFor : questionsFor;
    const source = generate(c, seed, c.review?.length ? Math.max(...c.review) + 1 : count);
    return { version: 2, ...(questionVersion === 2 ? { questionVersion: 2 as const } : {}), ...(lengthVersion === 2 ? { lengthVersion: 2 as const } : {}), id, studentId, seed, config: c, phase: 'ready', paused: false, elapsed: 0,
        racers: Array.from({ length: 4 }, (_, i) => ({ distance: -i * 4, lane: i ? i - 1 : 1, target: i ? i - 1 : 1, energy: 0, boost: 0, penalty: 0, answered: 0, finishAt: null, combo: 0 })),
        questions: c.review?.length ? c.review.map(i => source[i]) : source, objects, answers: [], selected: false, queuedBoost: false, collisions: 0, nitros: 0, bestCombo: 0, fx: 0, feedback: '', feedbackUntil: 0, lastCorrect: null };
}
export const finishDistance = (s: Session) => s.questions.length * SEGMENT + 30;
export function questionIndex(r: Racer, count: number) { const i = Math.max(0, Math.floor(r.distance / SEGMENT)); return i < count && r.answered === i && r.distance >= i * SEGMENT + APPROACH ? i : -1; }
export const activeQuestion = (s: Session) => questionIndex(s.racers[0], s.questions.length);
export function readSeconds(s: Session, i: number) { const q = s.questions[i]; return PACES.find(p => p.id === s.config.pace)!.seconds + (q?.readBonus ?? (q?.kind === 'two-step' ? 3 : q?.kind === 'missing' ? 1.5 : 0)); }
export function speedFor(s: Session, r: Racer, index: number) {
    const qi = questionIndex(r, s.questions.length);
    if (qi >= 0) return (GATE - APPROACH) / readSeconds(s, qi);
    return PACES.find(p => p.id === s.config.pace)!.speed * (r.boost > 0 ? 1.7 : r.penalty > 0 ? .55 : 1) * (index ? .975 + index * .008 : 1);
}
export function rankOf(s: Session) {
    if (s.config.mode === 'practice') return 1;
    const me = s.racers[0];
    return 1 + s.racers.slice(1).filter(r => me.finishAt !== null ? r.finishAt !== null && r.finishAt < me.finishAt : r.distance > me.distance).length;
}
export function notify(s: Session, message: string, correct: boolean | null = null) { s.feedback = message; s.feedbackUntil = s.elapsed + 2; s.fx++; s.lastCorrect = correct; }
export function chooseLane(s: Session, target: number, gateId?: number) {
    if (s.phase !== 'racing' || s.paused || s.answerRush || !Number.isInteger(target) || target < 0 || target > 2) return;
    if (gateId !== undefined && gateId !== activeQuestion(s)) return;
    s.racers[0].target = target;
    if (activeQuestion(s) >= 0) s.selected = true;
}
/** Commit once, then travel to the gate on the normal fixed-step render clock. */
export function answerNow(s: Session, gateId: number) {
    if (s.phase !== 'racing' || s.paused || s.answerRush || !s.selected || gateId < 0 || gateId !== activeQuestion(s)) return;
    const me = s.racers[0], remaining = gateId * SEGMENT + GATE - me.distance;
    if (remaining <= 0) return;
    s.answerRush = { question: gateId, lane: me.target, from: me.distance, startedAt: s.elapsed, duration: Math.min(.75, remaining / speedFor(s, me, 0)) };
}
export function useNitro(s: Session) {
    if (s.phase !== 'racing' || s.paused || s.racers[0].energy < 100 || s.racers[0].boost > 0) return;
    if (activeQuestion(s) >= 0) { s.queuedBoost = true; return; }
    s.racers[0].energy = 0; s.racers[0].boost = 2.5; s.queuedBoost = false; s.nitros++; notify(s, 'Bứt tốc!');
}
function resolveGate(s: Session, r: Racer, i: number, index: number) {
    const q = s.questions[i], correct = q.options[r.target] === q.answer;
    delete r.thought; delete r.answerRush;
    r.answered++;
    if (correct) { r.combo++; r.energy = Math.min(100, r.energy + 25 + (r.combo >= 3 ? 5 : 0)); }
    else { r.combo = 0; r.penalty = .8; }
    if (!index) {
        s.answers.push({ question: i, selected: q.options[r.target], correct }); s.selected = false; s.bestCombo = Math.max(s.bestCombo, r.combo);
        delete s.answerRush;
        notify(s, correct ? `Chính xác! ${q.explanation}` : `Cùng nhớ nhé: ${q.explanation}`, correct);
    }
}
/** Mutates an isolated simulation snapshot; long callbacks are subdivided to avoid tunnelling. */
export function step(s: Session, seconds: number) {
    if (s.phase !== 'racing' || s.paused || !Number.isFinite(seconds) || seconds <= 0) return;
    let remaining = Math.min(seconds, .25);
    while (remaining > .00001 && s.phase === 'racing') { const dt = Math.min(remaining, 1 / 60); advance(s, dt); remaining -= dt; }
}
function advance(s: Session, dt: number) {
    const me = s.racers[0], qi = activeQuestion(s);
    if (s.config.waitForChoice && qi >= 0 && !s.selected && me.distance >= qi * SEGMENT + GATE - 8) { me.lane += (me.target - me.lane) * Math.min(1, dt * 14); return; }
    s.elapsed += dt;
    if ((s.queuedBoost || s.config.autoNitro) && qi < 0) useNitro(s);
    s.racers.forEach((r, index) => {
        if (r.finishAt !== null || (index && s.config.mode === 'practice')) return;
        const q = questionIndex(r, s.questions.length), prev = r.distance;
        if (index && q >= 0 && !r.answerRush) {
            if (!r.thought) r.thought = { question: q, startedAt: s.elapsed, ...rivalDecision(s.seed, s.config.difficulty, s.questions[q], index, readSeconds(s, q)) };
            const remaining = q * SEGMENT + GATE - r.distance;
            if (s.elapsed - r.thought.startedAt >= r.thought.delay || remaining / speedFor(s, r, index) <= .75) {
                r.target = r.thought.lane;
                r.answerRush = { question: q, lane: r.target, from: r.distance, startedAt: s.elapsed, duration: Math.min(.75, remaining / speedFor(s, r, index)) };
            }
        }
        if (index && q < 0 && r.energy >= 100 && r.boost <= 0) { r.energy = 0; r.boost = 2.5; }
        const speed = speedFor(s, r, index), rush = index === 0 ? s.answerRush : r.answerRush;
        if (rush) {
            const t = Math.min(1, (s.elapsed - rush.startedAt) / rush.duration);
            const eased = t * t * (3 - 2 * t);
            const gate = rush.question * SEGMENT + GATE;
            r.distance = t === 1 ? gate : rush.from + (gate - rush.from) * eased;
            r.target = rush.lane;
        } else r.distance += speed * dt;
        r.lane += (r.target - r.lane) * Math.min(1, dt * 13);
        if (q < 0) { r.boost = Math.max(0, r.boost - dt); r.penalty = Math.max(0, r.penalty - dt); }
        const i = r.answered;
        if (i < s.questions.length && prev < i * SEGMENT + GATE && r.distance >= i * SEGMENT + GATE) resolveGate(s, r, i, index);
        if (!index) for (const o of s.objects) {
            if (!o.hit && prev < o.at && r.distance >= o.at) { o.hit = true;
                if (r.target === o.lane) { if (o.type === 'energy') { r.energy = Math.min(100, r.energy + 10); notify(s, '+10 năng lượng'); }
                    else { s.collisions++; r.penalty = .8; notify(s, 'Chạm cọc rồi! Mình thử làn khác nhé.'); } }
            }
        }
        if (index && q < 0) r.target = Math.floor(rng(s.seed + index * 79 + Math.floor(r.distance / 110))() * 3);
        if (r.distance >= finishDistance(s)) { r.finishAt = s.elapsed - (r.distance - finishDistance(s)) / speed; r.distance = finishDistance(s); }
    });
    if (me.finishAt !== null) { s.phase = 'finished'; notify(s, 'Về đích!', true); }
}
export function recordOf(s: Session): RacingRecord {
    const correct = s.answers.filter(a => a.correct).length, total = s.questions.length, accuracy = Math.round(correct / total * 100);
    return { version: 2, ...(s.questionVersion === 2 ? { questionVersion: 2 as const } : {}), config: { ...s.config }, seed: s.seed, accuracy, correct, total, rank: rankOf(s), bestCombo: s.bestCombo, collisions: s.collisions, nitros: s.nitros, stars: s.phase === 'finished' ? accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1 : 0, review: s.answers.filter(a => !a.correct).map(a => s.questions[a.question]) };
}
export function validSession(value: unknown): value is Session {
    try {
        const s = value as Session;
        if (!s || s.version !== 2 || typeof s.id !== 'string' || !s.id || typeof s.studentId !== 'string' || !Number.isInteger(s.seed) || !s.config) return false;
        if (JSON.stringify(normalizeConfig(s.config, s.config.grade)) !== JSON.stringify(s.config)) return false;
        if (!['ready', 'racing', 'finished'].includes(s.phase) || typeof s.paused !== 'boolean' || !Number.isFinite(s.elapsed) || s.elapsed < 0 || s.elapsed > 86400) return false;
        if (s.questionVersion !== undefined && s.questionVersion !== 2) return false;
        if (s.lengthVersion !== undefined && s.lengthVersion !== 2) return false;
        const reference = createSession(s.config, s.seed, s.id, s.studentId, s.questionVersion ?? 1, s.lengthVersion ?? 1);
        if (JSON.stringify(s.questions) !== JSON.stringify(reference.questions) || s.racers.length !== 4 || s.answers.length > s.questions.length) return false;
        if (!s.racers.every(r => Number.isFinite(r.distance) && r.distance >= -12 && r.distance <= finishDistance(s) && Number.isFinite(r.lane) && r.lane >= 0 && r.lane <= 2 && Number.isInteger(r.target) && r.target >= 0 && r.target <= 2 && Number.isFinite(r.energy) && r.energy >= 0 && r.energy <= 100 && Number.isFinite(r.boost) && r.boost >= 0 && r.boost <= 2.5 && Number.isFinite(r.penalty) && r.penalty >= 0 && r.penalty <= .8 && Number.isInteger(r.answered) && r.answered >= 0 && r.answered <= s.questions.length && (r.finishAt === null || Number.isFinite(r.finishAt) && r.finishAt >= 0 && r.finishAt <= s.elapsed))) return false;
        if (s.answers.some((a, i) => a.question !== i || !s.questions[i].options.includes(a.selected) || a.correct !== (a.selected === s.questions[i].answer))) return false;
        if (s.racers[0].answered !== s.answers.length || s.objects.length !== reference.objects.length || s.objects.some((o, i) => JSON.stringify({ ...o, hit: false }) !== JSON.stringify(reference.objects[i]) || typeof o.hit !== 'boolean')) return false;
        for (let index = 0; index < s.racers.length; index++) {
            const r = s.racers[index], thought = r.thought, rush = r.answerRush;
            if (!index || s.config.mode === 'practice') { if (thought !== undefined || rush !== undefined) return false; continue; }
            if (thought !== undefined) {
                const q = questionIndex(r, s.questions.length);
                if (!thought || q < 0 || thought.question !== q || !Number.isFinite(thought.startedAt) || thought.startedAt < 0 || thought.startedAt > s.elapsed) return false;
                const expected = rivalDecision(s.seed, s.config.difficulty, s.questions[q], index, readSeconds(s, q));
                if (thought.lane !== expected.lane || thought.delay !== expected.delay) return false;
            }
            if (rush !== undefined) {
                if (!rush || !thought || rush.question !== thought.question || rush.lane !== thought.lane || rush.lane !== r.target
                    || !Number.isFinite(rush.from) || rush.from < rush.question * SEGMENT + APPROACH || rush.from > r.distance
                    || !Number.isFinite(rush.startedAt) || rush.startedAt < thought.startedAt || rush.startedAt > s.elapsed
                    || !Number.isFinite(rush.duration) || rush.duration <= 0 || rush.duration > .75 || s.elapsed - rush.startedAt >= rush.duration) return false;
            }
        }
        if (s.answerRush !== undefined) {
            const rush = s.answerRush, me = s.racers[0];
            if (!rush || s.phase !== 'racing' || !s.selected || rush.question !== activeQuestion(s) || rush.lane !== me.target
                || !Number.isFinite(rush.from) || rush.from < rush.question * SEGMENT + APPROACH || rush.from > me.distance
                || !Number.isFinite(rush.startedAt) || rush.startedAt < 0 || rush.startedAt > s.elapsed
                || !Number.isFinite(rush.duration) || rush.duration <= 0 || rush.duration > .75 || s.elapsed - rush.startedAt >= rush.duration) return false;
        }
        if (![s.fx, s.collisions, s.nitros, s.bestCombo].every(v => Number.isInteger(v) && v >= 0) || typeof s.selected !== 'boolean' || typeof s.queuedBoost !== 'boolean' || typeof s.feedback !== 'string' || !Number.isFinite(s.feedbackUntil)) return false;
        return s.phase !== 'finished' || s.answers.length === s.questions.length && s.racers[0].finishAt !== null;
    } catch { return false; }
}
