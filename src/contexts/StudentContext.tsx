import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { StudentProfile, TestResult, GameResult, AlbumImage, AchievementProgress } from '../../types';
import { getAllProfiles, saveProfiles, createProfile, updateProfile as updateProfileStorage, deleteProfile as deleteProfileStorage } from '../../services/profileService';
import { updateStats, checkAchievements, initializeStats } from '../../services/achievementService';
import { purchaseGachaSpin } from '../../services/shopService';
import { Grade } from '../../types';
import { AchievementModal } from '../components/achievements/AchievementModal';

interface StudentContextType {
    students: StudentProfile[];
    currentStudent: StudentProfile | null;
    gachaResult: { image: AlbumImage; isNew: boolean } | null;
}

interface StudentActionsType {
    addStudent: (name: string, age: number, grade: Grade, avatarId: number) => void;
    setStudent: (student: StudentProfile | null) => void;
    selectStudent: (id: string) => void;
    updateStudent: (student: StudentProfile) => void;
    deleteStudent: (id: string) => void;
    addTestResult: (result: TestResult, gachaImage?: AlbumImage, typingScore?: number) => void;
    addGameResult: (result: GameResult, gachaImage?: AlbumImage) => void;
    setGachaResult: (result: { image: AlbumImage; isNew: boolean } | null) => void;
    buyAvatar: (avatarId: string, cost: number) => void;
    buyTheme: (themeId: string, cost: number) => void;
    buyPhoto: (imageId: string, cost: number, rarity: string) => void;
    spinGacha: () => void;
    readFact: (category: string) => void;
    solveRiddle: (category: string, difficulty: string) => void;
    updateTypingScore: (score: number) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);
