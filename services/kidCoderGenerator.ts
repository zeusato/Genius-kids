/**
 * Generator map cho Kid Coder - sinh map từ lời giải (solution-first):
 *
 * 1. Sinh đường đi mẫu dưới dạng CHUỖI LỆNH thật (forward/left/right/jump/fight)
 *    bằng random walk có trọng số => biết chính xác số lệnh của lời giải thiết kế.
 * 2. Level 4-5: chìa khóa và cổng đặt NGAY TRÊN đường đi (key trước, gate sau)
 *    => chắc chắn với tới được theo cấu trúc, không cần cầu may.
 * 3. Level 5: ô robot đứng để đẩy hộp nằm TRÊN đường đi => sao trên bẫy luôn lấy được.
 * 4. Trang trí (nước, tường) chỉ đặt NGOÀI đường đi => không bao giờ phá lời giải.
 * 5. Lọc chất lượng bằng solver BFS theo đúng luật engine: loại map có đường tắt
 *    (lời giải thực < 75% lời giải thiết kế). optimalSteps trả về = lời giải tối ưu THẬT.
 */

export type Direction = 'N' | 'E' | 'S' | 'W';
export type CellType = 'empty' | 'wall' | 'water' | 'start' | 'end' | 'star' | 'monster' | 'gate' | 'key' | 'box' | 'trap' | 'waterstar';
export type CommandType = 'forward' | 'left' | 'right' | 'jump' | 'loop' | 'fight' | 'push';

export interface Position {
    row: number;
    col: number;
}

export interface LevelData {
    id: string;
    grid: CellType[][];
    startPos: Position;
    endPos: Position;
    startDir: Direction;
    optimalSteps: number;
    allowedCommands: CommandType[];
    gridSize: number;
    requiredStars: number;
    gatePositions?: Position[];
    keyPosition?: Position;
    boxPositions?: Position[];
}

const DIR_VECTORS: Record<Direction, { dr: number; dc: number }> = {
    N: { dr: -1, dc: 0 },
    E: { dr: 0, dc: 1 },
    S: { dr: 1, dc: 0 },
    W: { dr: 0, dc: -1 }
};
const DIR_INDEX: Record<Direction, number> = { N: 0, E: 1, S: 2, W: 3 };
const TURN_LEFT: Record<Direction, Direction> = { N: 'W', W: 'S', S: 'E', E: 'N' };
const TURN_RIGHT: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' };
const ALL_DIRS: Direction[] = ['N', 'E', 'S', 'W'];

const getNextPos = (pos: Position, dir: Direction, steps: number = 1): Position => ({
    row: pos.row + DIR_VECTORS[dir].dr * steps,
    col: pos.col + DIR_VECTORS[dir].dc * steps
});

const isValidPos = (pos: Position, size: number): boolean => {
    return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size;
};

const posKey = (p: Position) => `${p.row}-${p.col}`;

const randInt = (n: number) => Math.floor(Math.random() * n);

const pick = <T>(arr: T[]): T => arr[randInt(arr.length)];

