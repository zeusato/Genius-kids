import React from 'react';
import { PreschoolShell } from '@/src/components/preschool/PreschoolShell';
import { usePreschoolActivity } from '@/src/components/preschool/usePreschoolActivity';
import { AlphabetGarden } from '@/src/components/preschool/AlphabetGarden';
import { AlphabetPracticeGame } from '@/src/components/preschool/alphabet-games/AlphabetPracticeGame';

export function AlphabetPage() {
    const { activity, setActivity, back } = usePreschoolActivity('alphabet');

    return (
        <PreschoolShell topic="alphabet" activity={activity} onPick={setActivity} onBack={back}>
            {activity === 'learn' && (
                <AlphabetGarden onBack={back} />
            )}
            {activity === 'pick' && (
                <AlphabetPracticeGame activity="pick" onBack={back} />
            )}
            {activity === 'match' && (
                <AlphabetPracticeGame activity="match" onBack={back} />
            )}
            {activity === 'word' && (
                <AlphabetPracticeGame activity="word" onBack={back} />
            )}
        </PreschoolShell>
    );
}
