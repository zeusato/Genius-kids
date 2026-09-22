import { applyReviewedOrder } from '../../scripts/english-reviewed-order.mjs';
import { applyCurriculumReview } from '../../scripts/english-curriculum-review.mjs';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { applyContentReviewV4 } from '../../scripts/english-content-review-v4.mjs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { grade, joinTokens, normalizeAnswer } from './engine';
import { validateContent } from './validation.mjs';
import { applyReviewedAnnotations } from '../../scripts/english-reviewed-annotations.mjs';
import { applyExercisePrompts } from '../../scripts/english-exercise-prompts.mjs';
import { applyTheoryReview } from '../../scripts/english-theory-review.mjs';
import { applyAdjectivePrompts } from '../../scripts/english-adjective-prompts.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const levels = ['A1','A2','A3','B1','B2','B3','B4'];
const read = (level, kind) => JSON.parse(fs.readFileSync(path.join(root, 'src/data/english', `${level}.${kind}.json`), 'utf8'));
const all = levels.flatMap(l => read(l, 'sentences'));
const get = id => all.find(s => s.id === id);
const changed = s => s.id === 'A1-s-0038' || s.level === 'A2' && ((+s.id.slice(-4) >= 56 && +s.id.slice(-4) <= 65) || (+s.id.slice(-4) >= 111 && +s.id.slice(-4) <= 121))
  || s.level === 'A3' && +s.id.slice(-4) <= 80 || s.id === 'B1-s-0076' || s.id === 'B3-s-0188'
  || s.level === 'B2' && (+s.id.slice(-4) >= 61 && +s.id.slice(-4) <= 105 || s.id === 'B2-s-0172');
