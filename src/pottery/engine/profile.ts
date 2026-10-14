import { clone, type ShapeDoc } from '../model';
import { cavityRadius } from './cavity';
export const SAMPLES = 64;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export function initialShape(): ShapeDoc { return { height: 1.45, thickness: .11, depth: 0, radii: Array.from({ length: SAMPLES }, (_, i) => .67 + .12 * Math.sin(i / 63 * Math.PI) - .06 * (i / 63) ** 6) }; }
export function radiusAt(shape: ShapeDoc, t: number) {
  const p = clamp(t, 0, 1) * (SAMPLES - 1), i = Math.floor(p), f = p - i;
  return shape.radii[i] * (1 - f) + shape.radii[Math.min(i + 1, SAMPLES - 1)] * f;
}
export function constrain(shape: ShapeDoc): ShapeDoc {
  shape.height = clamp(Number.isFinite(shape.height) ? shape.height : 1.45, .55, 3.4);
  shape.thickness = clamp(Number.isFinite(shape.thickness) ? shape.thickness : .11, .09, .18);
  shape.depth = clamp(Number.isFinite(shape.depth) ? shape.depth : 0, 0, shape.height - .13);
  shape.radii = Array.from({ length: SAMPLES }, (_, i) => clamp(Number.isFinite(shape.radii[i]) ? shape.radii[i] : .6, .28, 1.55));
  // Keep contours gentle and leave a safe wall even around the narrowest neck.
  const delta = shape.height / (SAMPLES - 1) * 1.65;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < SAMPLES; i++) shape.radii[i] = clamp(shape.radii[i], shape.radii[i - 1] - delta, shape.radii[i - 1] + delta);
    for (let i = SAMPLES - 2; i >= 0; i--) shape.radii[i] = clamp(shape.radii[i], shape.radii[i + 1] - delta, shape.radii[i + 1] + delta);
  }
  return shape;
}
export const innerRadius = cavityRadius;
export function sculpt(shape: ShapeDoc, at: number, amount: number, width = .14, smooth = false) {
  const prev = [...shape.radii];
  for (let i = 0; i < SAMPLES; i++) {
    const d = (i / (SAMPLES - 1) - at) / width;
    if (Math.abs(d) > 3) continue;
    const weight = Math.exp(-.5 * d * d);
    shape.radii[i] += smooth ? ((prev[Math.max(0, i - 1)] + prev[Math.min(SAMPLES - 1, i + 1)]) / 2 - prev[i]) * clamp(Math.abs(amount) * 30, 0, .7) * weight : amount * weight;
  }
  constrain(shape);
}
export function setHeight(shape: ShapeDoc, height: number) {
  const old = shape.height, next = clamp(height, .55, 3.4);
  const scale = Math.pow(old / next, .12); // Deliberately gentle assistance, not mass-conserving physics.
  shape.radii = shape.radii.map(r => r * scale);
  shape.height = next;
  if (shape.depth > 0) shape.depth = Math.max(.15, shape.depth * next / old);
  constrain(shape);
}
export function openVessel(shape: ShapeDoc) { shape.depth = shape.height - .16; constrain(shape); }
export function arcTable(shape: ShapeDoc): number[] {
  const table = [0];
  for (let i = 1; i < SAMPLES; i++) table.push(table[i - 1] + Math.hypot(shape.height / (SAMPLES - 1), shape.radii[i] - shape.radii[i - 1]));
  return table.map(v => v / table[SAMPLES - 1]);
}
export function arcAt(shape: ShapeDoc, t: number) {
  const a = arcTable(shape), p = clamp(t, 0, 1) * 63, i = Math.floor(p), f = p - i;
  return a[i] * (1 - f) + a[Math.min(i + 1, 63)] * f;
}
export const SHAPES = [
  { id: 'cup', name: 'Cốc thẳng', height: 1.8, curve: (t: number) => .67 + t * .04 },
  { id: 'bowl', name: 'Bát ăn cơm', height: .95, curve: (t: number) => .43 + .72 * Math.sin(t * Math.PI / 2) },
  { id: 'flared', name: 'Bát loe', height: 1.15, curve: (t: number) => .4 + .85 * t },
  { id: 'vase', name: 'Bình cổ cao', height: 2.8, curve: (t: number) => .48 + .43 * Math.exp(-(((t - .3) / .24) ** 2)) },
  { id: 'round', name: 'Bình bụng tròn', height: 1.9, curve: (t: number) => .45 + .65 * Math.sin(t * Math.PI) },
  { id: 'bud', name: 'Lọ hoa nhỏ', height: 1.5, curve: (t: number) => .34 + .3 * Math.sin(t * Math.PI) },
  { id: 'planter', name: 'Chậu cây', height: 1.5, curve: (t: number) => .6 + .35 * t },
  { id: 'plate', name: 'Đĩa sâu', height: .6, curve: (t: number) => .65 + .75 * t },
];
export function referenceShape(id: string): ShapeDoc {
  const spec = SHAPES.find(s => s.id === id) || SHAPES[0];
  return constrain({ height: spec.height, thickness: .11, depth: spec.height - .16, radii: Array.from({ length: SAMPLES }, (_, i) => spec.curve(i / 63)) });
}
export function validShape(shape: ShapeDoc) {
  if (!shape || !Array.isArray(shape.radii) || shape.radii.length !== SAMPLES || ![shape.height, shape.depth, shape.thickness, ...shape.radii].every(Number.isFinite)) return false;
  const bounded = constrain(clone(shape));
  return Math.abs(bounded.height - shape.height) < 1e-6 && Math.abs(bounded.depth - shape.depth) < 1e-6 && Math.abs(bounded.thickness - shape.thickness) < 1e-6 && bounded.radii.every((r, i) => Math.abs(r - shape.radii[i]) < 1e-6);
}
