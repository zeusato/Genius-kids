// "So sánh vui" thay cho con số khô. TS thuần.
import type { ElementFull } from './elements';
import { formatYear } from './history';
import { stateAt } from './states';

const n1 = (x: number) => x.toLocaleString('vi-VN', { maximumFractionDigits: 1 });

export function densityLine(e: ElementFull): string | null {
    const d = e.density;
    if (!d) return null;
    if (e.estimated) return `Khối 1 cm³ được dự đoán nặng khoảng ${n1(d)} g — chưa ai cân được thật.`;
    if (e.state === 'gas') {
        const air = 1.2; const gl = d * 1000;
        return gl < air ? `Nhẹ hơn không khí ${n1(air / gl)} lần — bóng bay chứa nó sẽ bay lên.` : `Nặng hơn không khí ${n1(gl / air)} lần.`;
    }
    const cube = `Khối 1 cm³ nặng ${n1(d)} g`;
    if (d < 1) return `${cube} — nhẹ hơn nước, thả vào nước sẽ nổi.`;
    if (d < 1.5) return `${cube} — nặng xấp xỉ nước.`;
    return `${cube} — nặng bằng ${Math.round(d)} khối nước cùng cỡ.`;
}

const HOT: [number, string][] = [
    [-100, 'lạnh hơn cả Nam Cực'], [0, 'lạnh hơn nước đá'], [37, 'chỉ hơi ấm, như thân nhiệt'], [100, 'thấp hơn nước sôi'],
    [250, 'lò nướng bánh làm được'], [1000, 'phải dùng lò nung rất nóng'], [2000, 'nóng hơn cả dung nham núi lửa'], [99999, 'cực kỳ khó chảy'],
];

export function meltLine(e: ElementFull): string | null {
    if (e.sublimes) return `Không chảy lỏng mà bay hơi thẳng (thăng hoa) ở khoảng ${e.atomicNumber === 6 ? '3.642' : '614'} °C.`;
    const mp = e.meltingPoint;
    if (mp === undefined || mp === null) return null;
    if (e.estimated) return `Dự đoán chảy ở khoảng ${Math.round(mp).toLocaleString('vi-VN')} °C.`;
    const room = stateAt(e, 25);
    if (room !== 'solid') {
        const bp = e.boilingPoint;
        return room === 'gas' ? `Ở nhiệt độ phòng là khí. Hóa lỏng khi lạnh tới ${Math.round(bp ?? mp).toLocaleString('vi-VN')} °C.` : `Ở nhiệt độ phòng là chất lỏng. Đông đặc ở ${n1(mp)} °C.`;
    }
    const w = HOT.find(([t]) => mp < t)![1];
    return `Chảy lỏng ở ${Math.round(mp).toLocaleString('vi-VN')} °C — ${w}.`;
}

export function foundLine(e: ElementFull): string {
    const f = e.found;
    if (f.ancient) return `Con người đã biết từ thời cổ đại (khoảng ${formatYear(f.year)}).`;
    return `Tìm ra năm ${f.year}${f.by ? `, ${f.by}` : ''}${f.country ? ` (${f.country})` : ''}.`;
}

export function compareLines(e: ElementFull): string[] {
    return [densityLine(e), meltLine(e), foundLine(e)].filter((x): x is string => !!x);
}
