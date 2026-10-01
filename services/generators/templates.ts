// Danh sách template của các generator ĐÃ chuyển sang dạng kỹ năng (GĐ2).
// Generator chưa chuyển vẫn chạy qua lớp bọc "legacy" trong services/study/registry.ts.
import type { Template } from '../study/types';
import { templates as mnCounting } from './preschool/counting';
import { templates as mnShapes } from './preschool/shapes';
import { templates as mnColors } from './preschool/colors';
import { templates as mnTime } from './preschool/time';

export const TEMPLATE_SETS: Template[][] = [
    mnCounting, mnShapes, mnColors, mnTime,
];
