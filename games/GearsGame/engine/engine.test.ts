import { describe, it, expect } from 'vitest';
import { simulate, rotationDeg } from './simulate';
import { evaluateBuildGoal, gradeGuess } from './goals';
import { generateBuildLevel, generateGuessLevel, estimateBuildSolution } from './levelgen';
import { areMeshing } from './graph';
import { GearSpec, GearLayout, MotorConfig, BuildLevel } from './types';

const mk = (id: string, x: number, y: number, teeth: number, role: GearSpec['role'] = 'gear'): GearSpec => ({
    id,
    x,
    y,
    teeth,
    radius: teeth * 3,
    fixed: role !== 'gear',
    role,
});
const M: MotorConfig = { id: 'motor', dir: 1, speed: 1 };
const dirs = (layout: GearLayout, motor = M) => {
    const r = simulate(layout, motor);
    return Object.fromEntries(layout.gears.map((g) => [g.id, r.runtime.get(g.id)!.dir]));
};

describe('simulate — chiều quay', () => {
    it('chuỗi ăn khớp đảo chiều xen kẽ, tốc độ theo tỉ số răng', () => {
        const layout = { gears: [mk('motor', 100, 100, 12, 'motor'), mk('g', 172, 100, 12), mk('target', 244, 100, 12, 'target')], belts: [] };
        const r = simulate(layout, M);
        expect(r.runtime.get('motor')!.dir).toBe(1);
        expect(r.runtime.get('g')!.dir).toBe(-1);
        expect(r.runtime.get('target')!.dir).toBe(1);
        expect(r.jammed).toBe(false);
    });

    it('tốc độ: bánh nhỏ quay nhanh hơn (ω ∝ 1/răng)', () => {
        const layout = { gears: [mk('motor', 100, 100, 12, 'motor'), mk('g', 166, 100, 10)], belts: [] };
        const r = simulate(layout, M);
        expect(r.runtime.get('g')!.speed).toBeCloseTo(1.2, 5); // 1 * 12/10
    });

    it('dây đai THẲNG giữ nguyên chiều', () => {
        const layout: GearLayout = { gears: [mk('p', 100, 100, 12, 'motor'), mk('q', 300, 100, 12)], belts: [{ id: 'b', a: 'p', b: 'q', kind: 'belt' }] };
        const r = simulate(layout, { id: 'p', dir: 1, speed: 1 });
        expect(r.runtime.get('q')!.dir).toBe(1);
    });

    it('dây đai CHÉO đảo chiều', () => {
        const layout: GearLayout = { gears: [mk('p', 100, 100, 12, 'motor'), mk('q', 300, 100, 12)], belts: [{ id: 'b', a: 'p', b: 'q', kind: 'belt-crossed' }] };
        const r = simulate(layout, { id: 'p', dir: 1, speed: 1 });
        expect(r.runtime.get('q')!.dir).toBe(-1);
    });

    it('không phụ thuộc thứ tự mảng (tất định)', () => {
        const g = [mk('motor', 100, 100, 12, 'motor'), mk('a', 172, 100, 12), mk('b', 244, 100, 12)];
        const d1 = dirs({ gears: g, belts: [] });
        const d2 = dirs({ gears: [...g].reverse(), belts: [] });
        expect(d1).toEqual(d2);
    });
});

