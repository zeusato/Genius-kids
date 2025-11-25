import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { TellMeWhyScreen } from '@/tellMeWhy/TellMeWhyScreen';

export function TellMeWhyPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { updateStudent } = useStudentActions();

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    const handleBack = () => {
        navigate('/mode');
    };

    const handleUpdateStars = (newStars: number) => {
        updateStudent({ ...currentStudent, stars: newStars });
    };

    return (
        <TellMeWhyScreen
            student={currentStudent}
            onBack={handleBack}
            onUpdateStars={handleUpdateStars}
        />
    );
}
