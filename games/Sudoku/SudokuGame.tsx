import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Lightbulb, Eraser, Pencil, Trophy, Timer, Star, Pause, Play, Save } from 'lucide-react';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { playSound } from '@/utils/sound';
import { clearSudokuData, loadSudoku, saveSudoku, withConflicts, isSolved, type Cell, type SudokuDraft } from './persistence';
import { GachaModal } from '../../src/components/GachaModal';
import { generateSudoku, Difficulty } from '@/services/sudokuGenerator';
import { AlbumImage } from '@/types';

interface SudokuGameProps {
    onExit: () => void;
}

export const SudokuGame: React.FC<SudokuGameProps> = ({ onExit }) => {
    const { currentStudent } = useStudent();
    return currentStudent ? <SudokuSession key={currentStudent.id} onExit={onExit}/> : null;
};

function SudokuDialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose(): void }) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => { ref.current?.showModal(); return () => ref.current?.close(); }, []);
    return <dialog ref={ref} aria-labelledby="sudoku-dialog-title" onCancel={e => { e.preventDefault(); onClose(); }}
        className="rounded-3xl border-4 border-[#8b4513] bg-[#fdf6e3] text-[#5d4037] p-7 max-w-sm w-[calc(100%-2rem)] shadow-2xl backdrop:bg-[#fdf6e3]/95">
        <h2 id="sudoku-dialog-title" className="text-2xl font-black mb-4">{title}</h2>{children}
    </dialog>;
}

