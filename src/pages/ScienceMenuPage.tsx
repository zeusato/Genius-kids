import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Atom, Globe, Zap, Microscope, Dna, LucideIcon } from 'lucide-react';
import { MusicControls } from '@/src/components/MusicControls';
import { useStudent } from '@/src/contexts/StudentContext';
import { isPreschool } from '@/src/utils/grade';

interface ScienceItem {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    iconAnimate?: string;       // class thêm cho icon (vd animate-pulse)
    iconHover: string;          // hiệu ứng hover của khối icon
    cardGradient: string;       // nền card
    iconGradient: string;       // nền khối icon
    ring: string;               // viền ring khối icon
    buttonGradient: string;     // nền nút
    emoji: string;              // emoji trên nút
    route: string;
    allowPreschool: boolean;    // có hiển thị cho Mầm non không
}

const SCIENCE_ITEMS: ScienceItem[] = [
    {
        id: 'solar-system',
        title: 'Khám Phá Hệ Mặt Trời',
        description: 'Du hành qua hệ mặt trời, khám phá các hành tinh, mặt trăng và những bí ẩn vũ trụ!',
        icon: Globe,
        iconHover: 'hover:rotate-6',
        cardGradient: 'from-blue-900/50 to-purple-900/50',
        iconGradient: 'from-blue-500 to-indigo-600',
        ring: 'ring-blue-400/50',
        buttonGradient: 'from-blue-500 to-indigo-600',
        emoji: '🚀',
        route: '/science/solar-system',
        allowPreschool: true,
    },
    {
        id: 'periodic-table',
        title: 'Bảng Tuần Hoàn',
        description: 'Khám phá 118 nguyên tố hóa học với mô hình nguyên tử 3D tương tác và những kiến thức thú vị!',
        icon: Atom,
        iconHover: 'hover:-rotate-6',
        cardGradient: 'from-emerald-900/50 to-cyan-900/50',
        iconGradient: 'from-emerald-500 to-cyan-500',
        ring: 'ring-cyan-400/50',
        buttonGradient: 'from-emerald-500 to-cyan-500',
        emoji: '⚛️',
        route: '/science/periodic-table',
        allowPreschool: false,
    },
    {
        id: 'electricity',
        title: 'Điện & Mạch điện',
        description: 'Học lắp ráp mạch điện qua thí nghiệm tương tác! Kéo thả linh kiện, xem electron chạy.',
        icon: Zap,
        iconHover: 'hover:rotate-6',
        cardGradient: 'from-yellow-900/50 to-orange-900/50',
        iconGradient: 'from-yellow-500 to-orange-500',
        ring: 'ring-yellow-400/50',
        buttonGradient: 'from-yellow-500 to-orange-500',
        emoji: '⚡',
        route: '/science/electricity',
        allowPreschool: false,
    },
    {
        id: 'cell-biology',
        title: 'Khám Phá Tế Bào',
        description: 'Soi kính hiển vi vào thế giới vi mô! Khám phá tế bào động vật, thực vật và vi khuẩn.',
        icon: Microscope,
        iconHover: 'hover:-rotate-6',
        cardGradient: 'from-purple-900/50 to-pink-900/50',
        iconGradient: 'from-purple-500 to-pink-500',
        ring: 'ring-purple-400/50',
        buttonGradient: 'from-purple-500 to-pink-500',
        emoji: '🧬',
        route: '/science/cell-biology',
        allowPreschool: true,
    },
    {
        id: 'evolution',
        title: 'Cây Tiến Hóa',
        description: 'Hành trình vĩ đại từ nguồn gốc sự sống đến thế giới động vật đa dạng ngày nay.',
        icon: Dna,
        iconAnimate: 'animate-pulse',
        iconHover: 'hover:scale-110',
        cardGradient: 'from-teal-900/50 to-emerald-900/50',
        iconGradient: 'from-teal-500 to-emerald-600',
        ring: 'ring-teal-400/50',
        buttonGradient: 'from-teal-500 to-emerald-600',
        emoji: '🌿',
        route: '/science/evolution',
        allowPreschool: false,
    },
];

export const ScienceMenuPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const preschool = isPreschool(currentStudent?.grade);

    const items = preschool ? SCIENCE_ITEMS.filter(i => i.allowPreschool) : SCIENCE_ITEMS;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/mode')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-semibold text-white shadow-md backdrop-blur-sm"
                    >
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>

                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                        Khoa Học
                    </h1>

                    <MusicControls />
                </div>

                {/* Description */}
                <div className="text-center mb-12">
                    <p className="text-white/70 text-lg">
                        Khám phá thế giới khoa học kỳ thú! Chọn chủ đề bạn muốn tìm hiểu.
                    </p>
                </div>

                <div className="space-y-6">
                    {items.map(item => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.id}
                                className={`bg-gradient-to-r ${item.cardGradient} backdrop-blur-md rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-white/10 hover:border-white/20`}
                            >
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className={`w-32 h-32 bg-gradient-to-br ${item.iconGradient} rounded-3xl flex items-center justify-center shadow-lg transform ${item.iconHover} transition-transform ring-2 ${item.ring}`}>
                                        <Icon size={64} className={`text-white ${item.iconAnimate ?? ''}`} />
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-3xl font-bold text-white mb-3">
                                            {item.title}
                                        </h3>
                                        <p className="text-white/70 text-lg mb-6">
                                            {item.description}
                                        </p>

                                        <button
                                            onClick={() => navigate(item.route)}
                                            className={`px-8 py-4 bg-gradient-to-r ${item.buttonGradient} text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}
                                        >
                                            {item.emoji} Khám phá ngay!
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer note */}
                <div className="text-center mt-12 text-white/50 text-sm">
                    <p>Tiếp tục thêm nhiều chủ đề khoa học hấp dẫn!</p>
                </div>
            </div>
        </div>
    );
};
