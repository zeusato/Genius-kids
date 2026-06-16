import { Question, QuestionType } from '../../../types';
import { capitalize } from '../utils';
import { barChartSVG } from '../svg';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

// Biểu đồ cột — dùng BỘ SVG DÙNG CHUNG (cột nhiều màu, có trị số & nhãn).
export const createBarChartSVG = (data: { label: string, value: number }[]) => barChartSVG(data);

export const generateStatistics = (): Omit<Question, 'id' | 'topicId'> => {
    const categories = [
        { theme: 'Điểm số', items: ['Toán', 'Văn', 'Anh'] },
        { theme: 'Số học sinh', items: ['Lớp 4A', 'Lớp 4B', 'Lớp 4C'] },
        { theme: 'Số sách', items: ['Thứ 2', 'Thứ 3', 'Thứ 4'] }
    ];

    const cat = categories[randomInt(0, categories.length - 1)];
    const values = cat.items.map(() => randomInt(5, 25));
    const data = cat.items.map((item, i) => ({ label: item, value: values[i] }));

    const type = Math.random();

    // 1. Find maximum - 33%
    if (type < 0.33) {
        const maxValue = Math.max(...values);
        const maxIndex = values.indexOf(maxValue);
        const maxLabel = cat.items[maxIndex];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Theo biểu đồ, ${cat.theme.toLowerCase()} của mục nào là lớn nhất?`,
            visualSvg: createBarChartSVG(data),
            correctAnswer: maxLabel,
            options: shuffleArray(cat.items),
            explanation: `${maxLabel} có giá trị ${maxValue}, lớn nhất trong tất cả.`
        };
    }

    // 2. Find minimum - 33%
    else if (type < 0.66) {
        const minValue = Math.min(...values);
        const minIndex = values.indexOf(minValue);
        const minLabel = cat.items[minIndex];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Theo biểu đồ, ${cat.theme.toLowerCase()} của mục nào là nhỏ nhất?`,
            visualSvg: createBarChartSVG(data),
            correctAnswer: minLabel,
            options: shuffleArray(cat.items),
            explanation: `${minLabel} có giá trị ${minValue}, nhỏ nhất trong tấtcả.`
        };
    }

    // 3. Calculate difference - 34%
    else {
        const idx1 = 0;
        const idx2 = 1;
        const val1 = values[idx1];
        const val2 = values[idx2];

        // Đảm bảo luôn hỏi số lớn hơn số nhỏ
        const largerIdx = val1 > val2 ? idx1 : idx2;
        const smallerIdx = val1 > val2 ? idx2 : idx1;
        const diff = Math.abs(val1 - val2);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Theo biểu đồ, ${cat.theme.toLowerCase()} của ${cat.items[largerIdx]} hơn ${cat.items[smallerIdx]} bao nhiêu?`,
            visualSvg: createBarChartSVG(data),
            correctAnswer: diff.toString(),
            options: shuffleArray([diff.toString(), (diff + 1).toString(), (diff - 1).toString(), (diff + 2).toString()]),
            explanation: `${cat.items[largerIdx]} có ${values[largerIdx]}, ${cat.items[smallerIdx]} có ${values[smallerIdx]}. Chênh lệch: ${diff}.`
        };
    }
};
