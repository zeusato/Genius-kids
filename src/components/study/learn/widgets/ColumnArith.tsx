// Đặt tính cộng, trừ, nhân kiểu SGK: thẳng cột (thẳng dấu phẩy), phát lại từng bước, ghi chữ số nhớ.
import React, { useMemo, useState } from 'react';
import { ChevronRight, RotateCcw } from 'lucide-react';
import type { ColumnSpec } from '@/services/study/lessons/types';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { questionToSpeech } from '@/src/utils/questionSpeech';
import { column } from './column';

export function ColumnArith({ spec, step }: { spec: ColumnSpec; step?: number }) {
    const r = useMemo(() => column(spec.op, spec.a, spec.b), [spec.op, spec.a, spec.b]);
    const [own, setK] = useState(0);
    const controlled = step !== undefined;
    const k = controlled ? Math.min(step, r.steps.length) : own;
    const hasDec = r.minExp < 0;
    const exps: number[] = [];
    for (let e = r.maxExp; e >= r.minExp; e--) exps.push(e);
    const shown = r.steps.slice(0, k);
    const cells = r.rows.map(row => ({ ...row, cells: { ...row.cells } }));
    for (const s of shown) for (const w of s.writes) if (w.ch) cells[w.row].cells[w.exp] = w.ch;
    const commaOn = (i: number) => (r.rows[i].comma) || shown.some(s => s.comma === i);
    const cur = k > 0 ? r.steps[k - 1] : null;
    const curExps = new Set(cur?.writes.map(w => w.exp) ?? []);
    const carry = cur?.carry ?? null;
    const resultIdx = r.rows.length - 1;
    const lineBefore = (i: number) => r.rows[i].kind !== 'a' && r.rows[i].kind !== 'b' && (i === 2 || i === resultIdx);
    const done = k >= r.steps.length;
    return (
        <div className="learn-widget ca">
            <div className="ca-board" aria-label={`Đặt tính ${spec.a} ${spec.op} ${spec.b}`} style={{ gridTemplateColumns: `1.2ch repeat(${exps.length + (hasDec ? 1 : 0)}, auto)` }}>
                <span className="ca-op" />
                {exps.map(e => <React.Fragment key={e}>
                    <span className="ca-carry">{carry && carry.exp === e ? carry.v : ''}</span>
                    {hasDec && e === 0 && <span className="ca-carry" />}
                </React.Fragment>)}
                {cells.map((row, i) => <React.Fragment key={i}>
                    {lineBefore(i) && <span className="ca-line" style={{ gridColumn: `1 / -1` }} />}
                    <span className="ca-op">{i === 1 ? spec.op : i > 2 && i < resultIdx && r.op === '×' ? '+' : ''}</span>
                    {exps.map(e => <React.Fragment key={e}>
                        <span className={`ca-cell${row.kind === 'result' || row.kind === 'partial' ? ' out' : ''}${curExps.has(e) ? ' hi' : ''}`}>{row.cells[e] ?? ''}</span>
                        {hasDec && e === 0 && <span className="ca-comma">{commaOn(i) ? ',' : ''}</span>}
                    </React.Fragment>)}
                </React.Fragment>)}
            </div>
            {!controlled && <>
                <div className="ld-say" aria-live="polite">
                    {cur ? <p><b>Bước {k}.</b> {cur.say}</p> : <p>Bấm <b>Bước tiếp</b> để tính từng hàng, từ phải sang trái.</p>}
                </div>
                <div className="learn-widget-actions">
                    {!done && <button className="study-btn soft" onClick={() => setK(k + 1)}>Bước tiếp <ChevronRight size={18} /></button>}
                    {!done && <button className="hub-text-link" onClick={() => setK(r.steps.length)}>Xem hết</button>}
                    {k > 0 && <button className="hub-text-link" onClick={() => setK(0)}><RotateCcw size={15} /> Làm lại</button>}
                    {cur && <SpeakButton key={k} text={questionToSpeech(cur.say)} lang="vi-VN" size={20} />}
                </div>
            </>}
        </div>
    );
}
