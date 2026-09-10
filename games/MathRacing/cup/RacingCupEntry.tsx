import React from 'react';
import { useStudent, useStudentActions } from '../../../src/contexts/StudentContext';
import { useMusicControls } from '../../../src/contexts/MusicContext';
import { RacingCup } from './RacingCup';
import type { Difficulty } from './model';
export default function RacingCupEntry({ difficulty, onExit, onLegacy }: { difficulty?: Difficulty; onExit: () => void; onLegacy?: () => void }) {
    const { currentStudent } = useStudent(), { completeRacingGame } = useStudentActions(), controls = useMusicControls();
    if (!currentStudent) return <div role="status">Chọn hồ sơ học sinh để bắt đầu.</div>;
    return <RacingCup key={currentStudent.id} student={currentStudent} difficulty={difficulty} complete={completeRacingGame} onBack={onExit} onLegacy={onLegacy} soundEnabled={controls.soundEnabled} toggleSound={controls.toggleSound}/>;
}
