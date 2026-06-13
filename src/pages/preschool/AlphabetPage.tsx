import React, { useState } from 'react';
import { ALPHABET_DATA } from '@/src/data/alphabetData';
import { PreschoolShell, ActivityHub, type ActivityDef } from '@/src/components/preschool/PreschoolShell';
import { FlashcardDeck } from '@/src/components/preschool/FlashcardDeck';
import { ListenAndPick } from '@/src/components/preschool/ListenAndPick';
import { MatchPairs, type MatchPair } from '@/src/components/preschool/MatchPairs';
import { WordStartGame } from '@/src/components/preschool/WordStartGame';
import type { PreschoolToken } from '@/src/components/preschool/types';

const GAME_TYPE = 'preschool-alphabet';

const learnTokens: PreschoolToken[] = ALPHABET_DATA.map(l => ({
    id: l.id,
    kind: 'text',
    big: l.upper,
    sub: l.lower,
    emoji: l.emoji,
    enText: l.upper,
    viText: l.exampleVi,
    label: `${l.exampleEn} – ${l.exampleVi}`,
    // Đọc: chữ cái (Anh) → (nghỉ) → từ minh họa (Anh) → (nghỉ) → từ minh họa (Việt).
    // KHÔNG đọc tên chữ cái bằng tiếng Việt (không ai dịch chữ cái).
    speakParts: [
        { text: l.upper, lang: 'en-US' },
        { text: l.exampleEn, lang: 'en-US' },
        { text: l.exampleVi, lang: 'vi-VN' },
    ],
}));

const quizTokens: PreschoolToken[] = ALPHABET_DATA.map(l => ({
    id: l.id,
    kind: 'text',
    big: l.upper,
    sub: l.lower,
    enText: l.upper,
    viText: `chữ ${l.upper}`,
}));

const matchPairs: MatchPair[] = ALPHABET_DATA.map(l => ({
    id: l.id,
    left: { id: l.id + '-U', kind: 'text', big: l.upper, enText: l.upper, viText: `chữ ${l.upper}` },
    right: { id: l.id + '-L', kind: 'text', big: l.lower, enText: l.lower, viText: `chữ ${l.upper}` },
}));

const ACTIVITIES: ActivityDef[] = [
    { id: 'learn', title: 'Học bảng chữ cái', desc: 'Lật thẻ A–Z, nghe phát âm', emoji: '📖', gradient: 'from-pink-500 to-rose-500' },
    { id: 'pick', title: 'Nghe và chọn chữ', desc: 'Nghe rồi chạm đúng chữ', emoji: '👂', gradient: 'from-rose-500 to-fuchsia-500' },
    { id: 'match', title: 'Ghép chữ hoa – thường', desc: 'Nối chữ A với chữ a', emoji: '🧩', gradient: 'from-fuchsia-500 to-purple-500' },
    { id: 'word', title: 'Từ bắt đầu bằng chữ...', desc: 'Chọn từ theo chữ cái, chạm để nghe', emoji: '🔤', gradient: 'from-purple-500 to-indigo-500' },
];

export function AlphabetPage() {
    const [activity, setActivity] = useState<string | null>(null);
    const back = () => setActivity(null);

    return (
        <PreschoolShell
            title="Bảng Chữ Cái Tiếng Anh"
            subtitle={activity ? undefined : 'Chọn một hoạt động để bắt đầu nào!'}
            bg="from-pink-100 via-rose-50 to-orange-50"
            onBack={activity ? back : undefined}
        >
            {!activity && <ActivityHub activities={ACTIVITIES} onPick={setActivity} />}
            {activity === 'learn' && (
                <FlashcardDeck tokens={learnTokens} cardGradient="from-pink-50 to-white" onBack={back} />
            )}
            {activity === 'pick' && (
                <ListenAndPick tokens={quizTokens} instructionVi="Hãy chọn chữ" gameType={GAME_TYPE} onBack={back} />
            )}
            {activity === 'match' && (
                <MatchPairs pairs={matchPairs} pairCount={5} instructionVi="Hãy ghép chữ hoa với chữ thường!" gameType={GAME_TYPE} onBack={back} />
            )}
            {activity === 'word' && (
                <WordStartGame rounds={10} gameType="preschool-word" onBack={back} />
            )}
        </PreschoolShell>
    );
}
