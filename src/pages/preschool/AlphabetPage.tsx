import React from 'react';
import { ALPHABET_DATA } from '@/src/data/alphabetData';
import { PreschoolShell } from '@/src/components/preschool/PreschoolShell';
import { usePreschoolActivity } from '@/src/components/preschool/usePreschoolActivity';
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

export function AlphabetPage() {
    const { activity, setActivity, back } = usePreschoolActivity('alphabet');

    return (
        <PreschoolShell topic="alphabet" activity={activity} onPick={setActivity} onBack={back}>
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
