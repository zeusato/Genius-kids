// Lớp 1 — Hình phẳng, khối, vị trí (g1_geometry).
import { tpl, fromTemplates, single, choices, rint, pickOne, shuffle, sample } from '../kit';
import { around } from '../wrongs';
import { word } from './common';
import { SHAPE_NAME } from '../preschool/shapes';
import type { Template } from '../../study/types';
import type { ColorKey } from '../svg';

type Kind = 'square' | 'rectangle' | 'circle' | 'triangle';
const KINDS = Object.keys(SHAPE_NAME) as Kind[];
const COLORS: ColorKey[] = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink'];
const names = KINDS.map(k => SHAPE_NAME[k]);
const ANIMALS: [string, string][] = [['🐶', 'chó'], ['🐱', 'mèo'], ['🐰', 'thỏ'], ['🐻', 'gấu'], ['🐸', 'ếch'], ['🐷', 'lợn'], ['🦊', 'cáo']];

export const templates: Template[] = [
    tpl('g1.shapes2d', 1, () => {
        const kind = pickOne(KINDS);
        return choices({ q: 'Đây là hình gì?', speech: 'Đây là hình gì?', options: shuffle(names), correct: SHAPE_NAME[kind],
            visual: { fn: 'shapeVariantSVG', args: [kind, pickOne(COLORS), kind === 'circle' ? 0 : pickOne([0, 20, 45, 90]), pickOne([0.75, 1])] },
            explanation: { square: 'Hình vuông có 4 cạnh dài bằng nhau.', rectangle: 'Hình chữ nhật có 4 cạnh: 2 cạnh dài, 2 cạnh ngắn.', circle: 'Hình tròn không có cạnh, không có góc.', triangle: 'Hình tam giác có 3 cạnh.' }[kind] });
    }),
    tpl('g1.shapes2d', 2, () => {
        const target = pickOne(KINDS), n = rint(2, 6), others = rint(3, 7);
        const items = shuffle([
            ...Array.from({ length: n }, () => ({ kind: target, color: pickOne(COLORS), rotate: target === 'circle' ? 0 : pickOne([0, 30, 60]) })),
            ...Array.from({ length: others }, () => { const k = pickOne(KINDS.filter(x => x !== target)); return { kind: k, color: pickOne(COLORS), rotate: k === 'circle' ? 0 : pickOne([0, 30]) }; }),
        ]);
        const nm = SHAPE_NAME[target].toLowerCase();
        return single({ q: `Trong hình có mấy ${nm}?`, speech: `Trong hình có mấy ${nm}?`, visual: { fn: 'mixedShapesSVG', args: [items] },
            correct: n, wrong: around(n, { min: 0, max: 12 }), min: 0, max: 12,
            explanation: `Đếm riêng các ${nm} (kể cả hình bị xoay): có ${word(n)} ${nm}.`, hint: `Chỉ đếm ${nm}, bỏ qua các hình khác.` });
    }),
    tpl('g1.shapes3d', 1, () => {
        const solid = pickOne([['cube', 'Khối lập phương', ['🎲', 'Con xúc xắc']], ['box', 'Khối hộp chữ nhật', ['📦', 'Thùng giấy']], ['box', 'Khối hộp chữ nhật', ['🧱', 'Viên gạch']], ['cube', 'Khối lập phương', ['🧊', 'Viên đá lạnh']]] as const);
        const [kind, name, [e, obj]] = solid;
        const showObj = rint(0, 1) === 1;
        return choices({ q: showObj ? `${obj} có dạng khối gì?` : 'Đây là khối gì?', speech: showObj ? `${obj} có dạng khối gì?` : 'Đây là khối gì?',
            visual: showObj ? { fn: 'bigEmojiSVG', args: [e] } : { fn: 'solidSVG', args: [kind, pickOne(COLORS)] },
            options: ['Khối lập phương', 'Khối hộp chữ nhật'], correct: name,
            explanation: kind === 'cube' ? 'Khối lập phương có các mặt đều là hình vuông.' : 'Khối hộp chữ nhật có các mặt là hình chữ nhật.' });
    }),
    tpl('g1.position', 1, () => {
        const [e, n] = pickOne(ANIMALS), where = pickOne(['above', 'below', 'left', 'right'] as const);
        const W = { above: 'Ở trên', below: 'Ở dưới', left: 'Bên trái', right: 'Bên phải' };
        return choices({ q: `Bạn ${n} ở đâu so với cái bàn?`, speech: `Bạn ${n} ở đâu so với cái bàn?`, visual: { fn: 'positionSceneSVG', args: [e, where] },
            options: Object.values(W), correct: W[where], explanation: `Nhìn từ phía em, bạn ${n} ${W[where].toLowerCase()} cái bàn.` });
    }),
    tpl('g1.position', 2, () => {
        const row = sample(ANIMALS, 3), ask = pickOne(['middle', 'left', 'right'] as const), mid = row[1];
        const visual = { fn: 'rowSVG', args: [row.map(r => r[0])] };
        if (ask === 'middle') return choices({ q: 'Bạn nào đứng ở giữa?', speech: 'Bạn nào đứng ở giữa?', visual,
            options: shuffle(row.map(r => `Bạn ${r[1]}`)), correct: `Bạn ${mid[1]}`, explanation: `Bạn ${mid[1]} đứng giữa bạn ${row[0][1]} và bạn ${row[2][1]}.` });
        const target = ask === 'left' ? row[0] : row[2];
        return choices({ q: `Bạn nào đứng ngay bên ${ask === 'left' ? 'trái' : 'phải'} bạn ${mid[1]}?`, speech: `Bạn nào đứng ngay bên ${ask === 'left' ? 'trái' : 'phải'} bạn ${mid[1]}?`,
            visual, options: shuffle([row[0], row[2]].map(r => `Bạn ${r[1]}`)), correct: `Bạn ${target[1]}`,
            explanation: `Nhìn từ phía em: bạn ${target[1]} đứng ngay bên ${ask === 'left' ? 'trái' : 'phải'} bạn ${mid[1]}.` });
    }),
];

export const generateGeometry = fromTemplates(templates);
