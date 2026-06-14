import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChallengeData, getRandomChallenge, CircuitData, CHALLENGES, ComponentType } from '@/src/data/electricityData';
import { CircuitCanvas } from './CircuitCanvas';
import { analyzeCircuit, CircuitAnalysis } from './circuitEngine';
import { RefreshCw, Check, Star, ArrowRight } from 'lucide-react';

interface PlaygroundViewProps {
    onComplete?: (stars: number) => void;
    onExit?: () => void;
}

const PROGRESS_KEY = 'electricity_completed_challenges';

// --- Validator helpers (operate on the real electrical analysis) ---
const litOfType = (circuit: CircuitData, analysis: CircuitAnalysis, type: ComponentType) =>
    circuit.components.filter(c => c.type === type && analysis.litLoadIds.has(c.id));

const litCount = (circuit: CircuitData, analysis: CircuitAnalysis, type: ComponentType) =>
    litOfType(circuit, analysis, type).length;

// Two loads are "independently controlled" if each has its own switch that the
// other does not depend on (turning it off kills only that load).
const hasIndependentPair = (circuit: CircuitData, analysis: CircuitAnalysis, typeA: ComponentType, typeB: ComponentType) => {
    const as = litOfType(circuit, analysis, typeA);
    const bs = litOfType(circuit, analysis, typeB);
    for (const a of as) {
        for (const b of bs) {
            if (a.id === b.id) continue;
            const ca = analysis.controllingSwitches.get(a.id) ?? [];
            const cb = analysis.controllingSwitches.get(b.id) ?? [];
            if (ca.length === 0 || cb.length === 0) continue;
            const disjoint = ca.every(s => !cb.includes(s)) && cb.every(s => !ca.includes(s));
            if (disjoint) return true;
        }
    }
    return false;
};

// Validators now read the engine analysis, so they enforce the real goal:
// series vs parallel, independent control, short-circuit-free, etc.
const validators: Record<string, (circuit: CircuitData, analysis: CircuitAnalysis) => boolean> = {
    validateBasicCircuit: (_c, a) => a.litLoadIds.size > 0,

    validateBulbOn: (c, a) => litCount(c, a, 'bulb') >= 1,

    validateSwitchControls: (c, a) => {
        const bulbs = litOfType(c, a, 'bulb');
        // A switch must actually gate the lit bulb.
        return bulbs.some(b => (a.controllingSwitches.get(b.id) ?? []).length > 0);
    },

    validateBellWorks: (c, a) => litCount(c, a, 'bell') >= 1,

    validateSeriesBulbs: (c, a) => litCount(c, a, 'bulb') >= 2 && a.loadConnection === 'series',

    validateParallelBulbs: (c, a) => litCount(c, a, 'bulb') >= 2 && a.loadConnection === 'parallel',

    validateFanWorks: (c, a) => litCount(c, a, 'fan') >= 1,

    // Fan must be running AND positioned near a candle (the blow-out effect).
    validateCandleBlown: (c, a) => {
        const fans = litOfType(c, a, 'fan');
        const candles = c.components.filter(x => x.type === 'candle');
        return fans.some(f => candles.some(cd => Math.hypot(f.x - cd.x, f.y - cd.y) < 150));
    },

    validateIndependentControl: (c, a) =>
        litCount(c, a, 'bulb') >= 2 && hasIndependentPair(c, a, 'bulb', 'bulb'),

    validateAlarmSystem: (c, a) => litCount(c, a, 'bell') >= 1 && litCount(c, a, 'buzzer') >= 1,

    validateSmartRoom: (c, a) =>
        litCount(c, a, 'bulb') >= 1 && litCount(c, a, 'fan') >= 1 && hasIndependentPair(c, a, 'bulb', 'fan'),

    validateBuzzerWorks: (c, a) => litCount(c, a, 'buzzer') >= 1,

    validateBulbAndBell: (c, a) => litCount(c, a, 'bulb') >= 1 && litCount(c, a, 'bell') >= 1,

    validateThreeBulbsSeries: (c, a) => litCount(c, a, 'bulb') >= 3 && a.loadConnection === 'series',

    validateComplexCircuit: (c, a) =>
        litCount(c, a, 'bulb') >= 1 && litCount(c, a, 'fan') >= 1 && litCount(c, a, 'bell') >= 1,
};

