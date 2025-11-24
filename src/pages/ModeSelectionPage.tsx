import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { ModeSelectionScreen } from '@/src/components/ModeSelectionScreen';

export function ModeSelectionPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { setStudent } = useStudentActions();

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    const handleSelectMode = (mode: 'study' | 'game' | 'profile' | 'shop') => {
        if (mode === 'study') navigate('/study');
        else if (mode === 'game') navigate('/game');
        else if (mode === 'profile') navigate('/profile');
        else if (mode === 'shop') navigate('/shop');
    };

    const handleLogout = () => {
        setStudent(null);
        navigate('/');
    };

    return (
        <ModeSelectionScreen
            student={currentStudent}
            onSelectMode={handleSelectMode}
            onLogout={handleLogout}
        />
    );
}
