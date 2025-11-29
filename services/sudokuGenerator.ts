export type Difficulty = 'easy' | 'medium' | 'hard';

export const generateSudoku = (difficulty: Difficulty) => {
    // 1. Initialize empty 9x9 grid
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

    // 2. Fill diagonal 3x3 boxes (independent) to randomize
    fillDiagonal(grid);

    // 3. Solve to get a complete valid board
    solveSudoku(grid);

    // 4. Clone for solution
    const solvedGrid = grid.map(row => [...row]);

    // 5. Remove elements based on difficulty with Uniqueness Check
    // Easy: Keep ~40-45 clues
    // Medium: Keep ~30-36 clues
    // Hard: Keep ~24-29 clues
    let attempts = 5;
    let targetClues = 0;

    switch (difficulty) {
        case 'easy': targetClues = 45; break;
        case 'medium': targetClues = 35; break;
        case 'hard': targetClues = 28; break;
    }

    removeCellsWithUniquenessCheck(grid, targetClues);

    return { initialGrid: grid, solvedGrid };
};

const fillDiagonal = (grid: number[][]) => {
    for (let i = 0; i < 9; i = i + 3) {
        fillBox(grid, i, i);
    }
};

const fillBox = (grid: number[][], row: number, col: number) => {
    let num: number;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            do {
                num = Math.floor(Math.random() * 9) + 1;
            } while (!isSafeInBox(grid, row, col, num));
            grid[row + i][col + j] = num;
        }
    }
};

const isSafeInBox = (grid: number[][], rowStart: number, colStart: number, num: number) => {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[rowStart + i][colStart + j] === num) return false;
        }
    }
    return true;
};

const isSafe = (grid: number[][], row: number, col: number, num: number) => {
    // Check row
    for (let x = 0; x < 9; x++) if (grid[row][x] === num) return false;
    // Check col
    for (let x = 0; x < 9; x++) if (grid[x][col] === num) return false;
    // Check box
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (grid[i + startRow][j + startCol] === num) return false;

    return true;
};

const solveSudoku = (grid: number[][]): boolean => {
    let row = -1;
    let col = -1;
    let isEmpty = true;

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (grid[i][j] === 0) {
                row = i;
                col = j;
                isEmpty = false;
                break;
            }
        }
        if (!isEmpty) break;
    }

    if (isEmpty) return true;

    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Shuffle for randomness if needed, but for solving specifically we usually just need one solution.
    // For generating, we already randomized the diagonal boxes.

    for (let num of nums) {
        if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = 0;
        }
    }
    return false;
};

// Count solutions (stops if > 1)
const countSolutions = (grid: number[][], count = { val: 0 }): boolean => {
    let row = -1;
    let col = -1;
    let isEmpty = true;

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (grid[i][j] === 0) {
                row = i;
                col = j;
                isEmpty = false;
                break;
            }
        }
        if (!isEmpty) break;
    }

    if (isEmpty) {
        count.val++;
        return true; // Found a solution
    }

    for (let num = 1; num <= 9; num++) {
        if (count.val > 1) return false; // Optimization: Stop if we already found more than 1 solution

        if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            countSolutions(grid, count);
            grid[row][col] = 0; // Backtrack
        }
    }
    return false; // This return value isn't strictly used for the count, but keeps signature consistent
};

const removeCellsWithUniquenessCheck = (grid: number[][], targetClues: number) => {
    let attempts = targetClues * 2; // Safety break

    // Create a list of all cell positions
    let cells: number[] = [];
    for (let i = 0; i < 81; i++) cells.push(i);

    // Shuffle cells to remove randomly
    for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    let cluesCount = 81;

    for (let i = 0; i < 81; i++) {
        if (cluesCount <= targetClues) break;

        let cellId = cells[i];
        let row = Math.floor(cellId / 9);
        let col = cellId % 9;

        if (grid[row][col] !== 0) {
            let backup = grid[row][col];
            grid[row][col] = 0;

            // Check if solution is still unique
            let count = { val: 0 };
            countSolutions(grid, count);

            if (count.val !== 1) {
                // Not unique, put it back
                grid[row][col] = backup;
            } else {
                cluesCount--;
            }
        }
    }
};
