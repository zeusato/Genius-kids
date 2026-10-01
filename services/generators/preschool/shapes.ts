// Mầm non — Hình và vị trí (mn_shapes): hình phẳng (mọi màu/góc xoay/cỡ), khối, to–nhỏ, vị trí.
import { tpl, fromTemplates, single, choices, pickOne, chance, shuffle } from '../kit';
import type { Template } from '../../study/types';
import type { ColorKey } from '../svg';

type Kind = 'square' | 'rectangle' | 'circle' | 'triangle';
export const SHAPE_NAME: Record<Kind, string> = { square: 'Hình vuông', rectangle: 'Hình chữ nhật', circle: 'Hình tròn', triangle: 'Hình tam giác' };
const KINDS = Object.keys(SHAPE_NAME) as Kind[];
const COLORS: ColorKey[] = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink'];
const spoken = (names: string[]) => names.map(n => n.toLowerCase()).join(', ');

const SOLIDS: { kind: 'sphere' | 'cylinder' | 'cube' | 'box'; name: string; things: { e: string; n: string }[] }[] = [
    { kind: 'sphere', name: 'Khối cầu', things: [{ e: '⚽', n: 'Quả bóng' }, { e: '🍊', n: 'Quả cam' }, { e: '🏀', n: 'Quả bóng rổ' }] },
    { kind: 'cylinder', name: 'Khối trụ', things: [{ e: '🥫', n: 'Hộp sữa tròn' }, { e: '🥁', n: 'Cái trống' }, { e: '🕯️', n: 'Cây nến' }] },
    { kind: 'cube', name: 'Khối vuông', things: [{ e: '🎲', n: 'Con xúc xắc' }, { e: '🧊', n: 'Viên đá' }] },
    { kind: 'box', name: 'Khối chữ nhật', things: [{ e: '📦', n: 'Thùng giấy' }, { e: '🧱', n: 'Viên gạch' }] },
];
const OBJ = [{ e: '🐱', n: 'chú mèo' }, { e: '⚽', n: 'quả bóng' }, { e: '🧸', n: 'gấu bông' }, { e: '🐶', n: 'chú chó' }, { e: '🎁', n: 'hộp quà' }];
const WHERE = { above: 'Ở trên', below: 'Ở dưới', left: 'Bên trái', right: 'Bên phải' } as const;

export const templates: Template[] = [
    tpl('mn.shapes2d', 1, () => {
        const kind = pickOne(KINDS), names = KINDS.map(k => SHAPE_NAME[k]);
        return choices({
            q: 'Đây là hình gì?', speech: `Đây là hình gì? ${spoken(names)}?`,
            visual: { fn: 'shapeVariantSVG', args: [kind, pickOne(COLORS), kind === 'circle' ? 0 : pickOne([0, 0, 15, 30, 45, 90]), pickOne([0.75, 0.9, 1])] },
            options: shuffle(names), correct: SHAPE_NAME[kind],
            explanation: kind === 'circle' ? 'Hình tròn tròn đều, không có góc.' : kind === 'triangle' ? 'Hình tam giác có 3 cạnh, 3 góc.' : kind === 'square' ? 'Hình vuông có 4 cạnh dài bằng nhau.' : 'Hình chữ nhật có 4 cạnh, hai cạnh dài và hai cạnh ngắn.',
        });
    }, { weight: 2 }),
    tpl('mn.shapes2d', 2, () => {
        const kinds = shuffle(KINDS), target = pickOne(kinds);
        return single({
            q: `Hình số mấy là ${SHAPE_NAME[target].toLowerCase()}?`, speech: `Hình số mấy là ${SHAPE_NAME[target].toLowerCase()}?`,
            visual: { fn: 'shapesRowSVG', args: [kinds.map(k => ({ kind: k, color: pickOne(COLORS), rotate: k === 'circle' ? 0 : pickOne([0, 20, 45]) }))] },
            correct: kinds.indexOf(target) + 1, wrong: [1, 2, 3, 4], keepOrder: true,
            explanation: `${SHAPE_NAME[target]} là hình số ${kinds.indexOf(target) + 1}.`,
        });
    }, { noRankCheck: true }),
    tpl('mn.shapes3d', 1, () => {
        const s = pickOne(SOLIDS), names = SOLIDS.map(x => x.name);
        if (chance(0.5)) {
            const t = pickOne(s.things);
            return choices({
                q: `${t.n} có dạng khối gì?`, speech: `${t.n} có dạng khối gì? ${spoken(names)}?`,
                visual: { fn: 'bigEmojiSVG', args: [t.e] }, options: names, correct: s.name,
                explanation: `${t.n} có dạng ${s.name.toLowerCase()}.`,
            });
        }
        return choices({
            q: 'Đây là khối gì?', speech: `Đây là khối gì? ${spoken(names)}?`,
            visual: { fn: 'solidSVG', args: [s.kind, pickOne(COLORS)] }, options: names, correct: s.name,
            explanation: s.kind === 'sphere' ? 'Khối cầu tròn, lăn được về mọi phía.' : s.kind === 'cylinder' ? 'Khối trụ có hai mặt tròn ở hai đầu.' : `${s.name} có các mặt phẳng, xếp chồng được.`,
        });
    }),
    tpl('mn.size', 1, () => {
        const kind = pickOne(['big', 'tall', 'long'] as const), firstBigger = chance(0.5), askBigger = chance(0.5);
        const word = { big: ['to hơn', 'nhỏ hơn'], tall: ['cao hơn', 'thấp hơn'], long: ['dài hơn', 'ngắn hơn'] }[kind][askBigger ? 0 : 1];
        const what = { big: 'Bạn gấu', tall: 'Cây', long: 'Bút chì' }[kind];
        return single({
            q: `${what} số mấy ${word}?`, speech: `${what} số mấy ${word}?`,
            visual: { fn: 'sizePairSVG', args: [kind, firstBigger, pickOne(['🐻', '🐘', '🍎', '🐟'])] },
            correct: firstBigger === askBigger ? 1 : 2, wrong: [1, 2], keepOrder: true, count: 2,
            explanation: `${what} số ${firstBigger === askBigger ? 1 : 2} ${word}.`,
        });
    }),
    tpl('mn.position', 1, () => {
        const o = pickOne(OBJ), where = pickOne(['above', 'below'] as const);
        return choices({
            q: `${o.n[0].toUpperCase() + o.n.slice(1)} ở trên hay ở dưới cái bàn?`, speech: `${o.n} ở trên hay ở dưới cái bàn?`,
            visual: { fn: 'positionSceneSVG', args: [o.e, where] }, options: ['Ở trên', 'Ở dưới'], correct: WHERE[where],
            explanation: `${o.n[0].toUpperCase() + o.n.slice(1)} ${WHERE[where].toLowerCase()} cái bàn.`,
        });
    }),
    tpl('mn.position', 2, () => {
        const o = pickOne(OBJ), where = pickOne(['above', 'below', 'left', 'right'] as const);
        return choices({
            q: `${o.n[0].toUpperCase() + o.n.slice(1)} ở đâu so với cái bàn?`, speech: `${o.n} ở đâu so với cái bàn? Ở trên, ở dưới, bên trái hay bên phải?`,
            visual: { fn: 'positionSceneSVG', args: [o.e, where] }, options: Object.values(WHERE), correct: WHERE[where],
            explanation: `Nhìn từ phía bé: ${o.n} ${WHERE[where].toLowerCase()} cái bàn.`,
            hint: 'Tay bé cầm thìa là tay phải.',
        });
    }),
];

export const generatePreschoolShapes = fromTemplates(templates);
