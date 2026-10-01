import { expect, it } from 'vitest';
import { QuestionType, type TestResult } from '../../types';
import { compactResult, migrateHistory } from './compact';

it('lịch sử 30 bài không giữ SVG nặng nhưng dựng lại được hình từ spec', () => {
    const result: TestResult = { id: 'r', date: '2026-10-01', score: 10, starsEarned: 0, totalQuestions: 10, durationSeconds: 60, topicIds: ['g1_numbers_5'], questions: Array.from({ length: 10 }, (_, i) => ({
        id: String(i), topicId: 'g1_numbers_5', type: QuestionType.SingleChoice, questionText: 'Có bao nhiêu đồ vật?', options: ['1', '2'], correctAnswer: '1', explanation: 'Đếm lần lượt các đồ vật.',
        visualSvg: '<svg>' + ' '.repeat(70_000) + '</svg>', visual: { fn: 'fractionBarSVG', args: [1, 2] },
    })) };
    const history = migrateHistory(Array.from({ length: 30 }, (_, i) => ({ ...result, id: String(i) })));
    expect(new TextEncoder().encode(JSON.stringify(history)).length).toBeLessThan(300_000);
    expect(compactResult(result).questions[0].visualSvg).toBeUndefined();
    expect(history[0].questions[0].visual).toEqual(result.questions[0].visual);
});
