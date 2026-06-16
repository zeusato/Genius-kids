// ============================================================================
//  Buff: hàm áp dụng THUẦN + metadata (tên/mô tả/icon) tiếng Việt.
// ============================================================================

import { BuffType, PlayerBuffs } from './types';
import { BUFF_CAPS } from './constants';

/**
 * Áp dụng buff lên trạng thái buff + máu (thuần, không side-effect).
 * - Kiếm Thánh: +1 (trần BUFF_CAPS.holySword) → giảm câu hỏi boss.
 * - Chén Thánh: +1 đếm (trần BUFF_CAPS.holyGrail) & hồi 1 máu (kẹp maxHp).
 * - Áo Choàng Bay: bật cờ miễn nhiễm dịch chuyển lùi.
 */
export function addBuff(
    buffs: PlayerBuffs,
    hp: number,
    buff: BuffType,
    maxHp: number,
): { buffs: PlayerBuffs; hp: number } {
    const next = { ...buffs };
    let nextHp = hp;

    switch (buff) {
        case BuffType.HolySword:
            if (next.holySword < BUFF_CAPS.holySword) next.holySword++;
            break;
        case BuffType.HolyGrail:
            if (next.holyGrail < BUFF_CAPS.holyGrail) {
                next.holyGrail++;
                nextHp = Math.min(maxHp, hp + 1);
            }
            break;
        case BuffType.FlyingCloak:
            next.flyingCloak = true;
            break;
    }

    return { buffs: next, hp: nextHp };
}

export const getBuffName = (buff: BuffType): string => {
    switch (buff) {
        case BuffType.HolySword: return 'Kiếm Thánh';
        case BuffType.HolyGrail: return 'Chén Thánh';
        case BuffType.FlyingCloak: return 'Áo Choàng Bay';
    }
};

export const getBuffDescription = (buff: BuffType): string => {
    switch (buff) {
        case BuffType.HolySword: return 'Giảm số câu hỏi khi đánh boss (tối đa 2)';
        case BuffType.HolyGrail: return 'Hồi 1 máu (+1 HP)';
        case BuffType.FlyingCloak: return 'Miễn nhiễm dịch chuyển lùi';
    }
};

export const getBuffIcon = (buff: BuffType): string => {
    switch (buff) {
        case BuffType.HolySword: return '🗡️';
        case BuffType.HolyGrail: return '🏆';
        case BuffType.FlyingCloak: return '🦸‍♂️';
    }
};