describe('simulate — kẹt máy', () => {
    it('vòng LẺ (tam giác) bị kẹt toàn cụm', () => {
        const layout = { gears: [mk('A', 100, 100, 12, 'motor'), mk('B', 172, 100, 12), mk('C', 136, 162.35, 12)], belts: [] };
        const r = simulate(layout, { id: 'A', dir: 1, speed: 1 });
        expect(r.jammed).toBe(true);
        expect([...r.jammedGearIds].sort()).toEqual(['A', 'B', 'C']);
        expect(r.runtime.get('A')!.state).toBe('jammed');
    });

    it('vòng CHẴN (hình vuông) KHÔNG kẹt', () => {
        const layout = { gears: [mk('A', 100, 100, 12, 'motor'), mk('B', 172, 100, 12), mk('C', 172, 172, 12), mk('D', 100, 172, 12)], belts: [] };
        const r = simulate(layout, { id: 'A', dir: 1, speed: 1 });
        expect(r.jammed).toBe(false);
        expect(r.runtime.get('C')!.dir).toBe(1); // đối đỉnh với A → cùng chiều
        expect(r.runtime.get('B')!.dir).toBe(-1);
    });

    it('cặp vừa ăn-khớp vừa nối-đai-thẳng → mâu thuẫn → kẹt', () => {
        const layout: GearLayout = {
            gears: [mk('m', 100, 100, 12, 'motor'), mk('n', 172, 100, 12)],
            belts: [{ id: 'b', a: 'm', b: 'n', kind: 'belt' }], // belt muốn cùng chiều, mesh muốn ngược
        };
        const r = simulate(layout, { id: 'm', dir: 1, speed: 1 });
        expect(r.jammed).toBe(true);
    });

    it('kẹt CHỈ ảnh hưởng cụm nối motor, cụm độc lập vẫn idle', () => {
        const layout = {
            gears: [
                mk('A', 100, 100, 12, 'motor'), mk('B', 172, 100, 12), mk('C', 136, 162.35, 12), // tam giác kẹt
                mk('X', 600, 400, 12), // cô lập
            ],
            belts: [],
        };
        const r = simulate(layout, { id: 'A', dir: 1, speed: 1 });
        expect(r.runtime.get('X')!.state).toBe('idle');
        expect(r.jammedGearIds.has('X')).toBe(false);
    });

    it('bánh răng không nối tới motor → idle', () => {
        const layout = { gears: [mk('motor', 100, 100, 12, 'motor'), mk('far', 600, 400, 12)], belts: [] };
        const r = simulate(layout, M);
        expect(r.runtime.get('far')!.state).toBe('idle');
        expect(r.runtime.get('far')!.dir).toBe(0);
    });
});

describe('rotationDeg', () => {
    it('dir=1 tiến dương, dir=-1 tiến âm, idle giữ pha', () => {
        expect(rotationDeg({ state: 'driven', dir: 1, speed: 1, phaseDeg: 0 }, 2)).toBe(180);
        expect(rotationDeg({ state: 'driven', dir: -1, speed: 1, phaseDeg: 0 }, 2)).toBe(-180);
        expect(rotationDeg({ state: 'idle', dir: 0, speed: 0, phaseDeg: 42 }, 5)).toBe(42);
        expect(rotationDeg({ state: 'jammed', dir: 0, speed: 0, phaseDeg: 10 }, 5)).toBe(10);
    });
});

describe('graph.areMeshing — dung sai tương đối', () => {
    it('chạm đúng khoảng → mesh; cách xa → không', () => {
        const a = mk('a', 0, 0, 12); // r36
        expect(areMeshing(a, mk('b', 72, 0, 12))).toBe(true); // d=72=r+r
        expect(areMeshing(a, mk('b', 120, 0, 12))).toBe(false);
    });
});

describe('goals', () => {
    const baseLevel: BuildLevel = {
        id: 't', seed: 1, difficulty: 'easy',
        layout: { gears: [], belts: [] }, waterZones: [],
        targetDirection: 1, maxComponents: 6, maxBelts: 0, maxBeltLength: 400, availableGearSizes: [12], fixedGearIds: [],
    };

    it('evaluateBuildGoal: target quay đúng chiều → thắng', () => {
        const layout = { gears: [mk('motor', 100, 100, 12, 'motor'), mk('g', 172, 100, 12), mk('target', 244, 100, 12, 'target')], belts: [] };
        const sim = simulate(layout, M);
        expect(sim.runtime.get('target')!.dir).toBe(1);
        expect(evaluateBuildGoal(sim, { ...baseLevel, targetDirection: 1 })).toBe(true);
        expect(evaluateBuildGoal(sim, { ...baseLevel, targetDirection: -1 })).toBe(false);
    });

    it('evaluateBuildGoal: target chưa nối → thua', () => {
        const layout = { gears: [mk('motor', 100, 100, 12, 'motor'), mk('target', 600, 100, 12, 'target')], belts: [] };
        const sim = simulate(layout, M);
        expect(evaluateBuildGoal(sim, baseLevel)).toBe(false);
    });

    it('gradeGuess chấm đúng/sai theo chiều thật', () => {
        const layout = { gears: [mk('motor', 100, 100, 12, 'motor'), mk('target', 172, 100, 12, 'target')], belts: [] };
        const sim = simulate(layout, M); // target meshes motor → dir -1
        const res = gradeGuess(sim, ['target'], new Map([['target', -1]]));
        expect(res.get('target')).toBe(true);
        const res2 = gradeGuess(sim, ['target'], new Map([['target', 1]]));
        expect(res2.get('target')).toBe(false);
    });
});

