// ============================================================================
//  DragonQuest — Kiểu dữ liệu chung cho engine thuần.
// ============================================================================

import { SpeedQuestion } from '../../SpeedMath/speedMathEngine';

export type DragonDifficulty = 'easy' | 'medium' | 'hard';

export enum TileType {
    Normal = 'normal',
    Combat = 'combat',
    Buff = 'buff',
    Teleport = 'teleport',
    Boss = 'boss',
}

export enum BuffType {
    HolySword = 'holySword',
    HolyGrail = 'holyGrail',
    FlyingCloak = 'flyingCloak',
}

export interface MapTile {
    id: number;
    type: TileType;
    position: number;
}

export interface PlayerBuffs {
    holySword: number;   // 0..BUFF_CAPS.holySword
    holyGrail: number;   // 0..BUFF_CAPS.holyGrail
    flyingCloak: boolean;
}

export interface TeleportInfo {
    distance: number;     // có thể âm (lùi)
    newPosition: number;  // đã kẹp [0, len-1]
    isBackward: boolean;
}

export type Medal = 'bronze' | 'silver' | 'gold' | null;
export type GameResult = 'win' | 'lose' | null;

/** Các pha của vòng đời ván chơi. */
export type Phase =
    | 'intro'
    | 'playing'   // chờ gieo xúc xắc
    | 'rolling'   // đang gieo
    | 'moving'    // nhân vật đang nhảy từng ô
    | 'combat'
    | 'buff'
    | 'teleport'
    | 'boss'
    | 'gameover';

/**
 * Hiệu ứng một-lần phát ra từ state. Component lắng nghe `fx.seq` đổi để kích
 * hoạt animation (điểm bay, trúng đòn, nhận buff, thắng/thua). Một transition có
 * thể bật nhiều trường cùng lúc (vd trả lời buff đúng: vừa +điểm vừa nhận buff).
 */
export interface FxState {
    seq: number;
    score: number | null;   // điểm vừa cộng (+10/+15/+20)
    buff: BuffType | null;   // buff vừa nhận
    damage: boolean;         // vừa mất máu
    win: boolean;
    lose: boolean;
}

export interface GameState {
    phase: Phase;
    hp: number;
    maxHp: number;
    position: number;       // ô hiện tại
    target: number;         // ô đích khi đang di chuyển
    buffs: PlayerBuffs;
    mapTiles: MapTile[];
    dice: number | null;    // giá trị xúc xắc gần nhất
    question: SpeedQuestion | null;
    dialogue: string;
    bossLeft: number;       // số câu boss còn lại
    teleport: TeleportInfo | null;
    result: GameResult;
    score: number;
    fx: FxState;
}

export type Action =
    | { type: 'START'; mapTiles: MapTile[] }
    | { type: 'ROLL_START' }
    | { type: 'SET_DICE'; value: number }
    | { type: 'SET_POSITION'; position: number }
    | { type: 'ENTER_NORMAL' }
    | { type: 'ENTER_COMBAT'; question: SpeedQuestion; dialogue: string }
    | { type: 'ENTER_BUFF'; question: SpeedQuestion; dialogue: string }
    | { type: 'ENTER_BOSS'; question: SpeedQuestion; dialogue: string; bossLeft: number }
    | { type: 'ENTER_TELEPORT'; teleport: TeleportInfo; dialogue: string }
    | { type: 'ANSWER'; correct: boolean }                       // ô combat
    | { type: 'BUFF_ANSWER'; correct: boolean; buff: BuffType }  // ô buff
    | { type: 'BOSS_ANSWER'; correct: boolean; nextQuestion: SpeedQuestion } // ô boss
    | { type: 'RESOLVE_TELEPORT'; protectedByCloak: boolean };
