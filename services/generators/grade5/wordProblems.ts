import { Question, QuestionType } from '../../../types';
import { formatNumber } from '../utils';
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

export const generateG5WordProblems = (): Omit<Question, 'id' | 'topicId'> => {
    const type = Math.random();

    // 0. Simple motion problems (Distance) (10%)
    if (type < 0.10) {
        const speed = randomInt(50, 95);
        const time = randomInt(2, 5);
        const distance = speed * time;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Một xe chạy với vận tốc ${speed}km/h trong ${time} giờ. Hỏi xe đi được bao nhiêu km?`,
            correctAnswer: `${formatNumber(distance)}km`,
            options: shuffleArray([
                `${formatNumber(distance)}km`,
                ...generateWrongAnswersWithSameUnits(distance, 3, 50).map(n => `${formatNumber(n)}km`)
            ]),
            explanation: `Quãng đường = Vận tốc × Thời gian = ${speed} × ${time} = ${formatNumber(distance)}km`
        };
    }

    // 1. Sum-difference-ratio (10%)
    else if (type < 0.20) {
        const diff = randomInt(10, 40) * 2;
        const smaller = randomInt(50, 150);
        const larger = smaller + diff;
        const sum = larger + smaller;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hai số có tổng là ${formatNumber(sum)} và hiệu là ${diff}. Số lớn là bao nhiêu?`,
            correctAnswer: formatNumber(larger),
            options: shuffleArray([formatNumber(larger), formatNumber(smaller), formatNumber(sum), formatNumber(diff)]),
            explanation: `Số lớn = (Tổng + Hiệu) : 2 = (${formatNumber(sum)} + ${diff}) : 2 = ${formatNumber(larger)}`
        };
    }

    // 2. Motion problems - meeting (10%)
    else if (type < 0.30) {
        const speed1 = randomInt(40, 60);
        const speed2 = randomInt(30, 50);
        const time = randomInt(2, 4);
        const distance = (speed1 + speed2) * time;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hai xe xuất phát cùng lúc từ hai địa điểm cách nhau ${distance}km, đi ngược chiều nhau. Xe thứ nhất chạy ${speed1}km/h, xe thứ hai chạy ${speed2}km/h. Hỏi sau bao lâu hai xe gặp nhau?`,
            correctAnswer: `${time} giờ`,
            options: shuffleArray([
                `${time} giờ`,
                `${time + 1} giờ`,
                `${time - 1} giờ`,
                `${Math.floor(distance / speed1)} giờ`
            ]),
            explanation: `Vận tốc gặp nhau = ${speed1} + ${speed2} = ${speed1 + speed2}km/h\\nThời gian = ${distance} : ${speed1 + speed2} = ${time} giờ`
        };
    }

    // 3. Work rate problems (5%)
    else if (type < 0.35) {
        const days1 = randomInt(6, 12);
        const days2 = randomInt(8, 15);
        const combinedRate = 1 / days1 + 1 / days2;
        const daysTogether = Math.round(1 / combinedRate);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Người thứ nhất làm một mình xong công việc trong ${days1} ngày. Người thứ hai làm một mình xong trong ${days2} ngày. Hỏi hai người cùng làm thì xong trong bao lâu?`,
            correctAnswer: `${daysTogether} ngày`,
            options: shuffleArray([
                `${daysTogether} ngày`,
                `${daysTogether + 1} ngày`,
                `${Math.floor((days1 + days2) / 2)} ngày`,
                `${days1} ngày`
            ]),
            explanation: `Một ngày người 1 làm: 1/${days1} công việc\\nMột ngày người 2 làm: 1/${days2} công việc\\nMột ngày cả hai làm: 1/${days1} + 1/${days2} công việc\\nThời gian ≈ ${daysTogether} ngày`
        };
    }

    // 4. Age problems (10%)
    else if (type < 0.45) {
        const currentChildAge = randomInt(8, 15);
        const currentParentAge = randomInt(32, 48);
        const ageGap = currentParentAge - currentChildAge;

        // Tìm số năm nữa để tuổi ba/mẹ gấp X lần tuổi con
        const multiplier = randomInt(2, 3);
        const yearsLater = Math.floor((ageGap - currentChildAge * multiplier) / (multiplier - 1));

        // Đảm bảo yearsLater > 0
        const validYears = yearsLater > 0 ? yearsLater : randomInt(3, 8);
        const futureChildAge = currentChildAge + validYears;
        const futureParentAge = currentParentAge + validYears;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Hiện nay ba ${currentParentAge} tuổi, con ${currentChildAge} tuổi. Hỏi ${validYears} năm nữa, tổng số tuổi của hai ba con là bao nhiêu?`,
            correctAnswer: `${futureChildAge + futureParentAge} tuổi`,
            options: shuffleArray([
                `${futureChildAge + futureParentAge} tuổi`,
                ...generateWrongAnswersWithSameUnits(futureChildAge + futureParentAge, 3, 10).map(n => `${n} tuổi`)
            ]),
            explanation: `Sau ${validYears} năm: Ba ${futureParentAge} tuổi, con ${futureChildAge} tuổi.\\nTổng = ${futureParentAge} + ${futureChildAge} = ${futureChildAge + futureParentAge} tuổi`
        };
    }

    // 5. Division with remainder (10%)
    else if (type < 0.55) {
        const divisor = randomInt(8, 15);
        const quotient = randomInt(10, 25);
        const remainder = randomInt(1, divisor - 1);
        const dividend = quotient * divisor + remainder;

        const questionType = Math.random() < 0.5 ? 'quotient' : 'remainder';

        if (questionType === 'quotient') {
            return {
                type: QuestionType.SingleChoice,
                questionText: `Chia ${formatNumber(dividend)} cho ${divisor}. Thương là bao nhiêu?`,
                correctAnswer: formatNumber(quotient),
                options: shuffleArray([
                    formatNumber(quotient),
                    ...generateWrongAnswersWithSameUnits(quotient, 3, 5).map(n => formatNumber(n))
                ]),
                explanation: `${formatNumber(dividend)} : ${divisor} = ${quotient} (dư ${remainder})`
            };
        } else {
            return {
                type: QuestionType.SingleChoice,
                questionText: `Chia ${formatNumber(dividend)} viên kẹo đều cho ${divisor} bạn. Hỏi còn thừa bao nhiêu viên?`,
                correctAnswer: `${remainder} viên`,
                options: shuffleArray([
                    `${remainder} viên`,
                    `${remainder + 1} viên`,
                    `${remainder - 1 > 0 ? remainder - 1 : divisor - 1} viên`,
                    `${quotient} viên`
                ]),
                explanation: `${formatNumber(dividend)} : ${divisor} = ${quotient} dư ${remainder}.\\nVậy còn thừa ${remainder} viên.`
            };
        }
    }

    // 6. Percentage (5%)
    else if (type < 0.60) {
        const total = randomInt(200, 800);
        const percent = [10, 20, 25, 50, 75][randomInt(0, 4)];
        const result = Math.floor(total * percent / 100);

        return {
            type: QuestionType.SingleChoice,
            questionText: `Một trường có ${formatNumber(total)} học sinh, trong đó ${percent}% là học sinh nữ. Hỏi có bao nhiêu học sinh nữ?`,
            correctAnswer: `${formatNumber(result)} học sinh`,
            options: shuffleArray([
                `${formatNumber(result)} học sinh`,
                ...generateWrongAnswersWithSameUnits(result, 3, 20).map(n => `${formatNumber(n)} học sinh`)
            ]),
            explanation: `Số học sinh nữ = ${formatNumber(total)} × ${percent}% = ${formatNumber(total)} × ${percent}/100 = ${formatNumber(result)} học sinh`
        };
    }

    // 7. Work capacity (5%)
    else if (type < 0.65) {
        const initialWorkers = randomInt(8, 16);
        const initialDays = randomInt(15, 24);
        const newDays = randomInt(10, initialDays - 2);

        // Công việc tổng = công nhân × ngày
        const totalWork = initialWorkers * initialDays;
        const newWorkers = Math.ceil(totalWork / newDays);
        const additionalWorkers = newWorkers - initialWorkers;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Một đội có ${initialWorkers} công nhân làm xong công việc trong ${initialDays} ngày. Nếu muốn hoàn thành trong ${newDays} ngày thì cần thêm bao nhiêu người?`,
            correctAnswer: `${additionalWorkers} người`,
            options: shuffleArray([
                `${additionalWorkers} người`,
                ...generateWrongAnswersWithSameUnits(additionalWorkers, 3, 5).map(n => `${Math.max(0, n)} người`)
            ]),
            explanation: `Tổng công việc = ${initialWorkers} × ${initialDays} = ${totalWork} (công/người)\\nCần số người = ${totalWork} : ${newDays} = ${newWorkers} người\\nCần thêm = ${newWorkers} - ${initialWorkers} = ${additionalWorkers} người`
        };
    }

    // 8. Calculate Speed (10%)
    else if (type < 0.75) {
        const time = randomInt(2, 5);
        const speed = randomInt(30, 60);
        const distance = speed * time;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Một ô tô đi quãng đường ${distance}km hết ${time} giờ. Tính vận tốc của ô tô?`,
            correctAnswer: `${speed}km/h`,
            options: shuffleArray([
                `${speed}km/h`,
                ...generateWrongAnswersWithSameUnits(speed, 3, 20).map(n => `${n}km/h`)
            ]),
            explanation: `Vận tốc = Quãng đường : Thời gian = ${distance} : ${time} = ${speed}km/h`
        };
    }

    // 9. Calculate Time (10%)
    else if (type < 0.85) {
        const speed = randomInt(30, 60);
        const time = randomInt(2, 6);
        const distance = speed * time;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Một xe máy đi với vận tốc ${speed}km/h trên quãng đường dài ${distance}km. Hỏi xe đi hết bao lâu?`,
            correctAnswer: `${time} giờ`,
            options: shuffleArray([
                `${time} giờ`,
                `${time + 1} giờ`,
                `${time - 1} giờ`,
                `${Math.floor(distance / (speed - 10))} giờ`
            ]),
            explanation: `Thời gian = Quãng đường : Vận tốc = ${distance} : ${speed} = ${time} giờ`
        };
    }

    // 10. Catch-up Motion (10%)
    else if (type < 0.95) {
        const v1 = randomInt(45, 65); // Faster
        const v2 = randomInt(25, 40); // Slower
        const diffV = v1 - v2;
        const time = randomInt(2, 4);
        const distanceGap = diffV * time;

        return {
            type: QuestionType.SingleChoice,
            questionText: `Xe máy chạy với vận tốc ${v2}km/h. Ô tô đuổi theo với vận tốc ${v1}km/h khi hai xe cách nhau ${distanceGap}km. Hỏi sau bao lâu ô tô đuổi kịp xe máy?`,
            correctAnswer: `${time} giờ`,
            options: shuffleArray([
                `${time} giờ`,
                `${time + 1} giờ`,
                `${time - 1} giờ`,
                `${Math.floor(distanceGap / v2)} giờ`
            ]),
            explanation: `Hiệu vận tốc = ${v1} - ${v2} = ${diffV}km/h\\nThời gian đuổi kịp = Khoảng cách : Hiệu vận tốc = ${distanceGap} : ${diffV} = ${time} giờ`
        };
    }

    // 11. Boat on River (5%)
    else {
        const vBoat = randomInt(15, 25);
        const vWater = randomInt(2, 5);
        const subType = Math.random();

        if (subType < 0.4) {
            // Find downstream speed
            const vDown = vBoat + vWater;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Vận tốc thực của canô là ${vBoat}km/h, vận tốc dòng nước là ${vWater}km/h. Tính vận tốc canô khi xuôi dòng?`,
                correctAnswer: `${vDown}km/h`,
                options: shuffleArray([
                    `${vDown}km/h`,
                    `${vBoat - vWater}km/h`,
                    `${vBoat}km/h`,
                    `${vBoat + vWater * 2}km/h`
                ]),
                explanation: `Vận tốc xuôi dòng = Vận tốc thực + Vận tốc dòng nước = ${vBoat} + ${vWater} = ${vDown}km/h`
            };
        } else if (subType < 0.7) {
            // Find upstream speed
            const vUp = vBoat - vWater;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Vận tốc thực của canô là ${vBoat}km/h, vận tốc dòng nước là ${vWater}km/h. Tính vận tốc canô khi ngược dòng?`,
                correctAnswer: `${vUp}km/h`,
                options: shuffleArray([
                    `${vUp}km/h`,
                    `${vBoat + vWater}km/h`,
                    `${vBoat}km/h`,
                    `${vBoat - vWater * 2}km/h`
                ]),
                explanation: `Vận tốc ngược dòng = Vận tốc thực - Vận tốc dòng nước = ${vBoat} - ${vWater} = ${vUp}km/h`
            };
        } else {
            // Find water speed given up and down
            const vDown = vBoat + vWater;
            const vUp = vBoat - vWater;
            return {
                type: QuestionType.SingleChoice,
                questionText: `Vận tốc canô xuôi dòng là ${vDown}km/h, ngược dòng là ${vUp}km/h. Tính vận tốc dòng nước?`,
                correctAnswer: `${vWater}km/h`,
                options: shuffleArray([
                    `${vWater}km/h`,
                    `${vBoat}km/h`,
                    `${vWater * 2}km/h`,
                    `${vWater + 1}km/h`
                ]),
                explanation: `Vận tốc dòng nước = (Vận tốc xuôi - Vận tốc ngược) : 2 = (${vDown} - ${vUp}) : 2 = ${vWater}km/h`
            };
        }
    }
};
