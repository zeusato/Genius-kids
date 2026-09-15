import {BOARD} from './board';
import {CARD_TEXT,cardDeck,cardKey,deckIds,type Deck} from './cards';
import {canUpgrade,fullGroup,rent,upgradeCost} from './economy';
import {next,shuffle} from './rng';
import type {Action,Command,Match,Mode,Player} from './model';
const integer=(v:unknown,min=0,max=Number.MAX_SAFE_INTEGER):v is number=>Number.isSafeInteger(v)&&Number(v)>=min&&Number(v)<=max;
export function partyValid(p:unknown):p is Player[]{return Array.isArray(p)&&p.length>=2&&p.length<=4&&p.some(x=>x?.kind==='human')&&p.every(x=>x&&typeof x.name==='string'&&x.name.trim().length>0&&x.name.length<=24&&['human','bot'].includes(x.kind)&&['easy','medium','hard'].includes(x.skill));}
export function createMatch(owner:string,party:Player[],mode:Mode,seed:number,id:string=crypto.randomUUID()):Match{
 if(!owner||!partyValid(party)||mode!=='family')throw Error('Bàn chơi chưa hợp lệ');
 const [community,r1]=shuffle(deckIds('community'),seed),[chance,r2]=shuffle(deckIds('chance'),r1),[r,rng]=next(r2),first=Math.floor(r*party.length);
 return{version:2,id,owner,revision:0,mode,players:party.map(p=>({...p,name:p.name.trim(),cash:1500,position:0,jailed:false,jailAttempts:0,bankrupt:false})),active:first,first,turn:0,phase:'roll',rng,properties:BOARD.map(()=>({owner:null,level:0})),dice:[1,1],doubles:0,extraRoll:false,bonusRolls:0,builtThisTurn:false,decks:{community,chance},discard:{community:[],chance:[]},card:null,events:[],log:['Mỗi người nhận 1.500 xu. Qua ô Bắt đầu nhận 200 xu.'],bank:-1500*party.length,endReason:null,elapsed:0};
}
export function actor(s:Pick<Match,'active'>){return s.active;}
function say(s:Match,text:string){s.events.push({kind:'notice',text});}
function money(s:Match,from:number|null,to:number|null,amount:number,reason:string){if(amount<=0)return;if(from===null)s.bank-=amount;else s.players[from].cash-=amount;if(to===null)s.bank+=amount;else s.players[to].cash+=amount;s.events.push({kind:'money',text:`${from===null?'Ngân hàng':s.players[from].name} → ${to===null?'Ngân hàng':s.players[to].name}: ${amount} xu · ${reason}`,amount,seat:to??from??0});}
function endTurn(s:Match){if(s.phase==='over')return;if((s.extraRoll||s.bonusRolls>0)&&!s.players[s.active].bankrupt){if(s.extraRoll)s.extraRoll=false;else s.bonusRolls--;s.phase='roll';say(s,'Được gieo thêm một lần trong lượt này!');return;}s.doubles=0;s.extraRoll=false;s.bonusRolls=0;s.builtThisTurn=false;s.turn++;do{s.active=(s.active+1)%s.players.length;}while(s.players[s.active].bankrupt);s.phase=s.players[s.active].jailed?'jail':'roll';}
// Insolvency transfers the estate; only the remaining cash changes hands.
function charge(s:Match,amount:number,recipient:number|null,reason:string){const p=s.players[s.active];if(p.cash>=amount){money(s,s.active,recipient,amount,reason);return true;}money(s,s.active,recipient,p.cash,reason);p.bankrupt=true;p.jailed=false;p.jailAttempts=0;s.extraRoll=false;s.bonusRolls=0;
 s.properties.forEach(prop=>{if(prop.owner===s.active){prop.owner=recipient;if(recipient===null)prop.level=0;}});
 say(s,`${p.name} phá sản. ${recipient===null?'Tài sản được trả về ngân hàng.':`Tài sản chuyển cho ${s.players[recipient].name}.`}`);
 const survivors=s.players.map((x,i)=>x.bankrupt?-1:i).filter(i=>i>=0);if(survivors.length===1){s.phase='over';s.endReason=`${s.players[survivors[0]].name} là người cuối cùng còn lại và chiến thắng!`;say(s,s.endReason);}return false;
}
function move(s:Match,steps:number){const p=s.players[s.active],path=[p.position];for(let i=0;i<Math.abs(steps);i++){p.position=(p.position+(steps<0?31:1))%32;path.push(p.position);if(p.position===0&&steps>0)money(s,null,s.active,200,'Qua Bắt đầu');}s.events.push({kind:'move',text:`${p.name} đến ${BOARD[p.position].name}`,seat:s.active,path,tile:p.position});}
function teleport(s:Match,target:number){const p=s.players[s.active];s.events.push({kind:'move',text:`${p.name} đến ${BOARD[target].name}`,seat:s.active,path:[p.position,target],tile:target});p.position=target;}
function jail(s:Match){teleport(s,8);const p=s.players[s.active];p.jailed=true;p.jailAttempts=0;s.extraRoll=false;s.bonusRolls=0;say(s,`${p.name} vào tù. Lượt sau chọn nộp 50 xu hoặc thử gieo số kép.`);endTurn(s);}
function draw(s:Match,deck:Deck){if(!s.decks[deck].length){[s.decks[deck],s.rng]=shuffle(s.discard[deck],s.rng);s.discard[deck]=[];}s.card=s.decks[deck].pop()!;s.phase='card';say(s,CARD_TEXT[cardKey(s.card)][0]);}
function land(s:Match,allowCard=true){const t=BOARD[s.players[s.active].position],p=s.properties[t.id];if(t.price){if(p.owner===null){s.phase='buy';return;}if(p.owner!==s.active)charge(s,rent(s,t.id),p.owner,`Thuê ${t.name}`);}
 else if(t.kind==='fee')charge(s,t.fee!,null,t.name);
 else if(allowCard&&(t.kind==='festival'||t.kind==='repair')){draw(s,t.kind==='festival'?'community':'chance');return;}
 else if(allowCard&&(t.kind==='community'||t.kind==='chance')){draw(s,t.kind);return;}endTurn(s);
}
function useCard(s:Match){const id=s.card!,key=cardKey(id),p=s.players[s.active];s.card=null;s.discard[cardDeck(id)].push(id);
 switch(key){
 case 'community-0':money(s,null,s.active,100,'Hội chợ');break;
 case 'community-1':money(s,null,s.active,150,'Đơn hàng');break;
 case 'community-2':charge(s,100,null,'Khu vườn xanh');break;
 case 'community-3':charge(s,100,null,'Biển hiệu mới');break;
 case 'community-4':s.players.forEach((p,i)=>{if(!p.bankrupt)money(s,null,i,50,'Lễ hội');});break;
 case 'community-5':money(s,null,s.active,50,'Ngân hàng hoàn phí');break;
 case 'community-6':charge(s,200,null,'Phí ngân hàng');break;
 case 'community-7':money(s,null,s.active,150,'Tài trợ khu phố');break;
 case 'community-8':charge(s,100,null,'Sửa xe giao hàng');break;
 case 'community-9':money(s,null,s.active,100,'Quà sinh nhật');break;
 case 'chance-0':teleport(s,0);money(s,null,s.active,200,'Về Bắt đầu');break;
 case 'chance-1':{let distance=0;for(let i=1;i<=32;i++){const id=(p.position+i)%32;if(BOARD[id].kind==='shop'&&s.properties[id].owner===null){distance=i;break;}}if(distance){move(s,distance);land(s,false);return;}money(s,null,s.active,50,'Phố đã đủ chủ');break;}
 case 'chance-2':move(s,-3);land(s,false);return;
 case 'chance-3':money(s,null,s.active,100,'Quà bất ngờ');break;
 case 'chance-4':charge(s,150,null,'Sửa xe');break;
 case 'chance-5':jail(s);return;
 case 'chance-6':s.bonusRolls++;say(s,'Xúc xắc may mắn: được thêm một lần gieo!');break;
 case 'chance-7':move(s,3);land(s,false);return;
 case 'chance-8':charge(s,250,null,'Đóng thuế');break;
 case 'chance-9':charge(s,50,null,'Đền chậu hoa');break;
 }endTurn(s);
}
function dice(s:Match){let r;[r,s.rng]=next(s.rng);s.dice[0]=Math.floor(r*6)+1;[r,s.rng]=next(s.rng);s.dice[1]=Math.floor(r*6)+1;s.events.push({kind:'dice',text:`${s.players[s.active].name} gieo ${s.dice[0]} + ${s.dice[1]} = ${s.dice[0]+s.dice[1]} bước`,seat:s.active});return s.dice[0]===s.dice[1];}
export function legal(s:Match,c:Command){const p=s.players[s.active];switch(c.type){case 'roll':return s.phase==='roll';case 'card':return s.phase==='card';case 'buy':return s.phase==='buy'&&p.cash>=BOARD[p.position].price;case 'decline':return s.phase==='buy';case 'upgrade':return s.phase==='roll'&&!s.builtThisTurn&&integer(c.tile,0,31)&&canUpgrade(s,c.tile,s.active);case 'bail':return s.phase==='jail'&&p.cash>=50;case 'jail-roll':return s.phase==='jail';default:return false;}}
export function reduce(s:Match,a:Action):Match{if(s.phase==='over'||a.id!==s.id||a.revision!==s.revision||a.actor!==actor(s)||!legal(s,a.command))return s;const n=structuredClone(s),c=a.command,p=n.players[n.active];n.revision++;n.events=[];
 switch(c.type){
 case 'roll':{const doubled=dice(n);n.doubles=doubled?n.doubles+1:0;n.extraRoll=doubled;if(n.doubles===3){say(n,'Ba lần số kép liên tiếp: vào tù.');jail(n);}else{move(n,n.dice[0]+n.dice[1]);land(n);}break;}
 case 'jail-roll':{const doubled=dice(n);p.jailAttempts=(p.jailAttempts||0)+1;if(doubled){p.jailed=false;p.jailAttempts=0;move(n,n.dice[0]+n.dice[1]);land(n);}else if(p.jailAttempts>=3){const paid=charge(n,50,null,'Ra tù sau ba lần thử');if(paid){p.jailed=false;p.jailAttempts=0;move(n,n.dice[0]+n.dice[1]);land(n);}else endTurn(n);}else{say(n,'Chưa ra số kép. Thử lại ở lượt sau.');endTurn(n);}break;}
 case 'bail':money(n,n.active,null,50,'Nộp phí ra tù');p.jailed=false;p.jailAttempts=0;n.phase='roll';break;
 case 'card':useCard(n);break;
 case 'buy':money(n,n.active,null,BOARD[p.position].price,'Mua công trình');n.properties[p.position].owner=n.active;n.events.push({kind:'build',text:`${p.name} sở hữu ${BOARD[p.position].name}`,tile:p.position});endTurn(n);break;
 case 'decline':endTurn(n);break;
 case 'upgrade':{n.builtThisTurn=true;money(n,n.active,null,upgradeCost(n,c.tile,n.active),'Xây dựng');n.properties[c.tile].level++;n.events.push({kind:'build',text:`${BOARD[c.tile].name}: ${n.properties[c.tile].level===1?'Mở rộng':'Công trình nổi bật'}!`,tile:c.tile});break;}
 }n.log=[...n.log,...n.events.filter(e=>e.kind!=='move').map(e=>e.text)].slice(-80);return n;
}
export function winners(s:Match){return s.players.map((p,i)=>p.bankrupt?-1:i).filter(i=>i>=0);}
export function validateMatch(v:unknown,owner:string):v is Match{try{const s=v as Match;if(!s||s.version!==2||s.owner!==owner||typeof s.id!=='string'||!partyValid(s.players)||!integer(s.revision)||!integer(s.rng,0,0xffffffff)||!integer(s.turn)||!integer(s.first,0,s.players.length-1)||!integer(s.active,0,s.players.length-1)||s.mode!=='family'||!['roll','buy','card','jail','over'].includes(s.phase)||!integer(s.elapsed)||!integer(s.doubles,0,2)||typeof s.extraRoll!=='boolean'||typeof s.builtThisTurn!=='boolean'||!integer(s.bonusRolls)||!Number.isSafeInteger(s.bank)||!Array.isArray(s.properties)||s.properties.length!==32||!Array.isArray(s.events)||!Array.isArray(s.log)||!Array.isArray(s.dice)||s.dice.length!==2||!s.dice.every(d=>integer(d,1,6)))return false;
 if(!s.players.every(p=>integer(p.cash)&&integer(p.position,0,31)&&typeof p.bankrupt==='boolean'&&typeof p.jailed==='boolean'&&integer(p.jailAttempts,0,2)&&(!p.jailed||p.position===8)&&(!p.bankrupt||p.cash===0)))return false;
 if(!s.properties.every((p,i)=>p&&integer(p.level,0,2)&&(p.owner===null||integer(p.owner,0,s.players.length-1)&&!s.players[p.owner].bankrupt)&&(!BOARD[i].price?p.owner===null&&p.level===0:true)&&(p.owner!==null||p.level===0)&&(BOARD[i].kind==='shop'||p.level===0)))return false;
 if(s.properties.some((p,id)=>p.level===2&&!fullGroup(s,id,p.owner!)))return false;
 const cards=[...s.decks.community,...s.decks.chance,...s.discard.community,...s.discard.chance,...(s.card?[s.card]:[])],expected=[...deckIds('community'),...deckIds('chance')];if(cards.length!==20||new Set(cards).size!==20||cards.some(id=>!expected.includes(id)))return false;
 if(['community','chance'].some(d=>[...s.decks[d as Deck],...s.discard[d as Deck]].some(id=>cardDeck(id)!==d)))return false;
 if((s.phase==='card')!==!!s.card||(s.phase==='over')!==!!s.endReason||(s.phase==='jail')!==(s.players[s.active].jailed&&s.phase!=='over'))return false;
 if(s.phase!=='over'&&s.players[s.active].bankrupt||s.phase==='over'&&winners(s).length!==1)return false;
 if(s.phase==='buy'&&(!BOARD[s.players[s.active].position].price||s.properties[s.players[s.active].position].owner!==null))return false;
 return s.bank+s.players.reduce((sum,p)=>sum+p.cash,0)===0;
 }catch{return false;}}

