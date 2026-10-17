// Sheet: phần giấy còn lại trong toạ độ GIẤY (giấy chưa gấp, tâm ở gốc toạ độ). Plan mục 5.1.
import type { PaperSpec } from '../model';
import { circle, components, oriented, rect, union, type Shape } from './poly';

export type Sheet = Shape;

/** Tờ giấy ban đầu, đã làm tròn lưới 0,01 mm để mọi phép boolean sau không làm diện tích "tăng". */
export const initialSheet = (spec: PaperSpec): Sheet => union(rawSheet(spec));

function rawSheet(spec: PaperSpec): Shape {
  const { w, h } = spec;
  switch (spec.shape) {
    case 'circle': return circle(0, 0, w / 2, 128);
    case 'hexagon': {
      const r = w / 2, ring = [];
      for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; ring.push({ x: r * Math.cos(t), y: r * Math.sin(t) }); }
      return oriented([ring]);
    }
    default: return rect(-w / 2, -h / 2, w / 2, h / 2);
  }
}

/** Giấy đã rời thành nhiều mảnh chưa (mục 4.2: cắt đứt hết nếp gấp). */
export const pieceCount = (s: Sheet) => components(s).length;
