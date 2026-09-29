// Tủ sưu tập + huy hiệu, giao diện Pháo hoa và Xưởng nguyên tử, lớp chữ mở màn.
import React, { useState } from 'react';
import { ArrowLeft, Minus, Plus, RotateCcw } from 'lucide-react';
import { CATEGORY_COLORS } from '@/src/data/elementsData';
import { SALTS, SHAPES, CHALLENGES, type ShellShape } from '@/src/data/periodic/fireworks';
import { InfoThumb } from '../../shared/Infographic';
import { ELEMENTS, byZ, gridPos, type ElementFull } from '../engine/elements';
import { identify, chargeLabel, BUILDER_GOALS, goalMet } from '../engine/builder';
import { PERIODIC_BADGES, type Collection } from '../collectionStore';
import { Frame } from './Games';

// ---------------------------------------------------------------- tủ sưu tập
export const Cabinet: React.FC<{ col: Collection; badges: string[]; onOpen: (e: ElementFull) => void; onInfographic: (e: ElementFull) => void; onClose: () => void }> = ({ col, badges, onOpen, onInfographic, onClose }) => {
    const [tab, setTab] = useState<'shelf' | 'badges'>('shelf');
    const seen = new Set(col.seen);
    const latest = [...col.seen].reverse().slice(0, 8).map(z => byZ(z)!).filter(Boolean);
    return (
        <Frame title="🗄️ Tủ sưu tập" onClose={onClose} wide>
            <p className="text-sm text-white/70 mb-3">Em đã sưu tầm <b className="text-amber-200">{seen.size}/118</b> nguyên tố. Mở thẻ một nguyên tố vài giây hoặc làm thí nghiệm của nó để đặt vào tủ.</p>
            <div className="flex gap-2 mb-3">
                {(['shelf', 'badges'] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-sm ${tab === t ? 'bg-amber-300 text-slate-900 font-bold' : 'bg-white/10'}`}>{t === 'shelf' ? '🧪 Kệ mẫu vật' : `🏅 Huy hiệu ${badges.length}/${PERIODIC_BADGES.length}`}</button>)}
            </div>
            {tab === 'shelf' ? (
                <>
                    <div className="overflow-x-auto pb-2">
                        <div className="grid gap-[3px] min-w-[560px]" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gridTemplateRows: 'repeat(7, auto) 8px repeat(2, auto)' }}>
                            {ELEMENTS.map(e => {
                                const p = gridPos(e), got = seen.has(e.atomicNumber), c = CATEGORY_COLORS[e.category].color;
                                return (
                                    <button key={e.atomicNumber} onClick={() => onOpen(e)} title={e.sgkName} className="aspect-square rounded-md text-[10px] font-bold grid place-items-center"
                                        style={{ gridColumn: p.col, gridRow: p.row <= 7 ? p.row : p.row, background: got ? `${c}33` : 'rgba(30,41,59,.6)', border: `1px solid ${got ? c : 'rgba(148,163,184,.2)'}`, color: got ? c : 'rgba(148,163,184,.35)', boxShadow: got ? `0 0 8px ${c}66` : 'none' }}>
                                        {got ? e.symbol : '·'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {latest.length > 0 && (
                        <>
                            <p className="text-sm font-bold mt-3 mb-2">🖼️ Tranh của các mẫu mới sưu tầm</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {latest.map(e => (
                                    <button key={e.atomicNumber} onClick={() => onInfographic(e)} className="rounded-xl overflow-hidden border border-white/10 hover:border-white/40 text-left">
                                        <InfoThumb url={e.infographicPath} className="h-24" />
                                        <span className="block px-2 py-1 text-xs font-semibold" style={{ color: CATEGORY_COLORS[e.category].color }}>{e.symbol} · {e.sgkName}</span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERIODIC_BADGES.map(b => {
                        const got = badges.includes(b.id), [a, n] = b.progress(col);
                        return (
                            <div key={b.id} className={`flex items-center gap-3 rounded-2xl p-3 border ${got ? 'bg-amber-300/15 border-amber-300/40' : 'bg-white/5 border-white/10'}`}>
                                <span className={`text-3xl ${got ? '' : 'grayscale opacity-50'}`}>{b.icon}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm">{b.title} {got && '✓'}</p>
                                    <p className="text-xs text-white/60">{b.desc}</p>
                                    <div className="h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden"><div className="h-full bg-amber-300" style={{ width: `${(a / n) * 100}%` }} /></div>
                                </div>
                                <span className="text-xs text-white/60 tabular-nums">{a}/{n}</span>
                            </div>
                        );
                    })}
                    <p className="text-xs text-white/50 sm:col-span-2">Mỗi huy hiệu thưởng 10 ⭐.</p>
                </div>
            )}
        </Frame>
    );
};

// ---------------------------------------------------------------- 🎆 pháo hoa
export const TowerSilhouette: React.FC = () => (
    // Bóng Tháp Rùa giữa hồ (vẽ tay, đơn giản) + hàng cây và mái nhà phố cổ phía xa
    <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="absolute left-0 right-0 w-full" style={{ bottom: '26%', height: '14%' }} aria-hidden>
        <path fill="#050915" d="M0 120 L0 88 Q60 70 120 86 T240 80 T360 88 L400 82 L420 60 L440 82 L520 84 Q600 66 680 84 T820 80 L860 70 L880 84 T1000 80 L1000 120 Z" />
        <g fill="#070c1c" transform="translate(470 18)">
            <rect x="0" y="62" width="60" height="40" /><rect x="8" y="34" width="44" height="30" /><rect x="15" y="10" width="30" height="26" />
            <path d="M-8 64 L68 64 L60 56 L0 56 Z" /><path d="M2 36 L58 36 L52 29 L8 29 Z" /><path d="M10 12 L50 12 L44 5 L16 5 Z" /><path d="M24 5 L30 -10 L36 5 Z" />
        </g>
    </svg>
);

export const FireworksUI: React.FC<{ picks: number[]; setPicks: React.Dispatch<React.SetStateAction<number[]>>; shape: ShellShape; setShape: (s: ShellShape) => void; done: string[]; onBack: () => void; lastMsg: string | null }> = ({ picks, setPicks, shape, setShape, done, onBack, lastMsg }) => {
    const [why, setWhy] = useState(false);
    const toggle = (z: number) => setPicks(p => (p.includes(z) ? p.filter(x => x !== z) : [...p, z].slice(-3)));
    return (
        <>
            <div className="fixed top-3 left-3 right-3 z-[56] flex items-start gap-2 pointer-events-none">
                <button onClick={onBack} className="pointer-events-auto flex items-center gap-1.5 h-11 px-4 rounded-full bg-slate-900/70 border border-white/15 text-white backdrop-blur-md"><ArrowLeft size={18} /> Bảng tuần hoàn</button>
                <div className="flex-1" />
                <div className="pointer-events-auto rounded-2xl bg-slate-900/70 border border-white/15 backdrop-blur-md p-2 text-white text-xs max-w-[280px]">
                    <b className="block mb-1">🎯 Thử thách</b>
                    {CHALLENGES.map(c => <p key={c.id} className={done.includes(c.id) ? 'text-emerald-300' : 'text-white/80'}>{done.includes(c.id) ? '✅' : '⬜'} {c.title} — <span className="text-white/50">{c.hint}</span></p>)}
                </div>
            </div>
            <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[56] w-[min(760px,96vw)] rounded-3xl bg-slate-900/75 border border-white/15 backdrop-blur-md p-3 text-white">
                <p className="text-xs text-white/70 mb-2">1️⃣ Chọn tối đa 3 muối kim loại · 2️⃣ chọn kiểu nổ · 3️⃣ <b>chạm lên trời</b> để bắn!</p>
                <div className="flex flex-wrap gap-1.5">
                    {SALTS.map(s => (
                        <button key={s.z} onClick={() => toggle(s.z)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border ${picks.includes(s.z) ? 'bg-white/20 border-white' : 'bg-white/5 border-white/15'}`}>
                            <span className="w-3.5 h-3.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} /><b>{s.symbol}</b> {s.name} → {s.colorName}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                    {SHAPES.map(s => <button key={s.id} onClick={() => setShape(s.id)} className={`px-2.5 py-1 rounded-full text-xs ${shape === s.id ? 'bg-amber-300 text-slate-900 font-bold' : 'bg-white/10'}`}>{s.icon} {s.label}</button>)}
                    <div className="flex-1" />
                    <button onClick={() => setWhy(w => !w)} className="px-3 py-1 rounded-full text-xs bg-sky-500/25 border border-sky-300/40">💡 Vì sao có màu?</button>
                </div>
                {why && <p className="text-xs text-white/80 mt-2">Khi thuốc pháo nổ, nguyên tử kim loại bị nung nóng: electron nhảy lên lớp cao hơn, rồi rơi về chỗ cũ và nhả ra ánh sáng. Mỗi nguyên tố nhả ra màu riêng — stronti đỏ, natri vàng, barium xanh lá, đồng xanh lam. Đó cũng là cách nhà khoa học biết Mặt Trời làm bằng gì!</p>}
                {lastMsg && <p className="text-sm text-amber-200 mt-1">{lastMsg}</p>}
            </div>
        </>
    );
};

// ---------------------------------------------------------------- ⚛️ xưởng nguyên tử
export const BuilderUI: React.FC<{ p: number; n: number; e: number; set: (k: 'p' | 'n' | 'e', d: number) => void; reset: () => void; level: number; setLevel: (l: number) => void; goalIndex: number; onBack: () => void; built: number }> = ({ p, n, e, set, reset, level, setLevel, goalIndex, onBack, built }) => {
    const id = identify(p, n, e);
    const el = p > 0 ? byZ(p) : undefined;
    const goals = BUILDER_GOALS.filter(g => g.level === level);
    const goal = goals[goalIndex % goals.length];
    const met = goal && goalMet(goal, p, n, e);
    const Row = ({ k, label, color, v }: { k: 'p' | 'n' | 'e'; label: string; color: string; v: number }) => (
        <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            <span className="w-20 text-sm">{label}</span>
            <button onClick={() => set(k, -1)} className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={`Bớt ${label}`}><Minus size={16} /></button>
            <b className="w-8 text-center text-lg tabular-nums">{v}</b>
            <button onClick={() => set(k, +1)} className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={`Thêm ${label}`}><Plus size={16} /></button>
        </div>
    );
    return (
        <>
            <button onClick={onBack} className="fixed top-3 left-3 z-[56] flex items-center gap-1.5 h-11 px-4 rounded-full bg-slate-900/70 border border-white/15 text-white backdrop-blur-md"><ArrowLeft size={18} /> Bảng tuần hoàn</button>
            <div className="fixed z-[55] right-3 top-3 bottom-3 w-[min(380px,44vw)] max-md:left-3 max-md:top-auto max-md:w-auto max-md:h-[48vh] rounded-3xl bg-slate-900/88 border border-white/12 backdrop-blur-xl p-4 text-slate-100 overflow-y-auto ptable-scroll">
                <b className="text-lg">⚛️ Xưởng nguyên tử</b>
                <div className="flex gap-1 mt-2">{[1, 2, 3, 4].map(l => <button key={l} onClick={() => setLevel(l)} className={`px-3 py-1 rounded-full text-xs ${l === level ? 'bg-cyan-400 text-slate-900 font-bold' : 'bg-white/10'}`}>Cấp {l}</button>)}</div>
                {goal && <p className={`mt-2 text-sm rounded-xl p-2 border ${met ? 'bg-emerald-400/20 border-emerald-300/50' : 'bg-white/5 border-white/10'}`}>{met ? '✅ ' : '🎯 '}{goal.text}</p>}
                <div className="space-y-2 mt-3">
                    <Row k="p" label="Proton" color="#ef4444" v={p} />
                    <Row k="n" label="Nơtron" color="#93c5fd" v={n} />
                    <Row k="e" label="Electron" color="#67e8f9" v={e} />
                </div>
                <div className="mt-3 rounded-2xl p-3 bg-white/5 border border-white/10">
                    {el ? (
                        <>
                            <p className="text-2xl font-bold" style={{ color: CATEGORY_COLORS[el.category].color }}>{el.symbol} · {el.sgkName}</p>
                            <p className="text-sm text-white/80">Số khối {id.A} ({el.sgkName}-{id.A}) · {chargeLabel(id.charge)}</p>
                            <p className={`text-sm ${id.stable === false ? 'text-rose-300' : id.stable ? 'text-emerald-300' : 'text-white/60'}`}>{id.stable === null ? 'Chưa biết hạt nhân này bền hay không' : id.stable ? 'Hạt nhân bền 👍' : 'Hạt nhân không bền — nó rung và sẽ tự vỡ!'}</p>
                        </>
                    ) : <p className="text-sm text-white/60">Thêm proton để tạo nguyên tố. Số proton quyết định đó là nguyên tố nào!</p>}
                </div>
                <MiniTable z={p} />
                <div className="flex items-center justify-between mt-3 text-xs text-white/60">
                    <span>Đã lắp {built} nguyên tử khác nhau</span>
                    <button onClick={reset} className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10"><RotateCcw size={14} /> Làm lại</button>
                </div>
            </div>
        </>
    );
};

const MiniTable: React.FC<{ z: number }> = ({ z }) => (
    <div className="grid gap-[2px] mt-3" style={{ gridTemplateColumns: 'repeat(18, minmax(0,1fr))' }}>
        {ELEMENTS.filter(e => e.period <= 4 && e.group > 0).map(e => {
            const p = gridPos(e), on = e.atomicNumber === z, c = CATEGORY_COLORS[e.category].color;
            return <span key={e.atomicNumber} className="aspect-square rounded-[3px] text-[7px] grid place-items-center" style={{ gridColumn: p.col, gridRow: p.row, background: on ? c : `${c}22`, color: on ? '#0f172a' : `${c}aa`, boxShadow: on ? `0 0 10px ${c}` : 'none', fontWeight: on ? 800 : 400 }}>{e.symbol}</span>;
        })}
    </div>
);

export const IntroOverlay: React.FC<{ caption: string | null; onSkip: () => void; flash: number }> = ({ caption, onSkip, flash }) => (
    <div className="fixed inset-0 z-[40]" onClick={onSkip}>
        <div className="absolute inset-0 bg-white pointer-events-none" style={{ opacity: flash }} />
        {caption && <p key={caption} className="absolute left-0 right-0 bottom-[9%] text-center text-lg sm:text-2xl font-bold text-white px-6 ptable-fade-in" style={{ textShadow: '0 0 18px rgba(0,0,0,.9), 0 0 30px rgba(253,230,138,.5)' }}>{caption}</p>}
        <button className="absolute right-4 bottom-4 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm">Chạm để bỏ qua</button>
    </div>
);

// ---------------------------------------------------------------- 🏙️ thành phố nguyên tố
export const CITY_PROPS: { id: 'melt' | 'density' | 'age' | 'crust'; label: string; say: string }[] = [
    { id: 'melt', label: '🔥 Khó nóng chảy', say: 'Cột càng cao, nguyên tố càng khó chảy lỏng. Tòa cao nhất là carbon và tungsten!' },
    { id: 'density', label: '⚖️ Nặng', say: 'Cột càng cao, khối 1 cm³ càng nặng. Osmium và iridium cao nhất.' },
    { id: 'age', label: '🕰️ Được biết lâu đời', say: 'Cột càng cao, loài người biết nguyên tố đó càng lâu — vàng, đồng, sắt từ thời cổ đại.' },
    { id: 'crust', label: '🌍 Nhiều trong đất đá', say: 'Cột càng cao, nguyên tố càng nhiều trong vỏ Trái Đất — oxygen và silicon dẫn đầu.' },
];

export const CityUI: React.FC<{ prop: string; setProp: (p: 'melt' | 'density' | 'age' | 'crust') => void; onBack: () => void }> = ({ prop, setProp, onBack }) => (
    <>
        <button onClick={onBack} className="fixed top-3 left-3 z-[56] flex items-center gap-1.5 h-11 px-4 rounded-full bg-slate-900/70 border border-white/15 text-white backdrop-blur-md"><ArrowLeft size={18} /> Bảng phẳng</button>
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[56] w-[min(720px,96vw)] rounded-3xl bg-slate-900/80 border border-white/15 backdrop-blur-md p-3 text-white">
            <p className="text-sm font-bold mb-2">🏙️ Thành phố nguyên tố — mỗi ô dựng thành một tòa nhà</p>
            <div className="flex flex-wrap gap-1.5">{CITY_PROPS.map(p => <button key={p.id} onClick={() => setProp(p.id)} className={`px-3 py-1.5 rounded-full text-xs ${prop === p.id ? 'bg-cyan-400 text-slate-900 font-bold' : 'bg-white/10 hover:bg-white/20'}`}>{p.label}</button>)}</div>
            <p className="text-xs text-white/75 mt-2">{CITY_PROPS.find(p => p.id === prop)?.say} Chạm vào một tòa để mở nguyên tố.</p>
        </div>
    </>
);

// ---------------------------------------------------------------- 🧪 bếp phân tử
export const KitchenUI: React.FC<{ counts: Record<string, number>; set: (a: string, d: number) => void; clear: () => void; found: string[]; recipe: { formula: string; name: string; emoji: string; use: string } | null; hint: string; onBack: () => void; atoms: { id: string; color: string; name: string }[]; recipes: { id: string; formula: string; name: string; emoji: string }[] }> = ({ counts, set, clear, found, recipe, hint, onBack, atoms, recipes }) => (
    <>
        <button onClick={onBack} className="fixed top-3 left-3 z-[56] flex items-center gap-1.5 h-11 px-4 rounded-full bg-slate-900/70 border border-white/15 text-white backdrop-blur-md"><ArrowLeft size={18} /> Bảng tuần hoàn</button>
        <div className="fixed z-[55] right-3 top-3 bottom-3 w-[min(380px,44vw)] max-md:left-3 max-md:top-auto max-md:w-auto max-md:h-[50vh] rounded-3xl bg-slate-900/88 border border-white/12 backdrop-blur-xl p-4 text-slate-100 overflow-y-auto ptable-scroll">
            <b className="text-lg">🧪 Bếp phân tử</b>
            <p className="text-xs text-white/60">Chọn số nguyên tử của mỗi loại. Đúng công thức là phân tử hiện ra!</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
                {atoms.map(a => (
                    <div key={a.id} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-1.5">
                        <span className="w-7 h-7 rounded-full grid place-items-center text-[11px] font-bold" style={{ background: a.color, color: a.id === 'H' ? '#111' : '#fff' }}>{a.id}</span>
                        <button onClick={() => set(a.id, -1)} className="w-7 h-7 grid place-items-center rounded-full bg-white/10" aria-label={`Bớt ${a.name}`}><Minus size={14} /></button>
                        <b className="w-5 text-center tabular-nums">{counts[a.id] ?? 0}</b>
                        <button onClick={() => set(a.id, +1)} className="w-7 h-7 grid place-items-center rounded-full bg-white/10" aria-label={`Thêm ${a.name}`}><Plus size={14} /></button>
                    </div>
                ))}
            </div>
            <div className={`mt-3 rounded-2xl p-3 border ${recipe ? 'bg-emerald-400/15 border-emerald-300/40' : 'bg-white/5 border-white/10'}`}>
                {recipe ? (<><p className="text-2xl font-bold">{recipe.emoji} {recipe.formula}</p><p className="font-semibold">{recipe.name}</p><p className="text-sm text-white/75">{recipe.use}</p></>)
                    : <p className="text-sm text-white/70">💡 {hint}</p>}
            </div>
            <p className="text-sm font-bold mt-3 mb-1">📖 Sổ công thức ({found.length}/{recipes.length})</p>
            <div className="grid grid-cols-3 gap-1.5">
                {recipes.map(r => <span key={r.id} className={`rounded-lg px-2 py-1 text-xs text-center ${found.includes(r.id) ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/5 text-white/40'}`}>{found.includes(r.id) ? `${r.emoji} ${r.formula}` : '❔ ???'}</span>)}
            </div>
            <button onClick={clear} className="mt-3 flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-xs"><RotateCcw size={14} /> Dọn bếp</button>
        </div>
    </>
);
