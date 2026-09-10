import { QuestionType, type Question as SharedQuestion } from '../../../types';
import { withGeneratorRandom } from '../../../services/generators/random';
import { generateAddition10 } from '../../../services/generators/grade1/addition10';
import { generateSubtraction10 } from '../../../services/generators/grade1/subtraction10';
import { generateOperations20 } from '../../../services/generators/grade1/operations20';
import { generateNumbers100 } from '../../../services/generators/grade1/numbers100';
import { generateG2AddSubNoCarry } from '../../../services/generators/grade2/addSubNoCarry';
import { generateG2AddSubCarry } from '../../../services/generators/grade2/addSubCarry';
import { generateG2Multiplication } from '../../../services/generators/grade2/multiplication';
import { generateG2Division } from '../../../services/generators/grade2/division';
import { generateG3Arithmetic } from '../../../services/generators/grade3/arithmetic';
import { generateG3Multiplication } from '../../../services/generators/grade3/multiplication';
import { generateG3Division } from '../../../services/generators/grade3/division';
import { generateG3Area } from '../../../services/generators/grade3/area';
import { generateMultiplication } from '../../../services/generators/grade4/multiplications';
import { generateG4Average } from '../../../services/generators/grade4/average';
import { generateG4FractionOps } from '../../../services/generators/grade4/fractionOps';
import { generateG4Parentheses } from '../../../services/generators/grade4/parentheses';
import { generateG5Fractions } from '../../../services/generators/grade5/fractions';
import { generateG5DecimalOps } from '../../../services/generators/grade5/decimalOps';
import { generateG5Ratios } from '../../../services/generators/grade5/ratios';
import type { Config, Question } from './model';
import { rng } from './legacyQuestions';
import { answerKey, expressionValue, numericValue } from './questionValues';
export { rng } from './legacyQuestions';

