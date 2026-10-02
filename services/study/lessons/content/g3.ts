// Bài học — Lớp 3: gộp theo chủ đề (mỗi chủ đề một file trong ./g3/).
import type { LessonBook } from '../types';
import multiplication from './g3/multiplication';
import division from './g3/division';
import expressions from './g3/expressions';
import fractions from './g3/fractions';
import wordProblems from './g3/wordProblems';
import numbers from './g3/numbers';
import arithmetic from './g3/arithmetic';

export default { ...multiplication, ...division, ...expressions, ...fractions, ...wordProblems, ...numbers, ...arithmetic } satisfies LessonBook;
