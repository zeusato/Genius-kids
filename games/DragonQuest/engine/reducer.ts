// ============================================================================
//  Reducer THUẦN & ĐỒNG BỘ — trái tim game. Không timer, không RNG, không
//  side-effect. Mọi giá trị ngẫu nhiên (xúc xắc, câu hỏi, thoại, buff,
//  teleport) được tầng hook giải sẵn và truyền vào qua payload action.
//  ⇒ Test được toàn bộ luật chơi (đổi máu/điểm, cap buff, đếm câu boss,
//     thắng/thua, huy chương) mà KHÔNG cần fake timer hay random.
// ============================================================================

import { Action, FxState, GameState, Medal, MapTile, TileType } from './types';
import { MAX_HP, SCORE, START_HP } from './constants';
import { addBuff } from './buffs';

const emptyFx = (seq: number): FxState => ({
    seq, score: null, buff: null, damage: false, win: false, lose: false,
});

/** Tạo trạng thái khởi tạo (màn intro). */
export function initialState(): GameState {
    return {
        phase: 'intro',
        hp: START_HP,
        maxHp: MAX_HP,
        position: 0,
        target: 0,
        buffs: { holySword: 0, holyGrail: 0, flyingCloak: false },
        mapTiles: [],
        dice: null,
        question: null,
        dialogue: '',
        bossLeft: 0,
        teleport: null,
        result: null,
        score: 0,
        fx: emptyFx(0),
    };
}

/** Huy chương theo máu còn lại khi THẮNG (giữ như bản cũ). */
export function getMedal(state: GameState): Medal {
    if (state.result !== 'win') return null;
    if (state.hp >= 3) return 'gold';
    if (state.hp === 2) return 'silver';
    if (state.hp === 1) return 'bronze';
    return null;
}

/** Helper: dựng fx mới (seq tăng dần) gộp các trường cần bật. */
function fx(state: GameState, patch: Partial<Omit<FxState, 'seq'>>): FxState {
    return { ...emptyFx(state.fx.seq + 1), ...patch };
}

/** Cộng điểm + bật fx điểm bay, chuyển sang phase chỉ định. */
function award(state: GameState, amount: number, phase: GameState['phase']): GameState {
    return { ...state, score: state.score + amount, phase, fx: fx(state, { score: amount }) };
}

/**
 * Mất 1 máu: bật fx trúng đòn. Nếu hết máu → gameover/thua (kèm fx.lose).
 * Trả về state mới; caller quyết định phase tiếp theo nếu CÒN sống.
 */
function damage(state: GameState): GameState {
    const hp = state.hp - 1;
    if (hp <= 0) {
        return { ...state, hp: 0, phase: 'gameover', result: 'lose', fx: fx(state, { damage: true, lose: true }) };
    }
    return { ...state, hp, fx: fx(state, { damage: true }) };
}

const isDead = (s: GameState) => s.phase === 'gameover';

export function reducer(state: GameState, action: Action): GameState {
    switch (action.type) {
        case 'START': {
            const fresh = initialState();
            return { ...fresh, mapTiles: action.mapTiles, phase: 'playing', fx: emptyFx(state.fx.seq + 1) };
        }

        case 'ROLL_START':
            if (state.phase !== 'playing') return state;
            return { ...state, phase: 'rolling' };

        case 'SET_DICE': {
            // Kết quả xúc xắc đã có → tính ô đích, chuyển sang di chuyển.
            const target = Math.min(state.position + action.value, state.mapTiles.length - 1);
            return { ...state, dice: action.value, target, phase: 'moving' };
        }

        case 'SET_POSITION':
            // Dùng cho bước nhảy từng ô (anim) và cú nhảy teleport.
            return { ...state, position: action.position };

        case 'ENTER_NORMAL':
            return { ...state, phase: 'playing', question: null, teleport: null };

        case 'ENTER_COMBAT':
            return { ...state, phase: 'combat', question: action.question, dialogue: action.dialogue };

        case 'ENTER_BUFF':
            return { ...state, phase: 'buff', question: action.question, dialogue: action.dialogue };

        case 'ENTER_BOSS':
            return {
                ...state,
                phase: 'boss',
                question: action.question,
                dialogue: action.dialogue,
                bossLeft: action.bossLeft,
            };

        case 'ENTER_TELEPORT':
            return { ...state, phase: 'teleport', teleport: action.teleport, dialogue: action.dialogue };

        case 'ANSWER': {
            // Ô combat: đúng → +điểm & đi tiếp; sai → mất máu (hết máu thì thua).
            if (state.phase !== 'combat') return state;
            if (action.correct) return award(state, SCORE.combat, 'playing');
            const hurt = damage(state);
            return isDead(hurt) ? hurt : { ...hurt, phase: 'playing' };
        }

        case 'BUFF_ANSWER': {
            // Ô buff: đúng → nhận buff + điểm; sai → đi tiếp, KHÔNG phạt máu (như bản cũ).
            if (state.phase !== 'buff') return state;
            if (!action.correct) return { ...state, phase: 'playing' };
            const { buffs, hp } = addBuff(state.buffs, state.hp, action.buff, state.maxHp);
            return {
                ...state,
                buffs,
                hp,
                score: state.score + SCORE.buff,
                phase: 'playing',
                fx: fx(state, { score: SCORE.buff, buff: action.buff }),
            };
        }

        case 'BOSS_ANSWER': {
            // Ô boss. Giữ luật bản cũ: cả đúng và sai đều ĐẾM LÙI số câu còn lại;
            // sai thì mất thêm 1 máu. Hết câu → thắng; hết máu → thua.
            if (state.phase !== 'boss') return state;

            if (action.correct) {
                const left = state.bossLeft - 1;
                const scored = { ...state, score: state.score + SCORE.boss, fx: fx(state, { score: SCORE.boss }) };
                if (left <= 0) return { ...scored, phase: 'gameover', result: 'win', bossLeft: 0, fx: fx(state, { score: SCORE.boss, win: true }) };
                return { ...scored, bossLeft: left, question: action.nextQuestion };
            }

            // Sai/hết giờ: mất máu trước.
            const hurt = damage(state);
            if (isDead(hurt)) return hurt; // hết máu → thua (damage đã set lose)
            const left = hurt.bossLeft - 1;
            if (left <= 0) return { ...hurt, phase: 'gameover', result: 'win', bossLeft: 0, fx: fx(hurt, { damage: true, win: true }) };
            return { ...hurt, bossLeft: left, question: action.nextQuestion };
        }

        case 'RESOLVE_TELEPORT': {
            // Overlay dịch chuyển kết thúc. Nếu được Áo Choàng Bay bảo vệ (lùi) →
            // đứng yên, đi tiếp. Ngược lại hook sẽ SET_POSITION + ENTER_* ô mới.
            if (action.protectedByCloak) {
                return { ...state, phase: 'playing', teleport: null };
            }
            return state; // chờ hook xử lý nhảy + landing ô mới
        }

        default:
            return state;
    }
}

/** Tiện ích cho hook: loại ô tại vị trí. */
export const tileTypeAt = (tiles: MapTile[], pos: number): TileType | undefined => tiles[pos]?.type;
