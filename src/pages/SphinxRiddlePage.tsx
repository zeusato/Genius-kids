import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { SphinxRiddleScreen } from '@/src/components/SphinxRiddleScreen';
import { StudentProfile } from '@/types';

export const SphinxRiddlePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentStudent: selectedStudent } = useStudent();
    const { setStudent } = useStudentActions();

    const handleBack = () => {
        navigate('/mode');
    };

    const handleProfileUpdate = (updatedProfile: StudentProfile) => {
        // Update the student context with new profile data
        setStudent(updatedProfile);
    };

    if (!selectedStudent) {
        navigate('/');
        return null;
    }

    return (
        <SphinxRiddleScreen
            student={selectedStudent}
            onBack={handleBack}
            onProfileUpdate={handleProfileUpdate}
        />
    );
};
