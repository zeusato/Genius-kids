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

const generateWrongAnswers = (correct: number, count: number, range: number = 50): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) {
        const offset = randomInt(-range, range);
        const val = correct + offset;
        if (val !== correct && val > 0) {
            wrongs.add(val);
        }
    }
    return Array.from(wrongs).map(n => formatNumber(n));
};

export const generateG5WordProblems = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Sum-difference-ratio (40%)
    if (type < 0.4) {
        // Two numbers with known sum and difference
        const diff = randomInt(10, 40) * 2; // Even diff for integer results
        const smaller = randomInt(50, 150);
        const larger = smaller + diff;
        const sum = larger + smaller;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hai số có tổng là ${formatNumber(sum)} và hiệu là ${diff}. Số lớn là bao nhiêu?`,
            correctAnswer: formatNumber(larger),
            options: shuffleArray([formatNumber(larger), formatNumber(smaller), formatNumber(sum), formatNumber(diff)]),
            explanation: `Số lớn = (Tổng + Hiệu) : 2 = (${formatNumber(sum)} + ${diff}) : 2 = ${formatNumber(larger)}`
        };
    }

    // 2. Motion problems - meeting (35%)
    else if (type < 0.75) {
        const speed1 = randomInt(40, 60);
        const speed2 = randomInt(30, 50);
        const time = randomInt(2, 4);
        const distance = (speed1 + speed2) * time;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hai xe xuất phát cùng lúc từ hai địa điểm cách nhau ${distance}km, đi ngược chiều nhau. Xe thứ nhất chạy ${speed1}km/h, xe thứ hai chạy ${speed2}km/h. Hỏi sau bao lâu hai xe gặp nhau?`,
            correctAnswer: `${time} giờ`,
            options: shuffleArray([
                `${time} giờ`,
                `${time + 1} giờ`,
                `${time - 1} giờ`,
                `${Math.floor(distance / speed1)} giờ`
            ]),
            explanation: `Vận tốc gặp nhau = ${speed1} + ${speed2} = ${speed1 + speed2}km/h\\nThời gian = ${distance} : ${speed1 + speed2} = ${time} giờ`
        };
    }

    // 3. Work rate problems (25%)
    else {
        const days1 = randomInt(6, 12);
        const days2 = randomInt(8, 15);
        // Calculate combined work rate
        const combinedRate = 1 / days1 + 1 / days2;
        const daysTogether = Math.round(1 / combinedRate);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Người thứ nhất làm một mình xong công việc trong ${days1} ngày. Người thứ hai làm một mình xong trong ${days2} ngày. Hỏi hai người cùng làm thì xong trong bao lâu?`,
            correctAnswer: `${daysTogether} ngày`,
            options: shuffleArray([
                `${daysTogether} ngày`,
                `${daysTogether + 1} ngày`,
                `${Math.floor((days1 + days2) / 2)} ngày`,
                `${days1} ngày`
            ]),
            explanation: `Một ngày người 1 làm: 1/${days1} công việc\\nMột ngày người 2 làm: 1/${days2} công việc\\nMột ngày cả hai làm: 1/${days1} + 1/${days2} công việc\\nThời gian ≈ ${daysTogether} ngày`
        };
    }
};
