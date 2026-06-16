import { describe, it, expect } from 'vitest';
import * as svg from './index';
import { generateG5Geometry } from '../grade5/geometry';
import { generateG2Time } from '../grade2/time';
import { generateGeometry as generateG1Geometry } from '../grade1/geometry';
import { generateFractions } from '../grade4/fractions';
import { generateGeometryG4 } from '../grade4/geometry';
import { generateAngles } from '../grade4/angles';
import { generateStatistics } from '../grade4/statistics';

/** SVG hợp lệ: bắt đầu bằng <svg, có viewBox, không lọt NaN/undefined. */
const expectValidSvg = (s: string) => {
    expect(s.trim().startsWith('<svg')).toBe(true);
    expect(s).toContain('viewBox');
    expect(s).not.toMatch(/NaN|undefined/);
};

describe('SVG kit — sinh hình hợp lệ, không NaN', () => {
    it('hình học theo số đo', () => {
        expectValidSvg(svg.rectSVG(12, 5));
        expectValidSvg(svg.squareSVG(7));
        expectValidSvg(svg.parallelogramSVG(8, 5));
        expectValidSvg(svg.rhombusSVG(6, 8));
        expectValidSvg(svg.trapezoidSVG(4, 10, 6));
        expectValidSvg(svg.triangleSVG({ base: 8, height: 5 }));
        expectValidSvg(svg.triangleSVG({ sides: [3, 4, 5] }));
        expectValidSvg(svg.circleSVG(6));
        expectValidSvg(svg.box3dSVG(10, 6, 4));
        expectValidSvg(svg.cubeSVG(5));
        expectValidSvg(svg.angleSVG(120));
    });

    it('đồng hồ, phân số, trục số, khối, biểu đồ, tiền, đếm, hình cơ bản', () => {
        expectValidSvg(svg.clockSVG(3, 15));
        expectValidSvg(svg.clockSVG(12, 0));
        expectValidSvg(svg.fractionBarSVG(2, 5));
        expectValidSvg(svg.fractionPieSVG(3, 8));
        expectValidSvg(svg.numberLineSVG(0, 10, 1, [3, 7]));
        expectValidSvg(svg.baseTenSVG(247));
        expectValidSvg(svg.barChartSVG([{ label: 'Toán', value: 8 }, { label: 'Văn', value: 5 }]));
        expectValidSvg(svg.pieChartSVG([{ label: 'A', value: 3 }, { label: 'B', value: 1 }]));
        expectValidSvg(svg.moneySVG(37000));
        expectValidSvg(svg.countingSVG('🍎', 7));
        expectValidSvg(svg.shapeSVG('triangle'));
        expectValidSvg(svg.shapesGridSVG('circle', 4));
    });
});

describe('Generator đã refactor — visualSvg hợp lệ qua nhiều lần sinh', () => {
    const gens: Array<[string, () => { visualSvg?: string }]> = [
        ['g5_geometry', generateG5Geometry],
        ['g2_time', generateG2Time],
        ['g1_geometry', generateG1Geometry],
        ['g4_fractions', generateFractions],
        ['g4_geometry', generateGeometryG4],
        ['g4_angles', generateAngles],
        ['g4_statistics', generateStatistics],
    ];
    it('không sinh SVG lỗi (NaN/undefined) trong 200 lần mỗi loại', () => {
        for (const [, gen] of gens) {
            for (let i = 0; i < 200; i++) {
                const q = gen();
                if (q.visualSvg && q.visualSvg.trim().startsWith('<svg')) expectValidSvg(q.visualSvg);
            }
        }
    });
});
