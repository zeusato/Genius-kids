import { LIMITS } from './bot';
import type { SearchResult } from './bot';
import type { Level, Match, Move } from './model';
import { RULES_VERSION, sameMove } from './model';
export interface BotRequest { requestId: string; matchId: string; revision: number; rulesVersion: typeof RULES_VERSION; state: Match; level: Level; limits: typeof LIMITS[Level]; seed: number }
export type BotReply = Partial<SearchResult> & Pick<BotRequest, 'requestId' | 'matchId' | 'revision' | 'rulesVersion'> & { error?: string };
export interface WorkerPort { onmessage: ((event: MessageEvent<BotReply>) => void) | null; onerror: ((event: Event) => void) | null; postMessage(value: BotRequest): void; terminate(): void }
export class BotController {
  private worker: WorkerPort | null = null; private timer: ReturnType<typeof setTimeout> | undefined; private sequence = 0; private pending = '';
  constructor(private factory: () => WorkerPort = () => new Worker(new URL('./bot.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerPort) {}
  cancel() { this.pending = ''; if (this.timer) clearTimeout(this.timer); this.timer = undefined; this.worker?.terminate(); this.worker = null; }
  cancelPending() { if (this.pending) this.cancel(); }
  start(state: Match, moves: Move[], onResult: (move: Move, fallback: boolean, info?: BotReply) => void) {
    this.cancelPending(); if (state.phase !== 'play' || !moves.length || state.players[state.active].kind !== 'bot') return;
    const requestId = `${state.id}:${state.revision}:${++this.sequence}`, level = state.players[state.active].level;
    this.pending = requestId;
    const settle = (move: Move, fallback: boolean, reply?: BotReply) => { if (this.pending !== requestId) return; this.pending = ''; if (this.timer) clearTimeout(this.timer); this.timer = undefined; if (fallback) { this.worker?.terminate(); this.worker = null; } onResult(move, fallback, reply); };
    const fallback = () => settle(moves[0], true);
    try {
      this.worker ??= this.factory();
      this.worker.onmessage = event => { const reply = event.data;
        if (this.pending !== requestId || reply.requestId !== requestId || reply.matchId !== state.id || reply.revision !== state.revision) return;
        if (reply.error || reply.rulesVersion !== RULES_VERSION || !reply.move || !moves.some(move => sameMove(move, reply.move!))) return fallback();
        settle(reply.move, false, reply);
      };
      this.worker.onerror = fallback;
      this.timer = setTimeout(fallback, Math.max(2200, LIMITS[level].timeMs + 800));
      this.worker.postMessage({ requestId, matchId: state.id, revision: state.revision, rulesVersion: RULES_VERSION, state, level, limits: LIMITS[level], seed: state.turn + 20260915 });
    } catch { queueMicrotask(fallback); }
  }
}

