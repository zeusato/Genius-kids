import { applyReviewedOrder } from '../../scripts/english-reviewed-order.mjs';
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { grade, joinTokens } from './engine';
import { validateContent } from './validation.mjs';
import { applyExercisePrompts } from '../../scripts/english-exercise-prompts.mjs';
import { applyTheoryReview } from '../../scripts/english-theory-review.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const corpus = ['A2','B2','B3','B4'].flatMap(level =>
  JSON.parse(fs.readFileSync(path.join(root, 'src/data/english', `${level}.sentences.json`), 'utf8')),
);
const get = id => corpus.find(s => s.id === id);

describe('content fixes 05–06', () => {
  it.each(Array.from({ length: 10 }, (_, i) => `B2-s-${String(i + 61).padStart(4, '0')}`))('keeps %s correctly tokenized, graded and ordered', id => {
    const s = get(id);
    expect(s.tokens.map(t => t.text).slice(0, 3)).toEqual(['I', 'am', 'not']);
    expect(s.tokens.every(t => !/\s/.test(t.text))).toBe(true);
    expect(s.tokens[1].feature).toBe('present-1sg');
    expect(s.tokens[2]).toEqual({ text: 'not', pos: 'adverb', role: 'adverbial' });
    expect(s.exerciseTypes).toEqual(['pos','fill','order','roles']);
    const target = s.roleSpans.findIndex(r => r.role === 'verb');
    expect(grade({ kind: 'roles', sentence: s, target }, [1,2,3])).toBe(true);
    expect(grade({ kind: 'roles', sentence: s, target }, [1,3])).toBe(false);
    const blank = s.blanks[0];
    const beBlank = ['B2-s-0061','B2-s-0066'].includes(id);
    expect(blank.tokenIndex).toBe(beBlank ? 1 : 3);
    expect(blank.answer).toBe(s.tokens[blank.tokenIndex].text);
    expect(grade({ kind: 'fill', sentence: s, target: 0 }, blank.answer)).toBe(true);
    if (beBlank) expect(grade({ kind: 'fill', sentence: s, target: 0 }, 'am not')).toBe(false);
    const order = s.tokens.map((_, i) => i);
    expect(joinTokens(s.tokens.map(t => t.text))).toBe(s.en);
    expect(grade({ kind: 'order', sentence: s, target: 0 }, order)).toBe(true);
  });

  it('keeps complete object/prepositional phrases after the inserted token', () => {
    expect(get('B2-s-0069').roleSpans.find(r => r.role === 'object').tokenIndices).toEqual([4,5]);
    expect(get('B2-s-0070').roleSpans.find(r => r.role === 'adverbial').tokenIndices).toEqual([4,5]);
    expect(get('B2-s-0070').tokens[4].role).toBe('prep');
    expect(get('B2-s-0070').tokens[5].role).toBe('prep-object');
  });

  it('does not reveal a conjugated answer or an auxiliary in any B2–B4 prompt', () => {
    for (const s of corpus.filter(s => s.level !== 'A2')) for (const b of s.blanks) {
      const t = s.tokens[b.tokenIndex];
      // A short reply needs its antecedent question; inspect only the instruction
      // for answer leakage. Contrast tasks deliberately do not name the tense.
      const instruction = s.tags.includes('short-answer-context') ? b.promptVi.replace(/“[^”]+”/g, '') : b.promptVi;
      expect(b.promptVi, s.id).not.toMatch(/→|gấp đôi|nhân đôi|bỏ e|thêm -?(ed|ing)|nguyên thể|\bbase\b|giữ nguyên|Sau /i);
      // An unchanged lexical lemma is still a valid input to a conjugation task
      // (read/past, play/after a modal). Auxiliaries must never be supplied.
      if (b.answer.toLowerCase() === t.lemma && !t.feature.startsWith('aux-')) {
        expect(b.promptVi, s.id).toContain(s.tags.includes('contrast') ? `chia ${t.lemma}` : `Chia động từ ${t.lemma}`);
      } else {
        const escaped = b.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        expect(instruction, s.id).not.toMatch(new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, 'iu'));
      }
      expect(b.promptVi, s.id).toMatch(s.tags.includes('contrast') ? /thói quen.*đang diễn ra/ : /hiện tại tiếp diễn|quá khứ đơn|dạng quá khứ của be|hiện tại đơn|tương lai/);
      expect(b.hint.length, s.id).toBeGreaterThan(0);
    }
  });

  it('preserves tense, polarity, contraction and spelling help', () => {
    expect(get('B3-s-0041').blanks[0].promptVi).toMatch(/watch.*khẳng định.*quá khứ đơn/);
    expect(get('B3-s-0142').blanks[0].promptVi).toMatch(/watch.*phủ định.*quá khứ đơn/);
    expect(get('B3-s-0171').blanks[0].promptVi).toMatch(/trợ động từ.*nghi vấn.*quá khứ đơn/);
    expect(get('B4-s-0046').blanks[0].promptVi).toMatch(/phủ định.*tương lai đơn/);
    expect(get('B4-s-0046').blanks[0].promptVi).not.toMatch(/viết tắt|rút gọn/);
    expect(get('B4-s-0119').blanks[0].promptVi).toMatch(/go.*dự định tương lai/);
    expect(get('B4-s-0189').blanks[0].promptVi).toMatch(/Chỉ điền một từ; từ phủ định đã có/);
    expect(get('B4-s-0189').blanks[0].answer).toBe('will');
    expect(get('B2-s-0151').blanks[0].hint).toContain('gấp đôi n');
    expect(get('B4-s-0166').blanks[0].hint).toContain('bỏ e');
  });

  it('replaces the A2 copy exercise and removes answer-specific instructions', () => {
    for (const [id, answer] of [['A2-s-0147','is'],['A2-s-0148','are']]) {
      const s = get(id);
      expect(s.blanks[0].tokenIndex).toBe(1);
      expect(s.blanks[0].answer).toBe(answer);
      expect(grade({ kind: 'fill', sentence: s, target: 0 }, answer)).toBe(true);
      expect(grade({ kind: 'fill', sentence: s, target: 0 }, 'There')).toBe(false);
    }
    expect(get('A2-s-0198').blanks[0].promptVi).toMatch(/mạo từ.*nhóm táo đỏ.*đều biết/);
    expect(get('A2-s-0198').blanks[0].promptVi).not.toMatch(/\bthe\b/i);
    for (const s of corpus.filter(s => s.level === 'A2')) for (const b of s.blanks)
      expect(b.promptVi, s.id).not.toMatch(/giữ nguyên|\(-es|\(-ies|âm câm|phiên âm/);
  });

  it('keeps all blanks valid and normalizes prompts without mutation or repetition', () => {
    for (const level of ['A2','B2','B3','B4'])
      expect(validateContent('sentences', corpus.filter(s => s.level === level), { level }).errors).toEqual([]);
    for (const s of corpus) {
      const before = structuredClone(s);
      expect(applyExercisePrompts(s), s.id).toEqual(s);
      expect(s).toEqual(before);
    }
  });

  it('regenerates A2 blanks without writing any files', () => {
    const filepath = path.join(root, 'scripts/build-a2-data.mjs');
    const writes = new Map();
    const source = fs.readFileSync(filepath, 'utf8').replace(/^import .*;\r?\n/gm, '');
    vm.runInNewContext(source, {
      fs: { existsSync: () => true, writeFileSync: (name, data) => writes.set(path.basename(name), data) },
      path, structuredClone, applyReviewedOrder, applyExercisePrompts, applyTheoryReview, console: { log() {} },
    }, { filename: filepath, timeout: 10000 });
    const generated = JSON.parse(writes.get('A2.sentences.json'));
    expect(generated).toHaveLength(200);
    for (const s of generated) expect(s.blanks, s.id).toEqual(get(s.id).blanks);
  });
});
