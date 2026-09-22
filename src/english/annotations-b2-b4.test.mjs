import { applyReviewedOrder } from '../../scripts/english-reviewed-order.mjs';
import { applyCurriculumReview } from '../../scripts/english-curriculum-review.mjs';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { applyContentReviewV4 } from '../../scripts/english-content-review-v4.mjs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { grade } from './engine';
import { validateContent } from './validation.mjs';
import { applyReviewedAnnotations, reviewedAnnotations } from '../../scripts/english-reviewed-annotations.mjs';
import { applyExercisePrompts } from '../../scripts/english-exercise-prompts.mjs';
import { applyTheoryReview } from '../../scripts/english-theory-review.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const corpus = ['B2', 'B3', 'B4'].flatMap(level =>
  JSON.parse(fs.readFileSync(path.join(root, 'src/data/english', `${level}.sentences.json`), 'utf8')),
);
const sentence = id => corpus.find(s => s.id === id);
const phrase = (id, role, text) => {
  const s = sentence(id);
  const target = s.roleSpans.findIndex(r => r.role === role &&
    r.tokenIndices.map(i => s.tokens[i].text).join(' ') === text);
  expect(target, `${id}: ${role} = ${text}`).toBeGreaterThanOrEqual(0);
  return { s, target };
};

