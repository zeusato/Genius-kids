// ============================================================================
//  Sinh bàn cờ — tất định theo seed. Giữ NGUYÊN phân bố & độ dài bản cũ
//  (40% combat / 20% buff / 15% teleport / còn lại thường + 1 boss cuối).
// ============================================================================

import { MapTile, TileType } from './types';
import { MAP_LENGTH, TILE_DISTRIBUTION } from './constants';
import { Rng, randInt } from './rng';

/**
 * Sinh bàn cờ MAP_LENGTH ô: ô cuối là Boss, phần còn lại trộn theo phân bố.
 * Cùng một seed → cùng một bàn cờ (test được).
 */
export const generateMap = (rng: Rng): MapTile[] => {
    const exBoss = MAP_LENGTH - 1;
    const combatCount = Math.floor(exBoss * TILE_DISTRIBUTION.combat);
    const buffCount = Math.floor(exBoss * TILE_DISTRIBUTION.buff);
    const teleportCount = Math.floor(exBoss * TILE_DISTRIBUTION.teleport);

    const types: TileType[] = [];
    for (let i = 0; i < combatCount; i++) types.push(TileType.Combat);
    for (let i = 0; i < buffCount; i++) types.push(TileType.Buff);
    for (let i = 0; i < teleportCount; i++) types.push(TileType.Teleport);
    while (types.length < exBoss) types.push(TileType.Normal);

    // Trộn Fisher–Yates bằng rng seeded (thay cho Math.random của bản cũ).
    for (let i = types.length - 1; i > 0; i--) {
        const j = randInt(rng, 0, i + 1);
        [types[i], types[j]] = [types[j], types[i]];
    }

    const tiles: MapTile[] = types.map((type, i) => ({ id: i, type, position: i }));
    tiles.push({ id: exBoss, type: TileType.Boss, position: exBoss });
    return tiles;
};
