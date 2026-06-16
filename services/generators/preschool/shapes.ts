import { Question, QuestionType } from '../../../types';
import { shapeSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
};

const SHAPES: Array<['square' | 'rectangle' | 'circle' | 'triangle', string]> = [
    ['square', 'Hình vuông'], ['rectangle', 'Hình chữ nhật'], ['circle', 'Hình tròn'], ['triangle', 'Hình tam giác'],
];

/**
 * Mầm non — Nhận biết hình cơ bản (vuông, tròn, tam giác, chữ nhật).
 */
export const generatePreschoolShapes = (): Omit<Question, 'id' | 'topicId'> => {
    const idx = randomInt(0, SHAPES.length - 1);
    const [kind, name] = SHAPES[idx];
    return {
        type: QuestionType.SingleChoice,
        questionText: `Đây là hình gì?`,
        visualSvg: shapeSVG(kind),
        correctAnswer: name,
        options: shuffleArray(SHAPES.map(s => s[1])),
        explanation: `Đây là ${name.toLowerCase()}.`,
    };
};
