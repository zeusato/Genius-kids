import React from 'react';
/** A virtual demonstration, intentionally outside the electrical netlist. */
export function VirtualCandle({ out, running }: {
    out: boolean;
    running: boolean;
}) { return <div className="ew-candle-demo"><svg viewBox="0 0 160 100" aria-label={out ? 'Nến ảo đã tắt' : 'Nến ảo đang cháy'}><rect x="112" y="48" width="23" height="48" rx="5" fill="#e5c89a"/><path d="M124 50V40" stroke="#6e634d" strokeWidth="3"/>{!out && <path d="M124 44C105 30 132 15 124 2c29 27 16 43 0 42" fill="#edb357"/>}{running && [25, 45, 65].map(y => <path key={y} d={`M5 ${y}q35-10 75 0`} fill="none" stroke="#86b5a6" strokeWidth="3" strokeDasharray="8 7"/>)}</svg><p>{out ? 'Gió minh họa đã thổi tắt nến ảo.' : running ? 'Giữ quạt chạy liên tục 2 giây.' : 'Nối mạch để quạt thổi nến ảo.'}<small>Chỉ thử với nến trên màn hình.</small></p></div>; }