const orderIndices = (s, text) => {
  const words = text.match(/[\p{L}\p{N}'’]+|[.,?!]/gu);
  const used = new Set();
  return words.map(word => {
    const i = s.tokens.findIndex((t, j) => !used.has(j) && normalizeAnswer(t.text, false) === normalizeAnswer(word, false));
    expect(i, `${s.id}: ${word}`).toBeGreaterThanOrEqual(0);
    used.add(i); return i;
  });
};

describe('content fixes 11–12', () => {
  it('keeps A1–B4 counts, IDs, schemas and theory references valid', () => {
    for (const level of levels) {
      const sentences = read(level, 'sentences');
      expect(sentences).toHaveLength(200);
      expect(read(level, 'vocab').length).toBeGreaterThanOrEqual(100);
      for (const kind of ['sentences','vocab','theory'])
        expect(validateContent(kind, read(level,kind), { level, sentenceIds: sentences.map(s => s.id) }).errors, `${level}.${kind}`).toEqual([]);
    }
  });

  it('connects B1 theory questions to matching replies', () => {
    const ids = read('B1','theory').sections[3].exampleIds;
    expect(ids.map(id => get(id).en)).toEqual([
      'Do you like apples?', 'Yes, I do.', "No, I don't.",
      'Does he play soccer?', 'Yes, he does.', "No, he doesn't.",
    ]);
    expect(read('B1','theory').sections[0].table.rows[0][2]).toContain('cleans');
  });

  it('teaches sound, exceptions, stress and context rather than keyword guarantees', () => {
    const a2 = JSON.stringify(read('A2','theory'));
    for (const example of ['an honest boy','a university teacher','a red apple','piano → pianos','photo → photos','tomato → tomatoes']) expect(a2).toContain(example);
    expect(read('A2','theory').tips.join(' ')).not.toContain('U-E-O-A-I');
    for (const level of ['B2','B3']) {
      const t = read(level,'theory');
      const body = t.sections.map(s => s.body).join(' ');
      expect(body).toMatch(/You dùng (are|were).*một người.*nhiều người/);
      expect(body).toContain('Không gấp đôi w, x, y');
      expect(body).toContain('begin → beginning');
      expect(body).toContain('trọng âm');
      expect(t.tips.join(' ')).not.toContain('Chỉ gấp đôi');
    }
    for (const level of ['B2','B4']) {
      const t = read(level,'theory');
      const body = t.sections.map(s => s.body).join(' ');
      expect(body).toContain('I know the answer now.');
      expect(body).toContain('Today is Monday.');
      expect(JSON.stringify(t)).not.toMatch(/từ khóa thần thánh|chọn ngay|câu luôn chia/);
    }
  });

  it('keeps every changed sentence reconstructable and each current answer gradable', () => {
    for (const s of all.filter(changed)) {
      expect(joinTokens(s.tokens.map(t => t.text)), s.id).toBe(s.en);
      for (let target=0;target<s.blanks.length;target++) {
        const b=s.blanks[target];
        expect(s.tokens[b.tokenIndex].text, s.id).toBe(b.answer);
        expect(grade({kind:'fill', sentence:s, target}, b.answer), s.id).toBe(true);
      }
      for(const alt of s.orderAlternatives || [])
        expect(grade({kind:'order', sentence:s, target:0}, orderIndices(s, alt)), s.id).toBe(true);
    }
  });

  it('tests plural nouns in ten distinct natural contexts', () => {
    const group=all.filter(s=>s.level==='A2'&&+s.id.slice(-4)>=56&&+s.id.slice(-4)<=65);
    expect(new Set(group.map(s=>s.tokens[4].text)).size).toBe(10);
    for(const s of group) {
      expect(s.blanks[0].tokenIndex).toBe(1);
      expect(grade({kind:'fill',sentence:s,target:0},s.tokens[1].lemma)).toBe(false);
    }
    expect(get('A2-s-0065').en).toBe('The kites are very colorful.');
    expect(get('A2-s-0065').vi).not.toContain('nhanh nhẹn');
    expect(get('A2-s-0114').vi).toBe('Có năm người.');
    for(const s of all.filter(s=>s.level==='A2'&&+s.id.slice(-4)>=111&&+s.id.slice(-4)<=121))
      expect(s.vi).not.toMatch(/những|mọi người/);
  });

  it('keeps time meaning in natural Vietnamese negatives', () => {
    for(const s of all.filter(s=>s.level==='B2'&&+s.id.slice(-4)>=61&&+s.id.slice(-4)<=105)) {
      expect(s.vi).toMatch(/^(Lúc này|Hiện giờ), /);
      expect(s.vi).toContain('không');
      expect(s.vi).not.toContain('không đang');
    }
  });

  it('updates soup, toy plane and bedtime token meanings and quiz eligibility', () => {
    const soup=get('A3-s-0062');
    expect(soup.en).toBe('Is that soup hot?');
    expect(soup.tokens[2]).toMatchObject({text:'soup',feature:'uncountable',role:'subject'});
    expect(grade({kind:'roles',sentence:soup,target:soup.roleSpans.findIndex(r=>r.role==='subject')},[1,2])).toBe(true);
    const plane=get('B2-s-0172');
    expect(plane.en).toBe('The boy is flying a toy plane.');
    expect(grade({kind:'roles',sentence:plane,target:2},[4,5,6])).toBe(true);
    expect(grade({kind:'roles',sentence:plane,target:2},[4,6])).toBe(false);
    for(const id of ['B1-s-0076','B3-s-0188']) {
      const s=get(id);
      expect(s.en).toContain('go to bed');
      expect(s.exerciseTypes).not.toContain('roles');
      expect(grade({kind:'fill',sentence:s,target:0},'sleep')).toBe(false);
      expect(grade({kind:'fill',sentence:s,target:0},'go')).toBe(true);
      const wrong=s.tokens.map((_,i)=>i);[wrong[1],wrong[2]]=[wrong[2],wrong[1]];
      expect(grade({kind:'order',sentence:s,target:0},wrong)).toBe(false);
    }
    expect(read('A3','vocab').find(v=>v.id==='A3-v-0089').exampleEn).toBe("The cat's tail is long.");
  });

  it('bounds all 80 adjective blanks to explicit choices and rejects wrong choices', () => {
    const group=all.filter(s=>s.level==='A3'&&s.blanks.some(b=>s.tokens[b.tokenIndex].pos==='adjective'));
    expect(group).toHaveLength(80);
    for(const s of group)for(const [target,b] of s.blanks.entries()) {
      const choices=b.promptVi.match(/\(([^)]+)\)/)[1].split(' / ');
      expect(new Set(choices).size, s.id).toBe(3);
      expect(choices).toContain(b.answer);
      expect(b.promptVi).toContain('để điền nghĩa');
      for(const word of choices)expect(grade({kind:'fill',sentence:s,target},word),s.id).toBe(word===b.answer);
    }
  });

  it.each([
    ['A1','build-a1-full-data.mjs'],['A2','build-a2-data.mjs'],['A3','build-a3-data.mjs'],
    ['B1','generate-b1-sentences.mjs'],['B2','generate-b2-content.mjs'],['B3','build-b3-full.mjs'],['B4','build-b4-full.mjs'],
  ])('preserves the edits when regenerating %s in memory', (level,filename) => {
    const filepath=path.join(root,'scripts',filename), writes=new Map();
    const source=fs.readFileSync(filepath,'utf8').replace(/^import .*;\r?\n/gm,'').replace('fileURLToPath(import.meta.url)',JSON.stringify(filepath));
    vm.runInNewContext(source,{
      fs:{existsSync:()=>true,writeFileSync:(name,data)=>writes.set(path.basename(name),data)},path, structuredClone, applyReviewedOrder, applyContentReviewV4,
      applyCurriculumReview,applyReviewedAnnotations,applyExercisePrompts,applyTheoryReview,applyAdjectivePrompts,console:{log(){}},
    },{filename:filepath,timeout:10000});
    const generated=JSON.parse(writes.get(`${level}.sentences.json`));
    for(const s of generated.filter(changed)) {
      const live=get(s.id);
      for(const key of ['en','vi','tokens','roleSpans','blanks','exerciseTypes','grammarPoint'])expect(s[key],`${s.id}.${key}`).toEqual(live[key]);
      if(['B1-s-0076','B3-s-0188'].includes(s.id)) expect(s.orderAlternatives).toEqual(live.orderAlternatives);
    }
    if(['A2','B1','B2','B3','B4'].includes(level))expect(JSON.parse(writes.get(`${level}.theory.json`))).toEqual(read(level,'theory'));
    if(level==='A3')expect(JSON.parse(writes.get('A3.vocab.json')).find(v=>v.id==='A3-v-0089')).toEqual(read('A3','vocab').find(v=>v.id==='A3-v-0089'));
  });
});
