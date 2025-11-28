import React, { useEffect, useState } from 'react';
import { AchievementProgress } from '../../../types';
import { ACHIEVEMENTS } from '../../../services/achievementService';
import { Trophy, Star, X } from 'lucide-react';

interface AchievementModalProps {
    achievement: AchievementProgress | null;
    onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (achievement) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [achievement]);

    if (!achievement || !isVisible) return null;

    const config = ACHIEVEMENTS.find(a => a.id === achievement.id);
    if (!config) return null;

    const currentTier = achievement.unlockedTiers[achievement.unlockedTiers.length - 1];
    const tierConfig = config.tiers.find(t => t.tier === currentTier);

    if (!tierConfig) return null;

    const tierColors = {
        bronze: 'from-orange-400 to-orange-600',
        silver: 'from-slate-300 to-slate-500',
        gold: 'from-yellow-300 to-yellow-500',
    };

    const tierNames = {
        bronze: 'Đồng',
        silver: 'Bạc',
        gold: 'Vàng',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-in zoom-in-95 duration-300 border-4 border-yellow-400">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${tierColors[currentTier]} p-1 shadow-xl flex items-center justify-center animate-bounce`}>
                        <div className="w-full h-full rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm">
                            <Trophy size={48} className="text-white drop-shadow-md" />
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wide mb-1">
                        Chúc Mừng!
                    </h2>
                    <p className="text-brand-600 font-bold text-lg mb-4">
                        Bạn đã mở khóa danh hiệu {tierNames[currentTier]}
                    </p>

                    <div className="bg-yellow-50 rounded-2xl p-6 mb-6 border-2 border-yellow-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{config.title}</h3>
                        <p className="text-slate-600">{config.description}</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-3xl font-black text-yellow-500 mb-8 animate-pulse">
                        <span>+ {tierConfig.rewardStars}</span>
                        <Star size={32} fill="currentColor" />
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-200 hover:scale-105 transition-all"
                    >
                        Tuyệt vời!
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
