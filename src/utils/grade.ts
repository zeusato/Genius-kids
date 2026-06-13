import { Grade } from '@/types';

/**
 * Helpers cho cấp lớp. Lưu ý: Grade.Preschool = 0 là giá trị FALSY,
 * nên luôn dùng so sánh tường minh (=== Grade.Preschool) thay vì kiểm tra truthy.
 */

/** Mầm non hay không. */
export function isPreschool(grade: Grade | number | undefined | null): boolean {
    return grade === Grade.Preschool;
}

/** Nhãn hiển thị cho cấp lớp: 0 → "Mầm non", còn lại → "Lớp N". */
export function getGradeLabel(grade: Grade | number | undefined | null): string {
    if (grade === Grade.Preschool) return 'Mầm non';
    return `Lớp ${grade}`;
}

/** Nhãn ngắn dùng cho chip/badge. */
export function getGradeShortLabel(grade: Grade | number | undefined | null): string {
    if (grade === Grade.Preschool) return 'Mầm non';
    return `${grade}`;
}
