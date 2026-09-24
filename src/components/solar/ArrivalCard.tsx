import React from 'react';
import { X, BookOpen, Target } from 'lucide-react';
import { PlanetData } from '../../data/solarData';
import { SpeakButton } from './SpeakButton';

interface ArrivalCardProps {
    body: PlanetData;
    layout: 'bottom' | 'side';
    hasBadge: boolean;
    onDetail: () => void;
    onChallenge: () => void;
    onClose: () => void;
}

// Thẻ "Tới nơi" — thay cho modal phủ kín ngay khi bay tới. Hành tinh thật trong scene là nhân vật
// chính (được CameraRig đẩy lên trên / sang trái), thẻ chỉ chiếm phần còn lại: tên, 1 câu, 3 chỉ số,
// và lối vào "Chi tiết" (modal cũ đầy đủ) / "Thử thách" (quiz huy hiệu). Bé vẫn xoay/zoom quanh
// hành tinh được trong lúc đọc.
export const ArrivalCard: React.FC<ArrivalCardProps> = ({ body, layout, hasBadge, onDetail, onChallenge, onClose }) => {
    const stats = [
        { icon: '🌡️', label: 'Nhiệt độ', value: body.temperature },
        { icon: '📏', label: 'Đường kính', value: body.diameter },
        { icon: '☀️', label: 'Cách Mặt Trời', value: body.distanceFromSun }
    ].filter((s) => s.value && s.value !== '0 km');

    const shell = layout === 'side'
        ? 'fixed right-4 top-1/2 -translate-y-1/2 w-[min(380px,40vw)] max-h-[86vh] slide-in-from-right'
        : 'fixed inset-x-3 bottom-4 max-h-[44vh] slide-in-from-bottom';

    return (
        <div className={`${shell} z-[90] overflow-y-auto rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/85 to-indigo-950/85 backdrop-blur-md shadow-2xl p-4 sm:p-5 text-white animate-in duration-500`}>
            <div className="flex items-start gap-3 mb-2">
                <div
                    className="w-4 h-4 mt-2 rounded-full shrink-0"
                    style={{ backgroundColor: body.color, boxShadow: `0 0 14px ${body.color}` }}
                />
                <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{body.name}</h2>
                <div className="ml-auto flex gap-2 shrink-0">
                    <SpeakButton planet={body} />
                    <button
                        onClick={onClose}
                        title="Quay về toàn hệ"
                        className="p-2.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <p className="text-sm sm:text-base text-white/85 leading-relaxed mb-3">{body.description}</p>

            <div className="grid grid-cols-3 gap-2 mb-3">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-2">
                        <div className="text-[10px] uppercase tracking-wide text-white/55">{s.icon} {s.label}</div>
                        <div className="text-xs sm:text-sm font-bold leading-snug">{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onDetail}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 transition-all"
                >
                    <BookOpen size={16} /> Chi tiết
                </button>
                <button
                    onClick={onChallenge}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 transition-all"
                >
                    <Target size={16} /> {hasBadge ? 'Thử thách lại' : 'Thử thách'}
                </button>
            </div>
        </div>
    );
};
