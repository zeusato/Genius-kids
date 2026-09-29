import React from 'react';
import type { ElementFull } from './engine/elements';
import type { CellLook } from './engine/lenses';

export type CellMark = 'target' | 'ok' | 'bad' | null;

interface ElementCellProps {
    element: ElementFull;
    onClick: (element: ElementFull) => void;
    onHover?: (element: ElementFull | null) => void;
    look: CellLook;
    collected?: boolean;
    mark?: CellMark;
    /** Mở màn: ô còn tối (chưa được "nấu" ra). */
    dark?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 sm:w-16 sm:h-16 text-sm',
    lg: 'w-20 h-20 text-base'
};

const BUBBLES: [number, number, number][] = [[18, 70, 7], [70, 55, 5], [40, 22, 4], [82, 18, 6]];

// Kính 🎨 Nhóm (look.key 'g') cho ra ĐÚNG markup + style của ô cũ — người dùng ưng bố cục/giao diện này.
// Các kính khác chỉ đổi màu/nội dung bên trong, không đổi kích thước hay vị trí ô.
const ElementCellImpl: React.FC<ElementCellProps> = ({ element, onClick, onHover, look, collected, mark, dark, size = 'md' }) => {
    const color = dark ? '#1e293b' : look.dim ? '#475569' : look.color;
    const glow = dark || look.dim ? 'transparent' : look.glow;
    const text = dark ? '#334155' : look.dim ? '#64748b' : (look.text ?? look.color);
    const markRing = mark === 'ok' ? '0 0 0 3px #4ade80, 0 0 24px #4ade80' : mark === 'bad' ? '0 0 0 3px #f87171' : mark === 'target' ? '0 0 0 3px #fde047, 0 0 22px #fde047' : '';
    const pattern = !dark && look.pattern;
    return (
        <button
            onClick={() => onClick(element)}
            onMouseEnter={onHover ? () => onHover(element) : undefined}
            onMouseLeave={onHover ? () => onHover(null) : undefined}
            onFocus={onHover ? () => onHover(element) : undefined}
            data-z={element.atomicNumber}
            className={`
                ${sizeClasses[size]}
                relative rounded-lg
                flex flex-col items-center justify-center
                transition-all duration-300
                hover:scale-110 hover:z-10
                focus:outline-none focus:ring-2 focus:ring-white/50
                group cursor-pointer
            `}
            style={{
                backgroundColor: dark ? 'rgba(2,6,23,.6)' : look.dim ? 'rgba(71,85,105,.08)' : `${color}20`,
                border: `2px ${look.dashed ? 'dashed' : 'solid'} ${color}`,
                boxShadow: [glow !== 'transparent' ? `0 0 10px ${glow}, inset 0 0 10px ${glow}` : '', markRing].filter(Boolean).join(', ') || 'none',
                opacity: look.dim && !dark ? 0.4 : 1,
                backgroundImage: pattern === 'solid' ? 'repeating-linear-gradient(60deg,rgba(255,255,255,.08) 0 1.5px,transparent 1.5px 8px),repeating-linear-gradient(-60deg,rgba(255,255,255,.08) 0 1.5px,transparent 1.5px 8px)' : undefined,
                translate: pattern === 'gas' ? '0 -2px' : undefined,
            }}
            title={`${element.sgkName}${element.oldName !== element.sgkName ? ` (tên cũ: ${element.oldName})` : ''} · ${element.nameEn}`}
            aria-label={`${element.atomicNumber} ${element.sgkName}`}
        >
            {/* lớp nền của kính */}
            {!dark && look.stripes && (
                <span className="absolute inset-0 rounded-md overflow-hidden flex flex-col opacity-50 pointer-events-none">
                    {look.stripes.map((s, i) => <span key={i} style={{ flex: s.frac, background: s.color }} />)}
                </span>
            )}
            {pattern === 'liquid' && (
                <span className="absolute left-0 right-0 bottom-0 h-1/2 rounded-b-md pointer-events-none"
                    style={{ background: 'linear-gradient(180deg,rgba(34,211,238,.5),rgba(8,145,178,.6))' }}>
                    <span className="absolute left-0 right-0 -top-1.5 h-1.5"
                        style={{ background: 'radial-gradient(ellipse 6px 4px at 6px 6px,rgba(34,211,238,.5) 98%,transparent 100%) repeat-x', backgroundSize: '12px 6px' }} />
                </span>
            )}
            {pattern === 'gas' && BUBBLES.map(([x, y, r], i) => (
                <span key={i} className="absolute rounded-full pointer-events-none"
                    style={{ left: `${x}%`, top: `${y}%`, width: r, height: r, border: '1.5px solid rgba(254,215,170,.9)', boxShadow: '0 0 6px rgba(251,146,60,.8)' }} />
            ))}

            {/* Atomic Number */}
            <span
                className="absolute top-0.5 left-1 text-[8px] sm:text-[10px] font-medium opacity-70 z-[1]"
                style={{ color: text }}
            >
                {element.atomicNumber}
            </span>
            {(look.badge || collected) && !dark && (
                <span className="absolute top-0.5 right-1 text-[8px] sm:text-[10px] leading-none z-[1]" style={{ color: look.badge ? text : '#fde68a' }}>
                    {look.badge ?? '✦'}
                </span>
            )}

            {look.big && !dark ? (
                <>
                    <span className="text-xl sm:text-2xl leading-none z-[1]">{look.big}</span>
                    <span className="text-[8px] sm:text-[10px] font-bold z-[1]" style={{ color: text }}>{look.sub}</span>
                </>
            ) : (
                <>
                    {/* Symbol */}
                    <span
                        className="font-bold text-base sm:text-lg leading-none z-[1]"
                        style={{
                            color: text,
                            textShadow: glow !== 'transparent' ? `0 0 10px ${glow}` : 'none'
                        }}
                    >
                        {look.symbol ?? element.symbol}
                    </span>

                    {/* Name (only show on larger sizes) */}
                    {size !== 'sm' && (
                        <span
                            className="text-[8px] sm:text-[10px] opacity-80 truncate w-full text-center px-1 z-[1]"
                            style={{ color: text, fontWeight: look.sub ? 700 : undefined }}
                        >
                            {look.sub ?? (dark ? '' : element.sgkName)}
                        </span>
                    )}
                </>
            )}

            {/* Hover glow effect */}
            <div
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    boxShadow: `0 0 20px ${color}, 0 0 40px ${glow}`,
                }}
            />
        </button>
    );
};

export const ElementCell = React.memo(ElementCellImpl, (a, b) =>
    a.element === b.element && a.look.key === b.look.key && a.look.color === b.look.color && a.look.sub === b.look.sub &&
    a.collected === b.collected && a.mark === b.mark && a.dark === b.dark && a.onClick === b.onClick && a.onHover === b.onHover);
