// Hình học phẳng thuần cho Xưởng Cắt Giấy (plan mục 5.1). Đơn vị cm, trục y hướng lên.

export interface Vec { x: number; y: number }

/** Phép dời hình 2D: x' = a·x + c·y + e, y' = b·x + d·y + f. Phần tuyến tính luôn trực giao (det = ±1). */
export interface Iso { a: number; b: number; c: number; d: number; e: number; f: number }

export const IDENTITY: Iso = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

export const v = (x: number, y: number): Vec => ({ x, y });
export const add = (p: Vec, q: Vec): Vec => ({ x: p.x + q.x, y: p.y + q.y });
export const sub = (p: Vec, q: Vec): Vec => ({ x: p.x - q.x, y: p.y - q.y });
export const scale = (p: Vec, k: number): Vec => ({ x: p.x * k, y: p.y * k });
export const dot = (p: Vec, q: Vec) => p.x * q.x + p.y * q.y;
export const cross = (p: Vec, q: Vec) => p.x * q.y - p.y * q.x;
export const len = (p: Vec) => Math.hypot(p.x, p.y);
export const dist = (p: Vec, q: Vec) => Math.hypot(p.x - q.x, p.y - q.y);
export const perp = (p: Vec): Vec => ({ x: -p.y, y: p.x });
export function norm(p: Vec): Vec { const l = Math.hypot(p.x, p.y); return l > 0 ? { x: p.x / l, y: p.y / l } : { x: 1, y: 0 }; }

export const apply = (m: Iso, p: Vec): Vec => ({ x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f });
/** Chỉ phần tuyến tính (cho vector hướng/pháp tuyến). */
export const applyLinear = (m: Iso, p: Vec): Vec => ({ x: m.a * p.x + m.c * p.y, y: m.b * p.x + m.d * p.y });
export const det = (m: Iso) => m.a * m.d - m.b * m.c;

/** (m2 ∘ m1)(p) = m2(m1(p)) */
export function compose(m2: Iso, m1: Iso): Iso {
  return {
    a: m2.a * m1.a + m2.c * m1.b, b: m2.b * m1.a + m2.d * m1.b,
    c: m2.a * m1.c + m2.c * m1.d, d: m2.b * m1.c + m2.d * m1.d,
    e: m2.a * m1.e + m2.c * m1.f + m2.e, f: m2.b * m1.e + m2.d * m1.f + m2.f,
  };
}

/** Nghịch đảo của phép dời hình: phần tuyến tính trực giao nên nghịch đảo = chuyển vị. */
export function invert(m: Iso): Iso {
  const a = m.a, b = m.c, c = m.b, d = m.d;
  return { a, b, c, d, e: -(a * m.e + c * m.f), f: -(b * m.e + d * m.f) };
}

/** Phép đối xứng qua đường thẳng đi qua p, pháp tuyến đơn vị n. */
export function reflection(p: Vec, n: Vec): Iso {
  const k = 2 * dot(p, n);
  return { a: 1 - 2 * n.x * n.x, b: -2 * n.x * n.y, c: -2 * n.x * n.y, d: 1 - 2 * n.y * n.y, e: k * n.x, f: k * n.y };
}

export function rotationAbout(c: Vec, angle: number): Iso {
  const cs = Math.cos(angle), sn = Math.sin(angle);
  return { a: cs, b: sn, c: -sn, d: cs, e: c.x - cs * c.x + sn * c.y, f: c.y - sn * c.x - cs * c.y };
}

/** Khoảng cách có dấu từ q tới đường (p, n). Dương = phía n chỉ tới. */
export const side = (q: Vec, p: Vec, n: Vec) => (q.x - p.x) * n.x + (q.y - p.y) * n.y;
