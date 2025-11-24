import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useStudent } from '@/src/contexts/StudentContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { currentStudent } = useStudent();

    if (!currentStudent) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
