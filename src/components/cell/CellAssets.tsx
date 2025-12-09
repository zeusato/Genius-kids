import React from 'react';

interface SvgProps {
    className?: string;
    color?: string;
    animate?: boolean;
}

// 1. Nucleus (Nhân)
export const NucleusSvg: React.FC<SvgProps> = ({ className, color = '#A855F7', animate }) => (
    <svg viewBox="0 0 100 100" className={className}>
        <defs>
            <radialGradient id="nucleusGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                <stop offset="100%" stopColor={color} stopOpacity="0.4" />
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#nucleusGrad)" stroke={color} strokeWidth="2" />
        <circle cx="20" cy="30" r="3" fill="#00000040" />
        <circle cx="80" cy="40" r="3" fill="#00000040" />
        <circle cx="40" cy="85" r="3" fill="#00000040" />
        <circle cx="70" cy="15" r="3" fill="#00000040" />
        <circle cx="50" cy="50" r="15" fill={color} className={animate ? 'animate-pulse' : ''} />
    </svg>
);

// 2. Mitochondria (Ty thể)
export const MitochondriaSvg: React.FC<SvgProps> = ({ className, color = '#EF4444', animate }) => (
    <svg viewBox="0 0 100 60" className={className}>
        <defs>
            <filter id="glow-mito">
                <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <path d="M10,30 C10,10 30,5 50,5 C70,5 90,10 90,30 C90,50 70,55 50,55 C30,55 10,50 10,30 Z" fill={`${color}40`} stroke={color} strokeWidth="1.5" filter="url(#glow-mito)" />
        <path d="M20,30 Q25,15 30,30 T40,30 T50,30 T60,30 T70,30 T80,30" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" className={animate ? 'animate-[dash_3s_linear_infinite]' : ''} strokeDasharray="4" opacity="0.9" />
        <circle cx="25" cy="20" r="1.5" fill="#FFF" opacity="0.6" />
        <circle cx="45" cy="40" r="1.5" fill="#FFF" opacity="0.6" />
        <circle cx="65" cy="15" r="1.5" fill="#FFF" opacity="0.6" />
    </svg>
);

// 3. Chloroplast (Lục lạp)
export const ChloroplastSvg: React.FC<SvgProps> = ({ className, color = '#22C55E' }) => (
    <svg viewBox="0 0 100 60" className={className}>
        <ellipse cx="50" cy="30" rx="45" ry="25" fill={`${color}40`} stroke={color} strokeWidth="2" />
        <g fill={color} opacity="0.8">
            <rect x="25" y="20" width="10" height="20" rx="2" />
            <rect x="45" y="15" width="10" height="30" rx="2" />
            <rect x="65" y="20" width="10" height="20" rx="2" />
        </g>
        <line x1="35" y1="30" x2="45" y2="30" stroke={color} strokeWidth="1" />
        <line x1="55" y1="30" x2="65" y2="30" stroke={color} strokeWidth="1" />
    </svg>
);

// 4. Vacuole (Không bào) - Kidney/Bean shape to leave room for Nucleus
export const VacuoleSvg: React.FC<SvgProps> = ({ className, color = '#0EA5E9' }) => (
    <svg viewBox="0 0 100 100" className={className}>
        {/* Kidney shape - indented on left side for nucleus */}
        <path
            d="M20,50 Q10,25 30,15 Q60,5 85,20 Q100,40 95,60 Q90,85 60,95 Q30,100 15,80 Q5,65 20,50"
            fill={`${color}30`}
            stroke={color}
            strokeWidth="1.5"
        />
        {/* Water shimmer effect */}
        <path d="M40,30 Q60,35 75,30" fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="2" />
        <path d="M35,55 Q55,60 80,50" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="2" />
    </svg>
);

// 5. Nucleoid (Vi khuẩn)
export const NucleoidSvg: React.FC<SvgProps> = ({ className, color = '#F59E0B' }) => (
    <svg viewBox="0 0 100 60" className={className}>
        <path d="M10,30 Q20,10 30,30 T50,30 T70,30 T90,30" fill="none" stroke={color} strokeWidth="3" strokeDasharray="4 2" opacity="0.8" />
        <path d="M10,30 Q20,50 30,30 T50,30 T70,30 T90,30" fill="none" stroke={color} strokeWidth="3" strokeDasharray="4 2" opacity="0.6" />
    </svg>
);

// 6. Particle (Ribosome)
export const ParticleSvg: React.FC<SvgProps> = ({ className, color = '#FFFFFF' }) => (
    <svg viewBox="0 0 10 10" className={className}>
        <circle cx="5" cy="5" r="4" fill={color} />
    </svg>
);

// 7. Flagellum (Roi)
export const FlagellumSvg: React.FC<SvgProps> = ({ className, color = '#EAB308', animate }) => (
    <svg viewBox="0 0 60 200" className={className} preserveAspectRatio="none">
        <path d="M30,0 Q50,30 30,60 T30,120 T30,180" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" className={animate ? 'animate-[wave_1s_linear_infinite]' : ''} />
    </svg>
);

