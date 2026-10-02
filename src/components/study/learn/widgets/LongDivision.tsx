// Đặt tính chia kiểu SGK (rút gọn): số bị chia | số chia, thương dưới số chia; phát lại từng lượt chia – nhân – trừ – hạ.
import React, { useMemo, useState } from 'react';
import { ChevronRight, RotateCcw } from 'lucide-react';
import type { DivisionSpec } from '@/services/study/lessons/types';
import { divisionSummary, longDivision } from './algo';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { questionToSpeech } from '@/src/utils/questionSpeech';

/** `step`: điều khiển từ ngoài (ví dụ mẫu) — ẩn nút và lời đọc riêng. */
export function LongDivision({ spec, step }: { spec: DivisionSpec; step?: number }) {
    const r = useMemo(() => longDivision(spec.a, spec.b), [spec.a, spec.b]);
    const [own, setK] = useState(0); // số lượt đã hiện
    const controlled = step !== undefined;
    const k = controlled ? Math.min(step, r.steps.length) : own;
    const n = r.digits.length;
    const rows: { text: string; end: number }[] = [];
    for (let j = 0; j < k; j++) {
        const s = r.steps[j];
        if (s.next !== null) rows.push({ text: s.next, end: s.at + 1 });
        else rows.push({ text: String(s.rem), end: s.at });
    }
    const curStep = k > 0 ? r.steps[k - 1] : null;
    const hi = (col: number) => !!curStep && (col === curStep.at || (k === 1 && col <= curStep.at));
    const cells = (text: string, end: number, cls = '') => Array.from({ length: n }, (_, c) => {
        const off = end - c, ch = off >= 0 && off < text.length ? text[text.length - 1 - off] : '';
        return <span key={c} className={`ld-cell ${cls}`}>{ch}</span>;
    });
    const done = k >= r.steps.length;
    return (
        <div className="learn-widget ld">
            <div className="ld-board" aria-label={`Đặt tính ${spec.a} chia ${spec.b}`}>
                <div className="ld-left">
                    <div className="ld-row">{r.digits.map((d, c) => <span key={c} className={`ld-cell${hi(c) ? ' hi' : ''}`}>{d}</span>)}</div>
                    {rows.map((row, i) => <div key={i} className={`ld-row${i === rows.length - 1 ? ' last' : ''}`}>{cells(row.text, row.end)}</div>)}
                </div>
                <div className="ld-right">
                    <div className="ld-divisor">{spec.b}</div>
                    <div className="ld-quot">{r.steps.slice(0, k).map(s => s.q).join('') || ' '}</div>
                </div>
            </div>
            {!controlled && <><div className="ld-say" aria-live="polite">
                {curStep ? <p><b>Lượt {k}.</b> {curStep.say}</p> : <p>Bấm <b>Bước tiếp</b> để chia từng lượt: chia, nhân, trừ, hạ.</p>}
                {done && <p className="ld-result"><b>{divisionSummary(spec.a, spec.b, r)}</b></p>}
            </div>
            <div className="learn-widget-actions">
                {!done && <button className="study-btn soft" onClick={() => setK(k + 1)}>Bước tiếp <ChevronRight size={18} /></button>}
                {!done && <button className="hub-text-link" onClick={() => setK(r.steps.length)}>Xem hết</button>}
                {k > 0 && <button className="hub-text-link" onClick={() => setK(0)}><RotateCcw size={15} /> Làm lại</button>}
                {curStep && <SpeakButton key={k} text={questionToSpeech(curStep.say)} lang="vi-VN" size={20} />}
            </div></>}
        </div>
    );
}
