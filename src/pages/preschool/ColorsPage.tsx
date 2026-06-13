import React, { useState } from 'react';
import { COLORS_DATA } from '@/src/data/colorsData';
import { PreschoolShell, ActivityHub, type ActivityDef } from '@/src/components/preschool/PreschoolShell';
import { FlashcardDeck } from '@/src/components/preschool/FlashcardDeck';
import { ListenAndPick } from '@/src/components/preschool/ListenAndPick';
import { ColoringActivity } from '@/src/components/preschool/ColoringActivity';
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

const ACTIVITIES: ActivityDef[] = [
    { id: 'learn', title: 'Học màu sắc', desc: 'Chạm ô màu, nghe tên màu', emoji: '🌈', gradient: 'from-fuchsia-500 to-violet-500' },
    { id: 'pick', title: 'Nghe và chọn màu', desc: 'Nghe rồi chạm đúng màu', emoji: '👂', gradient: 'from-violet-500 to-purple-500' },
    { id: 'color', title: 'Tô màu theo yêu cầu', desc: 'Tô hình đúng màu cô đọc', emoji: '🎨', gradient: 'from-pink-500 to-fuchsia-500' },
    { id: 'shapes', title: 'Học hình dạng', desc: 'Tròn, vuông, tam giác... chọn đúng hình', emoji: '🔷', gradient: 'from-violet-500 to-indigo-500' },
];

export function ColorsPage() {
    const [activity, setActivity] = useState<string | null>(null);
    const back = () => setActivity(null);

    return (
        <PreschoolShell
            title="Màu Sắc – Hình Dạng"
            subtitle={activity ? undefined : 'Chọn một hoạt động để bắt đầu nào!'}
            bg="from-fuchsia-100 via-violet-50 to-pink-50"
            onBack={activity ? back : undefined}
        >
            {!activity && <ActivityHub activities={ACTIVITIES} onPick={setActivity} />}
            {activity === 'learn' && (
                <FlashcardDeck tokens={learnTokens} cardGradient="from-fuchsia-50 to-white" onBack={back} />
            )}
            {activity === 'pick' && (
                <ListenAndPick tokens={quizTokens} instructionVi="Hãy chọn màu" gameType={GAME_TYPE} onBack={back} />
            )}
            {activity === 'color' && (
                <ColoringActivity colors={COLORS_DATA} rounds={5} gameType={GAME_TYPE} onBack={back} />
            )}
            {activity === 'shapes' && (
                <ShapeGame rounds={10} gameType="preschool-shapes" onBack={back} />
            )}
        </PreschoolShell>
    );
}
