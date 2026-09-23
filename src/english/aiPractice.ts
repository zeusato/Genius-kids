import type { EnglishContent } from './content';
import type { AIDraft, AIKind } from './ai';
import { validateContent } from './validation.mjs';
import { activityPool, makeSession } from './activities';
import { shuffle } from './engine';
import { sourceId, type ActivityKind, type Exercise } from './model';

export function makeAIPractice(bundle: EnglishContent, drafts: AIDraft[], owner: string, kind: AIKind, count=5) {
  const approved=drafts.filter(d=>d.studentId===owner&&d.level===bundle.level&&d.kind===kind&&d.reviewStatus==='approved'&&!d.errors.length&&d.id.startsWith('ai-')&&(d.content as any)?.id===d.id&&(d.content as any)?.source==='ai'&&validateContent(kind,[d.content],{level:bundle.level,allowAI:true}).valid);
  const content=structuredClone(bundle);
  (content[kind] as unknown[]).push(...approved.map(d=>d.content));
  const family: ActivityKind|'mixed'=({sentences:'mixed',vocab:'meaning',passages:'reading',rewrites:'rewrite',phrases:'phrase'} as const)[kind];
  const pool=shuffle(activityPool(content,family));
  const ids=new Set(approved.map(d=>d.id));
  const ai=pool.filter(e=>ids.has(sourceId(e)));
  if(!ai.length)throw new Error('Duyệt ít nhất một mục phù hợp trước khi tạo bài luyện.');
  const selected:Exercise[]=[];
  for(const e of [...ai,...pool.filter(e=>!ids.has(sourceId(e)))]){
    if(selected.some(s=>sourceId(s)===sourceId(e)))continue;
    selected.push(e);if(selected.length===count)break;
  }
  if(selected.length<count)throw new Error('Chưa đủ nguồn câu cho bài luyện. Hãy tạo và duyệt thêm nội dung.');
  const session=makeSession([content],owner,'practice',count,family,[],selected);
  return {session, aiCount:session.exercises.filter(e=>ids.has(sourceId(e))).length};
}
