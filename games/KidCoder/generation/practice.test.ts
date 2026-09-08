import { describe,expect,it } from 'vitest';
import { CAMPAIGN,CHAPTERS } from '../content/campaign';
import { evaluate } from '../engine/runtime';
import { generatePractice } from './practice';
describe('seeded practice',()=>{
    it('same seed and unlocked lessons reproduce the same mission',()=>{
        const ids=CAMPAIGN.map(m=>m.id); expect(generatePractice(49,ids)).toEqual(generatePractice(49,ids));
        expect(generatePractice(49,ids)).not.toEqual(generatePractice(50,ids));
    });
    for(const chapter of CHAPTERS)it(`${chapter.id}: 1000 seeds preserve the concept and a complete witness`,()=>{
        const ids=CAMPAIGN.filter(m=>m.chapter===chapter.id).map(m=>m.id);
        for(let seed=0;seed<1000;seed++){
            const m=generatePractice(seed,ids); expect(m.chapter).toBe(chapter.id); expect(m.practice).toBe(true);
            expect(evaluate(m,m.solution).success,`${chapter.id}/${seed}`).toBe(true);
        }
    });
});
