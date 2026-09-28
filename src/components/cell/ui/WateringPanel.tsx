import React from 'react';
import { X } from 'lucide-react';

interface WateringPanelProps {
    water: number;               // 0..100
    onChange: (v: number) => void;
    onClose: () => void;
}

// Chậu cây nhỏ: thân rũ xuống khi thiếu nước — nối tế bào (vi mô) với điều bé thấy ngoài đời (vĩ mô)
function Plant({ water }: { water: number }) {
    const droop = (1 - water / 100) * 38;
    const leaf = water < 35 ? '#a3a33a' : water < 70 ? '#65a30d' : '#22c55e';
    return (
        <svg viewBox="0 0 80 90" className="w-16 h-[72px] shrink-0" aria-hidden="true">
            <path d="M18 62 h44 l-5 24 h-34 z" fill="#c2410c" />
            <rect x="15" y="58" width="50" height="7" rx="3" fill="#ea580c" />
            <g style={{ transform: `rotate(${droop}deg)`, transformOrigin: '40px 60px', transition: 'transform 0.6s' }}>
                <path d="M40 60 C 40 44, 41 34, 42 22" stroke="#16a34a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <ellipse cx="30" cy="36" rx="11" ry="5.5" fill={leaf} transform="rotate(-28 30 36)" style={{ transition: 'fill 0.6s' }} />
                <ellipse cx="52" cy="30" rx="12" ry="6" fill={leaf} transform="rotate(24 52 30)" style={{ transition: 'fill 0.6s' }} />
                <ellipse cx="42" cy="18" rx="8" ry="5" fill={leaf} style={{ transition: 'fill 0.6s' }} />
            </g>
        </svg>
    );
}

// Thí nghiệm "Tưới nước": kéo thanh nước → không bào teo/căng, cả khối nguyên sinh co tách khỏi thành
// cứng (co nguyên sinh) — giải thích vì sao quên tưới thì cây héo.
export const WateringPanel: React.FC<WateringPanelProps> = ({ water, onChange, onClose }) => {
    const state = water >= 70
        ? { title: 'Tế bào căng nước 💧', text: 'Không bào đầy nước ép màng sát vào thành tế bào — tế bào căng cứng nên lá cây tươi, đứng thẳng.' }
        : water >= 35
            ? { title: 'Hơi thiếu nước…', text: 'Không bào mất bớt nước và nhỏ lại, tế bào bắt đầu mềm đi.' }
            : { title: 'Cây héo rồi! 🥀', text: 'Không bào teo lại, cả màng tế bào co rúm, tách khỏi thành cứng (gọi là co nguyên sinh). Kéo sang phải để tưới cây nào!' };
    return (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-20 sm:bottom-24 z-[95] w-[min(520px,94vw)] rounded-3xl border border-white/15 bg-slate-950/85 backdrop-blur-xl shadow-2xl p-4 text-white animate-[cellCardIn_0.35s_ease-out]">
            <div className="flex items-start gap-3">
                <Plant water={water} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xs font-black tracking-wider text-sky-300">🧪 THÍ NGHIỆM: TƯỚI NƯỚC CHO CÂY</h3>
                        <button onClick={onClose} aria-label="Đóng thí nghiệm" className="ml-auto p-1.5 rounded-lg bg-white/10 hover:bg-white/20"><X size={16} /></button>
                    </div>
                    <p className="mt-1 font-black">{state.title}</p>
                    <p className="text-sm text-white/75 leading-relaxed">{state.text}</p>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
                <span className="text-xl" aria-hidden="true">🏜️</span>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={water}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="flex-1 accent-sky-400 h-2"
                    aria-label="Lượng nước"
                />
                <span className="text-xl" aria-hidden="true">🚿</span>
            </div>
        </div>
    );
};
