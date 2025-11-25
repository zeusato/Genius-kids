import React from 'react';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { QuestionData } from '../types';
import { MarkdownText, renderAnswerText } from './MarkdownText';

interface ContentDisplayProps {
    questionData: QuestionData | null;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onPrevious: () => void;
    onNext: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
}

export const ContentDisplay: React.FC<ContentDisplayProps> = ({
    questionData,
    isFavorite,
    onToggleFavorite,
    onPrevious,
    onNext,
    hasPrevious,
    hasNext
}) => {
    if (!questionData) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-brand-50 to-purple-50 rounded-lg">
                <div className="text-center text-slate-400 space-y-4">
                    <div className="text-6xl">📖</div>
                    <p className="text-xl font-semibold">Chọn một câu hỏi để bắt đầu</p>
                    <p className="text-sm">Khám phá tri thức cùng 1000 câu hỏi vì sao!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Header with favorite */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-brand-500 to-purple-500 text-white">
                <div className="flex-1">
                    <h2 className="text-lg font-bold">Nội dung câu hỏi</h2>
                    <p className="text-xs text-white/80 mt-1">Lưu câu hỏi yêu thích để xem lại sau</p>
                </div>

                <button
                    onClick={onToggleFavorite}
                    className="p-3 hover:bg-white/20 rounded-lg transition-colors"
                    title={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                >
                    <Heart
                        size={28}
                        fill={isFavorite ? 'currentColor' : 'none'}
                        className={isFavorite ? 'text-red-300' : ''}
                    />
                </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Question Block */}
                <div className="bg-gradient-to-br from-brand-100 to-purple-100 rounded-2xl p-6 border-l-4 border-brand-500 shadow-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl flex-shrink-0">❓</span>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-2">
                                Câu hỏi
                            </h3>
                            <p className="text-2xl font-bold text-slate-800 leading-relaxed">
                                <MarkdownText text={questionData.question} />
                            </p>
                        </div>
                    </div>
                </div>

                {/* Answer Block */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-l-4 border-green-500 shadow-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl flex-shrink-0">💡</span>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">
                                Câu trả lời
                            </h3>
                            <div className="text-lg text-slate-700 leading-relaxed">
                                {renderAnswerText(questionData.answer)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                {questionData.tags && questionData.tags.length > 0 && (
                    <div className="pt-4 border-t border-slate-200">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                            Từ khóa liên quan
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {questionData.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Category and Subcategory Info */}
                <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
                    <span>{questionData.category}</span>
                    <span>•</span>
                    <span>{questionData.sub_category}</span>
                </div>

                {/* Navigation Buttons - Inside content area for easier mobile access */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <button
                        onClick={onPrevious}
                        disabled={!hasPrevious}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-slate-300 font-semibold shadow-sm"
                        title="Câu trước"
                    >
                        <ChevronLeft size={20} />
                        <span>Trước</span>
                    </button>

                    <div className="text-xs text-slate-500 text-center hidden sm:block">
                        {hasPrevious || hasNext ? (
                            <span>Chuyển câu trong cùng chuyên mục</span>
                        ) : (
                            <span>Không có câu khác</span>
                        )}
                    </div>

                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-slate-300 font-semibold shadow-sm"
                        title="Câu sau"
                    >
                        <span>Tiếp</span>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
