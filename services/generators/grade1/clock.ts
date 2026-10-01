// Lớp 1 — Xem giờ đúng (g1_clock). Đề KHÔNG nói sẵn giờ khi có hình đồng hồ.
import { tpl, fromTemplates, single, choices, rint, chance } from '../kit';
import { around } from '../wrongs';
import { word } from './common';
import type { Template } from '../../study/types';

const gio = (h: number) => `${h} giờ`;

export const templates: Template[] = [
    tpl('g1.clock', 1, () => {
        const h = rint(1, 12);
        return single({ q: 'Đồng hồ chỉ mấy giờ?', speech: 'Đồng hồ chỉ mấy giờ?', visual: { fn: 'clockSVG', args: [h, 0] },
            correct: h, wrong: [h === 12 ? 1 : h + 1, h === 1 ? 12 : h - 1, (h + 5) % 12 + 1, 12 - h || 6], format: gio, min: 1, max: 12, integer: true,
            explanation: `Kim ngắn chỉ số ${h}, kim dài chỉ số 12: đồng hồ chỉ ${h} giờ.`, hint: 'Kim ngắn chỉ giờ; kim dài chỉ số 12 là giờ đúng.' });
    }, { weight: 2, noRankCheck: true }),
    tpl('g1.clock', 2, () => {
        const h = rint(1, 12);
        if (chance(0.5)) return single({ q: `Lúc ${h} giờ đúng, kim ngắn chỉ vào số mấy?`, speech: `Lúc ${word(h)} giờ đúng, kim ngắn chỉ vào số mấy?`,
            correct: h, wrong: [12, ...around(h, { min: 1, max: 12 })], min: 1, max: 12, explanation: `Lúc ${h} giờ đúng, kim ngắn chỉ số ${h}, kim dài chỉ số 12.` });
        const later = rint(1, 3), ans = (h + later - 1) % 12 + 1;
        return single({ q: `Đồng hồ đang chỉ giờ như hình. ${later} giờ nữa là mấy giờ?`, speech: `Xem giờ trên đồng hồ. ${word(later)} giờ nữa là mấy giờ?`,
            visual: { fn: 'clockSVG', args: [h, 0] }, correct: ans, wrong: [h, (ans % 12) + 1, ((h + 10) % 12) + 1], format: gio, min: 1, max: 12,
            explanation: `Bây giờ là ${h} giờ, thêm ${later} giờ nữa là ${ans} giờ.`, hint: 'Đếm tiếp theo các số trên mặt đồng hồ.' });
    }, { noRankCheck: true }),
    tpl('g1.clock', 2, () => {
        const h = rint(1, 12);
        return choices({ q: 'Lúc giờ đúng, kim dài (kim phút) chỉ vào số mấy?', speech: 'Lúc giờ đúng, kim dài chỉ vào số mấy?', visual: { fn: 'clockSVG', args: [h, 0] },
            options: ['3', '6', '9', '12'], correct: '12', shuffle: true, explanation: 'Giờ đúng thì kim dài luôn chỉ vào số 12.' });
    }, { weight: 0.3, noRankCheck: true }),
];

export const generateG1Clock = fromTemplates(templates);
