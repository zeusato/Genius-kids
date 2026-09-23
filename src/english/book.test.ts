import { describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import fs from 'node:fs';
import { bookPages } from './book';
import { LEVELS } from './catalog';
import { listLibrary, saveLibraryEntry } from './library';
import { clearEnglishData } from './storage';
import { makeAIPractice } from './aiPractice';
import { generateDrafts, listAI, prepareDrafts } from './ai';
import { geminiGenerateContent } from '../../services/geminiClient';
import { sourceId, isSentenceExercise } from './model';
import type { EnglishContent } from './content';
import type { Level } from '../data/english/schema';

vi.mock('../../services/geminiClient',()=>({geminiGenerateContent:vi.fn()}));
const bundle=(level:Level):EnglishContent=>{
  const data:EnglishContent={level,version:'qa',sentences:[],vocab:[],passages:[],rewrites:[],phrases:[]};
  for(const kind of ['sentences','vocab','theory','passages','rewrites','phrases']){
    const path=`src/data/english/${level}.${kind}.json`;
    if(fs.existsSync(path))data[kind]=JSON.parse(fs.readFileSync(path,'utf8'));
  }
  return data;
};
describe('Book reading',()=>{
  it('keeps every reviewed formula, section, example reference and mistake reachable exactly once',()=>{
    for(const level of LEVELS){
      const content=bundle(level),pages=bookPages(content);
      expect(new Set(pages.map(p=>p.id)).size).toBe(pages.length);
      expect(pages[0].kind).toBe('overview');
      if(content.theory){
        expect(pages.filter(p=>p.kind==='section').map(p=>p.index)).toEqual(content.theory.sections.map((_,i)=>i));
        expect(pages.filter(p=>p.kind==='formula')).toHaveLength(content.theory.formulas.length);
        expect(pages.filter(p=>p.kind==='mistake')).toHaveLength(content.theory.commonMistakes.length);
        expect(pages.flatMap(p=>p.exampleIds||[])).toEqual(content.theory.sections.flatMap(s=>s.exampleIds||[]));
        expect(pages.every(p=>(p.exampleIds?.length||0)<=2)).toBe(true);
      }else{
        expect(pages.filter(p=>p.kind==='letters')).toHaveLength(4);
        expect(pages.filter(p=>p.kind==='phrases').flatMap(p=>content.phrases.slice(p.index!*4,p.index!*4+4)).map(p=>p.id)).toEqual(content.phrases.map(p=>p.id));
      }
    }
  });
  it('isolates bookmarks and saved words by profile, preserves other entries, and clears library on profile deletion',async()=>{
    const owner=crypto.randomUUID(),other=crypto.randomUUID();
    await saveLibraryEntry({studentId:owner,id:'bookmark',level:'B2',page:'section-1'});
    await saveLibraryEntry({studentId:owner,id:'word:A1-v-0001',level:'A1',saved:true,status:'learning'});
    await saveLibraryEntry({studentId:other,id:'bookmark',level:'K',page:'intro'});
    await saveLibraryEntry({studentId:owner,id:'word:A1-v-0001',level:'A1',saved:true,status:'remembered'});
    const entries=await listLibrary(owner);
    expect(entries).toHaveLength(2);
    expect(entries.find(e=>e.id==='bookmark')?.page).toBe('section-1');
    expect(entries.find(e=>e.id.startsWith('word:'))?.status).toBe('remembered');
    await clearEnglishData(owner);
    expect(await listLibrary(owner)).toEqual([]);
    expect((await listLibrary(other))[0].level).toBe('K');
  });
});

describe('AI authoring to practice',()=>{
  it('includes approved AI first, fills to five distinct sources, and excludes other owners, drafts and rejected items',()=>{
    const content=bundle('A1'),owner=crypto.randomUUID();
    const raw={...content.vocab[0],en:'sunflower',vi:'hoa hướng dương',exampleEn:'I see a sunflower.',exampleVi:'Tôi thấy một bông hoa hướng dương.'};
    const [draft]=prepareDrafts([raw],'vocab',content,owner,'test');
    expect(draft.errors).toEqual([]);
    expect(()=>makeAIPractice(content,[draft],owner,'vocab')).toThrow(/Duyệt/);
    const approved={...draft,reviewStatus:'approved' as const};
    expect(()=>makeAIPractice(content,[approved],crypto.randomUUID(),'vocab')).toThrow(/Duyệt/);
    expect(()=>makeAIPractice(content,[{...approved,errors:['quarantined']}],owner,'vocab')).toThrow(/Duyệt/);
    const {session,aiCount}=makeAIPractice(content,[approved],owner,'vocab');
    expect(session.mode).toBe('practice');
    expect(session.studentId).toBe(owner);
    expect(session.exercises).toHaveLength(5);
    expect(new Set(session.exercises.map(sourceId)).size).toBe(5);
    expect(aiCount).toBe(1);
    expect(session.exercises.some(e=>!isSentenceExercise(e)&&e.sourceId===approved.id)).toBe(true);
    expect(content.vocab.some(v=>v.source==='ai')).toBe(false);
  });
  it('accepts configured generation through the shared client and persists only drafts before approval',async()=>{
    const content=bundle('A1'),owner=crypto.randomUUID();
    const raw={...content.vocab[0],en:'sunflower',vi:'hoa hướng dương',exampleEn:'I see a sunflower.',exampleVi:'Tôi thấy một bông hoa hướng dương.'};
    vi.mocked(geminiGenerateContent).mockResolvedValueOnce(new Response(JSON.stringify({modelVersion:'test-model',candidates:[{content:{parts:[{text:JSON.stringify([raw])}]}}]}),{status:200}));
    const drafts=await generateDrafts('test-key','vocab',content,owner,new AbortController().signal,{count:5,difficulty:2,theme:'a garden'});
    expect(drafts[0].reviewStatus).toBe('draft');
    expect((await listAI(owner))[0].id).toBe(drafts[0].id);
    const args=vi.mocked(geminiGenerateContent).mock.calls.at(-1)!;
    const prompt=JSON.stringify(args[1]);
    expect(prompt).toContain('Create 5 new vocab');
    expect(prompt).toContain('Desired difficulty: 2');
    expect(prompt).toContain('a garden');
    expect(prompt).not.toContain(owner);
    expect(()=>makeAIPractice(content,drafts,owner,'vocab')).toThrow(/Duyệt/);
  });
  it('does not persist a response after cancellation',async()=>{
    const content=bundle('A1'),owner=crypto.randomUUID(),controller=new AbortController();
    vi.mocked(geminiGenerateContent).mockImplementationOnce(async()=>{controller.abort();return new Response('{}',{status:200});});
    await expect(generateDrafts('test-key','vocab',content,owner,controller.signal)).rejects.toThrow();
    expect(await listAI(owner)).toEqual([]);
  });
});
