import { afterEach,describe,it,expect,vi } from 'vitest';
import { BotController,type BotRequest,type WorkerPort } from './bot-controller';
import { newMatch,legalMoves } from './engine';
import type { Player } from './model';
const party:[Player,Player]=[{id:'bot',name:'Máy',kind:'bot',level:'hard',avatar:''},{id:'owner',name:'An',kind:'human',level:'medium',avatar:''}];
function setup(){vi.useFakeTimers();const match=newMatch('owner',party,'id',1),moves=legalMoves(match),callback=vi.fn();let request:BotRequest;const worker:WorkerPort={onmessage:null,onerror:null,postMessage:r=>{request=r;},terminate:vi.fn()};const controller=new BotController(()=>worker);controller.start(match,moves,callback);return {match,moves,callback,worker,controller,request:request!};}
afterEach(()=>vi.useRealTimers());
describe('worker lifecycle',()=>{
  it('ignores stale replies and commits a matching result only once',()=>{const s=setup();s.worker.onmessage!({data:{...s.request,requestId:'stale',move:s.moves[0]}} as unknown as MessageEvent);expect(s.callback).not.toHaveBeenCalled();const reply={data:{...s.request,move:s.moves[0]}} as unknown as MessageEvent;s.worker.onmessage!(reply);s.worker.onmessage!(reply);vi.runAllTimers();expect(s.callback).toHaveBeenCalledTimes(1);s.controller.cancel();});
  it('uses prepared legal fallback when worker stalls, without synchronous search',()=>{const s=setup();vi.advanceTimersByTime(2300);expect(s.callback).toHaveBeenCalledWith(s.moves[0],true,undefined);expect(s.worker.terminate).toHaveBeenCalled();s.worker.onmessage!({data:{...s.request,move:s.moves[1]}} as unknown as MessageEvent);expect(s.callback).toHaveBeenCalledTimes(1);});
  it('cancels paused/modal/hidden work and rejects its late reply',()=>{const s=setup();s.controller.cancelPending();s.worker.onmessage!({data:{...s.request,move:s.moves[0]}} as unknown as MessageEvent);vi.runAllTimers();expect(s.callback).not.toHaveBeenCalled();});
  it.each(['rules','illegal'] as const)('falls back for a bad %s reply',kind=>{const s=setup();s.worker.onmessage!({data:{...s.request,...(kind==='rules'?{rulesVersion:'old',move:s.moves[0]}:{move:{from:0,to:63}})}} as unknown as MessageEvent);expect(s.callback).toHaveBeenCalledWith(s.moves[0],true,undefined);});
});
