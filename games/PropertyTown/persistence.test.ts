import {describe,it,expect,vi,afterEach} from 'vitest';
import {loadDraft,saveDraft,persistResult} from './persistence';
import {createMatch,validateMatch,reduce,actor} from './engine';
import {choose,observation} from './bot';
import type {StudentProfile} from '../../types';
const make=()=>createMatch('owner',[{name:'An',kind:'human',skill:'medium',cash:1500,position:0},{name:'Bình',kind:'bot',skill:'medium',cash:1500,position:0}],'family',13,'save');
afterEach(()=>vi.unstubAllGlobals());
describe('Property Town saves',()=>{
 it('restores the committed decision with no repeated payment',()=>{const storage=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>storage.get(k)||null,setItem:(k:string,v:string)=>storage.set(k,v)});let s=make();s.first=s.active=0;s.players[0].position=1;s.phase='buy';s=reduce(s,{id:s.id,revision:s.revision,actor:0,command:{type:'buy'}});expect(saveDraft(s)).toBe(true);const n=loadDraft('owner').match!;expect(n.players[0].cash).toBe(1300);expect(n.phase).toBe('roll');expect(reduce(n,{id:n.id,revision:n.revision,actor:0,command:{type:'buy'}})).toBe(n);});
 it('rejects corrupt money, duplicate cards and wrong ownership',()=>{const s=make();expect(validateMatch({...s,owner:'other'},'owner')).toBe(false);const negative=structuredClone(s);negative.players[0].cash=-1;expect(validateMatch(negative,'owner')).toBe(false);const cards=structuredClone(s);cards.decks.chance[0]=cards.decks.chance[1];expect(validateMatch(cards,'owner')).toBe(false);const prop=structuredClone(s);prop.properties[0].owner=0;expect(validateMatch(prop,'owner')).toBe(false);});
 it('reports quota failures without throwing',()=>{vi.stubGlobal('localStorage',{setItem:()=>{throw Error('quota');},getItem:()=>'{bad'});expect(saveDraft(make())).toBe(false);expect(loadDraft('owner')).toEqual({match:null,error:true});});
 it('records a completed match only once and awards no stars',()=>{let s=make();while(s.phase!=='over')s=reduce(s,{id:s.id,revision:s.revision,actor:actor(s),command:choose(observation(s))});const profile={id:'owner',name:'An',gameHistory:[],stats:{totalGamesPlayed:0,gameWins:{}}} as unknown as StudentProfile;const write=vi.fn();const saved=persistResult([profile],'owner',s,write);expect(saved.ok).toBe(true);expect(saved.profiles[0].gameHistory[0].starsEarned).toBe(0);const again=persistResult(saved.profiles,'owner',s,write);expect(again.profiles).toBe(saved.profiles);expect(write).toHaveBeenCalledTimes(1);});
});
