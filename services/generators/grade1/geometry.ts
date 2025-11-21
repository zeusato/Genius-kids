import { Question, QuestionType } from '../../../types';
import { capitalize } from '../utils';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const createShapeSVG = (shape: string) => {
    const shapes: { [key: string]: string } = {
        'square': '<rect x="50" y="50" width="80" height="80" fill="#4ECDC4" stroke="#333" stroke-width="3"/>',
        'circle': '<circle cx="90" cy="90" r="40" fill="#FF6B6B" stroke="#333" stroke-width="3"/>',
        'triangle': '<polygon points="90,50 50,130 130,130" fill="#FFE66D" stroke="#333" stroke-width="3"/>',
        'rectangle': '<rect x="40" y="60" width="100" height="60" fill="#95E1D3" stroke="#333" stroke-width="3"/>'
    };
    return `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">${shapes[shape]}</svg>`;
};

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
        const svg = `
      <svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        ${Array.from({ length: count }, (_, i) => {
            const x = 40 + (i % 3) * 80;
            const y = 40 + Math.floor(i / 3) * 80;
            if (shape === 'square') return `<rect x="${x}" y="${y}" width="50" height="50" fill="#4ECDC4" stroke="#333" stroke-width="2"/>`;
            if (shape === 'circle') return `<circle cx="${x + 25}" cy="${y + 25}" r="25" fill="#FF6B6B" stroke="#333" stroke-width="2"/>`;
            if (shape === 'triangle') return `<polygon points="${x + 25},${y} ${x},${y + 50} ${x + 50},${y + 50}" fill="#FFE66D" stroke="#333" stroke-width="2"/>`;
            return `<rect x="${x}" y="${y}" width="60" height="40" fill="#95E1D3" stroke="#333" stroke-width="2"/>`;
        }).join('')}
      </svg>
    `;
        return {
            type: QuestionType.SingleChoice,
            questionText: `Đếm xem có bao nhiêu ${shapeNames[shape]}?`,
            visualSvg: svg,
            correctAnswer: count.toString(),
            options: shuffleArray(['1', '2', '3', '4', '5']),
            explanation: `Có ${count} ${shapeNames[shape]}.`
        };
    }
};
