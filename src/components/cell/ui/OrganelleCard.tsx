import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, Zap } from 'lucide-react';
import { Organelle } from '../../../data/cellData';
import { CellSpeakButton } from './CellSpeakButton';
import { DnaRibbon } from './DnaRibbon';

interface OrganelleCardProps {
    organelle: Organelle;
    index: number;
    total: number;
    seen: number;
    layout: 'side' | 'bottom';
    autoSpeak: boolean;
    onPrev: () => void;
    onNext: () => void;
    onClose: () => void;
}

// Thẻ bào quan: bào quan TỰ GIỚI THIỆU ("Tớ là...") trong bong bóng thoại — câu ngắn, đọc to được —
// rồi mới tới nhiệm vụ và "Bạn có biết?". Phần chữ dài (cấu tạo, vị trí, so sánh) gập trong "Xem thêm"
// để bé nhỏ không ngợp. Mô hình 3D vẫn là nhân vật chính: thẻ chỉ chiếm một bên / nửa dưới màn hình.
export const OrganelleCard: React.FC<OrganelleCardProps> = ({ organelle: o, index, total, seen, layout, autoSpeak, onPrev, onNext, onClose }) => {
    const [more, setMore] = useState(false);
    useEffect(() => { setMore(false); }, [o.id]);
    const isDNA = o.id === 'nucleus' || o.id === 'nucleoid' || o.id === 'plasmid';
    const shell = layout === 'side'
        ? 'fixed right-3 sm:right-4 top-20 bottom-4 w-[min(390px,42vw)]'
        : 'fixed inset-x-2 bottom-2 max-h-[50vh]';

    return (
        <div
            key={o.id}
            className={`${shell} z-[90] flex flex-col rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl shadow-2xl text-white animate-[cellCardIn_0.35s_ease-out]`}
            style={{ boxShadow: `0 30px 80px -40px ${o.color}` }}
            role="dialog"
            aria-label={o.name}
        >
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <div
                        className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl"
                        style={{ background: `${o.color}33`, border: `1.5px solid ${o.color}`, boxShadow: `0 0 24px ${o.color}66` }}
                    >
                        {o.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl sm:text-2xl font-black leading-tight">{o.name}</h2>
                        <p className="text-xs text-white/50 italic">{o.nameEn}</p>
                        <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: `${o.color}26`, color: '#fff', border: `1px solid ${o.color}88` }}>
                            {o.short}
                        </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <CellSpeakButton text={`${o.kid} ${o.details.function}`} autoPlay={autoSpeak} className="p-2.5" />
                        <button onClick={onClose} title="Đóng" aria-label="Đóng" className="p-2.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex gap-3 items-stretch">
                    <div className="relative flex-1 rounded-2xl px-4 py-3 text-[15px] sm:text-base leading-relaxed text-white/95" style={{ background: `${o.color}1f`, border: `1px solid ${o.color}55` }}>
                        <span className="absolute -top-2 left-5 w-4 h-4 rotate-45" style={{ background: '#0f172a', borderLeft: `1px solid ${o.color}55`, borderTop: `1px solid ${o.color}55` }} />
                        💬 {o.kid}
                    </div>
                    {isDNA && <DnaRibbon color={o.color} className="w-10 shrink-0" />}
                </div>

                <div className="mt-4">
                    <h3 className="flex items-center gap-1.5 text-sky-300 font-black uppercase text-xs tracking-wider"><Zap size={14} /> Nhiệm vụ</h3>
                    <p className="mt-1 text-sm text-white/85 leading-relaxed">{o.details.function}</p>
                </div>

                <button
                    onClick={() => setMore((v) => !v)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/70 hover:text-white"
                    aria-expanded={more}
                >
                    <ChevronDown size={14} className={`transition-transform ${more ? 'rotate-180' : ''}`} /> {more ? 'Thu gọn' : 'Xem thêm: hình dáng, vị trí, so sánh'}
                </button>
                {more && (
                    <div className="mt-2 space-y-2.5 text-sm text-white/80 leading-relaxed">
                        <p><b className="text-violet-300">🧩 Hình dáng:</b> {o.details.structure}</p>
                        <p><b className="text-emerald-300">📍 Ở đâu:</b> {o.details.location}</p>
                        <p><b className="text-pink-300">🎈 Giống như:</b> {o.details.analogy}</p>
                    </div>
                )}

                <div className="mt-4 rounded-2xl p-3.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-400/30">
                    <h4 className="font-black text-amber-300 text-xs uppercase tracking-wider">💡 Bạn có biết?</h4>
                    <p className="mt-1 text-sm text-amber-50/95 leading-relaxed">{o.funFact}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t border-white/10">
                <button onClick={onPrev} aria-label="Bộ phận trước" className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"><ChevronLeft size={18} /></button>
                <div className="flex-1 text-center">
                    <div className="text-xs font-bold text-white/80">{index + 1} / {total}</div>
                    <div className="text-[10px] text-white/50">Đã khám phá {seen}/{total} bộ phận</div>
                </div>
                <button onClick={onNext} aria-label="Bộ phận tiếp theo" className="flex items-center gap-1 pl-3 pr-2 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 to-violet-600 hover:from-sky-400 hover:to-violet-500 transition-all">
                    Tiếp <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};
