import { describe, it, expect } from 'vitest';
import { TOPICS, generateQuestions } from '../mathEngine';
import { QuestionType } from '../../types';
import { sameValue } from '../study/value';

// Kiểm đề SAU khi dựng phiên (buildSession). Bất biến chặt hơn trên câu gốc: invariants.test.ts.
// Bỏ qua các chủ đề luyện gõ (nội dung là văn bản, không phải câu hỏi trắc nghiệm).
const QUIZ_TOPICS = TOPICS.filter(t => !t.id.includes('typing'));

describe('Tất cả topic — đề hợp lệ sau khi dựng phiên', () => {
    for (const topic of QUIZ_TOPICS) {
        it(`${topic.id} (${topic.title})`, () => {
            const qs = generateQuestions([topic.id], 30);
            for (const q of qs) {
                expect(q.questionText, `${topic.id}: thiếu nội dung`).toBeTruthy();
                expect(q.questionText).not.toMatch(/undefined|NaN/);
                if (q.visualSvg) expect(q.visualSvg).not.toMatch(/NaN|undefined/);
                if (q.type === QuestionType.SingleChoice || q.type === QuestionType.SelectWrong) {
                    expect(q.options, `${topic.id}: thiếu options`).toBeTruthy();
                    expect(q.options!.length, `${topic.id}: cần 2–4 đáp án`).toBeGreaterThanOrEqual(2);
                    expect(q.options!.length).toBeLessThanOrEqual(4);
                    for (let i = 0; i < q.options!.length; i++) for (let j = i + 1; j < q.options!.length; j++)
                        expect(sameValue(q.options![i], q.options![j]), `${topic.id}: đáp án trùng giá trị ${q.options}`).toBe(false);
                    expect(q.options, `${topic.id}: thiếu đáp án đúng trong options`).toContain(q.correctAnswer);
                } else if (q.type === QuestionType.MultipleSelect) {
                    expect(q.correctAnswers && q.correctAnswers.length).toBeGreaterThan(0);
                    for (const c of q.correctAnswers!) expect(q.options).toContain(c);
                } else if (q.type === QuestionType.ManualInput) {
                    expect(String(q.correctAnswer ?? '').length, `${topic.id}: thiếu đáp án`).toBeGreaterThan(0);
                }
            }
        });
    }
});
