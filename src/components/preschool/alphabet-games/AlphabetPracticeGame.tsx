import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStudent, useStudentActions } from '../../../contexts/StudentContext';
import { cancelSpeech, speak } from '../../../utils/speech';
import { GAME_COPY } from './content';
import { mastered } from './progress';
import type { AlphabetActivity, AlphabetLevel, AlphabetOutcome, AlphabetSession } from './types';
import { ActivityIntro, GameComplete } from './AlphabetActivityFrame';
import { WordBasketGame } from './WordBasketGame';
import { LetterPostGame } from './LetterPostGame';
import { LetterTrainGame } from './LetterTrainGame';
import './alphabet-games.css';

export function AlphabetPracticeGame({ activity, onBack }: { activity: AlphabetActivity; onBack: () => void }) {
    const { currentStudent } = useStudent(), { completeAlphabetPractice } = useStudentActions();
    const [phase, setPhase] = useState<'intro'|'playing'|'done'>('intro'), [level, setLevel] = useState<AlphabetLevel>(currentStudent?.alphabetPractice?.lastLevel?.[activity] || 'intro'), [fixed, setFixed] = useState(''), [seed, setSeed] = useState(() => Date.now() & 0x7fffffff), [earned, setEarned] = useState(0), [saved, setSaved] = useState(true);
    const started = useRef(0), sessionId = useRef(''), finishing = useRef(false);
    const mastery = useMemo(() => [...'abcdefghijklmnopqrstuvwxyz'].filter(id => mastered(currentStudent?.alphabetPractice, activity, id)).length, [currentStudent?.alphabetPractice, activity]);
    useEffect(() => {
        const timer = window.setTimeout(() => speak(GAME_COPY[activity].intro, { lang: 'vi-VN', rate: .9, pitch: 1.04 }), 380);
        return () => { window.clearTimeout(timer); cancelSpeech(); };
    }, [activity]);
    const start = () => { cancelSpeech(); const nextSeed = Date.now() & 0x7fffffff; setSeed(nextSeed); sessionId.current = `${activity}-${nextSeed}-${Math.random().toString(36).slice(2,8)}`; started.current = performance.now(); finishing.current = false; setPhase('playing'); };
    const finish = (outcomes: AlphabetOutcome[]) => {
        if (!currentStudent || finishing.current) return; finishing.current = true;
        const session: AlphabetSession = { version: 1, id: sessionId.current, ownerId: currentStudent.id, activity, level, seed, startedAt: new Date(Date.now() - (performance.now() - started.current)).toISOString(), seconds: (performance.now() - started.current) / 1000, total: outcomes.length, outcomes, phase: 'complete' };
        const result = completeAlphabetPractice(currentStudent.id, session); setSaved(result.ok); setEarned(result.earned); setPhase('done');
    };
    if (phase === 'intro') return <ActivityIntro activity={activity} level={level} fixed={fixed} progress={mastery} onLevel={setLevel} onFixed={setFixed} onStart={start}/>;
    if (phase === 'done') return <GameComplete earned={earned} saved={saved} onReplay={start} onBack={onBack}/>;
    const props = { seed, level, fixed, onFinish: finish };
    return activity === 'word' ? <WordBasketGame {...props}/> : activity === 'match' ? <LetterPostGame {...props}/> : <LetterTrainGame {...props}/>;
}
