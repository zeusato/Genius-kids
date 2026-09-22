import type { Sentence } from "../data/english/schema";
import {
  SKILLS, isSentenceExercise, sourceId, type SentenceExercise,
  type Answer,
  type EnglishSession,
  type Exercise,
  type ExerciseKind,
  type Response,
} from "./model";

export function normalizeAnswer(value: string, terminal = true): string {
  const normalized = value
    .normalize("NFC")
    .replace(/[‘’]/g, "'")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  return terminal ? normalized.replace(/[.!?]$/, "").trim() : normalized;
}
export function joinTokens(tokens: string[]): string {
  return tokens.join(" ").replace(/\s+([.,!?;:])/g, "$1");
}
const sameSet = (a: number[], b: number[]) =>
  a.length === b.length &&
  new Set(a).size === a.length &&
  [...a]
    .sort((x, y) => x - y)
    .every((v, i) => v === [...b].sort((x, y) => x - y)[i]);
export function grade(exercise: Exercise, answer: Answer): boolean {
  if (!isSentenceExercise(exercise)) return typeof answer === 'string' && [exercise.answer,...exercise.alternatives].some(a => normalizeAnswer(a) === normalizeAnswer(answer));
  const { kind, sentence: s, target } = exercise;
  if (kind === "roles")
    return (
      Array.isArray(answer) && sameSet(answer, s.roleSpans[target].tokenIndices)
    );
  if (kind === "pos") return answer === s.tokens[target].pos;
  if ((kind === "fill" || kind === "conjugate"))
    return (
      typeof answer === "string" &&
      [s.blanks[target].answer, ...(s.blanks[target].alt || [])].some(
        (a) => normalizeAnswer(a) === normalizeAnswer(answer),
      )
    );
  if (
    !Array.isArray(answer) ||
    !sameSet(
      answer,
      s.tokens.map((_, i) => i),
    )
  )
    return false;
  const text = joinTokens(answer.map((i) => s.tokens[i].text));
  return [s.en, ...(s.orderAlternatives || [])].some(
    (a) => normalizeAnswer(a) === normalizeAnswer(text),
  );
}
export function answerText(exercise: Exercise, answer: Answer): string {
  if (!isSentenceExercise(exercise)) return typeof answer === "string" ? answer : "";
  return Array.isArray(answer)
    ? joinTokens(answer.map((i) => exercise.sentence.tokens[i]?.text || ""))
    : answer;
}
export function correctAnswer(exercise: Exercise): Answer {
  if (!isSentenceExercise(exercise)) return exercise.answer;
  const { kind, sentence: s, target } = exercise;
  if ((kind === "fill" || kind === "conjugate")) return s.blanks[target].answer;
  if (kind === "pos") return s.tokens[target].pos;
  if (kind === "roles") return s.roleSpans[target].tokenIndices;
  return s.tokens.map((_, i) => i);
}
export function checkResponse(
  exercise: Exercise,
  previous: Response,
): Response {
  const correct = grade(exercise, previous.answer);
  return {
    ...previous,
    correct,
    attempts: previous.attempts + 1,
    ...(previous.attempts === 0
      ? {
          firstAnswer: structuredClone(previous.answer),
          firstCorrect: correct && previous.hints === 0,
        }
      : {}),
  };
}
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createSession(
  sentences: Sentence[],
  studentId: string,
  contentVersion: string,
  mode: EnglishSession["mode"],
  count: number,
  family: ExerciseKind | "mixed" = "mixed",
  previousSources: string[] = [],
  random = Math.random,
): EnglishSession & { exercises: SentenceExercise[] } {
  if (![5, 10, 15].includes(count) || (mode === "test" && count !== 10))
    throw new Error("Số câu không hợp lệ.");
  const grammarKinds: ExerciseKind[] = ["fill", "order"];
  const kinds: ExerciseKind[] =
    mode === "test"
      ? grammarKinds
      : family === "mixed"
        ? ["fill", "order", "pos", "roles"]
        : [family];
  // Short answers intentionally omit POS/roles. Practice balances the skills
  // approved for the selected family; only exams require all five skills.
  const skills = mode === 'test' ? SKILLS : SKILLS.filter(skill =>
    sentences.some(s => s.grammarPoint === skill && kinds.some(k => s.exerciseTypes.includes(k))));
  if (!skills.length) throw new Error('Chưa có câu phù hợp với dạng luyện này.');
  const selected: SentenceExercise[] = [];
  for (let i = 0; i < count; i++) {
    const skill = skills[i % skills.length];
    const pool = shuffle(
      sentences.filter(
        (s) =>
          s.grammarPoint === skill &&
          !selected.some((e) => e.sentence.id === s.id) &&
          kinds.some((k) => s.exerciseTypes.includes(k)),
      ),
      random,
    ).sort(
      (a, b) =>
        Number(previousSources.includes(a.id)) -
        Number(previousSources.includes(b.id)),
    );
    const s = pool[0];
    if (!s)
      throw new Error(`Chưa đủ câu cho kỹ năng ${skill} và dạng bài đã chọn.`);
    const eligible = kinds.filter((k) => s.exerciseTypes.includes(k));
    const kind = eligible[i % eligible.length];
    const targets =
      (kind === "fill" || kind === "conjugate")
        ? s.blanks.map((_, j) => j)
        : kind === "roles"
          ? s.roleSpans.map((_, j) => j)
          : s.tokens.flatMap((t, j) => (t.pos === "punct" ? [] : [j]));
    const target = targets[Math.floor(random() * targets.length)] ?? 0;
    const shuffledIndices = shuffle(
      s.tokens.map((_, j) => j),
      random,
    );
    if (shuffledIndices.every((v, j) => v === j)) shuffledIndices.reverse();
    selected.push({
      id: `${s.id}:${kind}:${target}`,
      kind,
      skill,
      sentence: structuredClone(s),
      target,
      shuffledIndices,
    });
  }
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    studentId,
    contentVersion,
    level: "A1",
    mode,
    startedAt: now,
    updatedAt: now,
    elapsedSeconds: 0,
    status: "draft",
    exercises: shuffle(selected, random),
    responses: {},
    cursor: 0,
    revision: 0,
  };
}
export function scoreSession(session: EnglishSession) {
  return session.exercises.filter(
    (e) => session.responses[e.id]?.firstCorrect === true,
  ).length;
}
export function submitSession(session: EnglishSession): EnglishSession {
  if (session.status !== "draft") return session;
  const responses = { ...session.responses };
  for (const e of session.exercises) {
    const old = responses[e.id] || {
      answer: e.kind === "order" || e.kind === "roles" ? [] : "",
      hints: 0,
      attempts: 0,
    };
    responses[e.id] = old.attempts ? old : checkResponse(e, old);
  }
  return {
    ...session,
    responses,
    status: "submitted",
    completedAt: new Date().toISOString(),
  };
}
