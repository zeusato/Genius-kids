// Lớp 1 — 32 bài ít chữ, nhiều hình, tự đọc to; bản nháp.
import type { LessonBook } from '../types';
import numbers from './g1/numbers';
import arithmetic from './g1/arithmetic';
import world from './g1/world';
export default { ...numbers, ...arithmetic, ...world } satisfies LessonBook;
