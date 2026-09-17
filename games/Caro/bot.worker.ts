import { search } from './bot';
import { validateMatch } from './engine';
import type { BotRequest, BotReply } from './bot-controller';
self.onmessage = (event: MessageEvent<BotRequest>) => {
  const r = event.data;
  const reply: BotReply = { requestId: r.requestId, matchId: r.matchId, revision: r.revision, rulesVersion: r.rulesVersion };
  try {
    if (!validateMatch(r.state) || r.state.rulesVersion !== r.rulesVersion) throw new Error('Invalid match');
    Object.assign(reply, search(r.state, r.state.level, r.seed));
  } catch { reply.error = 'Không tìm được nước đi'; }
  self.postMessage(reply);
};
