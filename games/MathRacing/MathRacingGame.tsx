import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RacingTrack } from './RacingTrack';
import { RacingCar } from './RacingCar';
import { FallingItem, ItemType } from './FallingItem';
import { laneLeft } from './lanes';
import { ArrowLeft, ArrowRight, Heart, Star, RotateCcw, Play, Home, X } from 'lucide-react';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { playSound } from '@/utils/sound';
import { processGameReward } from '@/services/rewardService';
import { GachaModal } from '../../src/components/GachaModal';
import { AlbumImage } from '@/types';


// Types
interface GameItem {
    id: number;
    qid: number; // nhóm câu hỏi (để phân biệt khi nhiều câu cùng trên màn)
    lane: number;
    yPosition: number;
    content: string;
    type: ItemType;
    value: number; // For math check
    isCorrect?: boolean;
    passed?: boolean; // To avoid double collision
    questionText?: string;
}

interface ScorePopup {
    id: number;
    lane: number;
    text: string;
    good: boolean;
}

interface Question {
    text: string;
    answer: number;
}

type GameStatus = 'menu' | 'playing' | 'gameover' | 'victory';

interface MathRacingGameProps {
    difficulty: 'easy' | 'medium' | 'hard';
    onExit: () => void;
}

export const MathRacingGame: React.FC<MathRacingGameProps> = ({ difficulty, onExit }) => {
    // Context
    const { currentStudent } = useStudent();
    const { addGameResult } = useStudentActions();

    // State
    const [status, setStatus] = useState<GameStatus>('menu');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [lane, setLane] = useState(1); // 0, 1, 2
    const [items, setItems] = useState<GameItem[]>([]);
    const [questionCount, setQuestionCount] = useState(0);
    const [currentQuestionText, setCurrentQuestionText] = useState<string>('');
    const [showInstructions, setShowInstructions] = useState(false);

    // Juice / phản hồi
    const [combo, setCombo] = useState(0);
    const [flash, setFlash] = useState<null | 'good' | 'bad'>(null);
    const [shake, setShake] = useState(false);
    const [popups, setPopups] = useState<ScorePopup[]>([]);
    const comboRef = useRef(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const instructionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const popupId = useRef(0);

    // Reward State
    const [earnedStars, setEarnedStars] = useState(0);
    const [gachaReward, setGachaReward] = useState<{ image: AlbumImage, isNew: boolean } | null>(null);
    const [showGacha, setShowGacha] = useState(false);
    const [pendingAction, setPendingAction] = useState<'restart' | 'exit' | null>(null);

    // Refs for Game Loop
    const requestRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const itemsRef = useRef<GameItem[]>([]);
    const laneRef = useRef(1);
    const scoreRef = useRef(0);
    const livesRef = useRef(3);
    const speedRef = useRef(0.3); // Base speed
    const questionCountRef = useRef(0);
    const statusRef = useRef<GameStatus>('menu');
    const currentQuestionRef = useRef<Question | null>(null);

    // Constants
    const TARGET_QUESTIONS = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 15 : 20;
    const BASE_SPEED = difficulty === 'easy' ? 0.3 : difficulty === 'medium' ? 0.4 : 0.5;
    const MAX_SPEED = BASE_SPEED * 1.8; // tăng tốc dần — đúng tinh thần "thần tốc"
    const SPAWN_DISTANCE = 62; // tách nhóm rõ hơn: chỉ ~1 nhóm trong vùng đua, nhóm kế ló ra từ chân trời

    // Hiệu ứng chớp xanh/đỏ ngắn khi đúng/sai.
    const triggerFlash = (kind: 'good' | 'bad') => {
        setFlash(kind);
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlash(null), 220);
    };

    // Bảng điểm bay lên rồi mờ dần tại làn vừa va chạm.
    const spawnPopup = (lane: number, text: string, good: boolean) => {
        const id = ++popupId.current;
        setPopups((prev) => [...prev, { id, lane, text, good }]);
        setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== id)), 750);
    };

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    // --- Game Logic Helpers ---

    const generateQuestion = (): Question => {
        let a, b, op, ans;
        if (difficulty === 'easy') {
            // Add/Sub < 20
            op = Math.random() < 0.5 ? '+' : '-';
            if (op === '+') {
                a = Math.floor(Math.random() * 10) + 1;
                b = Math.floor(Math.random() * 10) + 1;
                ans = a + b;
            } else {
                a = Math.floor(Math.random() * 10) + 5;
                b = Math.floor(Math.random() * a);
                ans = a - b;
            }
        } else if (difficulty === 'medium') {
            // Add/Sub < 50, Mul x2, x5, x10
            const type = Math.random();
            if (type < 0.6) {
                op = Math.random() < 0.5 ? '+' : '-';
                a = Math.floor(Math.random() * 40) + 10;
                b = Math.floor(Math.random() * 20) + 1;
                if (op === '-') {
                    const temp = Math.max(a, b);
                    b = Math.min(a, b);
                    a = temp;
                    ans = a - b;
                } else {
                    ans = a + b;
                }
            } else {
                op = 'x';
                b = [2, 5, 10][Math.floor(Math.random() * 3)];
                a = Math.floor(Math.random() * 10) + 1;
                ans = a * b;
            }
        } else {
            // Hard: Mixed < 100
            const type = Math.random();
            if (type < 0.4) {
                op = Math.random() < 0.5 ? '+' : '-';
                a = Math.floor(Math.random() * 80) + 10;
                b = Math.floor(Math.random() * 50) + 10;
                if (op === '-') {
                    const temp = Math.max(a, b);
                    b = Math.min(a, b);
                    a = temp;
                    ans = a - b;
                } else {
                    ans = a + b;
                }
            } else {
                op = 'x';
                a = Math.floor(Math.random() * 9) + 2;
                b = Math.floor(Math.random() * 9) + 2;
                ans = a * b;
            }
        }
        return { text: `${a} ${op} ${b} = ?`, answer: ans };
    };

    const spawnQuestionSequence = () => {
        if (questionCountRef.current >= TARGET_QUESTIONS) return;

        const q = generateQuestion();
        currentQuestionRef.current = q;
        const idBase = Date.now();

        // Spawn Answers (Left, Center, Right)
        const correctLane = Math.floor(Math.random() * 3);
        const answers: GameItem[] = [];

        for (let i = 0; i < 3; i++) {
            let val = q.answer;
            let isCorrect = i === correctLane;

            if (!isCorrect) {
                // Generate wrong answer
                do {
                    val = q.answer + Math.floor(Math.random() * 10) - 5;
                } while (val === q.answer || val < 0);
            }

            answers.push({
                id: idBase + i + 1,
                qid: idBase,
                lane: i,
                yPosition: -20, // Start just above visible area
                content: val.toString(),
                type: 'answer',
                value: val,
                isCorrect,
                questionText: q.text
            });
        }

        itemsRef.current = [...itemsRef.current, ...answers];
        questionCountRef.current += 1;
        setQuestionCount(questionCountRef.current);
    };

    const handleGameOver = (win: boolean) => {
        setStatus(win ? 'victory' : 'gameover');
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        // Calculate Medal based on Lives (only if win)
        let medal: 'bronze' | 'silver' | 'gold' | null = null;
        let stars = 0;

        if (win) {
            // Medal based on lives
            if (livesRef.current >= 3) medal = 'gold';
            else if (livesRef.current === 2) medal = 'silver';
            else medal = 'bronze';

            // Stars based on Difficulty & Lives (Medal)
            if (difficulty === 'easy') {
                if (medal === 'bronze') stars = 1;
                else if (medal === 'silver') stars = 2;
                else if (medal === 'gold') stars = 3;
            } else if (difficulty === 'medium') {
                if (medal === 'bronze') stars = 2;
                else if (medal === 'silver') stars = 3;
                else if (medal === 'gold') stars = 5;
            } else if (difficulty === 'hard') {
                if (medal === 'bronze') stars = 3;
                else if (medal === 'silver') stars = 5;
                else if (medal === 'gold') stars = 7;
            }
        }

        // Process Reward
        if (currentStudent) {
            // Pass custom stars and medal. If !win, medal is null, so no gacha.
            const { reward } = processGameReward(currentStudent, medal, stars);
            setEarnedStars(reward.stars);

            // Save Result
            addGameResult({
                id: Date.now().toString(),
                date: new Date().toISOString(),
                gameType: 'math_racing',
                difficulty,
                score: scoreRef.current,
                maxScore: TARGET_QUESTIONS * 10,
                starsEarned: reward.stars,
                durationSeconds: 0,
            }, reward.image || undefined);

            // Check for Gacha Reward
            if (reward.image) {
                const isNew = !currentStudent.ownedImageIds.includes(reward.image.id);
                setGachaReward({ image: reward.image, isNew });
            } else {
                setGachaReward(null);
            }
        }

        playSound(win ? 'complete' : 'buzz');
    };

    const handleAction = (action: 'restart' | 'exit') => {
        if (gachaReward) {
            setPendingAction(action);
            setStatus('menu'); // Hide result modal
            setShowGacha(true);
        } else {
            if (action === 'restart') startGame();
            else onExit();
        }
    };

    const handleGachaClose = () => {
        setShowGacha(false);
        setGachaReward(null);
        if (pendingAction === 'restart') startGame();
        else onExit();
        setPendingAction(null);
    };

    const updateGame = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        // Spawn Logic: Continuous Stream
        const lastItem = itemsRef.current[itemsRef.current.length - 1];
        const canSpawn = !lastItem || lastItem.yPosition > SPAWN_DISTANCE;

        if (canSpawn && questionCountRef.current < TARGET_QUESTIONS) {
            spawnQuestionSequence();
        } else if (questionCountRef.current >= TARGET_QUESTIONS && itemsRef.current.length === 0) {
            handleGameOver(true);
            return;
        }

        // Đồng bộ tốc độ chạy của vạch đường với tốc độ xe (không re-render).
        if (rootRef.current) {
            const dur = Math.max(0.16, 0.5 * (BASE_SPEED / speedRef.current));
            rootRef.current.style.setProperty('--road-dur', `${dur.toFixed(3)}s`);
        }

        // Move Items
        const speed = speedRef.current * (deltaTime / 16); // Normalize to 60fps
        itemsRef.current = itemsRef.current.map(item => ({
            ...item,
            yPosition: item.yPosition + speed
        }));

        // Update Current Question Text based on nearest incoming answers
        const activeItems = itemsRef.current.filter(i => !i.passed && i.questionText);
        if (activeItems.length > 0) {
            // The one with the highest Y (closest to bottom) is the current one
            const currentItem = activeItems.reduce((prev, current) => (prev.yPosition > current.yPosition) ? prev : current);
            if (currentItem.questionText && currentItem.questionText !== currentQuestionText) {
                setCurrentQuestionText(currentItem.questionText);
            }
        }

        // Collision Detection
        const CAR_HITBOX_Y_START = 80;
        const CAR_HITBOX_Y_END = 95;

        let hitOccurred = false;

        itemsRef.current.forEach(item => {
            if (item.passed) return;

            // Check Y overlap
            if (item.yPosition > CAR_HITBOX_Y_START && item.yPosition < CAR_HITBOX_Y_END) {
                // Check Lane overlap
                if (item.lane === laneRef.current) {
                    if (item.type === 'answer') {
                        item.passed = true;
                        hitOccurred = true;

                        // Đánh dấu cả nhóm câu này đã qua.
                        itemsRef.current.forEach(other => {
                            if (other.qid === item.qid) other.passed = true;
                        });

                        if (item.isCorrect) {
                            // Đúng! — cộng điểm + thưởng combo, tăng tốc dần.
                            comboRef.current += 1;
                            const bonus = Math.min(comboRef.current - 1, 5); // 0..5 thưởng thêm
                            scoreRef.current += 10 + bonus;
                            setScore(scoreRef.current);
                            setCombo(comboRef.current);
                            speedRef.current = Math.min(MAX_SPEED, speedRef.current + 0.015);
                            playSound('ding');
                            triggerFlash('good');
                            spawnPopup(item.lane, bonus > 0 ? `+${10 + bonus}` : '+10', true);

                        } else {
                            // Sai! — mất một mạng, reset combo, rung + chớp đỏ.
                            comboRef.current = 0;
                            setCombo(0);
                            livesRef.current -= 1;
                            setLives(livesRef.current);
                            playSound('buzz');
                            triggerFlash('bad');
                            setShake(true);
                            if (shakeTimer.current) clearTimeout(shakeTimer.current);
                            shakeTimer.current = setTimeout(() => setShake(false), 320);
                            spawnPopup(item.lane, 'Sai!', false);
                            if (livesRef.current <= 0) {
                                handleGameOver(false);
                                return;
                            }
                        }
                    }
                }
            }
        });

        // Cleanup off-screen items
        itemsRef.current = itemsRef.current.filter(item => item.yPosition < 120);

        // Update State for Render
        setItems([...itemsRef.current]);

        if (statusRef.current === 'playing') {
            requestRef.current = requestAnimationFrame(updateGame);
        }
    };

    // --- Controls ---

    const moveLeft = useCallback(() => {
        if (laneRef.current > 0) {
            laneRef.current -= 1;
            setLane(laneRef.current);
        }
    }, []);

    const moveRight = useCallback(() => {
        if (laneRef.current < 2) {
            laneRef.current += 1;
            setLane(laneRef.current);
        }
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (statusRef.current !== 'playing') return;
        if (e.key === 'ArrowLeft') moveLeft();
        if (e.key === 'ArrowRight') moveRight();
    }, [moveLeft, moveRight]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Touch Swipe
    const touchStartX = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartX.current) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX.current;
        if (Math.abs(diff) > 50) { // Threshold
            if (diff > 0) moveRight();
            else moveLeft();
        }
        touchStartX.current = null;
    };

    // --- Lifecycle ---

    const startGame = () => {
        setStatus('playing');
        setScore(0);
        setLives(3);
        setQuestionCount(0);
        setCurrentQuestionText('');
        itemsRef.current = [];
        laneRef.current = 1;
        setLane(1);
        scoreRef.current = 0;
        livesRef.current = 3;
        questionCountRef.current = 0;
        speedRef.current = BASE_SPEED;
        setEarnedStars(0);
        setGachaReward(null);
        setShowGacha(false);
        setPendingAction(null);
        comboRef.current = 0;
        setCombo(0);
        setFlash(null);
        setShake(false);
        setPopups([]);

        setShowInstructions(true);
        if (instructionsTimer.current) clearTimeout(instructionsTimer.current);
        instructionsTimer.current = setTimeout(() => {
            setShowInstructions(false);
        }, 5000);

        lastTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(updateGame);
    };

    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (flashTimer.current) clearTimeout(flashTimer.current);
            if (shakeTimer.current) clearTimeout(shakeTimer.current);
            if (instructionsTimer.current) clearTimeout(instructionsTimer.current);
        };
    }, []);

    // --- Render ---

    // Nhóm đáp án GẦN xe nhất là nhóm "đang chơi"; các nhóm khác (câu kế) làm mờ
    // để trẻ không lẫn "đáp án nào của câu nào" khi dòng chảy liên tục.
    const activeItems = items.filter((i) => !i.passed);
    const currentQid = activeItems.length
        ? activeItems.reduce((p, c) => (p.yPosition > c.yPosition ? p : c)).qid
        : null;

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex justify-center items-center">
            <div
                ref={rootRef}
                className={`relative w-full max-w-[480px] h-full bg-slate-900 flex flex-col shadow-2xl overflow-hidden ${shake ? 'rc-shake' : ''}`}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <style>{`
                    @keyframes rc-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
                    .rc-shake { animation: rc-shake 0.3s ease-in-out; }
                    @keyframes rc-popup { 0%{transform:translate(-50%,0) scale(0.6);opacity:0} 25%{transform:translate(-50%,-10px) scale(1.15);opacity:1} 100%{transform:translate(-50%,-70px) scale(1);opacity:0} }
                    .rc-popup { animation: rc-popup 0.75s ease-out forwards; }
                    @media (prefers-reduced-motion: reduce) { .rc-shake { animation: none; } }
                `}</style>

                {/* Header / HUD */}
                <div className="absolute top-0 left-0 w-full z-50 p-4 flex justify-between items-start pointer-events-none">
                    <div className="flex flex-col gap-2">
                        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border-2 border-slate-200">
                            <p className="text-xs text-slate-500 font-bold uppercase">Điểm số</p>
                            <p className="text-2xl font-black text-brand-600">{score}</p>
                        </div>
                        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border-2 border-slate-200">
                            <p className="text-xs text-slate-500 font-bold uppercase">Tiến độ</p>
                            <p className="text-lg font-bold text-slate-700">{questionCount} / {TARGET_QUESTIONS}</p>
                        </div>
                        {/* Biểu tượng combo xếp dọc ở cột trái để tránh đè lên các phần tử khác */}
                        {status === 'playing' && combo >= 2 && (
                            <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white px-4 py-1.5 rounded-xl shadow-lg font-black text-sm flex items-center gap-1 justify-center motion-safe:animate-bounce">
                                🔥 Combo x{combo}
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-3 pointer-events-auto">
                        <div className="flex gap-1 mt-1">
                            {[...Array(3)].map((_, i) => (
                                <Heart
                                    key={i}
                                    className={`w-8 h-8 ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-400 fill-slate-800/20'}`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={onExit}
                            aria-label="Thoát game"
                            className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg border-2 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Bảng câu hỏi hiện tại (nổi ở giữa header) */}
                {status === 'playing' && currentQuestionText && (
                    <div 
                        className="absolute top-[80px] left-1/2 z-50 animate-in fade-in zoom-in duration-300 flex justify-center pointer-events-none"
                        style={{ transform: 'translateX(-50%)' }}
                    >
                        <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl border-4 border-brand-400">
                            <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-wider drop-shadow-sm whitespace-nowrap">
                                {currentQuestionText}
                            </p>
                        </div>
                    </div>
                )}



                {/* Game Area */}
                <div className="flex-1 relative">
                    <RacingTrack>
                        {/* Items */}
                        {items.map(item => (
                            <FallingItem
                                key={item.id}
                                lane={item.lane}
                                yPosition={item.yPosition}
                                content={item.content}
                                type={item.type}
                                dimmed={currentQid != null && item.qid !== currentQid}
                            />
                        ))}

                        {/* Bảng điểm bay lên khi va chạm */}
                        {popups.map(p => (
                            <div
                                key={p.id}
                                className="absolute z-40 -translate-x-1/2 font-black text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] pointer-events-none rc-popup"
                                style={{ left: laneLeft(p.lane), bottom: '120px', color: p.good ? '#22c55e' : '#ef4444' }}
                            >
                                {p.text}
                            </div>
                        ))}

                        {/* Player Car */}
                        <RacingCar lane={lane} />
                    </RacingTrack>
                </div>

                {/* Chớp xanh/đỏ phản hồi đúng/sai */}
                {flash && (
                    <div
                        className={`absolute inset-0 z-40 pointer-events-none ${flash === 'good' ? 'bg-emerald-400/25' : 'bg-red-500/30'}`}
                        style={{ transition: 'opacity 0.2s', opacity: 1 }}
                    />
                )}

                {/* Nút điều khiển (cảm ứng) */}
                {status === 'playing' && (
                    <div className="absolute bottom-5 left-0 w-full flex justify-between px-6 pointer-events-auto z-50 md:hidden">
                        <button
                            onClick={moveLeft}
                            aria-label="Chuyển làn sang trái"
                            className="w-16 h-16 flex items-center justify-center bg-white/25 backdrop-blur rounded-full border border-white/30 shadow-lg active:scale-90 active:bg-white/45 transition-transform"
                        >
                            <ArrowLeft className="text-white w-9 h-9" />
                        </button>
                        <button
                            onClick={moveRight}
                            aria-label="Chuyển làn sang phải"
                            className="w-16 h-16 flex items-center justify-center bg-white/25 backdrop-blur rounded-full border border-white/30 shadow-lg active:scale-90 active:bg-white/45 transition-transform"
                        >
                            <ArrowRight className="text-white w-9 h-9" />
                        </button>
                    </div>
                )}

                {/* Gợi ý bàn phím cho máy tính */}
                {status === 'playing' && showInstructions && (
                    <div 
                        className="hidden md:flex absolute bottom-5 left-1/2 z-50 items-center gap-2 bg-black/40 text-white/90 px-4 py-2 rounded-full text-sm font-bold pointer-events-none"
                        style={{ transform: 'translateX(-50%)' }}
                    >
                        <ArrowLeft size={16} /> <ArrowRight size={16} /> Dùng phím mũi tên để đổi làn
                    </div>
                )}

                {/* Menus */}
                {status === 'menu' && !showGacha && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in">
                            <h1 className="text-3xl font-black text-brand-600 mb-2">Đường Đua Thần Tốc</h1>
                            <p className="text-slate-500 mb-8">Lái xe chọn đáp án đúng để về đích!</p>

                            <div className="space-y-4">
                                <button
                                    onClick={startGame}
                                    className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xl shadow-lg shadow-brand-200 flex items-center justify-center gap-2"
                                >
                                    <Play fill="currentColor" /> Bắt đầu
                                </button>
                                <button
                                    onClick={onExit}
                                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold"
                                >
                                    Thoát
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {(status === 'gameover' || status === 'victory') && !showGacha && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in border-4 border-brand-100">
                            {status === 'victory' ? (
                                <>
                                    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <Star size={48} className="text-yellow-500 fill-yellow-500 motion-safe:animate-spin" style={{ animationDuration: '4s' }} />
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-800 mb-2">Về Đích!</h2>
                                    <p className="text-slate-500 mb-6 font-medium">Bạn đã hoàn thành chặng đua xuất sắc.</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <Heart size={48} className="text-red-500 fill-red-500 animate-pulse" />
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-800 mb-2">Hết Xăng!</h2>
                                    <p className="text-slate-500 mb-6 font-medium">Đừng nản chí, hãy thử lại nhé.</p>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Điểm số</p>
                                    <p className="text-3xl font-black text-brand-600">{score}</p>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                                    <p className="text-xs text-yellow-600 uppercase font-bold mb-1">Sao thưởng</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <p className="text-3xl font-black text-yellow-500">{earnedStars}</p>
                                        <Star size={24} className="text-yellow-500 fill-yellow-500" />
                                    </div>
                                </div>
                            </div>

                            {gachaReward && (
                                <div className="mb-6 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border border-purple-200 animate-pulse">
                                    <p className="text-purple-700 font-bold flex items-center justify-center gap-2">
                                        <span>🎁</span> Có quà bí mật đang chờ!
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleAction('restart')}
                                    className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xl shadow-lg shadow-brand-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
                                >
                                    <RotateCcw /> Chơi lại
                                </button>
                                <button
                                    onClick={() => handleAction('exit')}
                                    className="w-full py-4 bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-200 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Home size={20} /> Thoát
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showGacha && gachaReward && (
                    <GachaModal
                        image={gachaReward.image}
                        isNew={gachaReward.isNew}
                        onClose={handleGachaClose}
                    />
                )}
            </div>
        </div>
    );
};
