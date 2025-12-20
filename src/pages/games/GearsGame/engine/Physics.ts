export interface GearData {
    id: string;
    x: number;
    y: number;
    teeth: number;
    radius: number;
    speed: number;
    direction: 1 | -1 | 0;
    isFixed?: boolean;
}

export interface BeltData {
    id: string;
    sourceId: string;
    targetId: string;
}

// Check if two gears are meshing
export const checkCollision = (g1: GearData, g2: GearData): boolean => {
    const dx = g1.x - g2.x;
    const dy = g1.y - g2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Meshing distance = (r1 + r2). Allow small tolerance.
    // Ideally, Pitch Radius 1 + Pitch Radius 2.
    const idealDist = g1.radius + g2.radius;
    return distance >= idealDist - 8 && distance <= idealDist + 8;
};

// Calculate network speeds
export const calculateNetwork = (gears: GearData[], belts: BeltData[], motorId: string): GearData[] => {
    const gearMap = new Map(gears.map(g => [g.id, { ...g, speed: 0, direction: 0 as 0 | 1 | -1 }]));
    const motor = gearMap.get(motorId);

    if (!motor) return gears; // No motor? No movement.

    // Set motor speed (lower = slower, more visible rotation)
    motor.speed = 8; // Base speed - slower for visual clarity
    motor.direction = 1; // CW

    // BFS to propagate speed
    const queue = [motorId];
    const visited = new Set([motorId]);

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentGear = gearMap.get(currentId)!;

        // 1. Direct Gear Mesh Connections
        for (const neighborId of gearMap.keys()) {
            if (neighborId === currentId) continue;

            const neighbor = gearMap.get(neighborId)!;

            if (checkCollision(currentGear, neighbor)) {
                if (visited.has(neighborId)) {
                    // Conflict Check (Reverse direction)
                    const expectedDir = (currentGear.direction * -1) as 0 | 1 | -1;
                    if (neighbor.direction !== expectedDir) {
                        console.warn("Jam detected at gear mesh", currentId, neighborId);
                        return gears.map(g => ({ ...g, speed: 0, direction: 0 as 0 | 1 | -1 }));
                    }
                } else {
                    // Propagate (Reverse)
                    neighbor.direction = (currentGear.direction * -1) as 0 | 1 | -1;
                    neighbor.speed = currentGear.speed * (currentGear.teeth / neighbor.teeth);

                    visited.add(neighborId);
                    queue.push(neighborId);
                }
            }
        }

        // 2. Belt Connections
        // Find belts connected to this gear
        const attachedBelts = belts.filter(b => b.sourceId === currentId || b.targetId === currentId);

        for (const belt of attachedBelts) {
            const partnerId = belt.sourceId === currentId ? belt.targetId : belt.sourceId;
            const partner = gearMap.get(partnerId);

            if (partner) {
                if (visited.has(partnerId)) {
                    // Conflict Check (Same direction for open belt)
                    if (partner.direction !== currentGear.direction) {
                        console.warn("Jam detected at belt", currentId, partnerId);
                        return gears.map(g => ({ ...g, speed: 0, direction: 0 as 0 | 1 | -1 }));
                    }
                } else {
                    // Propagate (Same)
                    partner.direction = currentGear.direction;
                    // Ratio applies same as gears (Radius ~ Teeth)
                    partner.speed = currentGear.speed * (currentGear.teeth / partner.teeth);

                    visited.add(partnerId);
                    queue.push(partnerId);
                }
            }
        }
    }

    return Array.from(gearMap.values());
};

// Resolve collision by pushing gears apart
export const resolveCollision = (
    movedGear: GearData,
    allGears: GearData[],
    maxIterations: number = 5
): { x: number; y: number } => {
    let { x, y } = movedGear;

    for (let iter = 0; iter < maxIterations; iter++) {
        let collisionFound = false;

        for (const other of allGears) {
            if (other.id === movedGear.id) continue;

            const dx = x - other.x;
            const dy = y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = movedGear.radius + other.radius;

            if (dist < minDist && dist > 0) {
                // Push apart along the line connecting centers
                const angle = Math.atan2(dy, dx);
                const pushDistance = minDist - dist + 2; // +2 for small gap

                x += Math.cos(angle) * pushDistance;
                y += Math.sin(angle) * pushDistance;
                collisionFound = true;
            }
        }

        if (!collisionFound) break;
    }

    return { x, y };
};
