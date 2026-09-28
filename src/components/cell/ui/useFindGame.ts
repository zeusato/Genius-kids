import { useCallback, useEffect, useRef, useState } from 'react';
import { CellType, Organelle } from '../../../data/cellData';
import { CELL_BADGE_STARS, FIND_PROMPTS, FIND_ROUNDS, FindPrompt } from '../../../data/cellQuizData';
import type { CellId } from '../../../data/cellStory';
import { cancelSpeech, speak } from '@/src/utils/speech';
import { playBlip, playSuccess } from '../../solar/sfx';

export interface FindFeedback {
    kind: 'correct' | 'wrong';
    organelle: Organelle;
}

export interface FindGame {
    active: boolean;
    finished: boolean;
    round: number;          // 0-based
    total: number;
    prompt: FindPrompt | null;
    promptText: string;
    feedback: FindFeedback | null;
    mistakes: number;
    awarded: boolean;       // lần này mới nhận huy hiệu
    start: () => void;
    pick: (id: string) => void;
    exit: () => void;
    replay: () => void;
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

interface Options {
    cell: CellType;
    easy: boolean;                   // Mầm non – lớp 2: gợi ý bằng "so sánh vui"
    hasBadge: boolean;
    onAward: () => void;             // trao huy hiệu + sao (chỉ lần đầu)
    onCorrect?: (id: string) => void; // camera bay tới bào quan vừa tìm đúng
    onRoundStart?: () => void;        // camera về góc nhìn toàn tế bào
}

// Trò "Truy tìm bào quan": giọng đọc gợi ý, bé chạm đúng hình khối trên mô hình 3D.
// Không phạt: chạm sai thì bào quan đó tự giới thiệu rồi cho thử lại.
export function useFindGame({ cell, easy, hasBadge, onAward, onCorrect, onRoundStart }: Options): FindGame {
    const [active, setActive] = useState(false);
    const [finished, setFinished] = useState(false);
    const [rounds, setRounds] = useState<FindPrompt[]>([]);
    const [round, setRound] = useState(0);
    const [feedback, setFeedback] = useState<FindFeedback | null>(null);
    const [mistakes, setMistakes] = useState(0);
    const [awarded, setAwarded] = useState(false);
    const lock = useRef(false);
    const timer = useRef<number>(0);

    const prompt = active && !finished ? rounds[round] ?? null : null;
    const promptText = prompt ? (easy ? prompt.easy : prompt.hard) : '';

    const clearTimer = () => { window.clearTimeout(timer.current); };

    const start = useCallback(() => {
        clearTimer();
        const pool = FIND_PROMPTS[cell.id as CellId].filter((p) => cell.organelles.some((o) => o.id === p.target));
        setRounds(shuffle(pool).slice(0, Math.min(FIND_ROUNDS, pool.length)));
        setRound(0);
        setFeedback(null);
        setMistakes(0);
        setFinished(false);
        setAwarded(false);
        setActive(true);
        lock.current = false;
        onRoundStart?.();
    }, [cell, onRoundStart]);

    const exit = useCallback(() => {
        clearTimer();
        cancelSpeech();
        setActive(false);
        setFinished(false);
        setFeedback(null);
        lock.current = false;
    }, []);

    // đọc gợi ý mỗi vòng mới
    useEffect(() => {
        if (!active || finished || !promptText) return;
        const t = window.setTimeout(() => speak(promptText, { lang: 'vi-VN', rate: 0.9 }), 450);
        return () => window.clearTimeout(t);
    }, [active, finished, promptText]);

    useEffect(() => () => clearTimer(), []);

    const pick = useCallback((id: string) => {
        if (!active || finished || !prompt || lock.current) return;
        const o = cell.organelles.find((x) => x.id === id);
        if (!o) return;
        if (id === prompt.target) {
            lock.current = true;
            playSuccess();
            setFeedback({ kind: 'correct', organelle: o });
            speak(`Đúng rồi! ${o.kid}`, { lang: 'vi-VN', rate: 0.92 });
            onCorrect?.(id);
            timer.current = window.setTimeout(() => {
                setFeedback(null);
                lock.current = false;
                if (round + 1 >= rounds.length) {
                    setFinished(true);
                    if (!hasBadge) {
                        onAward();
                        setAwarded(true);
                    }
                    speak(hasBadge ? 'Giỏi quá! Em đã tìm được hết rồi!' : `Tuyệt vời! Em nhận được huy hiệu và ${CELL_BADGE_STARS} ngôi sao!`, { lang: 'vi-VN' });
                } else {
                    setRound((r) => r + 1);
                    onRoundStart?.();
                }
            }, 3200);
        } else {
            playBlip();
            setMistakes((m) => m + 1);
            setFeedback({ kind: 'wrong', organelle: o });
            speak(`${o.kid} Thử tìm lại nhé!`, { lang: 'vi-VN', rate: 0.95 });
            clearTimer();
            timer.current = window.setTimeout(() => setFeedback(null), 3500);
        }
    }, [active, finished, prompt, cell, round, rounds.length, hasBadge, onAward, onCorrect, onRoundStart]);

    const replay = useCallback(() => {
        if (promptText) speak(promptText, { lang: 'vi-VN', rate: 0.9 });
    }, [promptText]);

    return { active, finished, round, total: rounds.length, prompt, promptText, feedback, mistakes, awarded, start, pick, exit, replay };
}
