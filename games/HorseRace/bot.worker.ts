import { chooseMove } from './bot';
import { validateMatch } from './engine';
import type { Match, Level } from './model';
self.onmessage=(event:MessageEvent<{state:Match;level:Level;request:string}>)=>{
  const {state,level,request}=event.data;
  if(!validateMatch(state))return;
  const result=chooseMove(state,level,{deadline:performance.now()+(level==='hard'?480:160)});
  self.postMessage({request,revision:state.revision,matchId:state.id,...result});
};
