// ============================================================================
//  Cơ chế thuần: gieo xúc xắc, dịch chuyển, rút buff, số câu hỏi boss.
//  Tất cả nhận rng (seeded) hoặc tham số thuần → test được, không Math.random.
// ============================================================================

import { BuffType, TeleportInfo } from './types';
import { BOSS_QUESTIONS_BASE, BOSS_QUESTIONS_MIN, BUFF_CAPS, TELEPORT_RANGE } from './constants';
import { Rng, pick, randInt } from './rng';

/** Gieo xúc xắc 1..6. */
export const rollDice = (rng: Rng): number => randInt(rng, 1, 7);

/** Tính dịch chuyển: khoảng cách trong [-RANGE, +RANGE], vị trí mới kẹp [0, len-1]. */
export const calculateTeleport = (currentPos: number, mapLength: number, rng: Rng): TeleportInfo => {
    const distance = randInt(rng, -TELEPORT_RANGE, TELEPORT_RANGE + 1);
    const newPosition = Math.max(0, Math.min(currentPos + distance, mapLength - 1));
    return { distance, newPosition, isBackward: distance < 0 };
};

/** Rút ngẫu nhiên một loại buff. */
export const getRandomBuff = (rng: Rng): BuffType =>
    pick(rng, [BuffType.HolySword, BuffType.HolyGrail, BuffType.FlyingCloak]);

/** Số câu hỏi boss = BASE − số kiếm thánh (sàn MIN). Càng nhiều kiếm, boss càng dễ. */
export const calculateBossQuestions = (holySwords: number): number =>
    Math.max(BOSS_QUESTIONS_MIN, BOSS_QUESTIONS_BASE - holySwords);

/** Trần buff dùng lại ở reducer/test. */
export { BUFF_CAPS };
