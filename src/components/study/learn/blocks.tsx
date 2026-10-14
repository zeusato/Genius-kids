// Khối nội dung của trang bài học. Mọi chữ có số đều qua Md (phân số xếp chồng, dấu "−").
import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Eye, Lightbulb } from 'lucide-react';
import type { Block, Mistake, VisualSpec, Worked } from '@/services/study/lessons/types';
import { renderVisual } from '@/services/generators/svg/render';
import { speakVietnamese } from '@/src/utils/speech';
import { questionToSpeech } from '@/src/utils/questionSpeech';
import { Md } from '../shared';
import { Widget } from './widgets';

export function Pic({ visual, caption }: { visual: VisualSpec; caption?: string }) {
    const svg = useMemo(() => renderVisual(visual), [visual]);
    if (!svg) return null;
    return <figure className="learn-pic"><div dangerouslySetInnerHTML={{ __html: svg }} />{caption && <figcaption><Md inline>{caption}</Md></figcaption>}</figure>;
}

/** Công thức: "{Tổng}" → chip tô màu; phần còn lại giữ chữ đậm. */
export function Formula({ text }: { text: string }) {
    const parts = text.split(/(\{[^}]+\})/);
    let color = 0;
    return <div className="learn-formula">{parts.filter(Boolean).map((p, i) => p.startsWith('{')
        ? <span key={i} className={`learn-term c${color++ % 4}`}><Md inline>{p.slice(1, -1)}</Md></span>
        : <span key={i} className="learn-op"><Md inline>{p}</Md></span>)}</div>;
}

export function RuleBox({ say, formula, title }: { say: string; formula?: string; title?: string }) {
    return (
        <section className="learn-rule">
            <span className="learn-rule-label">{title ?? 'Quy tắc'}</span>
            <p><Md inline>{say}</Md></p>
            {formula && <Formula text={formula} />}
        </section>
    );
}

export function BlockView({ b }: { b: Block }) {
    switch (b.t) {
        case 'text': return <div className="learn-text"><Md>{b.md}</Md></div>;
        case 'note': return <div className="learn-note"><Lightbulb size={18} /><div><b>Lưu ý.</b> <Md inline>{b.md}</Md></div></div>;
        case 'rule': return <RuleBox say={b.say} formula={b.formula} title={b.title} />;
        case 'pic': return <Pic visual={b.visual} caption={b.caption} />;
        case 'table': return (
            <div className="learn-table" role="region" aria-label={b.caption || 'Bảng'} tabIndex={0}>
                <table><thead><tr>{b.head.map((h, i) => <th key={i} scope="col"><Md inline>{h}</Md></th>)}</tr></thead>
                    <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}><Md inline>{c}</Md></td>)}</tr>)}</tbody></table>
                {b.caption && <p className="learn-caption"><Md inline>{b.caption}</Md></p>}
            </div>
        );
        case 'widget': return <Widget spec={b.widget} />;
    }
}

/** Ví dụ mẫu: hiện lời giải từng bước (nút / Enter / Space); đáp số + thử lại ở cuối. */
export function WorkedSteps({ worked, autoRead }: { worked: Worked; autoRead?: boolean }) {
    const [shown, setShown] = useState(0);
    const all = shown >= worked.steps.length;
    const next = () => setShown(s => Math.min(worked.steps.length, s + 1));
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || e.ctrlKey || e.altKey || e.metaKey) return;
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });
    useEffect(() => {
        if (!autoRead || shown === 0) return;
        const s = worked.steps[shown - 1];
        speakVietnamese(questionToSpeech(`${s.say} ${s.math ?? ''}`));
    }, [shown, autoRead, worked]);
    return (
        <div className={`learn-worked${worked.visual || worked.replay ? ' two' : ''}`}>
            <div className="learn-worked-main">
                <div className="learn-problem"><span>Đề bài</span><Md>{worked.problem}</Md></div>
                {worked.layout === 'solution' && shown > 0 && <h3 className="learn-solution-head">Bài giải</h3>}
                <ol className={`learn-steps ${worked.layout}`}>
                    {worked.steps.slice(0, shown).map((s, i) => (
                        <li key={i} className="learn-step">
                            <p><Md inline>{s.say}</Md></p>
                            {s.math && <p className="learn-math"><Md inline>{s.math}</Md></p>}
                            {s.visual && <Pic visual={s.visual} />}
                        </li>
                    ))}
                </ol>
                {all ? (
                    <div className="learn-answer" role="status">
                        <p><b><Md inline>{worked.answer}</Md></b></p>
                        {worked.check && <p className="learn-check"><Md inline>{worked.check}</Md></p>}
                    </div>
                ) : (
                    <div className="learn-widget-actions">
                        <button className="study-btn soft" onClick={next}>{shown === 0 ? 'Xem bước đầu tiên' : 'Xem bước tiếp'} · {shown + 1}/{worked.steps.length} <ChevronRight size={18} /></button>
                        <button className="hub-text-link" onClick={() => setShown(worked.steps.length)}>Xem cả lời giải</button>
                    </div>
                )}
                {shown === 0 && <p className="learn-hint-line">Em thử tự nghĩ bước đầu tiên trước khi bấm nhé.</p>}
            </div>
            {(worked.visual || worked.replay) && <div className="learn-worked-side">
                {worked.visual && <Pic visual={worked.visual} />}
                {worked.replay && <Widget spec={worked.replay} step={worked.layout === 'calc' ? shown : undefined} />}
            </div>}
        </div>
    );
}

export function MistakeCard({ m }: { m: Mistake }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="learn-mistake">
            <p className="learn-lead">Em thử tìm chỗ sai trước khi xem lời giải thích nhé.</p>
            <div className="learn-compare">
                <div className="learn-wrong"><small>BẠN BI LÀM THẾ NÀY</small><p><Md inline>{m.wrong}</Md></p></div>
                <div className="learn-right"><small>CÁCH ĐÚNG</small><p><Md inline>{m.right}</Md></p></div>
            </div>
            {open ? <div className="learn-why" role="status"><b>Vì sao?</b> <Md inline>{m.why}</Md></div>
                : <button className="study-btn soft" onClick={() => setOpen(true)}><Eye size={18} />Vì sao?</button>}
        </div>
    );
}
