import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { MusicControls } from '@/src/components/MusicControls';
import { SpeakButton } from '@/src/components/shared/SpeakButton';

interface PreschoolShellProps {
    title: string;
    subtitle?: string;
    /** Lớp nền gradient (tailwind), vd 'from-pink-100 via-rose-50 to-orange-50'. */
    bg?: string;
    onBack?: () => void;     // mặc định về /mode
    children: React.ReactNode;
}

/** Khung chung cho các trang Mầm non: nút quay lại lớn, tiêu đề, nền vui mắt. */
export const PreschoolShell: React.FC<PreschoolShellProps> = ({
    title,
    subtitle,
    bg = 'from-sky-100 via-purple-50 to-pink-50',
    onBack,
    children,
}) => {
    const navigate = useNavigate();
    const back = onBack ?? (() => navigate('/mode'));

    return (
        <div className={`min-h-screen bg-gradient-to-br ${bg} p-4`}>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={back}
                        className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl shadow-md font-bold text-slate-700 active:scale-95 transition-all"
                    >
                        <ArrowLeft size={22} /> Quay lại
                    </button>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-brand-600 drop-shadow-sm text-center">{title}</h1>
                    <MusicControls />
                </div>
                {subtitle && (
                    <p className="text-center text-slate-500 text-lg mb-6">{subtitle}</p>
                )}
                {children}
            </div>
        </div>
    );
};

export interface ActivityDef {
    id: string;
    title: string;
    desc: string;
    emoji: string;
    gradient: string;   // vd 'from-pink-500 to-rose-500'
}

interface ActivityHubProps {
    activities: ActivityDef[];
    onPick: (id: string) => void;
}

/** Lưới chọn hoạt động trong một module mầm non. Mỗi thẻ có nút loa đọc tên hoạt động. */
export const ActivityHub: React.FC<ActivityHubProps> = ({ activities, onPick }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {activities.map(a => (
                <div
                    key={a.id}
                    className="relative bg-white rounded-3xl shadow-xl p-6 flex items-center gap-4 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer"
                    onClick={() => onPick(a.id)}
                >
                    <div className={`w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br ${a.gradient} flex items-center justify-center text-4xl shadow-lg`}>
                        {a.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-extrabold text-slate-800">{a.title}</h3>
                        <p className="text-slate-500 text-sm">{a.desc}</p>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                        <SpeakButton text={a.title} lang="vi-VN" size={20} />
                    </div>
                </div>
            ))}
        </div>
    );
};