// 8. ER (Lưới nội chất) - Subtle version
export const ERSvg: React.FC<SvgProps> = ({ className, color = '#F472B6' }) => (
    <svg viewBox="0 0 200 200" className={className}>
        <path d="M50,100 Q40,60 70,50 Q100,30 130,50 Q160,60 150,100 Q160,140 130,150 Q100,170 70,150 Q40,140 50,100" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.25" />
        <path d="M65,100 Q60,75 85,65 Q100,55 115,65 Q140,75 135,100 Q140,125 115,135 Q100,145 85,135 Q60,125 65,100" fill="none" stroke={color} strokeWidth="2" opacity="0.35" />
        <g fill="#FFF" opacity="0.5">
            <circle cx="55" cy="85" r="1.5" /> <circle cx="145" cy="85" r="1.5" />
            <circle cx="85" cy="145" r="1.5" /> <circle cx="115" cy="145" r="1.5" />
        </g>
    </svg>
);

// 9. Golgi Apparatus (Bộ máy Golgi)
export const GolgiSvg: React.FC<SvgProps> = ({ className, color = '#FB923C' }) => (
    <svg viewBox="0 0 100 100" className={className}>
        <path d="M20,70 Q50,90 80,70" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
        <path d="M15,55 Q50,75 85,55" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
        <path d="M10,40 Q50,60 90,40" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
        <path d="M25,25 Q50,45 75,25" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
        <circle cx="5" cy="30" r="4" fill={color} />
        <circle cx="95" cy="50" r="5" fill={color} />
        <circle cx="80" cy="15" r="3" fill={color} />
    </svg>
);

// 10. Lysosome (Tiêu thể)
export const LysosomeSvg: React.FC<SvgProps> = ({ className, color = '#60A5FA' }) => (
    <svg viewBox="0 0 60 60" className={className}>
        <circle cx="30" cy="30" r="28" fill={color} fillOpacity="0.6" />
        <circle cx="30" cy="30" r="20" fill={color} fillOpacity="0.8" />
        <circle cx="22" cy="22" r="4" fill="#FFF" fillOpacity="0.4" />
    </svg>
);

// 11. Centrosome (Trung thể)
export const CentrosomeSvg: React.FC<SvgProps> = ({ className, color = '#FDE047' }) => (
    <svg viewBox="0 0 60 60" className={className}>
        <rect x="25" y="10" width="10" height="30" rx="2" fill={color} stroke="black" strokeWidth="0.5" />
        <rect x="10" y="35" width="30" height="10" rx="2" fill={color} stroke="black" strokeWidth="0.5" />
        <circle cx="30" cy="30" r="28" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
    </svg>
);

// 12. Cytoskeleton (Khung xương)
export const CytoskeletonSvg: React.FC<SvgProps> = ({ className, color = '#94A3B8' }) => (
    <svg viewBox="0 0 100 100" className={className}>
        <path d="M0,0 L100,100" stroke={color} strokeWidth="1" opacity="0.3" />
        <path d="M100,0 L0,100" stroke={color} strokeWidth="1" opacity="0.3" />
        <path d="M50,0 L50,100" stroke={color} strokeWidth="1" opacity="0.3" />
        <path d="M0,50 L100,50" stroke={color} strokeWidth="1" opacity="0.3" />
    </svg>
);

// 13. Pili (Lông vi khuẩn) - Short hair-like projections
export const PiliSvg: React.FC<SvgProps> = ({ className, color = '#D97706' }) => (
    <svg viewBox="0 0 30 60" className={className}>
        <line x1="15" y1="0" x2="15" y2="60" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <line x1="8" y1="5" x2="8" y2="50" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        <line x1="22" y1="8" x2="22" y2="55" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
);

// 14. Ribosome (Hạt nhỏ) - Small dots
export const RibosomeSvg: React.FC<SvgProps> = ({ className, color = '#A3E635' }) => (
    <svg viewBox="0 0 20 20" className={className}>
        <circle cx="10" cy="10" r="8" fill={color} fillOpacity="0.8" />
        <circle cx="7" cy="7" r="2" fill="#FFF" fillOpacity="0.4" />
    </svg>
);

// 15. Cytoplasm for bacteria (Background)
export const CytoplasmBacSvg: React.FC<SvgProps> = ({ className, color = '#FBBF24' }) => (
    <svg viewBox="0 0 100 100" className={className}>
        <ellipse cx="50" cy="50" rx="48" ry="45" fill={`${color}25`} />
    </svg>
);

// 16. Capsule (Vỏ nhầy) - Outer slimy layer
export const CapsuleSvg: React.FC<SvgProps> = ({ className, color = '#FB923C' }) => (
    <svg viewBox="0 0 100 30" className={className}>
        <path d="M10,25 Q50,0 90,25" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <path d="M15,22 Q50,5 85,22" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 2" opacity="0.5" />
    </svg>
);

// 17. Cell Wall (Thành tế bào vi khuẩn) - Rigid outer layer
export const CellWallBacSvg: React.FC<SvgProps> = ({ className, color = '#92400E' }) => (
    <svg viewBox="0 0 30 100" className={className}>
        <rect x="5" y="10" width="20" height="80" rx="5" fill={color} fillOpacity="0.6" stroke={color} strokeWidth="2" />
        <line x1="15" y1="20" x2="15" y2="80" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
    </svg>
);

// 18. Plasma Membrane (Màng sinh chất)
export const PlasmaMembraneSvg: React.FC<SvgProps> = ({ className, color = '#CA8A04' }) => (
    <svg viewBox="0 0 30 100" className={className}>
        <rect x="5" y="10" width="20" height="80" rx="5" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1.5" />
        <circle cx="15" cy="30" r="3" fill={color} opacity="0.6" />
        <circle cx="15" cy="50" r="3" fill={color} opacity="0.6" />
        <circle cx="15" cy="70" r="3" fill={color} opacity="0.6" />
    </svg>
);
