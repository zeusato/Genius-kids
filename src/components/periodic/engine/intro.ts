// Mở màn "Từ Vụ Nổ Lớn đến em": các nhịp và ô sáng ở nhịp nào (theo nguồn gốc lớn nhất). TS thuần.
import { ORIGIN_INFO, type OriginId } from '../../../data/periodic/origin';
import type { ElementFull } from './elements';
import { dominantOrigin } from './lenses';

export type IntroFx = 'bigbang' | 'stars' | 'supernova' | 'whitedwarf' | 'kilonova' | 'cosmicray' | 'lab' | 'you';

export interface IntroBeat { at: number; dur: number; fx: IntroFx; origin?: OriginId; text: string }

export const INTRO_BEATS: IntroBeat[] = [
    { at: 0.6, dur: 2.9, fx: 'bigbang', origin: 'big_bang', text: '13,8 tỷ năm trước, Vụ Nổ Lớn tạo ra hydrogen và helium' },
    { at: 3.5, dur: 3.5, fx: 'stars', origin: 'low_mass_stars', text: 'Các ngôi sao nấu ra nguyên tố mới' },
    { at: 7, dur: 3, fx: 'supernova', origin: 'massive_stars', text: 'Sao khổng lồ nổ tung, rắc chúng khắp vũ trụ' },
    { at: 10, dur: 2.5, fx: 'whitedwarf', origin: 'white_dwarfs', text: 'Sao lùn trắng bùng nổ tạo ra sắt' },
    { at: 12.5, dur: 2.5, fx: 'kilonova', origin: 'neutron_stars', text: 'Hai sao neutron va nhau tạo ra vàng!' },
    { at: 15, dur: 1.5, fx: 'cosmicray', origin: 'cosmic_ray', text: 'Tia vũ trụ đập vỡ nguyên tử' },
    { at: 16.5, dur: 2, fx: 'lab', origin: 'human_made', text: 'Con người tạo ra phần còn lại trong phòng thí nghiệm' },
    { at: 18.5, dur: 2.5, fx: 'you', text: 'Cơ thể em được làm từ bụi sao ✨' },
];
export const INTRO_LENGTH = 21;

/** Thời điểm (s) từng ô sáng lên: rải đều trong nhịp của nguồn gốc lớn nhất, theo số hiệu. */
export function ignitionTimes(all: ElementFull[]): Map<number, number> {
    const out = new Map<number, number>();
    for (const b of INTRO_BEATS) {
        if (!b.origin) continue;
        const group = all.filter(e => dominantOrigin(e) === b.origin).sort((a, c) => a.atomicNumber - c.atomicNumber);
        group.forEach((e, i) => out.set(e.atomicNumber, b.at + 0.25 + (b.dur - 0.6) * (group.length > 1 ? i / (group.length - 1) : 0)));
    }
    return out;
}

/** Bản kể chuyện (kính ✨): mỗi nhịp một câu dài hơn, chờ đọc xong mới sang nhịp sau. */
export const STORY_BEATS: { origin: OriginId | 'you'; say: string }[] = [
    ...(['big_bang', 'low_mass_stars', 'massive_stars', 'white_dwarfs', 'neutron_stars', 'cosmic_ray', 'human_made'] as OriginId[])
        .map(o => ({ origin: o, say: ORIGIN_INFO[o].say })),
    { origin: 'you', say: '4,6 tỷ năm trước, bụi sao gom lại thành Mặt Trời, Trái Đất… và cả em nữa. Cơ thể em được làm từ bụi sao!' },
];
