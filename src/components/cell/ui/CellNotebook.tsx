import React from 'react';
import { X } from 'lucide-react';
import { CELL_DATA } from '../../../data/cellData';
import { CELL_STORIES, CellId } from '../../../data/cellStory';
import { Notebook } from '../notebookStore';

interface CellNotebookProps {
    notebook: Notebook;
    badges: string[];
    current: CellId;
    onOpenCell: (id: CellId) => void;
    onClose: () => void;
}

const ORDER: CellId[] = ['animal', 'plant', 'bacteria'];

// Sổ tay khám phá: mỗi bào quan đã mở là một "nhãn dán" có màu; chưa xem thì là dấu hỏi — bé tự
// muốn lấp đầy. Huy hiệu mỗi loại tế bào nhận từ trò Truy tìm.
export const CellNotebook: React.FC<CellNotebookProps> = ({ notebook, badges, current, onOpenCell, onClose }) => (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-6" onClick={onClose}>
        <div
            className="relative w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900 to-slate-950 p-4 sm:p-6 text-white shadow-2xl animate-[cellCardIn_0.35s_ease-out]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Sổ tay khám phá"
        >
            <button onClick={onClose} aria-label="Đóng" className="absolute top-3 right-3 p-2 rounded-xl bg-white/10 hover:bg-white/20"><X size={18} /></button>
            <h2 className="text-2xl font-black">📒 Sổ tay khám phá</h2>
            <p className="text-sm text-white/60 mt-1">Chạm vào bộ phận trong tế bào để dán nhãn vào sổ. Chơi 🎯 Truy tìm để nhận huy hiệu!</p>
            <div className="mt-5 space-y-5">
                {ORDER.map((id) => {
                    const cell = CELL_DATA.find((c) => c.id === id)!;
                    const story = CELL_STORIES[id];
                    const seen = notebook[id];
                    const count = cell.organelles.filter((o) => seen.includes(o.id)).length;
                    return (
                        <section key={id} className={`rounded-2xl border p-3.5 ${id === current ? 'border-white/25 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: story.accent, boxShadow: `0 0 10px ${story.accent}` }} />
                                <h3 className="font-black">{story.specimen}</h3>
                                <span className="text-xs text-white/55">{count}/{cell.organelles.length}</span>
                                {badges.includes(id)
                                    ? <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/90 text-amber-950">🏅 Đã có huy hiệu</span>
                                    : <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white/60">Chưa có huy hiệu</span>}
                                {id !== current && (
                                    <button onClick={() => onOpenCell(id)} className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20">Soi mẫu này →</button>
                                )}
                            </div>
                            <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {cell.organelles.map((o) => {
                                    const got = seen.includes(o.id);
                                    return (
                                        <div
                                            key={o.id}
                                            className={`rounded-xl p-2 text-center border transition-all ${got ? '' : 'border-dashed border-white/15 bg-white/[0.02]'}`}
                                            style={got ? { background: `${o.color}22`, borderColor: `${o.color}88` } : undefined}
                                            title={got ? o.short : 'Chưa khám phá'}
                                        >
                                            <div className={`text-2xl ${got ? '' : 'grayscale opacity-30'}`}>{got ? o.emoji : '❔'}</div>
                                            <div className={`mt-1 text-[11px] font-bold leading-tight ${got ? 'text-white' : 'text-white/35'}`}>{got ? o.name : '???'}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    </div>
);
