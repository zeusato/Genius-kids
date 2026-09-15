import { isQuan, nextPit, ownerOf, QUAN_PITS, ROWS } from './board';
import type { Action, Match, Player, Position, Seat, TurnEvent, TurnResult, EndReason } from './model';

export const score = (p: Position, seat: number) => p.banks[seat].dân + p.banks[seat].quan * 10;
export const snapshot = (p: Position): Position => ({ board: [...p.board], quan: [...p.quan], banks: p.banks.map(b => ({ ...b })) });
export const positionKey = (s: Match) => `${s.active}|${s.board.join(',')}|${s.quan.map(Number).join('')}|${s.banks.map(b => `${b.dân},${b.quan}`).join('|')}`;
export function validateParty(p: unknown): p is Player[] {
  if (!Array.isArray(p) || p.length !== 2) return false;
  return p.every(v => v && typeof v.id === 'string' && v.id.length > 0 && typeof v.name === 'string' && v.name.trim().length > 0 && v.name.length <= 50 && typeof v.avatar === 'string' && ['human', 'bot'].includes(v.kind) && ['easy', 'medium', 'hard'].includes(v.level)) && p[0].kind === 'human' && p[0].id !== p[1].id;
}
export function newMatch(owner: string, players: Player[], id: string, first: Seat = 0): Match {
  if (!owner || !id || !validateParty(players) || ![0, 1].includes(first)) throw Error('Invalid match');
  const s: Match = { version: 1, rulesVersion: 'family-v1', id, owner, players: players.map(p => ({ ...p })), board: Array.from({ length: 12 }, (_, i) => isQuan(i) ? 0 : 5), quan: [true, true], banks: [{ dân: 0, quan: 0 }, { dân: 0, quan: 0 }], active: first, first, phase: 'play', winner: null, reason: null, revision: 0, turn: 1, elapsed: 0, history: [], collected: [0, 0] };
  s.history.push(positionKey(s)); return s;
}
export function legalActions(s: Match): Action[] {
  return s.phase === 'over' ? [] : ROWS[s.active].filter(pit => s.board[pit] > 0).flatMap(pit => [{ pit, direction: -1 as const }, { pit, direction: 1 as const }]);
}

/** A complete deterministic turn; bot and presentation use these same rules. */
export function resolveTurn(original: Match, action: Action, withEvents = true): TurnResult {
  if (original.phase !== 'play' || ownerOf(action.pit) !== original.active || !Number.isInteger(action.pit) || ![-1, 1].includes(action.direction) || !original.board[action.pit]) return { state: original, events: [] };
  const s: Match = { ...original, ...snapshot(original), history: [...original.history], collected: [...original.collected], revision: original.revision + 1 };
  const events: TurnEvent[] = []; const actor = s.active; let held = 0;
  const emit = (kind: TurnEvent['kind'], from: number, to: number, dân = 0, quan = 0, seat = actor) => {
    if (withEvents) events.push({ kind, from, to, dân, quan, seat, held, position: snapshot(s) });
  };
  const finish = (reason: EndReason) => {
    s.reason = reason; s.phase = 'over';
    for (const seat of [0, 1] as Seat[]) for (const pit of ROWS[seat]) {
      const n = s.board[pit]; if (!n) continue;
      s.banks[seat].dân += n; s.collected[seat] += n; s.board[pit] = 0;
      emit('sweep', pit, -2 - seat, n, 0, seat);
    }
    const a = score(s, 0), b = score(s, 1); s.winner = a === b ? null : a > b ? 0 : 1;
    emit('end', -1, -1);
  };
  const emptyEnds = () => s.quan.every(q => !q) && QUAN_PITS.every(p => s.board[p] === 0);
  const occupied = (pit: number) => s.board[pit] > 0 || (isQuan(pit) && s.quan[QUAN_PITS.indexOf(pit)]);
  let cursor = action.pit;
  const visited = new Set<string>();
  for (;;) {
    // The hand is empty at this boundary, so stopping a relay cycle loses no tokens.
    const key = `${cursor}:${s.board.join(',')}`;
    if (visited.has(key)) { finish('repetition'); return { state: s, events }; }
    visited.add(key);
    held = s.board[cursor]; s.board[cursor] = 0; emit('pickup', cursor, -1, held);
    while (held > 0) {
      const from = cursor; cursor = nextPit(cursor, action.direction); held--; s.board[cursor]++;
      emit('drop', from, cursor, 1);
    }
    const after = nextPit(cursor, action.direction);
    if (isQuan(after)) break;
    if (s.board[after] > 0) { cursor = after; continue; }
    let gap = after;
    while (!isQuan(gap) && !occupied(gap)) {
      const target = nextPit(gap, action.direction); if (!occupied(target)) break;
      const n = s.board[target], q = isQuan(target) && s.quan[QUAN_PITS.indexOf(target)] ? 1 : 0;
      s.board[target] = 0; if (q) s.quan[QUAN_PITS.indexOf(target)] = false;
      s.banks[actor].dân += n; s.banks[actor].quan += q;
      emit('capture', target, -2 - actor, n, q);
      if (emptyEnds()) { finish('empty'); return { state: s, events }; }
      gap = nextPit(target, action.direction);
    }
    break;
  }
  s.active = (1 - actor) as Seat; s.turn++;
  if (ROWS[s.active].every(p => s.board[p] === 0)) {
    if (s.banks[s.active].dân < 5) { finish('shortage'); return { state: s, events }; }
    for (const pit of ROWS[s.active]) { s.banks[s.active].dân--; s.board[pit]++; emit('refill', -2 - s.active, pit, 1, 0, s.active); }
  }
  const key = positionKey(s); s.history.push(key);
  if (s.history.filter(k => k === key).length >= 3) finish('repetition');
  return { state: s, events };
}

