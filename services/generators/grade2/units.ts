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

const generateWrongAnswers = (correct: number, count: number, range: number = 5): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) {
        const offset = randomInt(-range, range);
        const val = correct + offset;
        if (val !== correct && val >= 0) {
            wrongs.add(val);
        }
    }
    return Array.from(wrongs).map(String);
};

// --- SVG Helpers ---

const createRulerSVG = (lengthCm: number) => {
    // Draw a ruler showing the length
    const pixelsPerCm = 30;
    const rulerWidth = (lengthCm + 2) * pixelsPerCm;
    const rulerHeight = 80;

    let ticks = '';
    for (let i = 0; i <= lengthCm + 1; i++) {
        const x = (i + 0.5) * pixelsPerCm;
        const h = i % 5 === 0 ? 20 : 10;
        ticks += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="black" stroke-width="1" />`;
        if (i % 5 === 0) {
            ticks += `<text x="${x}" y="35" font-size="12" text-anchor="middle">${i}</text>`;
        }
    }

    // Object line
    const objStart = 0.5 * pixelsPerCm;
    const objEnd = (lengthCm + 0.5) * pixelsPerCm;

    return `
      <svg width="${rulerWidth}" height="${rulerHeight + 40}" viewBox="0 0 ${rulerWidth} ${rulerHeight + 40}" xmlns="http://www.w3.org/2000/svg">
        <!-- Ruler Body -->
        <rect x="0" y="0" width="${rulerWidth}" height="${rulerHeight}" fill="#fefce8" stroke="#ca8a04" stroke-width="2" />
        ${ticks}
        <text x="${rulerWidth - 20}" y="35" font-size="12" font-weight="bold">cm</text>
        
        <!-- Object being measured -->
        <rect x="${objStart}" y="50" width="${lengthCm * pixelsPerCm}" height="10" fill="#3b82f6" />
        <line x1="${objStart}" y1="45" x2="${objStart}" y2="70" stroke="red" stroke-dasharray="4" />
        <line x1="${objEnd}" y1="45" x2="${objEnd}" y2="70" stroke="red" stroke-dasharray="4" />
      </svg>
    `;
};

const createBalanceScaleSVG = (leftWeight: number, rightWeight: number) => {
    // Simple balance scale
    const w = 300;
    const h = 150;
    const cx = w / 2;
    const cy = h - 20;

    // Tilt calculation
    let angle = 0;
    if (leftWeight > rightWeight) angle = -15;
    else if (leftWeight < rightWeight) angle = 15;

    // Beam
    const beamLen = 200;
    const beamY = 50;

    return `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <!-- Base -->
        <path d="M ${cx} ${beamY} L ${cx - 20} ${cy} L ${cx + 20} ${cy} Z" fill="#94a3b8" />
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${beamY}" stroke="#475569" stroke-width="4" />
        
        <!-- Rotating Group -->
        <g transform="rotate(${angle}, ${cx}, ${beamY})">
            <!-- Beam -->
            <rect x="${cx - beamLen / 2}" y="${beamY - 2}" width="${beamLen}" height="4" fill="#334155" />
            
            <!-- Left Plate -->
            <line x1="${cx - beamLen / 2 + 10}" y1="${beamY}" x2="${cx - beamLen / 2 + 10}" y2="${beamY + 40}" stroke="#cbd5e1" />
            <rect x="${cx - beamLen / 2 - 10}" y="${beamY + 40}" width="40" height="10" fill="#cbd5e1" />
            <text x="${cx - beamLen / 2 + 10}" y="${beamY + 35}" text-anchor="middle" font-size="14" font-weight="bold">${leftWeight}kg</text>
            
            <!-- Right Plate -->
            <line x1="${cx + beamLen / 2 - 10}" y1="${beamY}" x2="${cx + beamLen / 2 - 10}" y2="${beamY + 40}" stroke="#cbd5e1" />
            <rect x="${cx + beamLen / 2 - 30}" y="${beamY + 40}" width="40" height="10" fill="#cbd5e1" />
            <text x="${cx + beamLen / 2 - 10}" y="${beamY + 35}" text-anchor="middle" font-size="14" font-weight="bold">${rightWeight}kg</text>
        </g>
      </svg>
    `;
};

// --- Generators ---

export const generateG2Units = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Length (Ruler Reading) - 25%
    if (type < 0.25) {
        const len = randomInt(1, 15);
        return {
            type: QuestionType.SingleChoice,
            questionText: `Độ dài của thanh màu xanh là bao nhiêu xăng-ti-mét?`,
            visualSvg: createRulerSVG(len),
            correctAnswer: len.toString(),
            options: shuffleArray([len.toString(), ...generateWrongAnswers(len, 3)]),
            explanation: `Nhìn vào thước kẻ, thanh màu xanh kéo dài từ vạch 0 đến vạch ${len}.`
        };
    }

    // 2. Mass (Balance Scale) - 25%
    else if (type < 0.5) {
        const w1 = randomInt(1, 10);
        const w2 = randomInt(1, 10);

        let ans = '';
        let qText = '';

        if (w1 > w2) {
            ans = 'nặng hơn';
            qText = `Bên trái (Left) ... bên phải (Right)`;
        } else if (w1 < w2) {
            ans = 'nhẹ hơn';
            qText = `Bên trái (Left) ... bên phải (Right)`;
        } else {
            ans = 'bằng nhau';
            qText = `Hai bên ...`;
        }

        return {
            type: QuestionType.SingleChoice,
            questionText: `Quan sát cân và điền từ thích hợp: ${w1}kg ... ${w2}kg`,
            visualSvg: createBalanceScaleSVG(w1, w2),
            correctAnswer: ans,
            options: shuffleArray(['nặng hơn', 'nhẹ hơn', 'bằng nhau']),
            explanation: `${w1}kg so với ${w2}kg thì ${ans}.`
        };
    }

    // 3. Volume (Word Problem) - 25%
    else if (type < 0.75) {
        const vol1 = randomInt(2, 10);
        const vol2 = randomInt(2, 10);
        const isAdd = Math.random() > 0.5;

        if (isAdd) {
            const total = vol1 + vol2;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Can thứ nhất đựng ${vol1} lít nước. Can thứ hai đựng ${vol2} lít nước. Hỏi cả hai can đựng bao nhiêu lít nước?`,
                correctAnswer: total.toString(),
                options: shuffleArray([total.toString(), ...generateWrongAnswers(total, 3)]),
                explanation: `${vol1} + ${vol2} = ${total} (lít).`
            };
        } else {
            const total = vol1 + vol2;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Trong thùng có ${total} lít nước. Mẹ múc ra ${vol1} lít để tưới cây. Hỏi trong thùng còn lại bao nhiêu lít nước?`,
                correctAnswer: vol2.toString(),
                options: shuffleArray([vol2.toString(), ...generateWrongAnswers(vol2, 3)]),
                explanation: `${total} - ${vol1} = ${vol2} (lít).`
            };
        }
    }

    // 4. Unit Conversion (m <-> cm) - 25%
    else {
        const isToCm = Math.random() > 0.5;
        if (isToCm) {
            const m = randomInt(1, 9);
            const cm = m * 100;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${m}m = ... cm`,
                correctAnswer: cm.toString(),
                options: shuffleArray([cm.toString(), (m * 10).toString(), (m + 100).toString(), (m * 1000).toString()]),
                explanation: `1m = 100cm. Vậy ${m}m = ${cm}cm.`
            };
        } else {
            const m = randomInt(1, 9);
            const cm = m * 100;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Đổi đơn vị: ${cm}cm = ... m`,
                correctAnswer: m.toString(),
                options: shuffleArray([m.toString(), (m * 10).toString(), (m * 100).toString(), (cm - 100).toString()]),
                explanation: `100cm = 1m. Vậy ${cm}cm = ${m}m.`
            };
        }
    }
};
