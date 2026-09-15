import {BOARD,GROUPS} from './board';
import {canUpgrade,upgradeCost} from './economy';
import type {Command,Match} from './model';
import {next} from './rng';
export type Observation=Pick<Match,'id'|'revision'|'players'|'active'|'phase'|'properties'|'turn'|'builtThisTurn'>;
export function observation(s:Match):Observation{return structuredClone({id:s.id,revision:s.revision,players:s.players,active:s.active,phase:s.phase,properties:s.properties,turn:s.turn,builtThisTurn:s.builtThisTurn});}
function value(s:Observation,id:number,seat:number){const t=BOARD[id],same=BOARD.filter(b=>b.id!==id&&(t.group>=0?b.group===t.group:b.kind===t.kind)&&s.properties[b.id].owner===seat).length;return t.price*(1+same*.4);}
// Independent public-information sampling; never reads the match RNG or decks.
function traffic(s:Observation,seat:number){const visits=Array(32).fill(0);let seed=(s.revision*2654435761+seat*97+71)>>>0;for(let sample=0;sample<32;sample++)s.players.forEach((p,i)=>{if(i===seat||p.bankrupt)return;let pos=p.position;for(let turn=0;turn<6;turn++){let r;[r,seed]=next(seed);const d=1+Math.floor(r*6);[r,seed]=next(seed);pos=(pos+d+1+Math.floor(r*6))%32;visits[pos]+=1/32;}});return visits;}
export function choose(s:Observation):Command{const seat=s.active,p=s.players[seat],reserve=p.skill==='easy'?150:p.skill==='medium'?250:350;
 switch(s.phase){case 'card':return{type:'card'};case 'jail':return{type:p.cash>reserve+50?'bail':'jail-roll'};
 case 'buy':{const t=BOARD[p.position];return{type:p.cash>=t.price&&(p.cash-t.price>=reserve||value(s,t.id,seat)>t.price*1.5)?'buy':'decline'};}
 case 'roll':{if(s.builtThisTurn)return{type:'roll'};const visits=p.skill==='hard'?traffic(s,seat):null,ids=BOARD.filter(t=>canUpgrade(s,t.id,seat)&&p.cash-upgradeCost(s,t.id,seat)>=reserve).sort((a,b)=>{const score=(id:number)=>{const g=GROUPS[BOARD[id].group],level=s.properties[id].level;return (g.rents[level+1]-g.rents[level])*(visits?visits[id]+.1:1)/upgradeCost(s,id,seat);};return score(b.id)-score(a.id);});return ids.length?{type:'upgrade',tile:ids[0].id}:{type:'roll'};}
 default:return{type:'roll'};}}