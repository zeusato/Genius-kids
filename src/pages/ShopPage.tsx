import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { ShopScreen } from '@/src/components/ShopScreen';

export function ShopPage() {
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

    return (
        <ShopScreen
            student={currentStudent}
            onUpdateProfile={updateStudent}
            onBack={handleBack}
        />
    );
}
