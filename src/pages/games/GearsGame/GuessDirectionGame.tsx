import React, { useState, useEffect } from 'react';
import Gear from './components/Gear';
import Belt from './components/Belt';
import WaterZone from './components/WaterZone';
import { GearData, BeltData, calculateNetwork } from './engine/Physics';
import { generateGuessLevel, GuessModeLevel } from './engine/LevelGenerator';
import { ArrowLeft, RotateCcw, Check, Music, Volume2 } from 'lucide-react';

interface GuessDirectionGameProps {
    difficulty: 'easy' | 'medium' | 'hard';
    onBack?: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;

const GuessDirectionGame: React.FC<GuessDirectionGameProps> = ({ difficulty, onBack }) => {
    const [level, setLevel] = useState<GuessModeLevel>(() => generateGuessLevel(difficulty));
    const [gears, setGears] = useState<GearData[]>([]);
    const [guesses, setGuesses] = useState<Map<string, 1 | -1>>(new Map());
    const [revealed, setRevealed] = useState(false);
    const [results, setResults] = useState<Map<string, boolean>>(new Map());
    const [musicOn, setMusicOn] = useState(true);
    const [soundOn, setSoundOn] = useState(true);

    useEffect(() => {
        setGears([...level.gears]);
        setGuesses(new Map());
        setRevealed(false);
        setResults(new Map());
    }, [level]);

    useEffect(() => {
        if (!revealed) return;
        const calculated = calculateNetwork(
            gears.map(g => g.id === level.motorId ? { ...g, speed: 5, direction: 1 } : g),
            level.belts,
            level.motorId
        );
        setGears(calculated);
    }, [revealed, level]);

    const toggleGuess = (gearId: string) => {
        if (revealed) return;
        setGuesses(prev => {
            const newGuesses = new Map(prev);
            const current = newGuesses.get(gearId);
            if (!current) newGuesses.set(gearId, 1);
            else if (current === 1) newGuesses.set(gearId, -1);
            else newGuesses.delete(gearId);
            return newGuesses;
        });
    };

    const checkAnswers = () => {
        const calculated = calculateNetwork(
            gears.map(g => g.id === level.motorId ? { ...g, speed: 5, direction: 1 } : g),
            level.belts,
            level.motorId
        );
        const newResults = new Map<string, boolean>();
        level.gearsToGuess.forEach(id => {
            const gear = calculated.find(g => g.id === id);
            const guess = guesses.get(id);
            if (gear && guess) newResults.set(id, gear.direction === guess);
        });
        setResults(newResults);
        setRevealed(true);
    };

    const resetLevel = () => setLevel(generateGuessLevel(difficulty));
    const nextLevel = () => setLevel(generateGuessLevel(difficulty));

    const allGuessed = level.gearsToGuess.every(id => guesses.has(id));
    const allCorrect = revealed && level.gearsToGuess.every(id => results.get(id) === true);

    return (
        <div className="w-full h-screen bg-gradient-to-b from-sky-50 to-sky-100 flex flex-col font-sans select-none overflow-hidden">
            {/* ========== PAGE HEADER ========== */}
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 px-4 py-3 border-b border-amber-200 shadow-sm z-50 relative">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full font-medium shadow hover:shadow-md transition-all"
                >
                    <ArrowLeft size={18} />
                    Menu
                </button>
                <h1 className="text-xl font-bold text-amber-800">🔄 Đoán Chiều Quay</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setMusicOn(!musicOn)} className={`p-2 rounded-full ${musicOn ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-400'}`}>
                        <Music size={20} />
                    </button>
                    <button onClick={() => setSoundOn(!soundOn)} className={`p-2 rounded-full ${soundOn ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-400'}`}>
                        <Volume2 size={20} />
                    </button>
                </div>
            </div>

            {/* ========== GAME CONTENT ========== */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* ----- GAME HEADER ----- */}
                <div className="w-full px-4 py-3 flex items-center justify-between bg-white/50">
                    <div className="flex items-center gap-3">
                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${level.difficulty === 'easy' ? 'bg-green-100 text-green-700 border border-green-300' :
                            level.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                                'bg-red-100 text-red-700 border border-red-300'
                            }`}>
                            {level.difficulty === 'easy' ? 'Dễ' : level.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                        </span>
                        <span className="text-gray-600">Đoán chiều quay của các bánh răng có dấu "?"</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-sky-600 font-medium bg-sky-100 px-3 py-1 rounded-full">
                            {guesses.size}/{level.gearsToGuess.length} đã chọn
                        </span>
                        <button onClick={resetLevel} className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 text-gray-600 text-sm shadow-sm">
                            <RotateCcw size={14} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* ----- MAIN CANVAS (full width, content centered) ----- */}
                <div className="flex-1 w-full px-4 pb-2">
                    <div className="relative w-full h-full bg-white rounded-2xl shadow-lg border border-sky-200 overflow-hidden">
                        {/* Centered content container */}
                        <div className="absolute inset-0 flex justify-center">
                            <div className="relative" style={{ width: CANVAS_WIDTH, height: '100%' }}>
                                {/* Grid + Water + Belts */}
                                <svg className="absolute inset-0 w-full h-full z-0">
                                    <defs>
                                        <pattern id="guess-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                                            <circle cx="12.5" cy="12.5" r="1" fill="rgba(14, 165, 233, 0.1)" />
                                        </pattern>
                                    </defs>
                                    <rect width="100%" height="100%" fill="url(#guess-grid)" />
                                    {level.waterZones.map(zone => (
                                        <WaterZone key={zone.id} x={zone.x} y={zone.y} width={zone.width} height={zone.height} />
                                    ))}
                                    {level.belts.map(belt => {
                                        const source = gears.find(g => g.id === belt.sourceId);
                                        const target = gears.find(g => g.id === belt.targetId);
                                        if (!source || !target) return null;
                                        return <Belt key={belt.id} x1={source.x} y1={source.y} r1={source.radius} x2={target.x} y2={target.y} r2={target.radius} speed={revealed ? Math.abs(source.speed) : 0} />;
                                    })}
                                </svg>

                                {/* Gears */}
                                {gears.map(gear => {
                                    const needsGuess = level.gearsToGuess.includes(gear.id);
                                    const guess = guesses.get(gear.id);
                                    const result = results.get(gear.id);
                                    return (
                                        <div key={gear.id} className="absolute z-10" style={{ left: gear.x - gear.radius, top: gear.y - gear.radius }}>
                                            {gear.id === 'motor' && <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs bg-white px-2 py-1 rounded shadow border-2 border-emerald-300">⚡ MOTOR</div>}
                                            {gear.id === 'target' && <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-rose-600 font-bold text-xs bg-white px-2 py-1 rounded shadow border-2 border-rose-300">🎯 ĐÍCH</div>}
                                            {needsGuess && !revealed && (
                                                <button
                                                    onClick={() => toggleGuess(gear.id)}
                                                    className={`absolute z-30 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg border-2 ${guess === 1 ? 'bg-emerald-500 text-white border-emerald-300' : guess === -1 ? 'bg-rose-500 text-white border-rose-300' : 'bg-white text-gray-500 border-gray-300 hover:border-sky-400'}`}
                                                    style={{ left: gear.radius - 16, top: -28 }}
                                                >
                                                    {guess === 1 ? '↻' : guess === -1 ? '↺' : '?'}
                                                </button>
                                            )}
                                            {revealed && needsGuess && (
                                                <div className={`absolute z-30 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${result ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ left: gear.radius - 16, top: -28 }}>
                                                    {result ? '✓' : '✗'}
                                                </div>
                                            )}
                                            {gear.id === 'motor' && (
                                                <div className="absolute z-30 bg-emerald-500 text-white font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center border-2 border-emerald-300 shadow-lg animate-pulse" style={{ left: gear.radius - 16, top: gear.radius * 2 + 8 }}>↻</div>
                                            )}
                                            <Gear x={gear.radius} y={gear.radius} teeth={gear.teeth} radius={gear.radius} color={gear.id === 'motor' ? '#22c55e' : gear.id === 'target' ? '#f43f5e' : gear.isFixed ? '#94a3b8' : '#facc15'} speed={revealed ? gear.speed : 0} direction={gear.direction as 1 | -1 | 0} isFixed={gear.isFixed} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ----- BOTTOM ACTION ----- */}
                <div className="w-full py-4 flex items-center justify-center gap-4 border-t border-sky-200 bg-white">
                    {!revealed ? (
                        <button
                            onClick={checkAnswers}
                            disabled={!allGuessed}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg shadow-lg ${allGuessed ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white hover:shadow-xl' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            <Check size={24} />
                            Kiểm tra
                        </button>
                    ) : (
                        <>
                            <div className={`px-5 py-3 rounded-xl font-bold text-lg ${allCorrect ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' : 'bg-amber-100 text-amber-700 border-2 border-amber-300'}`}>
                                {allCorrect ? '🎉 Tuyệt vời!' : '💡 Thử lại nhé!'}
                            </div>
                            <button onClick={nextLevel} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
                                Tiếp tục →
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuessDirectionGame;
