import { describe, expect, it } from 'vitest';
import { createFarm, execute, advanceTime } from '../src/core/engine';
import { canWorkTile, ownedAt, isWater } from '../src/core/world';
import { buildingStep, productBuilding } from '../src/core/guidance';
import { homeLevel, upgradePrice } from '../src/core/progression';
import { roadAssetUrl, roadName } from '../src/render/roadAssets';
import { constructionProgress, countdown } from '../src/ui/constructionProgress';
import { resourceReward } from '../src/core/harvesting';
const now = 1800000000000;

describe('starter reserves and guided arrival', () => {
    it('guarantees accessible tier-one wood, stone and ore across seeds', () => {
        for (let seed = 0; seed < 30; seed++) {
            const s = createFarm(now, seed);
            const guaranteed = s.world.obstacles.filter(o => o.tier === 1 && ([25,28].includes(o.x) && [3,6,9,12,15].includes(o.z) || [25,28].includes(o.z) && [3,6,9,12,15].includes(o.x)));
            expect(guaranteed).toHaveLength(20);
            for (const o of guaranteed) { expect(ownedAt(s.world,o.x,o.z)).toBe(true); expect(isWater(s.world,o.x,o.z)).toBe(false); expect(canWorkTile(s.world,o.x,o.z)).toBe(true); }
            expect(guaranteed.filter(o=>o.kind==='tree')).toHaveLength(8);
            expect(guaranteed.filter(o=>o.kind==='rock')).toHaveLength(8);
            expect(guaranteed.filter(o=>o.kind==='ore')).toHaveLength(4);
        }
    });
    it('lets a fresh farm gather enough to upgrade Home without buying land or waiting for regrowth', () => {
        let s = createFarm(now, 42);
        const need = upgradePrice(s.entities[0]).items;
        for (const kind of ['tree','rock'] as const) {
            const item = kind === 'tree' ? 'wood' : 'stone';
            for(const o of s.world.obstacles.filter(o=>o.tier===1 && o.kind===kind)) {
                if (s.inventory[item] >= need[item]!) break;
                expect(resourceReward(s.world,o).items[item]).toBeGreaterThanOrEqual(4);
                const result = execute(s,{type:'clear',obstacleId:o.id,generation:o.generation ?? 0});
                expect(result.ok,result.message).toBe(true); s=result.state;
            }
        }
        const result = execute(s,{type:'upgrade',entityId:s.entities[0].id});
        expect(result.ok,result.message).toBe(true); expect(result.state.entities[0].construction?.target).toBe(2);
    });
    it('routes a locked building through Home then missing prerequisites and the build menu', () => {
        const s=createFarm(now,42);
        expect(buildingStep(s,'mill')).toMatchObject({asset:'home',action:'upgrade',level:2});
        s.entities[0].level=2;
        expect(buildingStep(s,'mill')).toEqual({asset:'mill',action:'build',level:1});
        expect(buildingStep(s,'home',3)).toMatchObject({asset:'mill',action:'build'});
        expect(productBuilding('flour')).toMatchObject({asset:'mill',level:1});
    });
    it('keeps roads at the completed Home visual tier until construction ends', () => {
        const s=createFarm(now,42), home=s.entities[0]; home.level=4;
        home.construction={id:'job-test',target:5,duration:60000,startedAt:s.clock,readyAt:s.clock+60000,cost:{coins:0,items:{}}};
        expect(roadAssetUrl(homeLevel(s))).toBe(roadAssetUrl(1));
        const done=advanceTime(s,now+60001);
        expect(homeLevel(done)).toBe(5); expect(roadAssetUrl(homeLevel(done))).toBe(roadAssetUrl(5));
        expect(new Set([1,5,10,15,20,25].map(roadAssetUrl)).size).toBe(6);
        expect(roadName(4)).toBe('Đường đất'); expect(roadName(24)).toBe(roadName(20));
    });
    it('handles active, sped up, waiting and completed construction countdowns', () => {
        const job={readyAt:60000,duration:60000};
        expect(constructionProgress(job,15000)).toEqual({remaining:45000,percent:25});
        expect(constructionProgress({...job,readyAt:30000},15000).percent).toBe(75);
        expect(constructionProgress({...job,waitingFor:'batch'},15000).percent).toBe(0);
        expect(constructionProgress(job,70000)).toEqual({remaining:0,percent:100});
        expect(countdown(59999)).toBe('01:00'); expect(countdown(1000)).toBe('00:01'); expect(countdown(0)).toBe('00:00'); expect(countdown(90061000)).toBe('1n 01:01:01');
    });
});
