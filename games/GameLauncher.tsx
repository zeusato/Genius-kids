import React, { lazy, Suspense } from 'react';
import { Compass } from 'lucide-react';
import { Difficulty } from './memoryMatchEngine';
import type { GameEntry } from '../src/components/hub/catalog';

const MemoryAdventure = lazy(() => import('./MemoryMatch/MemoryAdventure'));
const SoundAdventure = lazy(() => import('./SoundMemory/SoundAdventure'));
const DragonAdventure = lazy(() => import('./DragonQuest/adventure/DragonAdventure'));
const MemoryClassic = lazy(() => import('./MemoryMatch/MemoryMatchGame').then(m => ({ default: m.MemoryMatchGame })));
const SoundClassic = lazy(() => import('./SoundMemory/SoundMemoryGame').then(m => ({ default: m.SoundMemoryGame })));
const DragonClassic = lazy(() => import('./DragonQuest/DragonQuestGame').then(m => ({ default: m.DragonQuestGame })));
const SpeedMath = lazy(() => import('./SpeedMath/SpeedMathGame').then(m => ({ default: m.SpeedMathGame })));
const Racing = lazy(() => import('./MathRacing/MathRacingGame').then(m => ({ default: m.MathRacingGame })));
const RacingCup = lazy(() => import('./MathRacing/cup/RacingCupEntry'));
const Sudoku = lazy(() => import('./Sudoku/SudokuGame').then(m => ({ default: m.SudokuGame })));
const GearsBuild = lazy(() => import('./GearsGame/GearsGamePage'));
const GearsGuess = lazy(() => import('./GearsGame/GuessDirectionGame'));
const GearsWorkshop = lazy(() => import('./GearsGame/workshop/Entry'));

export type LegacyComplete = (gameId: string, score: number, maxScore: number, medal: 'bronze' | 'silver' | 'gold' | null) => void;
class LaunchBoundary extends React.Component<{ children: React.ReactNode; onBack: () => void }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        return this.state.failed ? <div className="hub-error" role="alert"><h1>Chưa mở được trò chơi</h1><p>Kiểm tra kết nối rồi mở lại trò chơi nhé.</p><button onClick={this.props.onBack}>Về danh sách trò chơi</button></div> : this.props.children;
    }
}
export function GameLauncher({ entry, onBack, onLegacy, onComplete }: { entry: GameEntry; onBack: () => void; onLegacy: () => void; onComplete: LegacyComplete }) {
    const { id, classic, level } = entry;
    const complete = (game: string) => (score: number, max: number, medal: 'bronze' | 'silver' | 'gold' | null) => { onComplete(game, score, max, medal); onBack(); };
    const pairs = { easy: Difficulty.Easy, medium: Difficulty.Medium, hard: Difficulty.Hard }[level];
    let game: React.ReactNode;
    switch (id) {
        case 'memory': game = classic ? <MemoryClassic difficulty={pairs} onExit={onBack} onComplete={complete(id)}/> : <MemoryAdventure onExit={onBack} onLegacy={onLegacy}/>; break;
        case 'sound-memory': game = classic ? <SoundClassic difficulty={level} onExit={onBack} onComplete={complete(id)}/> : <SoundAdventure onExit={onBack} onLegacy={onLegacy}/>; break;
        case 'dragon-quest': game = classic ? <DragonClassic difficulty={level} onBack={onBack} onComplete={complete(id)}/> : <DragonAdventure onExit={onBack} onLegacy={onLegacy}/>; break;
        case 'speed-math': game = <SpeedMath difficulty="easy" onBack={onBack}/>; break;
        case 'math-racing': game = classic ? <Racing difficulty={level} onExit={onBack}/> : <RacingCup difficulty={entry.requestedLevel} onExit={onBack} onLegacy={onLegacy}/>; break;
        case 'sudoku': game = <Sudoku onExit={onBack}/>; break;
        case 'gears-build': game = classic ? <GearsBuild difficulty={level} onBack={onBack}/> : <GearsWorkshop difficulty={entry.requestedLevel} mode="build" onBack={onBack} onLegacy={onLegacy}/>; break;
        case 'gears-guess': game = classic ? <GearsGuess difficulty={level} onBack={onBack}/> : <GearsWorkshop difficulty={entry.requestedLevel} mode="guess" onBack={onBack} onLegacy={onLegacy}/>; break;
        default: return null;
    }
    return <LaunchBoundary key={id + ':' + classic + ':' + level} onBack={onBack}><Suspense fallback={<div className="hub-loading" role="status"><Compass size={34}/><span>Đang mở thế giới của em…</span><button onClick={onBack}>Về danh sách trò chơi</button></div>}>{game}</Suspense></LaunchBoundary>;
}
