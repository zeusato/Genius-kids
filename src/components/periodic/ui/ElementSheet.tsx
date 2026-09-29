import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_COLORS } from '@/src/data/elementsData';
import { ORIGIN_INFO } from '@/src/data/periodic/origin';
import { AROUND_INFO, type AroundId } from '@/src/data/periodic/composition';
import { EXPERIMENT_INFO, type ExperimentSpec } from '@/src/data/periodic/experiments';
import { SpeakButton } from '../../shared/SpeakButton';
import { InfoThumb } from '../../shared/Infographic';
import type { ElementFull } from '../engine/elements';
import { dominantOrigin, formatHalfLife, formatPct } from '../engine/lenses';
import { stateAt } from '../engine/states';
import { compareLines } from '../engine/compare';
import { categoryNames } from '../PeriodicTable';

const HAZARD: Record<string, string> = { radioactive: '☢️ Phóng xạ', toxic: '☠️ Độc', reactive: '💥 Phản ứng mạnh', flammable: '🔥 Dễ cháy' };
const STATE_VI = { solid: '❄️ Rắn', liquid: '💧 Lỏng', gas: '💨 Khí', unknown: '❓ Chưa biết' } as const;

interface Props {
    el: ElementFull;
    compact: boolean;               // Lớp 1–2: thẻ rút gọn
    autoSpeak: boolean;
    portrait: boolean;
    experiment: ExperimentSpec | null;
    onExperiment: (e: ExperimentSpec | null) => void;
    onReplay: () => void;
    power: boolean; onPower: () => void;
    onVoice: (e: ExperimentSpec) => void;
    onPrev: () => void; onNext: () => void; onClose: () => void;
    onInfographic: () => void;
    studentName?: string;
}

