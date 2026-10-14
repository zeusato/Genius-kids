import React from 'react';
import { Navigate } from 'react-router-dom';
import { COLORS_DATA } from '@/src/data/colorsData';
import { PreschoolShell } from '@/src/components/preschool/PreschoolShell';
import { usePreschoolActivity } from '@/src/components/preschool/usePreschoolActivity';
import { FlashcardDeck } from '@/src/components/preschool/FlashcardDeck';
import { ListenAndPick } from '@/src/components/preschool/ListenAndPick';
import { ShapeGame } from '@/src/components/preschool/ShapeGame';
import type { PreschoolToken } from '@/src/components/preschool/types';

const GAME_TYPE = 'preschool-colors';

const learnTokens: PreschoolToken[] = COLORS_DATA.map(c => ({
    id: c.id,
    kind: 'color',
    hex: c.hex,
    light: c.light,
    enText: c.enName,
    viText: `màu ${c.viName}`,
    label: `${c.enName} – ${c.viName}`,
}));

const quizTokens: PreschoolToken[] = COLORS_DATA.map(c => ({
    id: c.id,
    kind: 'color',
    hex: c.hex,
    light: c.light,
    enText: c.enName,
    viText: `màu ${c.viName}`,
}));

export function ColorsPage() {
    const { activity, setActivity, back } = usePreschoolActivity('colors');

    return (
        <PreschoolShell topic="colors" activity={activity} onPick={setActivity} onBack={back}>
            {activity === 'learn' && (
                <FlashcardDeck tokens={learnTokens} cardGradient="from-fuchsia-50 to-white" onBack={back} />
            )}
            {activity === 'pick' && (
                <ListenAndPick tokens={quizTokens} instructionVi="Hãy chọn màu" gameType={GAME_TYPE} onBack={back} />
            )}
            {activity === 'color' && (
                <Navigate to="/coloring?mode=listen" replace />
            )}
            {activity === 'shapes' && (
                <ShapeGame rounds={10} gameType="preschool-shapes" onBack={back} />
            )}
        </PreschoolShell>
    );
}
