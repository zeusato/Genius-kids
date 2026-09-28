import React, { useEffect, useRef } from 'react';
import { Scene3DApi } from '../scene3d/core';
import { LIGHT_MICROSCOPE_LIMIT } from '../../../data/cellStory';

interface MicroscopeHudProps {
    apiRef: React.MutableRefObject<Scene3DApi | null>;
    umPerUnit: number;
    compact: boolean;
}

const NICE_UM = [0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500];
const PX_MM = 0.2646; // 1 px CSS ≈ 0,2646 mm (96 dpi) — độ phóng đại tính theo kích thước trên màn hình này

function fmtUm(v: number): string {
    return `${v.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} µm`;
}

function fmtMag(v: number): string {
    const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 1)); // giữ 2 chữ số có nghĩa
    return `×${(Math.round(v / p) * p).toLocaleString('vi-VN')}`;
}

// Thước đo µm + độ phóng đại + loại kính — cập nhật theo khoảng cách camera mỗi frame (ghi thẳng
// DOM, không setState). Zoom qua ~×2.000 thì chuyển sang "kính hiển vi điện tử": kính quang học
// không nhìn rõ được ribôxôm hay mào ty thể.
export const MicroscopeHud: React.FC<MicroscopeHudProps> = ({ apiRef, umPerUnit, compact }) => {
    const bar = useRef<HTMLDivElement>(null);
    const label = useRef<HTMLSpanElement>(null);
    const mag = useRef<HTMLSpanElement>(null);
    const kind = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let raf = 0;
        const last = { um: '', mag: '', kind: '', w: -1 };
        const tick = () => {
            const api = apiRef.current;
            if (api && bar.current && label.current && mag.current && kind.current) {
                const dist = Math.max(api.viewDistance(), 0.01);
                const pxPerUnit = (window.innerHeight / 2) / (dist * Math.tan((api.fovDeg() * Math.PI) / 360));
                const pxPerUm = pxPerUnit / umPerUnit;
                const maxW = compact ? 90 : 130;
                let um = NICE_UM[0];
                for (const n of NICE_UM) if (n * pxPerUm <= maxW) um = n;
                const w = Math.round(um * pxPerUm);
                const m = pxPerUm * PX_MM * 1000;
                const t = { um: fmtUm(um), mag: fmtMag(m), kind: m < LIGHT_MICROSCOPE_LIMIT ? '🔬 Kính hiển vi quang học' : '⚛️ Kính hiển vi điện tử' };
                if (w !== last.w) { bar.current.style.width = `${w}px`; last.w = w; }
                if (t.um !== last.um) { label.current.textContent = t.um; last.um = t.um; }
                if (t.mag !== last.mag) { mag.current.textContent = t.mag; last.mag = t.mag; }
                if (t.kind !== last.kind) { kind.current.textContent = t.kind; last.kind = t.kind; }
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [apiRef, umPerUnit, compact]);

    return (
        <div
            className={`absolute z-40 left-3 sm:left-5 bottom-3 sm:bottom-5 pointer-events-none select-none rounded-2xl bg-black/35 border border-white/10 backdrop-blur-md text-white ${compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2.5'}`}
            title="1 µm = một phần nghìn milimét"
        >
            <div className="flex items-center gap-2.5">
                <div ref={bar} className="h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" style={{ width: 60 }} />
                <span ref={label} className="text-xs sm:text-sm font-black tabular-nums" />
            </div>
            <div className={`mt-1 flex items-center gap-1.5 text-white/70 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                <span ref={mag} className="font-bold tabular-nums text-cyan-200" />
                <span>·</span>
                <span ref={kind} />
            </div>
        </div>
    );
};
