import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { KidCoderAdventure } from '@/games/KidCoder/KidCoderAdventure';
import { useStudent } from '@/src/contexts/StudentContext';
import { KidCoderGame } from '@/games/KidCoder/KidCoderGame';
import { KidCoderLevelSelect } from '@/games/KidCoder/KidCoderLevelSelect';

export function KidCoderPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const [legacy, setLegacy] = useState(import.meta.env.VITE_KIDCODER_V2 === 'false');
    if (!currentStudent) return <Navigate to="/" replace/>;
    if (legacy) return <><button onClick={() => setLegacy(false)} className="fixed bottom-4 left-4 z-[60] bg-emerald-200 text-slate-900 rounded-xl px-4 py-3 font-bold shadow-lg">🚀 Biệt đội Rover</button><LegacyKidCoderPage/></>;
    return <KidCoderAdventure key={currentStudent.id} student={currentStudent} onExit={() => navigate('/mode')} onLegacy={() => setLegacy(true)}/>;
}

function LegacyKidCoderPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const [view, setView] = useState<'menu' | 'game'>('menu');
    const [selectedLevel, setSelectedLevel] = useState({ level: 1, lesson: 1 });

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    const handleExitGame = () => {
        setView('menu');
    };

    const handleExitMenu = () => {
        navigate('/mode');
    };

    const handleSelectLevel = (level: number, lesson: number) => {
        setSelectedLevel({ level, lesson });
        setView('game');
    };

    const handleLevelComplete = (level: number, lesson: number) => {
        // Logic to update progress is handled inside KidCoderGame via addGameResult
        // Here we can decide if we want to stay in game or go back
        // For now, KidCoderGame handles "Next Level" internally by updating its own state
        // But if we want to sync, we might need to force update or just let it be.

        // Actually, if KidCoderGame updates its internal state, we don't need to do anything here
        // unless we want to reflect it in the URL or something.
        // But when user exits, they go back to menu, which re-reads progress from context.
        // So we just need to ensure context is updated.
    };

    if (view === 'menu') {
        return <KidCoderLevelSelect onSelectLevel={handleSelectLevel} onExit={handleExitMenu} />;
    }

    return (
        <KidCoderGame
            initialLevel={selectedLevel.level}
            initialLesson={selectedLevel.lesson}
            onExit={handleExitGame}
            onComplete={handleLevelComplete}
        />
    );
}
