// One-time, idempotent wiring of the editorial review into all English writers.
import fs from 'node:fs';
import { reviewedGenerators } from './english-review-generator.mjs';
const generators=[...reviewedGenerators,'build-c1-full.mjs','build-c2-full.mjs','build-c3-full.mjs','build-k-full.mjs'];
for(const name of generators){
 const url=new URL(name,import.meta.url);let s=fs.readFileSync(url,'utf8');
 if(!s.includes("import { applyContentReviewV4 }")){
  s="import { applyContentReviewV4 } from './english-content-review-v4.mjs';\n"+s;
  s=s.replace(/(fs.writeFileSync\(\s*path.join\(DATA_DIR,\s*'([^']+\.json)'\),\s*JSON.stringify\()([\s\S]*?)(,\s*null,\s*2\))/g,(_,prefix,file,expression,suffix)=>`${prefix}applyContentReviewV4('${file}', ${expression})${suffix}`);
 }
 if(name==='build-c3-full.mjs'&&s.includes('const topicThemes =')){
  const start=s.indexOf('// Sinh thêm 35 đoạn'),end=s.indexOf('const c3Passages =',start);
  s=s.slice(0,start)+'// Each additional passage has independently authored text and questions.\nrawPassages.push(...reviewedC3Passages());\n\n'+s.slice(end);
  s="import { reviewedC3Passages } from './english-c3-passages-reviewed.mjs';\n"+s;
 }
 fs.writeFileSync(url,s);
}
// Repair both copies of the older adverb rule; never detach now from right now.
for(const name of ['apply-fix-07-08.mjs','test-order-alts.mjs']){
 const url=new URL(name,import.meta.url);let s=fs.readFileSync(url,'utf8');
 s=s.replace("const alts = new Set(s.orderAlternatives || []);","const alts = new Set((s.orderAlternatives || []).filter(a => !/^Now .* right[.?]$/.test(a)));");
 s=s.replace("singleAdverbs.includes(lastWord) && words.length >= 3 &&", "singleAdverbs.includes(lastWord) && !(lastWord === 'now' && words.at(-2).toLowerCase() === 'right') && words.length >= 3 &&");
 if(!s.includes("['right', 'now']"))s=s.replace('const timePhrases = [',"const timePhrases = [\n    ['right', 'now'],");
 fs.writeFileSync(url,s);
}
const url=new URL('./english-reviewed-order.json',import.meta.url),order=JSON.parse(fs.readFileSync(url,'utf8'));
for(const entry of Object.values(order))entry.alternatives=entry.alternatives.filter(a=>!/^Now .* right[.?]$/.test(a)).map(a=>a.replace(/^Sometimes (She|He|They|We)\b/,(_,p)=>`Sometimes ${p.toLowerCase()}`).replace(/\bmr\. Brown/g,'Mr. Brown'));
fs.writeFileSync(url,JSON.stringify(order,null,2)+'\n');
// These two sentences were replaced for curriculum scope, so the old token
// annotations no longer apply. Their complete annotations now live in v4.
const annotationUrl=new URL('./english-annotations-b2-b4.json',import.meta.url);
const annotations=JSON.parse(fs.readFileSync(annotationUrl,'utf8'));
delete annotations['B4-s-0050'];delete annotations['B4-s-0072'];
fs.writeFileSync(annotationUrl,JSON.stringify(annotations,null,2)+'\n');
console.log('Wired '+generators.length+' English generators to the final review layer.');
