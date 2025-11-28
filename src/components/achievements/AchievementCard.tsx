import React from 'react';
import * as Icons from 'lucide-react';
import { AchievementProgress } from '@/types';
import { ACHIEVEMENTS } from '@/services/achievementService';

interface AchievementCardProps {
    achievementId: string;
    progress?: AchievementProgress;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievementId, progress }) => {
    const config = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!config) return null;

    const IconComponent = (Icons as any)[config.icon] || Icons.Trophy;

    // Determine current tier status
    const isBronzeUnlocked = progress?.unlockedTiers.includes('bronze');
    const isSilverUnlocked = progress?.unlockedTiers.includes('silver');
    const isGoldUnlocked = progress?.unlockedTiers.includes('gold');

    // Calculate progress percentage for the NEXT tier
    let nextTierValue = 0;
    let currentTierValue = 0;
    let nextTierLabel = '';

    // Find the next target tier
    const bronzeConfig = config.tiers.find(t => t.tier === 'bronze');
    const silverConfig = config.tiers.find(t => t.tier === 'silver');
    const goldConfig = config.tiers.find(t => t.tier === 'gold');

    if (bronzeConfig && !isBronzeUnlocked) {
        nextTierValue = bronzeConfig.value;
        nextTierLabel = 'Mục tiêu: Bronze';
    } else if (silverConfig && !isSilverUnlocked) {
        currentTierValue = bronzeConfig?.value || 0;
        nextTierValue = silverConfig.value;
        nextTierLabel = 'Mục tiêu: Silver';
    } else if (goldConfig && !isGoldUnlocked) {
        currentTierValue = silverConfig?.value || bronzeConfig?.value || 0;
        nextTierValue = goldConfig.value;
        nextTierLabel = 'Mục tiêu: Gold';
    } else {
        // Maxed out or highest available tier reached
        const maxTier = goldConfig || silverConfig || bronzeConfig;
        if (maxTier) {
            currentTierValue = maxTier.value;
            nextTierValue = maxTier.value;
            nextTierLabel = 'Hoàn thành';
        }
    }

    const currentValue = progress?.currentValue || 0;
    const percent = nextTierValue > 0
        ? Math.min(100, Math.max(0, (currentValue / nextTierValue) * 100))
        : 0;

    // Visual styles based on highest unlocked tier
    let containerClasses = 'border-slate-200 bg-white hover:shadow-md';
    let iconColor = 'text-slate-300';
    let titleColor = 'text-slate-400';
    let progressBarColor = 'bg-slate-300';

    if (isGoldUnlocked) {
        containerClasses = 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg shadow-yellow-100/50';
        iconColor = 'text-yellow-600';
        titleColor = 'text-yellow-900';
        progressBarColor = 'bg-yellow-500';
    } else if (isSilverUnlocked) {
        containerClasses = 'border-slate-400 bg-gradient-to-br from-slate-50 to-slate-200 shadow-lg shadow-slate-200/50';
        iconColor = 'text-slate-600';
        titleColor = 'text-slate-800';
        progressBarColor = 'bg-slate-500';
    } else if (isBronzeUnlocked) {
        containerClasses = 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg shadow-orange-100/50';
        iconColor = 'text-orange-600';
        titleColor = 'text-orange-900';
        progressBarColor = 'bg-orange-500';
    }

    return (
        <div className={`relative p-4 rounded-2xl border-2 ${containerClasses} transition-all h-full flex flex-col`}>
            <div className="flex gap-4 flex-1">
                <div className={`p-3 rounded-xl h-fit bg-white/80 shadow-sm ${iconColor}`}>
                    <IconComponent size={32} />
                </div>
                <div className="flex flex-col flex-1">
                    <h3 className={`font-bold text-lg ${titleColor}`}>
                        {config.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">{config.description}</p>

                    {/* Progress Bar */}
                    <div className="mt-auto w-full bg-black/5 rounded-full h-2.5 mb-1 overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${progressBarColor}`}
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>{Math.min(currentValue, nextTierValue)} / {nextTierValue}</span>
                        <span>{nextTierLabel}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