const StudentActionsContext = createContext<StudentActionsType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
    const [gachaResult, setGachaResult] = useState<{ image: AlbumImage; isNew: boolean } | null>(null);
    const [achievementQueue, setAchievementQueue] = useState<AchievementProgress[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        const loaded = getAllProfiles();
        setStudents(loaded);
        if (loaded.length > 0) {
            // Auto-select first student or logic to remember last user
            // For now, let's not auto-select to allow profile selection screen
        }
    }, []);

    // Save to localStorage whenever students change
    useEffect(() => {
        if (students.length > 0) {
            saveProfiles(students);
        }
    }, [students]);

    const currentStudent = students.find(s => s.id === currentStudentId) || null;

    const setStudent = useCallback((student: StudentProfile | null) => {
        setCurrentStudentId(student ? student.id : null);
    }, []);

    const selectStudent = useCallback((id: string) => {
        setCurrentStudentId(id);
    }, []);

    const addStudent = useCallback((name: string, age: number, grade: Grade, avatarId: number) => {
        // Convert avatarId to string if needed, or use a mapping. 
        // Assuming avatarId passed here is legacy number, but createProfile expects string ID.
        // We'll just pass it as string for now or let createProfile handle default.
        const newStudent = createProfile(name, grade, age, `avatar_${avatarId}`);
        setStudents(prev => [...prev, newStudent]);
        setCurrentStudentId(newStudent.id);
    }, []);

    const updateStudent = useCallback((updated: StudentProfile) => {
        setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    }, []);

    const deleteStudent = useCallback((id: string) => {
        setStudents(prev => prev.filter(s => s.id !== id));
        if (currentStudentId === id) setCurrentStudentId(null);
    }, [currentStudentId]);

    const addTestResult = useCallback((result: TestResult, gachaImage?: AlbumImage, typingScore?: number) => {
        if (!currentStudent) return;

        let updatedStudent = { ...currentStudent };

        // 1. Update History
        updatedStudent.history = [...updatedStudent.history, result];

        // 2. Update Stats
        if (!updatedStudent.stats) updatedStudent.stats = initializeStats(updatedStudent);
        updatedStudent.stats = updateStats(updatedStudent.stats, { type: 'TEST_COMPLETE', testResult: result });

        if (typingScore !== undefined && typingScore > 0) {
            updatedStudent.stats = updateStats(updatedStudent.stats, { type: 'TYPING_SCORE', score: typingScore });
        }

        if (gachaImage) {
            // Check if new
            const isNew = !updatedStudent.ownedImageIds.includes(gachaImage.id);
            if (isNew) {
                updatedStudent.ownedImageIds = [...updatedStudent.ownedImageIds, gachaImage.id];
                updatedStudent.stats = updateStats(updatedStudent.stats, {
                    type: 'GAIN_CARD',
                    isLegendary: gachaImage.rarity === 'legendary',
                    isNew: true,
                    totalCards: updatedStudent.ownedImageIds.length
                });
            } else {
                // Duplicate reward (handled in component usually, but we can add stars here if needed)
                // For now assuming component handles star calculation including duplicate bonus
            }
        }

        // 3. Check Achievements
        const { unlocked, rewards, updatedAchievements } = checkAchievements(updatedStudent);

        updatedStudent.achievements = updatedAchievements;
        updatedStudent.stars += (result.starsEarned || 0) + rewards;

        if (unlocked.length > 0) {
            setAchievementQueue(prev => [...prev, ...unlocked]);
        }

        updateStudent(updatedStudent);
    }, [currentStudent, updateStudent]);

    const addGameResult = useCallback((result: GameResult, gachaImage?: AlbumImage) => {
        if (!currentStudent) return;

        let updatedStudent = { ...currentStudent };

        // 1. Update Game History
        updatedStudent.gameHistory = [...updatedStudent.gameHistory, result];

        // 2. Update Stats
        if (!updatedStudent.stats) updatedStudent.stats = initializeStats(updatedStudent);
        updatedStudent.stats = updateStats(updatedStudent.stats, { type: 'GAME_COMPLETE', gameResult: result });

        if (gachaImage) {
            // Check if new
            const isNew = !updatedStudent.ownedImageIds.includes(gachaImage.id);
            if (isNew) {
                updatedStudent.ownedImageIds = [...updatedStudent.ownedImageIds, gachaImage.id];
                updatedStudent.stats = updateStats(updatedStudent.stats, {
                    type: 'GAIN_CARD',
                    isLegendary: gachaImage.rarity === 'legendary',
                    isNew: true,
                    totalCards: updatedStudent.ownedImageIds.length
                });
            }
        }

        // 3. Check Achievements
        const { unlocked, rewards, updatedAchievements } = checkAchievements(updatedStudent);

        updatedStudent.achievements = updatedAchievements;
        updatedStudent.stars += result.starsEarned + rewards;

        if (unlocked.length > 0) {
            setAchievementQueue(prev => [...prev, ...unlocked]);
        }

        updateStudent(updatedStudent);
    }, [currentStudent, updateStudent]);

    const buyAvatar = useCallback((avatarId: string, cost: number) => {
        if (!currentStudent) return;
        if (currentStudent.stars < cost) return;
        if (currentStudent.ownedAvatarIds.includes(avatarId)) return;

        let updatedStudent = { ...currentStudent };
        updatedStudent.stars -= cost;
        updatedStudent.ownedAvatarIds = [...updatedStudent.ownedAvatarIds, avatarId];

        // Update Stats
        if (!updatedStudent.stats) updatedStudent.stats = initializeStats(updatedStudent);
        updatedStudent.stats = updateStats(updatedStudent.stats, { type: 'SPEND_STARS', amount: cost });
        updatedStudent.stats = updateStats(updatedStudent.stats, {
            type: 'BUY_AVATAR',
            totalOwned: updatedStudent.ownedAvatarIds.length
        });

        // Check Achievements
        const { unlocked, rewards, updatedAchievements } = checkAchievements(updatedStudent);
        updatedStudent.achievements = updatedAchievements;
        updatedStudent.stars += rewards;

        if (unlocked.length > 0) {
            setAchievementQueue(prev => [...prev, ...unlocked]);
        }

        updateStudent(updatedStudent);
    }, [currentStudent, updateStudent]);

    const buyTheme = useCallback((themeId: string, cost: number) => {
        if (!currentStudent) return;
        if (currentStudent.stars < cost) return;
        if (currentStudent.ownedThemeIds.includes(themeId)) return;

        let updatedStudent = { ...currentStudent };
        updatedStudent.stars -= cost;
        updatedStudent.ownedThemeIds = [...updatedStudent.ownedThemeIds, themeId];

        // Update Stats
        if (!updatedStudent.stats) updatedStudent.stats = initializeStats(updatedStudent);
        updatedStudent.stats = updateStats(updatedStudent.stats, { type: 'SPEND_STARS', amount: cost });
        updatedStudent.stats = updateStats(updatedStudent.stats, {
            type: 'BUY_THEME',
            totalOwned: updatedStudent.ownedThemeIds.length
        });

        // Check Achievements
        const { unlocked, rewards, updatedAchievements } = checkAchievements(updatedStudent);
        updatedStudent.achievements = updatedAchievements;
        updatedStudent.stars += rewards;

        if (unlocked.length > 0) {
            setAchievementQueue(prev => [...prev, ...unlocked]);
        }

        updateStudent(updatedStudent);
    }, [currentStudent, updateStudent]);

    const buyPhoto = useCallback((imageId: string, cost: number, rarity: string) => {
        if (!currentStudent) return;
        if (currentStudent.stars < cost) return;
        if (currentStudent.ownedImageIds.includes(imageId)) return;

        let updatedStudent = { ...currentStudent };
        updatedStudent.stars -= cost;
        updatedStudent.ownedImageIds = [...updatedStudent.ownedImageIds, imageId];

        if (updatedStudent.shopDailyPhotos) {
            updatedStudent.shopDailyPhotos = updatedStudent.shopDailyPhotos.map(p =>
                p.imageId === imageId ? { ...p, isBought: true } : p
            );
        }

        // Update Stats
        if (!updatedStudent.stats) updatedStudent.stats = initializeStats(updatedStudent);
        updatedStudent.stats = updateStats(updatedStudent.stats, { type: 'SPEND_STARS', amount: cost });

        updatedStudent.stats = updateStats(updatedStudent.stats, {
            type: 'GAIN_CARD',
            isLegendary: rarity === 'legendary',
            isNew: true,
            totalCards: updatedStudent.ownedImageIds.length
        });

        // Check Achievements
        const { unlocked, rewards, updatedAchievements } = checkAchievements(updatedStudent);
        updatedStudent.achievements = updatedAchievements;
        updatedStudent.stars += rewards;

        if (unlocked.length > 0) {
            setAchievementQueue(prev => [...prev, ...unlocked]);
        }

        updateStudent(updatedStudent);
    }, [currentStudent, updateStudent]);

    const spinGacha = useCallback(() => {
        if (!currentStudent) return;

        const result = purchaseGachaSpin(currentStudent);
        if (!result) return; // Not enough stars or error

        let updatedStudent = result.updatedProfile;
        const gachaResult = result.gachaResult;

        // Update Stats
        if (!updatedStudent.stats) updatedStudent.stats = initializeStats(updatedStudent);
        updatedStudent.stats = updateStats(updatedStudent.stats, { type: 'SPEND_STARS', amount: 50 });
        updatedStudent.stats = updateStats(updatedStudent.stats, {
            type: 'GAIN_CARD',
            isLegendary: gachaResult.image.rarity === 'legendary',
            isNew: gachaResult.isNew,
            totalCards: updatedStudent.ownedImageIds.length
        });

        // Check Achievements
        const { unlocked, rewards, updatedAchievements } = checkAchievements(updatedStudent);
        updatedStudent.achievements = updatedAchievements;
        updatedStudent.stars += rewards;

        if (unlocked.length > 0) {
            setAchievementQueue(prev => [...prev, ...unlocked]);
        }

        updateStudent(updatedStudent);
        setGachaResult(gachaResult);
    }, [currentStudent, updateStudent]);

    const readFact = useCallback((category: string) => {
        if (!currentStudent) return;

        let updatedStudent = { ...currentStudent };

        // Update Stats
        if (!updatedStudent.stats) updatedStudent.stats = initializeStats(updatedStudent);
        updatedStudent.stats = updateStats(updatedStudent.stats, { type: 'READ_FACT', category });

        // Check Achievements
        const { unlocked, rewards, updatedAchievements } = checkAchievements(updatedStudent);
        updatedStudent.achievements = updatedAchievements;
        updatedStudent.stars += rewards;

        if (unlocked.length > 0) {
            setAchievementQueue(prev => [...prev, ...unlocked]);
        }

        updateStudent(updatedStudent);
    }, [currentStudent, updateStudent]);

    const solveRiddle = useCallback((category: string, difficulty: string) => {
        if (!currentStudent) return;

        let updatedStudent = { ...currentStudent };

        // Update Stats
        if (!updatedStudent.stats) updatedStudent.stats = initializeStats(updatedStudent);
        updatedStudent.stats = updateStats(updatedStudent.stats, { type: 'SOLVE_RIDDLE', category, difficulty });

        // Check Achievements
        const { unlocked, rewards, updatedAchievements } = checkAchievements(updatedStudent);
        updatedStudent.achievements = updatedAchievements;
        updatedStudent.stars += rewards;

        if (unlocked.length > 0) {
            setAchievementQueue(prev => [...prev, ...unlocked]);
        }

        updateStudent(updatedStudent);
    }, [currentStudent, updateStudent]);

    const updateTypingScore = useCallback((score: number) => {
        if (!currentStudent) return;

        let updatedStudent = { ...currentStudent };

        // Update Stats
        if (!updatedStudent.stats) updatedStudent.stats = initializeStats(updatedStudent);
        updatedStudent.stats = updateStats(updatedStudent.stats, { type: 'TYPING_SCORE', score });

        // Check Achievements
        const { unlocked, rewards, updatedAchievements } = checkAchievements(updatedStudent);
        updatedStudent.achievements = updatedAchievements;
        updatedStudent.stars += rewards;

        if (unlocked.length > 0) {
            setAchievementQueue(prev => [...prev, ...unlocked]);
        }

        updateStudent(updatedStudent);
    }, [currentStudent, updateStudent]);

    const handleCloseAchievementModal = () => {
        setAchievementQueue(prev => prev.slice(1));
    };

    const actions: StudentActionsType = {
        addStudent,
        setStudent,
        selectStudent,
        updateStudent,
        deleteStudent,
        addTestResult,
        addGameResult,
        setGachaResult,
        buyAvatar,
        buyTheme,
        buyPhoto,
        spinGacha,
        readFact,
        solveRiddle,
        updateTypingScore
    };

    const contextValue: StudentContextType = {
        students,
        currentStudent,
        gachaResult
    };

    return (
        <StudentContext.Provider value={contextValue}>
            <StudentActionsContext.Provider value={actions}>
                {children}
                {achievementQueue.length > 0 && (
                    <AchievementModal
                        achievement={achievementQueue[0]}
                        onClose={handleCloseAchievementModal}
                    />
                )}
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
