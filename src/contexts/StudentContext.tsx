import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StudentProfile, TestResult, GameResult, AlbumImage } from '@/types';
import { updateProfile as updateProfileStorage, deleteProfile as deleteProfileStorage } from '@/services/profileService';

interface StudentContextType {
    currentStudent: StudentProfile | null;
    gachaResult: { image: AlbumImage; isNew: boolean } | null;
}

interface StudentActionsType {
    setStudent: (student: StudentProfile | null) => void;
    updateStudent: (student: StudentProfile) => void;
    deleteStudent: (id: string) => void;
    addTestResult: (result: TestResult) => void;
    addGameResult: (result: GameResult) => void;
    setGachaResult: (result: { image: AlbumImage; isNew: boolean } | null) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);
const StudentActionsContext = createContext<StudentActionsType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
    const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
    const [gachaResult, setGachaResult] = useState<{ image: AlbumImage; isNew: boolean } | null>(null);

    const setStudent = useCallback((student: StudentProfile | null) => {
        setCurrentStudent(student);
    }, []);

    const updateStudent = useCallback((student: StudentProfile) => {
        setCurrentStudent(student);
        updateProfileStorage(student);
    }, []);

    const deleteStudent = useCallback((id: string) => {
        deleteProfileStorage(id);
        setCurrentStudent(null);
    }, []);

    const addTestResult = useCallback((result: TestResult) => {
        if (!currentStudent) return;
        const updated = {
            ...currentStudent,
            history: [...currentStudent.history, result]
        };
        setCurrentStudent(updated);
        updateProfileStorage(updated);
    }, [currentStudent]);

    const addGameResult = useCallback((result: GameResult) => {
        if (!currentStudent) return;
        const updated = {
            ...currentStudent,
            gameHistory: [...currentStudent.gameHistory, result]
        };
        setCurrentStudent(updated);
        updateProfileStorage(updated);
    }, [currentStudent]);

    const actions: StudentActionsType = {
        setStudent,
        updateStudent,
        deleteStudent,
        addTestResult,
        addGameResult,
        setGachaResult
    };

    return (
        <StudentContext.Provider value={{ currentStudent, gachaResult }}>
            <StudentActionsContext.Provider value={actions}>
                {children}
            </StudentActionsContext.Provider>
        </StudentContext.Provider>
    );
}

export function useStudent() {
    const context = useContext(StudentContext);
    if (context === undefined) {
        throw new Error('useStudent must be used within StudentProvider');
    }
    return context;
}

export function useStudentActions() {
    const context = useContext(StudentActionsContext);
    if (context === undefined) {
        throw new Error('useStudentActions must be used within StudentProvider');
    }
    return context;
}
