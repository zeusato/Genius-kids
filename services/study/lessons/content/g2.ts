// Lớp 2 — 32 bài; bản nháp chờ chủ dự án duyệt.
import type { LessonBook } from '../types';
import arithmetic from './g2/arithmetic';
import multiply from './g2/multiply';
import measurement from './g2/measurement';
import world from './g2/world';
export default { ...arithmetic, ...multiply, ...measurement, ...world } satisfies LessonBook;
