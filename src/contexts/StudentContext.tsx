import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { persistMission } from '../../games/KidCoder/progress/progress';
import { persistMemory } from '../../games/MemoryMatch/progress/progress';
import { persistSound, persistComposition, clearSoundProfileData } from '../../games/SoundMemory/progress/progress';
import type { SoundSession } from '../../games/SoundMemory/engine/game';
import type { CompositionAction } from '../../games/SoundMemory/studio/model';
import type { MemorySession } from '../../games/MemoryMatch/engine/model';
import type { Mission, ProgramNode } from '../../games/KidCoder/engine/model';
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
    addStudent: (name: string, grade: Grade, age?: number, avatarId?: string) => void;
    setStudent: (student: StudentProfile | null) => void;
    selectStudent: (id: string) => void;
    updateStudent: (student: StudentProfile) => void;
    deleteStudent: (id: string) => void;
    addTestResult: (result: TestResult, gachaImage?: AlbumImage, typingScore?: number) => void;
    addGameResult: (result: GameResult, gachaImage?: AlbumImage) => void;
    completeKidCoder: (studentId: string, mission: Mission, program: ProgramNode[], seconds: number) => { ok: boolean; earned: number };
    completeMemoryGame: (studentId: string, session: MemorySession) => { ok: boolean; earned: number; bonusStars?: number; achievementNames?: string[] };
    completeSoundGame: (studentId: string, session: SoundSession) => { ok: boolean; earned: number; bonusStars?: number; achievementNames?: string[] };
    saveSoundComposition: (studentId: string, action: CompositionAction) => { ok: boolean; error?: string };
    setGachaResult: (result: { image: AlbumImage; isNew: boolean } | null) => void;
    /** Centralized function to save gacha card. Called when GachaModal closes. */
    saveGachaCard: (imageId: string, isNew: boolean) => void;
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
    const [students, setStudentsState] = useState<StudentProfile[]>([]);
    // Synchronous snapshot also protects two completion callbacks before React's next render.
    const studentsRef = useRef<StudentProfile[]>([]);
    const persistedRef = useRef<StudentProfile[] | null>(null);
    const setStudents = useCallback((action: React.SetStateAction<StudentProfile[]>) => {
        const next = typeof action === 'function' ? action(studentsRef.current) : action;
        studentsRef.current = next;
        setStudentsState(next);
    }, []);
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
        if (students.length > 0 && students === studentsRef.current && students !== persistedRef.current) {
            saveProfiles(students);
            persistedRef.current = students;
        }
    }, [students]);

    const currentStudent = students.find(s => s.id === currentStudentId) || null;

    const completeKidCoder = useCallback((studentId: string, mission: Mission, program: ProgramNode[], seconds: number) => {
        if (studentId !== currentStudentId) return { ok: false, earned: 0 };
        const snapshot = studentsRef.current;
        const result = persistMission(snapshot, studentId, mission, program, seconds, saveProfiles);
        if (!result.ok) return { ok: false, earned: 0 };
        if (result.profiles !== snapshot) { persistedRef.current = result.profiles; setStudents(result.profiles); }
        if (result.unlocked.length) setAchievementQueue(prev => [...prev, ...result.unlocked]);
        return { ok: true, earned: result.earned };
    }, [currentStudentId, setStudents]);

    const completeMemoryGame = useCallback((studentId:string,session:MemorySession) => {
        if(studentId!==currentStudentId)return {ok:false,earned:0};
        const snapshot=studentsRef.current,result=persistMemory(snapshot,studentId,session,saveProfiles);
        if(!result.ok)return {ok:false,earned:0};
        if(result.profiles!==snapshot){persistedRef.current=result.profiles;setStudents(result.profiles);}
        // The game's result panel presents these awards together, without a second modal.
        return {ok:true,earned:result.earned,bonusStars:result.bonusStars,achievementNames:result.achievementNames};
    },[currentStudentId,setStudents]);

    const completeSoundGame = useCallback((studentId: string, session: SoundSession) => {
        if (studentId !== currentStudentId) return { ok: false, earned: 0 };
        const snapshot = studentsRef.current, result = persistSound(snapshot, studentId, session, saveProfiles);
        if (!result.ok) return { ok: false, earned: 0 };
        if (result.profiles !== snapshot) { persistedRef.current = result.profiles; setStudents(result.profiles); }
        return { ok: true, earned: result.earned, bonusStars: result.bonusStars, achievementNames: result.achievementNames };
    }, [currentStudentId, setStudents]);

    const saveSoundComposition = useCallback((studentId: string, action: CompositionAction) => {
        if (studentId !== currentStudentId) return { ok: false, error: 'Hồ sơ đã thay đổi.' };
        const result = persistComposition(studentsRef.current, studentId, action, saveProfiles);
        if (!result.ok) return { ok: false, error: result.error };
        persistedRef.current = result.profiles; setStudents(result.profiles);
        return { ok: true };
    }, [currentStudentId, setStudents]);

    const setStudent = useCallback((student: StudentProfile | null) => {
        setCurrentStudentId(student ? student.id : null);
    }, []);

    const selectStudent = useCallback((id: string) => {
        setCurrentStudentId(id);
    }, []);

    const addStudent = useCallback((name: string, grade: Grade, age?: number, avatarId?: string) => {
        const newStudent = createProfile(name, grade, age, avatarId);
        setStudents(prev => [...prev, newStudent]);
        // We don't auto-select here to let the user choose from the list
        // setCurrentStudentId(newStudent.id); 
    }, []);

    const updateStudent = useCallback((updated: StudentProfile) => {
        setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
    }, []);

    const deleteStudent = useCallback((id: string) => {
        clearSoundProfileData(id);
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
                // Duplicate card - award 10 bonus stars
                updatedStudent.stars += 10;
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
            } else {
                // Duplicate card - award 10 bonus stars
                updatedStudent.stars += 10;
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

    // Centralized function to save gacha card - called when GachaModal closes
    const saveGachaCard = useCallback((imageId: string, isNew: boolean) => {
        if (!currentStudent) return;

        let updatedStudent = { ...currentStudent };

        if (isNew) {
            // New card - add to collection
            if (!updatedStudent.ownedImageIds.includes(imageId)) {
                updatedStudent.ownedImageIds = [...updatedStudent.ownedImageIds, imageId];

                // Update stats
                if (!updatedStudent.stats) updatedStudent.stats = initializeStats(updatedStudent);
                updatedStudent.stats = updateStats(updatedStudent.stats, {
                    type: 'GAIN_CARD',
                    isLegendary: false, // We don't have rarity info here, stats already updated elsewhere if needed
                    isNew: true,
                    totalCards: updatedStudent.ownedImageIds.length
                });
            }
        } else {
            // Duplicate card - award 10 bonus stars
            updatedStudent.stars += 10;
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
        completeKidCoder,
        completeMemoryGame,
        completeSoundGame,
        saveSoundComposition,
        setGachaResult,
        saveGachaCard,
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
