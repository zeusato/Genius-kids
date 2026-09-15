import { chooseMove } from './bot';
import { validateMatch } from './engine';
import type { Match, Level } from './model';
import { RULES_VERSION } from './model';
import type { BotRequest } from './bot-controller';

self.onmessage = (event: MessageEvent<BotRequest>) => {
  const { state, level, requestId, matchId, revision, rulesVersion, seed } = event.data;
  const envelope = { requestId, matchId, revision, rulesVersion: RULES_VERSION };
  try {
    if (rulesVersion !== RULES_VERSION || !validateMatch(state) || state.id !== matchId || state.revision !== revision || !['easy', 'medium', 'hard'].includes(level)) throw new Error('Invalid request');
    self.postMessage({ ...envelope, ...chooseMove(state, level, { seed }) });
  } catch { self.postMessage({ ...envelope, error: 'Không thể tính nước đi' }); }
};
