import { GENERAL_KNOWLEDGE_DATA, GeneralKnowledgeQuestion } from './data/generalKnowledge';

export type SpeedDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'math' | 'typing' | 'quiz' | 'clock' | 'color' | 'shape' | 'counting';

export interface SpeedQuestion {
    id: string;
    type: QuestionType;
    content: string; // Text to display
    visual?: string; // SVG or Image URL
    options?: string[]; // For multiple choice
    correctAnswer: string;
    timeLimit: number; // Seconds
    color?: string; // For color questions
}

// --- CONFIGURATION ---
const TIME_LIMITS = {
    easy: 15,
    medium: 12,
    hard: 10
};

const COLORS = [
    { name: 'Đỏ', value: '#ef4444' },
    { name: 'Xanh dương', value: '#3b82f6' },
    { name: 'Xanh lá', value: '#22c55e' },
    { name: 'Vàng', value: '#eab308' },
    { name: 'Tím', value: '#a855f7' },
    { name: 'Cam', value: '#f97316' },
    { name: 'Hồng', value: '#ec4899' },
    { name: 'Đen', value: '#000000' }
];

const SHAPES = [
    { name: 'Hình tròn', svg: '<circle cx="50" cy="50" r="40" fill="currentColor" />' },
    { name: 'Hình vuông', svg: '<rect x="10" y="10" width="80" height="80" fill="currentColor" />' },
    { name: 'Hình tam giác', svg: '<polygon points="50,10 90,90 10,90" fill="currentColor" />' },
    { name: 'Hình chữ nhật', svg: '<rect x="10" y="25" width="80" height="50" fill="currentColor" />' },
    { name: 'Hình sao', svg: '<polygon points="50,10 61,35 90,35 66,55 75,80 50,65 25,80 34,55 10,35 39,35" fill="currentColor" />' } // Star
];

// --- GENERATORS ---

// 1. Math Generator
const generateMathQuestion = (level: SpeedDifficulty): SpeedQuestion => {
    let a, b, op, ans, content;
    const ops = ['+', '-'];
    if (level !== 'easy') ops.push('x', '/');

    op = ops[Math.floor(Math.random() * ops.length)];

    if (level === 'easy') {
        // Within 20
        if (op === '+') {
            a = Math.floor(Math.random() * 10) + 1;
            b = Math.floor(Math.random() * 10) + 1;
            ans = a + b;
        } else {
            a = Math.floor(Math.random() * 10) + 5;
            b = Math.floor(Math.random() * a);
            ans = a - b;
        }
    } else if (level === 'medium') {
        // Within 1000, simple x/
        if (op === '+') {
            a = Math.floor(Math.random() * 500);
            b = Math.floor(Math.random() * 500);
            ans = a + b;
        } else if (op === '-') {
            a = Math.floor(Math.random() * 500) + 100;
            b = Math.floor(Math.random() * a);
            ans = a - b;
        } else if (op === 'x') {
            a = Math.floor(Math.random() * 9) + 2; // 2-10
            b = Math.floor(Math.random() * 9) + 2;
            ans = a * b;
        } else {
            b = Math.floor(Math.random() * 9) + 2;
            ans = Math.floor(Math.random() * 9) + 2;
            a = b * ans;
        }
    } else {
        // Hard
        if (op === '+') {
            a = Math.floor(Math.random() * 5000);
            b = Math.floor(Math.random() * 5000);
            ans = a + b;
        } else if (op === '-') {
            a = Math.floor(Math.random() * 5000) + 1000;
            b = Math.floor(Math.random() * a);
            ans = a - b;
        } else if (op === 'x') {
            a = Math.floor(Math.random() * 20) + 2;
            b = Math.floor(Math.random() * 20) + 2;
            ans = a * b;
        } else {
            b = Math.floor(Math.random() * 20) + 2;
            ans = Math.floor(Math.random() * 20) + 2;
            a = b * ans;
        }
    }

    // Format: "A + B = ?" or "A + ? = C" (Medium/Hard only)
    const type = (level !== 'easy' && Math.random() > 0.7) ? 'missing' : 'normal';

    if (type === 'normal') {
        content = `${a} ${op === 'x' ? '×' : op === '/' ? '÷' : op} ${b} = ?`;
    } else {
        // Missing operand
        content = `${a} ${op === 'x' ? '×' : op === '/' ? '÷' : op} ? = ${ans}`;
        // Swap logic for subtraction/division to make sense? 
        // A - ? = Ans => ? = A - Ans. 
        // A / ? = Ans => ? = A / Ans.
        // Actually let's keep it simple: ? + B = Ans
        if (Math.random() > 0.5) {
            content = `? ${op === 'x' ? '×' : op === '/' ? '÷' : op} ${b} = ${ans}`;
            // Correct answer is 'a'
            ans = a;
        } else {
            content = `${a} ${op === 'x' ? '×' : op === '/' ? '÷' : op} ? = ${ans}`;
            // Correct answer is 'b'
            ans = b;
        }
    }

    // Generate options
    const options = new Set<string>();
    options.add(ans.toString());
    while (options.size < 4) {
        let offset = Math.floor(Math.random() * 10) - 5;
        if (offset === 0) offset = 1;
        options.add((ans + offset).toString());
    }

    return {
        id: `math_${Date.now()}_${Math.random()}`,
        type: 'math',
        content,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        correctAnswer: ans.toString(),
        timeLimit: TIME_LIMITS[level]
    };
};

