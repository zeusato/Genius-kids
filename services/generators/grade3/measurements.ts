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

// SVG for ruler/scale
const createRulerSVG = (length: number, unit: string) => `
  <svg width="400" height="120" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
    <rect x="30" y="40" width="${Math.min(340, length * 30)}" height="40" fill="#fef3c7" stroke="#0f172a" stroke-width="2"/>
    <text x="200" y="25" text-anchor="middle" font-size="16" font-weight="bold">${length}${unit}</text>
  </svg>
`;

// SVG for clock
const createClockSVG = (hours: number, minutes: number) => {
    const hourAngle = ((hours % 12) + minutes / 60) * 30 - 90;
    const minuteAngle = minutes * 6 - 90;
    const hourRad = (hourAngle * Math.PI) / 180;
    const minuteRad = (minuteAngle * Math.PI) / 180;

    return `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="80" fill="#fff" stroke="#0f172a" stroke-width="3"/>
      ${[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const x = 100 + 70 * Math.cos(angle);
        const y = 100 + 70 * Math.sin(angle);
        return `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="16" font-weight="bold">${i === 0 ? 12 : i}</text>`;
    }).join('')}
      <line x1="100" y1="100" x2="${100 + 40 * Math.cos(hourRad)}" y2="${100 + 40 * Math.sin(hourRad)}" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
      <line x1="100" y1="100" x2="${100 + 60 * Math.cos(minuteRad)}" y2="${100 + 60 * Math.sin(minuteRad)}" stroke="#0ea5e9" stroke-width="4" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="5" fill="#0f172a"/>
    </svg>
  `;
};

export const generateG3Measurements = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Length conversions (30%)
    if (type < 0.3) {
        const conversions = [
            { from: 'cm', to: 'mm', factor: 10 },
            { from: 'dm', to: 'cm', factor: 10 },
            { from: 'm', to: 'dm', factor: 10 },
            { from: 'm', to: 'cm', factor: 100 }
        ];
        const conv = conversions[randomInt(0, 3)];
        const value = randomInt(2, 50);
        const answer = value * conv.factor;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${value}${conv.from} = ? ${conv.to}`,
            visualSvg: createRulerSVG(value, conv.from),
            correctAnswer: `${answer}${conv.to}`,
            options: shuffleArray([
                `${answer}${conv.to}`,
                `${answer + conv.factor}${conv.to}`,
                `${answer - conv.factor}${conv.to}`,
                `${Math.floor(answer / 2)}${conv.to}`
            ]),
            explanation: `1${conv.from} = ${conv.factor}${conv.to}, nên ${value}${conv.from} = ${answer}${conv.to}`
        };
    }

    // 2. Mass conversions (20%)
    else if (type < 0.5) {
        const value = randomInt(2, 20);
        const isToGram = Math.random() > 0.5;
        const answer = isToGram ? value * 1000 : value;

        return {
            type: QuestionType.SingleChoice,
            questionText: isToGram ? `${value}kg = ? g` : `${value * 1000}g = ? kg`,
            correctAnswer: isToGram ? `${answer}g` : `${answer}kg`,
            options: shuffleArray(isToGram
                ? [`${answer}g`, `${answer + 1000}g`, `${answer - 1000}g`, `${value}g`]
                : [`${answer}kg`, `${answer + 1}kg`, `${answer - 1}kg`, `${value * 1000}kg`]
            ),
            explanation: `1kg = 1000g`
        };
    }

    // 3. Capacity (15%)
    else if (type < 0.65) {
        const value = randomInt(2, 10);
        const isToMl = Math.random() > 0.5;
        const answer = isToMl ? value * 1000 : value;

        return {
            type: QuestionType.SingleChoice,
            questionText: isToMl ? `${value}L = ? mL` : `${value * 1000}mL = ? L`,
            correctAnswer: isToMl ? `${answer}mL` : `${answer}L`,
            options: shuffleArray(isToMl
                ? [`${answer}mL`, `${answer + 1000}mL`, `${answer - 1000}mL`, `${value}mL`]
                : [`${answer}L`, `${answer + 1}L`, `${answer - 1}L`, `${value * 1000}L`]
            ),
            explanation: `1L = 1000mL`
        };
    }

    // 4. Read clock (20%)
    else if (type < 0.85) {
        const hours = randomInt(1, 12);
        const minutes = [0, 15, 30, 45][randomInt(0, 3)];
        const minuteText = minutes === 0 ? 'giờ' : minutes === 15 ? 'giờ 15 phút' : minutes === 30 ? 'giờ rưỡi' : 'giờ 45 phút';

        return {
            type: QuestionType.SingleChoice,
            questionText: `Đồng hồ chỉ mấy giờ?`,
            visualSvg: createClockSVG(hours, minutes),
            correctAnswer: `${hours} ${minuteText}`,
            options: shuffleArray([
                `${hours} ${minuteText}`,
                `${hours + 1} ${minuteText}`,
                `${hours} giờ ${(minutes + 15) % 60} phút`,
                `${(hours % 12) + 1} giờ`
            ]),
            explanation: `Đồng hồ chỉ ${hours} ${minuteText}`
        };
    }

    // 5. Time duration (15%)
    else {
        const start = randomInt(7, 11);
        const duration = randomInt(1, 3);
        const end = start + duration;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Bắt đầu lúc ${start} giờ, kết thúc lúc ${end} giờ. Thời gian là bao lâu?`,
            correctAnswer: `${duration} giờ`,
            options: shuffleArray([`${duration} giờ`, `${duration + 1} giờ`, `${duration - 1} giờ`, `${end} giờ`]),
            explanation: `${end} - ${start} = ${duration} giờ`
        };
    }
};
