import { Question, QuestionType } from '../../../types';
import { capitalize } from '../utils';
import { shapeSVG, shapesGridSVG } from '../svg';

type ShapeKind = 'square' | 'circle' | 'triangle' | 'rectangle';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const createShapeSVG = (shape: string) => shapeSVG(shape as ShapeKind);

const shapeNames: { [key: string]: string } = {
    'square': 'hình vuông',
    'circle': 'hình tròn',
    'triangle': 'hình tam giác',
    'rectangle': 'hình chữ nhật'
};

export const generateGeometry = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();
    const shapes = ['square', 'circle', 'triangle', 'rectangle'];

    if (type < 0.5) {
        // Identify shape
        const shape = shapes[randomInt(0, 3)];
        return {
            type: QuestionType.SingleChoice,
            questionText: `Đây là hình gì?`,
            visualSvg: createShapeSVG(shape),
            correctAnswer: capitalize(shapeNames[shape]),
            options: shuffleArray(Object.values(shapeNames).map(capitalize)),
            explanation: `Đây là ${shapeNames[shape]}.`
        };
    } else {
        // Count shapes in picture
        const shape = shapes[randomInt(0, 3)];
        const count = randomInt(2, 5);
        // Đúng 4 đáp án gồm đáp án đúng (tránh bị cắt mất khi dedup ở generateQuestions).
        const distractors = shuffleArray([1, 2, 3, 4, 5, 6].filter(n => n !== count)).slice(0, 3);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Đếm xem có bao nhiêu ${shapeNames[shape]}?`,
            visualSvg: shapesGridSVG(shape as ShapeKind, count),
            correctAnswer: count.toString(),
            options: shuffleArray([count, ...distractors].map(String)),
            explanation: `Có ${count} ${shapeNames[shape]}.`
        };
    }
};