// 2. Typing Generator
const TYPING_WORDS = {
    easy: ['Mèo', 'Chó', 'Gà', 'Vịt', 'Cá', 'Bò', 'Lợn', 'Chim', 'Ong', 'Sóc', 'Bi', 'Na', 'Bố', 'Mẹ', 'Bà'],
    medium: ['Con mèo', 'Con chó', 'Cái bàn', 'Cái ghế', 'Đi học', 'Vui vẻ', 'Mặt trời', 'Bông hoa', 'Dòng sông', 'Đám mây'],
    hard: ['Học tập tốt', 'Lao động tốt', 'Yêu tổ quốc', 'Yêu đồng bào', 'Giữ gìn vệ sinh', 'Khiêm tốn thật thà', 'Dũng cảm']
};

const generateTypingQuestion = (level: SpeedDifficulty): SpeedQuestion => {
    const list = TYPING_WORDS[level];
    const word = list[Math.floor(Math.random() * list.length)];

    return {
        id: `type_${Date.now()}_${Math.random()}`,
        type: 'typing',
        content: `Gõ lại từ: "${word}"`,
        correctAnswer: word,
        timeLimit: TIME_LIMITS[level] + 5 // Extra time for typing
    };
};

// 3. Quiz Generator (Nature & Society)
const generateQuizQuestion = (level: SpeedDifficulty): SpeedQuestion => {
    const questions = GENERAL_KNOWLEDGE_DATA.filter(q => q.level === level);
    const q = questions[Math.floor(Math.random() * questions.length)];

    return {
        id: q.id,
        type: 'quiz',
        content: q.question,
        options: q.options.sort(() => Math.random() - 0.5),
        correctAnswer: q.answer,
        timeLimit: TIME_LIMITS[level]
    };
};

// 4. Color Generator (Easy Only)
const generateColorQuestion = (): SpeedQuestion => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    // Options: 1 correct, 3 wrong
    const options = new Set<string>();
    options.add(color.name);
    while (options.size < 4) {
        options.add(COLORS[Math.floor(Math.random() * COLORS.length)].name);
    }

    return {
        id: `color_${Date.now()}_${Math.random()}`,
        type: 'color',
        content: 'Màu này là màu gì?',
        color: color.value,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        correctAnswer: color.name,
        timeLimit: TIME_LIMITS.easy
    };
};

// 5. Shape Generator (Easy/Medium)
const generateShapeQuestion = (level: SpeedDifficulty): SpeedQuestion => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

    const options = new Set<string>();
    options.add(shape.name);
    while (options.size < 4) {
        options.add(SHAPES[Math.floor(Math.random() * SHAPES.length)].name);
    }

    return {
        id: `shape_${Date.now()}_${Math.random()}`,
        type: 'shape',
        content: 'Hình này là hình gì?',
        visual: shape.svg,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        correctAnswer: shape.name,
        timeLimit: TIME_LIMITS[level]
    };
};

