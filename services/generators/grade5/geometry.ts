import { Question, QuestionType } from '../../../types';
import { formatNumber } from '../utils';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const formatDecimal = (num: number, maxDecimals: number = 2): string => {
    const str = num.toFixed(maxDecimals);
    const trimmed = parseFloat(str).toString();
    return trimmed.replace('.', ',');
};

// SVG for parallelogram
const createParallelogramSVG = (base: number, height: number): string => {
    return `
    <svg width="350" height="200" viewBox="0 0 350 200" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,150 ${50 + base * 15},150 ${50 + base * 15 + 30},50 80,50" 
               fill="#dbeafe" stroke="#0ea5e9" stroke-width="3"/>
      <line x1="${50 + base * 15}" y1="150" x2="${50 + base * 15}" y2="50" 
            stroke="#ef4444" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="${50 + (base * 15) / 2}" y="175" text-anchor="middle" font-size="14">Đáy = ${base}cm</text>
      <text x="${50 + base * 15 + 15}" y="100" text-anchor="start" font-size="14">h = ${height}cm</text>
    </svg>
  `;
};

// SVG for circle
const createCircleSVG = (radius: number): string => {
    return `
    <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <circle cx="150" cy="150" r="${radius * 10}" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>
      <line x1="150" y1="150" x2="${150 + radius * 10}" y2="150" stroke="#ef4444" stroke-width="2"/>
      <text x="${150 + (radius * 10) / 2}" y="145" text-anchor="middle" font-size="14" fill="#ef4444">r = ${radius}cm</text>
    </svg>
  `;
};

// SVG for rectangular box
const createBoxSVG = (length: number, width: number, height: number): string => {
    return `
    <svg width="350" height="250" viewBox="0 0 350 250" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,150 200,150 200,80 50,80" fill="#dbeafe" stroke="#0ea5e9" stroke-width="2"/>
      <polygon points="200,150 250,120 250,50 200,80" fill="#93c5fd" stroke="#0ea5e9" stroke-width="2"/>
      <polygon points="50,80 200,80 250,50 100,50" fill="#60a5fa" stroke="#0ea5e9" stroke-width="2"/>
      <text x="125" y="170" text-anchor="middle" font-size="14">Dài = ${length}cm</text>
      <text x="230" y="90" text-anchor="middle" font-size="14">Rộng = ${width}cm</text>
      <text x="30" y="120" text-anchor="end" font-size="14">Cao = ${height}cm</text>
    </svg>
  `;
};

export const generateG5Geometry = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Parallelogram area (30%)
    if (type < 0.3) {
        const base = randomInt(5, 15);
        const height = randomInt(4, 10);
        const area = base * height;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính diện tích hình bình hành có đáy ${base}cm, chiều cao ${height}cm?`,
            visualSvg: createParallelogramSVG(base, height),
            correctAnswer: `${area}cm²`,
            options: shuffleArray([
                `${area}cm²`,
                `${(base + height) * 2}cm²`,
                `${base * height * 2}cm²`,
                `${base + height}cm²`
            ]),
            explanation: `Diện tích = đáy × chiều cao = ${base} × ${height} = ${area}cm²`
        };
    }

    // 2. Circle perimeter (25%)
    else if (type < 0.55) {
        const radius = randomInt(3, 10);
        const perimeter = 2 * 3.14 * radius;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính chu vi hình tròn có bán kính ${radius}cm? (π = 3,14)`,
            visualSvg: createCircleSVG(radius),
            correctAnswer: formatDecimal(perimeter, 2),
            options: shuffleArray([
                formatDecimal(perimeter, 2),
                formatDecimal(3.14 * radius, 2),
                formatDecimal(3.14 * radius * radius, 2),
                formatDecimal(perimeter + 3.14, 2)
            ]),
            explanation: `Chu vi = 2 × π × r = 2 × 3,14 × ${radius} = ${formatDecimal(perimeter, 2)}cm`
        };
    }

    // 3. Circle area (25%)
    else if (type < 0.8) {
        const radius = randomInt(3, 10);
        const area = 3.14 * radius * radius;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính diện tích hình tròn có bán kính ${radius}cm? (π = 3,14)`,
            visualSvg: createCircleSVG(radius),
            correctAnswer: formatDecimal(area, 2),
            options: shuffleArray([
                formatDecimal(area, 2),
                formatDecimal(2 * 3.14 * radius, 2),
                formatDecimal(3.14 * radius, 2),
                formatDecimal(area + 10, 2)
            ]),
            explanation: `Diện tích = π × r² = 3,14 × ${radius}² = 3,14 × ${radius * radius} = ${formatDecimal(area, 2)}cm²`
        };
    }

    // 4. Box volume (20%)
    else {
        const length = randomInt(4, 10);
        const width = randomInt(3, 8);
        const height = randomInt(3, 8);
        const volume = length * width * height;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính thể tích hình hộp chữ nhật có chiều dài ${length}cm, rộng ${width}cm, cao ${height}cm?`,
            visualSvg: createBoxSVG(length, width, height),
            correctAnswer: `${volume}cm³`,
            options: shuffleArray([
                `${volume}cm³`,
                `${(length + width + height) * 4}cm³`,
                `${length * width}cm³`,
                `${volume * 2}cm³`
            ]),
            explanation: `Thể tích = dài × rộng × cao = ${length} × ${width} × ${height} = ${volume}cm³`
        };
    }
};
