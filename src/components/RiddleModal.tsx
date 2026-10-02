import React, { useState, useEffect } from 'react';
import { StudentProfile, RiddleData, RiddleDifficulty, PenaltyType } from '@/types';
import { GachaModal } from '@/src/components/GachaModal';
import {
    checkAnswer,
    markRiddleAsAnswered,
    getRandomDialogue,
} from '@/services/sphinxRiddleService';
import { processSphinxReward, processSphinxPenalty } from '@/services/rewardService';
import questionModalImg from '@/riddle/imgSource/Question_modal.png';
import correctModalImg from '@/riddle/imgSource/Correct_modal.png';
import wrongModalImg from '@/riddle/imgSource/Wrong_modal.png';
import './RiddleModal.css';

interface RiddleModalProps {
    riddle: RiddleData;
    student: StudentProfile;
    difficulty: RiddleDifficulty;
    onClose: () => void;
    onProfileUpdate?: (updatedProfile: StudentProfile) => void;
    onGachaReward?: (card: any) => void;
    onSolveRiddle?: (category: string, difficulty: string) => void;
}

export const RiddleModal: React.FC<RiddleModalProps> = ({
    riddle,
    student,
    difficulty,
    onClose,
    onProfileUpdate,
    onGachaReward,
    onSolveRiddle,
}) => {
    const [userAnswer, setUserAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [invitationDialogue, setInvitationDialogue] = useState('');
    const [resultDialogue, setResultDialogue] = useState('');
    const [rewardInfo, setRewardInfo] = useState<{ stars: number; card?: any } | null>(null);
    const [penaltyInfo, setPenaltyInfo] = useState<PenaltyType | null>(null);

    const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

    useEffect(() => {
        // Set random invitation dialogue
        setInvitationDialogue(getRandomDialogue('invitation'));
    }, []);

    const getUnlockCost = (diff: RiddleDifficulty): number => {
        switch (diff) {
            case RiddleDifficulty.EASY: return 3;
            case RiddleDifficulty.MEDIUM: return 4;
            case RiddleDifficulty.HARD: return 5;
            default: return 5;
        }
    };

    const handleUnlockAnswer = () => {
        const cost = getUnlockCost(difficulty);
        if (student.stars < cost) {
            return;
        }

        // Deduct stars
        const updatedProfile = {
            ...student,
            stars: student.stars - cost
        };

        // Update profile via context (handles localStorage sync)
        if (onProfileUpdate) {
            onProfileUpdate(updatedProfile);
        }

        setIsAnswerRevealed(true);
    };

    const handleSubmit = () => {
        if (!userAnswer.trim()) {
            return;
        }

        const correct = checkAnswer(userAnswer, riddle.answer);
        setIsCorrect(correct);

        if (correct) {
            // Mark as answered
            markRiddleAsAnswered(student.id, riddle.rID);

            // Process reward
            const { updatedProfile, reward } = processSphinxReward(student, difficulty, student.id);

            // Update profile via context (handles localStorage sync)
            // Don't call updateProfile() from profileService - it causes race condition
            if (onProfileUpdate) {
                onProfileUpdate(updatedProfile);
            }

            // Trigger achievement check
            if (onSolveRiddle) {
                onSolveRiddle(riddle.category, difficulty);
            }

            // Set reward info for display
            setRewardInfo({
                stars: reward.stars,
                card: reward.card,
            });

            // DEBUG: Log reward info
            console.log('🎁 Reward Info:', {
                stars: reward.stars,
                hasCard: !!reward.card,
                cardData: reward.card
            });

            // Set success dialogue
            setResultDialogue(getRandomDialogue('success'));
        } else {
            // Process penalty
            const { updatedProfile, penaltyType } = processSphinxPenalty(student, student.id);

            // Update profile via context (handles localStorage sync)
            if (onProfileUpdate) {
                onProfileUpdate(updatedProfile);
            }

            // Set penalty info for display
            setPenaltyInfo(penaltyType);

            // Set failure dialogue
            setResultDialogue(getRandomDialogue('failure'));
        }

        setShowResult(true);
    };

    const handleConfirm = () => {
        // Check if we should show gacha after closing
        const shouldShowGacha = isCorrect && rewardInfo?.card;

        console.log('🎰 Gacha Check:', {
            isCorrect,
            hasRewardInfo: !!rewardInfo,
            hasCard: !!rewardInfo?.card,
            shouldShowGacha
        });

        // Close result modal first
        onClose();

        // Then trigger gacha via callback if needed
        if (shouldShowGacha && onGachaReward) {
            setTimeout(() => {
                console.log('🎰 Calling onGachaReward with card:', rewardInfo.card);
                onGachaReward(rewardInfo.card);
            }, 300);
        }
    };

    return (
        <div className="riddle-modal-overlay">
            <div className="riddle-modal-content">
                {!showResult ? (
                    <>
                        <div className="riddle-sphinx-image">
                            <img src={questionModalImg} alt="Sphinx Question" className="sphinx-modal-image" />
                            <div className="mystical-aura"></div>
                        </div>

                        <div className="riddle-dialogue">
                            <p>{invitationDialogue}</p>
                        </div>

                        <div className="riddle-question">
                            <h3>Câu đố:</h3>
                            <p>{riddle.question}</p>
                        </div>

                        {riddle.note && (
                            <div className="riddle-hint">
                                <small>💡 {riddle.note}</small>
                            </div>
                        )}

                        <div className="riddle-input-section">
                            <input
                                type="text"
                                className="riddle-input"
                                placeholder="Nhập câu trả lời của bạn..."
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSubmit();
                                    }
                                }}
                                autoFocus
                            />
                        </div>

                        <div className="riddle-actions">
                            <button className="riddle-cancel-btn" onClick={onClose}>
                                Hủy
                            </button>
                            <button className="riddle-submit-btn" onClick={handleSubmit}>
                                Trả lời
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="riddle-result-sphinx">
                            <img
                                src={isCorrect ? correctModalImg : wrongModalImg}
                                alt={isCorrect ? "Sphinx Correct" : "Sphinx Wrong"}
                                className={`sphinx-modal-image ${isCorrect ? 'correct' : 'wrong'}`}
                            />
                            <div className={`result-aura ${isCorrect ? 'success-aura' : 'fail-aura'}`}></div>
                        </div>

                        <div className="riddle-result-title">
                            <h3 className={isCorrect ? 'correct' : 'wrong'}>
                                {isCorrect ? '✅ Chính xác!' : '❌ Chưa đúng!'}
                            </h3>
                        </div>

                        <div className="riddle-result-dialogue">
                            <p>{resultDialogue}</p>
                        </div>

                        <div className={`riddle-result-content ${isCorrect ? 'correct' : 'wrong'}`}>
                            {(isCorrect || isAnswerRevealed) && (
                                <>
                                    <div className="correct-answer">
                                        <strong>Đáp án:</strong> {riddle.answer}
                                    </div>

                                    <div className="answer-explanation">
                                        <strong>Giải thích:</strong>
                                        <p>{riddle.answer_explain}</p>
                                    </div>
                                </>
                            )}

                            {!isCorrect && !isAnswerRevealed && (
                                <div className="wrong-message">
                                    <p>Hãy thử suy nghĩ kỹ hơn và thử lại nhé!</p>
                                    <div className="unlock-answer-section" style={{ marginTop: '15px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.9em', marginBottom: '10px' }}>Bạn có muốn xem đáp án không?</p>
                                        <button
                                            className="unlock-answer-btn"
                                            onClick={handleUnlockAnswer}
                                            style={{
                                                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                                                border: 'none',
                                                borderRadius: '20px',
                                                padding: '8px 16px',
                                                color: '#fff',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            🔓 Xem đáp án ({getUnlockCost(difficulty)} ⭐)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isCorrect && rewardInfo && (
                                <div className="reward-display">
                                    <div className="stars-reward">
                                        ⭐ +{rewardInfo.stars} sao
                                    </div>
                                </div>
                            )}

                            {isCorrect && rewardInfo && rewardInfo.stars === 0 && (
                                <div className="penalty-notice">
                                    <p>⚠️ Bạn đang bị phạt nên không nhận được thưởng lần này!</p>
                                </div>
                            )}

                            {!isCorrect && penaltyInfo && (
                                <div className="penalty-display">
                                    {penaltyInfo === PenaltyType.LOSE_STAR ? (
                                        <div className="penalty-stars">
                                            ⭐ -1 sao
                                        </div>
                                    ) : (
                                        <div className="penalty-skip">
                                            🚫 Bỏ qua phần thưởng kế tiếp
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="riddle-result-actions">
                            <button className="riddle-confirm-btn" onClick={handleConfirm}>
                                Xác nhận
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
