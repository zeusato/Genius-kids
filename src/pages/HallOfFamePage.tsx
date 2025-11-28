import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '@/src/contexts/StudentContext';
import { checkAchievements, ACHIEVEMENTS } from '@/services/achievementService';
import { AchievementCard } from '@/src/components/achievements/AchievementCard';
import { ArrowLeft, Trophy, Star, Medal, Filter } from 'lucide-react';

export function HallOfFamePage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const [filter, setFilter] = useState<'all' | 'study' | 'game' | 'collection'>('all');

    if (!currentStudent) return null;

    // Get latest progress for all achievements
    const { updatedAchievements } = useMemo(() => checkAchievements(currentStudent), [currentStudent]);

    // Calculate summary stats
    const totalBadges = updatedAchievements.reduce((acc, p) => acc + p.unlockedTiers.length, 0);
    const totalStarsFromAchievements = updatedAchievements.reduce((acc, p) => {
        const config = ACHIEVEMENTS.find(a => a.id === p.id);
        if (!config) return acc;
        return acc + p.unlockedTiers.reduce((sum, tier) => {
            const tierConfig = config.tiers.find(t => t.tier === tier);
            return sum + (tierConfig?.rewardStars || 0);
        }, 0);
    }, 0);

    // Filter achievements
    const filteredAchievements = ACHIEVEMENTS.filter(ach => {
        if (filter === 'all') return true;
        if (filter === 'study') return ['total_tests', 'total_questions', 'perfect_tests', 'correct_streak', 'topic_mastery', 'facts_read', 'facts_read_category'].includes(ach.type);
        if (filter === 'game') return ['total_games', 'game_win', 'riddles_solved', 'riddles_solved_category', 'riddles_solved_difficulty', 'typing_score'].includes(ach.type);
        if (filter === 'collection') return ['total_stars_earned', 'total_cards', 'rarity_count', 'stars_spent', 'avatars_owned', 'themes_owned'].includes(ach.type);
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-20">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                    >
                        <ArrowLeft size={20} /> Quay lại
                    </button>
                    <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-xl border border-yellow-200">
                        <Star className="text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-yellow-700">{currentStudent.stars} sao</span>
                    </div>
                </header>

                {/* Hero Section */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                        <Trophy size={300} />
                    </div>
                    <div className="relative z-10">
                        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                            <Trophy className="text-yellow-300" size={40} />
                            Bảng Vàng Thành Tích
                        </h1>
                        <p className="text-indigo-100 text-lg mb-8 max-w-2xl">
                            Chào mừng {currentStudent.name} đến với Đại sảnh Danh vọng! Hãy thu thập thật nhiều huy hiệu để chứng tỏ bản lĩnh nhé.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <div className="text-3xl font-bold text-yellow-300">{totalBadges}</div>
                                <div className="text-sm text-indigo-100 font-medium">Huy hiệu đã đạt</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <div className="text-3xl font-bold text-yellow-300">{totalStarsFromAchievements}</div>
                                <div className="text-sm text-indigo-100 font-medium">Sao từ thành tích</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <div className="text-3xl font-bold text-white">{updatedAchievements.length}</div>
                                <div className="text-sm text-indigo-100 font-medium">Thử thách đã mở</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                    {[
                        { id: 'all', label: 'Tất cả', icon: Filter },
                        { id: 'study', label: 'Học tập', icon: Medal },
                        { id: 'game', label: 'Trò chơi', icon: Trophy },
                        { id: 'collection', label: 'Sưu tập', icon: Star },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${filter === tab.id
                                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                                    : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAchievements.map(ach => {
                        const progress = updatedAchievements.find(p => p.id === ach.id);
                        return (
                            <AchievementCard
                                key={ach.id}
                                achievementId={ach.id}
                                progress={progress}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