describe('reviewed B2–B4 annotations (fix-list 03–04)', () => {
  it.each([
    ['B2-s-0001', 'object', 'a book'],
    ['B2-s-0006', 'object', 'my room'],
    ['B2-s-0151', 'adverbial', 'in the park'],
    ['B4-s-0116', 'verb', 'am going to buy'],
    ['B4-s-0153', 'verb', 'do not like'],
    ['B4-s-0011', 'complement', 'a doctor'],
    ['B4-s-0098', 'complement', 'a famous artist'],
    ['B3-s-0066', 'adverbial', "at three o'clock"],
  ])('grades the complete phrase in %s', (id, role, text) => {
    const { s, target } = phrase(id, role, text);
    const indices = s.roleSpans[target].tokenIndices;
    const exercise = { kind: 'roles', sentence: s, target };
    expect(s.exerciseTypes).toContain('roles');
    expect(grade(exercise, indices)).toBe(true);
    expect(grade(exercise, indices.slice(1))).toBe(false);
  });

  it.each([
    ['B3-s-0001', 'happy', 'yesterday'],
    ['B3-s-0002', 'at home', 'last night'],
    ['B3-s-0010', 'ten years old', 'last year'],
  ])('separates complement and time in %s', (id, complement, time) => {
    phrase(id, 'complement', complement);
    phrase(id, 'adverbial', time);
  });

  it('includes negation and missing linking complements', () => {
    for (const suffix of ['0167', '0180', '0189', '0198']) {
      const s = sentence(`B4-s-${suffix}`);
      const not = s.tokens.findIndex(t => t.text === 'not');
      expect(s.roleSpans.find(r => r.role === 'verb').tokenIndices).toContain(not);
    }
    for (const [suffix, text] of [['0047','late'],['0061','lonely'],['0079','cold'],['0095','warm'],['0111','free']])
      phrase(`B4-s-${suffix}`, 'complement', text);
  });

  it('uses local POS and verb features independently from phrase function', () => {
    for (const s of corpus.filter(s => reviewedAnnotations[s.id])) {
      s.tokens.forEach((t, i) => {
        if (['last', 'next'].includes(t.text.toLowerCase()) && s.tokens[i + 1]?.pos === 'noun') {
          expect(t.pos, s.id).toBe('adjective');
          expect(t.role, s.id).toBe('modifier');
        }
        if (['was', 'were', "wasn't", "weren't"].includes(t.text.toLowerCase()))
          expect(t.feature, s.id).toBe(t.text.endsWith("n't") ? 'past-neg' : 'past');
      });
    }
    for (const id of ['B3-s-0111', 'B3-s-0137'])
      expect(sentence(id).tokens.find(t => t.text === 'to').pos).toBe('particle');
    const s = sentence('B2-s-0151');
    expect(s.tokens[3].role).toBe('prep');
    expect(s.tokens[5].role).toBe('prep-object');
  });

  it('withholds ambiguous constructions and covers each enabled role sentence once', () => {
    for (const id of ['B3-s-0109','B3-s-0129','B3-s-0111','B3-s-0137','B4-s-0050','B4-s-0072','B4-s-0126','B4-s-0128','B3-s-0062'])
      expect(sentence(id).exerciseTypes, id).not.toContain('roles');
    for (const s of corpus.filter(s => reviewedAnnotations[s.id] && s.exerciseTypes.includes('roles'))) {
      const indices = s.roleSpans.flatMap(r => r.tokenIndices);
      expect(new Set(indices).size, s.id).toBe(indices.length);
      expect([...indices].sort((a,b) => a-b), s.id).toEqual(s.tokens.flatMap((t,i) => t.pos === 'punct' ? [] : [i]));
      expect(new Set(s.roleSpans.map(r => `${r.clauseId}/${r.role}`)).size, s.id).toBe(s.roleSpans.length);
      expect(s.roleSpans.some(r => r.tokenIndices.length === 1 && s.tokens[r.tokenIndices[0]].pos === 'preposition'), s.id).toBe(false);
    }
  });

  it('validates all three sentence files and applies idempotently', () => {
    for (const level of ['B2','B3','B4'])
      expect(validateContent('sentences', corpus.filter(s => s.level === level), { level }).errors).toEqual([]);
    for (const s of corpus) expect(applyReviewedAnnotations(s), s.id).toEqual(s);
  });

  it('preserves unrelated edits, does not re-enable quizzes, and rejects stale token indices', () => {
    const s = structuredClone(sentence('B2-s-0001'));
    s.vi = 'Edited translation';
    s.blanks[0].hint = 'Edited hint';
    s.exerciseTypes = ['fill'];
    const copy = structuredClone(s);
    const applied = applyReviewedAnnotations(s);
    expect(s).toEqual(copy);
    expect(applied.vi).toBe(s.vi);
    expect(applied.blanks).toEqual(s.blanks);
    expect(applied.exerciseTypes).toEqual(['fill']);
    s.tokens.splice(1, 0, { text: 'also', pos: 'adverb', role: 'adverbial' });
    expect(() => applyReviewedAnnotations(s)).toThrow(/token sequence changed/);
    expect(applyReviewedAnnotations(sentence('B4-s-0027'))).toEqual(sentence('B4-s-0027'));
  });

  it.each(['generate-b2-content.mjs','build-b3-full.mjs','build-b4-full.mjs'])('keeps %s output reviewed without touching disk', filename => {
    const filepath = path.join(root, 'scripts', filename);
    const writes = new Map();
    const source = fs.readFileSync(filepath, 'utf8')
      .replace(/^import .*;\r?\n/gm, '')
      .replace('fileURLToPath(import.meta.url)', JSON.stringify(filepath));
    vm.runInNewContext(source, {
      fs: { writeFileSync: (name, data) => writes.set(path.basename(name), data) },
      path, structuredClone, applyReviewedOrder, applyContentReviewV4, applyCurriculumReview, applyReviewedAnnotations, applyExercisePrompts, applyTheoryReview, console: { log() {} },
    }, { filename: filepath, timeout: 10000 });
    const output = [...writes.entries()].find(([name]) => name.endsWith('.sentences.json'));
    expect(output).toBeDefined();
    const generated = JSON.parse(output[1]);
    expect(generated).toHaveLength(200);
    for (const s of generated.filter(s => reviewedAnnotations[s.id])) {
      const live = sentence(s.id);
      expect(s.roleSpans, s.id).toEqual(live.roleSpans);
      expect(s.tokens, s.id).toEqual(live.tokens);
      expect(s.exerciseTypes, s.id).toEqual(live.exerciseTypes);
      expect(s.blanks, s.id).toEqual(live.blanks);
    }
  });
});
