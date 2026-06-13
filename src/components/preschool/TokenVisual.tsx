import React from 'react';
import type { PreschoolToken } from './types';

interface TokenVisualProps {
    token: PreschoolToken;
    /** Kích thước tổng thể: 'lg' cho flashcard, 'md' cho lựa chọn quiz. */
    size?: 'lg' | 'md' | 'sm';
}

/** Hiển thị một token: chữ/số lớn, ô màu, hoặc nhóm emoji để đếm. */
export const TokenVisual: React.FC<TokenVisualProps> = ({ token, size = 'lg' }) => {
    const bigCls = size === 'lg' ? 'text-8xl' : size === 'md' ? 'text-6xl' : 'text-4xl';
    const subCls = size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-3xl' : 'text-2xl';
    const emojiCls = size === 'lg' ? 'text-6xl' : size === 'md' ? 'text-4xl' : 'text-3xl';

    if (token.kind === 'color') {
        return (
            <div
                className="w-full h-full rounded-3xl shadow-inner ring-4 ring-black/5 flex items-center justify-center"
                style={{ backgroundColor: token.hex }}
            >
                {token.big && (
                    <span className={`${bigCls} font-extrabold ${token.light ? 'text-slate-700' : 'text-white'}`}>
                        {token.big}
                    </span>
                )}
            </div>
        );
    }

    if (token.kind === 'count') {
        const n = token.count ?? 0;
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                {token.big && <span className={`${bigCls} font-extrabold text-slate-800 leading-none`}>{token.big}</span>}
                <div className="flex flex-wrap items-center justify-center gap-1 max-w-[90%]">
                    {Array.from({ length: n }).map((_, i) => (
                        <span key={i} className={size === 'lg' ? 'text-4xl' : 'text-2xl'}>{token.emoji}</span>
                    ))}
                </div>
            </div>
        );
    }

    // kind 'text'
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
            <div className="flex items-end justify-center gap-3">
                {token.big && <span className={`${bigCls} font-extrabold text-brand-600 leading-none`}>{token.big}</span>}
                {token.sub && <span className={`${subCls} font-extrabold text-fun-purple leading-none`}>{token.sub}</span>}
            </div>
            {token.emoji && <span className={emojiCls}>{token.emoji}</span>}
        </div>
    );
};
