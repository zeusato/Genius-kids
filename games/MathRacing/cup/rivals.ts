import type { Difficulty, Question } from './model';
import { rng } from './legacyQuestions';

export const RIVAL_SKILLS = {
    easy: { accuracy: .56, minTime: .55, maxTime: .84, description: 'Đối thủ suy nghĩ chậm, dễ mắc lỗi.' },
    medium: { accuracy: .74, minTime: .30, maxTime: .59, description: 'Đối thủ trả lời nhanh hơn, đôi lúc nhầm.' },
    hard: { accuracy: .88, minTime: .16, maxTime: .37, description: 'Đối thủ phản ứng nhanh, tính chắc hơn nhưng vẫn có thể sai.' },
} as const;

/** A decision depends only on this question, difficulty and seeded personality.
 * It never reads the player's answer, position or timing to force a result. */
export function rivalDecision(seed: number, difficulty: Difficulty, question: Question, index: number, readWindow: number) {
    const random = rng(seed ^ Math.imul(question.id + 1, 91771) ^ Math.imul(index, 31337));
    const skill = RIVAL_SKILLS[difficulty];
    // Bông is careful, Sóc is hasty, Mít is balanced. Each has independent luck.
    const accuracy = skill.accuracy + (index === 1 ? .04 : index === 2 ? -.04 : 0);
    const correct = random() < accuracy;
    const lane = correct ? question.options.indexOf(question.answer) :
        (question.options.indexOf(question.answer) + 1 + Math.floor(random() * 2)) % 3;
    const fraction = skill.minTime + random() * (skill.maxTime - skill.minTime)
        + (index === 1 ? .04 : index === 2 ? -.025 : 0) + (random() < .18 ? .10 : 0);
    const delay = Math.max(1.1, Math.min(readWindow - .85, readWindow * fraction));
    return { lane, delay };
}