// 6. Clock Generator
const generateClockQuestion = (level: SpeedDifficulty): SpeedQuestion => {
    let hour, minute;

    if (level === 'easy') {
        hour = Math.floor(Math.random() * 12) + 1;
        minute = 0;
    } else {
        hour = Math.floor(Math.random() * 12) + 1;
        const mins = [0, 15, 30, 45];
        minute = mins[Math.floor(Math.random() * mins.length)];
    }

    const timeString = `${hour}:${minute === 0 ? '00' : minute}`;

    // Generate SVG Clock
    const radius = 50;
    const cx = 60;
    const cy = 60;

    // Hour hand angle
    const hourAngle = (hour % 12 + minute / 60) * 30; // 360 / 12 = 30
    const minuteAngle = minute * 6; // 360 / 60 = 6

    const hx = cx + (radius * 0.5) * Math.sin(hourAngle * Math.PI / 180);
    const hy = cy - (radius * 0.5) * Math.cos(hourAngle * Math.PI / 180);

    const mx = cx + (radius * 0.8) * Math.sin(minuteAngle * Math.PI / 180);
    const my = cy - (radius * 0.8) * Math.cos(minuteAngle * Math.PI / 180);

    const svg = `
        <circle cx="${cx}" cy="${cy}" r="${radius}" stroke="black" stroke-width="3" fill="white" />
        <line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="black" stroke-width="4" stroke-linecap="round" />
        <line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="red" stroke-width="2" stroke-linecap="round" />
        <circle cx="${cx}" cy="${cy}" r="3" fill="black" />
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => {
        const ang = h * 30;
        const x = cx + (radius - 10) * Math.sin(ang * Math.PI / 180);
        const y = cy - (radius - 10) * Math.cos(ang * Math.PI / 180);
        return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="10">${h}</text>`;
    }).join('')}
    `;

    // Options
    const options = new Set<string>();
    options.add(timeString);
    while (options.size < 4) {
        const h = Math.floor(Math.random() * 12) + 1;
        const m = level === 'easy' ? 0 : [0, 15, 30, 45][Math.floor(Math.random() * 4)];
        options.add(`${h}:${m === 0 ? '00' : m}`);
    }

    return {
        id: `clock_${Date.now()}_${Math.random()}`,
        type: 'clock',
        content: 'Đồng hồ chỉ mấy giờ?',
        visual: svg,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        correctAnswer: timeString,
        timeLimit: TIME_LIMITS[level]
    };
};


// --- MAIN GENERATOR ---
export const generateSpeedQuestion = (level: SpeedDifficulty): SpeedQuestion => {
    const rand = Math.random();

    // Distribution based on level
    if (level === 'easy') {
        // 30% Math, 20% Color, 20% Quiz, 10% Shape, 10% Clock, 10% Typing
        if (rand < 0.3) return generateMathQuestion(level);
        if (rand < 0.5) return generateColorQuestion();
        if (rand < 0.7) return generateQuizQuestion(level);
        if (rand < 0.8) return generateShapeQuestion(level);
        if (rand < 0.9) return generateClockQuestion(level);
        return generateTypingQuestion(level);
    } else if (level === 'medium') {
        // Medium: 40% Math, 30% Quiz, 10% Clock, 10% Shape, 10% Typing
        if (rand < 0.4) return generateMathQuestion(level);
        if (rand < 0.7) return generateQuizQuestion(level);
        if (rand < 0.8) return generateClockQuestion(level);
        if (rand < 0.9) return generateShapeQuestion(level);
        return generateTypingQuestion(level);
    } else {
        // Hard: 50% Math, 30% Quiz, 10% Shape, 10% Typing (No Clock)
        if (rand < 0.5) return generateMathQuestion(level);
        if (rand < 0.8) return generateQuizQuestion(level);
        if (rand < 0.9) return generateShapeQuestion(level);
        return generateTypingQuestion(level);
    }
};
