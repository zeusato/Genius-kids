import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import type {StudentProfile} from '../../types';
import type {Match,Player} from './model';
import {newMatch,resolveTurn,positionKey,validateMatch} from './engine';
import {clearOAnQuanData,loadDraft,saveDraft,loadParty,saveParty,persistResult} from './persistence';
const party:Player[]=[{id:'host',name:'An',kind:'human',level:'medium',avatar:'avatar_01'},{id:'guest',name:'Bông',kind:'human',level:'medium',avatar:'avatar_02'}];
const profile=(id='owner'):StudentProfile=>({id,name:'An',age:8,grade:3,avatarId:0,currentAvatarId:'avatar_01',currentThemeId:'default',stars:30,ownedAvatarIds:[],ownedThemeIds:[],ownedImageIds:[],history:[],gameHistory:[],shopDailyPhotos:[]});
function ended(result:'win'|'draw'|'loss'='win'):Match{
  const s=newMatch('owner',party,'unique-match');s.board=Array(12).fill(0);s.board[2]=1;s.board[11]=2;s.quan=[false,false];
  const other=result==='draw'?25:result==='win'?15:35;
  s.banks=[{dân:47-other,quan:1},{dân:other,quan:1}];s.history=[positionKey(s)];s.elapsed=125400;
  const over=resolveTurn(s,{pit:2,direction:-1}).state;if(!validateMatch(over))throw Error('bad fixture');return over;
}
beforeEach(()=>{const memory=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)});});
afterEach(()=>vi.unstubAllGlobals());
describe('Ô ăn quan profile persistence',()=>{
  it('restores a committed turn exactly, isolated by owner',()=>{const s=resolveTurn(newMatch('owner',party,'id'),{pit:2,direction:1}).state;expect(saveDraft(s)).toBe(true);expect(loadDraft('owner')).toEqual({match:s,error:false});expect(loadDraft('other').match).toBeNull();});
  it('rejects corrupt, foreign and incompatible saves',()=>{for(const value of ['{',JSON.stringify({...ended(),owner:'other'}),JSON.stringify({...ended(),rulesVersion:'old'}),JSON.stringify({...ended(),winner:3})]){localStorage.setItem('o-an-quan:owner:draft-v1',value);expect(loadDraft('owner')).toEqual({match:null,error:true});}});
  it('keeps play available when storage is denied',()=>{vi.stubGlobal('localStorage',{getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('full');}});expect(saveDraft(ended())).toBe(false);expect(loadDraft('owner').error).toBe(true);expect(loadParty('owner')).toBeNull();expect(()=>saveParty('owner',party)).not.toThrow();});
  it('validates saved seats and never restores a bot host',()=>{saveParty('owner',party);expect(loadParty('owner')).toEqual(party);for(const bad of [[party[0],{...party[1],id:'host'}],[{...party[0],kind:'bot'},party[1]],[party[0],{...party[1],level:'invalid'}]]){saveParty('owner',bad as Player[]);expect(loadParty('owner')).toBeNull();}});
  it.each(['win','draw','loss'] as const)('records host %s with exact raw points and no currency',result=>{const before=[profile(),profile('other')],copy=structuredClone(before),s=ended(result),r=persistResult(before,'owner',s,()=>{});expect(r.ok).toBe(true);expect(before).toEqual(copy);expect(r.profiles[1]).toBe(before[1]);expect(r.profiles[0].stars).toBe(30);expect(r.profiles[0].gameHistory[0]).toMatchObject({gameType:'o-an-quan',starsEarned:0,durationSeconds:125,oAnQuan:{hostResult:result,unclaimed:0,reason:'empty'}});expect(r.profiles[0].stats?.gameWins['o-an-quan']||0).toBe(result==='win'?1:0);expect(r.profiles[0].stats?.totalGamesPlayed).toBe(1);});
  it('records an ended game once across retries and reloads',()=>{const first=persistResult([profile()],'owner',ended(),()=>{}),write=vi.fn(),second=persistResult(first.profiles,'owner',ended(),write);expect(second.profiles).toBe(first.profiles);expect(second.ok).toBe(true);expect(write).not.toHaveBeenCalled();expect(second.profiles[0].gameHistory).toHaveLength(1);});
  it('does not publish a failed write and allows retry',()=>{const before=[profile()],copy=structuredClone(before);expect(persistResult(before,'owner',ended(),()=>{throw Error('full');})).toEqual({ok:false,profiles:before});expect(before).toEqual(copy);expect(persistResult(before,'owner',ended(),()=>{}).ok).toBe(true);});
  it('rejects unfinished, unknown-owner and cross-profile results',()=>{const write=vi.fn();expect(persistResult([profile()],'owner',newMatch('owner',party,'live'),write).ok).toBe(false);expect(persistResult([profile()],'other',ended(),write).ok).toBe(false);expect(persistResult([],'owner',ended(),write).ok).toBe(false);expect(write).not.toHaveBeenCalled();});
  it('deletes only the requested profile draft, party and preferences',()=>{saveDraft(ended());saveParty('owner',party);saveParty('other',party);localStorage.setItem('o-an-quan:owner:prefs','{}');clearOAnQuanData('owner');expect(loadDraft('owner').match).toBeNull();expect(loadParty('owner')).toBeNull();expect(localStorage.getItem('o-an-quan:owner:prefs')).toBeNull();expect(loadParty('other')).toEqual(party);});
});
