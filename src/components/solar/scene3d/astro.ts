// Vị trí THẬT của các hành tinh theo ngày — tham số quỹ đạo Kepler gần đúng của JPL
// (E.M. Standish, "Keplerian Elements for Approximate Positions of the Major Planets", bảng 1,
// hợp lệ 1800–2050, sai số cỡ phút cung — thừa đủ cho mô hình thu nhỏ).
// Trả về kinh độ hoàng đạo nhật tâm λ (radian) — đúng bằng góc α của orbitPoint() vì khung scene
// đặt +X = điểm xuân phân, α tăng ngược chiều kim đồng hồ nhìn từ bắc hoàng đạo.

type Elements = [number, number, number, number, number, number]; // a, e, I, L, ϖ, Ω (AU, độ)

const J2000: Record<string, { el: Elements; rate: Elements }> = {
    mercury: { el: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593], rate: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081] },
    venus: { el: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255], rate: [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418] },
    earth: { el: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], rate: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0] },
    mars: { el: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891], rate: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343] },
    jupiter: { el: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], rate: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106] },
    saturn: { el: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], rate: [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794] },
    uranus: { el: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503], rate: [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589] },
    neptune: { el: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574], rate: [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664] },
    pluto: { el: [39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684], rate: [-0.00031596, 0.0000517, 0.00004818, 145.20780515, -0.04062942, -0.01183482] }
};

export const REAL_POSITION_BODIES = Object.keys(J2000);

const DEG = Math.PI / 180;

export function julianDay(date: Date): number {
    return date.getTime() / 86400000 + 2440587.5;
}

// Kinh độ hoàng đạo nhật tâm (radian, 0..2π) của hành tinh tại thời điểm `date`
export function heliocentricLongitude(id: string, date: Date): number {
    const body = J2000[id];
    if (!body) throw new Error(`Không có tham số quỹ đạo cho ${id}`);
    const T = (julianDay(date) - 2451545.0) / 36525;
    const [a, e, I, L, varpi, Omega] = body.el.map((v, i) => v + body.rate[i] * T);
    const omega = (varpi - Omega) * DEG;
    let M = ((L - varpi) % 360 + 540) % 360 - 180; // −180..180
    M *= DEG;
    let E = M + e * Math.sin(M);
    for (let k = 0; k < 8; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const xp = a * (Math.cos(E) - e);
    const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cO = Math.cos(Omega * DEG), sO = Math.sin(Omega * DEG);
    const cw = Math.cos(omega), sw = Math.sin(omega);
    const cI = Math.cos(I * DEG);
    const x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
    const y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
    return (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);
}

// ---------- Địa danh để "xoay ra trước mặt" khi tới nơi ----------
// u = toạ độ ngang trên texture (0..1), lat = vĩ độ (độ). Đã dò trên chính texture của app
// (09/2026): Vết Đỏ Lớn u≈0,366 / −21°; Sao Hỏa & Trái Đất theo chuẩn u = (kinh độ + 180)/360.
export interface PlanetFeature {
    u: number;
    lat: number;
    label: string;
}

export const PLANET_FEATURES: Record<string, PlanetFeature> = {
    earth: { u: (107 + 180) / 360, lat: 16, label: '📍 Việt Nam mình ở đây!' },
    jupiter: { u: 0.366, lat: -21, label: '🌀 Vết Đỏ Lớn — cơn bão to hơn cả Trái Đất' },
    mars: { u: (-133.8 + 180) / 360, lat: 18.65, label: '🌋 Núi lửa Olympus — cao gấp 2,5 lần Everest' }
};

// Điểm trên quả cầu đơn vị theo đúng cách THREE.SphereGeometry trải UV
export function featureLocalPosition(f: PlanetFeature): [number, number, number] {
    const phi = f.u * Math.PI * 2;
    const cl = Math.cos(f.lat * DEG);
    return [-Math.cos(phi) * cl, Math.sin(f.lat * DEG), Math.sin(phi) * cl];
}