type Generated = Omit<SharedQuestion, 'id' | 'topicId'>;
type Recipe = { topic: string; generate: () => Generated; accept: (q: Generated, text: string) => boolean; missing?: boolean; decimal?: boolean; bonus: number };
const simple = (_q: Generated, t: string) => /^\d[\d\s,]* [+−\-×÷:] [\d\s,]+ = \?$/.test(t);
const numbers = (t: string) => (t.replace(/(?<=\d)[ ,](?=\d{3}(?:\D|$))/g, '').match(/\d+/g) || []).map(Number);
const expression = (_q: Generated, t: string) => t.endsWith(' = ?') && expressionValue(t.slice(0, -4)) !== null;
const r = (topic: string, generate: () => Generated, accept: Recipe['accept'], bonus = 0, extras: Partial<Recipe> = {}): Recipe => ({ topic, generate, accept, bonus, ...extras });
const fraction = (q: Generated, t: string) => expression(q, t) && (numericValue(q.correctAnswer || '') ?? -1) >= 0;
const curriculum: Recipe[][][] = [
    [
        [r('g1_addition_10', generateAddition10, (q, t) => simple(q, t) && numbers(t).every(n => n >= 2)), r('g1_subtraction_10', generateSubtraction10, (q, t) => simple(q, t) && numbers(t)[1] >= 2 && Number(q.correctAnswer) >= 2)],
        [r('g1_operations_20', generateOperations20, (q, t) => simple(q, t) && numbers(t)[0] > 10), r('g1_operations_20', generateOperations20, (q, t) => simple(q, t) && t.includes('+') && Number(q.correctAnswer) > 10)],
        [r('g1_operations_20', generateOperations20, simple, 2, { missing: true }), r('g1_numbers_100', generateNumbers100, (_q, t) => t.startsWith('Điền số tròn chục'), 2)],
    ],
    [
        [r('g2_add_sub_no_carry', generateG2AddSubNoCarry, (q, t) => simple(q, t) && numbers(t)[1] >= 11 && numbers(t)[1] % 10 !== 0 && Number(q.correctAnswer) >= 10)],
        [r('g2_add_sub_carry', generateG2AddSubCarry, simple, 1)],
        [r('g2_add_sub_carry', generateG2AddSubCarry, (q, t) => simple(q, t) && numbers(t)[1] >= 10, 3, { missing: true }), r('g2_multiplication', generateG2Multiplication, (q, t) => q.type === QuestionType.ManualInput && Number(q.correctAnswer) >= 4 && t.includes('× ?'), 2), r('g2_division', generateG2Division, q => q.type === QuestionType.ManualInput && Number(q.correctAnswer) >= 18, 2)],
    ],
    [
        [r('g3_multiplication', generateG3Multiplication, (q, t) => simple(q, t) && numbers(t)[0] >= 12 && numbers(t)[0] < 100, 2), r('g3_division', generateG3Division, (q, t) => simple(q, t) && numbers(t)[0] < 100 && Number(q.correctAnswer) >= 11, 2)],
        [r('g3_arithmetic', generateG3Arithmetic, simple, 3), r('g3_multiplication', generateG3Multiplication, (q, t) => simple(q, t) && numbers(t)[0] >= 100, 3)],
        [r('g3_arithmetic', generateG3Arithmetic, simple, 4, { missing: true }), r('g3_arithmetic', generateG3Arithmetic, (q, t) => expression(q, t) && (t.match(/\+/g) || []).length === 2, 4), r('g3_area', generateG3Area, (_q, t) => t.includes('chu vi hình chữ nhật'), 5)],
    ],
    [
        [r('g4_multiplication', generateMultiplication, (q, t) => q.questionText.startsWith('Tính nhanh:') && simple(q, t) && Number(q.correctAnswer?.replaceAll(',', '')) >= 200, 2), r('g4_average', generateG4Average, (_q, t) => /^Trung bình cộng của các số \d+, \d+ là/.test(t), 3)],
        [r('g4_fraction_ops', generateG4FractionOps, (q, t) => fraction(q, t) && / [+−\-] /.test(t), 4), r('g4_average', generateG4Average, (_q, t) => /^Trung bình cộng của các số (\d+, ){2,3}\d+ là/.test(t), 4)],
        [r('g4_parentheses', generateG4Parentheses, (q, t) => expression(q, t) && /[×÷]/.test(t), 5), r('g4_fraction_ops', generateG4FractionOps, (q, t) => fraction(q, t) && /\d\/\d × \d\/\d/.test(t), 5), r('g4_average', generateG4Average, (_q, t) => t.includes('Tìm số còn lại'), 6)],
    ],
    [
        [r('g5_decimal_ops', generateG5DecimalOps, (q, t) => simple(q, t) && / [+−\-] /.test(t), 3, { decimal: true }), r('g5_fractions', generateG5Fractions, (q, t) => fraction(q, t) && / [+−\-] /.test(t), 3)],
        [r('g5_decimal_ops', generateG5DecimalOps, (q, t) => simple(q, t) && / [×÷:] \d+ =/.test(t), 4, { decimal: true }), r('g5_ratios', generateG5Ratios, (_q, t) => t.includes('là bao nhiêu phần trăm'), 4)],
        [r('g5_decimal_ops', generateG5DecimalOps, (q, t) => simple(q, t) && / [×÷:] \d+,\d+ =/.test(t), 6, { decimal: true }), r('g5_ratios', generateG5Ratios, (_q, t) => t.includes('giá sau khi giảm'), 7)],
    ],
];
const descriptions = [
    ['Cộng, trừ trong 10', 'Cộng, trừ qua 10 đến 20', 'Tìm số còn thiếu · Dãy số đến 100'],
    ['Cộng, trừ hai chữ số không nhớ', 'Cộng, trừ có nhớ trong 100', 'Tìm thành phần phép tính · Bảng nhân, chia 2–5'],
    ['Nhân, chia số hai chữ số', 'Cộng, trừ đến 10.000 · Nhân số ba chữ số', 'Tìm số · Tổng ba số · Chu vi hình chữ nhật'],
    ['Nhân nhẩm số lớn · Trung bình hai số', 'Cộng, trừ phân số khác mẫu · Trung bình nhiều số', 'Biểu thức có ngoặc · Nhân phân số · Tìm số từ trung bình'],
    ['Cộng, trừ số thập phân và phân số', 'Nhân, chia thập phân với số tự nhiên · Tỉ số phần trăm', 'Nhân, chia hai số thập phân · Bài toán giảm giá'],
];
export const syllabus = (grade: number, difficulty: Config['difficulty']) => descriptions[Math.max(0, Math.min(4, grade - 1))][['easy', 'medium', 'hard'].indexOf(difficulty)];
const shuffle = <T,>(xs: T[], random: () => number) => { const result = [...xs]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; };
function clean(text: string, decimal = false) {
    return (decimal ? text : text.replace(/(\d),(?=\d{3}(?:\D|$))/g, '$1 '))
        .replaceAll('\\n', ' ').replace(/^(?:Tính nhanh|Tính|Tìm x biết):\s*/i, '').replace(/\s*\(Tính nhanh\)\s*/g, '').replace(/−/g, '-').replace(/\s+/g, ' ').trim();
}
export function questionsFor(config: Config, seed: number, count: number): Question[] {
    const random = rng(seed), recipes = curriculum[config.grade - 1][['easy', 'medium', 'hard'].indexOf(config.difficulty)], result: Question[] = [], seen = new Set<string>();
    let deck: Recipe[] = [];
    for (let id = 0; id < count; id++) {
        if (!deck.length) deck = shuffle(recipes, random);
        let recipe = deck.pop()!;
        const alternatives = recipes.filter(r => r !== recipe);
        let question: Question | undefined;
        // Small domains (e.g. tens sequences in grade 1) can run out in a long
        // race. Continue with another skill at the same grade/difficulty.
        for (let attempt = 0; attempt < 400 * (1 + alternatives.length) && !question; attempt++) {
            if (attempt > 0 && attempt % 400 === 0) recipe = alternatives[attempt / 400 - 1];
            const sourceSeed = Math.floor(random() * 0x100000000);
            const raw = withGeneratorRandom(rng(sourceSeed), recipe.generate), rawText = clean(raw.questionText, recipe.decimal);
            if (![QuestionType.SingleChoice, QuestionType.ManualInput].includes(raw.type) || !raw.correctAnswer || !recipe.accept(raw, rawText)) continue;
            let text = rawText, answer = clean(raw.correctAnswer, recipe.decimal), explanation = clean(raw.explanation, recipe.decimal);
            let options = (raw.options || []).map(o => clean(o, recipe.decimal));
            if (recipe.missing) {
                const match = text.match(/^(\d[\d ]*) ([+\-×÷:]) (\d[\d ]*) = \?$/); if (!match) continue;
                const [, a, op, b] = match; text = `${a} ${op} ? = ${answer}`; explanation = `${a} ${op} ${b} = ${answer}. Số cần tìm là ${b}.`; answer = b; options = [];
            }
            const value = numericValue(answer);
            if (text.length > 135 || answer.length > 11 || value !== null && value < 0 || seen.has(text)) continue;
            if (text.endsWith(' = ?')) { const v = expressionValue(text.slice(0, -4)); if (v !== null && (value === null || Math.abs(v - value) > 1e-7)) continue; }
            const unique = new Map<string, string>([[answerKey(answer), answer]]);
            for (const option of options) {
                const v = numericValue(option);
                if (option.length > 11 || v !== null && (v < 0 || value !== null && value >= 20 && (v > value * 2.5 || v < value * .15))) continue;
                if (!unique.has(answerKey(option))) unique.set(answerKey(option), option);
            }
            // Adapt manual-input questions and remove equivalent fractions.
            for (let n = 1; unique.size < 3 && n < 20 && value !== null; n++) {
                const f = answer.match(/^(\d+)\/(\d+)$/);
                if (f) { const label = `${Number(f[1]) + n}/${f[2]}`; unique.set(answerKey(label), label); continue; }
                const delta = Number.isInteger(value) ? config.grade >= 3 && value >= 20 ? n * 10 : n : n / 10;
                const v = value + (n % 2 ? delta : -delta); if (v < 0) continue;
                const label = Number(v.toFixed(4)).toString().replace('.', ','); unique.set(answerKey(label), label);
            }
            if (unique.size < 3) continue;
            const wrong = shuffle([...unique.entries()].filter(([key]) => key !== answerKey(answer)).map(([, label]) => label), random).slice(0, 2);
            question = { id, text, answer, options: shuffle([answer, ...wrong], random), explanation,
                kind: recipe.missing || raw.type === QuestionType.ManualInput ? 'missing' : 'curriculum', readBonus: recipe.bonus,
                source: { topic: recipe.topic, seed: sourceSeed, variant: recipe.missing ? 'missing' : 'original' } };
        }
        if (!question) throw new Error(`Không tạo được câu ${recipe.topic} phù hợp đường đua.`);
        seen.add(question.text); result.push(question);
    }
    return result;
}
