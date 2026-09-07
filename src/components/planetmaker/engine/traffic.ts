import { floorsOf, Region, simulate, SIZE } from './region';
export interface WalkRoute { cells: number[]; phase: number; speed: number }
export function pedestrianRoutes(r: Region, limit = 48): WalkRoute[] {
    const sim = simulate(r), routes: WalkRoute[] = [];
    for (const b of r.buildings) {
        const status = sim.status[b.id];
        if (b.type !== 'home' || !status.connected || status.flooded) continue;
        const start = sim.labels.findIndex(v => v === status.group); if (start < 0) continue;
        for (let person = 0; person < Math.min(4, floorsOf(b) + 1) && routes.length < limit; person++) {
            const cells = [start]; let current = start, previous = -1;
            for (let step = 0; step < 32; step++) {
                const x = current % SIZE, z = Math.floor(current / SIZE);
                const next = [[x - 1, z], [x, z - 1], [x + 1, z], [x, z + 1]].filter(([nx, nz]) => nx >= 0 && nz >= 0 && nx < SIZE && nz < SIZE).map(([nx, nz]) => nz * SIZE + nx).filter(i => sim.labels[i] === status.group);
                if (!next.length) break;
                const forward = next.filter(i => i !== previous), choices = forward.length ? forward : next;
                previous = current; current = choices[(step + person + routes.length) % choices.length]; cells.push(current);
            }
            if (cells.length > 1) routes.push({ cells: [...cells, ...cells.slice(0, -1).reverse()], phase: routes.length * 3.71, speed: .55 + person * .07 });
        }
    }
    return routes;
}
export function routePosition(route: WalkRoute, time: number) {
    const p = (time * route.speed + route.phase) % (route.cells.length - 1), i = Math.floor(p), f = p - i, a = route.cells[i], b = route.cells[i + 1];
    const dx = b % SIZE - a % SIZE, dz = Math.floor(b / SIZE) - Math.floor(a / SIZE);
    // Keep pedestrians inside the road cell; taper the sidewalk offset at corners.
    const offset = Math.sin(f * Math.PI) * .23;
    return { x: a % SIZE + .5 + dx * f + dz * offset, z: Math.floor(a / SIZE) + .5 + dz * f - dx * offset, yaw: Math.atan2(dx, dz) };
}
