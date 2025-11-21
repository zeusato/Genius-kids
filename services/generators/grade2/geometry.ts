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

// --- SVG Helpers ---

const createShape2DSVG = (shape: 'square' | 'rect' | 'circle' | 'triangle') => {
    const w = 200;
    const h = 200;
    const cx = 100;
    const cy = 100;
    const color = "#fcd34d"; // Amber 300
    const stroke = "#d97706"; // Amber 600

    let content = '';

    switch (shape) {
        case 'square':
            content = `<rect x="50" y="50" width="100" height="100" fill="${color}" stroke="${stroke}" stroke-width="3" />`;
            break;
        case 'rect':
            content = `<rect x="30" y="60" width="140" height="80" fill="${color}" stroke="${stroke}" stroke-width="3" />`;
            break;
        case 'circle':
            content = `<circle cx="${cx}" cy="${cy}" r="60" fill="${color}" stroke="${stroke}" stroke-width="3" />`;
            break;
        case 'triangle':
            content = `<polygon points="100,40 40,160 160,160" fill="${color}" stroke="${stroke}" stroke-width="3" />`;
            break;
    }

    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
};

const createShape3DSVG = (shape: 'cube' | 'cylinder' | 'sphere' | 'box') => {
    const w = 200;
    const h = 200;
    const color = "#bfdbfe"; // Blue 200
    const stroke = "#2563eb"; // Blue 600

    let content = '';

    switch (shape) {
        case 'cube':
            // Front face
            content += `<rect x="60" y="80" width="60" height="60" fill="${color}" stroke="${stroke}" stroke-width="2" />`;
            // Top face
            content += `<path d="M 60 80 L 90 50 L 150 50 L 120 80 Z" fill="${color}" stroke="${stroke}" stroke-width="2" />`;
            // Side face
            content += `<path d="M 120 80 L 150 50 L 150 110 L 120 140 Z" fill="${color}" stroke="${stroke}" stroke-width="2" />`;
            break;
        case 'box': // Rectangular Prism
            content += `<rect x="50" y="80" width="80" height="50" fill="${color}" stroke="${stroke}" stroke-width="2" />`;
            content += `<path d="M 50 80 L 80 50 L 160 50 L 130 80 Z" fill="${color}" stroke="${stroke}" stroke-width="2" />`;
            content += `<path d="M 130 80 L 160 50 L 160 100 L 130 130 Z" fill="${color}" stroke="${stroke}" stroke-width="2" />`;
            break;
        case 'cylinder':
            // Top ellipse
            content += `<ellipse cx="100" cy="60" rx="40" ry="15" fill="${color}" stroke="${stroke}" stroke-width="2" />`;
            // Body
            content += `<path d="M 60 60 L 60 140 A 40 15 0 0 0 140 140 L 140 60" fill="${color}" stroke="${stroke}" stroke-width="2" />`;
            // Bottom curve (dashed hidden?) No, just solid for simple view
            break;
        case 'sphere':
            content += `<circle cx="100" cy="100" r="60" fill="${color}" stroke="${stroke}" stroke-width="2" />`;
            // Shine/Curve
            content += `<path d="M 60 80 Q 100 140 140 80" fill="none" stroke="${stroke}" stroke-width="1" stroke-dasharray="4" />`;
            break;
    }

    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
};

// --- Generators ---

export const generateG2Geometry = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Identify 2D Shapes - 40%
    if (type < 0.4) {
        const shapes = [
            { id: 'square', name: 'Hình vuông' },
            { id: 'rect', name: 'Hình chữ nhật' },
            { id: 'circle', name: 'Hình tròn' },
            { id: 'triangle', name: 'Hình tam giác' }
        ] as const;

        const target = shapes[randomInt(0, 3)];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hình bên dưới là hình gì?`,
            visualSvg: createShape2DSVG(target.id),
            correctAnswer: target.name,
            options: shuffleArray(shapes.map(s => s.name)),
            explanation: `Quan sát đặc điểm của hình (số cạnh, góc, đường cong).`
        };
    }

    // 2. Identify 3D Shapes - 40%
    else if (type < 0.8) {
        const shapes = [
            { id: 'cube', name: 'Khối lập phương' },
            { id: 'box', name: 'Khối hộp chữ nhật' },
            { id: 'cylinder', name: 'Khối trụ' },
            { id: 'sphere', name: 'Khối cầu' }
        ] as const;

        const target = shapes[randomInt(0, 3)];

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hình bên dưới là khối gì?`,
            visualSvg: createShape3DSVG(target.id),
            correctAnswer: target.name,
            options: shuffleArray(shapes.map(s => s.name)),
            explanation: `Quan sát hình dạng 3 chiều của vật thể.`
        };
    }

    // 3. Counting Shapes (Simple) - 20%
    else {
        // Draw multiple shapes? For now, let's stick to a simple word problem or simple composite?
        // Let's do a simple "How many vertices/sides" question for 2D.
        const shapes = [
            { name: 'Hình tam giác', sides: 3, vertices: 3 },
            { name: 'Hình vuông', sides: 4, vertices: 4 },
            { name: 'Hình chữ nhật', sides: 4, vertices: 4 },
            { name: 'Hình tròn', sides: 0, vertices: 0 }
        ];
        const target = shapes[randomInt(0, 3)];
        const isSides = Math.random() > 0.5;

        return {
            type: QuestionType.SingleChoice,
            questionText: `${target.name} có bao nhiêu ${isSides ? 'cạnh' : 'đỉnh'}?`,
            correctAnswer: (isSides ? target.sides : target.vertices).toString(),
            options: shuffleArray(['0', '3', '4', '5']),
            explanation: `${target.name} có ${isSides ? target.sides : target.vertices} ${isSides ? 'cạnh' : 'đỉnh'}.`
        };
    }
};
