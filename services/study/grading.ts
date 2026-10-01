// Chấm điểm DUY NHẤT cho Ôn Luyện — dùng ở màn làm bài, lưu kết quả, xem lại, thành tích.
import { Question, QuestionType } from '../../types';
import { normalizeText, sameValue } from './value';

type Answer = string | string[] | undefined | null;

export function isAnswered(q: Pick<Question, 'type'>, answer: Answer): boolean {
    if (Array.isArray(answer)) return answer.length > 0;
    return typeof answer === 'string' && answer.trim().length > 0;
}

export function isCorrect(q: Pick<Question, 'type' | 'correctAnswer' | 'correctAnswers' | 'accept' | 'answerKind'>, answer: Answer): boolean {
    if (answer === undefined || answer === null) return false;
    switch (q.type) {
        case QuestionType.MultipleSelect: {
            if (!Array.isArray(answer) || !q.correctAnswers) return false;
            const a = [...new Set(answer)].sort(), c = [...new Set(q.correctAnswers)].sort();
            return a.length === c.length && a.every((x, i) => x === c[i]);
        }
        case QuestionType.Order: {
            if (!Array.isArray(answer) || !q.correctAnswers) return false;
            return answer.length === q.correctAnswers.length && answer.every((x, i) => x === q.correctAnswers![i]);
        }
        case QuestionType.ManualInput: {
            if (typeof answer !== 'string' || !answer.trim()) return false;
            const valid = [q.correctAnswer, ...(q.accept || [])].filter((x): x is string => typeof x === 'string');
            if (q.answerKind === 'text') return valid.some(v => normalizeText(v) === normalizeText(answer));
            return valid.some(v => sameValue(v, answer));
        }
        case QuestionType.Typing:
            return typeof answer === 'string' && answer.normalize('NFC').trim() === (q.correctAnswer || '').normalize('NFC').trim();
        default:
            return typeof answer === 'string' && answer === q.correctAnswer;
    }
}

/** Điểm một bài: số câu đúng. */
export const scoreOf = (qs: Question[], answers: Record<string, Answer>): number =>
    qs.reduce((n, q) => n + (isCorrect(q, answers[q.id]) ? 1 : 0), 0);
