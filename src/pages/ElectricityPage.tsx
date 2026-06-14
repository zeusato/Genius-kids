import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Gamepad2, Zap, Check, Star } from 'lucide-react';
import { MusicControls } from '@/src/components/MusicControls';
import { LESSONS, CircuitData, CircuitComponentData } from '@/src/data/electricityData';
import { PlaygroundView } from '@/src/components/electricity/PlaygroundView';
import { CircuitCanvas } from '@/src/components/electricity/CircuitCanvas';
import { CircuitStatus, POWERED_OFF_STATUS } from '@/src/components/electricity/circuitEngine';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';

type Mode = 'menu' | 'lessons' | 'lesson-detail' | 'playground' | 'sandbox';

const LESSON_PROGRESS_KEY = 'electricity_completed_lessons';

// What it takes to "pass" each lesson's exercise.
const lessonGoal = (lessonId: number, status: CircuitStatus, quizAnswer: string | null, correctAnswer?: string): boolean => {
    switch (lessonId) {
        case 1:
        case 8:
            return !!quizAnswer && quizAnswer === correctAnswer;
        case 6: // series of 2 bulbs
            return status.loadConnection === 'series';
        case 7: // parallel of 2 bulbs
            return status.loadConnection === 'parallel';
        default: // 2,3,4,5 — just get a load lit on a real closed loop
            return status.isComplete && status.hasClosedLoop;
    }
};

// Lesson-specific nudge when the goal isn't met yet.
const buildHint = (lessonId: number, status: CircuitStatus): string => {
    if (lessonId === 6) {
        if (status.loadConnection === 'parallel') return 'Hai đèn đang mắc song song — hãy mắc NỐI TIẾP (nối thành một hàng).';
        return 'Hãy nối 2 đèn NỐI TIẾP thành một vòng kín rồi bật nguồn.';
    }
    if (lessonId === 7) {
        if (status.loadConnection === 'series') return 'Hai đèn đang mắc nối tiếp — hãy mắc SONG SONG (mỗi đèn một nhánh riêng).';
        return 'Hãy nối 2 đèn SONG SONG, mỗi đèn một nhánh nối với pin.';
    }
    if (!status.hasClosedLoop) return 'Hãy nối mạch thành vòng kín: từ (+) qua thiết bị rồi về (−).';
    if (status.hasShortCircuit && !status.isComplete) return 'Mạch đang bị đoản mạch — hãy cho dòng điện đi qua đèn.';
    if (!status.isComplete) return 'Mạch kín rồi — bấm "Bật nguồn" để đèn sáng.';
    return 'Hãy hoàn thiện mạch theo yêu cầu của bài.';
};

// Helper to create initial circuits for each lesson exercise
const getLessonInitialCircuit = (lessonId: number): CircuitData => {
    const circuits: Record<number, CircuitData> = {
        // Lesson 2: Mạch hở - cần nối thêm dây
        2: {
            components: [
                { id: 'bat1', type: 'battery', x: 80, y: 180, state: 'on', isActive: false },
                { id: 'bulb1', type: 'bulb', x: 300, y: 80, state: 'on', isActive: false },
            ],
            wires: [
                // Chỉ có 1 dây, còn thiếu 1 dây để tạo mạch kín
                { id: 'w1', fromId: 'bat1', fromPort: 'output', toId: 'bulb1', toPort: 'input' },
            ]
        },
        // Lesson 3: Pin - battery positioned
        3: {
            components: [
                { id: 'bat1', type: 'battery', x: 100, y: 150, state: 'on', isActive: false },
                { id: 'bulb1', type: 'bulb', x: 300, y: 150, state: 'on', isActive: false },
            ],
            wires: []
        },
        // Lesson 4: Công tắc - switch exercise
        4: {
            components: [
                { id: 'bat1', type: 'battery', x: 80, y: 180, state: 'on', isActive: false },
                { id: 'bulb1', type: 'bulb', x: 320, y: 80, state: 'on', isActive: false },
                { id: 'sw1', type: 'switch', x: 200, y: 180, state: 'off', isActive: false },
            ],
            wires: []
        },
        // Lesson 5: Mạch đơn giản hoàn chỉnh
        5: {
            components: [
                { id: 'bat1', type: 'battery', x: 100, y: 200, state: 'on', isActive: false },
                { id: 'bulb1', type: 'bulb', x: 300, y: 100, state: 'on', isActive: false },
            ],
            wires: []
        },
        // Lesson 6: Mạch nối tiếp - 2 bulbs
        6: {
            components: [
                { id: 'bat1', type: 'battery', x: 80, y: 200, state: 'on', isActive: false },
                { id: 'bulb1', type: 'bulb', x: 220, y: 80, state: 'on', isActive: false },
                { id: 'bulb2', type: 'bulb', x: 360, y: 80, state: 'on', isActive: false },
                { id: 'sw1', type: 'switch', x: 220, y: 200, state: 'off', isActive: false },
            ],
            wires: []
        },
        // Lesson 7: Mạch song song - 2 bulbs
        7: {
            components: [
                { id: 'bat1', type: 'battery', x: 100, y: 200, state: 'on', isActive: false },
                { id: 'bulb1', type: 'bulb', x: 280, y: 80, state: 'on', isActive: false },
                { id: 'bulb2', type: 'bulb', x: 400, y: 80, state: 'on', isActive: false },
            ],
            wires: []
        },
    };
    return circuits[lessonId] || { components: [], wires: [] };
};

