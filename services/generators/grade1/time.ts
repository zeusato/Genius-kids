import { Question, QuestionType } from '../../../types';
import { capitalize, createOptionsWithAnswer } from '../utils';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const createTimeOfDaySVG = (period: string) => {
    const periods: { [key: string]: { icon: string, color: string } } = {
        'sáng': { icon: '☀️', color: '#FFD700' },
        'trưa': { icon: '🌞', color: '#FF8C00' },
        'chiều': { icon: '🌅', color: '#FF6B6B' },
        'tối': { icon: '🌙', color: '#4169E1' }
    };
    const p = periods[period];
    return `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="60" fill="${p.color}" opacity="0.3"/>
      <text x="100" y="110" text-anchor="middle" font-size="60">${p.icon}</text>
    </svg>
  `;
};

export const generateTime = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    if (type < 0.33) {
        // Time of day
        const periods = ['sáng', 'trưa', 'chiều', 'tối'];
        const period = periods[randomInt(0, 3)];
        return {
            type: QuestionType.SingleChoice,
            questionText: `Đây là buổi nào trong ngày?`,
            visualSvg: createTimeOfDaySVG(period),
            correctAnswer: capitalize(`Buổi ${period}`),
            options: shuffleArray(periods.map(p => capitalize(`Buổi ${p}`))),
            explanation: `Đây là buổi ${period}.`
        };
    } else if (type < 0.66) {
        // Days of week
        const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
        const idx = randomInt(0, 6);
        const day = days[idx];
        const nextDay = days[(idx + 1) % 7];
        return {
            type: QuestionType.SingleChoice,
            questionText: `Hôm nay là ${day}. Ngày mai là thứ mấy?`,
            correctAnswer: nextDay,
            options: createOptionsWithAnswer(nextDay, days),
            explanation: `Sau ${day} là ${nextDay}.`
        };
    } else {
        // Activity matching
        const activities = [
            { activity: 'Đi học', time: 'Buổi sáng' },
            { activity: 'Ăn trưa', time: 'Buổi trưa' },
            { activity: 'Chơi thể thao', time: 'Buổi chiều' },
            { activity: 'Đi ngủ', time: 'Buổi tối' }
        ];
        const chosen = activities[randomInt(0, 3)];
        return {
            type: QuestionType.SingleChoice,
            questionText: `"${chosen.activity}" thường diễn ra vào buổi nào?`,
            correctAnswer: chosen.time,
            options: shuffleArray(['Buổi sáng', 'Buổi trưa', 'Buổi chiều', 'Buổi tối']),
            explanation: `${chosen.activity} thường vào ${chosen.time.toLowerCase()}.`
        };
    }
};
