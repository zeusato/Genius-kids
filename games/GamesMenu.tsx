import React, { useState } from 'react';
import { Brain, ArrowLeft, Music, Timer, Car, Grid3x3, Settings } from 'lucide-react';
import { Difficulty } from './memoryMatchEngine';
import { MemoryMatchGame } from './MemoryMatch/MemoryMatchGame';
import { SoundMemoryGame } from './SoundMemory/SoundMemoryGame';
import { SpeedMathGame } from './SpeedMath/SpeedMathGame';
import { DragonQuestGame } from './DragonQuest/DragonQuestGame';
import { MathRacingGame } from './MathRacing/MathRacingGame';
import { SudokuGame } from './Sudoku/SudokuGame';
import GearsGamePage from '@/src/pages/games/GearsGame/GearsGamePage';
import GuessDirectionGame from '@/src/pages/games/GearsGame/GuessDirectionGame';
import { MusicControls } from '@/src/components/MusicControls';
import { Grade } from '@/types';
import { isPreschool } from '@/src/utils/grade';
import CarIcon from './MathRacing/CarIcon.png';

interface GamesMenuProps {
    grade?: Grade;
    onBack: () => void;
    onGameComplete: (gameId: string, score: number, maxScore: number, medal: 'bronze' | 'silver' | 'gold' | null) => void;
}

