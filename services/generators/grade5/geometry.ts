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

const formatDecimal = (num: number, maxDecimals: number = 2): string => {
    const str = num.toFixed(maxDecimals);
    const trimmed = parseFloat(str).toString();
    return trimmed.replace('.', ',');
};

// SVG for parallelogram
const createParallelogramSVG = (base: number, height: number): string => {
    return `
    <svg width="350" height="200" viewBox="0 0 350 200" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,150 ${50 + base * 15},150 ${50 + base * 15 + 30},50 80,50" 
               fill="#dbeafe" stroke="#0ea5e9" stroke-width="3"/>
      <line x1="${50 + base * 15}" y1="150" x2="${50 + base * 15}" y2="50" 
            stroke="#ef4444" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="${50 + (base * 15) / 2}" y="175" text-anchor="middle" font-size="14">Đáy = ${base}cm</text>
      <text x="${50 + base * 15 + 15}" y="100" text-anchor="start" font-size="14">h = ${height}cm</text>
    </svg>
  `;
};

// SVG for circle
const createCircleSVG = (radius: number): string => {
    return `
    <svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
      <circle cx="150" cy="150" r="${radius * 10}" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>
      <line x1="150" y1="150" x2="${150 + radius * 10}" y2="150" stroke="#ef4444" stroke-width="2"/>
      <text x="${150 + (radius * 10) / 2}" y="145" text-anchor="middle" font-size="14" fill="#ef4444">r = ${radius}cm</text>
    </svg>
  `;
};

// SVG for rectangular box
const createBoxSVG = (length: number, width: number, height: number): string => {
    return `
    <svg width="350" height="250" viewBox="0 0 350 250" xmlns="http://www.w3.org/2000/svg">
      <polygon points="50,150 200,150 200,80 50,80" fill="#dbeafe" stroke="#0ea5e9" stroke-width="2"/>
      <polygon points="200,150 250,120 250,50 200,80" fill="#93c5fd" stroke="#0ea5e9" stroke-width="2"/>
      <polygon points="50,80 200,80 250,50 100,50" fill="#60a5fa" stroke="#0ea5e9" stroke-width="2"/>
      <text x="125" y="170" text-anchor="middle" font-size="14">Dài = ${length}cm</text>
      <text x="230" y="90" text-anchor="middle" font-size="14">Rộng = ${width}cm</text>
      <text x="30" y="120" text-anchor="end" font-size="14">Cao = ${height}cm</text>
    </svg>
  `;
};

// SVG for Trapezoid
const createTrapezoidSVG = (top: number, bottom: number, height: number): string => {
    // Scale for visualization (not exact)
    const scale = 15;
    const topW = top * scale;
    const botW = bottom * scale;
    const h = height * scale;
    const offsetX = (botW - topW) / 2;

    return `
    <svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <polygon points="${50 + offsetX},50 ${50 + offsetX + topW},50 ${50 + botW},${50 + h} 50,${50 + h}" 
               fill="#c7d2fe" stroke="#4f46e5" stroke-width="2"/>
      <line x1="${50 + offsetX}" y1="50" x2="${50 + offsetX}" y2="${50 + h}" 
            stroke="#ef4444" stroke-width="2" stroke-dasharray="5,5"/>
      <text x="${50 + offsetX + topW / 2}" y="40" text-anchor="middle" font-size="14">Đáy bé = ${top}cm</text>
      <text x="${50 + botW / 2}" y="${50 + h + 20}" text-anchor="middle" font-size="14">Đáy lớn = ${bottom}cm</text>
      <text x="${50 + offsetX - 10}" y="${50 + h / 2}" text-anchor="end" font-size="14">h = ${height}cm</text>
    </svg>
  `;
};

