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

const generateWrongAnswers = (correct: number, count: number, range: number): string[] => {
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

export const generateG2AddSubCarry = (): Omit<Question, 'id' | 'topicId'> => {
    const isAdd = Math.random() > 0.5;
    let a, b, ans;

    if (isAdd) {
        // a + b < 100, unit digits sum >= 10
        const a_units = randomInt(1, 9);
        const b_units = randomInt(10 - a_units, 9); // Ensure carry
        const a_tens = randomInt(1, 7);
        const b_tens = randomInt(0, 8 - a_tens); // Ensure sum < 100
        a = a_tens * 10 + a_units;
        b = b_tens * 10 + b_units;
        ans = a + b;
    } else {
        // a - b, borrow needed. a_units < b_units
        const a_tens = randomInt(2, 9);
        const b_tens = randomInt(1, a_tens - 1);
        const a_units = randomInt(0, 8);
        const b_units = randomInt(a_units + 1, 9); // Ensure borrow
        a = a_tens * 10 + a_units;
        b = b_tens * 10 + b_units;
        ans = a - b;
    }

    return {
        type: QuestionType.SingleChoice,
        questionText: `${a} ${isAdd ? '+' : '-'} ${b} = ?`,
        correctAnswer: ans.toString(),
        options: shuffleArray([ans.toString(), ...generateWrongAnswers(ans, 3, 10)]),
        explanation: isAdd ? `Hàng đơn vị cộng lại lớn hơn 10, nhớ 1 sang hàng chục.` : `Hàng đơn vị không trừ được, mượn 1 chục.`
    };
};