// Build a kid-friendly explanation of why a check failed.
const explainFailure = (
    challenge: ChallengeData,
    circuit: CircuitData,
    analysis: CircuitAnalysis,
    hasAllRequired: boolean
): string => {
    if (!hasAllRequired) return 'Mạch còn thiếu linh kiện mà đề yêu cầu. Hãy kéo thêm vào nhé!';
    if (!analysis.hasClosedLoop) return 'Mạch chưa kín. Hãy nối thành vòng: từ cực (+) qua thiết bị rồi về cực (−) của pin.';
    if (analysis.litLoadIds.size === 0) {
        if (analysis.hasShortCircuit) return 'Pin đang bị đoản mạch (nối thẳng + sang −). Hãy cho dòng điện đi qua thiết bị.';
        return 'Mạch kín rồi nhưng chưa có thiết bị nào hoạt động — kiểm tra xem công tắc đã bật chưa.';
    }
    if (challenge.validator === 'validateSeriesBulbs' || challenge.validator === 'validateThreeBulbsSeries') {
        if (analysis.loadConnection === 'parallel') return 'Các đèn đang mắc song song, nhưng đề yêu cầu mắc NỐI TIẾP (nối thành một hàng).';
        if (analysis.loadConnection === 'mixed') return 'Mạch đang mắc hỗn hợp. Đề yêu cầu các đèn mắc NỐI TIẾP thành một hàng duy nhất.';
    }
    if (challenge.validator === 'validateParallelBulbs' && analysis.loadConnection === 'series') {
        return 'Các đèn đang mắc nối tiếp, nhưng đề yêu cầu mắc SONG SONG (mỗi đèn một nhánh riêng).';
    }
    if (challenge.validator === 'validateIndependentControl' || challenge.validator === 'validateSmartRoom') {
        return 'Mạch chạy rồi, nhưng mỗi thiết bị cần một công tắc riêng để điều khiển độc lập.';
    }
    return 'Mạch đang chạy nhưng chưa đúng yêu cầu của đề. Đọc lại gợi ý 💡 phía trên nhé!';
};

