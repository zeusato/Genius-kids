import { Question, QuestionType } from '../../../types';
import { capitalize } from '../utils';
import { angleSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

// Góc — dùng BỘ SVG DÙNG CHUNG (hai tia + cung + nhãn số đo).
export const createAngleSVG = (degrees: number) => angleSVG(degrees);

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
