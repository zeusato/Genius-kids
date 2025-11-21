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

const createRulerSVG = (length: number) => `
  <svg width="350" height="100" viewBox="0 0 350 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="30" width="300" height="40" fill="#F0E68C" stroke="#333" stroke-width="2"/>
    ${Array.from({ length: 11 }, (_, i) => `
      <line x1="${20 + i * 30}" y1="30" x2="${20 + i * 30}" y2="${i % 5 === 0 ? 70 : 55}" stroke="#333" stroke-width="${i % 5 === 0 ? 2 : 1}"/>
      ${i % 5 === 0 && i <= 10 ? `<text x="${20 + i * 30}" y="85" text-anchor="middle" font-size="12">${i}</text>` : ''}
    `).join('')}
    <rect x="20" y="20" width="${length * 30}" height="10" fill="#FF6B6B" opacity="0.7"/>
    <text x="20" y="15" font-size="12">${length} cm</text>
  </svg>
`;

export const generateLength = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    if (type < 0.5) {
        // Measure length
        const length = randomInt(3, 10);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Đo xem vật dài bao nhiêu xăng-ti-mét (cm)?`,
            visualSvg: createRulerSVG(length),
            correctAnswer: `${length} cm`,
            options: shuffleArray([`${length} cm`, `${length + 1} cm`, `${length - 1} cm`, `${length + 2} cm`]),
            explanation: `Vật dài ${length} cm.`
        };
    } else {
        // Compare lengths
        const len1 = randomInt(3, 8);
        const len2 = randomInt(3, 8);
        let ans = 'Bằng nhau';
        if (len1 > len2) ans = 'Vật 1 dài hơn';
        if (len1 < len2) ans = 'Vật 2 dài hơn';
        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh độ dài: Vật 1 dài ${len1}cm, Vật 2 dài ${len2}cm`,
            correctAnswer: ans,
            options: shuffleArray(['Vật 1 dài hơn', 'Vật 2 dài hơn', 'Bằng nhau']),
            explanation: `${len1} cm ${len1 > len2 ? '>' : len1 < len2 ? '<' : '='} ${len2} cm. ${ans}.`
        };
    }
};
