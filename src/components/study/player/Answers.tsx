// Vùng trả lời theo loại câu: lựa chọn 2×2, dấu so sánh, Đúng/Sai, bàn phím số, sắp xếp, chọn nhiều, gõ phím.
import React, { useEffect, useRef, useState } from 'react';
import { Check, Delete, Keyboard } from 'lucide-react';
import { Question, QuestionType } from '@/types';
import { Md } from '../shared';

export type Answer = string | string[] | undefined;
/** none: đang làm · final: đã chốt, hiện đúng/sai */
export type Reveal = 'none' | 'final';

export interface AnswerProps {
    q: Question;
    value: Answer;
    onChange: (v: Answer) => void;
    /** Enter / chạm lần 2 */
    onSubmit?: () => void;
    reveal: Reveal;
    /** lựa chọn đã loại ở lần sai đầu (Luyện tập) */
    eliminated?: string[];
    locked?: boolean;
    /** kết quả đã chấm (để tô ô nhập / ô sắp xếp) */
    correct?: boolean;
    hideFeedback?: boolean;
}

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const isCompare = (q: Question) => q.type === QuestionType.SingleChoice && q.options?.length === 3 && ['>', '<', '='].every(s => q.options!.includes(s));
const isYesNo = (q: Question) => q.type === QuestionType.SingleChoice && q.options?.length === 2 && q.options.every(o => o.length <= 14);
const SIGN_LABEL: Record<string, string> = { '>': 'lớn hơn', '<': 'bé hơn', '=': 'bằng' };

function optClass(q: Question, opt: string, p: AnswerProps): string {
    const selected = Array.isArray(p.value) ? p.value.includes(opt) : p.value === opt;
    if (p.reveal === 'final') {
        const right = q.type === QuestionType.MultipleSelect ? !!q.correctAnswers?.includes(opt) : opt === q.correctAnswer;
        if (right) return 'study-opt ok';
        return selected ? 'study-opt bad' : 'study-opt dim';
    }
    if (p.eliminated?.includes(opt)) return 'study-opt bad dim';
    return selected ? 'study-opt sel' : 'study-opt';
}

function Choices(p: AnswerProps) {
    const { q } = p;
    const opts = q.options || [];
    const multi = q.type === QuestionType.MultipleSelect;
    const pick = (o: string) => {
        if (p.locked || p.reveal === 'final' || p.eliminated?.includes(o)) return;
        if (multi) {
            const cur = Array.isArray(p.value) ? p.value : [];
            p.onChange(cur.includes(o) ? cur.filter(x => x !== o) : [...cur, o]);
        } else p.onChange(o);
    };
    if (isCompare(q)) return (
        <div className="study-cmp" role="radiogroup" aria-label="Chọn dấu">
            {['>', '<', '='].map(s => <button key={s} className={optClass(q, s, p)} onClick={() => pick(s)} aria-label={SIGN_LABEL[s]} aria-pressed={p.value === s} disabled={p.locked || p.reveal === 'final' || p.eliminated?.includes(s)}>{s}</button>)}
        </div>
    );
    if (isYesNo(q)) return (
        <div className="study-yn">
            {opts.map(o => <button key={o} className={optClass(q, o, p)} onClick={() => pick(o)} aria-pressed={p.value === o} disabled={p.locked || p.reveal === 'final' || p.eliminated?.includes(o)}>{o}</button>)}
        </div>
    );
    const long = opts.some(o => o.length > 34 || o.includes('|'));
    return (
        <div className={`study-answers${long ? ' one' : ''}`}>
            {multi && <p className="study-order-hint" style={{ gridColumn: '1 / -1' }}>Chọn tất cả đáp án đúng.</p>}
            {opts.map((o, i) => {
                const sel = Array.isArray(p.value) ? p.value.includes(o) : p.value === o;
                const right = multi ? !!q.correctAnswers?.includes(o) : o === q.correctAnswer;
                return (
                    <button key={o + i} className={optClass(q, o, p)} onClick={() => pick(o)} aria-pressed={sel} disabled={p.locked || p.reveal === 'final' || p.eliminated?.includes(o)}>
                        <span className="key">{p.reveal === 'final' && right ? <Check size={16} aria-label="Đáp án đúng" /> : multi ? (sel ? <Check size={16} /> : '') : KEYS[i]}</span>
                        <span><Md inline>{o}</Md></span>
                    </button>
                );
            })}
        </div>
    );
}

function NumberInput(p: AnswerProps) {
    const { q } = p;
    const text = typeof p.value === 'string' ? p.value : '';
    const isNum = q.answerKind !== 'text';
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { if (!isNum || window.matchMedia('(pointer: fine)').matches) ref.current?.focus(); }, [q.id, isNum]);
    const done = p.reveal === 'final';
    const press = (k: string) => {
        if (done || p.locked) return;
        if (k === 'del') p.onChange(text.slice(0, -1));
        else if (text.length < 14) p.onChange(text + k);
    };
    return (
        <div className="study-input">
            <label className={`study-input-box${done ? (p.correct ? ' ok' : ' bad') : ''}`}>
                <input ref={ref} value={text} disabled={done} inputMode={isNum ? 'none' : 'text'} autoComplete="off" spellCheck={false}
                    placeholder={isNum ? 'Nhập số…' : 'Nhập câu trả lời…'} aria-label="Câu trả lời"
                    onChange={e => !p.locked && p.onChange(isNum ? e.target.value.replace(/[^\d,./\s-]/g, '') : e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && text.trim()) { e.preventDefault(); p.onSubmit?.(); } }} />
            </label>
            {isNum && !done && (
                <div className="study-pad" aria-label="Bàn phím số">
                    {['7', '8', '9', 'del', '4', '5', '6', ',', '1', '2', '3', '/'].map(k => (
                        <button key={k} onClick={() => press(k)} aria-label={k === 'del' ? 'Xoá' : k === ',' ? 'dấu phẩy' : k === '/' ? 'phần' : k}>
                            {k === 'del' ? <Delete size={22} /> : k}
                        </button>
                    ))}
                    <button className="wide" onClick={() => press('0')}>0</button>
                    <button className="wide" onClick={() => p.onSubmit?.()} disabled={!text.trim()} aria-label="Xong" style={{ background: 'var(--hub-accent)', color: '#fff' }}><Check size={22} /></button>
                </div>
            )}
        </div>
    );
}

