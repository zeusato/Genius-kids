import React, { useId } from 'react';

export type SphinxMood = 'idle' | 'read' | 'think' | 'hint' | 'cheer' | 'comfort';

/**
 * Nhân Sư đất nặn — vẽ bằng SVG để đổi nét mặt, chớp mắt, nói, vẫy đuôi mà không tải ảnh.
 * Phối màu theo ảnh bìa hub (riddle.webp): thân cát vàng, khăn sọc xanh ngọc – vàng mật.
 */
export function Sphinx({ mood = 'idle', talking = false, size = 300, className = '' }: { mood?: SphinxMood; talking?: boolean; size?: number; className?: string }) {
    const uid = useId().replace(/:/g, '');
    const g = (n: string) => `${n}-${uid}`;
    const eyesClosed = mood === 'cheer';
    const look = mood === 'read' ? { x: 0, y: 4 } : mood === 'think' ? { x: -4, y: -4 } : mood === 'hint' ? { x: 4, y: 0 } : { x: 0, y: 0 };
    const brow = mood === 'think' ? [-8, 4] : mood === 'comfort' ? [8, -8] : mood === 'cheer' ? [-4, 4] : [0, 0];
    return (
        <svg className={`rd-sphinx rd-sphinx-${mood}${talking ? ' is-talking' : ''} ${className}`} width={size} height={size * 0.92} viewBox="0 0 320 295" role="img" aria-label="Nhân Sư">
            <defs>
                <linearGradient id={g('body')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2c98c" /><stop offset="1" stopColor="#d79a58" /></linearGradient>
                <linearGradient id={g('face')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8d6a2" /><stop offset="1" stopColor="#e9b679" /></linearGradient>
                <linearGradient id={g('teal')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3f8f7c" /><stop offset="1" stopColor="#2a6b5c" /></linearGradient>
                <linearGradient id={g('gold')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6cf6a" /><stop offset="1" stopColor="#d49a32" /></linearGradient>
                <radialGradient id={g('shine')} cx="0.35" cy="0.25" r="0.7"><stop offset="0" stopColor="#fff8e6" stopOpacity=".7" /><stop offset="1" stopColor="#fff8e6" stopOpacity="0" /></radialGradient>
                <clipPath id={g('hood')}><path d="M108 70 Q160 18 212 70 L232 168 Q160 190 88 168 Z" /></clipPath>
            </defs>
            <ellipse cx="166" cy="281" rx="132" ry="11" fill="#7a5b2e" opacity=".16" />
            {/* đuôi */}
            <g className="rd-sphinx-tail">
                <path d="M276 238 C306 226 306 186 286 170" fill="none" stroke="#d79a58" strokeWidth="11" strokeLinecap="round" />
                <path d="M282 172 c-14 -6 -10 -22 4 -22 c12 0 16 14 6 22 z" fill="#a8693a" />
            </g>
            {/* thân nằm */}
            <g className="rd-sphinx-body">
                <path d="M70 196 C70 150 120 140 170 146 C232 152 286 170 286 222 C286 262 254 276 200 276 L112 276 C82 276 70 252 70 226 Z" fill={`url(#${g('body')})`} />
                <path d="M200 160 C240 166 274 186 278 222" fill="none" stroke="#fff3d6" strokeOpacity=".45" strokeWidth="6" strokeLinecap="round" />
                <path d="M230 230 c18 2 30 14 30 34 l-34 0 c-4 -12 -4 -22 4 -34z" fill="#cf8f4f" />
            </g>
            {/* chân trước */}
            <g className={`rd-sphinx-paws${mood === 'hint' ? ' is-pointing' : ''}`}>
                <rect x="78" y="244" width="70" height="32" rx="16" fill="#e9b273" />
                <path d="M92 266 v8 M106 266 v9 M120 266 v8" stroke="#b97a40" strokeWidth="3" strokeLinecap="round" />
                <g className="rd-sphinx-rightpaw">
                    <rect x="150" y="244" width="70" height="32" rx="16" fill="#e9b273" />
                    <path d="M164 266 v8 M178 266 v9 M192 266 v8" stroke="#b97a40" strokeWidth="3" strokeLinecap="round" />
                </g>
            </g>
            {mood === 'read' && (
                <g className="rd-sphinx-scroll">
                    <rect x="88" y="214" width="124" height="42" rx="6" fill="#fbf1d8" stroke="#d8b878" strokeWidth="2" />
                    <rect x="80" y="210" width="14" height="50" rx="7" fill="#c98d4f" />
                    <rect x="206" y="210" width="14" height="50" rx="7" fill="#c98d4f" />
                    <path d="M104 226 h90 M104 236 h70 M104 246 h82" stroke="#c9a76a" strokeWidth="3" strokeLinecap="round" />
                </g>
            )}
            {/* đầu */}
            <g className="rd-sphinx-head">
                {/* khăn nemes: hai vạt buông */}
                <path d="M100 118 L82 228 Q104 240 124 230 L130 132 Z" fill={`url(#${g('teal')})`} />
                <path d="M220 118 L238 228 Q216 240 196 230 L190 132 Z" fill={`url(#${g('teal')})`} />
                <g clipPath={`url(#${g('hood')})`}>
                    <rect x="80" y="10" width="160" height="190" fill={`url(#${g('teal')})`} />
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <rect key={i} x="80" y={34 + i * 19} width="160" height="8" fill={`url(#${g('gold')})`} />)}
                </g>
                {[0, 1, 2, 3, 4].map(i => (
                    <g key={i}>
                        <path d={`M${92 - i * 2.4} ${146 + i * 18} l${32 + i * 0.6} 4`} stroke="#e7b84f" strokeWidth="6" strokeLinecap="round" />
                        <path d={`M${228 + i * 2.4} ${146 + i * 18} l${-32 - i * 0.6} 4`} stroke="#e7b84f" strokeWidth="6" strokeLinecap="round" />
                    </g>
                ))}
                {/* vòng cổ */}
                <path d="M118 196 Q160 226 202 196 L206 210 Q160 244 114 210 Z" fill={`url(#${g('gold')})`} />
                <path d="M122 208 Q160 234 198 208" fill="none" stroke="#2f7a6a" strokeWidth="5" />
                {/* mặt */}
                <path d="M122 92 Q160 74 198 92 L200 150 Q196 192 160 198 Q124 192 120 150 Z" fill={`url(#${g('face')})`} />
                <path d="M124 92 Q160 76 196 92 L196 100 Q160 86 124 100 Z" fill={`url(#${g('gold')})`} />
                <circle cx="160" cy="84" r="7" fill={`url(#${g('gold')})`} stroke="#b77d22" strokeWidth="2" />
                <circle cx="160" cy="84" r="3" fill="#2f7a6a" />
                <ellipse cx="136" cy="160" rx="10" ry="6" fill="#f19a7f" opacity=".45" />
                <ellipse cx="184" cy="160" rx="10" ry="6" fill="#f19a7f" opacity=".45" />
                {/* lông mày */}
                <path d={`M128 ${118 + brow[0] / 2} q10 ${-6 + brow[0] / 3} 20 ${-1 + brow[1] / 3}`} stroke="#8a5a2c" strokeWidth="4" strokeLinecap="round" fill="none" className="rd-brow" />
                <path d={`M172 ${117 + brow[1] / 2} q10 ${-5 + brow[1] / 3} 20 ${1 + brow[0] / 3}`} stroke="#8a5a2c" strokeWidth="4" strokeLinecap="round" fill="none" className="rd-brow" />
                {/* mắt */}
                {eyesClosed ? (
                    <g stroke="#3b2a22" strokeWidth="4.5" strokeLinecap="round" fill="none">
                        <path d="M128 140 q10 -10 20 0" /><path d="M172 140 q10 -10 20 0" />
                    </g>
                ) : (
                    <g className="rd-eyes">
                        <ellipse cx="138" cy="138" rx="10" ry="12" fill="#fffaf0" />
                        <ellipse cx="182" cy="138" rx="10" ry="12" fill="#fffaf0" />
                        <g transform={`translate(${look.x} ${look.y})`}>
                            <circle cx="138" cy="139" r="7" fill="#3b2a22" /><circle cx="182" cy="139" r="7" fill="#3b2a22" />
                            <circle cx="140.5" cy="136" r="2.4" fill="#fff" /><circle cx="184.5" cy="136" r="2.4" fill="#fff" />
                        </g>
                    </g>
                )}
                <path d="M156 156 q4 4 8 0" stroke="#b9773e" strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* miệng */}
                <g className="rd-mouth">
                    {mood === 'cheer' ? <path d="M144 170 q16 22 32 0 z" fill="#8b3d2e" />
                        : mood === 'think' ? <path d="M152 176 q8 -4 16 0" stroke="#8b3d2e" strokeWidth="4" strokeLinecap="round" fill="none" />
                            : mood === 'comfort' ? <path d="M148 172 q12 8 24 0" stroke="#8b3d2e" strokeWidth="4" strokeLinecap="round" fill="none" />
                                : <path d="M146 170 q14 13 28 0" stroke="#8b3d2e" strokeWidth="4" strokeLinecap="round" fill="none" />}
                    <ellipse className="rd-mouth-talk" cx="160" cy="175" rx="7" ry="5" fill="#8b3d2e" />
                </g>
                <ellipse cx="148" cy="110" rx="26" ry="16" fill={`url(#${g('shine')})`} />
            </g>
            {mood === 'think' && <g className="rd-think" fill="#c7b38a"><circle cx="228" cy="88" r="5" /><circle cx="244" cy="70" r="7" /><circle cx="264" cy="48" r="10" /></g>}
            {mood === 'cheer' && <g className="rd-sparkles" fill="#f2bf3d">{[[66, 92], [258, 76], [282, 132], [48, 158]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 10} l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z`} />)}</g>}
        </svg>
    );
}
