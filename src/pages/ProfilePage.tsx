import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { UserProfileScreen } from '@/src/components/UserProfileScreen';

export function ProfilePage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { updateStudent, deleteStudent } = useStudentActions();

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    const handleBack = () => {
        navigate('/mode');
    };

    const handleOpenAlbum = () => {
        navigate('/album');
    };

    const handleDelete = () => {
        deleteStudent(currentStudent.id);
        navigate('/');
    };

    return (
        <UserProfileScreen
            student={currentStudent}
            onUpdateProfile={updateStudent}
            onBack={handleBack}
            onOpenAlbum={handleOpenAlbum}
            onDelete={handleDelete}
        />
    );
}
