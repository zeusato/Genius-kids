// ============================================================================
//  DragonQuestGame — component MỎNG: ghép useDragonQuest (luật + timing) với
//  useGameTTS (đọc + ducking) và render 3 màn (intro / chơi / kết thúc). Toàn
//  bộ luật chơi nằm ở engine thuần; UI ở components/. Xem docs upgrade plan.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { Heart, Trophy, Play, RotateCcw } from 'lucide-react';
import { soundManager } from '../../utils/sound';
import { useMusicControls } from '@/src/contexts/MusicContext';
import { MusicTrack } from '@/services/musicConfig';

import { useDragonQuest } from './hooks/useDragonQuest';
import { useGameTTS, voiceSpeak } from './hooks/useGameTTS';
import { getMedal } from './engine/reducer';
import { MAX_SCORE } from './engine/constants';
import { WIN_DIALOGUES, LOSE_DIALOGUES } from './engine/dialogue';
import type { DragonDifficulty } from './engine/types';

import {
    GameHeader, GameBoard, DiceRoll, EventModal, TeleportOverlay, GameFx, Confetti, VoiceButton,
} from './components';

interface DragonQuestGameProps {
    difficulty: 'easy' | 'medium' | 'hard';
    onBack: () => void;
    onComplete: (score: number, maxScore: number, medal: 'bronze' | 'silver' | 'gold' | null) => void;
}

const sample = (pool: readonly string[]) => pool[Math.floor(Math.random() * pool.length)];

export const DragonQuestGame: React.FC<DragonQuestGameProps> = ({ difficulty, onBack, onComplete }) => {
    const { playTrack, resumeRouteMusic } = useMusicControls();
    const { state, start, roll, answerCombat, answerBuff, answerBoss, resolveTeleport } =
        useDragonQuest(difficulty as DragonDifficulty);

    useGameTTS(state);

    // Nhạc nền Dragon Quest khi vào; trả nhạc theo route khi rời.
    useEffect(() => {
        playTrack(MusicTrack.DRAGON_QUEST);
        return () => resumeRouteMusic();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Khi kết thúc: âm thanh + đọc thoại thắng/thua (một lần).
    const announced = useRef(false);
    useEffect(() => {
        if (state.phase === 'gameover') {
            if (!announced.current) {
                announced.current = true;
                soundManager.playComplete();
                voiceSpeak(sample(state.result === 'win' ? WIN_DIALOGUES : LOSE_DIALOGUES));
            }
        } else {
            announced.current = false;
        }
    }, [state.phase, state.result]);

    // --- MÀN INTRO ---
    if (state.phase === 'intro') {
        return (
            <div className="min-h-[100dvh] bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center animate-in zoom-in duration-300">
                    <div className="text-7xl md:text-8xl mb-5">🐉</div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">Đại Chiến Rồng Thần</h1>
                    <p className="text-slate-500 text-base md:text-lg mb-6">Phiêu lưu, thu thập buff và đánh bại rồng thần!</p>

                    <div className="space-y-3 mb-7 text-left bg-slate-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3"><Heart className="text-red-500 fill-red-500" /><span className="font-bold text-slate-700">3 Mạng</span></div>
                        <div className="flex items-center gap-3"><Trophy className="text-yellow-500" /><span className="font-bold text-slate-700">Thu thập Buff</span></div>
                        <div className="flex items-center gap-3"><span className="text-2xl">🐉</span><span className="font-bold text-slate-700">Đánh Boss cuối</span></div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onBack} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Quay lại</button>
                        <button onClick={start} className="flex-[2] py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105">
                            <Play size={20} fill="currentColor" /> Bắt đầu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- MÀN KẾT THÚC ---
    if (state.phase === 'gameover') {
        const medal = getMedal(state);
        const victory = state.result === 'win';
        const winLine = victory ? 'Bạn đã đánh bại rồng thần!' : 'Bạn đã hết mạng.';

        return (
            <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4">
                {victory && <Confetti />}
                <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center animate-in zoom-in duration-300 relative z-10">
                    <div className="mb-5">
                        {victory
                            ? <Trophy size={80} className="text-yellow-400 mx-auto animate-bounce" />
                            : <Heart size={80} className="text-red-500 mx-auto fill-red-500" />}
                    </div>

                    <h2 className="text-3xl font-black text-slate-800 mb-1 flex items-center justify-center gap-2">
                        {victory ? 'Chiến thắng!' : 'Thất bại!'}
                        <VoiceButton text={`${victory ? 'Chiến thắng!' : 'Thất bại!'} ${winLine}`} size={18} />
                    </h2>
                    <p className="text-slate-500 mb-4 text-base md:text-lg">{winLine}</p>

                    {victory && medal && (
                        <div className="flex items-center justify-center gap-2 my-4 bg-yellow-50 px-4 py-3 rounded-full">
                            <span className="font-semibold text-slate-700">Nhận được:</span>
                            <div className="flex">{Array.from({ length: state.hp }).map((_, i) => <span key={i} className="text-2xl">⭐</span>)}</div>
                            <span className="font-bold text-yellow-600">+{state.hp} sao</span>
                        </div>
                    )}

                    <div className="bg-slate-50 rounded-xl p-4 mb-6">
                        <div className="text-sm text-slate-500 mb-1">Tổng điểm</div>
                        <div className="text-5xl font-black text-brand-600">{state.score}</div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => { onComplete(state.score, MAX_SCORE, medal); onBack(); }}
                            className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Thoát
                        </button>
                        <button onClick={start} className="flex-[2] py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105">
                            <RotateCcw size={20} /> Chơi lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- MÀN CHƠI ---
    return (
        <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50">
            <GameHeader hp={state.hp} maxHp={state.maxHp} buffs={state.buffs} score={state.score} onBack={onBack} />

            <div className="flex-1 min-h-0 p-2 md:p-4">
                <GameBoard tiles={state.mapTiles} playerPosition={state.position} isMoving={state.phase === 'moving'} />
            </div>

            {/* Xúc xắc — góc dưới phải */}
            <div className="fixed bottom-2 right-2 z-40">
                <div className="bg-white rounded-lg md:rounded-2xl shadow-xl md:shadow-2xl p-1.5 md:p-3 border-2 md:border-4 border-amber-400">
                    <DiceRoll
                        onRoll={roll}
                        value={state.dice}
                        rolling={state.phase === 'rolling'}
                        disabled={state.phase !== 'playing'}
                    />
                </div>
            </div>

            {/* Modal sự kiện */}
            {state.phase === 'combat' && state.question && (
                <EventModal variant="combat" question={state.question} dialogue={state.dialogue} onAnswer={answerCombat} />
            )}
            {state.phase === 'buff' && state.question && (
                <EventModal variant="buff" question={state.question} dialogue={state.dialogue} onAnswer={answerBuff} />
            )}
            {state.phase === 'boss' && state.question && (
                <EventModal variant="boss" question={state.question} dialogue={state.dialogue} questionsRemaining={state.bossLeft} onAnswer={answerBoss} />
            )}
            {state.phase === 'teleport' && state.teleport && (
                <TeleportOverlay
                    distance={state.teleport.distance}
                    isBackward={state.teleport.isBackward}
                    hasProtection={state.buffs.flyingCloak}
                    dialogue={state.dialogue}
                    onComplete={resolveTeleport}
                />
            )}

            {/* Hiệu ứng một-lần */}
            <GameFx fx={state.fx} />
        </div>
    );
};
