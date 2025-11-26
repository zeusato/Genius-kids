import React, { useState, useEffect } from 'react';
import { ArrowLeft, Menu, X as CloseIcon } from 'lucide-react';
import { StudentProfile } from '../types';
import { QuestionData, TellMeWhyProfile } from './types';
import {
    buildTreeStructure,
    searchQuestions,
    loadTellMeWhyProfile,
    saveTellMeWhyProfile,
    toggleFavorite as toggleFavoriteService,
    unlockSubCategory as unlockSubCategoryService,
    canUnlockSubCategory,
    getAdjacentQuestion
} from '../services/tellMeWhyService';
import { TreeMenu } from './components/TreeMenu';
import { ContentDisplay } from './components/ContentDisplay';
import { SearchBox } from './components/SearchBox';
import { UnlockModal } from './components/UnlockModal';
import { MusicControls } from '@/src/components/MusicControls';

interface TellMeWhyScreenProps {
    student: StudentProfile;
    onBack: () => void;
    onUpdateStars: (newStars: number) => void;
}

export const TellMeWhyScreen: React.FC<TellMeWhyScreenProps> = ({
    student,
    onBack,
    onUpdateStars
}) => {
    const [profile, setProfile] = useState<TellMeWhyProfile>(() =>
        loadTellMeWhyProfile(student.id)
    );
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState<QuestionData[]>([]);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [unlockRequest, setUnlockRequest] = useState<{ categoryId: number; subCategory: string; categoryName: string } | null>(null);

    // Save profile whenever it changes
    useEffect(() => {
        saveTellMeWhyProfile(student.id, profile);
    }, [profile, student.id]);

    // Keyboard navigation: Arrow keys for previous/next
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Only navigate if a question is selected and user is not typing in an input
            if (!selectedQuestion) return;
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // ArrowLeft for previous
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevQ = getAdjacentQuestion(selectedQuestion.id, 'prev', profile, undefined, selectedQuestion);
                if (prevQ) {
                    setSelectedQuestion(prevQ);
                }
            }
            // ArrowRight for next
            else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextQ = getAdjacentQuestion(selectedQuestion.id, 'next', profile, undefined, selectedQuestion);
                if (nextQ) {
                    setSelectedQuestion(nextQ);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [selectedQuestion, profile]);

    // Build tree structure
    const treeData = buildTreeStructure(profile);

    // Handle search
    const handleSearch = (keyword: string) => {
        setSearchKeyword(keyword);
        if (keyword.trim()) {
            const results = searchQuestions(keyword, profile);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    // Handle question selection
    const handleSelectQuestion = (questionData: QuestionData) => {
        setSelectedQuestion(questionData);
        // Don't clear search - keep results visible so user can continue browsing
        // setSearchKeyword('');
        // setSearchResults([]);
        setShowMobileMenu(false); // Close mobile menu when selecting
    };

    // Handle unlock subcategory - show modal
    const handleUnlockSubCategory = (categoryId: number, subCategory: string) => {
        // Free categories (1-4 are free for all users)
        if (categoryId >= 1 && categoryId <= 4) return;

        // Find category name
        const categories = buildTreeStructure(profile);
        const category = categories.find(c => c.categoryId === categoryId);
        const categoryName = category?.label || 'Danh mục';

        // Show unlock modal
        setUnlockRequest({ categoryId, subCategory, categoryName });
    };

    // Confirm unlock
    const confirmUnlock = () => {
        if (!unlockRequest) return;

        const { categoryId, subCategory } = unlockRequest;

        // Deduct stars
        const UNLOCK_COST = 30;
        onUpdateStars(student.stars - UNLOCK_COST);

        // Update profile
        const updatedProfile = unlockSubCategoryService(categoryId, subCategory, profile);
        setProfile(updatedProfile);

        // Close modal
        setUnlockRequest(null);
    };

    // Cancel unlock
    const cancelUnlock = () => {
        setUnlockRequest(null);
    };

    // Handle toggle favorite
    const handleToggleFavorite = () => {
        if (!selectedQuestion) return;

        const updatedProfile = toggleFavoriteService(selectedQuestion.id, profile);
        setProfile(updatedProfile);
    };

    // Navigation handlers
    const handleNext = () => {
        if (!selectedQuestion) return;
        const nextQ = getAdjacentQuestion(selectedQuestion.id, 'next', profile, undefined, selectedQuestion);
        if (nextQ) {
            setSelectedQuestion(nextQ);
        }
    };

    const handlePrevious = () => {
        if (!selectedQuestion) return;
        const prevQ = getAdjacentQuestion(selectedQuestion.id, 'prev', profile, undefined, selectedQuestion);
        if (prevQ) {
            setSelectedQuestion(prevQ);
        }
    };

    const hasPrevious = selectedQuestion ?
        getAdjacentQuestion(selectedQuestion.id, 'prev', profile, undefined, selectedQuestion) !== null : false;
    const hasNext = selectedQuestion ?
        getAdjacentQuestion(selectedQuestion.id, 'next', profile, undefined, selectedQuestion) !== null : false;

    const isFavorite = selectedQuestion ?
        profile.favoriteQuestionIds.includes(selectedQuestion.id) : false;

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-50 via-purple-50 to-yellow-50 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-brand-600">
                                1000 Câu hỏi Vì sao?
                            </h1>
                            <p className="text-sm text-slate-500">Bách khoa toàn thư tri thức</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
                            <span className="text-2xl">⭐</span>
                            <span className="font-bold text-lg">{student.stars}</span>
                        </div>
                        <MusicControls />

                        {/* Mobile menu toggle */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            {showMobileMenu ? <CloseIcon size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Hint - Shows when no question selected */}
            {!selectedQuestion && !showMobileMenu && (
                <div className="md:hidden fixed top-20 right-4 z-40 animate-bounce">
                    <div className="bg-gradient-to-r from-brand-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg relative">
                        <p className="text-sm font-semibold whitespace-nowrap">👆 Mở menu câu hỏi</p>
                        {/* Arrow pointing to menu button */}
                        <div className="absolute -top-2 right-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-brand-500"></div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 max-w-7xl mx-auto p-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
                    {/* Left Panel - Tree Menu (Mobile: overlay) */}
                    <div className={`
                        md:col-span-4 lg:col-span-3
                        ${showMobileMenu ? 'fixed inset-0 z-50 bg-white p-4 flex flex-col overflow-y-auto' : 'hidden md:flex md:flex-col md:min-h-0'}
                    `}>
                        {/* Search Box */}
                        <div className="flex-shrink-0 mb-4">
                            <SearchBox onSearch={handleSearch} />
                        </div>

                        {/* Search Results or Tree Menu - Takes remaining space */}
                        {searchKeyword && searchResults.length > 0 ? (
                            <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-slate-200 p-4 overflow-y-auto">
                                <h3 className="font-semibold text-slate-700 mb-3">
                                    Kết quả tìm kiếm ({searchResults.length})
                                </h3>
                                <div className="space-y-2">
                                    {searchResults.map(q => (
                                        <button
                                            key={q.id}
                                            onClick={() => handleSelectQuestion(q)}
                                            className="w-full text-left p-3 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200"
                                        >
                                            <p className="text-sm font-medium text-brand-600 mb-1">
                                                {q.question}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {q.category} • {q.sub_category}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : searchKeyword ? (
                            <div className="flex-1 min-h-0 bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex items-center justify-center">
                                <p className="text-slate-400 text-center">
                                    Không tìm thấy kết quả nào 🔍
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <TreeMenu
                                    treeData={treeData}
                                    selectedQuestionId={selectedQuestion?.id || null}
                                    onSelectQuestion={handleSelectQuestion}
                                    onUnlockSubCategory={handleUnlockSubCategory}
                                    currentStars={student.stars}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Content Display */}
                    <div className="md:col-span-8 lg:col-span-9 flex flex-col min-h-0">
                        <ContentDisplay
                            questionData={selectedQuestion}
                            isFavorite={isFavorite}
                            onToggleFavorite={handleToggleFavorite}
                            onPrevious={handlePrevious}
                            onNext={handleNext}
                            hasPrevious={hasPrevious}
                            hasNext={hasNext}
                        />
                    </div>
                </div>
            </div>

            {/* Unlock Modal */}
            <UnlockModal
                isOpen={unlockRequest !== null}
                subCategoryName={unlockRequest?.subCategory || ''}
                categoryName={unlockRequest?.categoryName || ''}
                unlockCost={30}
                currentStars={student.stars}
                onConfirm={confirmUnlock}
                onCancel={cancelUnlock}
            />
        </div>
    );
};
