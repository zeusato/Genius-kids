// services/kidCoderGenerator.ts
var DIR_VECTORS = {
  N: { dr: -1, dc: 0 },
  E: { dr: 0, dc: 1 },
  S: { dr: 1, dc: 0 },
  W: { dr: 0, dc: -1 }
};
var DIR_INDEX = { N: 0, E: 1, S: 2, W: 3 };
var TURN_LEFT = { N: "W", W: "S", S: "E", E: "N" };
var TURN_RIGHT = { N: "E", E: "S", S: "W", W: "N" };
var ALL_DIRS = ["N", "E", "S", "W"];
var getNextPos = (pos, dir, steps = 1) => ({
  row: pos.row + DIR_VECTORS[dir].dr * steps,
  col: pos.col + DIR_VECTORS[dir].dc * steps
});
var isValidPos = (pos, size) => {
  return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size;
};
var posKey = (p) => `${p.row}-${p.col}`;
var randInt = (n) => Math.floor(Math.random() * n);
var pick = (arr) => arr[randInt(arr.length)];
var shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
var CURRICULUM = [
  {
    id: 1,
    title: "T\u1EADp s\u1EF1 (Novice)",
    description: "L\xE0m quen v\u1EDBi c\xE1c l\u1EC7nh c\u01A1 b\u1EA3n",
    lessons: 5,
    color: "bg-blue-500"
  },
  {
    id: 2,
    title: "Th\xE1m hi\u1EC3m (Explorer)",
    description: "H\u1ECDc c\xE1ch r\u1EBD tr\xE1i v\xE0 ph\u1EA3i",
    lessons: 10,
    color: "bg-green-500"
  },
  {
    id: 3,
    title: "Th\u1EED th\xE1ch (Challenger)",
    description: "Chi\u1EBFn \u0111\u1EA5u v\u1EDBi qu\xE1i v\u1EADt",
    lessons: 10,
    color: "bg-purple-500"
  },
  {
    id: 4,
    title: "Gi\u1EA3i \u0111\u1ED1 (Puzzle Master)",
    description: "T\xECm kh\xF3a m\u1EDF c\u1EEDa",
    lessons: 10,
    color: "bg-orange-500"
  },
  {
    id: 5,
    title: "K\u1EF9 s\u01B0 (Engineer)",
    description: "\u0110\u1EA9y h\u1ED9p l\u1EA5p b\u1EABy",
    lessons: 10,
    color: "bg-red-500"
  }
];
var getConfig = (levelId, lessonId) => {
  if (levelId === 1) {
    return {
      gridSize: 6,
      allowedCommands: ["forward"],
      targetCommands: lessonId <= 2 ? 5 : 6,
      turnWeight: 0,
      jumpWeight: 0,
      maxMonsters: 0,
      obstacleCount: 0,
      ambientWater: 0,
      useKeyGate: false,
      trapBoxPairs: 0,
      startMargin: 0
    };
  }
  if (levelId === 2) {
    return {
      gridSize: 6,
      allowedCommands: ["forward", "left", "right", "jump"],
      targetCommands: lessonId <= 3 ? 8 : lessonId <= 6 ? 10 : 12,
      turnWeight: 1.5,
      jumpWeight: lessonId <= 3 ? 0 : 1.2,
      maxMonsters: 0,
      obstacleCount: lessonId <= 3 ? 1 : 2,
      ambientWater: lessonId <= 3 ? 0 : 3,
      useKeyGate: false,
      trapBoxPairs: 0,
      startMargin: 1
    };
  }
  if (levelId === 3) {
    return {
      gridSize: 7,
      allowedCommands: ["forward", "left", "right", "jump", "fight"],
      targetCommands: lessonId <= 5 ? 12 : 15,
      turnWeight: 1.5,
      jumpWeight: 1.2,
      maxMonsters: lessonId <= 5 ? 2 : 3,
      obstacleCount: lessonId <= 5 ? 2 : 3,
      ambientWater: lessonId <= 5 ? 3 : 4,
      useKeyGate: false,
      trapBoxPairs: 0,
      startMargin: 1
    };
  }
  if (levelId === 4) {
    return {
      gridSize: 8,
      allowedCommands: ["forward", "left", "right", "jump", "fight"],
      targetCommands: lessonId <= 5 ? 15 : 18,
      turnWeight: 1.5,
      jumpWeight: 1.2,
      maxMonsters: 2,
      obstacleCount: 2,
      ambientWater: 5,
      useKeyGate: true,
      trapBoxPairs: 0,
      startMargin: 1
    };
  }
  return {
    gridSize: 8,
    allowedCommands: ["forward", "left", "right", "jump", "fight", "push"],
    targetCommands: lessonId <= 5 ? 16 : 20,
    turnWeight: 1.5,
    jumpWeight: 1.2,
    maxMonsters: 2,
    obstacleCount: 2,
    ambientWater: 5,
    useKeyGate: true,
    trapBoxPairs: lessonId <= 5 ? 1 : 2,
    startMargin: 1
  };
};
var buildPath = (cfg) => {
  const size = cfg.gridSize;
  const canTurn = cfg.allowedCommands.includes("left");
  const canJump = cfg.jumpWeight > 0 && cfg.allowedCommands.includes("jump");
  const canFight = cfg.maxMonsters > 0 && cfg.allowedCommands.includes("fight");
  const startDir = pick(ALL_DIRS);
  if (!canTurn) {
    const len = cfg.targetCommands;
    if (len >= size) return null;
    const v = DIR_VECTORS[startDir];
    const start2 = {
      row: v.dr === 0 ? randInt(size) : v.dr > 0 ? randInt(size - len) : len + randInt(size - len),
      col: v.dc === 0 ? randInt(size) : v.dc > 0 ? randInt(size - len) : len + randInt(size - len)
    };
    const cells2 = [start2];
    const commands2 = [];
    for (let i = 0; i < len; i++) {
      cells2.push(getNextPos(start2, startDir, i + 1));
      commands2.push("forward");
    }
    return { cells: cells2, commands: commands2, waterCells: [], monsterKeys: /* @__PURE__ */ new Set(), startDir };
  }
  const m = cfg.startMargin;
  const start = {
    row: randInt(size - 2 * m) + m,
    col: randInt(size - 2 * m) + m
  };
  const visited = /* @__PURE__ */ new Set([posKey(start)]);
  const reserved = /* @__PURE__ */ new Set();
  const cells = [start];
  const commands = [];
  const waterCells = [];
  const monsterKeys = /* @__PURE__ */ new Set();
  let pos = start;
  let dir = startDir;
  let monsters = 0;
  const free = (p) => isValidPos(p, size) && !visited.has(posKey(p)) && !reserved.has(posKey(p));
  while (commands.length < cfg.targetCommands) {
    const moves = [];
    const fwd = getNextPos(pos, dir);
    if (free(fwd)) {
      moves.push({
        weight: 4,
        apply: () => {
          commands.push("forward");
          visited.add(posKey(fwd));
          cells.push(fwd);
          pos = fwd;
        }
      });
    }
    for (const [cmd, nd] of [["left", TURN_LEFT[dir]], ["right", TURN_RIGHT[dir]]]) {
      const np = getNextPos(pos, nd);
      if (free(np)) {
        moves.push({
          weight: cfg.turnWeight,
          apply: () => {
            commands.push(cmd, "forward");
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
            commands.push("jump");
            reserved.add(posKey(mid));
            waterCells.push(mid);
            visited.add(posKey(land));
            cells.push(land);
            pos = land;
          }
        });
      }
    }
    if (canFight && monsters < cfg.maxMonsters && commands.length + 2 < cfg.targetCommands) {
      const np = getNextPos(pos, dir);
      if (free(np)) {
        moves.push({
          weight: 0.8,
          apply: () => {
            commands.push("fight", "forward");
            monsterKeys.add(posKey(np));
            monsters++;
            visited.add(posKey(np));
            cells.push(np);
            pos = np;
          }
        });
      }
    }
    if (moves.length === 0) return null;
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
var solveLevel = (level) => {
  const { grid, gridSize, startPos, endPos, startDir, keyPosition, allowedCommands } = level;
  const boxSet = new Set((level.boxPositions || []).map(posKey));
  const canTurn = allowedCommands.includes("left");
  const canJump = allowedCommands.includes("jump");
  const canFight = allowedCommands.includes("fight");
  const needKey = !!keyPosition;
  const stateId = (r, c, d, k) => ((r * gridSize + c) * 4 + DIR_INDEX[d]) * 2 + (k ? 1 : 0);
  const dist = new Array(gridSize * gridSize * 8).fill(Infinity);
  const buckets = [];
  const enqueue = (cost, r, c, d, k) => {
    const id = stateId(r, c, d, k);
    if (cost >= dist[id]) return;
    dist[id] = cost;
    (buckets[cost] = buckets[cost] || []).push([r, c, d, k]);
  };
  const startHasKey = needKey && startPos.row === keyPosition.row && startPos.col === keyPosition.col;
  enqueue(0, startPos.row, startPos.col, startDir, startHasKey);
  const maxCost = gridSize * gridSize * 8 * 2;
  for (let cost = 0; cost <= maxCost; cost++) {
    const bucket = buckets[cost];
    if (!bucket) continue;
    for (const [r, c, d, hasKey] of bucket) {
      if (dist[stateId(r, c, d, hasKey)] !== cost) continue;
      if (r === endPos.row && c === endPos.col && (!needKey || hasKey)) return cost;
      const tryEnter = (nr, nc, nd, ncost) => {
        const nKey = hasKey || needKey && nr === keyPosition.row && nc === keyPosition.col;
        enqueue(ncost, nr, nc, nd, nKey);
      };
      if (canTurn) {
        enqueue(cost + 1, r, c, TURN_LEFT[d], hasKey);
        enqueue(cost + 1, r, c, TURN_RIGHT[d], hasKey);
      }
      const v = DIR_VECTORS[d];
      const isOpen = (nr, nc) => {
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return false;
        const cell = grid[nr][nc];
        if (cell === "wall" || cell === "water" || cell === "trap" || cell === "monster") return false;
        if (cell === "gate" && !hasKey) return false;
        if (boxSet.has(`${nr}-${nc}`)) return false;
        return true;
      };
      const fr = r + v.dr, fc = c + v.dc;
      if (fr >= 0 && fr < gridSize && fc >= 0 && fc < gridSize) {
        if (grid[fr][fc] === "monster" && canFight && !boxSet.has(`${fr}-${fc}`)) {
          tryEnter(fr, fc, d, cost + 2);
        } else if (isOpen(fr, fc)) {
          tryEnter(fr, fc, d, cost + 1);
        }
      }
      if (canJump) {
        const mr = r + v.dr, mc = c + v.dc;
        const jr = r + v.dr * 2, jc = c + v.dc * 2;
        if (mr >= 0 && mr < gridSize && mc >= 0 && mc < gridSize) {
          const midCell = grid[mr][mc];
          const midBlocked = midCell === "wall" || midCell === "monster" || midCell === "gate" && !hasKey || boxSet.has(`${mr}-${mc}`);
          if (!midBlocked && isOpen(jr, jc)) {
            tryEnter(jr, jc, d, cost + 1);
          }
        }
      }
    }
  }
  return Infinity;
};
var MIN_END_DISTANCE = 3;
var tryGenerate = (cfg, levelId, lessonId) => {
  const plan = buildPath(cfg);
  if (!plan) return null;
  const size = cfg.gridSize;
  const { cells, commands, waterCells, monsterKeys } = plan;
  const pathSet = new Set(cells.map(posKey));
  if (cfg.turnWeight > 0) {
    const a = cells[0], b = cells[cells.length - 1];
    if (Math.abs(a.row - b.row) + Math.abs(a.col - b.col) < MIN_END_DISTANCE) return null;
  }
  const grid = Array.from({ length: size }, () => Array(size).fill("empty"));
  waterCells.forEach((p) => {
    grid[p.row][p.col] = "water";
  });
  monsterKeys.forEach((k) => {
    const [r, c] = k.split("-").map(Number);
    grid[r][c] = "monster";
  });
  const startPos = cells[0];
  const endPos = cells[cells.length - 1];
  let plainIdx = cells.map((_, i) => i).filter((i) => i > 0 && i < cells.length - 1 && grid[cells[i].row][cells[i].col] === "empty");
  let keyPosition;
  let gatePositions = [];
  if (cfg.useKeyGate) {
    const n = cells.length;
    const keyCandidates = plainIdx.filter((i) => i >= n * 0.25 && i <= n * 0.6);
    if (keyCandidates.length === 0) return null;
    const ki = pick(keyCandidates);
    const gateCandidates = plainIdx.filter((i) => i >= ki + 2 && i >= n * 0.55);
    if (gateCandidates.length === 0) return null;
    const gi = pick(gateCandidates);
    keyPosition = cells[ki];
    grid[keyPosition.row][keyPosition.col] = "key";
    gatePositions = [cells[gi]];
    grid[cells[gi].row][cells[gi].col] = "gate";
    plainIdx = plainIdx.filter((i) => i !== ki && i !== gi);
  }
  const boxPositions = [];
  let trapStars = 0;
  if (cfg.trapBoxPairs > 0) {
    for (const i of shuffle(plainIdx)) {
      if (trapStars >= cfg.trapBoxPairs) break;
      const p = cells[i];
      for (const d of shuffle(ALL_DIRS)) {
        const b = getNextPos(p, d);
        const t = getNextPos(p, d, 2);
        if (isValidPos(t, size) && grid[b.row][b.col] === "empty" && !pathSet.has(posKey(b)) && grid[t.row][t.col] === "empty" && !pathSet.has(posKey(t))) {
          grid[b.row][b.col] = "box";
          boxPositions.push(b);
          grid[t.row][t.col] = "trap";
          trapStars++;
          break;
        }
      }
    }
    if (trapStars < cfg.trapBoxPairs && trapStars === 0) return null;
  }
  let requiredStars = trapStars;
  const starSlots = shuffle(plainIdx.filter((i) => grid[cells[i].row][cells[i].col] === "empty"));
  const starsToPlace = Math.min(3 - trapStars, starSlots.length);
  for (let s = 0; s < starsToPlace; s++) {
    const p = cells[starSlots[s]];
    grid[p.row][p.col] = "star";
    requiredStars++;
  }
  const placeDecoration = (count, cell) => {
    let placed = 0;
    for (let i = 0; i < count * 40 && placed < count; i++) {
      const r = randInt(size), c = randInt(size);
      if (grid[r][c] === "empty" && !pathSet.has(`${r}-${c}`)) {
        grid[r][c] = cell;
        placed++;
      }
    }
  };
  placeDecoration(cfg.obstacleCount, "wall");
  placeDecoration(cfg.ambientWater, "water");
  grid[startPos.row][startPos.col] = "start";
  grid[endPos.row][endPos.col] = "end";
  const level = {
    id: `${levelId}-${lessonId}-${Date.now()}`,
    grid,
    startPos,
    endPos,
    startDir: plan.startDir,
    optimalSteps: commands.length,
    // sẽ thay bằng lời giải tối ưu thật sau khi solve
    allowedCommands: cfg.allowedCommands,
    gridSize: size,
    requiredStars,
    gatePositions: gatePositions.length > 0 ? gatePositions : void 0,
    keyPosition,
    boxPositions: boxPositions.length > 0 ? boxPositions : void 0
  };
  return { level, intended: commands.length };
};
var QUALITY_RATIO = 0.75;
var MAX_ATTEMPTS = 300;
var generateLevel = (levelId, lessonId) => {
  const cfg = getConfig(levelId, lessonId);
  let best = null;
  let bestRatio = -1;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = tryGenerate(cfg, levelId, lessonId);
    if (!candidate) continue;
    const trueOptimal = solveLevel(candidate.level);
    if (!isFinite(trueOptimal)) continue;
    candidate.level.optimalSteps = trueOptimal;
    const ratio = trueOptimal / candidate.intended;
    if (ratio >= QUALITY_RATIO) return candidate.level;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = candidate.level;
    }
  }
  if (best) return best;
  const size = cfg.gridSize;
  const len = Math.min(cfg.targetCommands, size - 1);
  const grid = Array.from({ length: size }, () => Array(size).fill("empty"));
  const row = randInt(size);
  grid[row][0] = "start";
  grid[row][len] = "end";
  return {
    id: `${levelId}-${lessonId}-${Date.now()}`,
    grid,
    startPos: { row, col: 0 },
    endPos: { row, col: len },
    startDir: "E",
    optimalSteps: len,
    allowedCommands: cfg.allowedCommands,
    gridSize: size,
    requiredStars: 0
  };
};
export {
  CURRICULUM,
  generateLevel,
  solveLevel
};
