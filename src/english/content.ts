import type { Level, Sentence, TheoryPage, Vocab, Passage, Rewrite, Phrase } from '../data/english/schema';
import { validateContent } from './validation.mjs';
import { LEVELS } from './catalog';
export interface EnglishContent {
  level: Level; sentences: Sentence[]; vocab: Vocab[]; theory?: TheoryPage;
  passages: Passage[]; rewrites: Rewrite[]; phrases: Phrase[]; version: string;
}
export const MANIFEST = { schemaVersion: 1, publishedLevels: LEVELS, minimumSentences: 200, minimumVocab: 100 };
const files = import.meta.glob('../data/english/*.json', { query: '?url', import: 'default', eager: true }) as Record<string,string>;
const kindsFor = (level:Level) => level === 'K' ? ['vocab','phrases'] : level === 'C3' ? ['vocab','theory','passages','rewrites'] : ['sentences','vocab','theory'];
export async function contentCacheStatus(level:Level):Promise<boolean> {
  if(!('caches' in globalThis)) return false;
  return (await Promise.all(kindsFor(level).map(kind => caches.match(files['../data/english/'+level+'.'+kind+'.json'],{ignoreSearch:true})))).every(Boolean);
}
const pending = new Map<Level, Promise<EnglishContent>>();
export function loadContent(level: Level = 'A1'): Promise<EnglishContent> {
  if (!LEVELS.includes(level)) return Promise.reject(new Error('Bài học chưa được xuất bản.'));
  if (!pending.has(level)) pending.set(level, read(level).catch(e => { pending.delete(level); throw e; }));
  return pending.get(level)!;
}
async function read(level: Level): Promise<EnglishContent> {
  const kinds = kindsFor(level);
  const data = Object.fromEntries(await Promise.all(kinds.map(async kind => {
    const url=files['../data/english/'+level+'.'+kind+'.json'];if(!url)throw new Error('Thiếu tệp nội dung '+level);
    const response=await fetch(url);if(!response.ok)throw new Error('Chưa tải được '+level+' ('+response.status+').');
    return [kind,await response.json()];
  })));
  for (const kind of kinds) {
    const result = validateContent(kind, data[kind], { level, sentenceIds: (data.sentences as Sentence[] || []).map(s => s.id) });
    if (!result.valid) throw new Error(level+': '+result.errors.slice(0,3).join('; '));
  }
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(data)));
  return { level, sentences: [], vocab: [], passages: [], rewrites: [], phrases: [], ...data,
    version: '1-'+Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0,16) } as EnglishContent;
}
