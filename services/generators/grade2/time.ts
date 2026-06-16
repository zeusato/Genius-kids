import { Question, QuestionType } from '../../../types';
import { clockSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const generateWrongAnswers = (correct: number, count: number, range: number = 5): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) {
        const offset = randomInt(-range, range);
        const val = correct + offset;
        if (val !== correct && val > 0) {
            wrongs.add(val);
        }
    }
    return Array.from(wrongs).map(String);
};

// --- SVG Helpers ---

// Đồng hồ dùng BỘ SVG DÙNG CHUNG (kim giờ đậm, kim phút đỏ, vạch phút, số rõ).
const createClockSVG = (hour: number, minute: number) => clockSVG(hour, minute);

const createCalendarSVG = (month: number, day: number, dayOfWeek: string) => {
    // Simple calendar page
    return `
      <svg width="150" height="180" viewBox="0 0 150 180" xmlns="http://www.w3.org/2000/svg">
        <!-- Top Red Part -->
        <rect x="10" y="10" width="130" height="50" fill="#ef4444" rx="5" />
        <text x="75" y="40" text-anchor="middle" fill="white" font-size="20" font-weight="bold">Tháng ${month}</text>
        
        <!-- Bottom White Part -->
        <rect x="10" y="60" width="130" height="110" fill="white" stroke="#e5e7eb" stroke-width="2" />
        <text x="75" y="120" text-anchor="middle" fill="black" font-size="48" font-weight="bold">${day}</text>
        <text x="75" y="155" text-anchor="middle" fill="#6b7280" font-size="18">${dayOfWeek}</text>
        
        <!-- Rings -->
        <circle cx="40" cy="15" r="5" fill="#d1d5db" />
        <circle cx="110" cy="15" r="5" fill="#d1d5db" />
      </svg>
    `;
};

// --- Generators ---

export const generateG2Time = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Reading Clock (Exact hour or Half hour) - 40%
    if (type < 0.4) {
        const hour = randomInt(1, 12);
        const isHalf = Math.random() > 0.5;
        const minute = isHalf ? 30 : 0;

        const timeStr = isHalf ? `${hour} giờ 30 phút` : `${hour} giờ đúng`;
        const altStr = isHalf ? `${hour} giờ rưỡi` : `${hour} giờ`;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Đồng hồ đang chỉ mấy giờ?`,
            visualSvg: createClockSVG(hour, minute),
            correctAnswer: altStr,
            options: shuffleArray([
                altStr,
                `${hour === 12 ? 1 : hour + 1} giờ${isHalf ? ' rưỡi' : ''}`,
                `${hour} giờ${isHalf ? '' : ' 30 phút'}`,
                `${hour === 1 ? 12 : hour - 1} giờ${isHalf ? ' rưỡi' : ''}`
            ]),
            explanation: `Kim ngắn chỉ ${isHalf ? 'giữa số ' + hour + ' và ' + (hour === 12 ? 1 : hour + 1) : 'số ' + hour}, kim dài chỉ số ${isHalf ? 6 : 12}.`
        };
    }

    // 2. Reading Calendar - 30%
    else if (type < 0.7) {
        const month = randomInt(1, 12);
        const day = randomInt(1, 28); // Safe for all months
        const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
        const dowIndex = randomInt(0, 6);
        const dow = daysOfWeek[dowIndex];

        const qType = Math.random();
        if (qType < 0.5) {
            // Ask for Date
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tờ lịch trên chỉ ngày bao nhiêu?`,
                visualSvg: createCalendarSVG(month, day, dow),
                correctAnswer: `Ngày ${day}`,
                options: shuffleArray([`Ngày ${day}`, `Ngày ${day + 1}`, `Ngày ${day - 1 > 0 ? day - 1 : 30}`, `Tháng ${day}`]),
                explanation: `Số lớn ở giữa tờ lịch chỉ ngày.`
            };
        } else {
            // Ask for Day of Week
            return {
                type: QuestionType.SingleChoice,
                questionText: `Tờ lịch trên chỉ thứ mấy?`,
                visualSvg: createCalendarSVG(month, day, dow),
                correctAnswer: dow,
                options: shuffleArray([dow, daysOfWeek[(dowIndex + 1) % 7], daysOfWeek[(dowIndex + 2) % 7], daysOfWeek[(dowIndex + 3) % 7]]),
                explanation: `Chữ bên dưới số ngày chỉ Thứ.`
            };
        }
    }

    // 3. Elapsed Time - 30%
    else {
        const start = randomInt(1, 10);
        const duration = randomInt(1, 12 - start);
        const end = start + duration;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Bây giờ là ${start} giờ. ${duration} tiếng nữa sẽ là mấy giờ?`,
            correctAnswer: `${end} giờ`,
            options: shuffleArray([`${end} giờ`, `${end + 1} giờ`, `${end - 1} giờ`, `${start} giờ`]),
            explanation: `${start} + ${duration} = ${end} (giờ).`
        };
    }
};
