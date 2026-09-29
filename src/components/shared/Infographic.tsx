// Ảnh infographic (Supabase, cần mạng): ảnh xem trước + trình xem phóng to/kéo. Dùng chung Cây Tiến Hóa và Bảng Tuần Hoàn.
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { getInfographicUrl } from '@/src/lib/supabase';

export const InfoThumb: React.FC<{ url: string; className?: string }> = ({ url, className = '' }) => {
    const [src, setSrc] = useState(() => getInfographicUrl(url));
    const [failed, setFailed] = useState(!src);
    useEffect(() => { const u = getInfographicUrl(url); setSrc(u); setFailed(!u); }, [url]);
    return (
        <span className={`block relative w-full bg-slate-800/60 ${className}`}>
            {!failed && <img src={src} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover object-top"
                onError={() => { if (src.endsWith('.jpeg')) setSrc(src.replace('.jpeg', '.png')); else setFailed(true); }} />}
            {failed && <span className="absolute inset-0 grid place-items-center text-xs text-white/40">Cần mạng để xem tranh</span>}
        </span>
    );
};

export const InfographicViewer: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
    const [failed, setFailed] = useState(false);
    const [src, setSrc] = useState(() => getInfographicUrl(url));
    useEffect(() => {
        const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-[200] bg-black/92 backdrop-blur-md" onClick={onClose}>
            <button type="button" onClick={onClose} aria-label="Đóng" className="absolute top-4 right-4 z-10 w-12 h-12 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white"><X size={24} /></button>
            {!src || failed || !navigator.onLine ? (
                <div className="absolute inset-0 grid place-items-center text-white/70 text-center p-6">Cần kết nối mạng để xem tranh này.</div>
            ) : (
                <div className="absolute inset-0" onClick={e => e.stopPropagation()}>
                    <TransformWrapper minScale={1} maxScale={5} centerOnInit>
                        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full grid place-items-center">
                            <img src={src} alt="Tranh chi tiết" className="max-w-full max-h-full object-contain"
                                onError={() => { if (src.endsWith('.png')) setSrc(src.replace('.png', '.jpeg')); else setFailed(true); }} />
                        </TransformComponent>
                    </TransformWrapper>
                    <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/50">Véo hoặc cuộn để phóng to</div>
                </div>
            )}
        </div>
    );
};
