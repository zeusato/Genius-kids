// Cú pháp rút gọn cho các ví dụ viết tay; không sinh nội dung từ câu luyện.
import { form, step, worked } from '../build';
import type { Level } from '../../types';
import type { Form, Worked, WorkedStep } from '../types';

export function example(id: string, title: string, level: Level, cue: string, steps: string[], problem: string, solution: WorkedStep[], answer: string, extra: Partial<Worked> = {}): Form {
    return form({ id, title, level, cue, steps, example: worked({ layout: 'calc', problem, steps: solution, answer, ...extra }) });
}
export { step };
