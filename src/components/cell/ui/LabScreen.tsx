import React from 'react';
import { ArrowRight, Microscope } from 'lucide-react';
import { CELL_DATA } from '../../../data/cellData';
import { CELL_STORIES, CellId } from '../../../data/cellStory';
import { Notebook } from '../notebookStore';
import { SpecimenArt } from './SpecimenArt';

interface LabScreenProps {
    notebook: Notebook;
    badges: string[];
    pickedId: CellId | null;   // mẫu vừa chọn → phóng to "đưa vào kính"
    onPick: (id: CellId) => void;
}

const ORDER: CellId[] = ['animal', 'plant', 'bacteria'];

// Thanh so sánh kích thước thật (bài học "Cell Size and Scale"): sợi tóc làm mốc 100%
const SIZE_BARS: { label: string; um: number; color: string }[] = [
    { label: 'Sợi tóc (bề ngang)', um: 70, color: '#94a3b8' },
    { label: 'Tế bào lá cây', um: 50, color: '#4ade80' },
    { label: 'Tế bào động vật', um: 20, color: '#38bdf8' },
    { label: 'Vi khuẩn', um: 2, color: '#fbbf24' }
];

export const LabScreen: React.FC<LabScreenProps> = ({ notebook, badges, pickedId, onPick }) => {
    const badgeCount = ORDER.filter((id) => badges.includes(id)).length;
    return (
        <div className={`absolute inset-0 z-30 overflow-y-auto transition-opacity duration-700 ${pickedId ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            {/* nền: đại dương tối + đốm tế bào mờ trôi chậm */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_10%,#164e63_0%,#0b1f33_45%,#050b16_100%)]" />
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute -left-20 top-24 w-80 h-80 rounded-full bg-cyan-400/10 blur-3xl animate-pulse" />
                <div className="absolute right-0 top-10 w-96 h-96 rounded-full bg-fuchsia-500/10 blur-3xl animate-pulse [animation-delay:1.5s]" />
                <div className="absolute left-1/3 bottom-0 w-[28rem] h-72 rounded-full bg-emerald-400/10 blur-3xl animate-pulse [animation-delay:3s]" />
            </div>

            <div className="min-h-full flex flex-col items-center px-4 pt-20 sm:pt-24 pb-10">
                <p className="flex items-center gap-2 text-[11px] sm:text-xs tracking-[0.28em] text-cyan-200/80 font-bold">
                    <Microscope size={14} /> PHÒNG THÍ NGHIỆM TÍ HON
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl font-black text-white text-center leading-tight">
                    Hôm nay em soi mẫu nào?
                </h2>
                <p className="mt-2 text-sm sm:text-base text-white/65 text-center max-w-xl">
                    Chọn một tiêu bản, đặt lên kính hiển vi rồi lặn vào bên trong một tế bào đang sống.
                </p>
                {badgeCount > 0 && (
                    <p className="mt-3 px-3 py-1 rounded-full text-xs font-bold text-amber-200 bg-amber-400/10 border border-amber-300/30">
                        🏅 Em đã có {badgeCount}/3 huy hiệu Nhà Sinh Học Tí Hon
                    </p>
                )}

                <div className="grid w-full max-w-5xl gap-4 sm:gap-6 mt-7 grid-cols-1 md:grid-cols-3">
                    {ORDER.map((id, i) => {
                        const story = CELL_STORIES[id];
                        const cell = CELL_DATA.find((c) => c.id === id)!;
                        const total = cell.organelles.length;
                        const seen = notebook[id].filter((o) => cell.organelles.some((x) => x.id === o)).length;
                        const picked = pickedId === id;
                        return (
                            <button
                                key={id}
                                onClick={() => onPick(id)}
                                className={`group relative text-left rounded-[28px] border bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-md p-3 pb-4 shadow-2xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${picked ? 'scale-105 border-white/40' : 'border-white/10'}`}
                                style={{ boxShadow: `0 24px 60px -30px ${story.accent}` }}
                                aria-label={`Soi ${story.specimen}`}
                            >
                                <div className="relative rounded-[22px] overflow-hidden bg-slate-950/70 aspect-[4/3]">
                                    <SpecimenArt id={id} className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-110" />
                                    <span className="absolute left-3 top-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/50 text-white border border-white/15">
                                        {story.sizeLabel}
                                    </span>
                                    {badges.includes(id) && (
                                        <span className="absolute right-3 top-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/90 text-amber-950 shadow">🏅 Huy hiệu</span>
                                    )}
                                    <span className="absolute left-3 bottom-3 w-6 h-6 rounded-full bg-black/55 border border-white/20 text-[11px] font-black text-white flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                                </div>
                                <div className="px-2 pt-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: story.accent, boxShadow: `0 0 12px ${story.accent}` }} />
                                        <h3 className="text-lg font-black text-white">{story.specimen}</h3>
                                    </div>
                                    <p className="text-sm text-white/65 mt-1">{story.source}</p>
                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="h-1.5 w-20 sm:w-24 bg-white/10 rounded-full overflow-hidden shrink-0">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${(seen / total) * 100}%`, background: story.accent }} />
                                            </div>
                                            <span className="text-[11px] text-white/60 whitespace-nowrap">{seen}/{total} bộ phận</span>
                                        </div>
                                        <span className="inline-flex items-center gap-1 text-sm font-black whitespace-nowrap" style={{ color: story.accent }}>
                                            Soi mẫu <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <section className="w-full max-w-3xl mt-9 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                    <h3 className="text-sm font-black text-white">📏 Tế bào to bằng nào?</h3>
                    <p className="text-xs text-white/55 mt-0.5">So với bề ngang một sợi tóc của em (1 µm = một phần nghìn milimét)</p>
                    <div className="mt-3 space-y-2">
                        {SIZE_BARS.map((b) => (
                            <div key={b.label} className="flex items-center gap-3">
                                <span className="w-32 sm:w-36 shrink-0 text-xs text-white/75">{b.label}</span>
                                <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, (b.um / 70) * 100)}%`, background: b.color, boxShadow: `0 0 10px ${b.color}88` }} />
                                </div>
                                <span className="w-12 text-right text-xs font-bold text-white/80">{b.um} µm</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
