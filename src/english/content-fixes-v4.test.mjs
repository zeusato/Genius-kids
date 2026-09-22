import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { grade, normalizeAnswer } from './engine';
import { validateFiles } from '../../scripts/english-content.mjs';
import { generateInMemory, reviewedGenerators } from '../../scripts/english-review-generator.mjs';
import { applyContentReviewV4 } from '../../scripts/english-content-review-v4.mjs';

const read=(file)=>JSON.parse(fs.readFileSync(new URL(`../data/english/${file}`,import.meta.url),'utf8'));
const levels=['A1','A2','A3','B1','B2','B3','B4','C1','C2'];
const corpus=levels.flatMap(l=>read(`${l}.sentences.json`));
const get=id=>corpus.find(s=>s.id===id);
function indices(s,text){
 const words=text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu)||[],used=new Set();
 return words.map(w=>{const i=s.tokens.findIndex((t,i)=>!used.has(i)&&normalizeAnswer(t.text,false)===normalizeAnswer(w,false));if(i<0)throw new Error(`${s.id}: missing token ${w}`);used.add(i);return i;});
}

describe('v4 editorial regression: learner-visible correctness',()=>{
 it('validates the entire corpus against the real import/build contract',async()=>{
   expect(await validateFiles()).toMatchObject({files:33,sentences:200});
 });
 it.each(['A1-s-0074','A1-s-0189','B2-s-0177','B2-s-0181','B2-s-0185','B2-s-0190','B4-s-0164','C1-s-0164'])('accepts the whole right-now phrase and rejects a detached now: %s',id=>{
   const s=get(id),rest=(s.en.startsWith('I ')?s.en:s.en[0].toLowerCase()+s.en.slice(1));
   const good='Right now '+rest.replace(/ right now([.?])$/,'$1');
   const bad='Now '+rest.replace(/ right now([.?])$/,' right$1');
   expect(grade({kind:'order',sentence:s,target:0},indices(s,good))).toBe(true);
   expect(grade({kind:'order',sentence:s,target:0},indices(s,bad))).toBe(false);
 });
 it('does not offer ambiguous or uncovered roles exercises',()=>{
   for(const id of ['B1-s-0030','C1-s-0038','C1-s-0104','C1-s-0152'])expect(get(id).exerciseTypes).not.toContain('roles');
   for(const s of corpus.filter(s=>s.exerciseTypes.includes('roles'))){
     expect(new Set(s.roleSpans.map(r=>r.clauseId+'/'+r.role)).size,s.id).toBe(s.roleSpans.length);
     const covered=new Set(s.roleSpans.flatMap(r=>r.tokenIndices));
     for(const [i,t]of s.tokens.entries())if(!['punct','conjunction'].includes(t.pos))expect(covered.has(i),`${s.id}/${t.text}`).toBe(true);
   }
 });
 it.each([
   ['C1-s-0125','verb','did not call','did call'],
   ['C1-s-0129','verb','will not come','will come'],
   ['C1-s-0194','subject','the girl wearing pink shoes','the girl'],
 ])('grades complete role selections in %s', (id,role,good,bad)=>{
   const s=get(id),target=s.roleSpans.findIndex(r=>r.role===role);
   expect(s.exerciseTypes).toContain('roles');
   expect(grade({kind:'roles',sentence:s,target},indices(s,good))).toBe(true);
   expect(grade({kind:'roles',sentence:s,target},indices(s,bad))).toBe(false);
 });
 it('keeps phrasal particles even when a different ambiguity disables roles',()=>{
   for(const [id,good,bad]of [['C1-s-0068','do get up','do get'],['C1-s-0195','do wake up','do wake']]){
     const s=get(id),target=s.roleSpans.findIndex(r=>r.role==='verb');
     expect(grade({kind:'roles',sentence:s,target},indices(s,good))).toBe(true);
     expect(grade({kind:'roles',sentence:s,target},indices(s,bad))).toBe(false);
   }
 });
 it('accepts full negatives only with a prompt that permits them',()=>{
   for(const s of corpus)for(const [target,b]of s.blanks.entries())if(b.alt?.some(a=>/\snot\b/.test(a))){
     expect(b.promptVi,s.id).not.toMatch(/viết tắt|rút gọn/);
     expect(grade({kind:'fill',sentence:s,target},b.answer)).toBe(true);
     for(const a of b.alt.filter(a=>/\snot\b/.test(a)))expect(grade({kind:'fill',sentence:s,target},a)).toBe(true);
   }
 });
 it('uses one token per word and grades fixed multiword prepositions correctly',()=>{
   for(const s of corpus)for(const t of s.tokens)expect(t.text,s.id).not.toMatch(/\s/);
   const s=get('C2-s-0045');expect(s.en).toBe('My desk is next to the window.');
   expect(s.blanks[0].answer).toBe('to');
   expect(grade({kind:'fill',sentence:s,target:0},'to')).toBe(true);
   // The displayed sentence is "My desk is next ___ the window."
   expect(grade({kind:'fill',sentence:s,target:0},'beside')).toBe(false);
   for(const id of ['C2-s-0078','C2-s-0079','C2-s-0080']){
     expect(grade({kind:'fill',sentence:get(id),target:0},'in')).toBe(true);
     expect(grade({kind:'fill',sentence:get(id),target:0},'inside')).toBe(false);
   }
   for(const [id,word]of [['C2-s-0126','until'],['C2-s-0149','before']])expect(get(id).tokens.find(t=>t.text===word).pos).toBe('conjunction');
 });
 it('requires a meaningful answer, with explicit bounded choices where needed',()=>{
   for(const s of corpus.filter(s=>['C1','C2'].includes(s.level)))for(const b of s.blanks){
     expect(b.promptVi,s.id).not.toMatch(/^Điền\s+(What|Where|When|Who|Why|How|Which|Whose|in|on|at|but|and|because)[.!\s]*$/i);
     const group=b.promptVi.match(/\[([^\]]+)\]/);
     if(group){
       const choices=group[1].split(' / ');expect(new Set(choices).size).toBe(4);
       expect(choices).toContain(b.answer);
       const wrong=choices.find(c=>![b.answer,...(b.alt||[])].some(a=>normalizeAnswer(a)===normalizeAnswer(c)));
       expect(wrong,s.id).toBeDefined();expect(grade({kind:'fill',sentence:s,target:0},wrong),s.id).toBe(false);
     }
   }
 });
 it('has 37 genuinely expanded C1 subjects rather than only harder labels',()=>{
   const hard=corpus.filter(s=>s.tags.includes('expanded-subject-v4'));expect(hard).toHaveLength(37);
   for(const s of hard){const target=s.roleSpans.findIndex(r=>r.role==='subject'),span=s.roleSpans[target];
     expect(span.tokenIndices).toHaveLength(6);expect(s.difficulty).toBe(3);
     expect(grade({kind:'roles',sentence:s,target},span.tokenIndices)).toBe(true);
     expect(grade({kind:'roles',sentence:s,target},span.tokenIndices.slice(0,2))).toBe(false);
   }
 });
 it('has 40 distinct, complete reading passages and grounded vocabulary',()=>{
   const ps=read('C3.passages.json');expect(ps).toHaveLength(40);expect(new Set(ps.map(p=>normalizeAnswer(p.en))).size).toBe(40);
   for(const p of ps){
     expect(p.en.split(/\s+/).length).toBe(p.wordCount);expect(p.wordCount).toBeGreaterThanOrEqual(60);expect(p.wordCount).toBeLessThanOrEqual(90);
     expect(p.questions.map(q=>q.type)).toEqual(expect.arrayContaining(['mcq','tf','short']));
     expect(p.glossary.length).toBeGreaterThanOrEqual(3);expect(p.glossary.length).toBeLessThanOrEqual(6);
     expect(p.en).not.toContain('Every student in our group participated actively');
     for(const g of p.glossary)expect(g.vi).not.toMatch(/^thuộc chủ đề/);
     for(const q of p.questions)if(q.type==='tf')expect(['true','false']).toContain(q.answer);
   }
   const vocab=read('C3.vocab.json');expect(vocab).toHaveLength(105);
   for(const v of vocab){const refs=v.tags.filter(t=>t.startsWith('passage:'));expect(refs.length,v.id).toBeGreaterThan(0);
     const forms=[v.en,...Object.values(v.forms||{}).filter(x=>typeof x==='string')];
     for(const ref of refs){const p=ps.find(p=>p.id===ref.slice(8));expect(p,v.id).toBeDefined();expect(forms.some(w=>p.en.toLowerCase().includes(w.toLowerCase())),v.id).toBe(true);}
   }
 });
 it('keeps rewrite grammar, scope and short-answer alternatives consistent',()=>{
   const rs=read('C3.rewrites.json'),r=rs.find(r=>r.id==='C3-r-0155');
   expect(r.answer).toBe('They reached school at six.');expect(r.promptEn).toContain('at school');
   for(const r of rs){expect(r.promptEn).not.toMatch(/\b(can|could|should|would)\b/i);if(r.type==='contraction')expect(r.promptVi).not.toContain(r.answer);}
   for(const level of ['C1','C2','C3'])for(const v of read(`${level}.vocab.json`))expect(v.exampleEn,v.id).not.toMatch(/\b(can|could|should|would)\b/i);
   const p=read('C3.passages.json').find(p=>p.id==='C3-p-0003');
   expect(p.questions.find(q=>q.type==='short').alt).toContain('inside a cozy tree hollow');
   for(const id of ['B4-s-0050','B4-s-0072'])expect(get(id).en).not.toMatch(/\bif\b/);
 });
 it('keeps K text, audio hints and corrected food examples aligned',()=>{
   for(const p of read('K.phrases.json'))expect(p.audioHint).toBe(p.en);
   for(const v of read('K.vocab.json')){expect(v.exampleEn.split(/\s+/).length).toBeGreaterThanOrEqual(2);expect(v.exampleEn.split(/\s+/).length).toBeLessThanOrEqual(5);}
   const k=read('K.vocab.json');for(const [n,word]of [[83,'mango'],[84,'strawberry'],[85,'watermelon']])expect(k.find(v=>+v.id.slice(-4)===n).exampleEn).toContain(word);
 });
 it('reproduces every generated file and rejects stale source edits',()=>{
   const outputs=new Set();
   for(const g of [...reviewedGenerators,'build-c1-full.mjs','build-c2-full.mjs','build-c3-full.mjs','build-k-full.mjs'])for(const [file,rows]of generateInMemory(g)){
     outputs.add(file);expect(rows,file).toEqual(read(file));expect(applyContentReviewV4(file,rows),file).toEqual(rows);
   }
   expect(outputs.size).toBe(32);
   const modified=structuredClone(get('C1-s-0005'));modified.en='A new unreviewed sentence.';
   expect(()=>applyContentReviewV4('C1.sentences.json',[modified])).toThrow(/re-review/);
 });
});
