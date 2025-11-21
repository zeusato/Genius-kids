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

// Create SVG for angle
const createAngleSVG = (degrees: number) => {
    const cx = 200;
    const cy = 150;
    const r = 100;

    const angle1Rad = 0;
    const angle2Rad = (degrees * Math.PI) / 180;

    const x1 = cx + r * Math.cos(angle1Rad);
    const y1 = cy - r * Math.sin(angle1Rad);
    const x2 = cx + r * Math.cos(angle2Rad);
    const y2 = cy - r * Math.sin(angle2Rad);

    const largeArc = degrees > 180 ? 1 : 0;

    return `
    <svg width="400" height="200" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
      <!-- Base line -->
      <line x1="${cx - 120}" y1="${cy}" x2="${cx + 120}" y2="${cy}" stroke="#334155" stroke-width="3" />
      
      <!-- Angle line -->
      <line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#334155" stroke-width="3" />
      
      <!-- Arc -->
      <path d="M ${x1} ${y1} A ${r / 2} ${r / 2} 0 ${largeArc} 0 ${cx + (r / 2) * Math.cos(angle2Rad)} ${cy - (r / 2) * Math.sin(angle2Rad)}" 
            fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4"/>
      
      <!-- Angle label -->
      <text x="${cx + 60}" y="${cy - 20}" font-size="20" fill="#0f172a">${degrees}°</text>
      
      <!-- Vertex point -->
      <circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a" />
    </svg>
  `;
};

export const generateAngles = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Identify angle type - 40%
    if (type < 0.4) {
        const angleTypes = [
            { range: [1, 89], name: 'góc nhọn' },
            { range: [90, 90], name: 'góc vuông' },
            { range: [91, 179], name: 'góc tù' },
            { range: [180, 180], name: 'góc bẹt' }
        ];
        const at = angleTypes[randomInt(0, 3)];
        const angle = randomInt(at.range[0], at.range[1]);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Góc trong hình là loại góc gì?`,
            visualSvg: createAngleSVG(angle),
            correctAnswer: capitalize(at.name),
            options: shuffleArray(['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt']),
            explanation: `Góc ${angle}° là ${at.name}.`
        };
    }

    // 2. Measure angle - 30%
    else if (type < 0.7) {
        const angle = randomInt(10, 170);
        const roundedAngle = Math.round(angle / 10) * 10;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Góc trong hình có số đo gần bằng bao nhiêu độ?`,
            visualSvg: createAngleSVG(angle),
            correctAnswer: `${roundedAngle}°`,
            options: shuffleArray([
                `${roundedAngle}°`,
                `${roundedAngle + 10}°`,
                `${roundedAngle - 10}°`,
                `${roundedAngle + 20}°`
            ]),
            explanation: `Góc đo được khoảng ${roundedAngle}°.`
        };
    }

    // 3. Compare angles - 30%
    else {
        const angle1 = randomInt(30, 150);
        const angle2 = randomInt(30, 150);

        let ans = '=';
        if (angle1 > angle2) ans = '>';
        if (angle1 < angle2) ans = '<';

        return {
            type: QuestionType.SingleChoice,
            questionText: `So sánh: ${angle1}° ... ${angle2}°`,
            correctAnswer: ans,
            options: shuffleArray(['>', '<', '=']),
            explanation: `${angle1}° ${ans} ${angle2}°`
        };
    }
};
