import React, { useState } from 'react';
import { Lock, Users, Volume2 } from 'lucide-react';
import { HubDialog } from '@/src/components/hub/HubShell';
import type { GateId, Riddle } from '../content/types';
import { GATES, GATE_MAP } from '../content/gates';
import type { RiddleProgress } from '../progress/model';
import { AnswerBadge, ClueList, Seals, markLine } from './ClueReveal';
import { textLines } from './lines';
import { useVoice } from './voice';

export function Album({ progress, pool, onAsk }: { progress: RiddleProgress; pool: Riddle[]; onAsk: (r: Riddle) => void }) {
    const [tab, setTab] = useState<GateId>('animals');
    const [open, setOpen] = useState<Riddle | null>(null);
    const voice = useVoice();
    const list = pool.filter(r => r.gate === tab);
    const solved = list.filter(r => (progress.solved[r.id]?.seals ?? 0) > 0);
    const gate = GATE_MAP.get(tab)!;
    return (
        <div className="rd-album">
            <div className="rd-section-head">
                <h1>Sổ Đố của em</h1>
                <p>Mỗi câu giải được là một trang sổ. Mở trang để xem lại manh mối, hoặc mang đi đố cả nhà.</p>
            </div>
            <div className="rd-tabs" role="tablist" aria-label="Chọn cổng">
                {GATES.map(g => {
                    const n = pool.filter(r => r.gate === g.id && (progress.solved[r.id]?.seals ?? 0) > 0).length;
                    return <button key={g.id} role="tab" aria-selected={tab === g.id} className={tab === g.id ? 'is-on' : ''} style={{ ['--gate' as string]: g.accent, ['--stone' as string]: g.stone }} onClick={() => setTab(g.id)}><span aria-hidden="true">{g.glyph}</span>{g.title}<small>{n}</small></button>;
                })}
            </div>
            <div className="rd-pages" role="tabpanel" style={{ ['--gate' as string]: gate.accent, ['--stone' as string]: gate.stone }}>
                {solved.map(r => (
                    <button key={r.id} className="rd-page" onClick={() => setOpen(r)}>
                        <span className="rd-page-pic" aria-hidden="true">{r.emoji ?? gate.glyph}</span>
                        <strong>{r.answer}</strong>
                        <Seals n={progress.solved[r.id].seals} animate={false} />
                    </button>
                ))}
                {Array.from({ length: Math.min(12, list.length - solved.length) }, (_, i) => <div key={`l${i}`} className="rd-page is-locked" aria-hidden="true"><Lock size={22} /></div>)}
                {list.length - solved.length > 12 && <p className="rd-pages-more">Còn {list.length - solved.length - 12} trang nữa đang chờ em.</p>}
            </div>
            {open && (
                <HubDialog title="Một trang Sổ Đố" onClose={() => { voice.stop(); setOpen(null); }}>
                    <div className="rd-album-detail">
                        <AnswerBadge riddle={open} />
                        <blockquote className="rd-riddle is-small" lang={open.lang}>{textLines(open).map((l, i) => <p key={i}>{markLine(l, open)}</p>)}</blockquote>
                        {open.vi && <p className="rd-translate">{open.vi}</p>}
                        <ClueList riddle={open} />
                        <p className="rd-explain">{open.explain}</p>
                        <div className="rd-dialog-actions">
                            <button className="rd-btn rd-btn-soft" onClick={() => voice.say([...textLines(open).map(text => ({ text, lang: open.lang === 'en' ? 'en-US' as const : 'vi-VN' as const })), { text: `Đáp án là ${open.answer}.` }, { text: open.explain }])}><Volume2 size={18} />Nghe lại</button>
                            <button className="rd-btn rd-btn-primary" onClick={() => { voice.stop(); onAsk(open); }}><Users size={18} />Đố người khác</button>
                        </div>
                    </div>
                </HubDialog>
            )}
        </div>
    );
}
