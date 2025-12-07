import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChallengeData, getRandomChallenge, CircuitData } from '@/src/data/electricityData';
import { CircuitCanvas } from './CircuitCanvas';
import { RefreshCw, Check, Star, ArrowRight } from 'lucide-react';

interface PlaygroundViewProps {
    onComplete?: (stars: number) => void;
    onExit?: () => void;
}

// Validator functions for special challenges
const validators: Record<string, (circuit: CircuitData, circuitStatus: { isComplete: boolean; isPowered: boolean }) => boolean> = {
    // Default: just check if circuit works
    validateBasicCircuit: (circuit, status) => status.isPowered && status.isComplete,

    // Bulb lights up
    validateBulbOn: (circuit, status) => {
        const bulb = circuit.components.find(c => c.type === 'bulb' && c.isActive);
        return status.isPowered && status.isComplete && !!bulb;
    },

    // Switch controls the bulb
    validateSwitchControls: (circuit, status) => {
        const bulb = circuit.components.find(c => c.type === 'bulb' && c.isActive);
        const hasSwitch = circuit.components.some(c => c.type === 'switch');
        return status.isPowered && status.isComplete && !!bulb && hasSwitch;
    },

    // Bell rings
    validateBellWorks: (circuit, status) => {
        const bell = circuit.components.find(c => c.type === 'bell' && c.isActive);
        return status.isPowered && status.isComplete && !!bell;
    },

    // Two bulbs in series
    validateSeriesBulbs: (circuit, status) => {
        const bulbs = circuit.components.filter(c => c.type === 'bulb' && c.isActive);
        return status.isPowered && status.isComplete && bulbs.length >= 2;
    },

    // Two bulbs in parallel
    validateParallelBulbs: (circuit, status) => {
        const bulbs = circuit.components.filter(c => c.type === 'bulb' && c.isActive);
        return status.isPowered && status.isComplete && bulbs.length >= 2;
    },

    // Fan spins when powered
    validateFanWorks: (circuit, status) => {
        const fan = circuit.components.find(c => c.type === 'fan' && c.isActive);
        return status.isPowered && status.isComplete && !!fan;
    },

    // Fan blows out candle - candle isActive = true means blown out
    validateCandleBlown: (circuit, status) => {
        const candle = circuit.components.find(c => c.type === 'candle' && c.isActive);
        const fan = circuit.components.find(c => c.type === 'fan' && c.isActive);
        return status.isPowered && !!fan && !!candle;
    },

    // Two bulbs controlled independently
    validateIndependentControl: (circuit, status) => {
        const bulbs = circuit.components.filter(c => c.type === 'bulb');
        const switches = circuit.components.filter(c => c.type === 'switch');
        // Need at least 2 bulbs and 2 switches
        if (bulbs.length < 2 || switches.length < 2) return false;
        // At least one bulb should be on
        return status.isPowered && bulbs.some(b => b.isActive);
    },

    // Alarm system: bell AND buzzer work together
    validateAlarmSystem: (circuit, status) => {
        const bell = circuit.components.find(c => c.type === 'bell' && c.isActive);
        const buzzer = circuit.components.find(c => c.type === 'buzzer' && c.isActive);
        return status.isPowered && !!bell && !!buzzer;
    },

    // Smart room: light AND fan both work with independent control
    validateSmartRoom: (circuit, status) => {
        const bulb = circuit.components.find(c => c.type === 'bulb' && c.isActive);
        const fan = circuit.components.find(c => c.type === 'fan' && c.isActive);
        const switches = circuit.components.filter(c => c.type === 'switch');
        return status.isPowered && !!bulb && !!fan && switches.length >= 2;
    },

    // Buzzer works
    validateBuzzerWorks: (circuit, status) => {
        const buzzer = circuit.components.find(c => c.type === 'buzzer' && c.isActive);
        return status.isPowered && status.isComplete && !!buzzer;
    },

    // Bulb AND bell work together
    validateBulbAndBell: (circuit, status) => {
        const bulb = circuit.components.find(c => c.type === 'bulb' && c.isActive);
        const bell = circuit.components.find(c => c.type === 'bell' && c.isActive);
        return status.isPowered && !!bulb && !!bell;
    },

    // Three bulbs in series
    validateThreeBulbsSeries: (circuit, status) => {
        const bulbs = circuit.components.filter(c => c.type === 'bulb' && c.isActive);
        return status.isPowered && status.isComplete && bulbs.length >= 3;
    },

    // Complex circuit with bulb, fan, bell
    validateComplexCircuit: (circuit, status) => {
        const bulb = circuit.components.find(c => c.type === 'bulb' && c.isActive);
        const fan = circuit.components.find(c => c.type === 'fan' && c.isActive);
        const bell = circuit.components.find(c => c.type === 'bell' && c.isActive);
        return status.isPowered && !!bulb && !!fan && !!bell;
    },
};

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({ onComplete }) => {
    const [challenge, setChallenge] = useState<ChallengeData | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [wasAlreadyCompleted, setWasAlreadyCompleted] = useState(false); // For showing "no stars" message
    const [completedCount, setCompletedCount] = useState(0);
    const [totalStars, setTotalStars] = useState(0);
    const [challengeKey, setChallengeKey] = useState(0);
    const [completedChallenges] = useState<Set<string>>(new Set()); // Track completed challenge IDs

    // Circuit state from CircuitCanvas
    const circuitRef = useRef<CircuitData>({ components: [], wires: [] });
    const [circuitStatus, setCircuitStatus] = useState({ isComplete: false, isPowered: false });

    useEffect(() => {
        loadNewChallenge();
    }, []);

    const loadNewChallenge = (difficulty?: 1 | 2 | 3) => {
        const newChallenge = getRandomChallenge(difficulty);
        setChallenge(newChallenge);
        circuitRef.current = { components: [], wires: [] };
        setCircuitStatus({ isComplete: false, isPowered: false });
        setChallengeKey(prev => prev + 1);
        setShowResult(false);
        setIsCorrect(false);
    };

    const handleCircuitChange = useCallback((circuit: CircuitData) => {
        circuitRef.current = circuit;
    }, []);

    const handleCircuitStatusChange = useCallback((status: { isComplete: boolean; isPowered: boolean }) => {
        setCircuitStatus(status);
    }, []);

    const handleCheck = () => {
        if (!challenge) return;

        const circuit = circuitRef.current;

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

        // Use custom validator if defined, otherwise use basic circuit check
        const validatorFn = challenge.validator && validators[challenge.validator]
            ? validators[challenge.validator]
            : validators.validateBasicCircuit;

        const circuitWorks = validatorFn(circuit, circuitStatus);

        const success = hasAllRequired && circuitWorks;

        console.log('Validation:', {
            hasAllRequired,
            requiredCounts,
            actualCounts,
            circuitStatus,
            circuitWorks,
            success
        });

        setIsCorrect(success);
        setShowResult(true);

        if (success) {
            // Only award stars if not already completed
            const alreadyCompleted = completedChallenges.has(challenge.id);
            setWasAlreadyCompleted(alreadyCompleted);
            if (!alreadyCompleted) {
                completedChallenges.add(challenge.id);
                setCompletedCount(prev => prev + 1);
                setTotalStars(prev => prev + (challenge?.difficulty || 1));
                onComplete?.(challenge?.difficulty || 1);
            }
        } else {
            setWasAlreadyCompleted(false);
        }
    };

    const handleNextChallenge = () => {
        loadNewChallenge();
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
            {/* Challenge header - compact */}
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg px-3 py-2 mb-2 border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xl">🎯</span>
                        <h3 className="font-bold text-orange-800 truncate">{challenge.title}</h3>
                        {renderStars(challenge.difficulty)}
                        <span className="text-gray-600 text-sm hidden sm:inline">—</span>
                        <p className="text-gray-600 text-sm truncate hidden sm:inline">{challenge.description}</p>
                    </div>

                    <button
                        onClick={() => loadNewChallenge()}
                        className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-orange-50 rounded-md text-orange-600 transition-all border border-orange-200 text-sm shrink-0"
                    >
                        <RefreshCw size={14} />
                        <span className="hidden sm:inline">Đổi đề</span>
                    </button>
                </div>
                {challenge.hint && (
                    <p className="text-orange-600/80 text-xs mt-1 truncate">
                        💡 {challenge.hint}
                    </p>
                )}
            </div>

            {/* Circuit canvas */}
            <div className="flex-1 min-h-0">
                <CircuitCanvas
                    key={challengeKey}
                    onChange={handleCircuitChange}
                    onCircuitStatusChange={handleCircuitStatusChange}
                />
            </div>

            {/* Bottom controls - z-10 to stay above canvas */}
            <div className="relative z-10 flex items-center justify-between mt-4 pt-4 border-t border-white/10 bg-gradient-to-t from-slate-900">
                <div className="flex items-center gap-4">
                    <div className="text-white/50 text-sm">
                        Đã hoàn thành: <span className="text-white font-semibold">{completedCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                        <Star size={16} className="fill-yellow-400" />
                        <span className="font-semibold">{totalStars}</span>
                    </div>
                </div>

                <button
                    onClick={handleCheck}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-semibold transition-all"
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
                        <p className="text-white/70 mb-4">
                            {isCorrect
                                ? wasAlreadyCompleted
                                    ? 'Bạn đã làm bài này rồi nên không nhận thêm sao.'
                                    : `Bạn đã hoàn thành nhiệm vụ và nhận được ${challenge.difficulty} sao!`
                                : circuitStatus.isPowered
                                    ? 'Mạch đang chạy nhưng chưa đủ linh kiện yêu cầu.'
                                    : 'Hãy bấm "Bật nguồn" để kiểm tra mạch hoạt động.'
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
