// Chỉ được mount từ sân thử DEV trong hồ sơ Chromium tạm; dùng context và route thật.
import React, { useEffect, useRef, useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StudentProvider, useStudent, useStudentActions } from '../../../contexts/StudentContext';
import { MusicProvider } from '../../../contexts/MusicContext';
import { StudyPage } from '../../../pages/StudyPage';
import { emptyProgress } from '../../../../services/study/progress';
import type { StudentProfile } from '../../../../types';

const fixture: StudentProfile = {
    id: 'learn-qa', name: 'Hồ sơ kiểm thử', age: 9, grade: 4, avatarId: 0,
    currentAvatarId: 'avatar_01', currentThemeId: 'theme_classic', stars: 24,
    ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [],
    study: { ...emptyProgress(), prefs: { tts: false } },
};

function SelectFixture() {
    const { students, currentStudent } = useStudent();
    const { setStudent, saveLesson } = useStudentActions();
    const originalSave = useRef(saveLesson);
    const [ownerCheck, setOwnerCheck] = useState('');
    useEffect(() => { if (!currentStudent && students[0]) setStudent(students[0]); }, [students, currentStudent, setStudent]);
    if (!currentStudent) return <p>Đang mở hồ sơ thử…</p>;
    return <><button data-owner-check={ownerCheck} onClick={() => {
        const owner = currentStudent.id;
        setStudent(students.find(s => s.id !== owner)!);
        const result = originalSave.current(owner, { kind: 'leave', skillId: 'g4.div10', v: 1, page: 0 });
        setOwnerCheck(result.ok ? 'accepted' : 'rejected');
    }}>Kiểm tra đổi hồ sơ</button><Routes><Route path="/study/*" element={<StudyPage />} /></Routes></>;
}

export function IntegrationPreview() {
    if (!import.meta.env.DEV) return null;
    if (!localStorage.getItem('math_profiles')) localStorage.setItem('math_profiles', JSON.stringify([fixture, { ...fixture, id: 'learn-qa-2', name: 'Hồ sơ thứ hai' }]));
    return <MemoryRouter initialEntries={['/study/learn/g4.div10']}><MusicProvider><StudentProvider><SelectFixture /></StudentProvider></MusicProvider></MemoryRouter>;
}