// Load persisted completed-challenge ids
const loadCompleted = (): Set<string> => {
    try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
        return new Set();
    }
};

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ onComplete }) => {
    const [challenge, setChallenge] = useState<ChallengeData | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false); // For showing "no stars" message
    const [failReason, setFailReason] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<1 | 2 | 3 | undefined>(undefined);
    const [challengeKey, setChallengeKey] = useState(0);

    // Persisted progress
    const completedChallenges = useRef<Set<string>>(loadCompleted());
    const [completedCount, setCompletedCount] = useState(completedChallenges.current.size);
    const [totalStars, setTotalStars] = useState(
        CHALLENGES.filter(c => completedChallenges.current.has(c.id)).reduce((s, c) => s + c.difficulty, 0)
    );

    // Circuit state from CircuitCanvas
    const circuitRef = useRef<CircuitData>({ components: [], wires: [] });

    useEffect(() => {
        loadNewChallenge(difficultyFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadNewChallenge = (difficulty?: 1 | 2 | 3) => {
        const newChallenge = getRandomChallenge(difficulty, challenge?.id);
        setChallenge(newChallenge);
        circuitRef.current = { components: [], wires: [] };
        setChallengeKey(prev => prev + 1);
        setShowResult(false);
        setIsCorrect(false);
        setFailReason('');
    };

    const pickDifficulty = (difficulty?: 1 | 2 | 3) => {
        setDifficultyFilter(difficulty);
        const newChallenge = getRandomChallenge(difficulty);
        setChallenge(newChallenge);
        circuitRef.current = { components: [], wires: [] };
        setChallengeKey(prev => prev + 1);
        setShowResult(false);
        setIsCorrect(false);
        setFailReason('');
    };

    const handleCircuitChange = useCallback((circuit: CircuitData) => {
        circuitRef.current = circuit;
    }, []);

    const handleCheck = () => {
        if (!challenge) return;

        const circuit = circuitRef.current;
        const analysis = analyzeCircuit(circuit.components, circuit.wires);

        // Count required components (handle duplicates like 2 bulbs)
        const requiredCounts: Record<string, number> = {};
        challenge.requiredComponents.forEach(type => {
            requiredCounts[type] = (requiredCounts[type] || 0) + 1;
        });

        const actualCounts: Record<string, number> = {};
        circuit.components.forEach(c => {
            actualCounts[c.type] = (actualCounts[c.type] || 0) + 1;
        });

        const hasAllRequired = Object.entries(requiredCounts).every(
            ([type, count]) => (actualCounts[type] || 0) >= count
        );

        const validatorFn = challenge.validator && validators[challenge.validator]
            ? validators[challenge.validator]
            : validators.validateBasicCircuit;

        const success = hasAllRequired && validatorFn(circuit, analysis);

        setIsCorrect(success);
        setShowResult(true);

        if (success) {
            setFailReason('');
            const alreadyCompleted = completedChallenges.current.has(challenge.id);
            setWasAlreadyCompleted(alreadyCompleted);
            if (!alreadyCompleted) {
                completedChallenges.current.add(challenge.id);
                try {
                    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...completedChallenges.current]));
                } catch { /* ignore quota errors */ }
                setCompletedCount(prev => prev + 1);
                setTotalStars(prev => prev + challenge.difficulty);
                onComplete?.(challenge.difficulty);
            }
        } else {
            setWasAlreadyCompleted(false);
            setFailReason(explainFailure(challenge, circuit, analysis, hasAllRequired));
        }
    };

    const handleNextChallenge = () => {
        loadNewChallenge(difficultyFilter);
    };

    const renderStars = (count: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                    <Star
                        key={i}
                        size={20}
                        className={i <= count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                    />
                ))}
            </div>
        );
    };

    if (!challenge) return null;

    return (
        <div className="h-full flex flex-col">
            {/* Challenge header */}
            <div className="shrink-0 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg px-3 py-2 mb-2 border border-orange-200 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                        <span className="text-xl shrink-0">🎯</span>
                        <h3 className="font-bold text-orange-800">{challenge.title}</h3>
                        {renderStars(challenge.difficulty)}
                    </div>

                    <button
                        onClick={() => loadNewChallenge()}
                        className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-orange-50 rounded-md text-orange-600 transition-all border border-orange-200 text-sm shrink-0"
                    >
                        <RefreshCw size={14} />
                        <span className="hidden sm:inline">Đổi đề</span>
                    </button>
                </div>
                <p className="text-gray-600 text-sm mt-0.5">{challenge.description}</p>
                {challenge.hint && (
                    <p className="text-orange-600/90 text-xs mt-1">
                        💡 {challenge.hint}
                    </p>
                )}

                {/* Difficulty filter */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-orange-700/70 text-xs mr-0.5">Độ khó:</span>
                    {([
                        { val: undefined, label: 'Tất cả' },
                        { val: 1, label: '⭐' },
                        { val: 2, label: '⭐⭐' },
                        { val: 3, label: '⭐⭐⭐' },
                    ] as const).map(opt => (
                        <button
                            key={opt.label}
                            onClick={() => pickDifficulty(opt.val)}
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${difficultyFilter === opt.val
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-50'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Circuit canvas */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <CircuitCanvas
                    key={challengeKey}
                    onChange={handleCircuitChange}
                    autoPower
                />
            </div>

            {/* Bottom controls */}
            <div className="shrink-0 flex items-center justify-between gap-3 mt-3 pt-3 border-t border-orange-200">
                <div className="flex items-center gap-4">
                    <div className="text-slate-500 text-sm">
                        Đã hoàn thành: <span className="text-slate-800 font-semibold">{completedCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-sm">
                        <Star size={16} className="fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{totalStars}</span>
                    </div>
                </div>

                <button
                    onClick={handleCheck}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-semibold shadow-md shadow-green-600/20 transition-all"
                >
                    <Check size={20} />
                    Kiểm tra
                </button>
            </div>

            {/* Result modal */}
            {showResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in">
                    <div className={`
                        w-full max-w-md p-6 rounded-2xl text-center
                        ${isCorrect
                            ? 'bg-gradient-to-br from-green-900 to-green-800 border-2 border-green-500'
                            : 'bg-gradient-to-br from-red-900 to-red-800 border-2 border-red-500'
                        }
                    `}>
                        <div className="text-6xl mb-4">
                            {isCorrect ? '🎉' : '🤔'}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {isCorrect ? 'Tuyệt vời!' : 'Chưa đúng!'}
                        </h3>
                        <p className="text-white/80 mb-4">
                            {isCorrect
                                ? wasAlreadyCompleted
                                    ? 'Bạn đã làm bài này rồi nên không nhận thêm sao — nhưng vẫn rất giỏi!'
                                    : `Bạn đã hoàn thành nhiệm vụ và nhận được ${challenge.difficulty} sao!`
                                : failReason
                            }
                        </p>

                        {isCorrect && (
                            <div className="flex justify-center gap-2 mb-6">
                                {renderStars(challenge.difficulty)}
                            </div>
                        )}

                        <div className="flex gap-3 justify-center">
                            {isCorrect ? (
                                <button
                                    onClick={handleNextChallenge}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-xl font-semibold hover:bg-green-100 transition-all"
                                >
                                    <ArrowRight size={20} />
                                    Bài tiếp theo
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowResult(false)}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-red-700 rounded-xl font-semibold hover:bg-red-100 transition-all"
                                >
                                    Thử lại
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
