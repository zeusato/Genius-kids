import React, { useMemo } from 'react';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { useStudent } from '@/src/contexts/StudentContext';

interface KidCoderLevelSelectProps {
    onSelectLevel: (level: number, lesson: number) => void;
    onExit: () => void;
}

import { CURRICULUM } from '@/services/kidCoderGenerator';

export const KidCoderLevelSelect: React.FC<KidCoderLevelSelectProps> = ({ onSelectLevel, onExit }) => {
    const { currentStudent } = useStudent();

    const progress = useMemo(() => {
        if (!currentStudent?.gameHistory) return new Set<string>();

        const kidCoderGames = currentStudent.gameHistory.filter(g => g.gameType === 'kidcoder');
        const completed = new Set<string>();
        kidCoderGames.forEach(game => {
            if (game.difficulty) {
                // difficulty format is "levelId-lessonId"
                completed.add(game.difficulty);
            }
        });

        console.log('KidCoder Progress:', Array.from(completed)); // Debug
        return completed;
    }, [currentStudent]);

    // Check if a level-lesson is unlocked
    const isUnlocked = (levelId: number, lessonId: number): boolean => {
        const key = `${levelId}-${lessonId}`;

        // If already completed, always unlocked
        if (progress.has(key)) return true;

        // Level 1, Lesson 1 is ALWAYS unlocked (entry point)
        if (levelId === 1 && lessonId === 1) return true;

        // Check if previous lesson is completed
        if (lessonId > 1) {
            // Previous lesson in same level
            const prevKey = `${levelId}-${lessonId - 1}`;
            const unlocked = progress.has(prevKey);
            if (!unlocked) console.log(`${key} locked - need ${prevKey}`); // Debug
            return unlocked;
        } else {
            // First lesson of a new level - need to complete last lesson of previous level
            const prevLevel = CURRICULUM.find(c => c.id === levelId - 1);
            if (!prevLevel) return false;
            const prevKey = `${levelId - 1}-${prevLevel.lessons}`;
            const unlocked = progress.has(prevKey);
            if (!unlocked) console.log(`${key} locked - need ${prevKey}`); // Debug
            return unlocked;
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onExit}
                        className="p-3 bg-slate-800 rounded-xl text-white hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Lập Trình Nhí</h1>
                        <p className="text-slate-400">Chọn cấp độ để bắt đầu</p>
                    </div>
                </div>

                {/* Levels Grid */}
                <div className="grid gap-8">
                    {CURRICULUM.map((level) => (
                        <div key={level.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-xl ${level.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                                    {level.id}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{level.title}</h2>
                                    <p className="text-slate-400 text-sm">{level.description}</p>
                                </div>
                            </div>

                            {level.lessons > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {Array.from({ length: level.lessons }, (_, i) => i + 1).map((lesson) => {
                                        const unlocked = isUnlocked(level.id, lesson);
                                        const completed = progress.has(`${level.id}-${lesson}`);

                                        return (
                                            <button
                                                key={lesson}
                                                onClick={() => unlocked && onSelectLevel(level.id, lesson)}
                                                disabled={!unlocked}
                                                className={`
                                                    relative aspect-square rounded-xl flex flex-col items-center justify-center gap-2 transition-all
                                                    ${unlocked
                                                        ? 'bg-slate-700 hover:bg-slate-600 cursor-pointer border-2 border-transparent hover:border-cyan-400'
                                                        : 'bg-slate-900/50 cursor-not-allowed opacity-50'}
                                                    ${completed ? 'border-green-500/50' : ''}
                                                `}
                                            >
                                                {completed && (
                                                    <div className="absolute top-2 right-2 text-green-500">
                                                        <CheckCircle size={16} />
                                                    </div>
                                                )}

                                                {!unlocked && (
                                                    <div className="absolute top-2 left-2">
                                                        <Lock className="text-slate-500" size={18} />
                                                    </div>
                                                )}

                                                <span className={`text-2xl font-bold ${unlocked ? 'text-white' : 'text-slate-600'}`}>
                                                    {lesson}
                                                </span>
                                                <span className="text-xs text-slate-500 uppercase font-bold">Bài</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-slate-500 italic bg-slate-900/30 p-4 rounded-xl text-center">
                                    Đang phát triển...
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
