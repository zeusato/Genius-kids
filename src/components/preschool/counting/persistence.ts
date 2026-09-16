import type { StudentProfile, GameResult } from '../../../../types';
import { processGameReward, type TestReward } from '../../../../services/rewardService';
import { checkAchievements, initializeStats, updateStats } from '../../../../services/achievementService';
import { readProgress, validSession, type Session } from './model';

export type PendingSession = Session & { reward?: TestReward };
/** Write progress, checkpoint and reward together against the most recent profile snapshot. */
export function persistCounting(profiles: StudentProfile[], owner: string, session: PendingSession, write: (next: StudentProfile[]) => void) {
    const fail = { ok:false, profiles, earned:0, session, image:undefined as TestReward['image'] | undefined };
    const profile = profiles.find(p => p.id===owner);
    if (!profile || !validSession(session,owner)) return fail;
    const resultId=`counting-v1:${owner}:${session.id}`;
    const existing=profile.gameHistory.find(r => r.id===resultId);
    if (existing) return { ...fail,ok:true,earned:existing.starsEarned };
    const progress=readProgress(profile.counting,owner), previous=progress.drafts[session.activity];
    // A callback from an older session cannot replace a newer checkpoint.
    if (previous && previous.id!==session.id && previous.seed>session.seed) return fail;
    const savedOutcomes=previous?.id===session.id ? previous.outcomes : [];
    if (savedOutcomes.length>session.outcomes.length) return fail;
    const group={...progress.skills[session.activity]};
    for (const o of session.outcomes.slice(savedOutcomes.length)) {
        const old=group[o.value] || { independent:0,recent:[],sessions:[] };
        group[o.value]={ independent:old.independent+(o.independent?1:0),recent:[...old.recent,o.independent].slice(-5),sessions:o.independent?[...new Set([...old.sessions,session.id])].slice(-20):old.sessions };
    }
    progress.skills[session.activity]=group;
    progress.lastLevel[session.activity]=session.level;
    progress.drafts[session.activity]=session;
    let updated: StudentProfile={...profile,counting:progress}, pending=session, earned=0, image:TestReward['image']|undefined;
    if (session.phase==='complete') {
        const score=session.outcomes.filter(o=>o.independent).length, ratio=score/session.rounds.length;
        const medal=ratio>=.9?'gold':ratio>=.6?'silver':score>0?'bronze':null;
        const reward=session.reward || processGameReward(profile,medal).reward;
        pending={...session,reward}; earned=reward.stars;
        // The shared duplicate-card dialog promises exchange stars. Learning rewards
        // do not purchase exchanges, so only reveal a newly earned card.
        image=reward.image&&!profile.ownedImageIds.includes(reward.image.id)?reward.image:undefined;
        updated={...updated,stars:profile.stars+earned,ownedImageIds:image?[...new Set([...profile.ownedImageIds,image.id])]:profile.ownedImageIds};
        delete progress.drafts[session.activity];
        if(session.activity==='learn') progress.stickers=[...new Set([...progress.stickers,session.rounds[0].value])];
        const record:GameResult={id:resultId,date:new Date().toISOString(),gameType:session.activity==='add'?'preschool-addition':session.activity==='compare'?'preschool-compare':'preschool-counting',score,maxScore:session.rounds.length,durationSeconds:Math.round(session.seconds),starsEarned:earned,difficulty:session.level===1?'easy':session.level===2?'medium':'hard'};
        updated.gameHistory=[...profile.gameHistory,record];
        updated.stats=updateStats(profile.stats||initializeStats(profile),{type:'GAME_COMPLETE',gameResult:record});
        if(image && !profile.ownedImageIds.includes(image.id)) updated.stats=updateStats(updated.stats,{type:'GAIN_CARD',isLegendary:image.rarity==='legendary',isNew:true,totalCards:updated.ownedImageIds.length});
        const achievements=checkAchievements(updated); updated.achievements=achievements.updatedAchievements; updated.stars+=achievements.rewards;
    }
    const next=profiles.map(p=>p.id===owner?updated:p);
    try { write(next); } catch { return {...fail,session:pending}; }
    return {ok:true,profiles:next,earned,session:pending,image};
}
