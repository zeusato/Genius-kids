import { Question, QuestionType } from '../../../types';
import { formatNumber, capitalize, numberToVietnamese } from '../utils';
import { generateWrongAnswersWithSameUnits } from '../../mathEngine';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

// Using generateWrongAnswersWithSameUnits from mathEngine

export const generateLargeNumbers = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Compare numbers - 25%
    if (type < 0.25) {
        const nums = [
            randomInt(10000, 99999999),
            randomInt(10000, 99999999),
            randomInt(10000, 99999999)
        ].sort((a, b) => a - b);

        const qType = randomInt(0, 1);
        if (qType === 0) {
            // Find largest
            return {
                type: QuestionType.SingleChoice,
                questionText: `Số nào lớn nhất trong các số sau: ${nums.map(formatNumber).join(', ')}?`,
                correctAnswer: formatNumber(nums[2]),
                options: shuffleArray(nums.map(formatNumber)),
                explanation: `So sánh từng hàng từ trái sang phải. ${formatNumber(nums[2])} là số lớn nhất.`
            };
        } else {
            // Find smallest
            return {
                type: QuestionType.SingleChoice,
                questionText: `Số nào nhỏ nhất trong các số sau: ${nums.map(formatNumber).join(', ')}?`,
                correctAnswer: formatNumber(nums[0]),
                options: shuffleArray(nums.map(formatNumber)),
                explanation: `So sánh từng hàng từ trái sang phải. ${formatNumber(nums[0])} là số nhỏ nhất.`
            };
        }
    }

    // 2. Rounding - 25%
    else if (type < 0.5) {
        const num = randomInt(10000, 999999);
        const roundTypes = [
            { to: 10, name: 'hàng chục' },
            { to: 100, name: 'hàng trăm' },
            { to: 1000, name: 'hàng nghìn' },
            { to: 10000, name: 'hàng chục nghìn' }
        ];
        const rt = roundTypes[randomInt(0, 3)];
        const rounded = Math.round(num / rt.to) * rt.to;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Làm tròn số ${formatNumber(num)} đến ${rt.name}?`,
            correctAnswer: formatNumber(rounded),
            options: shuffleArray([
                formatNumber(rounded),
                ...generateWrongAnswersWithSameUnits(rounded, 3, rt.to * 5).map(n => formatNumber(n))
            ]),
            explanation: `Xét chữ số hàng ngay sau ${rt.name}. Nếu ≥5 thì làm tròn lên, <5 thì làm tròn xuống.`
        };
    }

    // 3. Number decomposition (place value) - 25%
    else if (type < 0.75) {
        const num = randomInt(100000, 9999999);
        const digits = num.toString().split('').map(Number);
        const len = digits.length;

        // Pick a random position
        const pos = randomInt(0, len - 1);
        const placeValue = digits[pos] * Math.pow(10, len - 1 - pos);

        const placeNames = [
            'đơn vị', 'chục', 'trăm', 'nghìn', 'chục nghìn',
            'trăm nghìn', 'triệu', 'chục triệu', 'trăm triệu'
        ];
        const placeName = placeNames[len - 1 - pos];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Trong số ${formatNumber(num)}, chữ số ${digits[pos]} thuộc hàng ${placeName} có giá trị là bao nhiêu?`,
            correctAnswer: formatNumber(placeValue),
            options: shuffleArray([
                formatNumber(placeValue),
                digits[pos].toString(),
                formatNumber(placeValue * 10),
                formatNumber(placeValue / 10)
            ]),
            explanation: `Chữ số ${digits[pos]} ở hàng ${placeName} có giá trị là ${formatNumber(placeValue)}.`
        };
    }

    // 4. Read number in words - 25%
    else {
        const num = randomInt(10000, 9999999);
        const words = capitalize(numberToVietnamese(num));

        // Generate wrong options
        const wrong1 = capitalize(numberToVietnamese(num + randomInt(1000, 10000)));
        const wrong2 = capitalize(numberToVietnamese(num - randomInt(1000, 10000)));
        const wrong3 = capitalize(numberToVietnamese(num + randomInt(100, 900)));

        return {
            type: QuestionType.SingleChoice,
            questionText: `Cách đọc của số ${formatNumber(num)} là gì?`,
            correctAnswer: words,
            options: shuffleArray([words, wrong1, wrong2, wrong3]),
            explanation: `Số ${formatNumber(num)} đọc là: "${words}".`
        };
    }
};