// SVG for Triangle
const createTriangleSVG = (base: number, height: number, s1?: number, s2?: number, s3?: number): string => {
    // If s1, s2, s3 provided, it's for perimeter (generic triangle)
    // If base, height provided, it's for area (show height)

    if (s1 && s2 && s3) {
        return `
        <svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,150 250,150 150,50" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
          <text x="150" y="170" text-anchor="middle" font-size="14">${s3}cm</text>
          <text x="90" y="100" text-anchor="end" font-size="14">${s1}cm</text>
          <text x="210" y="100" text-anchor="start" font-size="14">${s2}cm</text>
        </svg>
      `;
    } else {
        return `
        <svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,150 ${50 + base * 15},150 100,${150 - height * 15}" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
          <line x1="100" y1="${150 - height * 15}" x2="100" y2="150" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,5"/>
          <text x="${50 + base * 15 / 2}" y="170" text-anchor="middle" font-size="14">Đáy = ${base}cm</text>
          <text x="95" y="${150 - height * 15 / 2}" text-anchor="end" font-size="14">h = ${height}cm</text>
        </svg>
      `;
    }
};

export const generateG5Geometry = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Parallelogram area (10%)
    if (type < 0.1) {
        const base = randomInt(5, 15);
        const height = randomInt(4, 10);
        const area = base * height;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính diện tích hình bình hành có đáy ${base}cm, chiều cao ${height}cm?`,
            visualSvg: createParallelogramSVG(base, height),
            correctAnswer: `${area}cm²`,
            options: shuffleArray([
                `${area}cm²`,
                `${(base + height) * 2}cm²`,
                `${base * height * 2}cm²`,
                `${base + height}cm²`
            ]),
            explanation: `Diện tích = đáy × chiều cao = ${base} × ${height} = ${area}cm²`
        };
    }

    // 2. Circle perimeter (15%)
    else if (type < 0.25) {
        const radius = randomInt(3, 10);
        const perimeter = 2 * 3.14 * radius;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính chu vi hình tròn có bán kính ${radius}cm? (π = 3,14)`,
            visualSvg: createCircleSVG(radius),
            correctAnswer: formatDecimal(perimeter, 2),
            options: shuffleArray([
                formatDecimal(perimeter, 2),
                formatDecimal(3.14 * radius, 2),
                formatDecimal(3.14 * radius * radius, 2),
                formatDecimal(perimeter + 3.14, 2)
            ]),
            explanation: `Chu vi = 2 × π × r = 2 × 3,14 × ${radius} = ${formatDecimal(perimeter, 2)}cm`
        };
    }

    // 3. Circle area (15%)
    else if (type < 0.4) {
        const radius = randomInt(3, 10);
        const area = 3.14 * radius * radius;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính diện tích hình tròn có bán kính ${radius}cm? (π = 3,14)`,
            visualSvg: createCircleSVG(radius),
            correctAnswer: formatDecimal(area, 2),
            options: shuffleArray([
                formatDecimal(area, 2),
                formatDecimal(2 * 3.14 * radius, 2),
                formatDecimal(3.14 * radius, 2),
                formatDecimal(area + 10, 2)
            ]),
            explanation: `Diện tích = π × r² = 3,14 × ${radius}² = 3,14 × ${radius * radius} = ${formatDecimal(area, 2)}cm²`
        };
    }

    // 4. Box volume (15%)
    else if (type < 0.55) {
        const length = randomInt(4, 10);
        const width = randomInt(3, 8);
        const height = randomInt(3, 8);
        const volume = length * width * height;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính thể tích hình hộp chữ nhật có chiều dài ${length}cm, rộng ${width}cm, cao ${height}cm?`,
            visualSvg: createBoxSVG(length, width, height),
            correctAnswer: `${volume}cm³`,
            options: shuffleArray([
                `${volume}cm³`,
                `${(length + width + height) * 4}cm³`,
                `${length * width}cm³`,
                `${volume * 2}cm³`
            ]),
            explanation: `Thể tích = dài × rộng × cao = ${length} × ${width} × ${height} = ${volume}cm³`
        };
    }

    // 5. Trapezoid Area (15%)
    else if (type < 0.7) {
        // Ensure (a+b) is even for integer area
        const top = randomInt(3, 8);
        let bottom = randomInt(top + 2, 15);
        if ((top + bottom) % 2 !== 0) bottom++; // Make sum even

        const height = randomInt(4, 10);
        const area = ((top + bottom) * height) / 2;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Tính diện tích hình thang có đáy bé ${top}cm, đáy lớn ${bottom}cm, chiều cao ${height}cm?`,
            visualSvg: createTrapezoidSVG(top, bottom, height),
            correctAnswer: `${area}cm²`,
            options: shuffleArray([
                `${area}cm²`,
                `${(top + bottom) * height}cm²`,
                `${area * 2}cm²`,
                `${top * bottom * height}cm²`
            ]),
            explanation: `Diện tích = (đáy lớn + đáy bé) × chiều cao : 2 = (${bottom} + ${top}) × ${height} : 2 = ${area}cm²`
        };
    }

    // 6. Triangle Area/Perimeter (15%)
    else if (type < 0.85) {
        const isArea = Math.random() > 0.5;

        if (isArea) {
            const base = randomInt(6, 15);
            let height = randomInt(4, 12);
            // Try to make area integer
            if (base % 2 !== 0 && height % 2 !== 0) height++;

            const area = (base * height) / 2;

            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính diện tích hình tam giác có đáy ${base}cm và chiều cao ${height}cm?`,
                visualSvg: createTriangleSVG(base, height),
                correctAnswer: `${formatDecimal(area)}cm²`,
                options: shuffleArray([
                    `${formatDecimal(area)}cm²`,
                    `${base * height}cm²`,
                    `${formatDecimal(area * 2)}cm²`,
                    `${base + height}cm²`
                ]),
                explanation: `Diện tích = đáy × chiều cao : 2 = ${base} × ${height} : 2 = ${formatDecimal(area)}cm²`
            };
        } else {
            // Perimeter
            const s1 = randomInt(5, 15);
            const s2 = randomInt(5, 15);
            const s3 = randomInt(Math.abs(s1 - s2) + 1, s1 + s2 - 1); // Triangle inequality
            const p = s1 + s2 + s3;

            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính chu vi hình tam giác có độ dài các cạnh là ${s1}cm, ${s2}cm, ${s3}cm?`,
                visualSvg: createTriangleSVG(0, 0, s1, s2, s3),
                correctAnswer: `${p}cm`,
                options: shuffleArray([
                    `${p}cm`,
                    `${p + 10}cm`,
                    `${s1 * s2 * s3}cm`,
                    `${(s1 + s2) * 2}cm`
                ]),
                explanation: `Chu vi = tổng độ dài 3 cạnh = ${s1} + ${s2} + ${s3} = ${p}cm`
            };
        }
    }

    // 7. Surface Area - Box/Cube (10%)
    else if (type < 0.90) {
        const isCube = Math.random() > 0.5;
        const isTotal = Math.random() > 0.5; // Lateral vs Total

        if (isCube) {
            const edge = randomInt(3, 10);
            const areaOne = edge * edge;
            const result = isTotal ? areaOne * 6 : areaOne * 4;
            const typeStr = isTotal ? 'toàn phần' : 'xung quanh';

            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính diện tích ${typeStr} của hình lập phương có cạnh ${edge}cm?`,
                visualSvg: createBoxSVG(edge, edge, edge), // Reuse box SVG
                correctAnswer: `${result}cm²`,
                options: shuffleArray([
                    `${result}cm²`,
                    `${areaOne * (isTotal ? 4 : 6)}cm²`, // Swap 4 and 6
                    `${edge * edge * edge}cm²`, // Volume
                    `${edge * 12}cm²` // Sum of edges
                ]),
                explanation: `Diện tích 1 mặt = ${edge} × ${edge} = ${areaOne}cm²\nDiện tích ${typeStr} = ${areaOne} × ${isTotal ? 6 : 4} = ${result}cm²`
            };
        } else {
            const l = randomInt(5, 10);
            const w = randomInt(3, l - 1);
            const h = randomInt(3, 8);

            const pBase = (l + w) * 2;
            const lateral = pBase * h;
            const total = lateral + 2 * l * w;

            const result = isTotal ? total : lateral;
            const typeStr = isTotal ? 'toàn phần' : 'xung quanh';

            return {
                type: QuestionType.SingleChoice,
                questionText: `Tính diện tích ${typeStr} của hình hộp chữ nhật có dài ${l}cm, rộng ${w}cm, cao ${h}cm?`,
                visualSvg: createBoxSVG(l, w, h),
                correctAnswer: `${result}cm²`,
                options: shuffleArray([
                    `${result}cm²`,
                    `${isTotal ? lateral : total}cm²`,
                    `${l * w * h}cm²`,
                    `${(l + w + h) * 4}cm²`
                ]),
                explanation: `Chu vi đáy = (${l} + ${w}) × 2 = ${pBase}cm\nDiện tích xung quanh = ${pBase} × ${h} = ${lateral}cm²${isTotal ? `\nDiện tích 2 đáy = ${l} × ${w} × 2 = ${l * w * 2}cm²\nDiện tích toàn phần = ${lateral} + ${l * w * 2} = ${total}cm²` : ''}`
            };
        }
    }

    // 8. Geometry + Unit Conversion (10%)
    else {
        const isRect = Math.random() > 0.5;

        if (isRect) {
            // Rectangle: Length in m, Width in dm -> Area in dm²
            const l_m = randomInt(2, 5); // meters
            const w_dm = randomInt(5, 15); // decimeters
            const l_dm = l_m * 10;
            const area_dm2 = l_dm * w_dm;

            return {
                type: QuestionType.SingleChoice,
                questionText: `Một hình chữ nhật có chiều dài ${l_m}m và chiều rộng ${w_dm}dm. Tính diện tích hình chữ nhật đó theo đơn vị dm²?`,
                visualSvg: createBoxSVG(l_m * 10, w_dm, 0).replace('Cao = 0cm', '').replace('Dài', 'Dài (m)').replace('Rộng', 'Rộng (dm)'), // Hacky reuse or just no SVG? Let's use no SVG or generic
                // Actually createBoxSVG is 3D. Let's use Parallelogram SVG but adapted? Or just no visual for this advanced type?
                // Let's use no visual for now as it's a word problem focus
                correctAnswer: `${area_dm2}dm²`,
                options: shuffleArray([
                    `${area_dm2}dm²`,
                    `${l_m * w_dm}dm²`, // Forgot to convert
                    `${(l_dm + w_dm) * 2}dm²`, // Perimeter
                    `${area_dm2 * 100}dm²`
                ]),
                explanation: `Đổi: ${l_m}m = ${l_dm}dm\nDiện tích = ${l_dm} × ${w_dm} = ${area_dm2}dm²`
            };
        } else {
            // Square: Side in cm -> Area in mm²
            const side_cm = randomInt(2, 8);
            const side_mm = side_cm * 10;
            const area_mm2 = side_mm * side_mm;

            return {
                type: QuestionType.SingleChoice,
                questionText: `Một hình vuông có cạnh ${side_cm}cm. Tính diện tích hình vuông đó theo đơn vị mm²?`,
                correctAnswer: `${area_mm2}mm²`,
                options: shuffleArray([
                    `${area_mm2}mm²`,
                    `${side_cm * side_cm}mm²`,
                    `${side_cm * side_cm * 10}mm²`,
                    `${area_mm2 * 10}mm²`
                ]),
                explanation: `Đổi: ${side_cm}cm = ${side_mm}mm\nDiện tích = ${side_mm} × ${side_mm} = ${area_mm2}mm²`
            };
        }
    }
};
