import React from 'react';
import { useStudent } from '@/src/contexts/StudentContext';
import { CountingAdventure } from '@/src/components/preschool/counting/CountingAdventure';
import { ACTIVITIES, type Activity } from '@/src/components/preschool/counting/model';
import { PreschoolShell } from '@/src/components/preschool/PreschoolShell';
import { usePreschoolActivity } from '@/src/components/preschool/usePreschoolActivity';

export function CountingPage() {
    const { activity, setActivity, back } = usePreschoolActivity('counting');
    const { currentStudent } = useStudent();

    return (
        <PreschoolShell topic="counting" activity={activity} onPick={setActivity} onBack={back}>
            {currentStudent && ACTIVITIES.includes(activity as Activity) && <CountingAdventure key={`${currentStudent.id}-${activity}`} activity={activity as Activity} onBack={back}/>}
        </PreschoolShell>
    );
}
