import { newMatch, place } from './engine';
import { search } from './bot';
import type { Level, Match } from './model';
const pairs = Number(process.argv[2] || 50);
const budgets: Record<Level, number> = { easy: 5, medium: 10, hard: 30 };
const configurations: [Level, Level][] = [['medium', 'easy'], ['hard', 'easy'], ['hard', 'medium']];
const report: any = { generatedAt: new Date().toISOString(), seed: 20260917, pairs, budgetsMs: budgets, note: 'Accelerated search budgets for paired regression matches, not a rating or full-budget strength claim.', matches: [] };
for (const [a, b] of configurations) {
  let wins = 0, draws = 0, losses = 0, capped = 0, illegal = 0; const timings: number[] = [];
  for (let n = 0; n < pairs; n++) for (let swapped = 0; swapped < 2; swapped++) {
    let s = newMatch({ owner: 'benchmark', ownerSide: 0, mode: 'human', level: a, undoEnabled: false, players: [{ name: a, avatar: '', kind: 'human' }, { name: b, avatar: '', kind: 'human' }] }, `${a}-${b}-${n}-${swapped}`);
    // Identical opening for the paired games, with the engines exchanging marks.
    const offsets = [96, 97, 98, 111, 113, 126, 127, 128];
    s = place(s, 112); s = place(s, offsets[n % offsets.length]);
    while (s.phase === 'play' && s.moves.length < 120) {
      const level = s.activeSide === swapped ? a : b;
      const result = search(s, level, 20260917 + n * 257 + s.moves.length, budgets[level]); timings.push(result.elapsed);
      const next = place(s, result.cell); if (next === s) { illegal++; break; } s = next;
    }
    if (s.phase !== 'over') capped++; else if (s.winner === null) draws++; else if (s.winner === swapped) wins++; else losses++;
  }
  timings.sort((a, b) => a - b);
  report.matches.push({ a, b, games: pairs * 2, wins, draws, losses, capped, illegal, p50Ms: timings[Math.floor(timings.length * .5)], p95Ms: timings[Math.floor(timings.length * .95)] });
}
console.log(JSON.stringify(report, null, 2));
