// ============================================================================
//  Sinh level — TẤT ĐỊNH theo seed, dùng CHUNG hệ toạ độ design (CANVAS/PLAY),
//  quy đổi teeth↔radius nhất quán, dung sai ăn khớp KHỚP với engine (graph.ts)
//  nên "generator coi là nối" thì "engine cũng coi là nối".
// ============================================================================

import {
    CANVAS,
    GEAR_SIZES,
    MESH_TOL_MIN,
    MESH_TOL_RATIO,
    MOTOR,
    PLACE_GAP,
    PLAY,
    teethToRadius,
} from './constants';
import { distance } from './graph';
import { makeRng, pick, randInt, Rng } from './rng';
import {
    BeltSpec,
    BuildLevel,
    Difficulty,
    GearRole,
    GearSpec,
    GuessLevel,
    WaterZone,
} from './types';

const CHAIN_TEETH = [8, 10, 12] as const;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const inBounds = (x: number, y: number, r: number) =>
    x - r >= PLAY.left && x + r <= PLAY.right && y - r >= PLAY.top && y + r <= PLAY.bottom;

const inWater = (x: number, y: number, r: number, zones: WaterZone[], pad = 6): boolean =>
    zones.some((z) => {
        const cx = clamp(x, z.x, z.x + z.width);
        const cy = clamp(y, z.y, z.y + z.height);
        return distance({ x, y }, { x: cx, y: cy }) < r + pad;
    });

const isValidPos = (
    x: number,
    y: number,
    r: number,
    gears: GearSpec[],
    meshWithId: string | null,
    zones: WaterZone[]
): boolean => {
    if (!inBounds(x, y, r)) return false;
    if (inWater(x, y, r, zones)) return false;
    for (const g of gears) {
        const d = distance({ x, y }, g);
        const ideal = r + g.radius;
        if (g.id === meshWithId) {
            // Đặt sát tâm dải ăn khớp để engine chắc chắn coi là nối.
            const tol = Math.max(MESH_TOL_MIN, ideal * MESH_TOL_RATIO) * 0.5;
            if (Math.abs(d - ideal) > tol) return false;
        } else if (d < ideal + PLACE_GAP) {
            return false;
        }
    }
    return true;
};

/** Tạo bánh răng ăn khớp với `prev`, hướng về (towardX, towardY). Luôn trả về 1 bánh. */
const createMeshedGear = (
    prev: GearSpec,
    id: string,
    role: GearRole,
    towardX: number,
    towardY: number,
    gears: GearSpec[],
    zones: WaterZone[],
    rng: Rng
): GearSpec => {
    const baseAngle = Math.atan2(towardY - prev.y, towardX - prev.x);
    const order = [pick(rng, CHAIN_TEETH), ...CHAIN_TEETH];
    for (const teeth of order) {
        const radius = teethToRadius(teeth);
        const meshDist = prev.radius + radius;
        for (let a = 0; a < 30; a++) {
            const angle = baseAngle + (a - 15) * 0.1;
            const x = prev.x + meshDist * Math.cos(angle);
            const y = prev.y + meshDist * Math.sin(angle);
            if (isValidPos(x, y, radius, gears, prev.id, zones)) {
                return { id, role, fixed: true, teeth, radius, x, y };
            }
        }
    }
    // Fallback: đặt đúng khoảng ăn khớp theo hướng gốc (teeth nhất quán radius).
    const teeth = 10;
    const radius = teethToRadius(teeth);
    const meshDist = prev.radius + radius;
    return {
        id,
        role,
        fixed: true,
        teeth,
        radius,
        x: prev.x + meshDist * Math.cos(baseAngle),
        y: prev.y + meshDist * Math.sin(baseAngle),
    };
};

// ==================== BUILD MODE ====================
export const generateBuildLevel = (difficulty: Difficulty, seed: number): BuildLevel => {
    const rng = makeRng(seed);

    const motorR = teethToRadius(MOTOR.teeth);
    const motor: GearSpec = {
        id: 'motor',
        role: 'motor',
        fixed: true,
        teeth: MOTOR.teeth,
        radius: motorR,
        x: PLAY.left + motorR + randInt(rng, 0, 30),
        y: randInt(rng, PLAY.top + motorR + 10, PLAY.bottom - motorR - 10),
    };

    const targetR = teethToRadius(12);
    const target: GearSpec = {
        id: 'target',
        role: 'target',
        fixed: true,
        teeth: 12,
        radius: targetR,
        x: PLAY.right - targetR - randInt(rng, 0, 30),
        y: randInt(rng, PLAY.top + targetR + 10, PLAY.bottom - targetR - 10),
    };

    let maxGears = 6;
    let maxBelts = 0;
    const waterZones: WaterZone[] = [];

    if (difficulty !== 'easy') {
        const riverX = Math.floor(CANVAS.W * (0.4 + rng() * 0.15));
        waterZones.push({ id: 'river-1', x: riverX, y: PLAY.top, width: 60, height: PLAY.bottom - PLAY.top });
        maxBelts = 2;
    }

    return {
        id: `build-${seed}`,
        seed,
        difficulty,
        layout: { gears: [motor, target], belts: [] },
        waterZones,
        targetDirection: rng() > 0.5 ? 1 : -1,
        targetMinSpeed: undefined,
        maxGears,
        maxBelts,
        maxBeltLength: 420,
        availableGearSizes: [...GEAR_SIZES],
        fixedGearIds: [],
    };
};

