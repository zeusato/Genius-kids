// Harness đo chất lượng map Kid Coder.
// Solver ở đây viết ĐỘC LẬP với solver trong generator để cross-check:
// optimalSteps do generator tính phải khớp với kết quả solver này.
//
// Luật (khớp engine KidCoderGame.tsx sau khi sửa):
// - forward/rẽ/nhảy: 1 lệnh; vào ô quái = fight + forward = 2 lệnh
// - nhảy: ô giữa không được là tường/quái/hộp/cổng-khóa; ô đáp như forward
// - cổng chặn khi chưa có khóa; nhặt khóa khi bước/đáp vào ô khóa
// - box coi như tường (không mô phỏng push)
// - thắng: ở ô đích + có khóa (nếu map có khóa)
import { generateLevel } from './.tmp-kidcoder-gen.mjs';

const DIRS = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] };
const DIR_KEYS = ['N', 'E', 'S', 'W'];
const LEFT = { N: 'W', W: 'S', S: 'E', E: 'N' };
const RIGHT = { N: 'E', E: 'S', S: 'W', W: 'N' };

function solve(level) {
    const { grid, gridSize, startPos, endPos, startDir, keyPosition, allowedCommands } = level;
    const boxSet = new Set((level.boxPositions || []).map(b => `${b.row}-${b.col}`));
    const canJump = allowedCommands.includes('jump');
    const canTurn = allowedCommands.includes('left');
    const canFight = allowedCommands.includes('fight');
    const needKey = !!keyPosition;

    const stateId = (r, c, d, k) => ((r * gridSize + c) * 4 + DIR_KEYS.indexOf(d)) * 2 + (k ? 1 : 0);
    const dist = new Map();
    const startK = needKey && startPos.row === keyPosition.row && startPos.col === keyPosition.col;
    dist.set(stateId(startPos.row, startPos.col, startDir, startK), 0);
    const queue = [[0, startPos.row, startPos.col, startDir, startK]];

    while (queue.length) {
        queue.sort((a, b) => a[0] - b[0]);
        const [cost, r, c, d, hasKey] = queue.shift();
        if (cost > (dist.get(stateId(r, c, d, hasKey)) ?? Infinity)) continue;
        if (r === endPos.row && c === endPos.col && (!needKey || hasKey)) return cost;

        const push = (nr, nc, nd, ncost) => {
            const nKey = hasKey || (needKey && nr === keyPosition.row && nc === keyPosition.col);
            const nid = stateId(nr, nc, nd, nKey);
            if (ncost < (dist.get(nid) ?? Infinity)) {
                dist.set(nid, ncost);
                queue.push([ncost, nr, nc, nd, nKey]);
            }
        };

        const isOpen = (nr, nc) => {
            if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return false;
            const cell = grid[nr][nc];
            if (cell === 'wall' || cell === 'water' || cell === 'trap' || cell === 'monster') return false;
            if (cell === 'gate' && !hasKey) return false;
            if (boxSet.has(`${nr}-${nc}`)) return false;
            return true;
        };

        if (canTurn) {
            push(r, c, LEFT[d], cost + 1);
            push(r, c, RIGHT[d], cost + 1);
        }
        const [dr, dc] = DIRS[d];
        const fr = r + dr, fc = c + dc;
        if (fr >= 0 && fr < gridSize && fc >= 0 && fc < gridSize) {
            if (grid[fr][fc] === 'monster' && canFight && !boxSet.has(`${fr}-${fc}`)) push(fr, fc, d, cost + 2);
            else if (isOpen(fr, fc)) push(fr, fc, d, cost + 1);
        }
        if (canJump) {
            const mr = r + dr, mc = c + dc, jr = r + dr * 2, jc = c + dc * 2;
            if (mr >= 0 && mr < gridSize && mc >= 0 && mc < gridSize) {
                const mid = grid[mr][mc];
                const midBlocked = mid === 'wall' || mid === 'monster' ||
                    (mid === 'gate' && !hasKey) || boxSet.has(`${mr}-${mc}`);
                if (!midBlocked && isOpen(jr, jc)) push(jr, jc, d, cost + 1);
            }
        }
    }
    return Infinity;
}

const manhattan = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

const N = 2000;
console.log(`Mô phỏng ${N} map mỗi cấu hình (generator + engine MỚI):\n`);
console.log('Level-Lesson | Unsolvable | End cạnh Start (<=2) | Solver mismatch | Cấu trúc lỗi | avg lệnh tối ưu | avg ms/map');
for (const [lvl, lsn] of [[1, 3], [2, 5], [2, 8], [3, 3], [3, 8], [4, 3], [4, 8], [5, 3], [5, 8]]) {
    let unsolvable = 0, nearEnd = 0, mismatch = 0, structBad = 0, sumOpt = 0, solved = 0;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
        const level = generateLevel(lvl, lsn);

        // Kiểm tra cấu trúc: L4-5 phải có key + gate; L5 phải có box + trap + đủ 3 sao
        if (lvl >= 4 && (!level.keyPosition || !level.gatePositions?.length)) structBad++;
        else if (lvl >= 5 && (!level.boxPositions?.length || !level.grid.flat().includes('trap'))) structBad++;
        else if (level.requiredStars !== 3 && lvl >= 2) structBad++;

        if (manhattan(level.startPos, level.endPos) <= 2) nearEnd++;
        const trueOpt = solve(level);
        if (trueOpt === Infinity) { unsolvable++; continue; }
        solved++;
        sumOpt += trueOpt;
        if (trueOpt !== level.optimalSteps) mismatch++;
    }
    const ms = (performance.now() - t0) / N;
    const pct = x => (100 * x / N).toFixed(1).padStart(5) + '%';
    console.log(
        `  L${lvl} bài ${lsn}   |   ${pct(unsolvable)}   |        ${pct(nearEnd)}        |     ${pct(mismatch)}      |    ${pct(structBad)}    |      ${(sumOpt / solved).toFixed(1)}       |  ${ms.toFixed(2)}`
    );
}
