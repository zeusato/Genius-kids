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
import { areMeshing, distance } from './graph';
import { simulate } from './simulate';
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

// ==================== BUILD MODE — ƯỚC LƯỢNG SỐ LINH KIỆN ====================
// Để ngân sách "đủ chặt" tạo thử thách mà KHÔNG bao giờ vô nghiệm, ta dựng sẵn
// một lời giải tham lam (ưu tiên bánh LỚN cho ít linh kiện, qua sông bằng 1 dây
// đai), kiểm chứng bằng simulate, rồi lấy số linh kiện đó làm "mức tối thiểu".

const PLAYER_TEETH = [16, 12, 8] as const; // cỡ người chơi có — thử LỚN trước

/** Giao điểm hai đường tròn (tâm c1 bán kính r1) và (tâm c2 bán kính r2). */
const circleIntersect = (
    c1: { x: number; y: number },
    r1: number,
    c2: { x: number; y: number },
    r2: number
): Array<{ x: number; y: number }> => {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.hypot(dx, dy);
    if (d === 0 || d > r1 + r2 || d < Math.abs(r1 - r2)) return [];
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h2 = r1 * r1 - a * a;
    if (h2 < 0) return [];
    const h = Math.sqrt(h2);
    const xm = c1.x + (a * dx) / d;
    const ym = c1.y + (a * dy) / d;
    const ox = (-dy * h) / d;
    const oy = (dx * h) / d;
    return [
        { x: xm + ox, y: ym + oy },
        { x: xm - ox, y: ym - oy },
    ];
};

/** Bánh `g` phải CÁCH XA mọi bánh KHÔNG nằm trong `allowed` — xa hơn cả dải ăn
 *  khớp (để không "dính răng" ngoài ý muốn ⇒ tránh vòng lẻ gây KẸT). */
const clearOfOthers = (g: GearSpec, gears: GearSpec[], allowed: Set<string>): boolean => {
    for (const o of gears) {
        if (o.id === g.id || allowed.has(o.id)) continue;
        const ideal = g.radius + o.radius;
        const tol = Math.max(MESH_TOL_MIN, ideal * MESH_TOL_RATIO);
        if (distance(g, o) < ideal + tol + PLACE_GAP) return false;
    }
    return true;
};

/** Một bánh răng (ưu tiên LỚN) ăn khớp `prev`, hướng về (tx,ty). null nếu bí. */
const stepGear = (prev: GearSpec, tx: number, ty: number, gears: GearSpec[], zones: WaterZone[], id: string): GearSpec | null => {
    const baseAngle = Math.atan2(ty - prev.y, tx - prev.x);
    const allowed = new Set([prev.id]);
    for (const teeth of PLAYER_TEETH) {
        const radius = teethToRadius(teeth);
        const meshDist = prev.radius + radius;
        for (let a = 0; a < 25; a++) {
            const angle = baseAngle + (a % 2 === 0 ? 1 : -1) * Math.ceil(a / 2) * 0.12;
            const x = prev.x + meshDist * Math.cos(angle);
            const y = prev.y + meshDist * Math.sin(angle);
            if (!isValidPos(x, y, radius, gears, prev.id, zones)) continue;
            const g: GearSpec = { id, role: 'gear', fixed: false, teeth, radius, x, y };
            if (clearOfOthers(g, gears, allowed)) return g;
        }
    }
    return null;
};

/** Bánh răng ăn khớp ĐỒNG THỜI `from` và `goal` (cố định) — nối kín chuỗi. */
const bridgeGear = (from: GearSpec, goal: GearSpec, gears: GearSpec[], zones: WaterZone[], id: string): GearSpec | null => {
    const allowed = new Set([from.id, goal.id]);
    for (const teeth of PLAYER_TEETH) {
        const radius = teethToRadius(teeth);
        for (const p of circleIntersect(from, from.radius + radius, goal, goal.radius + radius)) {
            if (!inBounds(p.x, p.y, radius) || inWater(p.x, p.y, radius, zones)) continue;
            const g: GearSpec = { id, role: 'gear', fixed: false, teeth, radius, x: p.x, y: p.y };
            if (clearOfOthers(g, gears, allowed)) return g;
        }
    }
    return null;
};

/** Chuỗi ăn khớp từ `start` cho tới khi nối được `goal` (cố định). null nếu bí. */
const chainTo = (start: GearSpec, goal: GearSpec, base: GearSpec[], zones: WaterZone[], idp: string): GearSpec[] | null => {
    const placed: GearSpec[] = [];
    let cur = start;
    for (let i = 0; i < 10; i++) {
        if (areMeshing(cur, goal)) return placed;
        const bridge = bridgeGear(cur, goal, [...base, ...placed], zones, `${idp}b${i}`);
        if (bridge) { placed.push(bridge); return placed; }
        const next = stepGear(cur, goal.x, goal.y, [...base, ...placed], zones, `${idp}${i}`);
        if (!next) return null;
        placed.push(next);
        cur = next;
    }
    return areMeshing(cur, goal) ? placed : null;
};

