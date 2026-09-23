import { describe, expect, it } from 'vitest';
import a1 from '../data/english/A1.theory.json';
import a3 from '../data/english/A3.theory.json';
import b1 from '../data/english/B1.theory.json';
import b2 from '../data/english/B2.theory.json';
import b3 from '../data/english/B3.theory.json';
import { questionAnswers } from './dialogue';

describe('Reviewed question and answer presentation', () => {
  it('separates the A1 question from both responses without splitting verb choices', () => {
    expect(questionAnswers(a1.formulas[2].pattern)).toEqual([{
      question: 'Am / Is / Are + S + Bổ ngữ?',
      answers: [
        { text: 'Yes, S + be.', kind: 'yes' },
        { text: 'No, S + be not.', kind: 'no' },
      ],
    }]);
    expect(questionAnswers(a1.formulas[2].example)).toEqual([{
      question: 'Are you ready?',
      answers: [
        { text: 'Yes, I am.', kind: 'yes' },
        { text: 'No, I am not.', kind: 'no' },
      ],
    }]);
  });

  it('keeps each B1 response with its own question, including pipe-separated answers', () => {
    expect(questionAnswers(b1.formulas[3].example)).toEqual([
      { question: 'Do you play badminton?', answers: [{ text: 'Yes, I do.', kind: 'yes' }] },
      { question: 'Does she speak English?', answers: [{ text: "No, she doesn't.", kind: 'no' }] },
    ]);
    expect(questionAnswers(b1.formulas[3].pattern)?.[0].answers).toEqual([
      { text: 'Yes, S + do/does.', kind: 'yes' },
      { text: "No, S + don't/doesn't.", kind: 'no' },
    ]);
  });

  it('handles the dash notation used in continuous and past tense examples', () => {
    for (const example of [b2.formulas[2].example, b3.formulas[3].example]) {
      const pairs = questionAnswers(example)!;
      expect(pairs).toHaveLength(1);
      expect(pairs[0].question.endsWith('?')).toBe(true);
      expect(pairs[0].answers.map(answer => answer.kind)).toEqual(['yes', 'no']);
      expect(pairs[0].answers.map(answer => answer.text).join(' / ')).toBe(example.split(' - ')[1]);
    }
  });

  it('keeps Whose question alternatives intact and displays open answers without Yes/No labels', () => {
    expect(questionAnswers(a3.formulas[4].pattern)).toEqual([{
      question: 'Whose + Noun + is this / are these?',
      answers: [{ text: 'It is...', kind: 'answer' }, { text: 'They are...', kind: 'answer' }],
    }]);
    expect(questionAnswers('Whose + danh từ số ít + is this / that? → Trả lời: It is + cụm sở hữu.')).toEqual([{
      question: 'Whose + danh từ số ít + is this / that?',
      answers: [{ text: 'It is + cụm sở hữu.', kind: 'answer' }],
    }]);
  });

  it('leaves formulas, transformations and question translations unchanged', () => {
    for (const text of ['S + am / is / are + V-ing', 'play → plays', 'They play football. ↔ Do they play football?', 'What is your name? (Tên bạn là gì?)']) {
      expect(questionAnswers(text)).toBeNull();
    }
  });
});
