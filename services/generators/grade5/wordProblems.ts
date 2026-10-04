// Lớp 5 — Chuyển động đều (g5_word_problems): vận tốc, quãng đường, thời gian; hai chuyển động (gặp nhau, đuổi kịp).
// Làm chung công việc, chuyển động trên dòng nước là "Nâng cao". Số liệu chọn để đáp án CHÍNH XÁC.
import { tpl, fromTemplates, single, rint, pickOne, chance } from '../kit';
import { fmt } from '../../study/value';
import type { Template } from '../../study/types';

const VEH: [string, number, number][] = [['xe đạp', 10, 15], ['xe máy', 30, 45], ['ô tô', 40, 60], ['người đi bộ', 4, 6]];
const hours = (h: number) => (Number.isInteger(h) ? `${h} giờ` : `${Math.floor(h)} giờ ${Math.round((h % 1) * 60)} phút`);
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;

export const templates: Template[] = [
    tpl('g5.motion', 1, () => {
        const [v, lo, hi] = pickOne(VEH), speed = rint(lo, hi), t = rint(2, 5);
        return single({ q: `Một ${v} đi với vận tốc ${speed} km/giờ trong ${t} giờ. Tính quãng đường ${v} đi được.`, correct: speed * t, wrong: [speed + t, speed * (t + 1), speed * (t - 1)], format: x => `${x} km`, min: 0,
            explanation: `Quãng đường = vận tốc × thời gian = ${speed} × ${t} = ${speed * t} (km).`, hint: 's = v × t' });
    }),
    tpl('g5.motion', 2, () => {
        const [v, lo, hi] = pickOne(VEH), speed = rint(lo, hi), t = pickOne([2, 3, 4, 5, 1.5, 2.5]), s = speed * t;
        if (!Number.isInteger(s)) return single({ q: `Một ${v} đi quãng đường ${speed * 2} km hết 2 giờ. Tính vận tốc.`, correct: speed, wrong: [speed * 4, speed * 2, speed + 2], format: x => `${x} km/giờ`, min: 0, explanation: `v = s : t = ${speed * 2} : 2 = ${speed} (km/giờ).` });
        if (chance(0.5)) return single({ q: `Một ${v} đi quãng đường ${fmt(s)} km hết ${hours(t)}. Tính vận tốc của ${v}.`, correct: speed, wrong: [s * t, speed + 5, speed - 5, Math.round(s / Math.ceil(t))], format: x => `${x} km/giờ`, min: 0,
            explanation: `Vận tốc = quãng đường : thời gian = ${fmt(s)} : ${fmt(t)} = ${speed} (km/giờ).`, hint: 'v = s : t' });
        return single({ q: `Một ${v} đi với vận tốc ${speed} km/giờ trên quãng đường ${fmt(s)} km. Hỏi ${v} đi hết bao lâu?`, correct: t, wrong: [t + 1, t - 0.5, t * 2, t + 0.5].filter(x => x > 0), format: hours, min: 0,
            explanation: `Thời gian = quãng đường : vận tốc = ${fmt(s)} : ${speed} = ${fmt(t)} (giờ) = ${hours(t)}.`, hint: 't = s : v' });
    }),
    tpl('g5.motion', 3, () => {
        const speed = rint(30, 60), h1 = rint(6, 9), t = rint(2, 4), late = pickOne([0, 15, 30]);
        const start = `${h1} giờ${late ? ` ${late} phút` : ''}`, end = `${h1 + t} giờ${late ? ` ${late} phút` : ''}`;
        return single({ q: `Một ô tô khởi hành lúc ${start} và đến nơi lúc ${end}, đi với vận tốc ${speed} km/giờ. Tính quãng đường ô tô đã đi.`, correct: speed * t, wrong: [speed * (h1 + t), speed + t, speed * (t + 1)], format: x => `${x} km`, min: 0,
            explanation: `Thời gian đi: ${end} - ${start} = ${t} giờ. Quãng đường: ${speed} × ${t} = ${speed * t} (km).`, steps: [`Thời gian: ${end} - ${start} = ${t} giờ`, `Quãng đường: ${speed} × ${t} = ${speed * t} (km)`] });
    }),
    tpl('g5.motion_two', 3, () => {
        const v1 = rint(30, 50), v2 = rint(30, 50), t = rint(2, 4);
        if (chance(0.5)) return single({ q: `Hai ô tô xuất phát cùng lúc từ hai tỉnh cách nhau ${(v1 + v2) * t} km, đi ngược chiều nhau. Ô tô thứ nhất đi ${v1} km/giờ, ô tô thứ hai đi ${v2} km/giờ. Sau bao lâu hai xe gặp nhau?`,
            visual: { fn: 'segmentDiagramSVG', args: [[{ label: 'Xe 1 →', parts: [v1], labels: [`${v1} km`] }, { label: '← Xe 2', parts: [v2], labels: [`${v2} km`] }], 'Quãng đường mỗi xe đi trong 1 giờ'] },
            correct: t, wrong: [t + 1, t * 2, t + 2], format: hours, closed: true,
            explanation: `Sau mỗi giờ hai xe gần nhau thêm: ${v1} + ${v2} = ${v1 + v2} (km). Thời gian gặp nhau: ${(v1 + v2) * t} : ${v1 + v2} = ${t} (giờ).`, steps: [`Tổng vận tốc: ${v1} + ${v2} = ${v1 + v2} (km/giờ)`, `Thời gian: ${(v1 + v2) * t} : ${v1 + v2} = ${t} (giờ)`], hint: 'Ngược chiều: cộng hai vận tốc.' });
        const slow = rint(10, 30), fast = slow + rint(10, 25), gap = (fast - slow) * t;
        return single({ q: `Một xe đạp đi trước một ô tô ${gap} km, cùng chiều. Xe đạp đi ${slow} km/giờ, ô tô đi ${fast} km/giờ. Sau bao lâu ô tô đuổi kịp xe đạp?`, correct: t, wrong: [t + 1, t * 2, t + 2], format: hours, closed: true,
            visual: { fn: 'segmentDiagramSVG', args: [[{ label: 'Xe đạp →', parts: [slow], labels: [`${slow} km`] }, { label: 'Ô tô →', parts: [slow, fast - slow], labels: [`${slow} km`, '?'] }], 'Quãng đường trong 1 giờ; phần hơn: ?'] },
            explanation: `Mỗi giờ ô tô gần xe đạp thêm: ${fast} - ${slow} = ${fast - slow} (km). Thời gian: ${gap} : ${fast - slow} = ${t} (giờ).`, steps: [`Hiệu vận tốc: ${fast} - ${slow} = ${fast - slow} (km/giờ)`, `Thời gian đuổi kịp: ${gap} : ${fast - slow} = ${t} (giờ)`], hint: 'Cùng chiều, đuổi nhau: lấy hiệu hai vận tốc.' });
    }, { noRankCheck: true }),
    tpl('g5.work_together', 3, () => {
        const [a, b] = pickOne([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [8, 24], [5, 20], [9, 18], [15, 30], [10, 40], [4, 4], [6, 6], [8, 8], [12, 4], [18, 9]] as const), t = (a * b) / (a + b);
        const job = pickOne(['đào xong một đoạn mương', 'sơn xong một bức tường', 'gặt xong một thửa ruộng', 'đóng xong một lô hàng']);
        const common = a * b / gcd(a, b), numerator = common / a + common / b, divisor = gcd(numerator, common);
        const rate = `${numerator / divisor}/${common / divisor}`;
        const sum = `1/${a} + 1/${b} = ${common / a}/${common} + ${common / b}/${common} = ${numerator}/${common}${divisor > 1 ? ` = ${rate}` : ''}`;
        return single({ q: `Người thứ nhất ${job} trong ${a} ngày, người thứ hai ${job} trong ${b} ngày. Nếu hai người cùng làm thì xong công việc đó trong bao nhiêu ngày?`, correct: t, wrong: [a + b, (a + b) / 2, Math.min(a, b)].filter(x => x !== t), format: x => `${fmt(x)} ngày`, closed: true,
            explanation: `Một ngày người thứ nhất làm 1/${a}, người thứ hai làm 1/${b} công việc; cùng làm: ${sum}. Thời gian: 1 : (${rate}) = ${fmt(t)} (ngày).`,
            steps: [`Phần công việc hai người cùng làm trong một ngày: ${sum}`, `Thời gian làm chung: 1 : (${rate}) = ${fmt(t)} (ngày)`] });
    }, { noRankCheck: true }),
    tpl('g5.stream', 3, () => {
        const boat = rint(15, 30), water = rint(2, 5), t = rint(2, 4), down = chance(0.5);
        const v = down ? boat + water : boat - water;
        return single({ q: `Một ca nô có vận tốc khi nước lặng là ${boat} km/giờ, vận tốc dòng nước là ${water} km/giờ. Ca nô đi ${down ? 'xuôi' : 'ngược'} dòng trong ${t} giờ được bao nhiêu ki-lô-mét?`, correct: v * t, wrong: [(down ? boat - water : boat + water) * t, boat * t, (boat + water) * t + water], format: x => `${x} km`, min: 0,
            explanation: `Vận tốc ${down ? 'xuôi' : 'ngược'} dòng: ${boat} ${down ? '+' : '-'} ${water} = ${v} (km/giờ). Quãng đường: ${v} × ${t} = ${v * t} (km).` });
    }),
];

export const generateG5WordProblems = fromTemplates(templates);
