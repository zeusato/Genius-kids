// Đặt tính chia kiểu SGK (rút gọn): số bị chia | số chia, thương dưới số chia; phát lại từng lượt chia – nhân – trừ – hạ.
import React, { useMemo, useState } from 'react';
import { ChevronRight, RotateCcw } from 'lucide-react';
import type { DivisionSpec } from '@/services/study/lessons/types';
import { divisionSummary, longDivision, quotientText } from './algo';
import { SpeakButton } from '@/src/components/shared/SpeakButton';
import { questionToSpeech } from '@/src/utils/questionSpeech';

/** `step`: điều khiển từ ngoài (ví dụ mẫu) — ẩn nút và lời đọc riêng. */
export function LongDivision({ spec, step }: { spec: DivisionSpec; step?: number }) {
    const r = useMemo(() => longDivision(spec.a, spec.b), [spec.a, spec.b]);
    const [own, setK] = useState(0); // số lượt đã hiện
    const controlled = step !== undefined;
    const k = controlled ? Math.min(step, r.steps.length) : own;
    const n = r.digits.length;
    const hasDec = r.intLen < n;
    const rows: { text: string; end: number; subtract?: boolean }[] = [];
    for (let j = 0; j < k; j++) {
        const s = r.steps[j];
        if (spec.layout === 'full') rows.push({ text: String(s.prod), end: s.at, subtract: true });
        if (s.next !== null) rows.push({ text: s.next, end: s.at + 1 });
        else rows.push({ text: String(s.rem), end: s.at });
    }
    const curStep = k > 0 ? r.steps[k - 1] : null;
    const hi = (col: number) => !!curStep && (col === curStep.at || (k === 1 && col <= curStep.at));
    const comma = (c: number, show: boolean) => (hasDec && c === r.intLen - 1 ? <span className="ld-comma">{show ? ',' : ''}</span> : null);
    const cells = (text: string, end: number) => Array.from({ length: n }, (_, c) => {
        const off = end - c, ch = off >= 0 && off < text.length ? text[text.length - 1 - off] : '';
        return <React.Fragment key={c}><span className="ld-cell">{ch}</span>{comma(c, false)}</React.Fragment>;
    });
    const done = k >= r.steps.length;
    return (
        <div className="learn-widget ld">
            <div className="ld-board" aria-label={`Đặt tính ${String(spec.a).replace('.', ',')} chia ${spec.b}`}>
                <div className="ld-left">
                    <div className="ld-row">{spec.layout === 'full' && <span className="ld-sign" />}{r.digits.map((d, c) => <React.Fragment key={c}><span className={`ld-cell${hi(c) ? ' hi' : ''}`}>{d}</span>{comma(c, true)}</React.Fragment>)}</div>
                    {rows.map((row, i) => <div key={i} className={`ld-row${row.subtract ? ' subtract' : ''}${i === rows.length - 1 ? ' last' : ''}`}>{spec.layout === 'full' && <span className="ld-sign">{row.subtract ? '−' : ''}</span>}{cells(row.text, row.end)}</div>)}
                </div>
                <div className="ld-right">
                    <div className="ld-divisor">{spec.b}</div>
                    <div className="ld-quot">{quotientText(r, k) || ' '}</div>
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
