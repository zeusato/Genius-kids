import { Question, QuestionType } from '../../../types';

// --- Utility Functions (Duplicated for now, should be shared utils later) ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

const generateWrongAnswers = (correct: number, count: number, range: number = 10): string[] => {
    const wrongs = new Set<number>();
    while (wrongs.size < count) {
        const offset = randomInt(-range, range);
        const val = correct + offset;
        if (val !== correct && val > 0) { // Ensure positive for geometry
            wrongs.add(val);
        }
    }
    return Array.from(wrongs).map(String);
};

// --- SVG Helpers ---

const createRectSVG = (w: number, h: number, labelW: string, labelH: string, color: string = "#fef3c7", stroke: string = "#d97706") => {
    // Scale logic to fit box with more padding for labels
    const svgW = 400;
    const svgH = 250;
    const maxW = 250; // Keep max width constrained to leave room for side labels if any (though rect usually has bottom/right labels)
    const maxH = 150;
    const scale = Math.min(maxW / w, maxH / h);
    const drawW = w * scale;
    const drawH = h * scale;
    const startX = (svgW - drawW) / 2;
    const startY = (svgH - drawH) / 2;

    return `
      <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
        <rect x="${startX}" y="${startY}" width="${drawW}" height="${drawH}" fill="${color}" stroke="${stroke}" stroke-width="3" />
        <text x="${startX + drawW / 2}" y="${startY + drawH + 25}" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#0f172a">${labelW}</text>
        <text x="${startX + drawW + 15}" y="${startY + drawH / 2}" font-family="sans-serif" font-size="16" dominant-baseline="middle" fill="#0f172a">${labelH}</text>
      </svg>
    `;
};

const createSquareSVG = (side: number, label: string) => {
    return createRectSVG(side, side, label, label, "#dcfce7", "#16a34a");
};

const createCompositeSVG = (hA: number, wA: number, hB: number, wB: number) => {
    const svgW = 400;
    const svgH = 250;

    const totalW = wA + wB;
    const maxH = hA;

    // Reduce maxBoxW to ensure plenty of horizontal space for labels
    const maxBoxW = 280;
    const maxBoxH = 180;
    const scale = Math.min(maxBoxW / totalW, maxBoxH / maxH);

    const drawHA = hA * scale;
    const drawWA = wA * scale;
    const drawHB = hB * scale;
    const drawWB = wB * scale;

    const startX = (svgW - (drawWA + drawWB)) / 2;
    const startY = (svgH - drawHA) / 2 + 10;

    // Path points
    const p1 = { x: startX, y: startY };
    const p2 = { x: startX + drawWA, y: startY };
    const p3 = { x: startX + drawWA, y: startY + (drawHA - drawHB) };
    const p4 = { x: startX + drawWA + drawWB, y: startY + (drawHA - drawHB) };
    const p5 = { x: startX + drawWA + drawWB, y: startY + drawHA };
    const p6 = { x: startX, y: startY + drawHA };

    const outline = `
        M ${p1.x} ${p1.y} 
        L ${p2.x} ${p2.y} 
        L ${p2.x} ${p3.y} 
        L ${p4.x} ${p4.y} 
        L ${p5.x} ${p5.y} 
        L ${p6.x} ${p6.y} 
        Z
    `;

    const separator = `M ${p2.x} ${p3.y} L ${p2.x} ${p5.y}`;

    return `
      <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
        <path d="${outline}" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" />
        <path d="${separator}" stroke="#0284c7" stroke-width="2" stroke-dasharray="5,5" />
        
        <!-- Labels -->
        <text x="${startX - 15}" y="${startY + drawHA / 2}" text-anchor="end" font-family="sans-serif" font-size="16">${hA}cm</text>
        <text x="${startX + drawWA / 2}" y="${startY - 10}" text-anchor="middle" font-family="sans-serif" font-size="16">${wA}cm</text>
        <text x="${startX + drawWA + drawWB / 2}" y="${p3.y - 10}" text-anchor="middle" font-family="sans-serif" font-size="16">${wB}cm</text>
        <text x="${p5.x + 10}" y="${p5.y - drawHB / 2}" text-anchor="start" font-family="sans-serif" font-size="16">${hB}cm</text>
      </svg>
    `;
};

// --- Generators ---

