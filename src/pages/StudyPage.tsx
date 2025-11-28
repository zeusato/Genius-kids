import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Question, TestResult, QuestionType, AlbumImage } from '@/types';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { TopicSelection } from '@/src/components/study/TopicSelection';
import { TestRunner } from '@/src/components/study/TestRunner';
import { ResultScreen } from '@/src/components/study/ResultScreen';
import { generateQuestions } from '@/services/mathEngine';
import { exportTestToPDF } from '@/utils/pdfExport';
import { processTestReward } from '@/services/rewardService';
import { soundManager } from '@/utils/sound';

export function StudyPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { updateStudent, setGachaResult, addTestResult } = useStudentActions();

    const [activeTestQuestions, setActiveTestQuestions] = useState<Question[]>([]);
    const [testDuration, setTestDuration] = useState<number>(20);
    const [lastResult, setLastResult] = useState<TestResult | null>(null);

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    const handleStartTest = (topicIds: string[], count: number) => {
        const questions = generateQuestions(topicIds, count);
        setActiveTestQuestions(questions);
        setTestDuration(count); // 1 minute per question
        navigate('/study/test');
    };

    const handleExportPDF = async (topics: string[], count: number) => {
        const questions = generateQuestions(topics, count);
        await exportTestToPDF(questions, `Bài tập toán - ${currentStudent.name}`);
    };

    const handleTestFinish = (answers: Record<string, string | string[]>, durationSeconds: number) => {
        let score = 0;
        const processedQuestions = activeTestQuestions.map(q => {
            const userAnswer = answers[q.id];
            let isCorrect = false;

            if (q.type === QuestionType.MultipleSelect) {
                const ua = Array.isArray(userAnswer) ? userAnswer.sort().toString() : "";
                const ca = q.correctAnswers ? [...q.correctAnswers].sort().toString() : "";
                isCorrect = ua === ca;
            } else if (q.type === QuestionType.ManualInput) {
                isCorrect = (userAnswer as string || "").toString().trim().toLowerCase() === (q.correctAnswer || "").toString().trim().toLowerCase();
            } else if (q.type === QuestionType.Typing) {
                isCorrect = userAnswer === q.correctAnswer;
            } else {
                isCorrect = userAnswer === q.correctAnswer;
            }

            if (isCorrect) score++;
            return { ...q, userAnswer };
        });

        // Calculate typing score (count correct typing answers)
        let typingScore = 0;
        processedQuestions.forEach(q => {
            if (q.type === QuestionType.Typing && q.userAnswer === q.correctAnswer) {
                typingScore++;
            }
        });

        // Process rewards using reward service
        const { reward } = processTestReward(
            currentStudent,
            score,
            activeTestQuestions.length
        );

        const result: TestResult = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            score,
            totalQuestions: activeTestQuestions.length,
            durationSeconds,
            topicIds: [],
            questions: processedQuestions,
            starsEarned: reward.stars
        };

        // Play sound based on score
        if (score === activeTestQuestions.length) {
            soundManager.playComplete();
        } else {
            soundManager.playComplete();
        }

        setLastResult(result);

        // Handle gacha result
        let gachaImage: AlbumImage | undefined;
        if (reward.image) {
            const isNew = !currentStudent.ownedImageIds.includes(reward.image.id);
            gachaImage = reward.image as AlbumImage;

            setGachaResult({
                image: gachaImage,
                isNew
            });
        }

        // Add result via context (handles history, stats, achievements, stars, gacha unlock)
        addTestResult(result, gachaImage, typingScore);

        navigate('/study/result');
    };

    const handleExitTest = () => {
        navigate('/study');
    };

    const handleBackToStudy = () => {
        navigate('/study');
    };

    const handleBackToMode = () => {
        navigate('/mode');
    };

    return (
        <Routes>
            <Route
                index
                element={
                    <TopicSelection
                        onStartTest={handleStartTest}
                        onExport={handleExportPDF}
                        onBack={handleBackToMode}
                    />
                }
            />
            <Route
                path="test"
                element={
                    <TestRunner
                        questions={activeTestQuestions}
                        durationMinutes={testDuration}
                        onFinish={handleTestFinish}
                        onExit={handleExitTest}
                    />
                }
            />
            <Route
                path="result"
                element={
                    lastResult ? (
                        <ResultScreen
                            result={lastResult}
                            onHome={handleBackToStudy}
                        />
                    ) : null
                }
            />
        </Routes>
    );
}
