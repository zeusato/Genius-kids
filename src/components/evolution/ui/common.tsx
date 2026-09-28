import React from 'react';
import type { AtlasInfo } from '../scene/world';
import { SECTOR_COLOR, EXTINCT_COLOR, HUMAN_COLOR } from '../../../data/evolution/sectors';
import type { FlatNode } from '../engine/tree';

export const ATLAS_URL = () => `${import.meta.env.BASE_URL}evolution/atlas.webp`;

/** Hình bóng sinh vật lấy từ atlas (CSS background) trong một vòng tròn màu sector. */
export const NodeIcon: React.FC<{ node: FlatNode; atlas: AtlasInfo | null; size?: number; dark?: boolean; className?: string }> = ({ node, atlas, size = 44, dark, className = '' }) => {
    const it = atlas?.items[node.id];
    const color = node.extinct ? EXTINCT_COLOR : node.data.youAreHere ? HUMAN_COLOR : SECTOR_COLOR[node.sector];
    const s = size * 0.86;
    const style: React.CSSProperties = it ? {
        width: s, height: s,
        backgroundImage: `url(${ATLAS_URL()})`,
        backgroundSize: `${s * atlas!.cols}px ${s * atlas!.cols}px`,
        backgroundPosition: `${-(it.i % atlas!.cols) * s}px ${-Math.floor(it.i / atlas!.cols) * s}px`,
        filter: dark ? 'brightness(0)' : undefined,
    } : {};
    return (
        <span className={`inline-grid place-items-center rounded-full flex-shrink-0 ${className}`}
            style={{ width: size, height: size, background: dark ? '#e2e8f0' : `radial-gradient(circle at 35% 30%, ${color}55, #0b1324 75%)`, boxShadow: `0 0 0 1.5px ${color}88, 0 0 14px ${color}44` }}>
            {it ? <span style={style} /> : <span style={{ color, fontSize: size * 0.45 }}>●</span>}
        </span>
    );
};

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; label: string }> = ({ active, label, children, className = '', ...rest }) => (
    <button
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={active}
        className={`grid place-items-center w-11 h-11 rounded-full border text-white backdrop-blur-md transition-all active:scale-95 ${active ? 'bg-amber-400/25 border-amber-300/70 shadow-[0_0_16px_rgba(253,230,138,0.35)]' : 'bg-slate-900/55 border-white/15 hover:bg-white/15'} ${className}`}
        {...rest}
    >
        {children}
    </button>
);

export const Panel: React.FC<React.PropsWithChildren<{ className?: string; onClose?: () => void; title?: React.ReactNode }>> = ({ className = '', onClose, title, children }) => (
    <div className={`rounded-3xl bg-slate-950/88 border border-white/12 shadow-2xl backdrop-blur-xl text-slate-100 ${className}`}>
        {(title || onClose) && (
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <div className="flex-1 font-extrabold text-base">{title}</div>
                {onClose && <button type="button" onClick={onClose} aria-label="Đóng" className="w-9 h-9 rounded-full hover:bg-white/10 text-white/70 hover:text-white text-lg">✕</button>}
            </div>
        )}
        {children}
    </div>
);
