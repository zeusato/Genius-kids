import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Play, RotateCcw, Trash2, ArrowUp, CornerUpLeft, CornerUpRight, MapPin, Bot, Star, Flag, Sword, Skull, Key, Lock, Box, AlertTriangle } from 'lucide-react';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { playSound } from '@/utils/sound';
import { generateLevel, LevelData, Direction, Position, CommandType, CURRICULUM } from '@/services/kidCoderGenerator';

interface KidCoderGameProps {
    initialLevel: number;
    initialLesson: number;
    onExit: () => void;
    onComplete: (level: number, lesson: number) => void;
}

export const KidCoderGame: React.FC<KidCoderGameProps> = ({ initialLevel, initialLesson, onExit, onComplete }) => {
    const { currentStudent } = useStudent();
    const { updateStudent, addGameResult } = useStudentActions();

    // Game State
    const [levelId, setLevelId] = useState(initialLevel);
    const [lessonId, setLessonId] = useState(initialLesson);
    const [levelData, setLevelData] = useState<LevelData | null>(null);

    // Check if this stage is already completed
    const isStageCompleted = useMemo(() => {
        if (!currentStudent?.gameHistory) return false;
        const stageKey = `${levelId}-${lessonId}`;
        return currentStudent.gameHistory.some(g => g.gameType === 'kidcoder' && g.difficulty === stageKey);
    }, [currentStudent, levelId, lessonId]);

    // Robot State
    const [robotPos, setRobotPos] = useState<Position>({ row: 0, col: 0 });
    const [robotDir, setRobotDir] = useState<Direction>('E');

    // Gameplay State
    const [collectedLocations, setCollectedLocations] = useState<string[]>([]); // "row-col" strings
    const [defeatedMonsters, setDefeatedMonsters] = useState<string[]>([]); // "row-col" strings
    const [collectedKeys, setCollectedKeys] = useState(false); // Has player collected the key?
    const [boxPositions, setBoxPositions] = useState<Position[]>([]); // Current box positions
    const [filledTraps, setFilledTraps] = useState<string[]>([]); // "row-col" of filled traps
    const [program, setProgram] = useState<CommandType[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [failedStep, setFailedStep] = useState<number | null>(null); // Track which step caused failure
    const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Init Level
    useEffect(() => {
        startLevel(levelId, lessonId);
    }, [levelId, lessonId]);

    const startLevel = (lvl: number, lsn: number) => {
        const data = generateLevel(lvl, lsn);
        setLevelData(data);
        setRobotPos(data.startPos);
        setRobotDir(data.startDir);
        setProgram([]);
        setIsRunning(false);
        setCurrentStep(-1);
        setFailedStep(null); // Reset failed step
        setGameStatus('playing');
        setCollectedLocations([]);
        setDefeatedMonsters([]);
        setCollectedKeys(false);
        setBoxPositions(data.boxPositions || []);
        setFilledTraps([]);
    };

    // Game Loop State Ref
    const stateRef = useRef({ robotPos, robotDir, program, currentStep, collectedLocations, defeatedMonsters, collectedKeys, boxPositions, filledTraps });
    useEffect(() => {
        stateRef.current = { robotPos, robotDir, program, currentStep, collectedLocations, defeatedMonsters, collectedKeys, boxPositions, filledTraps };
    }, [robotPos, robotDir, program, currentStep, collectedLocations, defeatedMonsters, collectedKeys, boxPositions, filledTraps]);

    const executeCommandRef = (cmd: CommandType) => {
        const { robotPos, robotDir, collectedLocations, defeatedMonsters, collectedKeys, boxPositions, filledTraps } = stateRef.current;
        let newDir = robotDir;
        let newPos = { ...robotPos };
        let isJump = false;

        if (cmd === 'left') {
            if (robotDir === 'N') newDir = 'W';
            else if (robotDir === 'W') newDir = 'S';
            else if (robotDir === 'S') newDir = 'E';
            else newDir = 'N';
            setRobotDir(newDir);
        } else if (cmd === 'right') {
            if (robotDir === 'N') newDir = 'E';
            else if (robotDir === 'E') newDir = 'S';
            else if (robotDir === 'S') newDir = 'W';
            else newDir = 'N';
            setRobotDir(newDir);
        } else if (cmd === 'push') {
            // Push command: push box forward
            let targetPos = { ...robotPos };
            if (robotDir === 'N') targetPos.row--;
            else if (robotDir === 'S') targetPos.row++;
            else if (robotDir === 'E') targetPos.col++;
            else if (robotDir === 'W') targetPos.col--;

            // Check if there's a box at target
            const boxIndex = boxPositions.findIndex(b => b.row === targetPos.row && b.col === targetPos.col);
            if (boxIndex >= 0) {
                // Calculate push destination
                let pushDest = { ...targetPos };
                if (robotDir === 'N') pushDest.row--;
                else if (robotDir === 'S') pushDest.row++;
                else if (robotDir === 'E') pushDest.col++;
                else if (robotDir === 'W') pushDest.col--;

                // Check if push destination is valid
                if (levelData &&
                    pushDest.row >= 0 && pushDest.row < levelData.gridSize &&
                    pushDest.col >= 0 && pushDest.col < levelData.gridSize) {

                    const destCell = levelData.grid[pushDest.row][pushDest.col];
                    const destKey = `${pushDest.row}-${pushDest.col}`;

                    // Can push to empty, water, or trap
                    if (destCell === 'empty' || destCell === 'water' || destCell === 'trap') {
                        // Update box positions
                        const newBoxPositions = [...boxPositions];
                        newBoxPositions[boxIndex] = pushDest;
                        setBoxPositions(newBoxPositions);

                        // If pushed onto water or trap, fill it
                        if ((destCell === 'water' || destCell === 'trap') && !filledTraps.includes(destKey)) {
                            setFilledTraps(prev => [...prev, destKey]);

                            // If trap, collect the star on it
                            if (destCell === 'trap' && !collectedLocations.includes(destKey)) {
                                setCollectedLocations(prev => [...prev, destKey]);
                                playSound('ding'); // Star collected sound
                            }
                        }

                        playSound('click');
                        return;
                    }
                }
            }
            playSound('buzz');
            return;
        } else if (cmd === 'forward') {
            if (robotDir === 'N') newPos.row--;
            else if (robotDir === 'S') newPos.row++;
            else if (robotDir === 'E') newPos.col++;
            else if (robotDir === 'W') newPos.col--;
        } else if (cmd === 'jump') {
            isJump = true;
            if (robotDir === 'N') newPos.row -= 2;
            else if (robotDir === 'S') newPos.row += 2;
            else if (robotDir === 'E') newPos.col += 2;
            else if (robotDir === 'W') newPos.col -= 2;
        } else if (cmd === 'fight') {
            let targetPos = { ...robotPos };
            if (robotDir === 'N') targetPos.row--;
            else if (robotDir === 'S') targetPos.row++;
            else if (robotDir === 'E') targetPos.col++;
            else if (robotDir === 'W') targetPos.col--;

            if (levelData &&
                targetPos.row >= 0 && targetPos.row < levelData.gridSize &&
                targetPos.col >= 0 && targetPos.col < levelData.gridSize &&
                levelData.grid[targetPos.row][targetPos.col] === 'monster') {

                const monsterKey = `${targetPos.row}-${targetPos.col}`;
                if (!defeatedMonsters.includes(monsterKey)) {
                    setDefeatedMonsters(prev => [...prev, monsterKey]);
                    playSound('click');
                    return;
                }
            }
            playSound('click');
            return;
        }

        // Check collision
        if (!isValidMove(newPos, isJump)) {
            handleCrash();
            return;
        }

        // Move Robot
        setRobotPos(newPos);
        playSound(isJump ? 'click' : 'click');

        // Collect Star
        if (levelData && levelData.grid[newPos.row][newPos.col] === 'star') {
            const locKey = `${newPos.row}-${newPos.col}`;
            if (!collectedLocations.includes(locKey)) {
                setCollectedLocations(prev => [...prev, locKey]);
                playSound('ding');
            }
        }

        // Collect Key
        if (levelData && levelData.grid[newPos.row][newPos.col] === 'key' && !collectedKeys) {
            setCollectedKeys(true);
            playSound('ding');
        }
    };

    const isValidMove = (pos: Position, isJump: boolean) => {
        if (!levelData) return false;

        // Bounds
        if (pos.row < 0 || pos.row >= levelData.gridSize || pos.col < 0 || pos.col >= levelData.gridSize) return false;

        const cell = levelData.grid[pos.row][pos.col];

        // Walls block everything
        if (cell === 'wall') return false;

        // Water blocks normal movement unless filled with box
        if (cell === 'water') {
            const waterKey = `${pos.row}-${pos.col}`;
            if (!stateRef.current.filledTraps.includes(waterKey)) return false;
        }

        // Traps block unless filled with a box (legacy - not used in Level 5)
        if (cell === 'trap') {
            const trapKey = `${pos.row}-${pos.col}`;
            if (!stateRef.current.filledTraps.includes(trapKey)) return false;
        }

        // Monster blocks movement unless defeated
        if (cell === 'monster') {
            const monsterKey = `${pos.row}-${pos.col}`;
            if (!stateRef.current.defeatedMonsters.includes(monsterKey)) {
                return false;
            }
        }

        // Boxes block movement
        const hasBox = stateRef.current.boxPositions.some(b => b.row === pos.row && b.col === pos.col);
        if (hasBox) return false;

        return true;
    };

    const handleCrash = () => {
        setIsRunning(false);
        setFailedStep(stateRef.current.currentStep); // Mark the failed step
        setGameStatus('lost');
        playSound('buzz');
    };

    // Game Loop
    useEffect(() => {
        if (isRunning && gameStatus === 'playing') {
            timerRef.current = setInterval(() => {
                const { currentStep, program } = stateRef.current;
                const nextStep = currentStep + 1;

                if (nextStep >= program.length) {
                    setIsRunning(false);
                    // Check win
                    const { robotPos, collectedKeys } = stateRef.current;
                    const endPos = levelData?.endPos;

                    const reachedEnd = robotPos.row === endPos?.row && robotPos.col === endPos?.col;
                    // Win if reached end AND have key (if level requires key)
                    const hasRequiredKey = levelData?.keyPosition ? collectedKeys : true;

                    if (reachedEnd && hasRequiredKey) {
                        setGameStatus('won');
                        playSound('complete');
                    } else {
                        setGameStatus('lost');
                        playSound('buzz');
                    }
                    return;
                }

                setCurrentStep(nextStep);
                executeCommandRef(program[nextStep]);
            }, 600);
        }
        return () => clearInterval(timerRef.current!);
    }, [isRunning, gameStatus]);

    const handleAddCommand = (cmd: CommandType) => {
        if (isRunning || gameStatus !== 'playing') return;
        setProgram([...program, cmd]);
        playSound('ding');
    };

    const handleRemoveCommand = (index: number) => {
        if (isRunning || gameStatus !== 'playing') return;
        const newProg = [...program];
        newProg.splice(index, 1);
        setProgram(newProg);
    };

    const handleClearProgram = () => {
        if (isRunning || gameStatus !== 'playing') return;
        setProgram([]);
        playSound('click');
    };

    const handleRun = () => {
        if (program.length === 0) return;
        setIsRunning(true);
        setFailedStep(null); // Clear previous failure
        setGameStatus('playing');
        if (levelData) {
            setRobotPos(levelData.startPos);
            setRobotDir(levelData.startDir);
            setCollectedLocations([]);
            setDefeatedMonsters([]);
            setCurrentStep(-1);
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        setCurrentStep(-1);
        // DON'T clear failedStep - keep it so user can see which step failed
        setGameStatus('playing');
        if (levelData) {
            setRobotPos(levelData.startPos);
            setRobotDir(levelData.startDir);
            setCollectedLocations([]);
            setDefeatedMonsters([]);
            setCollectedKeys(false);
            setBoxPositions(levelData.boxPositions || []); // Reset boxes
            setFilledTraps([]); // Reset filled traps
        }
    };

    const handleNextLevel = () => {
        addGameResult({
            id: Date.now().toString(),
            date: new Date().toISOString(),
            durationSeconds: 0,
            gameType: 'kidcoder',
            score: 100,
            maxScore: 100,
            difficulty: `${levelId}-${lessonId}`,
            starsEarned: 3
        });

        onComplete(levelId, lessonId);

        const currentLevelInfo = CURRICULUM.find(c => c.id === levelId);
        const maxLessons = currentLevelInfo ? currentLevelInfo.lessons : 10;

        if (lessonId < maxLessons) {
            setLessonId(lessonId + 1);
        } else {
            setLessonId(1);
            setLevelId(levelId + 1);
        }
    };

    if (!levelData) return <div>Loading...</div>;

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-4">
            {/* Header */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <button onClick={onExit} className="p-2 bg-slate-700 rounded-lg text-white hover:bg-slate-600">
                    <ArrowLeft />
                </button>
                <div className="text-white font-bold text-xl flex flex-col items-center">
                    <span>Level {levelId} - Bài {lessonId}</span>
                    {levelData.requiredStars > 0 && (
                        <div className="flex gap-1 mt-1">
                            {Array.from({ length: levelData.requiredStars }).map((_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    className={i < collectedLocations.length ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-slate-900 px-3 py-1 rounded text-cyan-400 font-mono">
                        {program.length} / {levelData.optimalSteps + 5} Blocks
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl h-full max-h-[80vh]">
                {/* Game Board */}
                <div className="flex-1 bg-slate-800 rounded-2xl p-4 shadow-2xl flex items-center justify-center border-4 border-slate-700 relative overflow-hidden">
                    <div
                        className="grid gap-1 bg-slate-900 p-2 rounded-xl"
                        style={{
                            gridTemplateColumns: `repeat(${levelData.gridSize}, 1fr)`,
                            gridTemplateRows: `repeat(${levelData.gridSize}, 1fr)`,
                            width: 'min(100%, 500px)',
                            aspectRatio: '1/1'
                        }}
                    >
                        {levelData.grid.map((row, r) => (
                            row.map((cell, c) => {
                                const isCollected = collectedLocations.includes(`${r}-${c}`);
                                const isDefeated = defeatedMonsters.includes(`${r}-${c}`);
                                const isFilled = filledTraps.includes(`${r}-${c}`);
                                const hasBox = boxPositions.some(b => b.row === r && b.col === c);
                                const isEnd = r === levelData.endPos.row && c === levelData.endPos.col;
                                const isKey = cell === 'key' && !collectedKeys;

                                // Generate tooltip
                                let tooltip = '';
                                if (cell === 'wall') tooltip = 'Tường - không thể đi qua';
                                else if (cell === 'water') tooltip = isFilled ? 'Nước đã lấp - có thể đi qua' : 'Nước - cần nhảy qua hoặc đẩy hộp vào';
                                else if (cell === 'end') tooltip = levelData.keyPosition && !collectedKeys ? 'Đích - cần chìa khóa để hoàn thành! 🔑' : 'Đích - về đây để hoàn thành! 🏁';
                                else if (cell === 'star' && !isCollected && !isStageCompleted) tooltip = 'Sao - điểm thưởng ⭐';
                                else if (cell === 'monster' && !isDefeated) tooltip = 'Quái vật - dùng lệnh "Chiến đấu" để đánh bại 💀';
                                else if (isKey) tooltip = 'Chìa khóa - cần để mở đích 🔑';
                                else if (hasBox) tooltip = 'Hộp - dùng lệnh "Đẩy" để di chuyển 📦';
                                else if (cell === 'trap') tooltip = isFilled ? 'Nước đã lấp - có thể đi qua và lấy sao' : 'Nước có sao - đẩy hộp vào để lấp nước 💧⭐';

                                return (
                                    <div
                                        key={`${r}-${c}`}
                                        title={tooltip}
                                        className={`
                                            relative rounded-lg flex items-center justify-center w-full h-full cursor-help
                                            ${cell === 'wall' ? 'bg-slate-700 shadow-inner' :
                                                (cell === 'water' || cell === 'trap') ? 'bg-blue-500/30 border border-blue-500/50' :
                                                    'bg-slate-800/50 border border-slate-700/50'}
                                        `}
                                    >
                                        {cell === 'wall' && <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>}
                                        {cell === 'water' && <div className="w-full h-full animate-pulse opacity-50">🌊</div>}
                                        {cell === 'end' && (
                                            <div className="relative">
                                                <Flag className="text-green-500 w-8 h-8 animate-bounce" />
                                                {/* Show key icon on end if level requires key */}
                                                {levelData.keyPosition && !collectedKeys && (
                                                    <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                                                        <Key className="w-4 h-4 text-slate-900" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {cell === 'star' && !isCollected && !isStageCompleted && <Star className="text-yellow-400 w-6 h-6 animate-spin-slow" />}
                                        {cell === 'monster' && !isDefeated && <Skull className="text-red-500 w-6 h-6 animate-pulse" />}
                                        {cell === 'key' && !collectedKeys && <Key className="text-yellow-400 w-6 h-6 animate-bounce" />}
                                        {cell === 'trap' && (
                                            <>
                                                {/* Water background */}
                                                <div className="w-full h-full animate-pulse opacity-50">🌊</div>
                                                {/* Star on water (only if not filled) */}
                                                {!filledTraps.includes(`${r}-${c}`) && (
                                                    <Star className="absolute text-yellow-400 w-6 h-6 animate-spin-slow" />
                                                )}
                                            </>
                                        )}

                                        {/* Render boxes */}
                                        {boxPositions.some(b => b.row === r && b.col === c) && (
                                            <Box className="text-amber-600 w-6 h-6" />
                                        )}

                                        {/* Robot */}
                                        {robotPos.row === r && robotPos.col === c && (
                                            <div
                                                className="absolute inset-0 flex items-center justify-center transition-all duration-500 z-10"
                                                style={{ transform: `rotate(${robotDir === 'N' ? 0 : robotDir === 'E' ? 90 : robotDir === 'S' ? 180 : 270}deg)` }}
                                            >
                                                <div className="relative">
                                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-yellow-400 filter drop-shadow"></div>
                                                    </div>
                                                    <div className="bg-cyan-500 p-2 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                                                        <Bot className="text-white w-6 h-6 md:w-8 md:h-8" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>

                    {/* Status Overlay */}
                    {gameStatus !== 'playing' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 animate-in zoom-in">
                            <div className="bg-white p-8 rounded-3xl text-center max-w-sm">
                                {gameStatus === 'won' ? (
                                    <>
                                        <div className="text-6xl mb-4">🎉</div>
                                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Hoàn thành!</h2>
                                        <p className="text-slate-600 mb-6">Bạn đã lập trình thành công.</p>
                                        <button onClick={handleNextLevel} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 shadow-lg">
                                            Màn tiếp theo
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-6xl mb-4">💥</div>
                                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Thất bại!</h2>
                                        <p className="text-slate-600 mb-6">
                                            {collectedLocations.length < (levelData.requiredStars || 0)
                                                ? "Chưa thu thập đủ sao!"
                                                : "Robot đã gặp sự cố."}
                                        </p>
                                        <button onClick={handleReset} className="w-full py-3 bg-slate-500 text-white rounded-xl font-bold text-lg hover:bg-slate-600 shadow-lg">
                                            Thử lại
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Panel */}
                <div className="w-full md:w-80 flex flex-col gap-4 h-full">
                    {/* Program Queue */}
                    <div className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-slate-400 font-bold text-sm uppercase tracking-wider">Chương trình chính</h3>
                            <button
                                onClick={handleClearProgram}
                                disabled={isRunning || program.length === 0}
                                className="text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Xóa tất cả"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-900/50 rounded-xl p-2 overflow-y-auto space-y-2 min-h-[200px]">
                            {program.length === 0 && (
                                <div className="text-slate-600 text-center mt-10 text-sm italic">
                                    Kéo lệnh vào đây...
                                </div>
                            )}
                            {program.map((cmd, idx) => (
                                <div
                                    key={idx}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all
                                        ${idx === failedStep ? 'bg-red-500/30 border-red-500 text-red-200' :
                                            idx === currentStep ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200' :
                                                'bg-slate-700 border-slate-500 text-white'}
                                    `}
                                >
                                    <span className="font-mono text-slate-500 text-xs w-4">{idx + 1}</span>
                                    {idx === failedStep && <AlertTriangle size={16} className="text-red-500" />}
                                    {cmd === 'forward' && <><ArrowUp size={18} /> Đi thẳng</>}
                                    {cmd === 'left' && <><CornerUpLeft size={18} /> Rẽ trái</>}
                                    {cmd === 'right' && <><CornerUpRight size={18} /> Rẽ phải</>}
                                    {cmd === 'jump' && <><ArrowUp size={18} className="text-orange-400" /> Nhảy</>}
                                    {cmd === 'fight' && <><Sword size={18} className="text-red-400" /> Chiến đấu</>}

                                    {!isRunning && (
                                        <button onClick={() => handleRemoveCommand(idx)} className="ml-auto text-slate-500 hover:text-red-400">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Command Palette */}
                    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                        <div className="grid grid-cols-3 gap-2">
                            {levelData.allowedCommands.includes('forward') && (
                                <button
                                    onClick={() => handleAddCommand('forward')}
                                    disabled={isRunning}
                                    title="Đi thẳng - Di chuyển robot 1 ô về phía trước"
                                    className="p-4 bg-blue-500 hover:bg-blue-600 active:translate-y-1 text-white rounded-xl shadow-lg shadow-blue-900/20 flex flex-col items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowUp size={24} />
                                    <span className="text-xs font-bold">Đi thẳng</span>
                                </button>
                            )}
                            {levelData.allowedCommands.includes('left') && (
                                <button
                                    onClick={() => handleAddCommand('left')}
                                    disabled={isRunning}
                                    title="Rẽ trái - Quay robot sang trái 90°"
                                    className="p-4 bg-purple-500 hover:bg-purple-600 active:translate-y-1 text-white rounded-xl shadow-lg shadow-purple-900/20 flex flex-col items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CornerUpLeft size={24} />
                                    <span className="text-xs font-bold">Trái</span>
                                </button>
                            )}
                            {levelData.allowedCommands.includes('right') && (
                                <button
                                    onClick={() => handleAddCommand('right')}
                                    disabled={isRunning}
                                    title="Rẽ phải - Quay robot sang phải 90°"
                                    className="p-4 bg-purple-500 hover:bg-purple-600 active:translate-y-1 text-white rounded-xl shadow-lg shadow-purple-900/20 flex flex-col items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CornerUpRight size={24} />
                                    <span className="text-xs font-bold">Phải</span>
                                </button>
                            )}
                            {levelData.allowedCommands.includes('jump') && (
                                <button
                                    onClick={() => handleAddCommand('jump')}
                                    disabled={isRunning}
                                    title="Nhảy - Nhảy qua 1 ô (vượt qua nước)"
                                    className="p-4 bg-orange-500 hover:bg-orange-600 active:translate-y-1 text-white rounded-xl shadow-lg shadow-orange-900/20 flex flex-col items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowUp size={24} className="mb-[-10px]" />
                                    <ArrowUp size={16} />
                                    <span className="text-xs font-bold mt-1">Nhảy</span>
                                </button>
                            )}
                            {levelData.allowedCommands.includes('fight') && (
                                <button
                                    onClick={() => handleAddCommand('fight')}
                                    disabled={isRunning}
                                    title="Chiến đấu - Đánh bại quái vật ở ô phía trước"
                                    className="p-4 bg-red-500 hover:bg-red-600 active:translate-y-1 text-white rounded-xl shadow-lg shadow-red-900/20 flex flex-col items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Sword size={24} />
                                    <span className="text-xs font-bold mt-1">Chiến đấu</span>
                                </button>
                            )}
                            {levelData.allowedCommands.includes('push') && (
                                <button
                                    onClick={() => handleAddCommand('push')}
                                    disabled={isRunning}
                                    className="p-4 bg-purple-500 hover:bg-purple-600 active:translate-y-1 text-white rounded-xl shadow-lg shadow-purple-900/20 flex flex-col items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Box size={24} />
                                    <span className="text-xs font-bold mt-1">Đẩy</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleRun}
                            disabled={isRunning || program.length === 0}
                            className="flex-1 py-4 bg-green-500 hover:bg-green-600 active:translate-y-1 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play fill="currentColor" /> Chạy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
