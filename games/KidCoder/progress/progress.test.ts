import { describe, expect, it, vi } from 'vitest';
import { completeMission, persistMission, readProgress } from './progress';
import { CAMPAIGN, seq } from '../content/campaign';
import { StudentProfile, Grade } from '../../../types';
import { initializeStats } from '../../../services/achievementService';
import { getDailyStarsEarned, migrateProfile } from '../../../services/profileService';

function profile(): StudentProfile {
    const p: StudentProfile = { id:'test',name:'Rover',age:7,grade:Grade.Grade1,avatarId:0,currentAvatarId:'avatar_01',currentThemeId:'default',stars:42,
        ownedAvatarIds:[],ownedThemeIds:[],ownedImageIds:[],history:[],gameHistory:[{id:'legacy',date:'2026-01-01',gameType:'kidcoder',score:100,maxScore:100,starsEarned:3,difficulty:'1-1',durationSeconds:0}],shopDailyPhotos:[],achievements:[] };
    p.stats=initializeStats(p); return p;
}
describe('KidCoder rewards and migration',()=>{
    it('attributes only new badge rewards to the day of an improvement',()=>{
        vi.useFakeTimers();
        try {
            vi.setSystemTime(new Date('2026-09-07T10:00:00+07:00'));
            const m=CAMPAIGN[2], first=completeMission(profile(),m,[...seq('LRLRLR'),...m.solution],30);
            expect(getDailyStarsEarned(first.profile)).toBe(1);
            vi.setSystemTime(new Date('2026-09-08T10:00:00+07:00'));
            const second=completeMission(first.profile,m,m.solution,20);
            expect(getDailyStarsEarned(second.profile)).toBe(2);
            const repeated=completeMission(second.profile,m,m.solution,20);
            expect(getDailyStarsEarned(repeated.profile)).toBe(2);
            expect(repeated.profile.gameHistory.find(g=>g.difficulty===`v2:${m.id}`)!.starAwards).toHaveLength(2);
        } finally { vi.useRealTimers(); }
    });
    it('rolls back a failed write, then retries once without touching another profile',()=>{
        const profiles=[profile(),{...profile(),id:'other',stars:123}],snapshot=structuredClone(profiles),m=CAMPAIGN[0];
        const failed=persistMission(profiles,'test',m,m.solution,10,()=>{throw new Error('quota');});
        expect(failed.ok).toBe(false);expect(failed.profiles).toBe(profiles);expect(profiles).toEqual(snapshot);
        let writes=0;const write=()=>{writes++;};
        const retry=persistMission(profiles,'test',m,m.solution,10,write);expect(retry.earned).toBe(3);
        const again=persistMission(retry.profiles,'test',m,m.solution,10,write);expect(again.earned).toBe(0);expect(writes).toBe(1);
        expect(again.profiles[1]).toEqual(snapshot[1]);
        expect(persistMission(profiles,'test',m,seq('F'),0,write).ok).toBe(false);
    });
    it('awards once, survives JSON round trip and does not mutate the source',()=>{
        const before=profile(), snapshot=structuredClone(before), m=CAMPAIGN[0];
        const first=completeMission(before,m,m.solution,10);
        expect(first.earned).toBe(3); expect(before).toEqual(snapshot);
        const loaded=migrateProfile(JSON.parse(JSON.stringify(first.profile)));
        const second=completeMission(loaded,m,m.solution,10);
        expect(second.earned).toBe(0); expect(second.changed).toBe(false); expect(second.profile.stars).toBe(first.profile.stars);
        expect(second.profile.gameHistory.filter(g=>g.id==='legacy')).toHaveLength(1);
        expect(second.profile.gameHistory.filter(g=>g.difficulty==='v2:earth-01')).toHaveLength(1);
    });
    it('only pays newly earned badges on an improved solution',()=>{
        const m=CAMPAIGN[2], long=[...seq('LRLRLR'),...m.solution];
        const first=completeMission(profile(),m,long,30); expect(first.earned).toBe(1);
        const second=completeMission(first.profile,m,m.solution,20); expect(second.earned).toBe(2);
        expect(second.profile.stats!.totalGamesPlayed).toBe(first.profile.stats!.totalGamesPlayed);
        expect(second.profile.stats!.totalStarsEarned-first.profile.stats!.totalStarsEarned).toBe(2);
        expect(second.profile.kidCoder!.missions[m.id].badges).toHaveLength(3);
        expect(second.profile.gameHistory.find(g=>g.difficulty===`v2:${m.id}`)!.starsEarned).toBe(3);
    });
    it('does not award failures, practice seeds or content revisions again',()=>{
        const p=profile(),m=CAMPAIGN[0];
        expect(completeMission(p,m,seq('F'),0).changed).toBe(false);
        expect(completeMission(p,{...m,practice:true,seed:9},m.solution,0).changed).toBe(false);
        const a=completeMission(p,m,m.solution,0);
        expect(completeMission(a.profile,{...m,seed:123},m.solution,0).earned).toBe(0);
    });
    it('normalizes missing/malformed progress without changing currency',()=>{
        expect(readProgress(undefined)).toEqual({version:2,missions:{}});
        expect(readProgress({version:2,missions:{bad:{badges:['complete']},'earth-01':{badges:['coder']}}}).missions).toEqual({});
        const p=profile(); expect(migrateProfile(p).stars).toBe(42);
        const malformed=readProgress({version:2,missions:{'earth-01':{badges:['complete','complete','unknown'],program:null}}});
        expect(malformed.missions['earth-01'].badges).toEqual(['complete']); expect(malformed.missions['earth-01'].program).toEqual([]);
    });
});