function OrderInput(p: AnswerProps) {
    const { q } = p;
    const items = Array.isArray(p.value) && p.value.length ? p.value : q.options || [];
    const [picked, setPicked] = useState<number | null>(null);
    const drag = useRef<{ i: number; x: number; y: number } | null>(null);
    const moved = useRef(false);
    useEffect(() => { setPicked(null); }, [q.id]);
    const done = p.reveal === 'final';
    const tap = (i: number) => {
        if (moved.current) { moved.current = false; return; }
        if (done || p.locked) return;
        if (picked === null) { setPicked(i); return; }
        if (picked !== i) { const next = [...items]; [next[picked], next[i]] = [next[i], next[picked]]; p.onChange(next); }
        setPicked(null);
    };
    const right = done && !!p.correct;
    return (
        <div className="study-input">
            <div className={`study-order${done ? (right ? ' ok' : ' bad') : ''}`}>
                {items.map((x, i) => <button key={x + i} data-order-index={i} disabled={done || p.locked} className={picked === i ? 'picked' : ''} onClick={() => tap(i)} aria-pressed={picked === i}
                    onPointerDown={e => { if (done || p.locked) return; moved.current = false; drag.current = { i, x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }}
                    onPointerUp={e => {
                        const start = drag.current; drag.current = null;
                        if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) < 8) return;
                        moved.current = true;
                        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-order-index]');
                        if (!target || !e.currentTarget.parentElement?.contains(target)) return;
                        const to = Number(target.dataset.orderIndex), next = [...items];
                        [next[start.i], next[to]] = [next[to], next[start.i]];
                        p.onChange(next); setPicked(null);
                    }} onPointerCancel={() => { drag.current = null; }}><small style={{ opacity: .5 }}>{i + 1}.</small><Md inline>{x}</Md></button>)}
            </div>
            {done && !right && <p className="study-order-hint">Thứ tự đúng: <b>{q.correctAnswers?.join(' ; ')}</b></p>}
            {!done && <p className="study-order-hint">Kéo thả hoặc chạm vào hai ô để đổi chỗ cho nhau.</p>}
        </div>
    );
}

const TELEX = [['â', 'aa'], ['ă', 'aw'], ['ê', 'ee'], ['ô', 'oo'], ['ơ', 'ow'], ['ư', 'uw'], ['đ', 'dd'], ['á', 's'], ['à', 'f'], ['ả', 'r'], ['ã', 'x'], ['ạ', 'j']];
function TypingInput(p: AnswerProps) {
    const target = p.q.correctAnswer || '';
    const text = typeof p.value === 'string' ? p.value : '';
    const ref = useRef<HTMLInputElement>(null);
    const [guide, setGuide] = useState(false);
    useEffect(() => { ref.current?.focus(); }, [p.q.id]);
    return (
        <div className="study-input">
            <button className="study-btn soft" style={{ alignSelf: 'flex-end', minHeight: 40 }} onClick={() => setGuide(!guide)}><Keyboard size={16} />{guide ? 'Ẩn Telex' : 'Cách gõ Telex'}</button>
            {guide && <div className="study-seg">{TELEX.map(([c, m]) => <span key={c} className="study-pill">{c} = {m}</span>)}</div>}
            <div className="study-typing" onClick={() => ref.current?.focus()}>
                {target.split('').map((ch, i) => <span key={i} className={!p.hideFeedback && i < text.length ? (text[i] === ch ? 'g' : 'r') : 'w'}>{ch}</span>)}
                <input ref={ref} value={text} disabled={p.reveal === 'final'} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} aria-label="Gõ lại đoạn văn"
                    onChange={e => p.onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && text.trim()) p.onSubmit?.(); }} />
            </div>
            {p.hideFeedback && <p className="study-typed-value" aria-live="polite">Em đã gõ: {text || '…'}</p>}
            <p className="study-order-hint">{p.hideFeedback ? `Đã gõ ${text.length} ký tự. Bài sẽ được chấm khi nộp.` : 'Gõ đúng từng chữ. Chữ đỏ là gõ sai — xoá rồi gõ lại nhé!'}</p>
        </div>
    );
}

export function AnswerArea(p: AnswerProps) {
    switch (p.q.type) {
        case QuestionType.ManualInput: return <NumberInput {...p} />;
        case QuestionType.Order: return <OrderInput {...p} />;
        case QuestionType.Typing: return <TypingInput {...p} />;
        default: return <Choices {...p} />;
    }
}

/** Đáp án đúng dạng chữ (cho phản hồi / xem lại). */
export function correctText(q: Question): string {
    if (q.type === QuestionType.MultipleSelect || q.type === QuestionType.Order) return (q.correctAnswers || []).join(q.type === QuestionType.Order ? ' ; ' : ', ');
    return q.correctAnswer || '';
}
export function answerText(a: Answer): string {
    if (Array.isArray(a)) return a.join(' ; ');
    return a || '—';
}
