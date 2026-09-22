import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { buildSync } from 'esbuild';
import { validateContent } from '../src/english/validation.mjs';
import { generateInMemory, reviewedGenerators } from './english-review-generator.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const levels = ['A1','A2','A3','B1','B2','B3','B4'];
const dataDir = path.join(root,'src/data/english');
const read = name => JSON.parse(fs.readFileSync(path.join(dataDir,name),'utf8'));
const hash = name => createHash('sha256').update(fs.readFileSync(path.join(dataDir,name))).digest('hex');
export function createHandoffAudit() {
  const files = {}, data = new Map();
  for (const name of fs.readdirSync(dataDir).filter(n=>n.endsWith('.json'))) {
    files[name] = { sha256: hash(name) };
    try { data.set(name,read(name)); } catch(e) { files[name].errors=[e.message]; }
  }
  for (const [name,rows] of data) {
    const [level,kind] = name.split('.');
    Object.assign(files[name],{
      count: Array.isArray(rows)?rows.length:1,
      errors: validateContent(kind,rows,{level,sentenceIds:(data.get(`${level}.sentences.json`)||[]).map(s=>s.id)}).errors,
    });
  }
  const corpus=levels.flatMap(l=>data.get(`${l}.sentences.json`));
  // Bundle the actual application grader; do not reimplement its acceptance rules.
  const code=buildSync({entryPoints:[path.join(root,'src/english/engine.ts')],bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
  const module={exports:{}};
  vm.runInNewContext(code,{module,exports:module.exports,structuredClone},{timeout:10000});
  const {grade,normalizeAnswer}=module.exports;
  const indices=(s,text)=>{
    const used=new Set();
    return (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu)||[]).map(word=>{
      const index=s.tokens.findIndex((t,i)=>!used.has(i)&&normalizeAnswer(t.text,false)===normalizeAnswer(word,false));
      used.add(index);return index;
    });
  };
  const original=JSON.parse(fs.readFileSync(path.join(root,'docs/english-content-review-v3.audit.json'),'utf8'));
  const reproductions=original.reproductions.map(r=>{
    const s=corpus.find(s=>s.id===r.id), target=r.kind==='roles'?s.roleSpans.findIndex(p=>p.role===r.role):0;
    const answer=r.kind==='order'?indices(s,r.alternative):r.kind==='roles'?indices(s,r.expectedWholePhrase):r.answer;
    const wrong=r.kind==='order'?[...answer].reverse():r.kind==='roles'?answer.slice(0,-1):'is';
    return {id:r.id,kind:r.kind,enabled:s.exerciseTypes.includes(r.kind),answer,
      accepted:grade({kind:r.kind,sentence:s,target},answer),wrongRejected:!grade({kind:r.kind,sentence:s,target},wrong)};
  });
  const generated=new Map();
  for(const filename of reviewedGenerators)for(const pair of generateInMemory(filename))generated.set(...pair);
  const regeneration={};
  for(const [name,rows]of generated){
    const live=data.get(name),diff=[];
    if(Array.isArray(rows)){
      if(rows.length!==live.length)diff.push('length');
      for(const row of rows){const current=live.find(s=>s.id===row.id);
        for(const key of new Set([...Object.keys(row),...Object.keys(current||{})]))
          if(!isDeepStrictEqual(row[key],current?.[key]))diff.push(`${row.id}.${key}`);
      }
    }else if(!isDeepStrictEqual(rows,live))diff.push('theory');
    regeneration[name]={matchesLive:diff.length===0,differences:diff};
  }
  const coverage=Object.fromEntries(levels.map(l=>{
    const ss=data.get(`${l}.sentences.json`),vs=data.get(`${l}.vocab.json`);
    return [l,{sentences:ss.length,vocab:vs.length,difficulty:[1,2,3].map(d=>ss.filter(s=>s.difficulty===d).length),
      duplicateSentenceIds:ss.length-new Set(ss.map(s=>s.id)).size,
      duplicateVocabIds:vs.length-new Set(vs.map(v=>v.id)).size,
      duplicateSentences:ss.length-new Set(ss.map(s=>normalizeAnswer(s.en))).size}];
  }));
  for(const [name,result]of Object.entries(files))result.unchangedDuringAudit=hash(name)===result.sha256;
  return {reviewedAt:new Date().toISOString(),scope:levels,files,coverage,reproductions,regeneration,
    staticTheory:'A1.theory.json is hand-authored and validated; the A1 generator emits no theory.',
    sourceStable:Object.values(files).every(f=>f.unchangedDuringAudit)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=createHandoffAudit();
  fs.writeFileSync(path.join(root,'docs/english-content-fixes-13-14.audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({sourceStable:report.sourceStable,coverage:report.coverage,
    validationFailures:Object.fromEntries(Object.entries(report.files).filter(([,r])=>r.errors.length).map(([f,r])=>[f,r.errors.length])),
    reproductions:report.reproductions.filter(r=>!r.enabled||!r.accepted||!r.wrongRejected),
    regenerationDifferences:Object.fromEntries(Object.entries(report.regeneration).filter(([,r])=>!r.matchesLive))},null,2));
  const scopedErrors=Object.entries(report.files).some(([name,r])=>levels.includes(name.split('.')[0])&&r.errors.length);
  if(!report.sourceStable||scopedErrors||report.reproductions.some(r=>!r.enabled||!r.accepted||!r.wrongRejected)
    ||Object.values(report.regeneration).some(r=>!r.matchesLive))process.exitCode=1;
}
