import React from 'react';
import { Star, Lock, X } from 'lucide-react';

interface UnlockModalProps {
    isOpen: boolean;
    subCategoryName: string;
    categoryName: string;
    unlockCost: number;
    currentStars: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
    isOpen,
    subCategoryName,
    categoryName,
    unlockCost,
    currentStars,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const hasEnoughStars = currentStars >= unlockCost;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X size={20} className="text-slate-400" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Lock size={32} className="text-white" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
                    Mở khóa nội dung
                </h2>

                {/* Category info */}
                <div className="bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-slate-600 mb-1">Danh mục:</p>
                    <p className="text-lg font-bold text-brand-600">{categoryName}</p>
                    <p className="text-sm text-slate-600 mt-2 mb-1">Chuyên mục:</p>
                    <p className="text-lg font-bold text-purple-600">{subCategoryName}</p>
                </div>

                {/* Cost info */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-700 font-semibold">Chi phí mở khóa:</span>
                        <div className="flex items-center gap-2">
                            <Star size={24} fill="#FCD34D" className="text-yellow-500" />
                            <span className="text-2xl font-bold text-yellow-700">{unlockCost}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-slate-700">Bạn có:</span>
                        <div className="flex items-center gap-2">
                            <Star size={20} fill="#FCD34D" className="text-yellow-500" />
                            <span className={`text-xl font-bold ${hasEnoughStars ? 'text-green-600' : 'text-red-600'}`}>
                                {currentStars}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Warning if not enough stars */}
                {!hasEnoughStars && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-red-700 text-center font-semibold">
                            ⚠️ Bạn cần thêm {unlockCost - currentStars} ⭐ để mở khóa!
                        </p>
                        <p className="text-xs text-red-600 text-center mt-1">
                            Hãy làm bài tập để kiếm thêm sao nhé!
                        </p>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!hasEnoughStars}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${hasEnoughStars
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {hasEnoughStars ? '✨ Mở khóa ngay' : '🔒 Không đủ sao'}
                    </button>
                </div>
            </div>
        </div>
    );
};