// Quiz data for each lesson (only lessons 1 & 8 are quizzes)
interface QuizOption {
    id: string;
    text: string;
    explanation: string;
}

const quizData: Record<number, QuizOption[]> = {
    1: [
        { id: 'electron-movement', text: 'A. Electron di chuyển trong dây dẫn', explanation: 'Chính xác! Dòng điện là dòng các electron di chuyển trong dây dẫn.' },
        { id: 'light-creation', text: 'B. Pin tạo ra ánh sáng', explanation: 'Chưa đúng. Pin tạo ra năng lượng để đẩy electron, còn ánh sáng là do đèn phát ra.' },
        { id: 'wire-electricity', text: 'C. Dây dẫn tự phát điện', explanation: 'Chưa đúng. Dây dẫn chỉ là đường đi cho electron, không tự tạo ra điện.' },
    ],
    8: [
        { id: 'series', text: 'A. Mạch nối tiếp - tất cả đèn tắt cùng nhau', explanation: 'Chưa đúng. Nối tiếp thì 1 đèn hỏng là cả dãy tắt — không an toàn cho đèn trong nhà.' },
        { id: 'parallel', text: 'B. Mạch song song - các đèn hoạt động độc lập', explanation: 'Chính xác! Song song giúp 1 đèn hỏng mà các đèn khác vẫn sáng.' },
        { id: 'no-difference', text: 'C. Không có sự khác biệt', explanation: 'Chưa đúng. Hai loại mạch khác nhau rõ rệt khi một đèn bị hỏng.' },
    ],
};

// QuizOptions component
interface QuizOptionsProps {
    lessonId: number;
    correctAnswer: string;
    selectedAnswer: string | null;
    onSelectAnswer: (answer: string) => void;
}

