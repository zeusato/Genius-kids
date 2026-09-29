import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { GOOGLE_VOICE, cancelSpeech, getPreferredVoice, listVoices, onSpeechAvailabilityChanged, setPreferredVoice, speak, type SpeechLang } from '@/src/utils/speech';

// Chọn giọng đọc cho tiếng Việt và tiếng Anh (lưu theo máy, dùng chung toàn app). Khi máy chỉ có giọng một
// thứ tiếng, chọn "Giọng online" cho cả hai để nghe như cùng một người.
const SAMPLE: Record<SpeechLang, string> = {
    'vi-VN': 'Xin chào! Tớ đọc tiếng Việt cho em nghe.',
    'en-US': 'Hello! Hydrogen, oxygen, carbon.',
};

const Row: React.FC<{ lang: SpeechLang; label: string; tick: number }> = ({ lang, label, tick }) => {
    const voices = listVoices(lang);
    const [value, setValue] = useState(() => getPreferredVoice(lang) ?? '');
    useEffect(() => { setValue(getPreferredVoice(lang) ?? ''); }, [lang, tick]);
    const choose = (v: string) => {
        setValue(v);
        setPreferredVoice(lang, v || null);
        speak(SAMPLE[lang], { lang, rate: 0.9 });
    };
    return (
        <div className="space-y-1">
            <p className="text-sm font-semibold">{label}</p>
            <div className="flex gap-2">
                <select value={value} onChange={e => choose(e.target.value)} className="flex-1 min-w-0 rounded-xl bg-slate-800 border border-white/15 px-3 py-2 text-sm text-white">
                    <option value="">Tự chọn {voices[0] ? `(${voices[0].name})` : '(giọng online)'}</option>
                    {voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}
                    <option value={GOOGLE_VOICE}>🌐 Giọng online (cần mạng)</option>
                </select>
                <button onClick={() => speak(SAMPLE[lang], { lang, rate: 0.9 })} className="px-3 rounded-xl bg-cyan-500/25 border border-cyan-300/40 text-sm whitespace-nowrap">▶ Thử</button>
            </div>
            {voices.length === 0 && <p className="text-[11px] text-amber-200/80">Máy chưa có giọng {label.toLowerCase()} — sẽ dùng giọng online.</p>}
        </div>
    );
};

export const VoicePicker: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [tick, setTick] = useState(0);
    useEffect(() => onSpeechAvailabilityChanged(() => setTick(t => t + 1)), []);   // Chrome tải danh sách giọng muộn
    useEffect(() => () => cancelSpeech(), []);
    return (
        <div className="fixed inset-0 z-[90] bg-black/60 grid place-items-center p-3" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl p-4 text-slate-100 space-y-4">
                <div className="flex items-center gap-2"><b className="text-lg">🗣️ Giọng đọc</b><div className="flex-1" /><button onClick={onClose} aria-label="Đóng" className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"><X size={18} /></button></div>
                <p className="text-xs text-white/60">Tên nguyên tố (hydrogen, oxygen…) đọc bằng giọng tiếng Anh, phần còn lại bằng giọng tiếng Việt. Chọn hai giọng nghe hợp nhau (cùng nam hoặc cùng nữ).</p>
                <Row lang="vi-VN" label="Tiếng Việt" tick={tick} />
                <Row lang="en-US" label="Tiếng Anh" tick={tick} />
            </div>
        </div>
    );
};
