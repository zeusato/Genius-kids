import React, { useState } from 'react';
import { COUNTING_DATA } from '@/src/data/countingData';
import { PreschoolShell, ActivityHub, type ActivityDef } from '@/src/components/preschool/PreschoolShell';
import { FlashcardDeck } from '@/src/components/preschool/FlashcardDeck';
import { ListenAndPick } from '@/src/components/preschool/ListenAndPick';
import { CountObjects } from '@/src/components/preschool/CountObjects';
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

const ACTIVITIES: ActivityDef[] = [
    { id: 'learn', title: 'Học đếm 1 đến 10', desc: 'Nhìn số, đếm vật, nghe đọc', emoji: '🔢', gradient: 'from-teal-500 to-emerald-500' },
    { id: 'count', title: 'Đếm đồ vật', desc: 'Đếm rồi chọn số đúng', emoji: '🐟', gradient: 'from-emerald-500 to-green-500' },
    { id: 'pick', title: 'Nghe và chọn số', desc: 'Nghe rồi chạm đúng số', emoji: '👂', gradient: 'from-cyan-500 to-teal-500' },
];

export function CountingPage() {
    const [activity, setActivity] = useState<string | null>(null);
    const back = () => setActivity(null);

    return (
        <PreschoolShell
            title="Số Đếm Tiếng Anh – Việt"
            subtitle={activity ? undefined : 'Chọn một hoạt động để bắt đầu nào!'}
            bg="from-teal-100 via-emerald-50 to-cyan-50"
            onBack={activity ? back : undefined}
        >
            {!activity && <ActivityHub activities={ACTIVITIES} onPick={setActivity} />}
            {activity === 'learn' && (
                <FlashcardDeck tokens={learnTokens} cardGradient="from-teal-50 to-white" onBack={back} />
            )}
            {activity === 'count' && (
                <CountObjects items={COUNTING_DATA} rounds={6} gameType={GAME_TYPE} onBack={back} />
            )}
            {activity === 'pick' && (
                <ListenAndPick tokens={quizTokens} instructionVi="Hãy chọn số" gameType={GAME_TYPE} onBack={back} />
            )}
        </PreschoolShell>
    );
}
