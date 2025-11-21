import { Question, QuestionType } from '../../../types';
import { formatNumber, createOptionsWithAnswer } from '../utils';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

// Create number line SVG
const createNumberLineSVG = (max: number, highlight?: number) => {
    const spacing = 50;
    const startX = 30;
    const y = 50;

    let svg = `
    <svg width="${startX + max * spacing + 30}" height="120" viewBox="0 0 ${startX + max * spacing + 30} 120" xmlns="http://www.w3.org/2000/svg">
      <line x1="${startX}" y1="${y}" x2="${startX + max * spacing}" y2="${y}" stroke="#333" stroke-width="3"/>
  `;

    for (let i = 0; i <= max; i++) {
        const x = startX + i * spacing;
        const isHighlight = highlight !== undefined && i === highlight;
        svg += `
      <line x1="${x}" y1="${y - 10}" x2="${x}" y2="${y + 10}" stroke="#333" stroke-width="2"/>
      <text x="${x}" y="${y + 30}" text-anchor="middle" font-size="18" font-weight="bold" fill="${isHighlight ? '#FF6B6B' : '#333'}">${i}</text>
      ${isHighlight ? `<circle cx="${x}" cy="${y}" r="8" fill="#FFE66D" stroke="#FF6B6B" stroke-width="3"/>` : ''}
    `;
    }

    svg += `</svg>`;
    return svg;
};

// Create grouped objects SVG
const createGroupedObjectsSVG = (total: number, group1: number) => {
    const group2 = total - group1;
    return `
    <svg width="350" height="150" viewBox="0 0 350 150" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="20" font-size="16" font-weight="bold">${total} = ${group1} + ${group2}</text>
      <rect x="10" y="30" width="${group1 * 25}" height="80" fill="#4ECDC4" opacity="0.3" stroke="#4ECDC4" stroke-width="2"/>
      <rect x="${20 + group1 * 25}" y="30" width="${group2 * 25}" height="80" fill="#FF6B6B" opacity="0.3" stroke="#FF6B6B" stroke-width="2"/>
      ${Array.from({ length: total }, (_, i) => {
        const x = 20 + i * 25;
        const color = i < group1 ? '#4ECDC4' : '#FF6B6B';
        return `<rect x="${x}" y="50" width="20" height="50" fill="${color}" stroke="#333" stroke-width="2" rx="3"/>`;
    }).join('')}
    </svg>
  `;
};

export const generateNumbers10 = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Count objects (6-10) - 20%
    if (type < 0.2) {
        const count = randomInt(6, 10);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Đếm xem có bao nhiêu ô vuông?`,
            visualSvg: `
        <svg width="300" height="150" viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
          ${Array.from({ length: count }, (_, i) => `<rect x="${(i % 5) * 50 + 20}" y="${Math.floor(i / 5) * 50 + 20}" width="40" height="40" fill="#4ECDC4" stroke="#333" stroke-width="2" rx="5"/>`).join('')}
        </svg>
      `,
            correctAnswer: count.toString(),
            options: createOptionsWithAnswer(count.toString(), Array.from({ length: 10 }, (_, i) => (i + 1).toString())),
            explanation: `Có ${count} ô vuông.`
        };
    }

    // 2. Compare two numbers - 20%
    else if (type < 0.4) {
        const a = randomInt(0, 10);
        const b = randomInt(0, 10);
        let ans = '=';
        if (a > b) ans = '>';
        if (a < b) ans = '<';

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh: ${a} ... ${b}`,
            correctAnswer: ans,
            options: shuffleArray(['>', '<', '=']),
            explanation: `${a} ${ans} ${b}`
        };
    }

    // 3. Decompose number - 20%
    else if (type < 0.6) {
        const total = randomInt(6, 10);
        const part1 = randomInt(1, total - 1);
        const part2 = total - part1;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tách số ${total} thành hai phần:`,
            visualSvg: createGroupedObjectsSVG(total, part1),
            correctAnswer: `${part1} + ${part2}`,
            options: shuffleArray([
                `${part1} + ${part2}`,
                `${part2} + ${part1}`,
                `${part1 + 1} + ${part2 - 1}`,
                `${total - 1} + 1`
            ]).slice(0, 4),
            explanation: `${total} = ${part1} + ${part2}`
        };
    }

    // 4. Fill missing: 8 = □ + 4 - 20%
    else if (type < 0.8) {
        const total = randomInt(5, 10);
        const known = randomInt(1, total - 1);
        const missing = total - known;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Điền số còn thiếu: ${total} = □ + ${known}`,
            correctAnswer: missing.toString(),
            options: createOptionsWithAnswer(missing.toString(), Array.from({ length: 11 }, (_, i) => i.toString())),
            explanation: `${total} = ${missing} + ${known}`
        };
    }

    // 5. Position on number line - 20%
    else {
        const num = randomInt(0, 10);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Số nào được đánh dấu trên tia số?`,
            visualSvg: createNumberLineSVG(10, num),
            correctAnswer: num.toString(),
            options: createOptionsWithAnswer(num.toString(), Array.from({ length: 11 }, (_, i) => i.toString())),
            explanation: `Số được đánh dấu là ${num}.`
        };
    }
};
