import {describe,it,expect,vi} from 'vitest';
import 'fake-indexeddb/auto';
import fs from 'node:fs';
import {LEVELS,requiredSkills} from './catalog';
import {activityPool,makeSession,makePlacement} from './activities';
import {grade,correctAnswer,checkResponse,submitSession} from './engine';
import {isSentenceExercise,sourceId,emptyProgress} from './model';
import {applyCompletion} from './progress';
import {prepareDrafts,saveAI,listAI,withApprovedAI,deleteAI,clearAI} from './ai';
import type {EnglishContent} from './content';
import type {Level} from '../data/english/schema';
import type {StudentProfile} from '../../types';
vi.mock('../../services/achievementService',()=>({initializeStats:()=>({totalStarsEarned:0,totalQuestions:0,totalTimeSeconds:0})}));
const bundle=(level:Level):EnglishContent=>{
  const data:any={level,sentences:[],vocab:[],passages:[],rewrites:[],phrases:[],version:'test'};
  for(const kind of ['sentences','vocab','theory','passages','rewrites','phrases']){const p=`src/data/english/${level}.${kind}.json`;if(fs.existsSync(p))data[kind]=JSON.parse(fs.readFileSync(p,'utf8'));}
  return data;
};
const all=LEVELS.map(bundle);
const owner=():StudentProfile=>({id:crypto.randomUUID(),name:'QA',stars:0,ownedImageIds:[],englishProgress:emptyProgress()} as StudentProfile);
function finish(s:ReturnType<typeof makeSession>,answer=true){for(const e of s.exercises)s.responses[e.id]=checkResponse(e,{answer:answer?correctAnswer(e):'wrong',hints:0,attempts:0});return submitSession(s);}
describe('Published curriculum',()=>{
  it('placement samples eight seed topics spanning A1 through C3 without repeated sources',()=>{
    const session=makePlacement(all,'owner');expect(session.exercises).toHaveLength(8);
    expect(session.levels?.[0]).toBe('A1');expect(session.levels?.at(-1)).toBe('C3');
    expect(new Set(session.exercises.map(sourceId)).size).toBe(8);
    for(const e of session.exercises)expect(isSentenceExercise(e)?e.sentence.source:e.source).toBe('seed');
  });
  for(const content of all.filter(b=>b.level!=='K'))it(`${content.level}: complete, unique seed exams and second-exam mastery`,()=>{
    let p=owner();const first=makeSession([content],p.id,'test');
    expect(new Set(first.exercises.map(sourceId)).size).toBe(first.exercises.length);
    expect(requiredSkills[content.level].every(s=>first.exercises.some(e=>e.skill===s))).toBe(true);
    for(const e of first.exercises){expect(grade(e,correctAnswer(e))).toBe(true);expect(grade(e,'definitely wrong')).toBe(false);}
    p=applyCompletion(p,finish(first)).profile;
    const second=makeSession([content],p.id,'test',10,'mixed',first.exercises.map(sourceId));
    expect(second.exercises.filter(e=>!first.exercises.some(x=>sourceId(x)===sourceId(e))).length).toBeGreaterThanOrEqual(Math.ceil(second.exercises.length/2));
    p=applyCompletion(p,finish(second)).profile;expect(p.englishProgress!.masteryByLevel[content.level]?.mastered).toBe(true);
  });
  it('runs C3 exact short answers and rewrites with reviewed alternatives',()=>{
    const pool=activityPool(bundle('C3'),'mixed');
    for(const e of pool){expect(grade(e,correctAnswer(e))).toBe(true);if(!isSentenceExercise(e))for(const a of e.alternatives)expect(grade(e,a)).toBe(true);}
  });
  it('does not certify mixed exams or placement and gives no placement reward',()=>{
    let p=owner();const mixed=makeSession([bundle('A1'),bundle('A2')],p.id,'test');p=applyCompletion(p,finish(mixed)).profile;
    expect(Object.keys(p.englishProgress!.qualifyingExams)).toHaveLength(0);
    const placement=makeSession([bundle('A1')],p.id,'placement');const before=structuredClone(p.englishProgress!.skills);const result=applyCompletion(p,finish(placement));
    expect(result.result.stars).toBe(0);expect(result.profile.englishProgress!.skills).toEqual(before);
  });
  it('K has distinct picture options, phrases and letters without grammar',()=>{
    const b=bundle('K');for(const family of ['picture','meaning','listen','phrase','letter'] as const){const s=makeSession([b],'owner','practice',5,family);expect(s.exercises).toHaveLength(5);for(const e of s.exercises){expect(isSentenceExercise(e)).toBe(false);if(!isSentenceExercise(e)){expect(new Set(e.options).size).toBe(4);expect(e.options).toContain(e.answer);}}}
    expect(()=>makeSession([b],'owner','test')).toThrow();
  });
  it('spelling only uses a single Latin word and conjugation only verb blanks',()=>{
    for(const level of ['B1','B2','B3','B4'] as Level[])expect(makeSession([bundle(level)],'owner','practice',5,'conjugate').exercises).toHaveLength(5);
    for(const b of all){for(const e of activityPool(b,'spelling'))if(!isSentenceExercise(e))expect(e.answer).toMatch(/^[a-z]+$/i);
      for(const e of activityPool(b,'conjugate'))if(isSentenceExercise(e))expect(e.sentence.tokens[e.sentence.blanks[e.target].tokenIndex].pos).toBe('verb');}
  });
});
describe('Review spacing and migration',()=>{
  it('migrates A1 keys, stores wrong snapshots, advances only due reviews at 1/3/7/14 days',()=>{
    let p=owner();p.englishProgress!.skills['be-affirmative']={attempts:4,firstTryCorrect:3,lastAttemptAt:new Date().toISOString(),reviewStep:0};
    const s=finish(makeSession([bundle('A1')],p.id,'practice',5),false);p=applyCompletion(p,s).profile;
    expect(p.englishProgress!.skills['be-affirmative']).toBeUndefined();expect(p.englishProgress!.skills['A1:be-affirmative']!.attempts).toBeGreaterThanOrEqual(4);
    let item=p.englishProgress!.reviewItems[0];expect(item.exercise).toBeDefined();expect(item.step).toBe(0);
    const practice=finish(makeSession([bundle('A1')],p.id,'practice',1,'mixed',[],[item.exercise!]));p=applyCompletion(p,practice).profile;
    expect(p.englishProgress!.reviewItems.find(x=>x.sourceId===item.sourceId)?.nextReviewAt).toBe(item.nextReviewAt);
    for(const step of [1,2,3,3]){const now=new Date(new Date(item.nextReviewAt).getTime()+1000);const review=finish(makeSession([bundle('A1')],p.id,'review',1,'mixed',[],[item.exercise!]));review.startedAt=now.toISOString();review.completedAt=now.toISOString();p=applyCompletion(p,review,now).profile;item=p.englishProgress!.reviewItems.find(x=>x.sourceId===item.sourceId)!;expect(item.step).toBe(step);expect(new Date(item.nextReviewAt).getTime()-now.getTime()).toBe([1,3,7,14][step]*86400000);}
  });
});
describe('AI quarantine',()=>{
  it('isolates owners, rejects duplicate/invalid content, merges only approvals and never certifies AI',async()=>{
    const b=bundle('A1'),p=owner();const sample={...b.vocab[0],en:'zebra',vi:'ngựa vằn'};
    const drafts=prepareDrafts([sample,{broken:true},b.vocab[0]],'vocab',b,p.id,'mock');
    expect(drafts.map(x=>x.reviewStatus)).toEqual(['draft','rejected','rejected']);await saveAI(drafts);
    expect(await listAI('another')).toEqual([]);expect((await withApprovedAI(b,p.id)).vocab).toHaveLength(b.vocab.length);
    await expect(saveAI([{...drafts[1],reviewStatus:'approved'}])).rejects.toThrow();
    await saveAI([{...drafts[0],reviewStatus:'approved'}]);const extended=await withApprovedAI(b,p.id);expect(extended.vocab).toHaveLength(b.vocab.length+1);
    const fake={...b.sentences[0],id:'ai-'+crypto.randomUUID(),source:'ai' as const};extended.sentences.push(fake);expect(activityPool(extended,'mixed',true).some(e=>sourceId(e)===fake.id)).toBe(false);
    await deleteAI(p.id,drafts[0].id);expect((await withApprovedAI(b,p.id)).vocab).toHaveLength(b.vocab.length);await clearAI(p.id);expect(await listAI(p.id)).toEqual([]);
  });
});