export const ElementSheet: React.FC<Props> = ({ el, compact, autoSpeak, portrait, experiment, onExperiment, onReplay, power, onPower, onVoice, onPrev, onNext, onClose, onInfographic, studentName }) => {
    const nav = useNavigate();
    const c = CATEGORY_COLORS[el.category].color;
    const [open, setOpen] = useState(!portrait);
    useEffect(() => { if (!portrait) setOpen(true); }, [portrait]);
    const origin = ORIGIN_INFO[dominantOrigin(el)];
    const around = (Object.keys(el.around) as AroundId[]);
    const links: { label: string; to: string }[] = [];
    if ([1, 2].includes(el.atomicNumber)) links.push({ label: '☀️ Mặt Trời', to: '/science/solar-system' });
    if (el.around.body && el.around.body >= 0.1) links.push({ label: '🧫 Tế bào', to: '/science/cell-biology?cell=animal' });
    if ([29, 13, 47, 79].includes(el.atomicNumber)) links.push({ label: '⚡ Mạch điện', to: '/science/electricity' });
    if (el.atomicNumber === 77) links.push({ label: '🦖 Thiên thạch 66 triệu năm', to: '/science/evolution?t=66' });
    if (el.atomicNumber === 8) links.push({ label: '🌳 Ôxi xuất hiện', to: '/science/evolution?t=2400' });

    const cls = portrait
        ? `fixed left-0 right-0 bottom-0 z-[55] rounded-t-3xl transition-[height] duration-300 ${open ? 'h-[46vh]' : 'h-[132px]'}`
        : 'fixed right-3 top-3 bottom-3 z-[55] w-[min(400px,42vw)] rounded-3xl';
    return (
        <div className={`${cls} bg-slate-900/88 backdrop-blur-xl border border-white/12 shadow-2xl flex flex-col overflow-hidden text-slate-100`} style={{ boxShadow: `0 0 40px ${c}40` }}>
            {portrait && <button onClick={() => setOpen(o => !o)} className="mx-auto mt-2 w-12 h-1.5 rounded-full bg-white/30" aria-label="Kéo thẻ" />}
            {/* đầu thẻ */}
            <div className="flex items-center gap-3 p-4 pb-2">
                <div className="w-16 h-16 shrink-0 rounded-2xl flex flex-col items-center justify-center" style={{ background: `${c}22`, border: `3px solid ${c}`, boxShadow: `0 0 18px ${c}80`, color: c }}>
                    <span className="text-[10px] opacity-70">{el.atomicNumber}</span>
                    <span className="text-3xl font-bold leading-none">{el.symbol}</span>
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-tight truncate" style={{ color: c }}>{el.sgkName}</h2>
                    <p className="text-xs text-white/60 truncate">{el.oldName !== el.sgkName ? `tên cũ: ${el.oldName} · ` : ''}{el.nameEn}</p>
                    <p className="text-xs text-white/50">{el.group > 0 ? `Chu kỳ ${el.period} · Nhóm ${el.group}` : `Chu kỳ ${el.period} · hàng ${el.category === 'lanthanide' ? 'Lanthanide' : 'Actinide'}`}</p>
                </div>
                <div className="flex flex-col gap-1">
                    <button onClick={onClose} aria-label="Đóng" className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20"><X size={18} /></button>
                </div>
            </div>
            <div className="flex items-center gap-1.5 px-4 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${c}22`, color: c, border: `1px solid ${c}55` }}>{categoryNames[el.category]}</span>
                <span className="px-2.5 py-1 rounded-full text-xs bg-white/10">{STATE_VI[stateAt(el, 25)]} ở 25 °C</span>
                {el.hazard.map(h => <span key={h} className="px-2.5 py-1 rounded-full text-xs bg-rose-500/15 text-rose-200 border border-rose-400/30">{HAZARD[h]}</span>)}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 ptable-scroll">
                <div className="flex items-start gap-2 rounded-2xl bg-white/5 p-3 border border-white/10">
                    <p className="flex-1 text-[15px] leading-relaxed">{el.kid}</p>
                    <SpeakButton text={`${el.sgkName}. ${el.kid}`} autoPlay={autoSpeak} autoPlayKey={el.atomicNumber} size={22} />
                </div>

                {el.experiments.length > 0 && (
                    <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 border border-fuchsia-300/20 p-3">
                        <p className="text-sm font-bold mb-2">🧪 Thí nghiệm</p>
                        <div className="flex flex-wrap gap-1.5">
                            {el.experiments.map(x => (
                                <button key={x.id} onClick={() => onExperiment(experiment?.id === x.id ? null : x)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${experiment?.id === x.id ? 'bg-fuchsia-400 text-slate-900 border-fuchsia-300' : 'bg-white/10 border-white/15 hover:bg-white/20'}`}>
                                    {EXPERIMENT_INFO[x.id].icon} {EXPERIMENT_INFO[x.id].label}
                                </button>
                            ))}
                        </div>
                        {experiment && (
                            <div className="mt-2 space-y-2">
                                <p className="text-sm text-white/85">{experiment.say}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {experiment.id === 'discharge' ? <button onClick={onPower} className="px-3 py-1.5 rounded-full bg-amber-300 text-slate-900 text-xs font-bold">{power ? '⏻ Tắt điện' : '⚡ Bật điện'}</button>
                                        : experiment.id === 'voice' ? <button onClick={() => onVoice(experiment)} className="px-3 py-1.5 rounded-full bg-amber-300 text-slate-900 text-xs font-bold">🎤 Nghe thử giọng</button>
                                            : <button onClick={onReplay} className="px-3 py-1.5 rounded-full bg-amber-300 text-slate-900 text-xs font-bold">▶ Làm lại</button>}
                                </div>
                                {experiment.id === 'discharge' && power && (
                                    <p className="text-center text-2xl font-bold py-1" style={{ color: '#fff', textShadow: `0 0 6px ${el.discharge}, 0 0 16px ${el.discharge}, 0 0 32px ${el.discharge}` }}>{studentName || 'Genius Kids'}</p>
                                )}
                                {experiment.id === 'flame' && el.flame && <SpectrumBar z={el.atomicNumber} />}
                                {EXPERIMENT_INFO[experiment.id].safety && <p className="text-xs text-amber-200/90">⚠️ {EXPERIMENT_INFO[experiment.id].safety}</p>}
                            </div>
                        )}
                    </div>
                )}

                <ul className="space-y-1.5">
                    {compareLines(el).map((l, i) => <li key={i} className="text-sm text-white/85 flex gap-2"><span>•</span><span>{l}</span></li>)}
                    {!el.isotope.stable && <li className="text-sm text-lime-200 flex gap-2"><span>☢</span><span>Không có dạng bền. {el.sgkName}-{el.isotope.A} sống lâu nhất: một nửa số nguyên tử vỡ đi sau {formatHalfLife(el.isotope.halfLifeSec)}.</span></li>}
                </ul>

                <div className="flex flex-wrap gap-1.5">
                    {el.uses.map((u, i) => <span key={i} className="px-2.5 py-1 rounded-xl bg-white/8 border border-white/10 text-xs">{u.emoji} {u.text}</span>)}
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="px-2.5 py-1 rounded-xl" style={{ background: `${origin.color}22`, border: `1px solid ${origin.color}55` }}>{origin.icon} Sinh ra từ: {origin.label}</span>
                    {around.map(a => <span key={a} className="px-2.5 py-1 rounded-xl bg-emerald-400/10 border border-emerald-300/25">{AROUND_INFO[a].icon} {AROUND_INFO[a].label}: {formatPct(el.around[a]!)}</span>)}
                </div>

                {/* infographic có sẵn (118 ảnh) — dùng lại, không bỏ phí */}
                <button onClick={onInfographic} className="block w-full rounded-2xl overflow-hidden border border-white/15 hover:border-white/40 text-left">
                    <InfoThumb url={el.infographicPath} className="h-36" />
                    <span className="flex items-center gap-2 px-3 py-2 text-sm font-semibold" style={{ color: c }}><ImageIcon size={16} /> Xem tranh infographic</span>
                </button>

                {!compact && (
                    <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
                        <p className="text-sm font-bold mb-1.5">💡 Em có biết?</p>
                        <ul className="space-y-1.5">{el.facts.map((f, i) => <li key={i} className="text-sm text-white/75 flex gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />{f}</li>)}</ul>
                    </div>
                )}
                {!compact && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-white/5 p-2 border border-white/10"><p className="text-white/50">Khối lượng nguyên tử</p><p className="font-semibold">{el.atomicMass} amu</p></div>
                        <div className="rounded-xl bg-white/5 p-2 border border-white/10"><p className="text-white/50">Lớp electron</p><p className="font-semibold font-mono">{el.electronShells.join(' · ')}</p></div>
                    </div>
                )}
                {links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">{links.map(l => <button key={l.to} onClick={() => nav(l.to)} className="px-3 py-1.5 rounded-full text-xs bg-sky-500/15 border border-sky-300/30 hover:bg-sky-500/25">{l.label} →</button>)}</div>
                )}
            </div>

            <div className="flex items-center justify-between gap-2 p-3 border-t border-white/10">
                <button onClick={onPrev} disabled={el.atomicNumber === 1} className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm"><ChevronLeft size={16} />{el.atomicNumber > 1 ? el.atomicNumber - 1 : ''}</button>
                <span className="text-[11px] text-white/40 text-center">Kéo để xoay · véo/cuộn để lặn vào</span>
                <button onClick={onNext} disabled={el.atomicNumber === 118} className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-sm">{el.atomicNumber < 118 ? el.atomicNumber + 1 : ''}<ChevronRight size={16} /></button>
            </div>
        </div>
    );
};

// "Mã vạch ánh sáng": vạch phát xạ nổi bật (nm) — các bước sóng quen thuộc trong sách vật lý/hóa học.
const LINES: Record<number, number[]> = {
    1: [656.3, 486.1, 434.0, 410.2], 2: [587.6, 667.8, 501.6, 492.2, 471.3, 447.1], 3: [670.8, 610.4], 11: [589.0, 589.6],
    19: [766.5, 769.9, 404.4], 10: [585.2, 640.2, 650.7, 703.2, 614.3, 692.9], 80: [404.7, 435.8, 546.1, 577.0, 579.1],
    20: [422.7, 616.2, 643.9, 646.3], 38: [460.7, 640.8, 650.4, 707.0], 56: [553.5, 455.4, 493.4], 29: [510.6, 515.3, 521.8],
};
function nmToRgb(nm: number): string {
    let r = 0, g = 0, b = 0;
    if (nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else r = 1;
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}
export const SpectrumBar: React.FC<{ z: number }> = ({ z }) => {
    const lines = LINES[z];
    if (!lines) return null;
    return (
        <div>
            <p className="text-[11px] text-white/60 mb-1">"Mã vạch ánh sáng" — mỗi nguyên tố phát ra những màu riêng</p>
            <div className="relative h-7 rounded-lg bg-black overflow-hidden border border-white/10">
                {lines.map(nm => <span key={nm} className="absolute top-0 bottom-0 w-[3px]" style={{ left: `${((nm - 380) / 370) * 100}%`, background: nmToRgb(nm), boxShadow: `0 0 6px ${nmToRgb(nm)}` }} />)}
            </div>
            <div className="flex justify-between text-[10px] text-white/40"><span>tím</span><span>lam</span><span>lục</span><span>vàng</span><span>đỏ</span></div>
        </div>
    );
};

const LEVELS = ['Mẫu vật', 'Sắp xếp', 'Nguyên tử', 'Hạt nhân'];
export const ScaleHud: React.FC<{ el: ElementFull; level: number; onLevel: (l: number) => void; cloud: boolean; onCloud: () => void; portrait: boolean; disabled?: boolean }> = ({ el, level, onLevel, cloud, onCloud, portrait, disabled }) => {
    const A = el.isotope.A, Z = el.atomicNumber, sh = el.electronShells;
    const info = [
        { size: '1 cm', say: el.estimated || el.specimen.kind === 'atoms-only' ? 'Chưa ai nhìn thấy một mẩu nguyên tố này bằng mắt.' : el.specimen.kind === 'gas-tube' ? 'Ống thủy tinh chứa khí — bật điện là khí phát sáng.' : `Mẫu ${el.sgkName} thật trông như thế này.` },
        { size: '≈ 1 nanômét · phóng to 10 triệu lần', say: el.specimen.structure === 'monatomic' ? 'Từng nguyên tử bay tự do, va vào nhau lách cách.' : el.specimen.structure === 'molecular' ? 'Các nguyên tử bắt cặp thành phân tử.' : el.specimen.structure === 'liquid' ? 'Nguyên tử chen chúc, trượt qua nhau — nên nó chảy được.' : 'Nguyên tử xếp hàng ngay ngắn. 10 triệu nguyên tử xếp hàng mới dài 1 mm!' },
        { size: '≈ 0,1–0,3 nanômét', say: `${Z} electron trên ${sh.length} lớp: ${sh.join(' · ')}. Lớp ngoài cùng có ${sh[sh.length - 1]} electron.` },
        { size: 'vài phần triệu tỷ mét', say: `Hạt nhân ${el.sgkName}-${A}: ${Z} proton 🔴 + ${A - Z} nơtron 🔵. Nếu nguyên tử to bằng sân vận động Mỹ Đình, hạt nhân chỉ bằng hạt đậu giữa sân!` },
    ][level];
    return (
        <div className={`fixed z-[52] ${portrait ? 'left-3 right-3 bottom-[140px]' : 'left-4 bottom-4 w-[min(520px,50vw)]'} rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/10 p-3 text-slate-100 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-2 flex-wrap">
                {LEVELS.map((l, i) => (
                    <button key={l} onClick={() => onLevel(i)} className={`px-2.5 py-1 rounded-full text-xs ${i === level ? 'bg-cyan-400 text-slate-900 font-bold' : 'bg-white/10 hover:bg-white/20'}`}>{i === 0 ? '🔬' : i === 1 ? '🧱' : i === 2 ? '⚛️' : '🔴'} {l}</button>
                ))}
                {level === 2 && <button onClick={onCloud} className={`px-2.5 py-1 rounded-full text-xs ${cloud ? 'bg-pink-400 text-slate-900 font-bold' : 'bg-white/10'}`}>☁️ Đám mây electron</button>}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-cyan-200/80">
                <span className="inline-block h-1.5 w-16 bg-cyan-300/70 rounded" />{info.size}
            </div>
            <p className="text-sm mt-1">{info.say}</p>
            {level === 2 && cloud && <p className="text-[11px] text-white/50 mt-1">Thật ra electron giống một đám mây mờ hơn là hạt chạy vòng tròn.</p>}
            {level > 0 && <p className="text-[10px] text-white/35 mt-1">Hình được phóng to có chủ ý để nhìn thấy được.</p>}
        </div>
    );
};
