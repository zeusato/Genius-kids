export type Mode='family';
export type Skill='easy'|'medium'|'hard';
export interface Player {name:string;kind:'human'|'bot';skill:Skill;cash:number;position:number;jailed?:boolean;jailAttempts?:number;bankrupt?:boolean}
export interface Property {owner:number|null;level:number}
export type Phase='roll'|'buy'|'card'|'jail'|'over';
export interface TownEvent {kind:'dice'|'move'|'money'|'build'|'notice';text:string;seat?:number;path?:number[];tile?:number;amount?:number}
export interface Match {version:2;id:string;owner:string;revision:number;mode:Mode;players:Player[];active:number;first:number;turn:number;phase:Phase;rng:number;properties:Property[];dice:[number,number];doubles:number;extraRoll:boolean;bonusRolls:number;builtThisTurn:boolean;decks:{community:string[];chance:string[]};discard:{community:string[];chance:string[]};card:string|null;events:TownEvent[];log:string[];bank:number;endReason:string|null;elapsed:number}
export type Command={type:'roll'}|{type:'buy'}|{type:'decline'}|{type:'card'}|{type:'bail'}|{type:'jail-roll'}|{type:'upgrade';tile:number};
export interface Action {id:string;revision:number;actor:number;command:Command}
export const COLORS=['#208f88','#e88b54','#657bc4','#ca6885'];
export const ANIMALS=['Gấu','Cáo','Thỏ','Mèo'];
export interface TownRecord {version:2;hostWon:boolean;mode:Mode;rounds:number;players:{name:string;kind:'human'|'bot';assets:number}[];endReason:string}

