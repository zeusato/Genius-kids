// Lớp 4 — 42 bài; bản nháp chờ chủ dự án duyệt.
import type { LessonBook } from '../types';
import numbers from './g4/numbers';
import arithmetic from './g4/arithmetic';
import fractions from './g4/fractions';
import geometry from './g4/geometry';
import problems from './g4/problems';
export default { ...numbers, ...arithmetic, ...fractions, ...geometry, ...problems } satisfies LessonBook;
