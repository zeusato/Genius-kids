import React, { useState } from 'react';
import { Brain, ArrowLeft, Music, Timer } from 'lucide-react';
import { Difficulty } from './memoryMatchEngine';
import { MemoryMatchGame } from './MemoryMatch/MemoryMatchGame';
import { SoundMemoryGame } from './SoundMemory/SoundMemoryGame';
import { SpeedMathGame } from './SpeedMath/SpeedMathGame';

interface GamesMenuProps {
    onBack: () => void;
}

export const GamesMenu: React.FC<GamesMenuProps> = ({ onBack }) => {
    const [activeGame, setActiveGame] = useState<'memory' | 'sound-memory' | 'speed-math' | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Easy);

    if (activeGame === 'memory') {
        return (
            <MemoryMatchGame
                difficulty={difficulty}
                onExit={() => setActiveGame(null)}
                onComplete={(score, time, moves) => {
                    console.log('Game completed:', { score, time, moves });
                    setActiveGame(null);
                }}
            />
        );
    }

    const getSoundDifficulty = (diff: Difficulty): 'easy' | 'medium' | 'hard' => {
        switch (diff) {
            case Difficulty.Easy: return 'easy';
            case Difficulty.Medium: return 'medium';
            case Difficulty.Hard: return 'hard';
            default: return 'easy';
        }
    };

    if (activeGame === 'sound-memory') {
        return (
            <SoundMemoryGame
                difficulty={getSoundDifficulty(difficulty)}
                onExit={() => setActiveGame(null)}
                onComplete={(score) => {
                    console.log('Sound Game completed:', score);
                    setActiveGame(null);
                }}
            />
        );
    }

    if (activeGame === 'speed-math') {
        return (
            <SpeedMathGame
                difficulty={getSoundDifficulty(difficulty)}
                onBack={() => setActiveGame(null)}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 rounded-xl transition-colors font-semibold text-slate-700 shadow-md"
                    >
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>

                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        Games
                    </h1>

                    <div className="w-24" /> {/* Spacer */}
                </div>

                {/* Difficulty Selector */}
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Chọn độ khó:</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => setDifficulty(Difficulty.Easy)}
                            className={`px-6 py-4 rounded-xl font-bold transition-all ${difficulty === Difficulty.Easy
                                ? 'bg-green-500 text-white shadow-lg scale-105'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            <div className="text-2xl mb-1">😊</div>
                            <div>Dễ</div>
                            <div className="text-sm opacity-75">Cơ bản</div>
                        </button>

                        <button
                            onClick={() => setDifficulty(Difficulty.Medium)}
                            className={`px-6 py-4 rounded-xl font-bold transition-all ${difficulty === Difficulty.Medium
                                ? 'bg-yellow-500 text-white shadow-lg scale-105'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            <div className="text-2xl mb-1">😎</div>
                            <div>Trung bình</div>
                            <div className="text-sm opacity-75">Nâng cao</div>
                        </button>

                        <button
                            onClick={() => setDifficulty(Difficulty.Hard)}
                            className={`px-6 py-4 rounded-xl font-bold transition-all ${difficulty === Difficulty.Hard
                                ? 'bg-red-500 text-white shadow-lg scale-105'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            <div className="text-2xl mb-1">🔥</div>
                            <div>Khó</div>
                            <div className="text-sm opacity-75">Thử thách</div>
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Memory Match Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                                <Brain size={64} className="text-white" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-slate-800 mb-3">
                                    Ghép Thẻ Hình Ảnh
                                </h3>
                                <p className="text-slate-600 text-lg mb-6">
                                    Lật thẻ tìm cặp hình ảnh hoặc biểu tượng giống nhau. Rèn luyện trí nhớ và sự tinh mắt!
                                </p>

                                <button
                                    onClick={() => setActiveGame('memory')}
                                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    🎮 Chơi ngay!
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sound Memory Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-lg transform hover:-rotate-6 transition-transform">
                                <Music size={64} className="text-white" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-slate-800 mb-3">
                                    Giai Điệu Vui Nhộn
                                </h3>
                                <p className="text-slate-600 text-lg mb-6">
                                    Lắng nghe và ghi nhớ chuỗi âm thanh. Thử thách trí nhớ thính giác của bạn!
                                </p>

                                <button
                                    onClick={() => setActiveGame('sound-memory')}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    🎵 Chơi ngay!
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Speed Math Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                                <Timer size={64} className="text-white" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-slate-800 mb-3">
                                    Đua Tốc Độ
                                </h3>
                                <p className="text-slate-600 text-lg mb-6">
                                    Trả lời nhanh các câu hỏi Toán, Tiếng Việt và Tự nhiên xã hội trước khi hết giờ!
                                </p>

                                <button
                                    onClick={() => setActiveGame('speed-math')}
                                    className="px-8 py-4 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    🏎️ Chơi ngay!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coming Soon */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Mê Cung Số'].map((game, idx) => (
                        <div key={idx} className="bg-white/50 rounded-2xl p-6 text-center opacity-50">
                            <div className="text-4xl mb-2">🔒</div>
                            <div className="font-bold text-slate-700">{game}</div>
                            <div className="text-sm text-slate-500">Sắp ra mắt</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
