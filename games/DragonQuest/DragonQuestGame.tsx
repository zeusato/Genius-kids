import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, Trophy, Play, RotateCcw } from 'lucide-react';
import { soundManager } from '../../utils/sound';
import {
    DragonDifficulty,
    TileType,
    BuffType,
    MapTile,
    PlayerBuffs,
    generateMap,
    rollDice,
    calculateTeleport,
    getRandomBuff,
    calculateBossQuestions,
    getRandomDialogue,
    generateQuestion,
    getBuffName,
    getBuffDescription,
    getBuffIcon,
    COMBAT_DIALOGUES,
    BUFF_DIALOGUES,
    BOSS_DIALOGUES
} from './dragonQuestEngine';
import { SpeedQuestion } from '../SpeedMath/speedMathEngine';

// Import components
import {
    GameBoard,
    DiceRoll,
    CombatModal,
    BuffModal,
    BossModal,
    TeleportModal
} from './components';

interface DragonQuestGameProps {
    difficulty: 'easy' | 'medium' | 'hard';
    onBack: () => void;
    onComplete: (score: number, maxScore: number, medal: 'bronze' | 'silver' | 'gold' | null) => void;
}

type GamePhase = 'intro' | 'playing' | 'rolling' | 'moving' | 'combat' | 'buff' | 'teleport' | 'boss' | 'gameover';

