// Chia một bài học thành các trang (id ổn định, dùng cho ?page= và bitmask đã xem).
import type { Lesson, LessonPage } from './types';

export const MAX_PAGES = 20;

export function lessonPages(lesson: Lesson): LessonPage[] {
    // Mầm non vào ngay hai trang xem/nghe, rồi Em thử và Ghi nhớ: tối đa 4 trang.
    const pages: LessonPage[] = lesson.skillId.startsWith('mn.') ? [] : [{ id: 'intro', kind: 'intro', title: 'Bắt đầu bài học' }];
    lesson.know.forEach((k, i) => pages.push({ id: `know-${i}`, kind: 'know', title: k.title, index: i }));
    lesson.forms.forEach((f, i) => {
        pages.push({ id: `form-${f.id}`, kind: 'form', title: f.title, index: i, formId: f.id });
        pages.push({ id: `ex-${f.id}`, kind: 'example', title: `Ví dụ mẫu · ${f.title.split(':')[0]}`, index: i, formId: f.id });
    });
    lesson.mistakes.forEach((_, i) => pages.push({ id: `mistake-${i}`, kind: 'mistake', title: lesson.mistakes.length > 1 ? `Chỗ dễ nhầm ${i + 1}` : 'Chỗ dễ nhầm', index: i }));
    pages.push({ id: 'try', kind: 'try', title: 'Em thử' });
    pages.push({ id: 'remember', kind: 'remember', title: 'Ghi nhớ' });
    return pages;
}

export const tryIndex = (pages: LessonPage[]): number => pages.findIndex(p => p.kind === 'try');

/** Ước lượng phút đọc: ~0,4 phút/trang + 150 chữ/phút + 1,5 phút Em thử. */
export function lessonMinutes(lesson: Lesson): number {
    const words = JSON.stringify(lesson, (_k, v) => (typeof v === 'function' ? undefined : v)).split(/\s+/).length;
    return Math.max(2, Math.round(lessonPages(lesson).length * 0.25 + words / 150 + 1.5));
}