export const GamesMenu: React.FC<GamesMenuProps> = ({ grade, onBack, onGameComplete }) => {
    const preschool = isPreschool(grade);
    const [activeGame, setActiveGame] = useState<'memory' | 'sound-memory' | 'speed-math' | 'dragon-quest' | 'math-racing' | 'sudoku' | 'gears-build' | 'gears-guess' | 'gears-menu' | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Easy);

    if (activeGame === 'memory') {
        return (
            <MemoryMatchGame
                difficulty={difficulty}
                onExit={() => setActiveGame(null)}
                onComplete={(score, maxScore, medal) => {
                    onGameComplete('memory', score, maxScore, medal);
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
                onComplete={(score, maxScore, medal) => {
                    onGameComplete('sound-memory', score, maxScore, medal);
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
                onComplete={(score: number, maxScore: number, medal: 'bronze' | 'silver' | 'gold' | null) => {
                    onGameComplete('speed-math', score, maxScore, medal);
                    setActiveGame(null);
                }}
            />
        );
    }

    if (activeGame === 'dragon-quest') {
        return (
            <DragonQuestGame
                difficulty={getSoundDifficulty(difficulty)}
                onBack={() => setActiveGame(null)}
                onComplete={(score: number, maxScore: number, medal: 'bronze' | 'silver' | 'gold' | null) => {
                    onGameComplete('dragon-quest', score, maxScore, medal);
                    setActiveGame(null);
                }}
            />
        );
    }

    if (activeGame === 'math-racing') {
        return (
            <MathRacingGame
                difficulty={getSoundDifficulty(difficulty)}
                onExit={() => setActiveGame(null)}
            />
        );
    }

    if (activeGame === 'sudoku') {
        return (
            <SudokuGame
                onExit={() => setActiveGame(null)}
            />
        );
    }

    // Gears Game - Mode Selection Menu
    if (activeGame === 'gears-menu') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <button
                    onClick={() => setActiveGame(null)}
                    className="absolute top-4 left-4 z-50 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white"
                >
                    <ArrowLeft size={24} className="text-gray-800" />
                </button>

                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Kỹ Sư Máy Móc</h1>
                    <p className="text-gray-400 mb-8">Chọn chế độ chơi</p>

                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveGame('gears-build')}
                            className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-lg hover:scale-105 transition-transform"
                        >
                            <Settings size={48} className="mx-auto mb-3" />
                            <div className="text-xl font-bold">Lắp Bánh Răng</div>
                            <p className="text-sm opacity-80 mt-1">Kết nối Nguồn → Đích</p>
                        </button>

                        <button
                            onClick={() => setActiveGame('gears-guess')}
                            className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white px-8 py-6 rounded-2xl shadow-lg hover:scale-105 transition-transform"
                        >
                            <Brain size={48} className="mx-auto mb-3" />
                            <div className="text-xl font-bold">Đoán Chiều Quay</div>
                            <p className="text-sm opacity-80 mt-1">Dự đoán hướng chuyển động</p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Gears Game - Build Mode
    if (activeGame === 'gears-build') {
        const gearDifficulty = difficulty === Difficulty.Easy ? 'easy' : difficulty === Difficulty.Medium ? 'medium' : 'hard';
        return <GearsGamePage difficulty={gearDifficulty} onBack={() => setActiveGame('gears-menu')} />;
    }

    // Gears Game - Guess Direction Mode
    if (activeGame === 'gears-guess') {
        const gearDifficulty = difficulty === Difficulty.Easy ? 'easy' : difficulty === Difficulty.Medium ? 'medium' : 'hard';
        return <GuessDirectionGame difficulty={gearDifficulty} onBack={() => setActiveGame('gears-menu')} />;
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

                    <MusicControls />
                </div>

                {/* Difficulty Selector */}
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Chọn độ khó:</h2>
                    <div className={`grid gap-4 ${preschool ? 'grid-cols-2' : 'grid-cols-3'}`}>
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

                        {!preschool && (
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
                        )}
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

                    {!preschool && (<>
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

                    {/* Dragon Quest Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow mt-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                                <span className="text-6xl">🐉</span>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-slate-800 mb-3">
                                    Đại Chiến Rồng Thần
                                </h3>
                                <p className="text-slate-600 text-lg mb-6">
                                    Phiêu lưu trên bản đồ, thu thập buff và đánh bại rồng thần!
                                </p>

                                <button
                                    onClick={() => setActiveGame('dragon-quest')}
                                    className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    🐉 Chơi ngay!
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Math Racing Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform overflow-hidden p-4">
                                <img src={CarIcon} alt="Math Racing" className="w-full h-full object-contain" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-slate-800 mb-3">
                                    Đường Đua Thần Tốc
                                </h3>
                                <p className="text-slate-600 text-lg mb-6">
                                    Lái xe tránh chướng ngại vật và chọn đáp án đúng. Rèn luyện phản xạ và tính nhẩm nhanh!
                                </p>

                                <button
                                    onClick={() => setActiveGame('math-racing')}
                                    className="px-8 py-4 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    🏎️ Chơi ngay!
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sudoku Card (New) */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-[#8b4513] to-[#d2b48c] rounded-3xl flex items-center justify-center shadow-lg transform hover:-rotate-6 transition-transform">
                                <Grid3x3 size={64} className="text-white" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-slate-800 mb-3">
                                    Sudoku Logic
                                </h3>
                                <p className="text-slate-600 text-lg mb-6">
                                    Điền số vào ô trống sao cho mỗi hàng, cột và ô vuông 3x3 đều chứa đủ các số từ 1 đến 9.
                                </p>

                                <button
                                    onClick={() => setActiveGame('sudoku')}
                                    className="px-8 py-4 bg-gradient-to-r from-[#8b4513] to-[#d2b48c] text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    🧩 Chơi ngay!
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Gears Game Card (New) */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-gray-700 to-gray-900 rounded-3xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                                <Settings size={64} className="text-white animate-spin-slow" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-slate-800 mb-3">
                                    Kỹ Sư Máy Móc
                                </h3>
                                <p className="text-slate-600 text-lg mb-6">
                                    Lắp ráp bánh răng, dây đai để vận hành cỗ máy. Trở thành kỹ sư tài ba!
                                </p>

                                <button
                                    onClick={() => setActiveGame('gears-menu')}
                                    className="px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    ⚙️ Chơi ngay!
                                </button>
                            </div>
                        </div>
                    </div>
                    </>)}
                </div>
            </div>
        </div>
    );
};
