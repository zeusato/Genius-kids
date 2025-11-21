import { Question, QuestionType } from '../../../types';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

// SVG Helpers
const createLineSegmentSVG = (length: number, label: string) => `
  <svg width="350" height="100" viewBox="0 0 350 100" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="50" x2="${50 + length * 20}" y2="50" stroke="#0ea5e9" stroke-width="3"/>
    <circle cx="50" cy="50" r="4" fill="#0ea5e9"/>
    <circle cx="${50 + length * 20}" cy="50" r="4" fill="#0ea5e9"/>
    <text x="${50 + (length * 20) / 2}" y="75" text-anchor="middle" font-size="16" font-weight="bold">${label}</text>
  </svg>
`;

const createAngleSVG = (isRightAngle: boolean) => {
    const angle = isRightAngle ? 90 : randomInt(30, 150);
    const rad = (angle * Math.PI) / 180;
    const x2 = 50 + 100 * Math.cos(rad);
    const y2 = 150 - 100 * Math.sin(rad);

    return `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <line x1="50" y1="150" x2="150" y2="150" stroke="#0ea5e9" stroke-width="3"/>
      <line x1="50" y1="150" x2="${x2}" y2="${y2}" stroke="#0ea5e9" stroke-width="3"/>
      ${isRightAngle ? '<rect x="50" y="140" width="10" height="10" fill="none" stroke="#0ea5e9" stroke-width="2"/>' : ''}
      <path d="M 70 150 A 20 20 0 0 1 ${50 + 20 * Math.cos(rad)} ${150 - 20 * Math.sin(rad)}" fill="none" stroke="#f59e0b" stroke-width="2"/>
    </svg>
  `;
};

const createRectangleSVG = (width: number, height: number, isSquare: boolean) => `
  <svg width="300" height="250" viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">
    <rect x="50" y="50" width="${width * 15}" height="${height * 15}" fill="#dbeafe" stroke="#0ea5e9" stroke-width="3"/>
    <text x="${50 + (width * 15) / 2}" y="${50 + height * 15 + 25}" text-anchor="middle" font-size="14">${width}cm</text>
    <text x="${50 + width * 15 + 15}" y="${50 + (height * 15) / 2}" text-anchor="start" font-size="14">${height}cm</text>
  </svg>
`;

const createTriangleSVG = (a: number, b: number, c: number) => `
  <svg width="300" height="250" viewBox="0 0 300 250" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,200 250,200 150,50" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>
    <text x="150" y="220" text-anchor="middle" font-size="14">${a}cm</text>
    <text x="30" y="130" text-anchor="end" font-size="14">${b}cm</text>
    <text x="270" y="130" text-anchor="start" font-size="14">${c}cm</text>
  </svg>
`;

export const generateG3Geometry = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Identify points, line segments, rays (15%)
    if (type < 0.15) {
        const concepts = [
            { name: 'Đoạn thẳng', desc: 'có 2 đầu mút' },
            { name: 'Đường thẳng', desc: 'kéo dài vô tận 2 phía' },
            { name: 'Tia', desc: 'có 1 đầu mút, kéo dài vô tận 1 phía' }
        ];
        const chosen = concepts[randomInt(0, 2)];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hình nào ${chosen.desc}?`,
            correctAnswer: chosen.name,
            options: shuffleArray(concepts.map(c => c.name)),
            explanation: `${chosen.name} ${chosen.desc}.`
        };
    }

    // 2. Compare line segment lengths (20%)
    else if (type < 0.35) {
        const len1 = randomInt(3, 10);
        const len2 = randomInt(3, 10);
        const op = len1 > len2 ? '>' : len1 < len2 ? '<' : '=';

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh độ dài hai đoạn thẳng AB = ${len1}cm và CD = ${len2}cm`,
            visualSvg: createLineSegmentSVG(len1, `AB = ${len1}cm`) + createLineSegmentSVG(len2, `CD = ${len2}cm`),
            correctAnswer: op,
            options: shuffleArray(['>', '<', '=']),
            explanation: `${len1}cm ${op} ${len2}cm`
        };
    }

    // 3. Right angles (15%)
    else if (type < 0.5) {
        const isRight = Math.random() > 0.5;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Góc trong hình có phải là góc vuông không?`,
            visualSvg: createAngleSVG(isRight),
            correctAnswer: isRight ? 'Có' : 'Không',
            options: shuffleArray(['Có', 'Không']),
            explanation: isRight ? 'Đây là góc vuông (90°)' : 'Đây không phải góc vuông'
        };
    }

    // 4. Rectangle/Square identification (15%)
    else if (type < 0.65) {
        const isSquare = Math.random() > 0.5;
        const width = isSquare ? 6 : randomInt(8, 12);
        const height = isSquare ? 6 : randomInt(4, 6);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hình vẽ là hình gì?`,
            visualSvg: createRectangleSVG(width, height, isSquare),
            correctAnswer: isSquare ? 'Hình vuông' : 'Hình chữ nhật',
            options: shuffleArray(['Hình vuông', 'Hình chữ nhật', 'Hình tam giác', 'Hình tròn']),
            explanation: isSquare ? 'Hình vuông có 4 cạnh bằng nhau' : 'Hình chữ nhật có các cạnh đối bằng nhau'
        };
    }

    // 5. Triangle perimeter (15%)
    else if (type < 0.8) {
        const a = randomInt(3, 8);
        const b = randomInt(3, 8);
        const c = randomInt(3, 8);
        const perimeter = a + b + c;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính chu vi hình tam giác có 3 cạnh lần lượt là ${a}cm, ${b}cm, ${c}cm?`,
            visualSvg: createTriangleSVG(a, b, c),
            correctAnswer: `${perimeter}cm`,
            options: shuffleArray([`${perimeter}cm`, `${perimeter + 1}cm`, `${perimeter - 1}cm`, `${perimeter + 2}cm`]),
            explanation: `Chu vi = ${a} + ${b} + ${c} = ${perimeter}cm`
        };
    }

    // 6. Rectangle/Square perimeter (20%)
    else {
        const isSquare = Math.random() > 0.5;
        let perimeter: number;
        let width: number, height: number;

        if (isSquare) {
            const side = randomInt(4, 12);
            width = height = side;
            perimeter = side * 4;

            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính chu vi hình vuông có cạnh ${side}cm?`,
                visualSvg: createRectangleSVG(side, side, true),
                correctAnswer: `${perimeter}cm`,
                options: shuffleArray([`${perimeter}cm`, `${perimeter + 4}cm`, `${perimeter - 4}cm`, `${side * side}cm`]),
                explanation: `Chu vi = ${side} × 4 = ${perimeter}cm`
            };
        } else {
            width = randomInt(5, 10);
            height = randomInt(3, 7);
            perimeter = (width + height) * 2;

            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính chu vi hình chữ nhật có chiều dài ${width}cm, chiều rộng ${height}cm?`,
                visualSvg: createRectangleSVG(width, height, false),
                correctAnswer: `${perimeter}cm`,
                options: shuffleArray([`${perimeter}cm`, `${perimeter + 2}cm`, `${perimeter - 2}cm`, `${width * height}cm`]),
                explanation: `Chu vi = (${width} + ${height}) × 2 = ${perimeter}cm`
            };
        }
    }
};
