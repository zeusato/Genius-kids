// Bài học — Lớp 5: gộp theo chủ đề (mỗi chủ đề một file trong ./g5/).
import type { LessonBook } from '../types';
import fractions from './g5/fractions';
import decimals from './g5/decimals';
import ratios from './g5/ratios';
import motion from './g5/motion';
import geometry from './g5/geometry';
import measures from './g5/measures';
import statistics from './g5/statistics';

export default { ...fractions, ...decimals, ...ratios, ...motion, ...geometry, ...measures, ...statistics } satisfies LessonBook;
