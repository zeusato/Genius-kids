import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { TellMeWhyScreen } from '@/tellMeWhy/TellMeWhyScreen';

export function TellMeWhyPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { updateStudent, readFact } = useStudentActions();

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    const handleBack = () => {
        navigate('/library');
    };

    const handleUpdateStars = (newStars: number) => {
        updateStudent({ ...currentStudent, stars: newStars });
    };

    return (
        <TellMeWhyScreen
            student={currentStudent}
            onBack={handleBack}
            onUpdateStars={handleUpdateStars}
            onReadFact={readFact}
        />
    );
}
