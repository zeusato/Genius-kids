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

// Helper to get next position based on direction
const getNextPos = (pos: Position, dir: Direction, steps: number = 1): Position => {
    switch (dir) {
        case 'N': return { row: pos.row - steps, col: pos.col };
        case 'S': return { row: pos.row + steps, col: pos.col };
        case 'E': return { row: pos.row, col: pos.col + steps };
        case 'W': return { row: pos.row, col: pos.col - steps };
    }
};

// Helper to check bounds
const isValidPos = (pos: Position, size: number): boolean => {
    return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size;
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

export const generateLevel = (levelId: number, lessonId: number): LevelData => {
    // Configuration based on Level/Lesson
    let gridSize = 6;
    let obstacleCount = 0;
    let minPathLength = 5;
    let allowedCommands: CommandType[] = ['forward'];
    let complexity = 1;
    let useStars = true;
    let useWater = false;
    let useMonsters = false;
    let useGates = false;
    let useBoxes = false;
    let useTraps = false;

    // CUMULATIVE Difficulty Scaling
    if (levelId === 1) {
        // Level 1: Basic forward only
        gridSize = 6;
        allowedCommands = ['forward'];
        minPathLength = lessonId <= 2 ? 5 : 6;

    } else if (levelId === 2) {
        // Level 2: + Turns & Jump & Water
        gridSize = 6;
        allowedCommands = ['forward', 'left', 'right', 'jump'];
        complexity = 2;

        if (lessonId <= 3) {
            minPathLength = 6;
        } else if (lessonId <= 6) {
            minPathLength = 7;
            useWater = true;
        } else {
            minPathLength = 8;
            useWater = true;
        }

    } else if (levelId === 3) {
        // Level 3: + Monsters & Fight
        gridSize = 7;
        allowedCommands = ['forward', 'left', 'right', 'jump', 'fight'];
        complexity = 3;
        useWater = true;
        useMonsters = true;

        minPathLength = lessonId <= 5 ? 8 : 10;
        obstacleCount = lessonId <= 5 ? 2 : 3;

    } else if (levelId === 4) {
        // Level 4: Monsters + Gates & Keys
        gridSize = 8;
        allowedCommands = ['forward', 'left', 'right', 'jump', 'fight'];
        complexity = 4;
        useWater = true;
        useMonsters = true;
        useGates = true;

        minPathLength = lessonId <= 5 ? 10 : 12;
        obstacleCount = 2;

    } else {
        // Level 5: All mechanics + Water-Box puzzle
        gridSize = 8;
        allowedCommands = ['forward', 'left', 'right', 'jump', 'fight', 'push'];
        complexity = 5;
        useWater = true;
        useMonsters = true;
        useGates = true;
        useBoxes = true; // Boxes will fill water to access items
        useTraps = true; // Traps rendered as water with stars

        minPathLength = lessonId <= 5 ? 12 : 14;
        obstacleCount = 2;
    }

    // Initialize Grid
    const grid: CellType[][] = Array.from({ length: gridSize }, () =>
        Array(gridSize).fill('empty')
    );

    // Generate Path
    let startPos: Position = { row: 0, col: 0 };
    let endPos: Position = { row: 0, col: 0 };
    let startDir: Direction = 'E';
    let path: Position[] = [];
    let monsterPositions: Position[] = [];
    let gatePositions: Position[] = [];
    let keyPosition: Position | undefined;
    let boxPositions: Position[] = [];

    let attempts = 0;
    let waterCount = 0; // Track water GLOBALLY
    const maxWaterCells = gridSize === 8 ? 20 : Math.floor(gridSize * gridSize * 0.3); // Max 20 for 8x8

    while (attempts < 100) {
        attempts++;

        // Clear grid for new attempt
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                grid[r][c] = 'empty';
            }
        }
        waterCount = 0; // Reset for this attempt


        const margin = complexity > 1 ? 1 : 0;
        startPos = {
            row: Math.floor(Math.random() * (gridSize - 2 * margin)) + margin,
            col: Math.floor(Math.random() * (gridSize - 2 * margin)) + margin
        };

        const dirs: Direction[] = ['N', 'E', 'S', 'W'];
        startDir = dirs[Math.floor(Math.random() * 4)];

        path = [startPos];
        monsterPositions = [];
        let currentPos = startPos;
        let currentDir = startDir;
        let steps = 0;
        let jumpsUsed = 0;
        let monstersUsed = 0;
        // let waterCount = 0; // Track water cells
        // const maxWaterCells = Math.floor(gridSize * gridSize * 0.3); // 30% limit

        while (steps < minPathLength * 2) {
            let action: 'forward' | 'turn' | 'jump' | 'fight' = 'forward';
            const rand = Math.random();

            if (complexity === 1) {
                action = 'forward';
            } else {
                if (complexity > 1 && rand < 0.3) action = 'turn';
                else if (useWater && rand > 0.8 && waterCount < maxWaterCells) action = 'jump'; // Only check water limit
                else if (useMonsters && rand > 0.6 && rand <= 0.8 && monstersUsed < 2) action = 'fight';
            }

            if (action === 'turn') {
                const turnDir = Math.random() < 0.5 ? 'left' : 'right';
                if (turnDir === 'left') {
                    currentDir = currentDir === 'N' ? 'W' : currentDir === 'W' ? 'S' : currentDir === 'S' ? 'E' : 'N';
                } else {
                    currentDir = currentDir === 'N' ? 'E' : currentDir === 'E' ? 'S' : currentDir === 'S' ? 'W' : 'N';
                }
            } else if (action === 'jump') {
                const landPos = getNextPos(currentPos, currentDir, 2);
                const skipPos = getNextPos(currentPos, currentDir, 1);

                if (isValidPos(landPos, gridSize) && !path.some(p => p.row === landPos.row && p.col === landPos.col)) {
                    currentPos = landPos;
                    path.push(currentPos);
                    steps++;
                    jumpsUsed++;
                    if (grid[skipPos.row][skipPos.col] === 'empty') {
                        grid[skipPos.row][skipPos.col] = 'water';
                        waterCount++;
                    }
                }
            } else if (action === 'fight') {
                const monsterPos = getNextPos(currentPos, currentDir, 1);
                if (isValidPos(monsterPos, gridSize) && !path.some(p => p.row === monsterPos.row && p.col === monsterPos.col)) {
                    monsterPositions.push(monsterPos);
                    currentPos = monsterPos;
                    path.push(currentPos);
                    steps += 2;
                    monstersUsed++;
                }
            } else {
                const next = getNextPos(currentPos, currentDir);
                if (isValidPos(next, gridSize) && !path.some(p => p.row === next.row && p.col === next.col)) {
                    currentPos = next;
                    path.push(currentPos);
                    steps++;
                } else {
                    break;
                }
            }

            if (path.length >= minPathLength && Math.random() > 0.8) break;
        }

        if (path.length >= minPathLength) {
            endPos = path[path.length - 1];
            break;
        }
    }

    // Place Elements
    grid[startPos.row][startPos.col] = 'start';
    grid[endPos.row][endPos.col] = 'end';

    // Ensure water cells meet min/max requirements (for 8x8 grid: 10-20 water cells)
    const minWaterCells = gridSize === 8 ? 10 : Math.floor(gridSize * gridSize * 0.15);
    const maxWaterTarget = gridSize === 8 ? 20 : Math.floor(gridSize * gridSize * 0.3);

    if (useWater && waterCount < minWaterCells) {
        // Add more water cells to reach minimum
        const waterNeeded = minWaterCells - waterCount;
        let waterAdded = 0;

        for (let attempt = 0; attempt < 200 && waterAdded < waterNeeded; attempt++) {
            const r = Math.floor(Math.random() * gridSize);
            const c = Math.floor(Math.random() * gridSize);
            const isOnPath = path.some(p => p.row === r && p.col === c);

            if (!isOnPath && grid[r][c] === 'empty') {
                grid[r][c] = 'water';
                waterAdded++;
                waterCount++;
            }
        }
    }

    // Place Monsters
    monsterPositions.forEach(pos => {
        if (grid[pos.row][pos.col] === 'empty') {
            grid[pos.row][pos.col] = 'monster';
        }
    });

    // Place Key (Level 4+) - Required for end point
    if (useGates) {
        // Place key off-path (required for Level 4+)
        for (let i = 0; i < 100; i++) {
            const kr = Math.floor(Math.random() * gridSize);
            const kc = Math.floor(Math.random() * gridSize);
            const isOnPath = path.some(p => p.row === kr && p.col === kc);
            if (!isOnPath && grid[kr][kc] === 'empty') {
                grid[kr][kc] = 'key';
                keyPosition = { row: kr, col: kc };
                break;
            }
        }

        // Fallback: if key not placed, place on any empty cell
        if (!keyPosition) {
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    const isOnPath = path.some(p => p.row === r && p.col === c);
                    if (!isOnPath && grid[r][c] === 'empty') {
                        grid[r][c] = 'key';
                        keyPosition = { row: r, col: c };
                        break;
                    }
                }
                if (keyPosition) break;
            }
        }
    }

    // Place Boxes and Traps (Level 5)
    // Traps will be rendered as water with stars on top
    let trapStarCount = 0; // Track stars on traps
    if (useBoxes && useTraps) {
        const trapCount = 1 + Math.floor(Math.random() * 2); // 1 or 2 traps
        for (let i = 0; i < trapCount; i++) {
            for (let j = 0; j < 100; j++) { // Increased attempts
                const tr = Math.floor(Math.random() * gridSize);
                const tc = Math.floor(Math.random() * gridSize);
                if (grid[tr][tc] === 'empty' && !path.some(p => p.row === tr && p.col === tc)) {
                    // Try each direction for box placement
                    // Need: trap -> box -> empty space (for robot to push)
                    const directions = [
                        { dr: -1, dc: 0 }, // North
                        { dr: 1, dc: 0 },  // South
                        { dr: 0, dc: -1 }, // West
                        { dr: 0, dc: 1 }   // East
                    ];

                    // Shuffle directions
                    for (let k = directions.length - 1; k > 0; k--) {
                        const rand = Math.floor(Math.random() * (k + 1));
                        [directions[k], directions[rand]] = [directions[rand], directions[k]];
                    }

                    let boxPlaced = false;
                    for (const dir of directions) {
                        const boxRow = tr + dir.dr;
                        const boxCol = tc + dir.dc;
                        const robotRow = tr + dir.dr * 2; // Robot position (behind box)
                        const robotCol = tc + dir.dc * 2;

                        const isBoxOnPath = path.some(p => p.row === boxRow && p.col === boxCol);
                        const isRobotOnPath = path.some(p => p.row === robotRow && p.col === robotCol);

                        // Check all 3 positions: trap (already checked), box, robot space
                        if (isValidPos({ row: boxRow, col: boxCol }, gridSize) &&
                            isValidPos({ row: robotRow, col: robotCol }, gridSize) &&
                            !isBoxOnPath && !isRobotOnPath &&  // ADD THIS LINE
                            grid[boxRow][boxCol] === 'empty' &&
                            grid[robotRow][robotCol] === 'empty') {

                            // Place trap and box
                            grid[tr][tc] = 'trap';
                            grid[boxRow][boxCol] = 'box';
                            boxPositions.push({ row: boxRow, col: boxCol });
                            trapStarCount++;
                            boxPlaced = true;
                            break;
                        }
                    }

                    if (boxPlaced) break; // Successfully placed this trap-box pair
                }
            }
        }
    }

    // Place Stars - ENSURE exactly 3 stars
    let requiredStars = 0;
    if (useStars && path.length > 3) {
        // Get all valid path positions (exclude start and end)
        const validPathIndices = [];
        for (let i = 1; i < path.length - 1; i++) {
            const pos = path[i];
            const cell = grid[pos.row][pos.col];
            // Can place star on empty cells or overwrite them
            if (cell === 'empty') {
                validPathIndices.push(i);
            }
        }

        // Shuffle and pick positions
        for (let i = validPathIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [validPathIndices[i], validPathIndices[j]] = [validPathIndices[j], validPathIndices[i]];
        }

        // Place stars on path (total stars = 3, minus stars already on traps)
        const starsToPlace = Math.min(3 - trapStarCount, validPathIndices.length);
        for (let i = 0; i < starsToPlace; i++) {
            const pos = path[validPathIndices[i]];
            grid[pos.row][pos.col] = 'star';
            requiredStars++;
        }
    }

    // Add trap stars to required stars count
    requiredStars += trapStarCount;

    // Protect robot push positions - ensure they stay empty
    boxPositions.forEach(box => {
        // Find which trap this box belongs to
        const directions = [
            { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
        ];

        for (const dir of directions) {
            const trapR = box.row - dir.dr;
            const trapC = box.col - dir.dc;
            const robotR = box.row + dir.dr;
            const robotC = box.col + dir.dc;

            if (isValidPos({ row: trapR, col: trapC }, gridSize) &&
                isValidPos({ row: robotR, col: robotC }, gridSize) &&
                grid[trapR][trapC] === 'trap') {
                // Found the trap-box pair, ensure robot space is empty
                if (grid[robotR][robotC] !== 'empty' &&
                    grid[robotR][robotC] !== 'start' &&
                    grid[robotR][robotC] !== 'end') {
                    grid[robotR][robotC] = 'empty';
                }
                break;
            }
        }
    });

    // Place Obstacles (Walls)
    if (complexity >= 2) {
        let placed = 0;
        let safety = 0;
        while (placed < obstacleCount && safety < 200) {
            safety++;
            const r = Math.floor(Math.random() * gridSize);
            const c = Math.floor(Math.random() * gridSize);

            const onPath = path.some(p => p.row === r && p.col === c);
            if (!onPath && grid[r][c] === 'empty') {
                grid[r][c] = 'wall';
                placed++;
            }
        }
    }

    return {
        id: `${levelId}-${lessonId}-${Date.now()}`,
        grid,
        startPos,
        endPos,
        startDir,
        optimalSteps: path.length - 1 + monsterPositions.length,
        allowedCommands,
        gridSize,
        requiredStars,
        gatePositions: gatePositions.length > 0 ? gatePositions : undefined,
        keyPosition,
        boxPositions: boxPositions.length > 0 ? boxPositions : undefined
    };
};