export const generateGeometryG4 = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 1. Basic Rectangle/Square (Forward) - 30%
    if (type < 0.3) {
        const isSquare = Math.random() > 0.5;
        const isArea = Math.random() > 0.5;

        if (isSquare) {
            const side = randomInt(5, 20);
            const ans = isArea ? side * side : side * 4;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Một hình vuông có cạnh ${side}m. ${isArea ? 'Diện tích' : 'Chu vi'} hình đó là bao nhiêu?`,
                visualSvg: createSquareSVG(side, `${side}m`),
                correctAnswer: ans.toString(),
                options: shuffleArray([ans.toString(), ...generateWrongAnswers(ans, 3, 20)]),
                explanation: isArea ? `Diện tích = Cạnh x Cạnh (${side} x ${side})` : `Chu vi = Cạnh x 4 (${side} x 4)`
            };
        } else {
            const w = randomInt(5, 15);
            const h = randomInt(w + 2, 25);
            const ans = isArea ? w * h : (w + h) * 2;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Một hình chữ nhật có chiều dài ${h}m và chiều rộng ${w}m. ${isArea ? 'Diện tích' : 'Chu vi'} là?`,
                visualSvg: createRectSVG(h, w, `${h}m`, `${w}m`),
                correctAnswer: ans.toString(),
                options: shuffleArray([ans.toString(), ...generateWrongAnswers(ans, 3, 20)]),
                explanation: isArea ? `Diện tích = Dài x Rộng` : `Chu vi = (Dài + Rộng) x 2`
            };
        }
    }

    // 2. Reverse Problems (Missing Side) - 30%
    else if (type < 0.6) {
        const isSquare = Math.random() > 0.5;

        if (isSquare) {
            // Given Perimeter, find Area (Multi-step) or Side
            const side = randomInt(4, 15);
            const perimeter = side * 4;
            const area = side * side;

            return {
                type: QuestionType.SingleChoice,
                questionText: `Một hình vuông có chu vi là ${perimeter}m. Diện tích của hình vuông đó là bao nhiêu?`,
                correctAnswer: area.toString(),
                options: shuffleArray([area.toString(), ...generateWrongAnswers(area, 3, 20)]),
                explanation: `Bước 1: Tìm cạnh = Chu vi : 4 = ${perimeter} : 4 = ${side}m.\nBước 2: Diện tích = ${side} x ${side} = ${area}m².`
            };
        } else {
            // Given Area/Perimeter and one side, find other
            const w = randomInt(4, 12);
            const h = randomInt(w + 2, 20);
            const isAreaGiven = Math.random() > 0.5;

            if (isAreaGiven) {
                const area = w * h;
                return {
                    type: QuestionType.SingleChoice,
                    questionText: `Một hình chữ nhật có diện tích ${area}m², chiều dài ${h}m. Chiều rộng là bao nhiêu?`,
                    correctAnswer: w.toString(),
                    options: shuffleArray([w.toString(), ...generateWrongAnswers(w, 3, 5)]),
                    explanation: `Chiều rộng = Diện tích : Chiều dài = ${area} : ${h} = ${w}m.`
                };
            } else {
                const perimeter = (w + h) * 2;
                return {
                    type: QuestionType.SingleChoice,
                    questionText: `Một hình chữ nhật có chu vi ${perimeter}m, chiều rộng ${w}m. Chiều dài là bao nhiêu?`,
                    correctAnswer: h.toString(),
                    options: shuffleArray([h.toString(), ...generateWrongAnswers(h, 3, 5)]),
                    explanation: `Bước 1: Nửa chu vi = ${perimeter} : 2 = ${w + h}m.\nBước 2: Chiều dài = Nửa chu vi - Chiều rộng = ${w + h} - ${w} = ${h}m.`
                };
            }
        }
    }

    // 3. Word Problems (Real world) - 20%
    else if (type < 0.8) {
        const isTiling = Math.random() > 0.5;

        if (isTiling) {
            // Tiling problem
            // Ensure dimensions in dm are divisible by tileSide AND are multiples of 10 (to be integer in m)
            // We need (W * 10) % tileSide == 0.
            // This is easier if we just pick W, H such that they satisfy this.
            // Or we adjust tileSide to be a divisor of 10 (1, 2, 5) or just ensure the math works.
            // Simpler: Pick tileSide first. Then pick W_m, H_m such that (W_m * 10) % tileSide == 0.

            // Valid tileSides: 2, 4, 5. (3 is hard for 10*m unless m is multiple of 3)
            const validTileSides = [2, 4, 5];
            const tileSide = validTileSides[randomInt(0, validTileSides.length - 1)];

            // Generate W_m such that W_m * 10 is divisible by tileSide
            // If tileSide = 2, any int W_m works (10 is div by 2)
            // If tileSide = 5, any int W_m works (10 is div by 5)
            // If tileSide = 4, 10*W_m = 2*5*W_m. Need W_m to be even.

            let roomW_m = randomInt(3, 8);
            let roomH_m = randomInt(3, 8);

            if (tileSide === 4) {
                if (roomW_m % 2 !== 0) roomW_m++;
                if (roomH_m % 2 !== 0) roomH_m++;
            }

            // Now we are sure roomW_dm and roomH_dm are divisible by tileSide
            const finalW_dm = roomW_m * 10;
            const finalH_dm = roomH_m * 10;
            const tileArea_dm2 = tileSide * tileSide;

            const count = (finalW_dm * finalH_dm) / tileArea_dm2;

            return {
                type: QuestionType.SingleChoice,
                questionText: `Bác An muốn lát nền một căn phòng hình chữ nhật kích thước ${finalW_dm / 10}m x ${finalH_dm / 10}m bằng các viên gạch hình vuông cạnh ${tileSide}dm. Hỏi bác cần bao nhiêu viên gạch? (Diện tích mạch vữa không đáng kể)`,
                correctAnswer: count.toString(),
                options: shuffleArray([count.toString(), ...generateWrongAnswers(count, 3, 50)]),
                explanation: `Diện tích phòng = ${finalW_dm}dm x ${finalH_dm}dm = ${finalW_dm * finalH_dm}dm².\nDiện tích 1 viên gạch = ${tileSide} x ${tileSide} = ${tileArea_dm2}dm².\nSố gạch = ${finalW_dm * finalH_dm} : ${tileArea_dm2} = ${count} viên.`
            };
        } else {
            // Fencing problem
            const w = randomInt(5, 15);
            const h = randomInt(10, 25);
            const gate = randomInt(2, 4);
            const perimeter = (w + h) * 2;
            const fence = perimeter - gate;

            return {
                type: QuestionType.SingleChoice,
                questionText: `Một khu vườn hình chữ nhật dài ${h}m, rộng ${w}m. Người ta làm hàng rào xung quanh vườn, có để một cửa ra vào rộng ${gate}m. Tính độ dài hàng rào?`,
                correctAnswer: fence.toString(),
                options: shuffleArray([fence.toString(), perimeter.toString(), (perimeter + gate).toString(), (fence - 10).toString()]),
                explanation: `Chu vi vườn = (${h} + ${w}) x 2 = ${perimeter}m.\nĐộ dài rào = Chu vi - Cửa = ${perimeter} - ${gate} = ${fence}m.`
            };
        }
    }

    // 4. Composite Shapes (Improved) - 20%
    else {
        const hA = randomInt(4, 8);
        const wA = randomInt(3, 6);
        const hB = randomInt(2, hA - 1);
        const wB = randomInt(3, 6);

        const isArea = Math.random() > 0.5;
        const area = (hA * wA) + (hB * wB);
        const perimeter = (hA * 2) + (wA * 2) + (wB * 2); // Correct for L-shape joined at bottom corner aligned? 

        const ans = isArea ? area : perimeter;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hình vẽ bên dưới được tạo bởi hai hình chữ nhật ghép lại. Hình lớn cao ${hA}cm rộng ${wA}cm, hình nhỏ cao ${hB}cm rộng ${wB}cm. Tính ${isArea ? 'diện tích' : 'chu vi'} của toàn bộ hình?`,
            visualSvg: createCompositeSVG(hA, wA, hB, wB),
            correctAnswer: ans.toString(),
            options: shuffleArray([ans.toString(), ...generateWrongAnswers(ans, 3, 15)]),
            explanation: isArea
                ? `Chia hình thành 2 hình chữ nhật: Hình 1 (${hA}x${wA}) và Hình 2 (${hB}x${wB}).\nTổng diện tích = ${hA * wA} + ${hB * wB} = ${area} cm²`
                : `Chu vi = Tổng độ dài các cạnh bao quanh hình.\nHoặc dùng mẹo: Chu vi hình này bằng chu vi hình chữ nhật bao quanh (Cao ${hA}, Rộng ${wA + wB}).`
        };
    }
};
