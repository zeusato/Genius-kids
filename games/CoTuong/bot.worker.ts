import { chooseMove, MoveTable } from './bot';
import { validateMatch } from './engine';
import { RULES_VERSION } from './model';
import type { BotRequest } from './bot-controller';
const table = new MoveTable();
self.onmessage = (event: MessageEvent<BotRequest>) => {
  const request = event.data, identity = { requestId: request.requestId, matchId: request.matchId, revision: request.revision, rulesVersion: request.rulesVersion };
  try {
    if (request.rulesVersion !== RULES_VERSION || !validateMatch(request.state, request.state.owner) || request.state.id !== request.matchId || request.state.revision !== request.revision || !['easy', 'medium', 'hard'].includes(request.level)) throw new Error('Yêu cầu không hợp lệ');
    self.postMessage({ ...identity, ...chooseMove(request.state, request.level, { ...request.limits, seed: request.seed }, table) });
  } catch { self.postMessage({ ...identity, error: 'Không thể tìm nước' }); }
};
