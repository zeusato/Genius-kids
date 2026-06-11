import React from 'react';
import { X } from 'lucide-react';
import { SOLAR_SYSTEM_DATA, SUN_DATA, ASTEROID_BELT_DATA, PlanetData } from '../../data/solarData';
import { COLLECTIBLE_BODY_IDS } from '../../data/solarQuizData';
import { useStudent } from '../../contexts/StudentContext';

interface SolarCollectionProps {
    onClose: () => void;
}

function bodyById(id: string): PlanetData | undefined {
    if (id === 'sun') return SUN_DATA;
    if (id === 'asteroid-belt') return ASTEROID_BELT_DATA;
    return SOLAR_SYSTEM_DATA.find(p => p.id === id);
}

// Kệ sưu tập huy hiệu: trả lời đúng quiz của thiên thể nào thì sáng huy hiệu đó.
// Đủ 10/10 → danh hiệu "Nhà du hành vũ trụ".
export const SolarCollection: React.FC<SolarCollectionProps> = ({ onClose }) => {
    const { currentStudent } = useStudent();
    const badges = currentStudent?.solarBadges ?? [];
    const total = COLLECTIBLE_BODY_IDS.length;
    const collected = COLLECTIBLE_BODY_IDS.filter(id => badges.includes(id)).length;
    const complete = collected === total;

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-800 border border-white/15 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                >
                    <X size={18} />
                </button>

                <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🏆</span>
                    <h2 className="text-xl font-black text-white">Bộ Sưu Tập Vũ Trụ</h2>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                    Trả lời đúng thử thách của mỗi thiên thể để thắp sáng huy hiệu!
                </p>

                {/* Thanh tiến độ */}
                <div className="mb-5">
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                        <span className="font-semibold">{collected}/{total} huy hiệu</span>
                        {complete && <span className="text-yellow-300 font-bold">Hoàn thành!</span>}
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-700"
                            style={{ width: `${(collected / total) * 100}%` }}
                        />
                    </div>
                </div>

                {complete && (
                    <div className="mb-5 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/40 rounded-2xl text-center animate-in zoom-in-95 duration-500">
                        <div className="text-3xl mb-1">🚀👨‍🚀</div>
                        <div className="text-yellow-200 font-black text-lg">Nhà Du Hành Vũ Trụ Thực Thụ!</div>
                        <div className="text-yellow-100/70 text-xs mt-1">
                            Bé đã chinh phục cả Hệ Mặt Trời — NASA tự hào về bé!
                        </div>
                    </div>
                )}

                {/* Lưới huy hiệu */}
                <div className="grid grid-cols-5 gap-3">
                    {COLLECTIBLE_BODY_IDS.map(id => {
                        const body = bodyById(id);
                        if (!body) return null;
                        const owned = badges.includes(id);
                        const gradient = `radial-gradient(circle at 30% 30%, ${body.gradientColors[0]}, ${body.gradientColors[1]}, ${body.gradientColors[2] || body.gradientColors[1]})`;
                        return (
                            <div key={id} className="flex flex-col items-center gap-1.5">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${owned
                                        ? 'ring-2 ring-yellow-300/70 shadow-[0_0_16px_rgba(250,204,21,0.35)]'
                                        : 'bg-white/5 ring-1 ring-white/10'
                                        }`}
                                    style={owned ? { background: gradient } : undefined}
                                >
                                    {!owned && <span className="text-white/30 text-lg font-bold">?</span>}
                                </div>
                                <span className={`text-[9px] text-center leading-tight ${owned ? 'text-white/90 font-semibold' : 'text-white/35'}`}>
                                    {body.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
