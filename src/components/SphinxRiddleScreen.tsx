import React, { useState, useEffect } from 'react';
import { StudentProfile, RiddleCategory, RiddleDifficulty, RiddleData } from '@/types';
import { RiddleModal } from '@/src/components/RiddleModal';
import { GachaModal } from '@/src/components/GachaModal';
import {
    getRiddlesByCategory,
    filterRiddles,
    getRandomRiddle,
    loadSphinxProfile,
    getRandomDialogue,
} from '@/services/sphinxRiddleService';
import riddlePageImg from '@/riddle/imgSource/riddle_page.png';
import './SphinxRiddleScreen.css';
import { MusicControls } from '@/src/components/MusicControls';

interface SphinxRiddleScreenProps {
    student: StudentProfile;
    onBack: () => void;
    onProfileUpdate?: (updatedProfile: StudentProfile) => void;
}

export const SphinxRiddleScreen: React.FC<SphinxRiddleScreenProps> = ({
    student,
    onBack,
    onProfileUpdate,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<RiddleCategory>(RiddleCategory.VN_RIDDLE);
    const [selectedDifficulty, setSelectedDifficulty] = useState<RiddleDifficulty>(RiddleDifficulty.EASY);
    const [currentRiddle, setCurrentRiddle] = useState<RiddleData | null>(null);
    const [showRiddleModal, setShowRiddleModal] = useState(false);
    const [challengeDialogue, setChallengeDialogue] = useState('');
    const [showCongratModal, setShowCongratModal] = useState(false);
    const [showGachaModal, setShowGachaModal] = useState(false);
    const [gachaCard, setGachaCard] = useState<any>(null);

    useEffect(() => {
        // Set random challenge dialogue on mount
        setChallengeDialogue(getRandomDialogue('challenge'));
    }, []);

    const handleStartRiddle = async () => {
        // Load riddles based on category
        const riddles = await getRiddlesByCategory(selectedCategory);

        // Load sphinx profile to get answered riddles
        const sphinxProfile = loadSphinxProfile(student.id);

        // Filter by difficulty and exclude answered
        const availableRiddles = filterRiddles(
            riddles,
            selectedDifficulty,
            sphinxProfile.answeredRiddleIds
        );

        // Get random riddle
        const riddle = getRandomRiddle(availableRiddles);

        if (riddle) {
            setCurrentRiddle(riddle);
            setShowRiddleModal(true);
            setShowCongratModal(false);
        } else {
            // No riddles left - show congrat modal
            setShowCongratModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowRiddleModal(false);
        setCurrentRiddle(null);
    };

    const handleCloseCongratModal = () => {
        setShowCongratModal(false);
    };

    const handleGachaReward = (card: any) => {
        console.log('🎁 Triggering gacha with card:', card);
        setGachaCard(card);
        setShowGachaModal(true);
    };

    const handleCloseGacha = () => {
        setShowGachaModal(false);
        setGachaCard(null);
    };

    return (
        <div className="sphinx-riddle-screen">
            <div className="sphinx-header">
                <button className="back-button" onClick={onBack}>
                    ← Quay lại
                </button>
                <div className="student-info">
                    <span className="student-name">{student.name}</span>
                    <span className="student-stars">⭐ {student.stars}</span>
                </div>
                <MusicControls />
            </div>

            <div className="sphinx-main-content">
                <div className="sphinx-image-container">
                    <img src={riddlePageImg} alt="Sphinx" className="sphinx-main-image" />
                    <div className="mystical-glow"></div>
                </div>

                <div className="sphinx-dialogue">
                    <p>{challengeDialogue}</p>
                </div>

                <div className="selection-container">
                    <div className="difficulty-section">
                        <h3>Chọn độ khó:</h3>
                        <div className="difficulty-buttons">
                            <button
                                className={`difficulty-btn ${selectedDifficulty === RiddleDifficulty.EASY ? 'active' : ''}`}
                                onClick={() => setSelectedDifficulty(RiddleDifficulty.EASY)}
                            >
                                Dễ (1⭐)
                            </button>
                            <button
                                className={`difficulty-btn ${selectedDifficulty === RiddleDifficulty.MEDIUM ? 'active' : ''}`}
                                onClick={() => setSelectedDifficulty(RiddleDifficulty.MEDIUM)}
                            >
                                Trung bình (2⭐)
                            </button>
                            <button
                                className={`difficulty-btn ${selectedDifficulty === RiddleDifficulty.HARD ? 'active' : ''}`}
                                onClick={() => setSelectedDifficulty(RiddleDifficulty.HARD)}
                            >
                                Khó (3⭐)
                            </button>
                        </div>
                    </div>

                    <div className="category-section">
                        <h3>Chọn loại câu đố:</h3>
                        <div className="category-buttons">
                            <button
                                className={`category-btn ${selectedCategory === RiddleCategory.VN_RIDDLE ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(RiddleCategory.VN_RIDDLE)}
                            >
                                Việt Nam
                            </button>
                            <button
                                className={`category-btn ${selectedCategory === RiddleCategory.EN_RIDDLE ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(RiddleCategory.EN_RIDDLE)}
                            >
                                Nước ngoài
                            </button>
                            <button
                                className={`category-btn ${selectedCategory === RiddleCategory.MIX ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(RiddleCategory.MIX)}
                            >
                                Hỗn hợp
                            </button>
                        </div>
                    </div>
                </div>

                <button className="start-button" onClick={handleStartRiddle}>
                    Bắt đầu giải đố!
                </button>
            </div>

            {showRiddleModal && currentRiddle && (
                <RiddleModal
                    riddle={currentRiddle}
                    student={student}
                    difficulty={selectedDifficulty}
                    onClose={handleCloseModal}
                    onProfileUpdate={onProfileUpdate}
                    onGachaReward={handleGachaReward}
                />
            )}

            {showGachaModal && gachaCard && (
                <GachaModal
                    image={gachaCard}
                    isNew={!student.ownedImageIds.includes(gachaCard.id)}
                    onClose={handleCloseGacha}
                />
            )}

            {showCongratModal && (
                <div className="modal-overlay" onClick={handleCloseCongratModal}>
                    <div className="congrat-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="congrat-icon">🎉</div>
                        <h2>Chúc mừng!</h2>
                        <p>Bạn đã giải hết tất cả các câu đố ở mức độ <strong>{selectedDifficulty}</strong>!</p>
                        <p className="congrat-subtitle">Hãy thử mức độ khác hoặc loại câu đố khác nhé!</p>
                        <button className="congrat-close-btn" onClick={handleCloseCongratModal}>
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
