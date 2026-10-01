// Danh sách template của các generator ĐÃ chuyển sang dạng kỹ năng (GĐ2).
// Generator chưa chuyển vẫn chạy qua lớp bọc "legacy" trong services/study/registry.ts.
import type { Template } from '../study/types';
import { templates as mnCounting } from './preschool/counting';
import { templates as mnShapes } from './preschool/shapes';
import { templates as mnColors } from './preschool/colors';
import { templates as mnTime } from './preschool/time';
import { templates as g1Numbers5 } from './grade1/numbers5';
import { templates as g1Numbers10 } from './grade1/numbers10';
import { templates as g1Addition10 } from './grade1/addition10';
import { templates as g1Subtraction10 } from './grade1/subtraction10';
import { templates as g1Geometry } from './grade1/geometry';
import { templates as g1Numbers20 } from './grade1/numbers20';
import { templates as g1Numbers100 } from './grade1/numbers100';
import { templates as g1AddSub100 } from './grade1/addSub100';
import { templates as g1Operations20 } from './grade1/operations20';
import { templates as g1Length } from './grade1/length';
import { templates as g1Clock } from './grade1/clock';
import { templates as g1Time } from './grade1/time';
import { templates as g1WordProblems } from './grade1/wordProblems';
import { templates as g2AddSub20 } from './grade2/addSub20';
import { templates as g2AddSubNoCarry } from './grade2/addSubNoCarry';
import { templates as g2AddSubCarry } from './grade2/addSubCarry';
import { templates as g2Arithmetic } from './grade2/arithmetic';
import { templates as g2Multiplication } from './grade2/multiplication';
import { templates as g2Division } from './grade2/division';
import { templates as g2Numbers1000 } from './grade2/numbers1000';
import { templates as g2AddSub1000 } from './grade2/addSub1000';
import { templates as g2Geometry } from './grade2/geometry';
import { templates as g2Units } from './grade2/units';
import { templates as g2Time } from './grade2/time';
import { templates as g2Money } from './grade2/money';
import { templates as g2Statistics } from './grade2/statistics';
import { templates as g2Probability } from './grade2/probability';
import { templates as g3Multiplication } from './grade3/multiplication';
import { templates as g3Division } from './grade3/division';
import { templates as g3Expressions } from './grade3/expressions';
import { templates as g3Fractions } from './grade3/fractions';
import { templates as g3Geometry } from './grade3/geometry';
import { templates as g3Measurements } from './grade3/measurements';
import { templates as g3Numbers } from './grade3/numbers';
import { templates as g3Arithmetic } from './grade3/arithmetic';
import { templates as g3Area } from './grade3/area';
import { templates as g3Time } from './grade3/time';
import { templates as g3Money } from './grade3/money';
import { templates as g3Statistics } from './grade3/statistics';
import { templates as g3Probability } from './grade3/probability';
import { templates as g3WordProblems } from './grade3/wordProblems';

export const TEMPLATE_SETS: Template[][] = [
    mnCounting, mnShapes, mnColors, mnTime,
    g1Numbers5, g1Numbers10, g1Addition10, g1Subtraction10, g1Geometry, g1Numbers20, g1Numbers100, g1AddSub100,
    g1Operations20, g1Length, g1Clock, g1Time, g1WordProblems,
    g2AddSub20, g2AddSubNoCarry, g2AddSubCarry, g2Arithmetic, g2Multiplication, g2Division, g2Numbers1000, g2AddSub1000, g2Geometry, g2Units, g2Time, g2Money, g2Statistics, g2Probability,
    g3Multiplication, g3Division, g3Expressions, g3Fractions, g3Geometry, g3Measurements, g3Numbers, g3Arithmetic, g3Area, g3Time, g3Money, g3Statistics, g3Probability, g3WordProblems,
];
