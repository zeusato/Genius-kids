import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { grade, normalizeAnswer } from './engine';
import { curriculumReview, applyCurriculumReview } from '../../scripts/english-curriculum-review.mjs';
import { applyExercisePrompts } from '../../scripts/english-exercise-prompts.mjs';
import { applyTheoryReview } from '../../scripts/english-theory-review.mjs';
import { applyReviewedOrder } from '../../scripts/english-reviewed-order.mjs';
import { createHandoffAudit } from '../../scripts/english-content-handoff.mjs';

const read=(level,kind)=>JSON.parse(fs.readFileSync(new URL(`../data/english/${level}.${kind}.json`,import.meta.url),'utf8'));
const all=['B2','B3','B4'].flatMap(l=>read(l,'sentences'));
const get=id=>all.find(s=>s.id===id);

describe('curriculum coverage and final handoff (13–14)',()=>{
  it('contrasts five matching habitual/current pairs without supplying a tense label',()=>{
    const ss=all.filter(s=>s.tags.includes('contrast'));
    expect(ss).toHaveLength(10);
    for(let i=0;i<ss.length;i+=2){
      const [habit,current]=ss.slice(i,i+2);
      expect(habit.tags).toContain('habit');expect(current.tags).toContain('current-action');
      expect(habit.tokens[habit.blanks[0].tokenIndex].lemma).toBe(current.tokens[current.blanks[0].tokenIndex].lemma);
      for(const [s,wrong]of [[habit,current.blanks[0].answer],[current,habit.blanks[0].answer]]){
        expect(s.blanks[0].promptVi).toContain(s.vi);
        expect(s.blanks[0].promptVi).not.toMatch(/hiện tại đơn|hiện tại tiếp diễn/);
        expect(grade({kind:'fill',sentence:s,target:0},s.blanks[0].answer)).toBe(true);
        expect(grade({kind:'fill',sentence:s,target:0},wrong)).toBe(false);
      }
    }
  });
  it('pairs past-be questions with context-bound positive and negative replies',()=>{
    for(const n of [25,28,33,36]){
      const [q,yes,no]=[n,n+1,n+2].map(i=>get(`B3-s-${String(i).padStart(4,'0')}`));
      expect(q.en).toMatch(/^(Was|Were) /);
      for(const s of [yes,no]){
        expect(s.blanks[0].promptVi).toContain(q.en);
        expect(s.exerciseTypes).toEqual(['pos','fill']);
        expect(grade({kind:'fill',sentence:s,target:0},s.blanks[0].answer)).toBe(true);
        const wrong=s.tokens[2].text==='they'?(s===yes?'was':"wasn't"):(s===yes?'were':"weren't");
        expect(grade({kind:'fill',sentence:s,target:0},wrong)).toBe(false);
      }
      expect(grade({kind:'fill',sentence:no,target:0},yes.blanks[0].answer)).toBe(false);
      expect(grade({kind:'fill',sentence:no,target:0},no.blanks[0].alt[0])).toBe(true);
    }
  });
  it('covers six negative/question going-to pairs and rejects incomplete verb phrases',()=>{
    for(let n=133;n<=144;n++){
      const s=get(`B4-s-${String(n).padStart(4,'0')}`),negative=n%2===1;
      expect(s.grammarPoint).toBe('be-going-to');
      expect(s.en).toMatch(negative?/ not going to /:/^(Is|Are) .* going to .*\?$/);
      const target=s.roleSpans.findIndex(r=>r.role==='verb'),indices=s.roleSpans[target].tokenIndices;
      const particle=s.tokens.findIndex(t=>t.text==='to');
      expect(grade({kind:'roles',sentence:s,target},indices)).toBe(true);
      expect(grade({kind:'roles',sentence:s,target},indices.filter(i=>i!==particle))).toBe(false);
      const wrong=normalizeAnswer(s.blanks[0].answer)==='is'?'are':'is';
      expect(grade({kind:'fill',sentence:s,target:0},wrong)).toBe(false);
      if(negative){const ni=s.tokens.findIndex(t=>t.text==='not');expect(grade({kind:'roles',sentence:s,target},indices.filter(i=>i!==ni))).toBe(false);}
    }
  });
  it('makes hard items structurally harder and grades the entire subject',()=>{
    const expanded=all.filter(s=>s.tags.includes('expanded-subject'));
    expect(expanded).toHaveLength(108);
    for(const s of expanded){
      const target=s.roleSpans.findIndex(r=>r.role==='subject'),span=s.roleSpans[target];
      expect(span.tokenIndices).toHaveLength(6);expect(s.difficulty).toBe(3);
      const nouns=span.tokenIndices.map(i=>s.tokens[i]).filter(t=>t.pos==='noun');
      expect(nouns[0].feature).not.toBe(nouns.at(-1).feature);
      expect(grade({kind:'roles',sentence:s,target},span.tokenIndices)).toBe(true);
      expect(grade({kind:'roles',sentence:s,target},span.tokenIndices.slice(0,2))).toBe(false);
      if(s.level==='B2'){
        const b=s.blanks[0];expect(s.tokens[b.tokenIndex].lemma).toBe('be');
        const wrong={is:'are',are:'is',"isn't":"aren't","aren't":"isn't"}[b.answer.toLowerCase()];
        expect(wrong).toBeDefined();expect(grade({kind:'fill',sentence:s,target:0},wrong)).toBe(false);
      }
    }
  });
  it('keeps five canonical noun headwords and two verb entries consistent',()=>{
    for(const [level,id,en,plural]of [['A3',76,'parent','parents'],['A3',101,'shoe','shoes'],['B1',80,'vegetable','vegetables'],['B2',84,'dish','dishes'],['B3',99,'noodle','noodles']]){
      const v=read(level,'vocab').find(v=>v.id===`${level}-v-${String(id).padStart(4,'0')}`);
      expect(v.en).toBe(en);expect(v.forms.plural).toBe(plural);expect(v.pos).toBe('noun');
      expect(v.exampleEn.toLowerCase()).toContain(en);
    }
    for(const [id,word]of [[71,'rain'],[73,'snow']]){
      const v=read('B4','vocab').find(v=>v.id===`B4-v-${String(id).padStart(4,'0')}`);
      expect(v.pos).toBe('verb');expect(Object.values(v.forms)).toEqual(expect.arrayContaining([word+'s',word+'ed',word+'ing']));
      expect(v.exampleEn).toContain('will '+word);
    }
  });
  it('preserves curriculum edits and compatible order reviews idempotently',()=>{
    for(const id of Object.keys(curriculumReview)){
      const s=get(id),before=structuredClone(s);
      expect(applyExercisePrompts(applyCurriculumReview(s))).toEqual(s);expect(s).toEqual(before);
    }
    for(const level of ['B2','B3','B4'])expect(applyTheoryReview(read(level,'theory'))).toEqual(read(level,'theory'));
    const s=structuredClone(get('B2-s-0191'));s.tokens[2].text='basketball';
    expect(()=>applyCurriculumReview(s)).toThrow(/re-review/);
    const reviewed=structuredClone(get('B2-s-0176'));reviewed.tokens[2].text='walking';
    expect(()=>applyReviewedOrder(reviewed)).toThrow(/re-review/);
  });
  it('validates all A1–B4 files, replays the original bugs and reproduces live data without writes',()=>{
    const audit=createHandoffAudit();expect(audit.sourceStable).toBe(true);
    for(const [name,file]of Object.entries(audit.files).filter(([n])=>audit.scope.includes(n.split('.')[0])))expect(file.errors,name).toEqual([]);
    for(const [level,c]of Object.entries(audit.coverage)){
      expect(c.sentences).toBe(200);expect(c.vocab).toBeGreaterThanOrEqual(100);
      expect(c.duplicateSentenceIds+c.duplicateVocabIds+c.duplicateSentences).toBe(0);
      if(['B2','B3','B4'].includes(level))expect(c.difficulty).toEqual([80,75,45]);
    }
    expect(audit.reproductions).toHaveLength(14);
    for(const r of audit.reproductions)expect(r,`${r.id}/${r.kind}`).toMatchObject({enabled:true,accepted:true,wrongRejected:true});
    expect(Object.keys(audit.regeneration)).toHaveLength(20);
    for(const [name,result]of Object.entries(audit.regeneration))expect(result.differences,name).toEqual([]);
  });
});