describe('levelgen — tất định & nối thông', () => {
    it('cùng seed → cùng layout (build & guess)', () => {
        expect(JSON.stringify(generateBuildLevel('medium', 777))).toEqual(JSON.stringify(generateBuildLevel('medium', 777)));
        expect(JSON.stringify(generateGuessLevel('hard', 777))).toEqual(JSON.stringify(generateGuessLevel('hard', 777)));
    });

    it('build level luôn có motor & target', () => {
        const lv = generateBuildLevel('easy', 5);
        const ids = lv.layout.gears.map((g) => g.id);
        expect(ids).toContain('motor');
        expect(ids).toContain('target');
    });

    it('guess EASY: chuỗi nối thông motor→target (target driven) trên nhiều seed', () => {
        for (const seed of [1, 2, 3, 42, 100, 2024]) {
            const lv = generateGuessLevel('easy', seed);
            const sim = simulate(lv.layout, { id: lv.motorId, dir: 1, speed: 1 });
            expect(sim.runtime.get('target')!.state, `seed ${seed}`).toBe('driven');
        }
    });

    it('guess: số bánh răng nằm trong khoảng theo độ khó', () => {
        expect(generateGuessLevel('easy', 9).layout.gears.length).toBeGreaterThanOrEqual(5);
        expect(generateGuessLevel('hard', 9).layout.gears.length).toBeGreaterThanOrEqual(8);
        expect(generateGuessLevel('hard', 9).gearsToGuess).toContain('target');
    });
});

describe('build level — luôn GIẢI ĐƯỢC trong ngân sách & đúng chiều', () => {
    const seeds = [1, 2, 3, 7, 8, 9, 13, 42, 55, 100, 256, 777, 999, 2024, 31337];
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        for (const seed of seeds) {
            it(`${difficulty} · seed ${seed}`, () => {
                const lv = generateBuildLevel(difficulty, seed);
                const motor = lv.layout.gears.find((g) => g.id === 'motor')!;
                const target = lv.layout.gears.find((g) => g.id === 'target')!;

                const sol = estimateBuildSolution(motor, target, lv.waterZones, lv.maxBeltLength);
                expect(sol, 'phải dựng được lời giải tham khảo').not.toBeNull();

                // Lời giải tham khảo phải nằm GỌN trong ngân sách linh kiện cho phép.
                const used = sol!.gears.length + sol!.belts.length;
                expect(used, 'lời giải vừa ngân sách').toBeLessThanOrEqual(lv.maxComponents);

                // …và thực sự làm ĐÍCH quay ĐÚNG CHIỀU yêu cầu, không kẹt (⇒ hiện modal).
                const sim = simulate({ gears: [motor, target, ...sol!.gears], belts: sol!.belts }, { id: 'motor', dir: 1, speed: 1 });
                const t = sim.runtime.get('target')!;
                expect(sim.jammed, 'không kẹt').toBe(false);
                expect(t.state, 'đích phải quay').toBe('driven');
                expect(t.dir, 'khớp chiều yêu cầu').toBe(lv.targetDirection);
                expect(evaluateBuildGoal(sim, lv), 'thắng theo đúng luật').toBe(true);
            });
        }
    }
});
