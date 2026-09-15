import { describe,it,expect,vi,afterEach } from 'vitest';
import { applyMove, newMatch, matchFromFen, validateMatch, finishMatch, posKey, matchToPos, legalMoves, moveToStr, capturedPieces } from './engine';
import { parseFen,serializeFen } from './fen';
import { chooseMove,searchPosition } from './bot';
import { algToSq } from './board';
import { persistStandaloneResult,recordOf } from './persistence';
import type { Match,Player,Move } from './model';
const players:[Player,Player]=[{id:'owner',name:'An',kind:'human',level:'medium',avatar:''},{id:'bot',name:'Máy',kind:'bot',level:'hard',avatar:''}];
const fresh=()=>newMatch('owner',players,'regression');
const move=(s:string):Move=>({from:algToSq(s.slice(0,2)),to:algToSq(s.slice(2,4)),...(s[4]?{promote:s[4] as Move['promote']}: {})});
afterEach(()=>vi.unstubAllGlobals());
describe('trust boundaries and chess adjudication',()=>{
  it('rejects a rook teleport and moves after resignation',()=>{const m=fresh();expect(applyMove(m,move('a1a8')).match).toBe(m);const over=finishMatch(m,'resign');expect(applyMove(over,move('e2e4')).match).toBe(over);});
  it('counts three occurrences when the first EP target was unusable',()=>{let m=fresh();for(const text of ['e2e4','g8f6','g1f3','f6g8','f3g1','g8f6','g1f3','f6g8','f3g1'])m=applyMove(m,move(text)).match;expect(m.reason).toBe('repetition');expect(validateMatch(m)).toBe(true);});
  it('ignores pinned EP but distinguishes a legal EP capture',()=>{
    expect(posKey(parseFen('k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'))).toBe(posKey(parseFen('k3r3/8/8/3pP3/8/8/8/4K3 w - - 0 1')));
    expect(posKey(parseFen('k7/8/8/3pP3/8/8/8/4K3 w - d6 0 1'))).not.toBe(posKey(parseFen('k7/8/8/3pP3/8/8/8/4K3 w - - 0 1')));
  });
  it.each([
    (m:Match)=>({...m,board:m.board.map((p,i)=>i===0?99:p)}),
    (m:Match)=>({...m,players:[null,null]}),
    (m:Match)=>({...m,phase:'over',winner:0,reason:'checkmate'}),
    (m:Match)=>({...m,elapsed:-1}),
    (m:Match)=>({...m,history:['a1h8'],positions:[m.positions[0],'fake']}),
    (m:Match)=>({...m,revision:5}),
    (m:Match)=>({...m,board:m.board.map((p,i)=>i===0?0:p)}),
    (m:Match)=>({...m,ownerSide:1}),
    (m:Match)=>({...m,initialFen:'8/8/8/8/8/8/8/8 w - - 0 1'}),
  ])('rejects forged persisted field %#',mutate=>expect(validateMatch(mutate(fresh()))).toBe(false));
  it('replays en passant and underpromotion without treating promotion as a capture',()=>{
    let m=matchFromFen('owner',players,'ep','k7/8/8/3pP3/8/8/8/4K3 w - d6 0 1');m=applyMove(m,move('e5d6')).match;expect(m.board[algToSq('d5')]).toBe(0);expect(validateMatch(m)).toBe(true);expect(capturedPieces(m)).toEqual([[9],[]]);
    m=matchFromFen('owner',players,'promotion','4k3/P7/8/8/8/8/8/4K3 w - - 0 1');m=applyMove(m,move('a7a8n')).match;expect(m.board[56]).toBe(2);expect(m.reason).toBe('insufficient');expect(validateMatch(m)).toBe(true);expect(capturedPieces(m)).toEqual([[],[]]);
  });
  it('resigns the owner even on the bot turn; Black ownership records correctly',()=>{
    const m=applyMove(fresh(),move('e2e4')).match;expect(m.active).toBe(1);expect(finishMatch(m,'resign').winner).toBe(1);expect(finishMatch(m,'resign',1)).toBe(m);
    const black=newMatch('owner',[players[1],players[0]],'black',1),ended=finishMatch(black,'resign');expect(ended.winner).toBe(0);expect(recordOf(ended).hostResult).toBe('loss');expect(validateMatch(ended)).toBe(true);
  });
});
describe('bounded search',()=>{
  it.each(['1Q6','2Q5','3Q4'])('finds a forced mate in two, checked against every legal reply (%s)',rank=>{
    const m=matchFromFen('owner',players,'mate2',`7k/8/5K2/8/8/8/8/${rank} w - - 0 1`);expect(validateMatch(m)).toBe(true);
    expect(legalMoves(m).some(move=>applyMove(m,move).match.reason==='checkmate')).toBe(false);
    const best=chooseMove(m,'hard',{deadline:2000,maxDepth:4}).move!;const after=applyMove(m,best).match;expect(after.phase).toBe('play');
    for(const reply of legalMoves(after)){const response=applyMove(after,reply).match;expect(response.phase).toBe('play');expect(legalMoves(response).some(move=>{const end=applyMove(response,move).match;return end.reason==='checkmate'&&end.winner===0;})).toBe(true);}
  });
  it('unwinds every made move and history entry on recursive cancellation',()=>{
    const m=fresh(),pos=matchToPos(m),before=serializeFen(pos),ctx={deadline:Infinity,nodes:0,maxNodes:35,positions:[...m.positions],table:new Map()};
    expect(()=>searchPosition(pos,8,-1e9,1e9,0,ctx)).toThrow();expect(serializeFen(pos)).toBe(before);expect(ctx.positions).toEqual(m.positions);
  });
  it.each(['easy','medium','hard'] as const)('returns a legal fallback under a zero budget (%s)',level=>{const m=fresh(),copy=structuredClone(m),r=chooseMove(m,level,{deadline:0,maxNodes:1});expect(legalMoves(m).map(moveToStr)).toContain(moveToStr(r.move!));expect(m).toEqual(copy);expect(r.depth).toBe(0);});
  it('recognizes a fifty-move draw before static evaluation',()=>{const m=matchFromFen('owner',players,'draw','4k3/8/8/8/8/8/R7/4K3 w - - 100 1');expect(chooseMove(m,'hard').move).toBeNull();});
  it('scores a repeated search node as draw regardless of material',()=>{const m=fresh(),pos=matchToPos(m),key=posKey(pos),ctx={deadline:Infinity,nodes:0,maxNodes:500,positions:[key,key,key],table:new Map()};expect(searchPosition(pos,2,-1e9,1e9,0,ctx)).toBe(0);});
});
describe('durable standalone completion',()=>{
  it('only marks success after writing and retries idempotently',()=>{let fail=true;const memory=new Map<string,string>(),write=vi.fn((k:string,v:string)=>{if(fail)throw Error('full');memory.set(k,v);});vi.stubGlobal('localStorage',{getItem:(k:string)=>memory.get(k)??null,setItem:write});const m=finishMatch(fresh(),'resign');expect(persistStandaloneResult(m)).toBe(false);fail=false;expect(persistStandaloneResult(m)).toBe(true);expect(persistStandaloneResult(m)).toBe(true);expect(write).toHaveBeenCalledTimes(2);});
});
