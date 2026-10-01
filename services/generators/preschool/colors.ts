// Mầm non — Màu sắc (mn_colors). Lựa chọn là SỐ của ô màu để bé chưa biết chữ vẫn làm được.
import { tpl, fromTemplates, single, choices, pickOne, sample, shuffle } from '../kit';
import type { Template } from '../../study/types';

export const COLORS: [string, string][] = [
    ['đỏ', '#ef4444'], ['xanh dương', '#3b82f6'], ['xanh lá', '#22c55e'], ['vàng', '#facc15'],
    ['tím', '#a855f7'], ['cam', '#f97316'], ['hồng', '#f472b6'], ['nâu', '#92400e'],
];
const hex = (name: string) => COLORS.find(c => c[0] === name)![1];
const THINGS: { e: string; n: string; color: string }[] = [
    { e: '🍌', n: 'Quả chuối', color: 'vàng' }, { e: '🍓', n: 'Quả dâu', color: 'đỏ' }, { e: '🥕', n: 'Củ cà rốt', color: 'cam' },
    { e: '🍆', n: 'Quả cà tím', color: 'tím' }, { e: '🐸', n: 'Chú ếch', color: 'xanh lá' }, { e: '🐷', n: 'Chú lợn', color: 'hồng' },
    { e: '🍀', n: 'Chiếc lá', color: 'xanh lá' }, { e: '🍊', n: 'Quả cam', color: 'cam' }, { e: '🍅', n: 'Quả cà chua', color: 'đỏ' },
    { e: '🍇', n: 'Chùm nho', color: 'tím' }, { e: '🐻', n: 'Bạn gấu', color: 'nâu' }, { e: '🌻', n: 'Bông hoa hướng dương', color: 'vàng' },
];

export const templates: Template[] = [
    tpl('mn.colors', 1, () => {
        const pick = sample(COLORS, 4), target = pickOne(pick);
        return single({
            q: `Ô số mấy có màu ${target[0]}?`, speech: `Ô số mấy có màu ${target[0]}?`,
            visual: { fn: 'swatchesSVG', args: [pick.map(c => c[1])] },
            correct: pick.indexOf(target) + 1, wrong: [1, 2, 3, 4], keepOrder: true,
            explanation: `Ô số ${pick.indexOf(target) + 1} có màu ${target[0]}.`,
        });
    }, { noRankCheck: true }),
    tpl('mn.colors', 1, () => {
        const t = pickOne(THINGS);
        const others = sample(COLORS.filter(c => c[0] !== t.color), 3).map(c => c[0]);
        const names = shuffle([t.color, ...others]);
        return single({
            q: `${t.n} có màu giống ô số mấy?`, speech: `${t.n} có màu giống ô số mấy?`,
            visual: { fn: 'swatchesSVG', args: [names.map(hex), t.e] },
            correct: names.indexOf(t.color) + 1, wrong: [1, 2, 3, 4], keepOrder: true,
            explanation: `${t.n} có màu ${t.color}.`,
        });
    }, { noRankCheck: true }),
    tpl('mn.colors', 1, () => {
        const c = pickOne(COLORS), names = shuffle([c[0], ...sample(COLORS.filter(x => x !== c), 3).map(x => x[0])]);
        const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
        return choices({
            q: 'Đây là màu gì?', speech: `Đây là màu gì? ${names.join(', ')}?`,
            visual: { fn: 'swatchSVG', args: [c[1]] }, options: names.map(cap), correct: cap(c[0]),
            explanation: `Đây là màu ${c[0]}.`,
        });
    }),
];

export const generatePreschoolColors = fromTemplates(templates);
