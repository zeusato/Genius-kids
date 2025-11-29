import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RotateCcw, Lightbulb, Eraser, Pencil, Trophy, Timer, Star, Heart, X } from 'lucide-react';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { playSound } from '@/utils/sound';
import { processGameReward } from '@/services/rewardService';
import { GachaModal } from '../../src/components/GachaModal';
import { generateSudoku, Difficulty } from '@/services/sudokuGenerator';
import { AlbumImage } from '@/types';

interface SudokuGameProps {
    onExit: () => void;
}

type CellValue = number | 0;

interface Cell {
    value: CellValue;
    isInitial: boolean;
    notes: number[];
    isError: boolean; // Now represents "Conflict" (duplicate in row/col/box)
}

export const SudokuGame: React.FC<SudokuGameProps> = ({ onExit }) => {
    const { currentStudent } = useStudent();
    const { addGameResult, updateStudent } = useStudentActions();

    // Game State
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [solution, setSolution] = useState<number[][]>([]);
    const [selectedCell, setSelectedCell] = useState<{ r: number, c: number } | null>(null);
    const [isNoteMode, setIsNoteMode] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [gameState, setGameState] = useState<'menu' | 'playing' | 'won'>('menu');

    // Rewards
    const [earnedStars, setEarnedStars] = useState(0);
    const [gachaReward, setGachaReward] = useState<{ image: AlbumImage, isNew: boolean } | null>(null);
    const [showGacha, setShowGacha] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Game Logic ---

    const startGame = (diff: Difficulty) => {
        const { initialGrid, solvedGrid } = generateSudoku(diff);

        const newGrid: Cell[][] = initialGrid.map(row =>
            row.map(val => ({
                value: val,
                isInitial: val !== 0,
                notes: [],
                isError: false
            }))
        );

        setGrid(newGrid);
        setSolution(solvedGrid);
        setDifficulty(diff);
        setTimer(0);
        setGameState('playing');
        setIsPaused(false);
        setSelectedCell(null);
        setEarnedStars(0);
        setGachaReward(null);
        setShowGacha(false);
    };

    useEffect(() => {
        if (gameState === 'playing' && !isPaused) {
            timerRef.current = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState, isPaused]);

    const handleCellClick = (r: number, c: number) => {
        if (gameState !== 'playing') return;
        setSelectedCell({ r, c });
        playSound('click');
    };

    // Helper to check conflicts
    const updateConflicts = (currentGrid: Cell[][]) => {
        // Create a deep copy to avoid mutating state directly during calculation
        const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell, isError: false })));

        // Check Rows & Cols
        for (let i = 0; i < 9; i++) {
            const rowMap = new Map<number, number[]>();
            const colMap = new Map<number, number[]>();

            for (let j = 0; j < 9; j++) {
                // Row
                const rVal = newGrid[i][j].value;
                if (rVal !== 0) {
                    if (!rowMap.has(rVal)) rowMap.set(rVal, []);
                    rowMap.get(rVal)?.push(j);
                }

                // Col
                const cVal = newGrid[j][i].value;
                if (cVal !== 0) {
                    if (!colMap.has(cVal)) colMap.set(cVal, []);
                    colMap.get(cVal)?.push(j);
                }
            }

            // Mark conflicts
            rowMap.forEach(indices => {
                if (indices.length > 1) indices.forEach(colIdx => newGrid[i][colIdx].isError = true);
            });
            colMap.forEach(indices => {
                if (indices.length > 1) indices.forEach(rowIdx => newGrid[rowIdx][i].isError = true);
            });
        }

        // Check Boxes
        for (let br = 0; br < 3; br++) {
            for (let bc = 0; bc < 3; bc++) {
                const boxMap = new Map<number, { r: number, c: number }[]>();
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const r = br * 3 + i;
                        const c = bc * 3 + j;
                        const val = newGrid[r][c].value;
                        if (val !== 0) {
                            if (!boxMap.has(val)) boxMap.set(val, []);
                            boxMap.get(val)?.push({ r, c });
                        }
                    }
                }
                boxMap.forEach(cells => {
                    if (cells.length > 1) cells.forEach(pos => newGrid[pos.r][pos.c].isError = true);
                });
            }
        }

        return newGrid;
    };

    const handleNumberInput = (num: number) => {
        if (gameState !== 'playing' || !selectedCell) return;
        const { r, c } = selectedCell;
        const cell = grid[r][c];

        if (cell.isInitial) return;

        let newGrid = grid.map(row => row.map(c => ({ ...c })));
        const newCell = newGrid[r][c];

        if (isNoteMode) {
            // Toggle note
            if (newCell.notes.includes(num)) {
                newCell.notes = newCell.notes.filter(n => n !== num);
            } else {
                newCell.notes = [...newCell.notes, num];
            }
            setGrid(newGrid);
        } else {
            // Set value
            if (newCell.value === num) return; // No change

            newCell.value = num;
            newCell.notes = []; // Clear notes on set

            // Update conflicts
            newGrid = updateConflicts(newGrid);

            setGrid(newGrid);
            playSound('click');

            // Check Win (Full and No Conflicts)
            checkWin(newGrid);
        }
    };

    const handleErase = () => {
        if (gameState !== 'playing' || !selectedCell) return;
        const { r, c } = selectedCell;
        if (grid[r][c].isInitial) return;

        let newGrid = grid.map(row => row.map(c => ({ ...c })));
        newGrid[r][c] = { ...newGrid[r][c], value: 0, notes: [] };

        // Re-calculate conflicts as removing a number might resolve them
        newGrid = updateConflicts(newGrid);

        setGrid(newGrid);
        playSound('click');
    };

    const handleHint = () => {
        if (gameState !== 'playing' || !selectedCell) return;
        const { r, c } = selectedCell;
        if (grid[r][c].value !== 0 && !grid[r][c].isError) return; // Already filled and no conflict

        if (!currentStudent || currentStudent.stars < 5) {
            alert("Bạn cần 5 sao để dùng gợi ý!");
            return;
        }

        // Deduct stars
        updateStudent({ ...currentStudent, stars: currentStudent.stars - 5 });

        // Reveal
        let newGrid = grid.map(row => row.map(c => ({ ...c })));
        newGrid[r][c] = {
            ...newGrid[r][c],
            value: solution[r][c],
            isInitial: false, // Treated as filled
            notes: []
        };

        // Re-calc conflicts
        newGrid = updateConflicts(newGrid);

        setGrid(newGrid);
        playSound('ding');
        checkWin(newGrid);
    };

    const checkWin = (currentGrid: Cell[][]) => {
        // 1. Check if full
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (currentGrid[i][j].value === 0) return;
            }
        }

        // 2. Check if any conflicts
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (currentGrid[i][j].isError) return;
            }
        }

        // 3. Double check against solution (Safety net)
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (currentGrid[i][j].value !== solution[i][j]) return;
            }
        }

        handleGameOver();
    };

    const handleGameOver = () => {
        setGameState('won');
        playSound('complete');
        if (timerRef.current) clearInterval(timerRef.current);

        if (!currentStudent || !difficulty) return;

        // Calculate Stars
        let stars = 0;
        let timeLimit3 = 0;
        let timeLimit2 = 0;
        let gachaChance = 0;

        switch (difficulty) {
            case 'easy':
                timeLimit3 = 300; // 5m
                timeLimit2 = 480; // 8m
                gachaChance = 0.2;
                break;
            case 'medium':
                timeLimit3 = 600; // 10m
                timeLimit2 = 900; // 15m
                gachaChance = 0.3;
                break;
            case 'hard':
                timeLimit3 = 900; // 15m
                timeLimit2 = 1200; // 20m
                gachaChance = 0.5;
                break;
        }

        if (timer < timeLimit3) stars = 3;
        else if (timer < timeLimit2) stars = 2;
        else stars = 1;

        // Medal for internal logic (Gold = 3 stars here)
        const medal = stars === 3 ? 'gold' : stars === 2 ? 'silver' : 'bronze';

        // Process Reward
        const { reward } = processGameReward(currentStudent, medal, stars); // This adds base stars. 

        let finalStars = 0;
        if (difficulty === 'easy') finalStars = stars; // 1-3
        if (difficulty === 'medium') finalStars = stars === 3 ? 5 : stars === 2 ? 3 : 2;
        if (difficulty === 'hard') finalStars = stars === 3 ? 10 : stars === 2 ? 6 : 4;

        const newStars = currentStudent.stars + finalStars;
        let newOwnedImages = [...currentStudent.ownedImageIds];
        let rewardImage: AlbumImage | null = null;

        // Gacha Logic
        if (stars === 3 && Math.random() < gachaChance) {
            // Trigger Gacha
            const dummyReward = processGameReward(currentStudent, 'gold', 0); // Just to get image
            if (dummyReward.reward.image) {
                rewardImage = dummyReward.reward.image;
                if (!newOwnedImages.includes(rewardImage.id)) {
                    newOwnedImages.push(rewardImage.id);
                }
            }
        }

        updateStudent({
            ...currentStudent,
            stars: newStars,
            ownedImageIds: newOwnedImages
        });

        setEarnedStars(finalStars);
        if (rewardImage) {
            const isNew = !currentStudent.ownedImageIds.includes(rewardImage.id);
            setGachaReward({ image: rewardImage, isNew });
        }

        // Save Result
        addGameResult({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            gameType: 'sudoku',
            difficulty,
            score: (81 * 10) - timer, // Arbitrary score
            maxScore: 810,
            starsEarned: finalStars,
            durationSeconds: timer,
        }, rewardImage || undefined);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // --- Render Helpers ---

    const renderCell = (r: number, c: number) => {
        const cell = grid[r][c];
        const isSelected = selectedCell?.r === r && selectedCell?.c === c;
        const isRelated = selectedCell && (selectedCell.r === r || selectedCell.c === c ||
            (Math.floor(selectedCell.r / 3) === Math.floor(r / 3) && Math.floor(selectedCell.c / 3) === Math.floor(c / 3)));
        const isSameValue = selectedCell && grid[selectedCell.r][selectedCell.c].value !== 0 &&
            grid[selectedCell.r][selectedCell.c].value === cell.value;

        let bgClass = 'bg-[#fdf6e3]'; // Default cream
        if (cell.isError) bgClass = 'bg-red-200';
        else if (isSelected) bgClass = 'bg-brand-300';
        else if (isSameValue) bgClass = 'bg-brand-200';
        else if (isRelated) bgClass = 'bg-[#eee8d5]';

        const borderRight = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-[#8b4513]' : 'border-r border-r-[#d2b48c]';
        const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-[#8b4513]' : 'border-b border-b-[#d2b48c]';

        return (
            <div
                key={`${r}-${c}`}
                className={`w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold cursor-pointer select-none transition-colors duration-100
                    ${bgClass} ${borderRight} ${borderBottom}
                    ${cell.isInitial ? 'text-[#5d4037]' : 'text-brand-600'}
                `}
                onClick={() => handleCellClick(r, c)}
            >
                {cell.value !== 0 ? cell.value : (
                    <div className="grid grid-cols-3 gap-[1px] w-full h-full p-[2px]">
                        {cell.notes.map(n => (
                            <div key={n} className="flex items-center justify-center text-[8px] md:text-[10px] text-slate-500 leading-none">
                                {n}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // --- Main Render ---

    if (gameState === 'menu') {
        return (
            <div className="fixed inset-0 bg-[#fdf6e3] z-50 flex flex-col items-center justify-center p-4 bg-wood-pattern">
                <div className="max-w-md w-full bg-[#deb887] rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-4 border-[#8b4513] text-center relative overflow-hidden">
                    {/* Wood Texture Overlay */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

                    <h1 className="text-4xl font-black text-[#5d4037] mb-2 drop-shadow-sm">Sudoku Logic</h1>
                    <p className="text-[#8b4513] mb-8 font-medium">Rèn luyện tư duy logic</p>

                    <div className="space-y-4 relative z-10">
                        <button onClick={() => startGame('easy')} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xl shadow-[0_4px_0_#15803d] active:shadow-none active:translate-y-1 transition-all border-2 border-[#14532d]">
                            Dễ (Easy)
                        </button>
                        <button onClick={() => startGame('medium')} className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-xl shadow-[0_4px_0_#a16207] active:shadow-none active:translate-y-1 transition-all border-2 border-[#713f12]">
                            Trung Bình (Medium)
                        </button>
                        <button onClick={() => startGame('hard')} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xl shadow-[0_4px_0_#b91c1c] active:shadow-none active:translate-y-1 transition-all border-2 border-[#7f1d1d]">
                            Khó (Hard)
                        </button>
                        <button onClick={onExit} className="w-full py-4 bg-[#fdf6e3] hover:bg-[#eee8d5] text-[#8b4513] rounded-xl font-bold text-xl shadow-[0_4px_0_#d2b48c] active:shadow-none active:translate-y-1 transition-all border-2 border-[#8b4513]">
                            Thoát
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#fdf6e3] z-50 flex flex-col items-center p-2 sm:p-4 bg-wood-pattern overflow-hidden h-screen w-screen">
            {/* Header - Fixed height */}
            <div className="w-full max-w-lg flex justify-between items-center mb-2 shrink-0 bg-[#deb887] p-2 rounded-xl border-2 border-[#8b4513] shadow-lg">
                <button onClick={onExit} className="p-2 bg-[#fdf6e3] rounded-lg text-[#8b4513] hover:bg-white border border-[#d2b48c]">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2 bg-[#5d4037] px-3 py-1 rounded-lg border border-[#3e2723]">
                    <Timer className="text-white w-4 h-4" />
                    <span className="text-lg font-mono font-bold text-white">{formatTime(timer)}</span>
                </div>
                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg border border-yellow-300">
                    <span className="font-bold text-yellow-600">{currentStudent?.stars || 0}</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
            </div>

            {/* Board Container - Flexible height */}
            <div className="flex-1 w-full min-h-0 flex items-center justify-center py-2">
                <div className="aspect-square h-full max-h-full w-auto max-w-full bg-[#8b4513] p-2 rounded-lg shadow-2xl">
                    <div className="w-full h-full bg-[#deb887] grid grid-cols-9 grid-rows-9 border-2 border-[#8b4513]">
                        {grid.map((row, r) => row.map((_, c) => renderCell(r, c)))}
                    </div>
                </div>
            </div>

            {/* Controls - Fixed height / Shrinkable if needed */}
            <div className="w-full max-w-lg flex flex-col gap-2 shrink-0 mt-2">
                {/* Tools */}
                <div className="flex justify-between gap-2">
                    <button
                        onClick={() => setIsNoteMode(!isNoteMode)}
                        className={`flex-1 py-2 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 transition-all
                            ${isNoteMode ? 'bg-brand-500 text-white border-brand-700' : 'bg-[#fdf6e3] text-[#8b4513] border-[#d2b48c]'}
                        `}
                    >
                        <Pencil size={18} />
                        <span className="text-[10px] sm:text-xs">Ghi chú</span>
                    </button>
                    <button
                        onClick={handleErase}
                        className="flex-1 py-2 bg-[#fdf6e3] text-[#8b4513] rounded-xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 border-[#d2b48c] active:border-b-0 active:translate-y-1"
                    >
                        <Eraser size={18} />
                        <span className="text-[10px] sm:text-xs">Xóa</span>
                    </button>
                    <button
                        onClick={handleHint}
                        className="flex-1 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 border-yellow-300 active:border-b-0 active:translate-y-1"
                    >
                        <div className="flex items-center gap-1">
                            <Lightbulb size={18} />
                            <span className="text-[10px] sm:text-xs bg-yellow-500 text-white px-1.5 rounded-full flex items-center gap-0.5">
                                -5 <Star size={8} className="fill-white" />
                            </span>
                        </div>
                        <span className="text-[10px] sm:text-xs">Gợi ý</span>
                    </button>
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-9 gap-1 h-12 sm:h-14">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberInput(num)}
                            className="h-full bg-[#deb887] text-[#5d4037] rounded-lg font-black text-xl sm:text-2xl shadow-[0_3px_0_#8b4513] active:shadow-none active:translate-y-[3px] border border-[#d2b48c] transition-all flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            {/* Win Modal */}
            {gameState === 'won' && !showGacha && (
                <div className="absolute inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-[#fdf6e3] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-[#8b4513] animate-in zoom-in">
                        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4 drop-shadow-md" />
                        <h2 className="text-3xl font-black text-[#5d4037] mb-2">Hoàn Thành!</h2>
                        <p className="text-[#8b4513] mb-6">Bạn đã giải mã thành công.</p>

                        <div className="bg-[#deb887] p-4 rounded-xl mb-6 border-2 border-[#d2b48c]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[#5d4037] font-bold">Thời gian:</span>
                                <span className="text-[#5d4037] font-mono text-xl">{formatTime(timer)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[#5d4037] font-bold">Phần thưởng:</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-2xl font-black text-yellow-600">+{earnedStars}</span>
                                    <Star className="fill-yellow-500 text-yellow-500" />
                                </div>
                            </div>
                        </div>

                        {gachaReward && (
                            <div className="mb-6 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border border-purple-200 animate-pulse">
                                <p className="text-purple-700 font-bold flex items-center justify-center gap-2">
                                    <span>🎁</span> Có quà bí mật!
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    if (gachaReward) setShowGacha(true);
                                    else startGame(difficulty!);
                                }}
                                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                            >
                                {gachaReward ? 'Mở quà' : 'Chơi lại'}
                            </button>
                            <button
                                onClick={onExit}
                                className="w-full py-3 bg-white text-[#8b4513] border-2 border-[#d2b48c] rounded-xl font-bold"
                            >
                                Thoát
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showGacha && gachaReward && (
                <GachaModal
                    image={gachaReward.image}
                    isNew={gachaReward.isNew}
                    onClose={() => {
                        setShowGacha(false);
                        setGachaReward(null);
                        setGameState('menu'); // Go back to menu after gacha
                    }}
                />
            )}

            <style>{`
                .bg-wood-pattern {
                    background-color: #fdf6e3;
                    background-image: radial-gradient(#d2b48c 1px, transparent 1px);
                    background-size: 20px 20px;
                }
             `}</style>
        </div>
    );
};