// ==================== GUESS MODE ====================
export const generateGuessLevel = (difficulty: Difficulty, seed: number): GuessLevel => {
    const rng = makeRng(seed);
    const gears: GearSpec[] = [];
    const belts: BeltSpec[] = [];
    const waterZones: WaterZone[] = [];
    const gearsToGuess: string[] = ['target'];

    const total = difficulty === 'easy' ? randInt(rng, 5, 7) : difficulty === 'medium' ? randInt(rng, 6, 9) : randInt(rng, 9, 12);

    const motorR = teethToRadius(MOTOR.teeth);
    const motorX = PLAY.left + motorR + 20;
    const motorY = randInt(rng, PLAY.top + motorR + 20, PLAY.bottom - motorR - 20);
    const targetX = PLAY.right - teethToRadius(12) - 20;
    const targetY = randInt(rng, PLAY.top + 60, PLAY.bottom - 60);

    const motor: GearSpec = { id: 'motor', role: 'motor', fixed: true, teeth: MOTOR.teeth, radius: motorR, x: motorX, y: motorY };
    gears.push(motor);

    const addTarget = (prev: GearSpec) => {
        const r = teethToRadius(12);
        const angle = Math.atan2(targetY - prev.y, targetX - prev.x);
        gears.push({
            id: 'target',
            role: 'target',
            fixed: true,
            teeth: 12,
            radius: r,
            x: prev.x + (prev.radius + r) * Math.cos(angle),
            y: prev.y + (prev.radius + r) * Math.sin(angle),
        });
    };

    if (difficulty === 'easy') {
        // Chuỗi ăn khớp trực tiếp, không có nước.
        const middle = total - 2;
        let current = motor;
        for (let i = 0; i < middle; i++) {
            const p = (i + 1) / (middle + 1);
            const tx = motorX + (targetX - motorX) * p;
            const ty = motorY + (targetY - motorY) * p + randInt(rng, -25, 25);
            current = createMeshedGear(current, `g${i}`, 'gear', tx, ty, gears, waterZones, rng);
            gears.push(current);
        }
        addTarget(current);
    } else {
        // Có sông + dây đai nối hai bờ.
        const riverX = Math.floor(CANVAS.W * 0.4);
        const riverW = 65;
        waterZones.push({ id: 'river-1', x: riverX, y: PLAY.top, width: riverW, height: PLAY.bottom - PLAY.top });

        const numFixedGuess = difficulty === 'hard' ? randInt(rng, 1, 3) : 0;
        let fixedPlaced = 0;

        const chainGears = total - 4; // motor + anchorL + anchorR + target
        const leftCount = Math.floor(chainGears / 2);
        const rightCount = chainGears - leftCount;

        let current = motor;
        for (let i = 0; i < leftCount; i++) {
            const tx = motorX + (riverX - 70 - motorX) * ((i + 1) / (leftCount + 1));
            const ty = motorY + randInt(rng, -20, 20);
            const makeFixed = difficulty === 'hard' && fixedPlaced < numFixedGuess && i === leftCount - 1;
            const id = makeFixed ? `fixed-${fixedPlaced}` : `l${i}`;
            current = createMeshedGear(current, id, 'gear', tx, ty, gears, waterZones, rng);
            gears.push(current);
            if (makeFixed) {
                gearsToGuess.push(id);
                fixedPlaced++;
            }
        }

        const anchorL = createMeshedGear(current, 'anchor-left', 'anchor', riverX - 50, current.y, gears, waterZones, rng);
        gears.push(anchorL);

        const anchorRx = riverX + riverW + 50;
        let anchorRy = anchorL.y;
        const anchorRr = teethToRadius(11);
        outer: for (let off = 0; off <= 90; off += 8) {
            for (const dir of [0, 1, -1]) {
                const ty = anchorL.y + dir * off;
                if (ty < PLAY.top + anchorRr || ty > PLAY.bottom - anchorRr) continue;
                if (isValidPos(anchorRx, ty, anchorRr, gears, null, waterZones)) {
                    anchorRy = ty;
                    break outer;
                }
            }
        }
        const anchorR: GearSpec = { id: 'anchor-right', role: 'anchor', fixed: true, teeth: 11, radius: anchorRr, x: anchorRx, y: anchorRy };
        gears.push(anchorR);
        // Hard: thỉnh thoảng dùng dây đai CHÉO (đảo chiều) để dạy thêm khái niệm.
        const beltKind = difficulty === 'hard' && rng() > 0.5 ? 'belt-crossed' : 'belt';
        belts.push({ id: 'belt-1', a: 'anchor-left', b: 'anchor-right', kind: beltKind });

        current = anchorR;
        for (let i = 0; i < rightCount; i++) {
            const p = (i + 1) / (rightCount + 1);
            const tx = current.x + (targetX - current.x) * p;
            const ty = current.y + (targetY - current.y) * p + randInt(rng, -15, 15);
            const makeFixed = difficulty === 'hard' && fixedPlaced < numFixedGuess && i === 0;
            const id = makeFixed ? `fixed-${fixedPlaced}` : `r${i}`;
            current = createMeshedGear(current, id, 'gear', tx, ty, gears, waterZones, rng);
            gears.push(current);
            if (makeFixed) {
                gearsToGuess.push(id);
                fixedPlaced++;
            }
        }
        addTarget(current);
    }

    return {
        id: `guess-${seed}`,
        seed,
        difficulty,
        layout: { gears, belts },
        waterZones,
        motorId: 'motor',
        gearsToGuess,
    };
};
