// Thang thời gian của quạt: bán kính chuẩn hóa f ∈ [0,1] (0 = Trái Đất ra đời, 1 = hôm nay).
// "Mỗi đại một vòng" (mix = 0) — tuyến tính từng đoạn giữa các ranh giới địa chất; "Thời gian thật" (mix = 1)
// — tuyến tính theo năm. Thang log đã thử và bị loại: nén 3 tỷ năm vi sinh vật vào ~3% bán kính.
// CÙNG hằng số với docs/evolution-tree-wow/prototype-layout.mjs.

export const EARTH_MA = 4540;

export const KNOTS: ReadonlyArray<readonly [number, number]> = [
    [4540, 0], [4000, 0.07], [2500, 0.2], [538.8, 0.42], [251.9, 0.66], [66, 0.84], [23, 0.93], [0, 1],
];

export function fracEras(ma: number): number {
    if (ma >= KNOTS[0][0]) return 0;
    for (let i = 1; i < KNOTS.length; i++) {
        const [t0, f0] = KNOTS[i - 1], [t1, f1] = KNOTS[i];
        if (ma >= t1) return f0 + (f1 - f0) * (t0 - ma) / (t0 - t1);
    }
    return 1;
}

export const fracLinear = (ma: number): number => Math.min(1, Math.max(0, 1 - ma / EARTH_MA));

export function frac(ma: number, mix: number): number {
    return mix <= 0 ? fracEras(ma) : mix >= 1 ? fracLinear(ma) : fracEras(ma) * (1 - mix) + fracLinear(ma) * mix;
}

function erasInverse(f: number): number {
    if (f <= 0) return EARTH_MA;
    for (let i = 1; i < KNOTS.length; i++) {
        const [t0, f0] = KNOTS[i - 1], [t1, f1] = KNOTS[i];
        if (f <= f1) return t0 + (t1 - t0) * (f - f0) / (f1 - f0);
    }
    return 0;
}

/** Nghịch đảo của frac: bán kính chuẩn hóa → Ma. */
export function maAtFrac(f: number, mix: number): number {
    if (mix <= 0) return erasInverse(f);
    if (mix >= 1) return Math.max(0, (1 - f) * EARTH_MA);
    let lo = 0, hi = EARTH_MA; // frac giảm dần theo ma
    for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (frac(mid, mix) > f) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
}

/** LUT f → ma cho shader vòng đại. */
export function buildFracLUT(mix: number, size = 2048, out?: Float32Array): Float32Array {
    const a = out ?? new Float32Array(size);
    for (let k = 0; k < size; k++) a[k] = maAtFrac(k / (size - 1), mix);
    return a;
}

export interface EraBand { name: string; fromMa: number; toMa: number; color: string }
export const ERA_BANDS: EraBand[] = [
    { name: 'Hỏa Thành', fromMa: 4540, toMa: 4000, color: '#5a1e14' },
    { name: 'Thái Cổ', fromMa: 4000, toMa: 2500, color: '#113a44' },
    { name: 'Nguyên Sinh', fromMa: 2500, toMa: 538.8, color: '#1a2c52' },
    { name: 'Cổ Sinh', fromMa: 538.8, toMa: 251.9, color: '#15413a' },
    { name: 'Trung Sinh', fromMa: 251.9, toMa: 66, color: '#3f3a17' },
    { name: 'Tân Sinh', fromMa: 66, toMa: 0, color: '#44301f' },
];

export const PERIODS: { name: string; fromMa: number; toMa: number }[] = [
    { name: 'liên đại Hỏa Thành', fromMa: 4540, toMa: 4000 },
    { name: 'liên đại Thái Cổ', fromMa: 4000, toMa: 2500 },
    { name: 'liên đại Nguyên Sinh', fromMa: 2500, toMa: 635 },
    { name: 'kỷ Ediacara', fromMa: 635, toMa: 538.8 },
    { name: 'kỷ Cambri', fromMa: 538.8, toMa: 485 },
    { name: 'kỷ Ordovic', fromMa: 485, toMa: 444 },
    { name: 'kỷ Silur', fromMa: 444, toMa: 419 },
    { name: 'kỷ Devon', fromMa: 419, toMa: 359 },
    { name: 'kỷ Than Đá', fromMa: 359, toMa: 299 },
    { name: 'kỷ Permi', fromMa: 299, toMa: 251.9 },
    { name: 'kỷ Trias', fromMa: 251.9, toMa: 201 },
    { name: 'kỷ Jura', fromMa: 201, toMa: 145 },
    { name: 'kỷ Phấn Trắng', fromMa: 145, toMa: 66 },
    { name: 'kỷ Paleogen', fromMa: 66, toMa: 23 },
    { name: 'kỷ Neogen', fromMa: 23, toMa: 2.6 },
    { name: 'kỷ Đệ Tứ', fromMa: 2.6, toMa: 0 },
];

export function periodName(ma: number): string {
    return (PERIODS.find(p => ma <= p.fromMa && ma > p.toMa) ?? PERIODS[PERIODS.length - 1]).name;
}

const thousands = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const dec1 = (n: number) => n.toFixed(1).replace(/\.0$/, '').replace('.', ',');

/** "khoảng 1,8 tỷ năm trước" / "khoảng 430 triệu năm trước" / "khoảng 300.000 năm trước" (data-spec F2). */
export function formatMa(ma: number): string {
    if (ma <= 0) return 'hôm nay';
    if (ma >= 1000) return `khoảng ${dec1(ma / 1000)} tỷ năm trước`;
    if (ma >= 10) return `khoảng ${Math.round(ma / 10) * 10} triệu năm trước`;
    if (ma >= 1) return `khoảng ${dec1(ma)} triệu năm trước`;
    const years = ma * 1e6;
    if (ma >= 0.01) return `khoảng ${thousands(Math.round(years / 1000) * 1000)} năm trước`;
    return `khoảng ${thousands(Math.round(years / 100) * 100)} năm trước`;
}

/** Nhãn ngắn cho thanh thời gian: "4,5 tỷ năm", "66 triệu năm", "Hôm nay". */
export function shortMa(ma: number): string {
    if (ma <= 0.0005) return 'Hôm nay';
    if (ma >= 1000) return `${dec1(ma / 1000)} tỷ năm trước`;
    if (ma >= 1) return `${ma >= 10 ? Math.round(ma) : dec1(ma)} triệu năm trước`;
    return `${thousands(Math.round(ma * 1e6 / 1000) * 1000)} năm trước`;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** "Nếu lịch sử Trái Đất là 1 năm": 4540 Ma = 1/1 00:00, hôm nay = 31/12 24:00. */
export function cosmicDate(ma: number): { day: number; month: number; hh: number; mm: number; text: string } {
    const d = Math.min(364.99999, Math.max(0, (1 - ma / EARTH_MA) * 365));
    let dayIdx = Math.floor(d);
    let month = 0;
    while (dayIdx >= MONTH_DAYS[month]) { dayIdx -= MONTH_DAYS[month]; month++; }
    const minutes = Math.floor((d - Math.floor(d)) * 24 * 60);
    const hh = Math.floor(minutes / 60), mm = minutes % 60;
    const day = dayIdx + 1;
    return { day, month: month + 1, hh, mm, text: `${day}/${month + 1} lúc ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` };
}
