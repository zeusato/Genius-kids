import { fallbackMove, LIMITS, type SearchResult } from './bot';
import { RULES_VERSION, type Match } from './model';
export interface BotRequest { requestId: string; matchId: string; revision: number; rulesVersion: string; state: Match; seed: number }
export type BotReply = Partial<SearchResult> & Pick<BotRequest, 'requestId' | 'matchId' | 'revision' | 'rulesVersion'> & { error?: string };
export interface WorkerPort { onmessage: ((event: MessageEvent<BotReply>) => void) | null; onerror: ((event: Event) => void) | null; postMessage(value: BotRequest): void; terminate(): void }
export class BotController {
  private worker: WorkerPort | null = null; private timer: ReturnType<typeof setTimeout> | undefined; private sequence = 0; private pending = '';
  constructor(private factory: () => WorkerPort = () => new Worker(new URL('./bot.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerPort) {}
  cancel() { this.pending = ''; if (this.timer) clearTimeout(this.timer); this.timer = undefined; this.worker?.terminate(); this.worker = null; }
  start(state: Match, onResult: (cell: number, fallback: boolean) => void) {
    this.cancel(); if (state.phase !== 'play' || state.players[state.activeSide].kind !== 'bot') return;
    const requestId = `${state.id}:${state.revision}:${++this.sequence}`; this.pending = requestId;
    const settle = (cell: number, fallback: boolean) => { if (this.pending !== requestId) return; this.cancel(); if (cell >= 0) onResult(cell, fallback); };
    const fallback = () => { if (this.pending === requestId) settle(fallbackMove(state), true); };
    try {
      this.worker = this.factory();
      this.worker.onmessage = event => {
        const r = event.data;
        if (this.pending !== requestId || r.requestId !== requestId || r.matchId !== state.id || r.revision !== state.revision) return;
        if (r.error || r.rulesVersion !== RULES_VERSION || !Number.isInteger(r.cell) || r.cell! < 0 || r.cell! >= 225 || state.board[r.cell!] !== 0) return fallback();
        settle(r.cell!, false);
      };
      this.worker.onerror = fallback;
      this.timer = setTimeout(fallback, LIMITS[state.level].ms + 1500);
      this.worker.postMessage({ requestId, matchId: state.id, revision: state.revision, rulesVersion: RULES_VERSION, state, seed: state.moves.length + 20260917 });
    } catch { queueMicrotask(fallback); }
  }
}