const QuizOptions: React.FC<QuizOptionsProps> = ({
    lessonId,
    correctAnswer,
    selectedAnswer,
    onSelectAnswer,
}) => {
    const options = quizData[lessonId] || [];
    const selectedOption = options.find(o => o.id === selectedAnswer);
    const selectedIsCorrect = selectedAnswer === correctAnswer;

    return (
        <div className="space-y-2">
            {options.map(option => {
                const isSelected = selectedAnswer === option.id;
                const isCorrect = option.id === correctAnswer;
                const showCorrect = isSelected && isCorrect;

                return (
                    <button
                        key={option.id}
                        onClick={() => onSelectAnswer(option.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all border flex items-center justify-between ${showCorrect
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                            : isSelected && !isCorrect
                                ? 'bg-red-100 border-red-300 text-red-800'
                                : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-800'
                            }`}
                    >
                        <span>{option.text}</span>
                        {showCorrect && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                <Check size={16} className="text-white" />
                            </div>
                        )}
                    </button>
                );
            })}

            {/* Explanation for the picked answer */}
            {selectedOption && (
                <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${selectedIsCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-amber-50 border-amber-300 text-amber-800'
                    }`}>
                    <span className="text-base leading-none">{selectedIsCorrect ? '✅' : '💡'}</span>
                    <span>{selectedOption.explanation}</span>
                </div>
            )}
        </div>
    );
};

export const ElectricityPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { updateStudent } = useStudentActions();
    const [mode, setMode] = useState<Mode>('menu');
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
    const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
    const [circuitStatus, setCircuitStatus] = useState<CircuitStatus>(POWERED_OFF_STATUS);
    const [completedLessons, setCompletedLessons] = useState<Set<number>>(() => {
        try {
            const raw = localStorage.getItem(LESSON_PROGRESS_KEY);
            return new Set<number>(raw ? JSON.parse(raw) : []);
        } catch {
            return new Set();
        }
    });

    const selectedLesson = LESSONS.find(l => l.id === selectedLessonId);

    // Scroll to top when entering the page
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleLessonComplete = (stars: number) => {
        if (!currentStudent || stars <= 0) return;

        // Add stars to student profile
        updateStudent({
            ...currentStudent,
            stars: currentStudent.stars + stars
        });
    };

    const markLessonComplete = (lessonId: number) => {
        if (completedLessons.has(lessonId)) return;
        const next = new Set(completedLessons).add(lessonId);
        setCompletedLessons(next);
        try {
            localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify([...next]));
        } catch { /* ignore quota errors */ }
        handleLessonComplete(1); // 1 star per lesson, once
    };

    // Award + record completion the moment the current lesson's goal is met.
    const lessonPassed = selectedLesson
        ? lessonGoal(selectedLesson.id, circuitStatus, quizAnswer,
            selectedLesson.exercise.type === 'quiz' ? (selectedLesson.exercise.correctAnswer as string) : undefined)
        : false;

    useEffect(() => {
        if (mode === 'lesson-detail' && selectedLesson && lessonPassed) {
            markLessonComplete(selectedLesson.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonPassed, mode, selectedLessonId]);

    const renderMenu = () => (
        <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-12">
                <div className="text-7xl mb-4 animate-bounce">⚡</div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400">
                    Điện & Mạch điện
                </h1>
                <p className="text-orange-700 mt-2 text-lg">
                    Học cách lắp ráp mạch điện qua thí nghiệm tương tác 🔌
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Lessons */}
                <button
                    onClick={() => setMode('lessons')}
                    className="group p-6 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl border-2 border-sky-300 hover:border-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-xl text-center"
                >
                    <div className="w-16 h-16 mx-auto bg-white/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <BookOpen size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">📚 Học theo bài</h3>
                    <p className="text-white/90 text-sm">
                        8 bài học từ cơ bản đến nâng cao với lý thuyết và bài tập
                    </p>
                </button>

                {/* Playground */}
                <button
                    onClick={() => setMode('playground')}
                    className="group p-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl border-2 border-emerald-300 hover:border-white shadow-lg shadow-green-500/30 transition-all hover:scale-105 hover:shadow-xl text-center"
                >
                    <div className="w-16 h-16 mx-auto bg-white/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Gamepad2 size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">🎮 Thử thách</h3>
                    <p className="text-white/90 text-sm">
                        Hoàn thành các nhiệm vụ lắp mạch và nhận sao thưởng ⭐
                    </p>
                </button>

                {/* Sandbox */}
                <button
                    onClick={() => setMode('sandbox')}
                    className="group p-6 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl border-2 border-violet-300 hover:border-white shadow-lg shadow-purple-500/30 transition-all hover:scale-105 hover:shadow-xl text-center"
                >
                    <div className="w-16 h-16 mx-auto bg-white/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Zap size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">🧪 Tự do</h3>
                    <p className="text-white/90 text-sm">
                        Thoải mái thí nghiệm và sáng tạo mạch điện của riêng bạn 💡
                    </p>
                </button>
            </div>
        </div>
    );

    const renderLessons = () => (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <h2 className="text-2xl font-bold text-orange-800">📚 Danh sách bài học</h2>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 text-sm font-semibold">
                    Đã học {completedLessons.size}/{LESSONS.length} bài
                </span>
            </div>

            <div className="space-y-3">
                {LESSONS.map(lesson => {
                    const done = completedLessons.has(lesson.id);
                    return (
                        <button
                            key={lesson.id}
                            onClick={() => {
                                setSelectedLessonId(lesson.id);
                                setQuizAnswer(null);
                                setCircuitStatus(POWERED_OFF_STATUS);
                                setMode('lesson-detail');
                            }}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 shadow-sm hover:shadow-md transition-all text-left ${done
                                ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-400'
                                : 'bg-white border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                                }`}
                        >
                            <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 ${done ? 'bg-gradient-to-br from-emerald-400 to-green-500' : 'bg-gradient-to-br from-orange-400 to-amber-500'
                                }`}>
                                {lesson.id}
                                {done && (
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                                        <Check size={11} className="text-white" />
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-orange-900 font-semibold">{lesson.title}</h3>
                                <p className="text-orange-600/70 text-sm">{lesson.subtitle}</p>
                            </div>
                            <ArrowLeft size={20} className="text-orange-400 rotate-180 shrink-0" />
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderLessonDetail = () => {
        if (!selectedLesson) return null;

        return (
            <div className="max-w-4xl mx-auto py-8">
                <div className="space-y-6">
                    {/* Title */}
                    <div className="text-center bg-white rounded-2xl p-6 shadow-md border-2 border-orange-200">
                        <span className="text-orange-500 text-sm font-semibold">📖 Bài {selectedLesson.id}</span>
                        <h2 className="text-3xl font-bold text-orange-800 mt-1">{selectedLesson.title}</h2>
                        <p className="text-orange-600/80">{selectedLesson.subtitle}</p>
                    </div>

                    {/* Theory */}
                    <div className="bg-white rounded-xl p-6 border-2 border-sky-200 shadow-md">
                        <h3 className="text-lg font-semibold text-sky-600 mb-3">📖 Lý thuyết</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            {selectedLesson.theory.content}
                        </p>
                        <div className="space-y-2">
                            {selectedLesson.theory.keyPoints.map((point, i) => (
                                <div key={i} className="flex items-start gap-2 text-gray-600">
                                    <span className="text-sky-500">•</span>
                                    {point}
                                </div>
                            ))}
                        </div>

                        {selectedLesson.theory.funFact && (
                            <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200">
                                <span className="text-lg leading-none">💡</span>
                                <div>
                                    <p className="text-violet-700 font-semibold text-sm">Em có biết?</p>
                                    <p className="text-violet-900/80 text-sm">{selectedLesson.theory.funFact}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Exercise */}
                    <div className="bg-white rounded-xl p-6 border-2 border-emerald-200 shadow-md">
                        <h3 className="text-lg font-semibold text-emerald-600 mb-3">✏️ Bài tập</h3>
                        <p className="text-gray-700 mb-4">{selectedLesson.exercise.instruction}</p>


                        {(selectedLesson.exercise.type === 'build' || selectedLesson.exercise.type === 'fix') && (
                            <div className="space-y-3">
                                <div className="h-[350px] bg-gradient-to-br from-sky-50 to-blue-100 rounded-xl border border-sky-200 overflow-hidden">
                                    <CircuitCanvas
                                        key={selectedLesson.id}
                                        initialCircuit={getLessonInitialCircuit(selectedLesson.id)}
                                        hideToolbar={true}
                                        onCircuitStatusChange={setCircuitStatus}
                                    />
                                </div>
                                {/* Auto-validate result */}
                                {lessonPassed ? (
                                    <div className="flex items-center gap-3 p-4 bg-emerald-100 border-2 border-emerald-400 rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                            <Check size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-emerald-800">🎉 Tuyệt vời! Hoàn thành bài tập!</p>
                                            <p className="text-emerald-600 text-sm">Bạn nhận được 1 ⭐ cho bài học này.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
                                        <div className="text-2xl shrink-0">💡</div>
                                        <div>
                                            <p className="font-medium text-amber-800">{buildHint(selectedLesson.id, circuitStatus)}</p>
                                            <p className="text-amber-600 text-sm">Nhấn vào đầu xanh (−) rồi đầu đỏ (+) để nối dây, sau đó bấm "Bật nguồn".</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedLesson.exercise.type === 'quiz' && (
                            <QuizOptions
                                lessonId={selectedLesson.id}
                                correctAnswer={selectedLesson.exercise.correctAnswer}
                                selectedAnswer={quizAnswer}
                                onSelectAnswer={setQuizAnswer}
                            />
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between pt-4">
                        <button
                            onClick={() => {
                                if (selectedLesson.id > 1) {
                                    setSelectedLessonId(selectedLesson.id - 1);
                                    setQuizAnswer(null);
                                    setCircuitStatus(POWERED_OFF_STATUS);
                                }
                            }}
                            disabled={selectedLesson.id === 1}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-gray-700 transition-colors"
                        >
                            ← Bài trước
                        </button>
                        <button
                            onClick={() => {
                                if (selectedLesson.id < LESSONS.length) {
                                    setSelectedLessonId(selectedLesson.id + 1);
                                    setQuizAnswer(null);
                                    setCircuitStatus(POWERED_OFF_STATUS);
                                }
                            }}
                            disabled={selectedLesson.id === LESSONS.length}
                            className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-semibold shadow-md transition-colors"
                        >
                            Bài tiếp →
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPlayground = () => (
        <div className="h-[calc(100vh-120px)]">
            <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-lg h-full overflow-hidden">
                <PlaygroundView onComplete={handleLessonComplete} />
            </div>
        </div>
    );

    const renderSandbox = () => (
        <div className="h-[calc(100vh-120px)]">
            <div className="text-center text-orange-700 mb-2 font-medium text-lg">
                🧪 Chế độ tự do - Thỏa sức sáng tạo! 💡
            </div>
            <div className="h-[calc(100%-40px)] bg-white rounded-2xl border-2 border-purple-200 shadow-lg overflow-hidden">
                <CircuitCanvas />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 px-4 py-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => mode === 'menu' ? navigate('/science') : setMode('menu')}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-white shadow-md transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline">
                        {mode === 'menu' ? 'Khoa học' : 'Menu'}
                    </span>
                </button>

                <h1 className="text-xl font-bold text-orange-800 flex items-center gap-2">
                    ⚡ Điện & Mạch điện
                </h1>

                <MusicControls />
            </div>

            {/* Content */}
            {mode === 'menu' && renderMenu()}
            {mode === 'lessons' && renderLessons()}
            {mode === 'lesson-detail' && renderLessonDetail()}
            {mode === 'playground' && renderPlayground()}
            {mode === 'sandbox' && renderSandbox()}
        </div>
    );
};