const SudokuSession: React.FC<SudokuGameProps> = ({ onExit }) => {
    const { currentStudent } = useStudent();
    const { completeSudoku, updateStudent } = useStudentActions();
    const owner = currentStudent!.id;
    const [savedState, setSavedState] = useState(() => loadSudoku(owner, currentStudent!.gameHistory.map(g => g.id)));
    const [saveOk, setSaveOk] = useState(true);
    const [completionOk, setCompletionOk] = useState(true);
    const [pendingDifficulty, setPendingDifficulty] = useState<Difficulty | null>(null);
    const sessionId = useRef('');
    const snapshot = useRef<SudokuDraft | null>(null);
    const finished = useRef(false);
    const pauseRef = useRef(false);

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

    const buildDraft = (nextGrid = grid): SudokuDraft | null => difficulty && sessionId.current ? ({
        version: 1, id: sessionId.current, owner, difficulty, grid: nextGrid, solution,
        selectedCell, isNoteMode, timer, isPaused, updatedAt: new Date().toISOString()
    }) : null;
    if (gameState === 'playing') snapshot.current = buildDraft();
    pauseRef.current = isPaused;
    const saveNow = useCallback(() => {
        const s = snapshot.current;
        if (s && !finished.current) { const ok = saveSudoku(s); setSaveOk(ok); return ok; }
        return true;
    }, []);
    useEffect(() => { if (gameState === 'playing') saveNow(); }, [grid, solution, selectedCell, isNoteMode, timer, isPaused, difficulty, gameState, saveNow]);
    useEffect(() => {
        const hide = () => { if (document.hidden && snapshot.current && !finished.current) {
            pauseRef.current = true; snapshot.current = { ...snapshot.current, isPaused: true };
            setIsPaused(true); saveNow();
        }};
        const flush = () => saveNow();
        document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', flush);
        return () => { document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', flush); };
    }, [saveNow]);
    const pause = () => { pauseRef.current = true; setIsPaused(true); if (snapshot.current) snapshot.current = { ...snapshot.current, isPaused: true }; saveNow(); };
    const resume = () => { pauseRef.current = false; setIsPaused(false); };
    const leave = () => { saveNow(); onExit(); };
    const chooseGame = (diff: Difficulty) => savedState.draft ? setPendingDifficulty(diff) : startGame(diff);
    const continueGame = () => {
        const s = savedState.draft; if (!s) return;
        sessionId.current = s.id; finished.current = false;
        setGrid(withConflicts(s.grid)); setSolution(s.solution); setDifficulty(s.difficulty);
        setSelectedCell(s.selectedCell); setIsNoteMode(s.isNoteMode); setTimer(s.timer); setIsPaused(false);
        setGameState('playing'); setEarnedStars(0); setGachaReward(null); setShowGacha(false);
        snapshot.current = { ...s, isPaused: false };
        if (isSolved(s)) handleGameOver(s);
    };

    // --- Game Logic ---

    const startGame = (diff: Difficulty) => {
        const { initialGrid, solvedGrid } = generateSudoku(diff);
        sessionId.current = 'sudoku-' + crypto.randomUUID(); finished.current = false; pauseRef.current = false;
        setSavedState({ draft: null, error: false }); setPendingDifficulty(null); setCompletionOk(true);

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
        setIsNoteMode(false);
        setEarnedStars(0);
        setGachaReward(null);
        setShowGacha(false);
    };

    useEffect(() => {
        if (gameState === 'playing' && !isPaused) {
            timerRef.current = setInterval(() => {
                if (!pauseRef.current && !document.hidden && !finished.current) setTimer(t => t + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState, isPaused]);

    const handleCellClick = (r: number, c: number) => {
        if (gameState !== 'playing' || pauseRef.current || document.hidden || finished.current) return;
        setSelectedCell({ r, c });
        playSound('click');
    };

    const updateConflicts = withConflicts;

    const handleNumberInput = (num: number) => {
        if (gameState !== 'playing' || pauseRef.current || document.hidden || finished.current || !selectedCell) return;
        const { r, c } = selectedCell;
        const cell = grid[r][c];

        if (cell.isInitial) return;

        let newGrid = grid.map(row => row.map(c => ({ ...c })));
        const newCell = newGrid[r][c];

        if (isNoteMode) {
            if (newCell.value) return;
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
        if (gameState !== 'playing' || pauseRef.current || document.hidden || finished.current || !selectedCell) return;
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
        if (gameState !== 'playing' || pauseRef.current || document.hidden || finished.current || !selectedCell) return;
        const { r, c } = selectedCell;
        if (grid[r][c].isInitial) return;
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

        const finalDraft = buildDraft(currentGrid);
        if (finalDraft) handleGameOver(finalDraft);
    };

    const handleGameOver = (finalDraft: SudokuDraft) => {
        if (finished.current) return;
        // Retain the solved draft until the profile write succeeds. Retrying uses the same id.
        snapshot.current = finalDraft; saveSudoku(finalDraft);
        const result = completeSudoku(owner, finalDraft);
        setCompletionOk(result.ok); setGameState('won');
        if (timerRef.current) clearInterval(timerRef.current);
        if (!result.ok) return;
        finished.current = true; snapshot.current = null; clearSudokuData(owner);
        setSavedState({ draft: null, error: false });
        setEarnedStars(result.earned); playSound('complete');
        if (result.image) setGachaReward({ image: result.image, isNew: result.isNew });
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
            <button
                type="button"
                aria-label={`Hàng ${r + 1}, cột ${c + 1}: ${cell.value || 'trống'}${cell.isInitial ? ', số cho sẵn' : ''}`}
                aria-pressed={isSelected}
                disabled={isPaused || gameState !== 'playing'}
                key={`${r}-${c}`}
                className={`w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold cursor-pointer select-none transition-colors duration-100
                    ${bgClass} ${borderRight} ${borderBottom}
                    ${cell.isInitial ? 'text-[#5d4037]' : 'text-brand-600'}
                `}
                onClick={() => handleCellClick(r, c)}
            >
                {cell.value !== 0 ? cell.value : (
                    <div className="grid grid-cols-3 gap-[1px] w-full h-full p-[2px]">
                        {[1,2,3,4,5,6,7,8,9].map(n => (
                            <div key={n} className="flex items-center justify-center text-[8px] md:text-[10px] text-slate-500 leading-none">
                                {cell.notes.includes(n) ? n : ''}
                            </div>
                        ))}
                    </div>
                )}
            </button>
        );
    };

    // --- Main Render ---

    if (gameState === 'menu') {
        return (
            <div className="fixed inset-0 bg-[#fdf6e3] z-50 flex flex-col items-center justify-center p-4 bg-wood-pattern overflow-auto">
                <div className="max-w-md w-full bg-[#deb887] rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.3)] border-4 border-[#8b4513] text-center relative overflow-hidden">
                    {/* Wood Texture Overlay */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

                    <h1 className="text-4xl font-black text-[#5d4037] mb-2 drop-shadow-sm">Sudoku Logic</h1>
                    <p className="text-[#8b4513] mb-8 font-medium">Rèn luyện tư duy logic</p>

                    <div className="space-y-4 relative z-10">
                        {savedState.draft && <button onClick={continueGame} className="w-full p-4 bg-[#fdf6e3] text-[#5d4037] rounded-xl border-2 border-[#8b4513] text-left">
                            <strong className="flex items-center gap-2"><Play size={19}/> Chơi tiếp ván đã lưu</strong>
                            <span className="text-sm block mt-1">{({easy:'Dễ',medium:'Trung bình',hard:'Khó'})[savedState.draft.difficulty]} · {formatTime(savedState.draft.timer)} · {savedState.draft.grid.flat().filter(c => c.value).length}/81 ô</span>
                        </button>}
                        {savedState.error && <p role="status" className="text-sm">Chưa đọc được bản lưu. Em có thể bắt đầu ván mới.</p>}
                        <button onClick={() => chooseGame('easy')} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xl shadow-[0_4px_0_#15803d] active:shadow-none active:translate-y-1 transition-all border-2 border-[#14532d]">
                            Dễ (Easy)
                        </button>
                        <button onClick={() => chooseGame('medium')} className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-xl shadow-[0_4px_0_#a16207] active:shadow-none active:translate-y-1 transition-all border-2 border-[#713f12]">
                            Trung Bình (Medium)
                        </button>
                        <button onClick={() => chooseGame('hard')} className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xl shadow-[0_4px_0_#b91c1c] active:shadow-none active:translate-y-1 transition-all border-2 border-[#7f1d1d]">
                            Khó (Hard)
                        </button>
                        <button onClick={leave} className="w-full py-4 bg-[#fdf6e3] hover:bg-[#eee8d5] text-[#8b4513] rounded-xl font-bold text-xl shadow-[0_4px_0_#d2b48c] active:shadow-none active:translate-y-1 transition-all border-2 border-[#8b4513]">
                            Thoát
                        </button>
                    </div>
                </div>
                {pendingDifficulty && <SudokuDialog title="Bắt đầu ván mới?" onClose={() => setPendingDifficulty(null)}>
                    <p className="mb-5">Ván đang lưu sẽ được thay bằng một câu đố mới.</p>
                    <div className="flex gap-3"><button className="flex-1 rounded-xl bg-white p-3 font-bold" onClick={() => setPendingDifficulty(null)}>Giữ ván cũ</button>
                    <button className="flex-1 rounded-xl bg-[#8b4513] text-white p-3 font-bold" onClick={() => startGame(pendingDifficulty)}>Ván mới</button></div>
                </SudokuDialog>}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#fdf6e3] z-50 flex flex-col items-center p-2 sm:p-4 bg-wood-pattern overflow-hidden h-screen w-screen">
            {/* Header - Fixed height */}
            <div className="w-full max-w-lg flex justify-between items-center mb-2 shrink-0 bg-[#deb887] p-2 rounded-xl border-2 border-[#8b4513] shadow-lg">
                <button aria-label="Lưu và thoát Sudoku" onClick={leave} className="p-2 bg-[#fdf6e3] rounded-lg text-[#8b4513] hover:bg-white border border-[#d2b48c]">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2 bg-[#5d4037] px-3 py-1 rounded-lg border border-[#3e2723]">
                    <Timer className="text-white w-4 h-4" />
                    <span className="text-lg font-mono font-bold text-white">{formatTime(timer)}</span>
                </div>
                <button aria-label="Tạm dừng Sudoku" title="Tạm dừng" disabled={gameState !== 'playing'} onClick={pause} className="p-2 bg-[#fdf6e3] rounded-lg text-[#8b4513] border border-[#d2b48c]"><Pause size={20}/></button>
                <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-lg border border-yellow-300">
                    <span className="font-bold text-yellow-600">{currentStudent?.stars || 0}</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
            </div>

            <div className="w-full max-w-lg flex justify-between items-center text-[11px] text-[#8b4513] shrink-0" role="status">
                <span>{saveOk ? '✓ Tự động lưu trên thiết bị này' : 'Chưa lưu được. Em có thể thử lại.'}</span>
                <button disabled={gameState !== 'playing'} onClick={saveNow} className="flex items-center gap-1 p-2 rounded-lg"><Save size={14}/> Lưu ngay</button>
            </div>
            {/* Board Container - Flexible height */}
            <div className="flex-1 w-full min-h-0 flex items-center justify-center py-2">
                <div className="aspect-square max-h-full max-w-full portrait:w-full portrait:h-auto landscape:h-full landscape:w-auto bg-[#8b4513] p-2 rounded-lg shadow-2xl">
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
                        disabled={isPaused || gameState !== 'playing'}
                        onClick={() => { if (!pauseRef.current) setIsNoteMode(!isNoteMode); }}
                        className={`flex-1 py-2 rounded-xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 transition-all
                            ${isNoteMode ? 'bg-brand-500 text-white border-brand-700' : 'bg-[#fdf6e3] text-[#8b4513] border-[#d2b48c]'}
                        `}
                    >
                        <Pencil size={18} />
                        <span className="text-[10px] sm:text-xs">Ghi chú</span>
                    </button>
                    <button
                        disabled={isPaused || gameState !== 'playing'}
                        onClick={handleErase}
                        className="flex-1 py-2 bg-[#fdf6e3] text-[#8b4513] rounded-xl font-bold flex flex-col items-center justify-center gap-1 border-b-4 border-[#d2b48c] active:border-b-0 active:translate-y-1"
                    >
                        <Eraser size={18} />
                        <span className="text-[10px] sm:text-xs">Xóa</span>
                    </button>
                    <button
                        disabled={isPaused || gameState !== 'playing'}
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
                            disabled={isPaused || gameState !== 'playing'}
                            onClick={() => handleNumberInput(num)}
                            className="h-full bg-[#deb887] text-[#5d4037] rounded-lg font-black text-xl sm:text-2xl shadow-[0_3px_0_#8b4513] active:shadow-none active:translate-y-[3px] border border-[#d2b48c] transition-all flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            {isPaused && gameState === 'playing' && <SudokuDialog title="Nghỉ một chút nhé" onClose={resume}>
                <p className="mb-2">Đồng hồ đã dừng ở <strong>{formatTime(timer)}</strong>. Bảng số và ghi chú của em được giữ nguyên.</p>
                <p className="text-sm mb-6">{saveOk ? 'Tiến trình đã lưu trên thiết bị này.' : 'Chưa lưu được trên thiết bị. Hãy thử lưu lại trước khi thoát.'}</p>
                <div className="grid gap-3"><button onClick={resume} className="rounded-xl bg-[#8b4513] text-white p-3 font-bold flex gap-2 justify-center"><Play size={18}/> Chơi tiếp</button>
                <button onClick={saveNow} className="rounded-xl bg-[#deb887] p-3 font-bold">Lưu tiến trình</button>
                <button onClick={leave} className="rounded-xl bg-white p-3 font-bold">Lưu và thoát</button></div>
            </SudokuDialog>}

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

                        {!completionOk && <p role="alert" className="text-sm text-red-700 mb-3">Chưa lưu được kết quả. Ván đã giải được giữ lại để thử lưu tiếp.</p>}
                        <div className="space-y-3">
                            {!completionOk && <button onClick={() => snapshot.current && handleGameOver(snapshot.current)} className="w-full py-3 bg-[#8b4513] text-white rounded-xl font-bold">Thử lưu kết quả</button>}
                            <button
                                disabled={!completionOk}
                                onClick={() => {
                                    if (gachaReward) setShowGacha(true);
                                    else startGame(difficulty!);
                                }}
                                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
                            >
                                {gachaReward ? 'Mở quà' : 'Chơi lại'}
                            </button>
                            <button
                                onClick={leave}
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
