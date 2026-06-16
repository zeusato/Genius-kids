// ============================================================================
//  useDragonQuest — điều phối VÒNG ĐỜI có thời gian quanh reducer thuần.
//  Reducer giữ luật chơi (thuần, test được). Hook này lo phần KHÔNG thuần:
//  timer (gieo xúc xắc → nhảy từng ô → tới ô → kích hoạt sự kiện) và RNG
//  (giá trị xúc xắc, câu hỏi, thoại, buff, teleport) rồi dispatch vào reducer.
//  Mọi mốc thời gian đọc từ engine/constants (hết magic-number ghép tay).
// ============================================================================

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { generateSpeedQuestion, type SpeedDifficulty } from '../../SpeedMath/speedMathEngine';
import {
    reducer, initialState,
    generateMap, makeRng, type Rng,
    rollDice, calculateTeleport, getRandomBuff, calculateBossQuestions,
    pickDialogue,
    COMBAT_DIALOGUES, BUFF_DIALOGUES, BOSS_DIALOGUES,
    TELEPORT_FORWARD_DIALOGUES, TELEPORT_BACKWARD_DIALOGUES,
    TileType, type DragonDifficulty,
} from '../engine';
import { DICE_MS, STEP_MS, LAND_DELAY_MS } from '../engine/constants';

export interface DragonQuestApi {
    state: ReturnType<typeof initialState>;
    start: () => void;
    roll: () => void;
    answerCombat: (correct: boolean) => void;
    answerBuff: (correct: boolean) => void;
    answerBoss: (correct: boolean) => void;
    resolveTeleport: () => void;
}

export function useDragonQuest(difficulty: DragonDifficulty): DragonQuestApi {
    const [state, dispatch] = useReducer(reducer, undefined, initialState);

    // Gương state cho các callback chạy trong setTimeout (tránh closure cũ).
    const stateRef = useRef(state);
    stateRef.current = state;

    // RNG seeded cho map/xúc xắc/teleport/buff/thoại (câu hỏi vẫn dùng bộ sinh
    // SpeedMath sẵn có — không cần tất định).
    const rngRef = useRef<Rng>(makeRng(1));

    // Quản lý timer để clear khi unmount / chơi lại.
    const timers = useRef<number[]>([]);
    const clearTimers = useCallback(() => {
        timers.current.forEach(id => window.clearTimeout(id));
        timers.current = [];
    }, []);
    const after = useCallback((ms: number, fn: () => void) => {
        const id = window.setTimeout(fn, ms);
        timers.current.push(id);
    }, []);

    useEffect(() => clearTimers, [clearTimers]);

    const genQuestion = useCallback(
        () => generateSpeedQuestion(difficulty as SpeedDifficulty),
        [difficulty],
    );

    /** Tới ô `pos`: đọc loại ô, sinh payload (câu hỏi/thoại/teleport) và dispatch. */
    const arrive = useCallback((pos: number) => {
        const s = stateRef.current;
        const rng = rngRef.current;
        const type = s.mapTiles[pos]?.type;

        switch (type) {
            case TileType.Combat:
                dispatch({ type: 'ENTER_COMBAT', question: genQuestion(), dialogue: pickDialogue(rng, COMBAT_DIALOGUES) });
                break;
            case TileType.Buff:
                dispatch({ type: 'ENTER_BUFF', question: genQuestion(), dialogue: pickDialogue(rng, BUFF_DIALOGUES) });
                break;
            case TileType.Teleport: {
                const tp = calculateTeleport(pos, s.mapTiles.length, rng);
                const dlg = pickDialogue(rng, tp.isBackward ? TELEPORT_BACKWARD_DIALOGUES : TELEPORT_FORWARD_DIALOGUES);
                dispatch({ type: 'ENTER_TELEPORT', teleport: tp, dialogue: dlg });
                break;
            }
            case TileType.Boss:
                dispatch({
                    type: 'ENTER_BOSS',
                    question: genQuestion(),
                    dialogue: pickDialogue(rng, BOSS_DIALOGUES),
                    bossLeft: calculateBossQuestions(s.buffs.holySword),
                });
                break;
            default:
                dispatch({ type: 'ENTER_NORMAL' });
        }
    }, [genQuestion]);

    /** Nhảy từng ô từ vị trí hiện tại tới `target`, rồi kích hoạt sự kiện. */
    const stepTo = useCallback((from: number, target: number) => {
        let cur = from;
        const step = () => {
            if (cur >= target) { after(LAND_DELAY_MS, () => arrive(target)); return; }
            cur++;
            dispatch({ type: 'SET_POSITION', position: cur });
            after(STEP_MS, step);
        };
        if (cur >= target) after(LAND_DELAY_MS, () => arrive(target));
        else after(STEP_MS, step);
    }, [after, arrive]);

    const start = useCallback(() => {
        clearTimers();
        // Hạt giống mới mỗi ván (code ứng dụng được dùng Date.now một lần).
        rngRef.current = makeRng((Date.now() & 0x7fffffff) || 1);
        dispatch({ type: 'START', mapTiles: generateMap(rngRef.current) });
    }, [clearTimers]);

    const roll = useCallback(() => {
        if (stateRef.current.phase !== 'playing') return;
        dispatch({ type: 'ROLL_START' });
        after(DICE_MS, () => {
            const s = stateRef.current;
            const value = rollDice(rngRef.current);
            const target = Math.min(s.position + value, s.mapTiles.length - 1);
            dispatch({ type: 'SET_DICE', value });
            stepTo(s.position, target);
        });
    }, [after, stepTo]);

    const answerCombat = useCallback((correct: boolean) => {
        dispatch({ type: 'ANSWER', correct });
    }, []);

    const answerBuff = useCallback((correct: boolean) => {
        dispatch({ type: 'BUFF_ANSWER', correct, buff: getRandomBuff(rngRef.current) });
    }, []);

    const answerBoss = useCallback((correct: boolean) => {
        dispatch({ type: 'BOSS_ANSWER', correct, nextQuestion: genQuestion() });
    }, [genQuestion]);

    /** Overlay dịch chuyển kết thúc → xử lý bảo vệ / nhảy tới ô mới rồi kích hoạt. */
    const resolveTeleport = useCallback(() => {
        const s = stateRef.current;
        const tp = s.teleport;
        if (!tp) return;
        const protectedByCloak = tp.isBackward && s.buffs.flyingCloak;
        dispatch({ type: 'RESOLVE_TELEPORT', protectedByCloak });
        if (!protectedByCloak) {
            dispatch({ type: 'SET_POSITION', position: tp.newPosition });
            after(450, () => arrive(tp.newPosition));
        }
    }, [after, arrive]);

    return { state, start, roll, answerCombat, answerBuff, answerBoss, resolveTeleport };
}
