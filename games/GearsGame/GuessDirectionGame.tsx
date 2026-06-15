import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import Gear from './components/Gear';
import GearCanvas from './components/GearCanvas';
import GearHeader from './components/GearHeader';
import { DifficultyPill, RoleBadge } from './components/GearBits';
import { COLORS, MOTOR } from './engine/constants';
import { generateGuessLevel } from './engine/levelgen';
import { simulate } from './engine/simulate';
import { gradeGuess } from './engine/goals';
import { Difficulty, Dir, GearRuntime, GearSpec, GuessLevel } from './engine/types';

interface GuessDirectionGameProps {
    difficulty: Difficulty;
    onBack?: () => void;
}

const colorFor = (g: GearSpec): string =>
    g.role === 'motor' ? COLORS.motor : g.role === 'target' ? COLORS.target : g.role === 'anchor' ? COLORS.anchor : COLORS.gear;

const GuessDirectionGame: React.FC<GuessDirectionGameProps> = ({ difficulty, onBack }) => {
    const seedRef = useRef((Date.now() & 0x7fffffff) >>> 0);
    const [level, setLevel] = useState<GuessLevel>(() => generateGuessLevel(difficulty, seedRef.current));

    const [guesses, setGuesses] = useState<Map<string, Dir>>(new Map());
    const [revealed, setRevealed] = useState(false);
    const [results, setResults] = useState<Map<string, boolean>>(new Map());

    useEffect(() => {
        setGuesses(new Map());
        setRevealed(false);
        setResults(new Map());
    }, [level]);

    // sim THẬT — luôn tính để chấm điểm; chỉ animate khi đã lật đáp án.
    const sim = useMemo(
        () => simulate(level.layout, { id: level.motorId, dir: MOTOR.dir, speed: MOTOR.speed }),
        [level]
    );
    const idleRuntime = useMemo(() => {
        const m = new Map<string, GearRuntime>();
        for (const g of level.layout.gears) m.set(g.id, { state: 'idle', dir: 0, speed: 0, phaseDeg: 0 });
        return m;
    }, [level]);
    const runtime = revealed ? sim.runtime : idleRuntime;

    const toggleGuess = (id: string) => {
        if (revealed) return;
        setGuesses((prev) => {
            const next = new Map(prev);
            const cur = next.get(id);
            if (cur === undefined) next.set(id, 1);
            else if (cur === 1) next.set(id, -1);
            else next.delete(id);
            return next;
        });
    };

    const check = () => {
        setResults(gradeGuess(sim, level.gearsToGuess, guesses));
        setRevealed(true);
    };

    const regen = () => {
        seedRef.current = ((seedRef.current * 1103515245 + 12345) & 0x7fffffff) >>> 0;
        setLevel(generateGuessLevel(difficulty, seedRef.current));
    };

    const allGuessed = level.gearsToGuess.every((id) => guesses.has(id));
    const allCorrect = revealed && level.gearsToGuess.every((id) => results.get(id) === true);

    return (
        <div className="w-full h-screen bg-gradient-to-b from-sky-50 to-sky-100 flex flex-col font-sans select-none overflow-hidden">
            <GearHeader title="🔄 Đoán Chiều Quay" onBack={onBack} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="w-full px-4 py-3 flex items-center justify-between bg-white/50 gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <DifficultyPill difficulty={level.difficulty} />
                        <span className="text-gray-600 text-sm">Đoán chiều quay của các bánh răng có dấu “?”</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-sky-600 font-medium bg-sky-100 px-3 py-1 rounded-full">
                            {guesses.size}/{level.gearsToGuess.length} đã chọn
                        </span>
                        <button onClick={regen} className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 rounded-lg border border-gray-300 text-gray-600 text-sm shadow-sm">
                            <RotateCcw size={14} /> Làm mới
                        </button>
                    </div>
                </div>

                <div className="flex-1 w-full px-4 pb-2">
                    <GearCanvas
                        gridId="guess-grid"
                        gridColor="rgba(14, 165, 233, 0.15)"
                        borderClass="border-sky-200"
                        waterZones={level.waterZones}
                        belts={level.layout.belts}
                        gears={level.layout.gears}
                        runtime={runtime}
                        beltsAnimated={revealed}
                    >
                        <div className="absolute inset-0">
                            {level.layout.gears.map((g) => {
                                const rt = runtime.get(g.id);
                                const needsGuess = level.gearsToGuess.includes(g.id);
                                const guess = guesses.get(g.id);
                                const result = results.get(g.id);
                                return (
                                    <div key={g.id} className="absolute" style={{ left: g.x - g.radius, top: g.y - g.radius }}>
                                        <RoleBadge role={g.role} />

                                        {needsGuess && !revealed && (
                                            <button
                                                aria-label={`Đoán chiều quay: ${guess === 1 ? 'cùng chiều kim đồng hồ' : guess === -1 ? 'ngược chiều kim đồng hồ' : 'chưa chọn'}`}
                                                onClick={() => toggleGuess(g.id)}
                                                className={`absolute z-30 w-10 h-10 text-lg rounded-full flex items-center justify-center font-bold shadow-lg border-2 ${guess === 1 ? 'bg-emerald-500 text-white border-emerald-300' : guess === -1 ? 'bg-rose-500 text-white border-rose-300' : 'bg-white text-gray-500 border-gray-300 hover:border-sky-400'}`}
                                                style={{ left: g.radius - 20, top: -34 }}
                                            >
                                                {guess === 1 ? '↻' : guess === -1 ? '↺' : '?'}
                                            </button>
                                        )}
                                        {needsGuess && revealed && (
                                            <div className={`absolute z-30 w-10 h-10 text-lg rounded-full flex items-center justify-center text-white font-bold shadow-lg ${result ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ left: g.radius - 20, top: -34 }} role="img" aria-label={result ? 'Đúng' : 'Sai'}>
                                                {result ? '✓' : '✗'}
                                            </div>
                                        )}
                                        {g.role === 'motor' && (
                                            <div className="absolute z-30 bg-emerald-500 text-white font-bold text-lg w-8 h-8 rounded-full flex items-center justify-center border-2 border-emerald-300 shadow-lg animate-pulse" style={{ left: g.radius - 16, top: g.radius * 2 + 6 }}>↻</div>
                                        )}

                                        <Gear teeth={g.teeth} radius={g.radius} color={colorFor(g)} runtime={rt} isFixed={g.fixed} showDirection={revealed} />
                                    </div>
                                );
                            })}
                        </div>
                    </GearCanvas>
                </div>

                <div className="w-full py-4 flex items-center justify-center gap-4 border-t border-sky-200 bg-white">
                    {!revealed ? (
                        <button
                            onClick={check}
                            disabled={!allGuessed}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg shadow-lg ${allGuessed ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white hover:shadow-xl' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            <Check size={24} /> Kiểm tra
                        </button>
                    ) : (
                        <>
                            <div className={`px-5 py-3 rounded-xl font-bold text-lg ${allCorrect ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' : 'bg-amber-100 text-amber-700 border-2 border-amber-300'}`}>
                                {allCorrect ? '🎉 Tuyệt vời!' : '💡 Thử lại nhé!'}
                            </div>
                            <button onClick={regen} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all">
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
