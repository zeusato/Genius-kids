import type { StudentProfile } from '../../../types';
import { processGameReward } from '../../../services/rewardService';
import type { ArtworkDoc, PotteryProgress } from '../model';
import { rewardKeys } from '../engine/document';
import { CHALLENGES, evaluate } from '../content/catalog';
export function persistPottery(profiles: StudentProfile[], owner: string, art: ArtworkDoc, write: (profiles: StudentProfile[]) => void) {
  const old=profiles.find(p=>p.id===owner),fail={ok:false,profiles,earned:0};
  if(!old||art.student!==owner)return fail;
  const progress:PotteryProgress=old.pottery||{version:1,claimed:[],badges:[]};
  const keys=rewardKeys(art),challenge=CHALLENGES.find(c=>c.id===art.challenge);
  if(keys.length&&challenge&&evaluate(art,challenge).pass)keys.push('challenge:'+challenge.id);
  const fresh=keys.filter(k=>!progress.claimed.includes(k));if(!fresh.length)return {...fail,ok:true};
  const claimed=[...progress.claimed,...fresh],badges=[...progress.badges],add=(key:string,name:string)=>{if(claimed.includes(key)&&!badges.includes(name))badges.push(name);};
  add('first','Góc gốm nhỏ');add('hands','Bàn tay khéo');add('lesson:color-ring','Bạn của sắc men');
  const earned=fresh.length,updated=processGameReward(old,null,earned).updatedProfile;
  const next=profiles.map(p=>p.id===owner?{...updated,pottery:{version:1 as const,claimed,badges}}:p);
  try{write(next);return {ok:true,profiles:next,earned};}catch{return fail;}
}
