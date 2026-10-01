// Mầm non — Thời gian (mn_time): buổi sáng / trưa / chiều / tối; hôm qua – hôm nay – ngày mai.
import { tpl, fromTemplates, choices, pickOne } from '../kit';
import type { Template } from '../../study/types';

const PARTS = [['morning', 'Buổi sáng'], ['noon', 'Buổi trưa'], ['afternoon', 'Buổi chiều'], ['night', 'Buổi tối']] as const;
const NAMES = PARTS.map(p => p[1]);
const ACTS: [string, string][] = [
    ['Ông mặt trời mọc', 'Buổi sáng'], ['Bé đánh răng, ăn sáng rồi đi học', 'Buổi sáng'], ['Bé ăn cơm trưa ở lớp', 'Buổi trưa'],
    ['Bé ngủ trưa', 'Buổi trưa'], ['Mẹ đón bé tan học về nhà', 'Buổi chiều'], ['Ông mặt trời lặn', 'Buổi chiều'],
    ['Cả nhà ăn cơm tối', 'Buổi tối'], ['Bầu trời có trăng và sao', 'Buổi tối'], ['Bé đi ngủ', 'Buổi tối'],
];
const EVENTS = ['đi công viên', 'thăm bà', 'đi sở thú', 'học vẽ', 'đi bơi', 'ăn sinh nhật bạn', 'đi xem xiếc', 'trồng cây'];

export const templates: Template[] = [
    tpl('mn.daytime', 1, () => {
        const [kind, name] = pickOne(PARTS);
        return choices({
            q: 'Bức tranh vẽ buổi nào trong ngày?', speech: 'Bức tranh vẽ buổi nào trong ngày? Buổi sáng, buổi trưa, buổi chiều hay buổi tối?',
            visual: { fn: 'dayPartSVG', args: [kind] }, options: [...NAMES], correct: name,
            explanation: kind === 'night' ? 'Trời tối, có trăng và sao: đó là buổi tối.' : kind === 'noon' ? 'Mặt trời lên cao trên đỉnh đầu: đó là buổi trưa.' : kind === 'morning' ? 'Mặt trời vừa mọc: đó là buổi sáng.' : 'Mặt trời sắp lặn: đó là buổi chiều.',
        });
    }),
    tpl('mn.daytime', 1, () => {
        const [act, part] = pickOne(ACTS);
        return choices({
            q: `${act} vào buổi nào?`, speech: `${act} vào buổi nào? Buổi sáng, buổi trưa, buổi chiều hay buổi tối?`,
            options: [...NAMES], correct: part, explanation: `${act} vào ${part.toLowerCase()}.`,
        });
    }),
    tpl('mn.daytime', 2, () => {
        const ev = pickOne(EVENTS), past = pickOne([true, false]);
        return choices({
            q: `${past ? 'Hôm qua' : 'Ngày mai'} bé ${ev}. Việc ${ev} đã xảy ra rồi hay chưa?`,
            speech: `${past ? 'Hôm qua' : 'Ngày mai'} bé ${ev}. Việc ${ev} đã xảy ra rồi, hay chưa xảy ra?`,
            options: ['Đã xảy ra rồi', 'Chưa xảy ra'], correct: past ? 'Đã xảy ra rồi' : 'Chưa xảy ra',
            explanation: past ? 'Hôm qua là ngày trước hôm nay, nên việc đó đã xảy ra rồi.' : 'Ngày mai là ngày sau hôm nay, nên việc đó chưa xảy ra.',
        });
    }),
    tpl('mn.daytime', 2, () => {
        const ev = pickOne(EVENTS), when = pickOne(['Hôm qua', 'Hôm nay', 'Ngày mai'] as const);
        const q = { 'Hôm qua': `Bé ${ev} vào ngày trước hôm nay. Đó là ngày nào?`, 'Hôm nay': `Bé đang ${ev} ngay bây giờ. Đó là ngày nào?`, 'Ngày mai': `Bé sẽ ${ev} vào ngày sau hôm nay. Đó là ngày nào?` }[when];
        return choices({
            q, speech: `${q} Hôm qua, hôm nay hay ngày mai?`, options: ['Hôm qua', 'Hôm nay', 'Ngày mai'], correct: when,
            explanation: `${when === 'Hôm qua' ? 'Ngày trước hôm nay là hôm qua' : when === 'Ngày mai' ? 'Ngày sau hôm nay là ngày mai' : 'Ngày đang diễn ra là hôm nay'}.`,
        });
    }),
];

export const generatePreschoolTime = fromTemplates(templates);
