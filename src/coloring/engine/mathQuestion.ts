import { QuestionType, type Question } from '../../../types';
import { SKILL_MAP } from '../../../services/study/catalog';
import { mathLabel } from './core';
export function mathQuestion(answer: number, grade: number, region: number): Question {
    const label = mathLabel(answer, grade, region), skillId = grade === 0 ? 'mn.combine' : grade === 1 ? 'g1.add10' : grade === 2 ? 'g2.addsub20' : grade === 3 ? (label.includes('÷') ? 'g3.div_tables' : 'g3.addsub100000') : grade === 4 ? 'g4.div' : 'g5.dec_addsub', skill = SKILL_MAP.get(skillId)!;
    return { id: `coloring-${grade}-${region}-${answer}`, topicId: skill.topicId, skillId, level: grade === 0 ? 2 : 1, type: QuestionType.ManualInput, questionText: `${label} = ?`, correctAnswer: String(answer), answerKind: 'number', explanation: `${label} = ${answer}`, ops: [label.includes('+') ? 'addition' : label.includes('÷') ? 'division' : 'subtraction'] };
}
