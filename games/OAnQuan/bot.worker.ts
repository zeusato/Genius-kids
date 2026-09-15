import { chooseAction } from './bot';
import { validateMatch } from './engine';
import type { Match, Level } from './model';
self.onmessage=(event:MessageEvent<{state:Match;level:Level;request:string}>)=>{
  const {state,level,request}=event.data;
  if(!validateMatch(state)||!['easy','medium','hard'].includes(level))return;
  self.postMessage({request,matchId:state.id,revision:state.revision,...chooseAction(state,level)});
};