const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = randInt(i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

export const CURRICULUM = [
    {
        id: 1,
        title: 'Tập sự (Novice)',
        description: 'Làm quen với các lệnh cơ bản',
        lessons: 5,
        color: 'bg-blue-500'
    },
    {
        id: 2,
        title: 'Thám hiểm (Explorer)',
        description: 'Học cách rẽ trái và phải',
        lessons: 10,
        color: 'bg-green-500'
    },
    {
        id: 3,
        title: 'Thử thách (Challenger)',
        description: 'Chiến đấu với quái vật',
        lessons: 10,
        color: 'bg-purple-500'
    },
    {
        id: 4,
        title: 'Giải đố (Puzzle Master)',
        description: 'Tìm khóa mở cửa',
        lessons: 10,
        color: 'bg-orange-500'
    },
    {
        id: 5,
        title: 'Kỹ sư (Engineer)',
        description: 'Đẩy hộp lấp bẫy',
        lessons: 10,
        color: 'bg-red-500'
    }
];

interface LevelConfig {
    gridSize: number;
    allowedCommands: CommandType[];
    targetCommands: number; // độ dài chương trình mẫu (tính CẢ lệnh rẽ và fight)
    turnWeight: number;
    jumpWeight: number;
    maxMonsters: number;
    obstacleCount: number;
    ambientWater: number; // nước trang trí ngoài đường đi
    useKeyGate: boolean;
    trapBoxPairs: number;
    startMargin: number;
}

const getConfig = (levelId: number, lessonId: number): LevelConfig => {
    if (levelId === 1) {
        // Level 1: chỉ đi thẳng
        return {
            gridSize: 6,
            allowedCommands: ['forward'],
            targetCommands: lessonId <= 2 ? 5 : 6,
            turnWeight: 0, jumpWeight: 0, maxMonsters: 0,
            obstacleCount: 0, ambientWater: 0,
            useKeyGate: false, trapBoxPairs: 0, startMargin: 0
        };
    }
    if (levelId === 2) {
        // Level 2: + rẽ, nhảy qua nước
        return {
            gridSize: 6,
            allowedCommands: ['forward', 'left', 'right', 'jump'],
            targetCommands: lessonId <= 3 ? 8 : lessonId <= 6 ? 10 : 12,
            turnWeight: 1.5,
            jumpWeight: lessonId <= 3 ? 0 : 1.2,
            maxMonsters: 0,
            obstacleCount: lessonId <= 3 ? 1 : 2,
            ambientWater: lessonId <= 3 ? 0 : 3,
            useKeyGate: false, trapBoxPairs: 0, startMargin: 1
        };
    }
    if (levelId === 3) {
        // Level 3: + quái vật
        return {
            gridSize: 7,
            allowedCommands: ['forward', 'left', 'right', 'jump', 'fight'],
            targetCommands: lessonId <= 5 ? 12 : 15,
            turnWeight: 1.5, jumpWeight: 1.2,
            maxMonsters: lessonId <= 5 ? 2 : 3,
            obstacleCount: lessonId <= 5 ? 2 : 3,
            ambientWater: lessonId <= 5 ? 3 : 4,
            useKeyGate: false, trapBoxPairs: 0, startMargin: 1
        };
    }
    if (levelId === 4) {
        // Level 4: + chìa khóa và cổng
        return {
            gridSize: 8,
            allowedCommands: ['forward', 'left', 'right', 'jump', 'fight'],
            targetCommands: lessonId <= 5 ? 15 : 18,
            turnWeight: 1.5, jumpWeight: 1.2,
            maxMonsters: 2,
            obstacleCount: 2,
            ambientWater: 5,
            useKeyGate: true, trapBoxPairs: 0, startMargin: 1
        };
    }
    // Level 5+: tất cả cơ chế + đẩy hộp lấp bẫy
    return {
        gridSize: 8,
        allowedCommands: ['forward', 'left', 'right', 'jump', 'fight', 'push'],
        targetCommands: lessonId <= 5 ? 16 : 20,
        turnWeight: 1.5, jumpWeight: 1.2,
        maxMonsters: 2,
        obstacleCount: 2,
        ambientWater: 5,
        useKeyGate: true,
        trapBoxPairs: lessonId <= 5 ? 1 : 2,
        startMargin: 1
    };
};

interface PathPlan {
    cells: Position[]; // các ô robot đứng, theo thứ tự (cells[0] = start)
    commands: CommandType[]; // chương trình mẫu giải được map
    waterCells: Position[]; // ô nước do lệnh nhảy tạo ra (nằm giữa 2 ô path)
    monsterKeys: Set<string>; // ô có quái (nằm trên path)
    startDir: Direction;
}

/**
 * Random walk có trọng số, trả về đường đi kèm chuỗi lệnh mẫu.
 * Mỗi "nước đi" đều làm robot tiến lên 1 ô mới => không có chuỗi xoay tại chỗ vô nghĩa.
 */
const buildPath = (cfg: LevelConfig): PathPlan | null => {
    const size = cfg.gridSize;
    const canTurn = cfg.allowedCommands.includes('left');
    const canJump = cfg.jumpWeight > 0 && cfg.allowedCommands.includes('jump');
    const canFight = cfg.maxMonsters > 0 && cfg.allowedCommands.includes('fight');

    const startDir = pick(ALL_DIRS);

    // Level chỉ có forward: chọn vị trí xuất phát sao cho đường thẳng vừa khít
    if (!canTurn) {
        const len = cfg.targetCommands;
        if (len >= size) return null;
        const v = DIR_VECTORS[startDir];
        const start: Position = {
            row: v.dr === 0 ? randInt(size) : v.dr > 0 ? randInt(size - len) : len + randInt(size - len),
            col: v.dc === 0 ? randInt(size) : v.dc > 0 ? randInt(size - len) : len + randInt(size - len)
        };
        const cells: Position[] = [start];
        const commands: CommandType[] = [];
        for (let i = 0; i < len; i++) {
            cells.push(getNextPos(start, startDir, i + 1));
            commands.push('forward');
        }
        return { cells, commands, waterCells: [], monsterKeys: new Set(), startDir };
    }

    const m = cfg.startMargin;
    const start: Position = {
        row: randInt(size - 2 * m) + m,
        col: randInt(size - 2 * m) + m
    };

    const visited = new Set<string>([posKey(start)]);
    const reserved = new Set<string>(); // ô nước của lệnh nhảy - đường đi không được chạm vào
    const cells: Position[] = [start];
    const commands: CommandType[] = [];
    const waterCells: Position[] = [];
    const monsterKeys = new Set<string>();

    let pos = start;
    let dir = startDir;
    let monsters = 0;

    const free = (p: Position) => isValidPos(p, size) && !visited.has(posKey(p)) && !reserved.has(posKey(p));

    while (commands.length < cfg.targetCommands) {
        type Move = { weight: number; apply: () => void };
        const moves: Move[] = [];

        const fwd = getNextPos(pos, dir);
        if (free(fwd)) {
            moves.push({
                weight: 4,
                apply: () => {
                    commands.push('forward');
                    visited.add(posKey(fwd));
                    cells.push(fwd);
                    pos = fwd;
                }
            });
        }

        for (const [cmd, nd] of [['left', TURN_LEFT[dir]], ['right', TURN_RIGHT[dir]]] as [CommandType, Direction][]) {
            const np = getNextPos(pos, nd);
            if (free(np)) {
                moves.push({
                    weight: cfg.turnWeight,
                    apply: () => {
                        commands.push(cmd, 'forward');
                        dir = nd;
                        visited.add(posKey(np));
                        cells.push(np);
                        pos = np;
                    }
                });
            }
        }

        if (canJump) {
            const mid = getNextPos(pos, dir);
            const land = getNextPos(pos, dir, 2);
            if (free(mid) && free(land)) {
                moves.push({
                    weight: cfg.jumpWeight,
                    apply: () => {
                        commands.push('jump');
                        reserved.add(posKey(mid));
                        waterCells.push(mid);
                        visited.add(posKey(land));
                        cells.push(land);
                        pos = land;
                    }
                });
            }
        }

        // fight tốn 2 lệnh; không cho làm nước đi cuối để quái không trùng ô đích
        if (canFight && monsters < cfg.maxMonsters && commands.length + 2 < cfg.targetCommands) {
            const np = getNextPos(pos, dir);
            if (free(np)) {
                moves.push({
                    weight: 0.8,
                    apply: () => {
                        commands.push('fight', 'forward');
                        monsterKeys.add(posKey(np));
                        monsters++;
                        visited.add(posKey(np));
                        cells.push(np);
                        pos = np;
                    }
                });
            }
        }

        if (moves.length === 0) return null; // đi vào ngõ cụt - thử lại map khác

        let r = Math.random() * moves.reduce((s, mv) => s + mv.weight, 0);
        for (const mv of moves) {
            r -= mv.weight;
            if (r <= 0) {
                mv.apply();
                break;
            }
        }
    }

    return { cells, commands, waterCells, monsterKeys, startDir };
};

/**
 * Solver BFS/Dijkstra theo ĐÚNG luật engine (KidCoderGame.tsx):
 * - forward/rẽ/nhảy: 1 lệnh; vào ô quái = fight + forward = 2 lệnh
 * - nhảy: ô giữa không được là tường/quái/hộp/cổng khóa; chỉ check ô đáp như forward
 * - cổng chặn khi chưa có chìa khóa; nhặt khóa khi bước/đáp vào ô khóa
 * - thắng: đứng ở ô đích và đã có khóa (nếu map có khóa)
 * Trả về số lệnh tối thiểu, Infinity nếu vô nghiệm.
 */
export const solveLevel = (level: LevelData): number => {
    const { grid, gridSize, startPos, endPos, startDir, keyPosition, allowedCommands } = level;
    const boxSet = new Set((level.boxPositions || []).map(posKey));
    const canTurn = allowedCommands.includes('left');
    const canJump = allowedCommands.includes('jump');
    const canFight = allowedCommands.includes('fight');
    const needKey = !!keyPosition;

    const stateId = (r: number, c: number, d: Direction, k: boolean) =>
        ((r * gridSize + c) * 4 + DIR_INDEX[d]) * 2 + (k ? 1 : 0);

    const dist = new Array(gridSize * gridSize * 8).fill(Infinity);
    // Dijkstra bằng bucket queue (trọng số cạnh chỉ 1 hoặc 2)
    const buckets: [number, number, Direction, boolean][][] = [];
    const enqueue = (cost: number, r: number, c: number, d: Direction, k: boolean) => {
        const id = stateId(r, c, d, k);
        if (cost >= dist[id]) return;
        dist[id] = cost;
        (buckets[cost] = buckets[cost] || []).push([r, c, d, k]);
    };

    const startHasKey = needKey && startPos.row === keyPosition!.row && startPos.col === keyPosition!.col;
    enqueue(0, startPos.row, startPos.col, startDir, startHasKey);

    const maxCost = gridSize * gridSize * 8 * 2;
    for (let cost = 0; cost <= maxCost; cost++) {
        const bucket = buckets[cost];
        if (!bucket) continue;
        for (const [r, c, d, hasKey] of bucket) {
            if (dist[stateId(r, c, d, hasKey)] !== cost) continue;

            if (r === endPos.row && c === endPos.col && (!needKey || hasKey)) return cost;

            const tryEnter = (nr: number, nc: number, nd: Direction, ncost: number) => {
                const nKey = hasKey || (needKey && nr === keyPosition!.row && nc === keyPosition!.col);
                enqueue(ncost, nr, nc, nd, nKey);
            };

            if (canTurn) {
                enqueue(cost + 1, r, c, TURN_LEFT[d], hasKey);
                enqueue(cost + 1, r, c, TURN_RIGHT[d], hasKey);
            }

            const v = DIR_VECTORS[d];

            // ô có thể bước/đáp vào (không tính quái - xử lý riêng)
            const isOpen = (nr: number, nc: number) => {
                if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return false;
                const cell = grid[nr][nc];
                if (cell === 'wall' || cell === 'water' || cell === 'trap' || cell === 'monster') return false;
                if (cell === 'gate' && !hasKey) return false;
                if (boxSet.has(`${nr}-${nc}`)) return false;
                return true;
            };

            const fr = r + v.dr, fc = c + v.dc;
            if (fr >= 0 && fr < gridSize && fc >= 0 && fc < gridSize) {
                if (grid[fr][fc] === 'monster' && canFight && !boxSet.has(`${fr}-${fc}`)) {
                    tryEnter(fr, fc, d, cost + 2); // fight + forward
                } else if (isOpen(fr, fc)) {
                    tryEnter(fr, fc, d, cost + 1);
                }
            }

            if (canJump) {
                const mr = r + v.dr, mc = c + v.dc;
                const jr = r + v.dr * 2, jc = c + v.dc * 2;
                if (mr >= 0 && mr < gridSize && mc >= 0 && mc < gridSize) {
                    const midCell = grid[mr][mc];
                    const midBlocked =
                        midCell === 'wall' ||
                        midCell === 'monster' ||
                        (midCell === 'gate' && !hasKey) ||
                        boxSet.has(`${mr}-${mc}`);
                    if (!midBlocked && isOpen(jr, jc)) {
                        tryEnter(jr, jc, d, cost + 1);
                    }
                }
            }
        }
    }
    return Infinity;
};

interface Candidate {
    level: LevelData;
    intended: number; // số lệnh của lời giải thiết kế
}

// Đích phải cách start tối thiểu (Manhattan) để map không trông "rẻ tiền"
const MIN_END_DISTANCE = 3;

const tryGenerate = (cfg: LevelConfig, levelId: number, lessonId: number): Candidate | null => {
    const plan = buildPath(cfg);
    if (!plan) return null;

    const size = cfg.gridSize;
    const { cells, commands, waterCells, monsterKeys } = plan;
    const pathSet = new Set(cells.map(posKey));

    if (cfg.turnWeight > 0) {
        const a = cells[0], b = cells[cells.length - 1];
        if (Math.abs(a.row - b.row) + Math.abs(a.col - b.col) < MIN_END_DISTANCE) return null;
    }

    const grid: CellType[][] = Array.from({ length: size }, () => Array<CellType>(size).fill('empty'));
    waterCells.forEach(p => { grid[p.row][p.col] = 'water'; });
    monsterKeys.forEach(k => {
        const [r, c] = k.split('-').map(Number);
        grid[r][c] = 'monster';
    });

    const startPos = cells[0];
    const endPos = cells[cells.length - 1];

    // Các ô path "trơn" (không phải start/end/quái) để đặt khóa/cổng/sao/điểm đẩy
    let plainIdx = cells
        .map((_, i) => i)
        .filter(i => i > 0 && i < cells.length - 1 && grid[cells[i].row][cells[i].col] === 'empty');

    // Khóa + cổng: cả hai nằm TRÊN đường đi, khóa trước cổng
    let keyPosition: Position | undefined;
    let gatePositions: Position[] = [];
    if (cfg.useKeyGate) {
        const n = cells.length;
        const keyCandidates = plainIdx.filter(i => i >= n * 0.25 && i <= n * 0.6);
        if (keyCandidates.length === 0) return null;
        const ki = pick(keyCandidates);
        const gateCandidates = plainIdx.filter(i => i >= ki + 2 && i >= n * 0.55);
        if (gateCandidates.length === 0) return null;
        const gi = pick(gateCandidates);

        keyPosition = cells[ki];
        grid[keyPosition.row][keyPosition.col] = 'key';
        gatePositions = [cells[gi]];
        grid[cells[gi].row][cells[gi].col] = 'gate';
        plainIdx = plainIdx.filter(i => i !== ki && i !== gi);
    }

    // Bẫy + hộp (Level 5): ô robot đứng đẩy nằm TRÊN path => luôn tới được.
    // Bố cục: [ô đẩy P trên path] -> [hộp B] -> [bẫy T], B và T ngoài path.
    const boxPositions: Position[] = [];
    let trapStars = 0;
    if (cfg.trapBoxPairs > 0) {
        for (const i of shuffle(plainIdx)) {
            if (trapStars >= cfg.trapBoxPairs) break;
            const p = cells[i];
            for (const d of shuffle(ALL_DIRS)) {
                const b = getNextPos(p, d);
                const t = getNextPos(p, d, 2);
                if (
                    isValidPos(t, size) &&
                    grid[b.row][b.col] === 'empty' && !pathSet.has(posKey(b)) &&
                    grid[t.row][t.col] === 'empty' && !pathSet.has(posKey(t))
                ) {
                    grid[b.row][b.col] = 'box';
                    boxPositions.push(b);
                    grid[t.row][t.col] = 'trap';
                    trapStars++;
                    break;
                }
            }
        }
        if (trapStars < cfg.trapBoxPairs && trapStars === 0) return null; // không đặt nổi cặp nào - thử map khác
    }

    // Sao: tổng 3 sao (sao trên bẫy tính vào), còn lại đặt trên path
    let requiredStars = trapStars;
    const starSlots = shuffle(plainIdx.filter(i => grid[cells[i].row][cells[i].col] === 'empty'));
    const starsToPlace = Math.min(3 - trapStars, starSlots.length);
    for (let s = 0; s < starsToPlace; s++) {
        const p = cells[starSlots[s]];
        grid[p.row][p.col] = 'star';
        requiredStars++;
    }

    // Trang trí ngoài đường đi: tường + nước. Chỉ đặt trên ô trống ngoài path
    // => không bao giờ phá lời giải mẫu, chỉ có thể làm map KHÓ hơn (chặn đường tắt).
    const placeDecoration = (count: number, cell: CellType) => {
        let placed = 0;
        for (let i = 0; i < count * 40 && placed < count; i++) {
            const r = randInt(size), c = randInt(size);
            if (grid[r][c] === 'empty' && !pathSet.has(`${r}-${c}`)) {
                grid[r][c] = cell;
                placed++;
            }
        }
    };
    placeDecoration(cfg.obstacleCount, 'wall');
    placeDecoration(cfg.ambientWater, 'water');

    grid[startPos.row][startPos.col] = 'start';
    grid[endPos.row][endPos.col] = 'end';

    const level: LevelData = {
        id: `${levelId}-${lessonId}-${Date.now()}`,
        grid,
        startPos,
        endPos,
        startDir: plan.startDir,
        optimalSteps: commands.length, // sẽ thay bằng lời giải tối ưu thật sau khi solve
        allowedCommands: cfg.allowedCommands,
        gridSize: size,
        requiredStars,
        gatePositions: gatePositions.length > 0 ? gatePositions : undefined,
        keyPosition,
        boxPositions: boxPositions.length > 0 ? boxPositions : undefined
    };

    return { level, intended: commands.length };
};

// Tỷ lệ chất lượng: lời giải thực phải >= 75% lời giải thiết kế (chặn map có đường tắt)
const QUALITY_RATIO = 0.75;
const MAX_ATTEMPTS = 300;

export const generateLevel = (levelId: number, lessonId: number): LevelData => {
    const cfg = getConfig(levelId, lessonId);

    let best: LevelData | null = null;
    let bestRatio = -1;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const candidate = tryGenerate(cfg, levelId, lessonId);
        if (!candidate) continue;

        const trueOptimal = solveLevel(candidate.level);
        if (!isFinite(trueOptimal)) continue; // không thể xảy ra theo cấu trúc, đề phòng

        candidate.level.optimalSteps = trueOptimal;
        const ratio = trueOptimal / candidate.intended;

        if (ratio >= QUALITY_RATIO) return candidate.level;
        if (ratio > bestRatio) {
            bestRatio = ratio;
            best = candidate.level;
        }
    }

    // Cực hiếm: không map nào đạt chuẩn sau MAX_ATTEMPTS - trả map tốt nhất tìm được
    if (best) return best;

    // Fallback cuối cùng: map đường thẳng đơn giản, không bao giờ fail
    const size = cfg.gridSize;
    const len = Math.min(cfg.targetCommands, size - 1);
    const grid: CellType[][] = Array.from({ length: size }, () => Array<CellType>(size).fill('empty'));
    const row = randInt(size);
    grid[row][0] = 'start';
    grid[row][len] = 'end';
    return {
        id: `${levelId}-${lessonId}-${Date.now()}`,
        grid,
        startPos: { row, col: 0 },
        endPos: { row, col: len },
        startDir: 'E',
        optimalSteps: len,
        allowedCommands: cfg.allowedCommands,
        gridSize: size,
        requiredStars: 0
    };
};