export const DragonQuestGame: React.FC<DragonQuestGameProps> = ({ difficulty, onBack, onComplete }) => {
    // Game State
    const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
    const [playerHP, setPlayerHP] = useState(3);
    const [playerPosition, setPlayerPosition] = useState(0);
    const [buffs, setBuffs] = useState<PlayerBuffs>({
        holySword: 0,
        holyGrail: 0,
        flyingCloak: false
    });
    const [mapTiles, setMapTiles] = useState<MapTile[]>([]);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<SpeedQuestion | null>(null);
    const [currentDialogue, setCurrentDialogue] = useState('');
    const [bossQuestionsRemaining, setBossQuestionsRemaining] = useState(0);
    const [score, setScore] = useState(0);
    const [teleportInfo, setTeleportInfo] = useState<{ distance: number; newPosition: number; isBackward: boolean } | null>(null);

    // Refs
    const movingRef = useRef(false);

    // --- GAME FLOW ---

    const startGame = () => {
        const newMap = generateMap();
        setMapTiles(newMap);
        setPlayerHP(3);
        setPlayerPosition(0);
        setBuffs({ holySword: 0, holyGrail: 0, flyingCloak: false });
        setScore(0);
        setDiceValue(null);
        setGamePhase('playing');
    };

    const handleDiceRoll = () => {
        if (movingRef.current || gamePhase !== 'playing') return;

        const value = rollDice();
        setDiceValue(value);
        setGamePhase('moving');
        movingRef.current = true;

        // Wait for dice animation to complete (1.5s) before moving player
        setTimeout(() => {
            const newPosition = Math.min(playerPosition + value, mapTiles.length - 1);
            setPlayerPosition(newPosition);

            // Wait for movement animation then trigger tile event
            setTimeout(() => {
                movingRef.current = false;
                handleTileEvent(newPosition);
            }, 800);
        }, 1700); // 1500ms dice roll + 200ms buffer
    };

    const handleTileEvent = (position: number) => {
        const tile = mapTiles[position];

        switch (tile.type) {
            case TileType.Combat:
                const combatQuestion = generateQuestion(difficulty);
                setCurrentQuestion(combatQuestion);
                setCurrentDialogue(getRandomDialogue(COMBAT_DIALOGUES));
                setGamePhase('combat');
                break;

            case TileType.Buff:
                const buffQuestion = generateQuestion(difficulty);
                setCurrentQuestion(buffQuestion);
                setCurrentDialogue(getRandomDialogue(BUFF_DIALOGUES));
                setGamePhase('buff');
                break;

            case TileType.Teleport:
                const teleport = calculateTeleport(position, mapTiles.length);
                setTeleportInfo(teleport);
                setGamePhase('teleport');
                break;

            case TileType.Boss:
                const bossQuestionCount = calculateBossQuestions(buffs.holySword);
                setBossQuestionsRemaining(bossQuestionCount);
                const bossQuestion = generateQuestion(difficulty);
                setCurrentQuestion(bossQuestion);
                setCurrentDialogue(getRandomDialogue(BOSS_DIALOGUES));
                setGamePhase('boss');
                break;

            default:
                // Normal tile - just continue
                setGamePhase('playing');
        }
    };

    const handleCombatAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            soundManager.playCorrect();
            setScore(s => s + 10);
            setGamePhase('playing');
        } else {
            soundManager.playWrong();
            loseHP();
        }
    };

    const handleBuffAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            soundManager.playCorrect();
            const newBuff = getRandomBuff();
            awardBuff(newBuff);
            setScore(s => s + 15);
        } else {
            soundManager.playWrong();
        }
        setGamePhase('playing');
    };

    const handleBossAnswer = (isCorrect: boolean, isTimeout: boolean) => {
        if (isCorrect) {
            soundManager.playCorrect();
            setScore(s => s + 20);

            const remaining = bossQuestionsRemaining - 1;
            if (remaining <= 0) {
                // Victory!
                endGame(true);
            } else {
                // Next question
                setBossQuestionsRemaining(remaining);
                const nextQuestion = generateQuestion(difficulty);
                setCurrentQuestion(nextQuestion);
            }
        } else {
            soundManager.playWrong();
            loseHP();

            if (playerHP > 1) {
                // Continue with next question if HP remains
                const remaining = bossQuestionsRemaining - 1;
                if (remaining <= 0) {
                    endGame(true);
                } else {
                    setBossQuestionsRemaining(remaining);
                    const nextQuestion = generateQuestion(difficulty);
                    setCurrentQuestion(nextQuestion);
                }
            }
        }
    };

    const handleTeleportComplete = () => {
        if (!teleportInfo) return;

        // Check flying cloak protection
        if (teleportInfo.isBackward && buffs.flyingCloak) {
            // Protected! Don't move
            setGamePhase('playing');
        } else {
            setPlayerPosition(teleportInfo.newPosition);
            setTimeout(() => {
                handleTileEvent(teleportInfo.newPosition);
            }, 500);
        }
        setTeleportInfo(null);
    };

    const loseHP = () => {
        const newHP = playerHP - 1;
        setPlayerHP(newHP);

        if (newHP <= 0) {
            endGame(false);
        } else {
            // Continue game if in combat/buff, or stay in boss for next question
            if (gamePhase === 'combat' || gamePhase === 'buff') {
                setGamePhase('playing');
            }
        }
    };

    const awardBuff = (buff: BuffType) => {
        setBuffs(prev => {
            const newBuffs = { ...prev };

            switch (buff) {
                case BuffType.HolySword:
                    if (newBuffs.holySword < 2) {
                        newBuffs.holySword++;
                    }
                    break;

                case BuffType.HolyGrail:
                    if (newBuffs.holyGrail < 3) {
                        newBuffs.holyGrail++;
                        // Increase HP (max 3)
                        setPlayerHP(hp => Math.min(3, hp + 1));
                    }
                    break;

                case BuffType.FlyingCloak:
                    newBuffs.flyingCloak = true;
                    break;
            }

            return newBuffs;
        });
    };

    const endGame = (victory: boolean) => {
        setGamePhase('gameover');
        soundManager.playComplete();
    };

    const getMedal = (): 'gold' | 'silver' | 'bronze' | null => {
        if (gamePhase !== 'gameover' || playerHP <= 0) return null;

        if (playerHP === 3) return 'gold';
        if (playerHP === 2) return 'silver';
        if (playerHP === 1) return 'bronze';
        return null;
    };

    // --- RENDER SCREENS ---

    if (gamePhase === 'intro') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in duration-300">
                    <div className="text-8xl mb-6">🐉</div>
                    <h1 className="text-4xl font-black text-slate-800 mb-2">Đại Chiến Rồng Thần</h1>
                    <p className="text-slate-500 text-lg mb-8">Phiêu lưu, thu thập buff và đánh bại rồng thần!</p>

                    <div className="space-y-4 mb-8 text-left bg-slate-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Heart className="text-red-500 fill-red-500" />
                            <span className="font-bold text-slate-700">3 Mạng</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Trophy className="text-yellow-500" />
                            <span className="font-bold text-slate-700">Thu thập Buff</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🐉</span>
                            <span className="font-bold text-slate-700">Đánh Boss cuối</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onBack} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                            Quay lại
                        </button>
                        <button onClick={startGame} className="flex-[2] py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105">
                            <Play size={20} fill="currentColor" /> Bắt đầu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gamePhase === 'gameover') {
        const medal = getMedal();
        const victory = playerHP > 0;

        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-in zoom-in duration-300">
                    <div className="mb-6">
                        {victory ? (
                            <Trophy size={80} className="text-yellow-400 mx-auto animate-bounce" />
                        ) : (
                            <Heart size={80} className="text-red-500 mx-auto fill-red-500" />
                        )}
                    </div>

                    <h2 className="text-3xl font-black text-slate-800 mb-2">
                        {victory ? 'Chiến thắng!' : 'Thất bại!'}
                    </h2>

                    <p className="text-slate-500 mb-4 text-lg">
                        {victory ? 'Bạn đã đánh bại rồng thần!' : 'Bạn đã hết mạng.'}
                    </p>

                    {victory && medal && (
                        <div className="flex items-center justify-center gap-2 my-4 bg-yellow-50 px-6 py-3 rounded-full">
                            <span className="text-lg font-semibold text-slate-700">Nhận được:</span>
                            <div className="flex">
                                {[...Array(playerHP)].map((_, i) => (
                                    <span key={i} className="text-2xl">⭐</span>
                                ))}
                            </div>
                            <span className="text-lg font-bold text-yellow-600">
                                +{playerHP} sao
                            </span>
                        </div>
                    )}

                    <div className="bg-slate-50 rounded-xl p-4 mb-8">
                        <div className="text-sm text-slate-500 mb-1">Tổng điểm</div>
                        <div className="text-5xl font-black text-brand-600">
                            {score}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                onComplete(score, 300, medal);
                                onBack();
                            }}
                            className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Thoát
                        </button>
                        <button onClick={startGame} className="flex-[2] py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105">
                            <RotateCcw size={20} /> Chơi lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Playing State
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 flex flex-col">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex justify-between items-center">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    <ArrowLeft />
                </button>

                <div className="flex items-center gap-6">
                    {/* HP */}
                    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                        <Heart className="text-red-500 fill-red-500" size={20} />
                        <span className="font-black text-red-700 text-xl">{playerHP}</span>
                    </div>

                    {/* Buffs */}
                    {buffs.holySword > 0 && (
                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-2 rounded-full border border-yellow-100">
                            <span className="text-xl">{getBuffIcon(BuffType.HolySword)}</span>
                            <span className="font-bold text-yellow-700">{buffs.holySword}</span>
                        </div>
                    )}
                    {buffs.flyingCloak && (
                        <div className="bg-blue-50 px-3 py-2 rounded-full border border-blue-100">
                            <span className="text-xl">{getBuffIcon(BuffType.FlyingCloak)}</span>
                        </div>
                    )}

                    {/* Score */}
                    <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-100">
                        <Trophy className="text-purple-500" size={20} />
                        <span className="font-black text-purple-700 text-xl">{score}</span>
                    </div>
                </div>

                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Game Board - Fullscreen */}
            <div className="flex-1 flex items-center justify-center p-4 relative">
                <GameBoard
                    tiles={mapTiles}
                    playerPosition={playerPosition}
                    isMoving={gamePhase === 'moving'}
                />

                {/* Dice Roll - Fixed Bottom Right Corner */}
                <div className="fixed bottom-2 right-2 z-50 w-24 lg:w-60">
                    <div className="bg-white rounded-lg lg:rounded-2xl shadow-xl lg:shadow-2xl p-1.5 lg:p-4 border-2 lg:border-4 border-amber-400">
                        <DiceRoll
                            onRoll={handleDiceRoll}
                            value={diceValue}
                            disabled={movingRef.current || gamePhase !== 'playing'}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            {gamePhase === 'combat' && currentQuestion && (
                <CombatModal
                    question={currentQuestion}
                    dialogue={currentDialogue}
                    onAnswer={handleCombatAnswer}
                />
            )}

            {gamePhase === 'buff' && currentQuestion && (
                <BuffModal
                    question={currentQuestion}
                    dialogue={currentDialogue}
                    onAnswer={handleBuffAnswer}
                />
            )}

            {gamePhase === 'boss' && currentQuestion && (
                <BossModal
                    question={currentQuestion}
                    dialogue={currentDialogue}
                    questionsRemaining={bossQuestionsRemaining}
                    onAnswer={handleBossAnswer}
                />
            )}

            {gamePhase === 'teleport' && teleportInfo && (
                <TeleportModal
                    distance={teleportInfo.distance}
                    isBackward={teleportInfo.isBackward}
                    hasProtection={buffs.flyingCloak}
                    onComplete={handleTeleportComplete}
                />
            )}
        </div>
    );
};
