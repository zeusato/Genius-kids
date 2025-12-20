import { GearData, BeltData } from './Physics';

export interface WaterZone {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface LevelData {
    id: string;
    difficulty: 'easy' | 'medium' | 'hard';
    motorPosition: { x: number; y: number };
    targetPosition: { x: number; y: number };
    targetDirection: 1 | -1;
    targetMinSpeed?: number;
    maxGears: number;
    maxBelts: number;
    maxBeltLength: number;
    availableGearSizes: number[];
    fixedGears: GearData[];
    waterZones: WaterZone[];
    belts: BeltData[];
}

export interface GuessModeLevel {
    id: string;
    difficulty: 'easy' | 'medium' | 'hard';
    gears: GearData[];
    belts: BeltData[];
    waterZones: WaterZone[];
    gearsToGuess: string[];
    motorId: string;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const TOOLBOX_HEIGHT = 140;
const MIN_GAP = 5;

const dist = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

const rand = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min)) + min;

const isValidPosition = (
    x: number, y: number, radius: number,
    gears: GearData[],
    meshWithId: string | null,
    waterZones: WaterZone[]
): boolean => {
    if (x - radius < 50 || x + radius > CANVAS_WIDTH - 50) return false;
    if (y - radius < 60 || y + radius > CANVAS_HEIGHT - TOOLBOX_HEIGHT - 30) return false;

    for (const zone of waterZones) {
        const closestX = Math.max(zone.x, Math.min(x, zone.x + zone.width));
        const closestY = Math.max(zone.y, Math.min(y, zone.y + zone.height));
        if (dist(x, y, closestX, closestY) < radius + 8) return false;
    }

    for (const g of gears) {
        const d = dist(x, y, g.x, g.y);
        const minDist = radius + g.radius;

        if (g.id === meshWithId) {
            if (d < minDist - 3 || d > minDist + 3) return false;
        } else {
            if (d < minDist + MIN_GAP) return false;
        }
    }

    return true;
};

// Create gear that meshes with prevGear - MUST succeed, tries many angles
const createMeshedGear = (
    prevGear: GearData,
    id: string,
    towardX: number,
    towardY: number,
    gears: GearData[],
    waterZones: WaterZone[],
    isFixed: boolean
): GearData => {
    const radiusOptions = [30, 32, 34, 36, 38];
    const baseAngle = Math.atan2(towardY - prevGear.y, towardX - prevGear.x);

    // Try many combinations of radius and angle
    for (const radius of radiusOptions) {
        const teeth = Math.round(radius / 3);
        const meshDist = prevGear.radius + radius;

        for (let a = 0; a < 30; a++) {
            const angleOffset = (a - 15) * 0.1;
            const angle = baseAngle + angleOffset;

            const x = prevGear.x + meshDist * Math.cos(angle);
            const y = prevGear.y + meshDist * Math.sin(angle);

            if (isValidPosition(x, y, radius, gears, prevGear.id, waterZones)) {
                return { id, x, y, teeth, radius, speed: 0, direction: 0, isFixed };
            }
        }
    }

    // Fallback: just place it at meshing distance (may overlap, but ensures chain)
    const radius = 32;
    const meshDist = prevGear.radius + radius;
    return {
        id,
        x: prevGear.x + meshDist * Math.cos(baseAngle),
        y: prevGear.y + meshDist * Math.sin(baseAngle),
        teeth: 10,
        radius,
        speed: 0,
        direction: 0,
        isFixed
    };
};

// ==================== BUILD MODE ====================
export const generateLevel = (difficulty: 'easy' | 'medium' | 'hard'): LevelData => {
    const playableHeight = CANVAS_HEIGHT - TOOLBOX_HEIGHT - 20;
    const motorPosition = { x: rand(80, 140), y: rand(120, playableHeight - 80) };
    const targetPosition = { x: rand(CANVAS_WIDTH - 140, CANVAS_WIDTH - 80), y: rand(120, playableHeight - 80) };

    let maxGears = 6, maxBelts = 0, maxBeltLength = 300;
    const waterZones: WaterZone[] = [];

    if (difficulty === 'medium' || difficulty === 'hard') {
        const riverX = Math.floor(CANVAS_WIDTH * (0.35 + Math.random() * 0.2));
        waterZones.push({ id: 'river-1', x: riverX, y: 50, width: 60, height: playableHeight - 30 });
        maxBelts = 2;
    }

    return {
        id: `level-${Date.now()}`,
        difficulty,
        motorPosition,
        targetPosition,
        targetDirection: Math.random() > 0.5 ? 1 : -1,
        maxGears,
        maxBelts,
        maxBeltLength,
        availableGearSizes: [8, 12, 16],
        fixedGears: [],
        waterZones,
        belts: [],
    };
};

