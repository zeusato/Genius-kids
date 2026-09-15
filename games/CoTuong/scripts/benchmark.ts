import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chooseMove, evaluate, LIMITS, MoveTable } from '../bot';
import { newMatch, applyMove } from '../engine';
import { fromMatch, unmake } from '../position';
import { legalMoves } from '../movegen';
import { advance, adjudicatePosition } from '../rules';
import type { Level, Match, Move, Position, Side } from '../model';
const smoke = !process.argv.includes('--acceptance');
const root = fileURLToPath(new URL('../', import.meta.url)); // Bundled runner lives in .bench.
const fixturesPath = root + '/fixtures/benchmark-starts.json';
let rng = 20260915;
function random() { rng ^= rng << 13; rng ^= rng >>> 17; rng ^= rng << 5; return (rng >>> 0) / 4294967296; }
let fixtures: Match[];
try { fixtures = JSON.parse(readFileSync(fixturesPath, 'utf8')); }
catch {
  fixtures = []; const seen = new Set<string>();
  for (let attempt = 0; fixtures.length < 200; attempt++) {
    let m = newMatch({ id: 'benchmark', name: 'Benchmark' }, 0, 'human', 'hard', `fixture-${attempt}`);
    const plies = 4 + attempt % 17;
    for (let ply = 0; ply < plies && m.phase === 'play'; ply++) { const moves = legalMoves(fromMatch(m)); m = applyMove(m, moves[Math.floor(random() * moves.length)]); }
    const key = m.positions.at(-1)!; if (m.phase === 'play' && !seen.has(key)) { fixtures.push(m); seen.add(key); }
  }
  mkdirSync(root + '/fixtures', { recursive: true }); writeFileSync(fixturesPath, JSON.stringify(fixtures));
}
rng = 20260915; // Fixture creation must not change the tournament random stream.
const positions = smoke ? fixtures.slice(0, 4) : fixtures;
const maxPlies = smoke ? 160 : 600, searchOptions = smoke ? { timeMs: Infinity, maxNodes: 2000, maxDepth: 4 } : { ...LIMITS.hard, timeMs: Infinity };
const provenance = {
  fixtureSHA256: createHash('sha256').update(readFileSync(fixturesPath)).digest('hex'),
  engineSHA256: createHash('sha256').update(['bot.ts', 'position.ts', 'movegen.ts', 'rules.ts'].map(file => readFileSync(root + file, 'utf8')).join('\n')).digest('hex'),
  cpu: cpus()[0]?.model, node: process.version,
};
mkdirSync(root + '/reports', { recursive: true });
if (process.argv.includes('--latency')) {
  const rows = (['easy', 'medium', 'hard'] as Level[]).map(level => {
    const decisions = fixtures.slice(0, 12).map(m => ({ fixture: m.id, ...chooseMove(m, level) }));
    const times = decisions.map(d => d.elapsedMs).sort((a, b) => a - b);
    return { level, limits: LIMITS[level], decisions, p50: times[6], p95: times[11], incompleteFirstIterations: decisions.filter(d => !d.completedDepth).length };
  });
  const report = { kind: 'deadline-latency', generatedAt: new Date().toISOString(), ...provenance, rows };
  writeFileSync(root + '/reports/latency.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(rows.map(({ level, p50, p95, incompleteFirstIterations }) => ({ level, p50, p95, incompleteFirstIterations }))));
  process.exit(0);
}
type Opponent = 'random' | 'greedy' | 'depth3' | 'medium' | 'easy';
function baseline(p: Position, depth: number, ply = 0): number {
  const moves = legalMoves(p), result = adjudicatePosition(p, moves);
  if (result) return result.winner === null ? 0 : result.winner === p.active ? 100000 - ply : -100000 + ply;
  if (!depth) return evaluate(p, true);
  let best = -Infinity;
  for (const move of moves) { const undo = advance(p, move); try { best = Math.max(best, -baseline(p, depth - 1, ply + 1)); } finally { unmake(p, undo); } } return best;
}
function opponentMove(m: Match, kind: Opponent): Move {
  if (kind === 'medium' || kind === 'easy') return chooseMove(m, kind, smoke ? { ...searchOptions, maxNodes: kind === 'easy' ? 200 : 700, maxDepth: kind === 'easy' ? 2 : 3 } : { ...LIMITS[kind], timeMs: Infinity }).move!;
  const p = fromMatch(m), moves = legalMoves(p); if (kind === 'random') return moves[Math.floor(random() * moves.length)];
  let best = moves[0], score = -Infinity;
  for (const move of moves) { const undo = advance(p, move); let value: number; try { value = -baseline(p, kind === 'depth3' ? 2 : 0, 1); } finally { unmake(p, undo); } if (value > score) { score = value; best = move; } }
  return best;
}
const report: Record<string, unknown> = { kind: smoke ? 'functional-selfplay-smoke' : 'acceptance-fixed-work', generatedAt: new Date().toISOString(), rulesVersion: 'gk-xiangqi-v1', seed: 20260915, fixtureCount: positions.length, ...provenance, searchOptions: { ...searchOptions, timeMs: 'Infinity' }, maxPlies, note: 'Smoke results do not certify the full strength targets. Incomplete games are not draws.' };
mkdirSync(root + '/reports', { recursive: true });
for (const opponent of (smoke ? ['random', 'greedy'] : ['random', 'greedy', 'depth3', 'medium', 'easy']) as Opponent[]) {
  const challengerLevel: Level = opponent === 'easy' ? 'medium' : 'hard';
  let wins = 0, draws = 0, losses = 0, unfinished = 0; const times: number[] = [], depths: number[] = [], pairs: { wins: number; draws: number; losses: number }[] = [];
  const started = performance.now();
  for (let index = 0; index < positions.length; index++) {
    const pair = { wins: 0, draws: 0, losses: 0 };
    for (const challenger of [0, 1] as Side[]) {
      let m = structuredClone(positions[index]); const tt = new MoveTable();
      while (m.phase === 'play' && m.ply < maxPlies) {
        let move: Move;
        if (m.active === challenger) { const result = chooseMove(m, challengerLevel, { ...(smoke ? searchOptions : { ...LIMITS[challengerLevel], timeMs: Infinity }), seed: index + m.ply }, tt); if (!result.move) throw new Error('No move before terminal'); move = result.move; times.push(result.elapsedMs); depths.push(result.completedDepth); }
        else move = opponentMove(m, opponent);
        const next = applyMove(m, move); if (next === m) throw new Error('Illegal move in self-play'); m = next;
      }
      if (m.phase !== 'over') unfinished++; else if (m.winner === null) { draws++; pair.draws++; } else if (m.winner === challenger) { wins++; pair.wins++; } else { losses++; pair.losses++; }
    }
    pairs.push(pair); console.log(JSON.stringify({ opponent, pair: index + 1, total: positions.length, wins, draws, losses, unfinished }));
  }
  const samples: number[] = [], winSamples: number[] = [];
  for (let trial = 0; trial < 10000; trial++) { let w = 0, d = 0, l = 0; for (let i = 0; i < pairs.length; i++) { const p = pairs[Math.floor(random() * pairs.length)]; w += p.wins; d += p.draws; l += p.losses; } if (w + d + l) { samples.push((w + d * .5) / (w + d + l)); winSamples.push(w / (w + d + l)); } }
  times.sort((a, b) => a - b); samples.sort((a, b) => a - b); winSamples.sort((a, b) => a - b); const done = wins + draws + losses;
  report[`${opponent}Metadata`] = { challengerLevel, challengerLimits: smoke ? { ...searchOptions, timeMs: 'Infinity' } : { ...LIMITS[challengerLevel], timeMs: 'Infinity' }, winRateCI95: winSamples.length ? [winSamples[Math.floor(winSamples.length * .025)], winSamples[Math.floor(winSamples.length * .975)]] : null, confidenceMethod: '10,000 bootstrap resamples of paired starting positions; tiny smoke samples are not strength evidence' };
  report[opponent] = { wins, draws, losses, unfinished, completedFraction: done / (positions.length * 2), winRate: done ? wins / done : null, matchScore: done ? (wins + .5 * draws) / done : null, matchScoreCI95: samples.length ? [samples[Math.floor(samples.length * .025)], samples[Math.floor(samples.length * .975)]] : null, decisions: times.length, p50: times[Math.floor(times.length * .5)], p95: times[Math.floor(times.length * .95)], averageDepth: depths.reduce((a, b) => a + b, 0) / depths.length, seconds: (performance.now() - started) / 1000 };
  writeFileSync(root + `/reports/benchmark-${smoke ? 'smoke' : 'acceptance'}.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