/** Lời giải tham khảo: bánh răng + dây đai tối thiểu để nối Nguồn→Đích. */
export const estimateBuildSolution = (
    motor: GearSpec,
    target: GearSpec,
    zones: WaterZone[],
    maxBeltLength: number
): { gears: GearSpec[]; belts: BeltSpec[] } | null => {
    if (zones.length === 0) {
        const chain = chainTo(motor, target, [motor, target], zones, 'g');
        return chain ? { gears: chain, belts: [] } : null;
    }
    const river = zones[0];
    const maxR = teethToRadius(16);
    // 1) Chuỗi TRÁI: từ motor tiến NGANG về sát bờ trái sông.
    const bankStopX = river.x - (maxR + 8);
    const leftGears: GearSpec[] = [];
    let cur = motor;
    for (let i = 0; i < 8 && cur.x < bankStopX; i++) {
        const g = stepGear(cur, river.x, motor.y, [motor, target, ...leftGears], zones, `l${i}`);
        if (!g) break;
        leftGears.push(g);
        cur = g;
    }
    const beltL = cur;
    // 2) Mỏ neo PHẢI: ngay ĐỐI DIỆN beltL bên kia sông ⇒ đai NGANG, ngắn,
    //    chỉ vừa đủ bắc qua sông (không thừa để vượt bãi trống).
    let beltR: GearSpec | null = null;
    for (const teeth of PLAYER_TEETH) {
        const radius = teethToRadius(teeth);
        const x = river.x + river.width + radius + 6;
        for (let dy = 0; dy <= 140 && !beltR; dy += 14) {
            for (const sgn of dy === 0 ? [0] : [1, -1]) {
                const y = clamp(beltL.y + sgn * dy, PLAY.top + radius, PLAY.bottom - radius);
                if (
                    isValidPos(x, y, radius, [motor, target, ...leftGears], null, zones) &&
                    distance(beltL, { x, y }) <= maxBeltLength
                ) {
                    beltR = { id: 'ra', role: 'gear', fixed: false, teeth, radius, x, y };
                    break;
                }
            }
        }
        if (beltR) break;
    }
    if (!beltR) return null;
    // 3) Chuỗi PHẢI: từ mỏ neo phải leo tới đích.
    const rightChain = chainTo(beltR, target, [motor, target, beltR, ...leftGears], zones, 'r');
    if (!rightChain) return null;
    return {
        gears: [...leftGears, beltR, ...rightChain],
        belts: [{ id: 'b0', a: beltL.id, b: beltR.id, kind: 'belt' }],
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

    const waterZones: WaterZone[] = [];
    if (difficulty !== 'easy') {
        const riverX = Math.floor(CANVAS.W * (0.4 + rng() * 0.15));
        waterZones.push({ id: 'river-1', x: riverX, y: PLAY.top, width: 60, height: PLAY.bottom - PLAY.top });
    }

    // Dây đai chỉ vừa đủ BẮC QUA chướng ngại (rộng sông + 2 bánh răng ở 2 bờ),
    // KHÔNG phải đường tắt vượt bãi trống ⇒ người chơi vẫn phải lắp đủ bánh răng.
    const maxRadius = teethToRadius(Math.max(...GEAR_SIZES));
    const widestRiver = waterZones.length ? Math.max(...waterZones.map((z) => z.width)) : 0;
    const maxBeltLength = waterZones.length > 0 ? widestRiver + 2 * maxRadius + 32 : 0;
    // Mỗi địa hình chia cách (sông) cho đúng 1 dây đai.
    const maxBelts = waterZones.length;

    // Đệm theo độ khó: Dễ = tối thiểu +2, Trung bình +1, Khó = đúng tối thiểu.
    const buffer = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;

    // Mặc định an toàn (hiếm khi dùng — chỉ khi không dựng nổi lời giải tham khảo).
    let maxComponents = waterZones.length > 0 ? 8 : 7;
    let targetDirection: 1 | -1 = rng() > 0.5 ? 1 : -1;

    const sol = estimateBuildSolution(motor, target, waterZones, maxBeltLength);
    if (sol) {
        const s = simulate({ gears: [motor, target, ...sol.gears], belts: sol.belts }, { id: 'motor', dir: MOTOR.dir, speed: MOTOR.speed });
        const t = s.runtime.get('target');
        if (t && t.state === 'driven' && !s.jammed) {
            // Chiều đích = chiều lời giải tạo ra ⇒ đảm bảo "đúng chiều" KHẢ THI ở mức tối thiểu.
            targetDirection = t.dir === -1 ? -1 : 1;
            maxComponents = sol.gears.length + sol.belts.length + buffer;
        }
    }

    return {
        id: `build-${seed}`,
        seed,
        difficulty,
        layout: { gears: [motor, target], belts: [] },
        waterZones,
        targetDirection,
        targetMinSpeed: undefined,
        maxComponents,
        maxBelts,
        maxBeltLength,
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