// ==================== GUESS MODE ====================
export const generateGuessLevel = (difficulty: 'easy' | 'medium' | 'hard'): GuessModeLevel => {
    const playableHeight = CANVAS_HEIGHT - TOOLBOX_HEIGHT - 40;

    const gears: GearData[] = [];
    const belts: BeltData[] = [];
    const waterZones: WaterZone[] = [];
    const gearsToGuess: string[] = ['target'];

    // EXACT gear counts: Easy 5-6, Medium 6-8, Hard 9-11
    const totalGears = difficulty === 'easy' ? rand(5, 7)
        : difficulty === 'medium' ? rand(6, 9)
            : rand(9, 12);

    const motorX = 100;
    const motorY = rand(140, playableHeight - 60);
    const targetX = CANVAS_WIDTH - 100;
    const targetY = rand(140, playableHeight - 60);

    // Motor
    const motor: GearData = {
        id: 'motor', x: motorX, y: motorY,
        teeth: 12, radius: 38, speed: 0, direction: 0, isFixed: true
    };
    gears.push(motor);

    if (difficulty === 'easy') {
        // EASY: Direct chain, no water
        // Total = motor + middleGears + target
        const middleCount = totalGears - 2;
        let current = motor;

        for (let i = 0; i < middleCount; i++) {
            const progress = (i + 1) / (middleCount + 1);
            const tx = motorX + (targetX - motorX) * progress;
            const ty = motorY + (targetY - motorY) * progress + rand(-25, 25);

            const gear = createMeshedGear(current, `g${i}`, tx, ty, gears, waterZones, false);
            gears.push(gear);
            current = gear;
        }

        // Target
        const targetRadius = 38;
        const angle = Math.atan2(targetY - current.y, targetX - current.x);
        gears.push({
            id: 'target',
            x: current.x + (current.radius + targetRadius) * Math.cos(angle),
            y: current.y + (current.radius + targetRadius) * Math.sin(angle),
            teeth: 12, radius: targetRadius, speed: 0, direction: 0, isFixed: true
        });
    } else {
        // MEDIUM/HARD: Water zone with belt
        const riverX = Math.floor(CANVAS_WIDTH * 0.40);
        const riverWidth = 65;
        waterZones.push({ id: 'river-1', x: riverX, y: 50, width: riverWidth, height: playableHeight });

        // Fixed gears to guess (HARD only)
        const numFixedGuess = difficulty === 'hard' ? rand(1, 3) : 0;
        let fixedPlaced = 0;

        // Calculate gear distribution:
        // Total = motor(1) + leftChain + leftAnchor(1) + rightAnchor(1) + rightChain + target(1)
        // So leftChain + rightChain = totalGears - 4
        const chainGears = totalGears - 4;
        const leftChainCount = Math.floor(chainGears / 2);
        const rightChainCount = chainGears - leftChainCount;

        let current = motor;

        // LEFT CHAIN
        for (let i = 0; i < leftChainCount; i++) {
            const tx = motorX + (riverX - 70 - motorX) * ((i + 1) / (leftChainCount + 1));
            const ty = motorY + rand(-20, 20);

            // Last gear in left chain could be fixed (HARD)
            const makeFixed = difficulty === 'hard' && fixedPlaced < numFixedGuess && i === leftChainCount - 1;
            const gear = createMeshedGear(current, makeFixed ? `fixed-${fixedPlaced}` : `l${i}`, tx, ty, gears, waterZones, makeFixed);
            gears.push(gear);
            if (makeFixed) {
                gearsToGuess.push(gear.id);
                fixedPlaced++;
            }
            current = gear;
        }

        // LEFT ANCHOR
        const leftAnchor = createMeshedGear(current, 'anchor-left', riverX - 50, current.y, gears, waterZones, true);
        gears.push(leftAnchor);
        current = leftAnchor;

        // RIGHT ANCHOR (must not be in water or overlap)
        const rightAnchorX = riverX + riverWidth + 50;
        let rightAnchorY = current.y;
        const rightAnchorRadius = 34;

        // Find valid Y
        outer: for (let offset = 0; offset <= 80; offset += 8) {
            for (const dir of [0, 1, -1]) {
                const testY = current.y + dir * offset;
                if (testY < 100 || testY > playableHeight - 60) continue;
                if (isValidPosition(rightAnchorX, testY, rightAnchorRadius, gears, null, waterZones)) {
                    rightAnchorY = testY;
                    break outer;
                }
            }
        }

        const rightAnchor: GearData = {
            id: 'anchor-right', x: rightAnchorX, y: rightAnchorY,
            teeth: 11, radius: rightAnchorRadius, speed: 0, direction: 0, isFixed: true
        };
        gears.push(rightAnchor);
        belts.push({ id: 'belt-1', sourceId: 'anchor-left', targetId: 'anchor-right' });
        current = rightAnchor;

        // RIGHT CHAIN
        for (let i = 0; i < rightChainCount; i++) {
            const tx = current.x + (targetX - current.x) * ((i + 1) / (rightChainCount + 1));
            const ty = current.y + (targetY - current.y) * ((i + 1) / (rightChainCount + 1)) + rand(-15, 15);

            // First gear in right chain could be fixed (HARD)
            const makeFixed = difficulty === 'hard' && fixedPlaced < numFixedGuess && i === 0;
            const gear = createMeshedGear(current, makeFixed ? `fixed-${fixedPlaced}` : `r${i}`, tx, ty, gears, waterZones, makeFixed);
            gears.push(gear);
            if (makeFixed) {
                gearsToGuess.push(gear.id);
                fixedPlaced++;
            }
            current = gear;
        }

        // TARGET
        const targetRadius = 38;
        const angle = Math.atan2(targetY - current.y, targetX - current.x);
        gears.push({
            id: 'target',
            x: current.x + (current.radius + targetRadius) * Math.cos(angle),
            y: current.y + (current.radius + targetRadius) * Math.sin(angle),
            teeth: 12, radius: targetRadius, speed: 0, direction: 0, isFixed: true
        });
    }

    // Verify gear count
    console.log(`Generated ${gears.length} gears for ${difficulty} mode (target: ${totalGears})`);

    return {
        id: `guess-${Date.now()}`,
        difficulty,
        gears,
        belts,
        waterZones,
        gearsToGuess,
        motorId: 'motor',
    };
};

export const isInWaterZone = (x: number, y: number, radius: number, waterZones: WaterZone[]): boolean => {
    for (const zone of waterZones) {
        const closestX = Math.max(zone.x, Math.min(x, zone.x + zone.width));
        const closestY = Math.max(zone.y, Math.min(y, zone.y + zone.height));
        if (dist(x, y, closestX, closestY) < radius + 5) return true;
    }
    return false;
};
