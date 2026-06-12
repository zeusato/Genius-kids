import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { SpeakButton } from './SpeakButton';

export interface InfoBodyView {
    id: string; // khớp với file audio tạo sẵn body-<id>.mp3
    name: string;
    kindLabel: string;
    diameter: string;
    description: string;
    facts: string[];
    funFact: string;
    color: string;
    gradientColors: string[];
}

interface BodyInfoCardProps {
    body: InfoBodyView;
    onClose: () => void;
}

// Thẻ thông tin nhẹ (không Canvas 3D) cho vệ tinh / hành tinh lùn / sao chổi.
export const BodyInfoCard: React.FC<BodyInfoCardProps> = ({ body, onClose }) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const g = `radial-gradient(circle at 30% 30%, ${body.gradientColors[0]}, ${body.gradientColors[1]}, ${body.gradientColors[2] || body.gradientColors[1]})`;
    const speakable = { id: body.id, name: body.name, description: body.description, facts: body.facts } as any;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-800 border border-white/15 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">
                    <X size={18} />
                </button>

                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full shrink-0 shadow-lg" style={{ background: g, boxShadow: `0 0 24px ${body.color}55` }} />
                    <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wider text-white/45 font-bold">{body.kindLabel}</div>
                        <h2 className="text-2xl font-black text-white leading-tight">{body.name}</h2>
                        <div className="text-xs text-white/50">Đường kính: {body.diameter}</div>
                    </div>
                    <div className="ml-auto self-start"><SpeakButton planet={speakable} /></div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-4">{body.description}</p>

                <div className="space-y-2 mb-4">
                    {body.facts.map((f, i) => (
                        <div key={i} className="flex gap-2 p-2.5 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-cyan-400 font-bold text-sm shrink-0">{i + 1}.</span>
                            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">{f}</p>
                        </div>
                    ))}
                </div>

                <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-orange-500/15">
                    <h4 className="font-bold text-amber-400 mb-1 text-xs uppercase flex items-center gap-1">💡 Bạn có biết?</h4>
                    <p className="text-amber-100 italic text-sm">{body.funFact}</p>
                </div>
            </div>
        </div>
    );
};
