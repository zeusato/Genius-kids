import {BOARD,GROUPS} from './board';
import type {Match} from './model';
export function fullGroup(s:Pick<Match,'properties'>,tile:number,seat:number){const g=BOARD[tile].group;return g>=0&&BOARD.filter(t=>t.group===g).every(t=>s.properties[t.id].owner===seat);}
export function rent(s:Pick<Match,'properties'>,id:number){const t=BOARD[id],p=s.properties[id];if(p.owner===null)return 0;if(t.kind==='shop')return GROUPS[t.group].rents[p.level]*(p.level===0&&fullGroup(s,id,p.owner)?2:1);const count=BOARD.filter(b=>b.kind===t.kind&&s.properties[b.id].owner===p.owner).length;return t.kind==='station'?(count===2?200:100):t.kind==='utility'?(count===2?160:80):0;}
export function assets(s:Pick<Match,'players'|'properties'>,seat:number){return s.players[seat].cash+BOARD.reduce((v,t)=>v+(s.properties[t.id].owner===seat?t.price+s.properties[t.id].level*(GROUPS[t.group]?.upgrade||0):0),0);}
export function upgradeCost(_s:Pick<Match,'players'|'properties'>,id:number,_seat:number){return GROUPS[BOARD[id].group]?.upgrade||0;}
export function canUpgrade(s:Pick<Match,'players'|'properties'>,id:number,seat:number){const t=BOARD[id],p=s.properties[id];return t?.kind==='shop'&&p.owner===seat&&p.level<2&&(p.level===0||fullGroup(s,id,seat))&&!s.players[seat].bankrupt&&s.players[seat].cash>=upgradeCost(s,id,seat);}