export function validateMatch(value: unknown, owner?: string): value is Match {
  if (!value || typeof value !== 'object') return false;
  const s = value as Match, integer = (n: unknown, max: number) => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= max;
  if (s.version !== 1 || s.rulesVersion !== 'family-v1' || typeof s.id !== 'string' || !s.id || typeof s.owner !== 'string' || !s.owner || (owner && s.owner !== owner) || !validateParty(s.players)) return false;
  if (!Array.isArray(s.board) || s.board.length !== 12 || s.board.some(n => !integer(n, 50)) || !Array.isArray(s.quan) || s.quan.length !== 2 || s.quan.some(q => typeof q !== 'boolean')) return false;
  if (!Array.isArray(s.banks) || s.banks.length !== 2 || s.banks.some(b => !b || !integer(b.dân, 50) || !integer(b.quan, 2))) return false;
  if (s.board.reduce((a,b) => a+b, 0) + s.banks.reduce((a,b) => a+b.dân, 0) !== 50 || s.quan.filter(Boolean).length + s.banks.reduce((a,b) => a+b.quan, 0) !== 2) return false;
  if (![0,1].includes(s.active) || ![0,1].includes(s.first) || !integer(s.revision, 100000) || !integer(s.turn, 100001) || s.turn < 1 || !Number.isFinite(s.elapsed) || s.elapsed < 0 || !Array.isArray(s.history) || !s.history.length || s.history.length > 100001 || s.history.some(k => typeof k !== 'string' || k.length > 200)) return false;
  if (!Array.isArray(s.collected) || s.collected.length !== 2 || s.collected.some((n,i) => !integer(n,50) || n > s.banks[i].dân)) return false;
  if (s.phase === 'play') return s.reason === null && s.winner === null && s.collected.every(n => n === 0) && legalActions(s).length > 0 && !(s.quan.every(q => !q) && QUAN_PITS.every(p => s.board[p] === 0));
  if (s.phase !== 'over' || !['empty','shortage','repetition'].includes(s.reason!) || ROWS.flat().some(p => s.board[p] > 0)) return false;
  if (s.reason === 'empty' && (s.quan.some(Boolean) || QUAN_PITS.some(p => s.board[p] > 0))) return false;
  const a = score(s,0), b = score(s,1); return s.winner === (a === b ? null : a > b ? 0 : 1);
}
