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

// Create SVG with cute objects for counting
const createObjectsSVG = (count: number, objectType: string = 'apple') => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#FF8B94'];
    const objects: { [key: string]: (x: number, y: number, color: string) => string } = {
        apple: (x: number, y: number, color: string) => `
      <circle cx="${x}" cy="${y}" r="15" fill="${color}" stroke="#8B4513" stroke-width="2"/>
      <rect x="${x - 2}" y="${y - 20}" width="4" height="8" fill="#8B4513"/>
      <ellipse cx="${x + 5}" cy="${y - 18}" rx="8" ry="4" fill="#228B22"/>
    `,
        star: (x: number, y: number, color: string) => `
      <path d="M ${x} ${y - 15} L ${x + 5} ${y + 5} L ${x + 15} ${y + 5} L ${x + 7} ${y + 12} L ${x + 10} ${y + 20} L ${x} ${y + 15} L ${x - 10} ${y + 20} L ${x - 7} ${y + 12} L ${x - 15} ${y + 5} L ${x - 5} ${y + 5} Z" fill="${color}" stroke="#FFD700" stroke-width="2"/>
    `,
        heart: (x: number, y: number, color: string) => `
      <path d="M ${x} ${y + 10} C ${x} ${y + 5}, ${x - 10} ${y - 10}, ${x - 15} ${y - 5} C ${x - 20} ${y}, ${x - 20} ${y + 10}, ${x} ${y + 20} C ${x + 20} ${y + 10}, ${x + 20} ${y}, ${x + 15} ${y - 5} C ${x + 10} ${y - 10}, ${x} ${y + 5}, ${x} ${y + 10}" fill="${color}" stroke="#FF1493" stroke-width="2"/>
    `,
        ball: (x: number, y: number, color: string) => `
      <circle cx="${x}" cy="${y}" r="15" fill="${color}" stroke="#000" stroke-width="2"/>
      <circle cx="${x - 5}" cy="${y - 5}" r="4" fill="#FFF" opacity="0.6"/>
    `
    };

    const itemsPerRow = Math.min(count, 5);
    const rows = Math.ceil(count / itemsPerRow);
    const spacing = 50;
    const startX = 50;
    const startY = 50;

    let svgContent = '';
    for (let i = 0; i < count; i++) {
        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;
        const x = startX + col * spacing;
        const y = startY + row * spacing;
        const color = colors[i % colors.length];
        svgContent += objects[objectType](x, y, color);
    }

    const width = startX + itemsPerRow * spacing + 50;
    const height = startY + rows * spacing + 50;

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgContent}
    </svg>
  `;
};

export const generateNumbers5 = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Count objects - 30%
    if (type < 0.3) {
        const count = randomInt(1, 5);
        const objects = ['apple', 'star', 'heart', 'ball'];
        const obj = objects[randomInt(0, objects.length - 1)];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Đếm xem có bao nhiêu đồ vật?`,
            visualSvg: createObjectsSVG(count, obj),
            correctAnswer: count.toString(),
            options: shuffleArray(['1', '2', '3', '4', '5']),
            explanation: `Có ${count} đồ vật.`
        };
    }

    // 2. Compare groups - 25%
    else if (type < 0.55) {
        const count1 = randomInt(1, 5);
        const count2 = randomInt(1, 5);

        let answer = 'Bằng nhau';
        if (count1 > count2) answer = 'Nhóm 1 nhiều hơn';
        if (count1 < count2) answer = 'Nhóm 2 nhiều hơn';

        const svg = `
      <svg width="400" height="200" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <text x="50" y="20" font-size="16" font-weight="bold">Nhóm 1:</text>
        <g transform="translate(0, 30)">${createObjectsSVG(count1, 'apple').match(/<svg[^>]*>(.*)<\/svg>/s)?.[1]}</g>
        <text x="250" y="20" font-size="16" font-weight="bold">Nhóm 2:</text>
        <g transform="translate(200, 30)">${createObjectsSVG(count2, 'ball').match(/<svg[^>]*>(.*)<\/svg>/s)?.[1]}</g>
      </svg>
    `;

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh hai nhóm đồ vật:`,
            visualSvg: svg,
            correctAnswer: answer,
            options: shuffleArray(['Nhóm 1 nhiều hơn', 'Nhóm 2 nhiều hơn', 'Bằng nhau']),
            explanation: `Nhóm 1 có ${count1}, nhóm 2 có ${count2}. ${answer}.`
        };
    }

    // 3. Fill missing number in sequence - 20%
    else if (type < 0.75) {
        const sequences = [
            { seq: [1, 3, 5], missing: 2, display: '1 _ 3' },
            { seq: [2, 3, 4], missing: 3, display: '2 _ 4' },
            { seq: [1, 2, 3], missing: 2, display: '1 _ 3' },
            { seq: [3, 4, 5], missing: 4, display: '3 _ 5' }
        ];
        const chosen = sequences[randomInt(0, sequences.length - 1)];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Điền số còn thiếu vào dãy: ${chosen.display}`,
            correctAnswer: chosen.missing.toString(),
            options: createOptionsWithAnswer(chosen.missing.toString(), ['1', '2', '3', '4', '5']),
            explanation: `Số còn thiếu là ${chosen.missing}.`
        };
    }

    // 4. Sort numbers - 25%
    else {
        const isAscending = Math.random() > 0.5;
        const nums = shuffleArray([1, 2, 3, 4, 5]).slice(0, 3);
        // Fix: Clone before sorting to preserve original order for question text
        const sorted = [...nums].sort((a, b) => isAscending ? a - b : b - a);
        const answer = sorted.join(', ');

        // Generate wrong options (permutations)
        const wrong1 = shuffleArray([...nums]).join(', ');
        const wrong2 = shuffleArray([...nums]).join(', ');
        const wrong3 = shuffleArray([...nums]).join(', ');
        
        // Ensure unique options
        const options = Array.from(new Set([answer, wrong1, wrong2, wrong3]));
        // If not enough unique options, add some hardcoded ones (unlikely for 3 numbers but safe)
        while (options.length < 4) {
             options.push(shuffleArray([1, 2, 3, 4, 5]).slice(0, 3).join(', '));
        }

        return {
            type: QuestionType.SingleChoice,
            questionText: `Sắp xếp các số ${isAscending ? 'từ nhỏ đến lớn' : 'từ lớn đến nhỏ'}: ${nums.join(', ')}`,
            correctAnswer: answer,
            options: shuffleArray(options).slice(0, 4),
            explanation: `Sắp xếp ${isAscending ? 'tăng dần' : 'giảm dần'}: ${answer}`
        };
    }
};
