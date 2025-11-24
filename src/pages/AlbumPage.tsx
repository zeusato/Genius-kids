import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '@/src/contexts/StudentContext';
import { AlbumScreen } from '@/src/components/AlbumScreen';

export function AlbumPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    const handleBack = () => {
        navigate('/profile');
    };

    return <AlbumScreen student={currentStudent} onBack={handleBack} />;
}
