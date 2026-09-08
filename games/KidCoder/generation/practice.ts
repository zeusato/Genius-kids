import { CAMPAIGN } from '../content/campaign';
import { Board, Direction, Mission, Pos, ProgramNode } from '../engine/model';
import { evaluate } from '../engine/runtime';

function rng(seed: number) {
    let state = seed >>> 0;
    return () => { state += 0x6d2b79f5; let t = Math.imul(state ^ state >>> 15, 1 | state); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function transformBoard(board: Board, rotation: number, mirror: boolean): Board {
    const b = structuredClone(board), n = b.size;
    const point = (p: Pos): Pos => {
        let x = mirror ? n - 1 - p.x : p.x, y = p.y;
        for (let i = 0; i < rotation; i++) [x, y] = [n - 1 - y, x];
        return { x, y };
    };
    const tiles = b.tiles.slice();
    b.tiles.forEach((tile, i) => { const p = point({ x: i % n, y: Math.floor(i / n) }); tiles[p.y * n + p.x] = tile; });
    b.tiles = tiles; b.start = point(b.start); b.exit = point(b.exit);
    b.direction = (((mirror ? (4 - b.direction) % 4 : b.direction) + rotation) % 4) as Direction;
    b.samples = b.samples.map(v => ({ ...v, ...point(v) })); b.devices = b.devices.map(v => ({ ...v, ...point(v) }));
    b.gates = b.gates.map(v => ({ ...v, ...point(v) })); b.boxes = b.boxes.map(v => ({ ...v, ...point(v) })); return b;
}
function reflectProgram(nodes: ProgramNode[], mirror: boolean): ProgramNode[] {
    return nodes.map(n => n.type === 'repeat' ? { ...n, body: reflectProgram(n.body, mirror) } : n.type === 'if' ? { ...n, body: reflectProgram(n.body, mirror), otherwise: reflectProgram(n.otherwise, mirror) } :
        { ...n, type: mirror && n.type === 'left' ? 'right' : mirror && n.type === 'right' ? 'left' : n.type });
}
/** Finite template transformation keeps the chapter's concept and a verifiable witness. No unbounded retries. */
export function generatePractice(seed: number, unlockedIds: string[]): Mission {
    const random = rng(seed), pool = CAMPAIGN.filter(m => unlockedIds.includes(m.id));
    const base = pool[Math.floor(random() * pool.length)] || CAMPAIGN[0];
    const rotation = Math.floor(random() * 4), mirror = random() > .5;
    const transformed: Mission = { ...structuredClone(base), practice: true, seed: seed >>> 0, starter: undefined,
        title: `Khảo sát tự do · ${base.title}`, boards: base.boards.map(b => transformBoard(b, rotation, mirror)), solution: reflectProgram(base.solution, mirror),
        hints: [base.hints[0], base.hints[1], 'Đếm ô theo mũi tên của rover. Chạy từng bước và thử lại từng đoạn ngắn.'] };
    if (evaluate(transformed, transformed.solution).success) return transformed;
    return { ...structuredClone(base), practice: true, seed: seed >>> 0, starter: undefined };
}
