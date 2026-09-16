import React from 'react';
import { COUNTING_DATA } from '@/src/data/countingData';
import { PreschoolShell } from '@/src/components/preschool/PreschoolShell';
import { usePreschoolActivity } from '@/src/components/preschool/usePreschoolActivity';
import { FlashcardDeck } from '@/src/components/preschool/FlashcardDeck';
import { ListenAndPick } from '@/src/components/preschool/ListenAndPick';
import { CountObjects } from '@/src/components/preschool/CountObjects';
import { AdditionGame } from '@/src/components/preschool/AdditionGame';
import { CompareGame } from '@/src/components/preschool/CompareGame';
import type { PreschoolToken } from '@/src/components/preschool/types';

const GAME_TYPE = 'preschool-counting';

const learnTokens: PreschoolToken[] = COUNTING_DATA.map(n => ({
    id: n.id,
    kind: 'count',
    big: String(n.value),
    emoji: n.emoji,
    count: n.value,
    enText: n.enName,
    viText: n.viName,
    label: `${n.enName} – ${n.viName}`,
}));

const quizTokens: PreschoolToken[] = COUNTING_DATA.map(n => ({
    id: n.id,
    kind: 'text',
    big: String(n.value),
    enText: n.enName,
    viText: n.viName,
}));

export function CountingPage() {
    const { activity, setActivity, back } = usePreschoolActivity('counting');

    return (
        <PreschoolShell topic="counting" activity={activity} onPick={setActivity} onBack={back}>
            {activity === 'learn' && (
                <FlashcardDeck tokens={learnTokens} cardGradient="from-teal-50 to-white" onBack={back} />
            )}
            {activity === 'count' && (
                <CountObjects items={COUNTING_DATA} rounds={6} gameType={GAME_TYPE} onBack={back} />
            )}
            {activity === 'pick' && (
                <ListenAndPick tokens={quizTokens} instructionVi="Hãy chọn số" gameType={GAME_TYPE} onBack={back} />
            )}
            {activity === 'add' && (
                <AdditionGame rounds={12} gameType="preschool-addition" onBack={back} />
            )}
            {activity === 'compare' && (
                <CompareGame rounds={12} gameType="preschool-compare" onBack={back} />
            )}
        </PreschoolShell>
    );
}
