import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eraser, PencilLine, Play } from 'lucide-react';
import type { AlphabetLetter } from '../../data/alphabetData';
import { cancelSpeech, speak } from '../../utils/speech';
import { soundManager } from '../../../utils/sound';
import { SpeakButton } from '../shared/SpeakButton';
import { TRACE_LETTERS, advanceTrace, canStartTrace, initialTraceState, pointsAttribute, traceAnchor, traceFinished, type TracePoint, type TraceState } from './letterTracingModel';
import './letter-tracing.css';

export function LetterTracing({ letter, scene, earned, onComplete, onBack, onNext }: {
    letter: AlphabetLetter; scene: string; earned: boolean; onComplete: (state: TraceState) => void; onBack: () => void; onNext: () => void;
}) {
    const model = TRACE_LETTERS[letter.id];
    const [state, setState] = useState(initialTraceState);
    const live = useRef(state);
    const [hint, setHint] = useState('');
    const [demo, setDemo] = useState<number | null>(null);
    const [replay, setReplay] = useState(0);
    const demoFrame = useRef(0);
    const gesture = useRef<{ id: number; previous: TracePoint } | null>(null);
    const drawing = useRef<SVGSVGElement>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const completed = useRef(false);
    const done = traceFinished(model, state);
    const active = model.strokes[state.stroke];
    const anchor = traceAnchor(model, state);
    const remaining = active?.points.slice(state.point) ?? [];
    const direction = remaining[Math.min(7, remaining.length - 1)];
    const instruction = done ? 'Bé đã tô xong rồi! Cùng khám phá chữ tiếp theo nhé.' : `Nét ${state.stroke + 1}: ${active.instruction}`;
    const fraction = (state.stroke + (active ? state.point / (active.points.length - 1) : 0)) / model.strokes.length;
    const stopDemo = () => { cancelAnimationFrame(demoFrame.current); setDemo(null); };

    useEffect(() => {
        heading.current?.focus({ preventScroll: true });
        heading.current?.closest('.lt-page')?.scrollIntoView({ block: 'start', behavior: 'instant' });
        return () => { cancelAnimationFrame(demoFrame.current); cancelSpeech(); gesture.current = null; };
    }, []);

    const position = (event: React.PointerEvent<SVGSVGElement>): TracePoint | null => {
        const matrix = drawing.current?.getScreenCTM();
        if (!matrix) return null;
        const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        return [p.x, p.y];
    };
    const commit = (next: TraceState) => {
        const previous = live.current;
        live.current = next; setState(next);
        if (next.stroke > previous.stroke) {
            gesture.current = null;
            setHint('');
            soundManager.playNote(523.25 + previous.stroke * 90, .2);
            if (traceFinished(model, next)) {
                if (!completed.current) {
                    completed.current = true;
                    onComplete(next);
                    soundManager.playCorrect();
                }
            }
        }
    };
    const begin = (event: React.PointerEvent<SVGSVGElement>) => {
        if (event.button !== 0 || gesture.current || traceFinished(model, live.current)) return;
        event.preventDefault();
        stopDemo();
        const point = position(event);
        if (!point || !canStartTrace(model, live.current, point)) {
            setHint('Bắt đầu ở chấm xanh nhé.'); return;
        }
        setHint('');
        gesture.current = { id: event.pointerId, previous: point };
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const move = (event: React.PointerEvent<SVGSVGElement>) => {
        const current = gesture.current;
        if (!current || current.id !== event.pointerId) return;
        event.preventDefault();
        const point = position(event);
        if (!point) return;
        const result = advanceTrace(model, live.current, current.previous, point);
        current.previous = point;
        commit(result.state);
        if (result.offPath) {
            gesture.current = null;
            setHint('Nhấc tay rồi tô tiếp từ chấm xanh nhé. Nét đã tô vẫn ở đây!');
        }
    };
    const end = (event: React.PointerEvent<SVGSVGElement>) => {
        if (gesture.current?.id === event.pointerId) { move(event); gesture.current = null; }
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };
    const reset = () => {
        stopDemo(); cancelSpeech(); gesture.current = null;
        live.current = initialTraceState(); setState(live.current); setHint('');
        setReplay(value => value + 1);
    };
    const demonstrate = () => {
        if (done || !active) return;
        stopDemo(); gesture.current = null;
        speak(active.instruction, { lang: 'vi-VN' });
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setHint('Đi từ chấm xanh, theo mũi tên và các chấm nhỏ. ' + active.instruction); return;
        }
        const started = performance.now();
        const tick = (now: number) => {
            const progress = Math.min(1, (now - started) / 2400);
            setDemo(progress);
            if (progress < 1) demoFrame.current = requestAnimationFrame(tick);
            else setDemo(null);
        };
        demoFrame.current = requestAnimationFrame(tick);
    };
    const demoIndex = Math.floor((demo ?? 0) * Math.max(0, remaining.length - 1));
    const demoPoint = demo !== null ? remaining[demoIndex] : null;

    return <section className={'lt-page' + (done ? ' lt-complete' : '')} aria-label={'Trang tập tô chữ ' + letter.upper}>
        <div className="lt-top"><button className="lt-back" onClick={onBack}><ArrowLeft size={16}/>Về nhiệm vụ</button><span><Check size={14}/>Đã ghép đúng {letter.upper} – {letter.lower}</span></div>
        <div className="lt-layout">
            <aside className="lt-companion">
                <img src={scene} alt="" draggable={false}/>
                <div className="lt-companion-copy"><span className="ag-eyebrow">CÙNG BÉ TẬP VIẾT</span><strong>{letter.upper}<small>{letter.lower}</small></strong><span>{letter.exampleEn} · {letter.exampleVi}</span><p>Đi từng nét nhỏ,<br/>bé sẽ viết được thôi!</p></div>
            </aside>
            <div className="lt-workspace">
                <div className="lt-heading"><div><span className="ag-eyebrow">BƯỚC 3 · TẬP TÔ CHỮ HOA</span><h3 ref={heading} tabIndex={-1}>Tô chữ {letter.upper} cùng Cáo</h3></div><SpeakButton text={(done ? 'Giỏi quá! ' : state.stroke === 0 ? 'Chạm chấm xanh, giữ tay và kéo theo các chấm nhỏ. ' : 'Giỏi lắm! Nhấc tay rồi chạm chấm xanh tiếp theo. ') + instruction} autoPlay autoPlayKey={`${letter.id}-${state.stroke}-${replay}`} title="Nghe hướng dẫn tập tô" size={24}/></div>
                <div className="lt-action-row"><div className="lt-instruction"><span className="lt-start-dot"/><p aria-live="polite">{hint || instruction}</p></div>{done && <button className="ag-primary lt-next" onClick={onNext}>Chữ tiếp theo<ArrowRight size={18}/></button>}</div>
                <div className="lt-paper">
                    <span className="lt-paper-label">{done ? 'Nét chữ của bé' : 'Giữ tay và tô theo nét'}</span>
                    <svg ref={drawing} className="lt-canvas" viewBox="60 40 280 330" role="group" aria-label={'Khung tập tô chữ ' + letter.upper + '. Dùng ngón tay hoặc chuột tô từ chấm xanh.'}
                        onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={event => { if (gesture.current?.id === event.pointerId) gesture.current = null; }}>
                        <g className="lt-writing-lines" aria-hidden="true">{[85, 202, 320].map(y => <line key={y} x1={64} x2={336} y1={y} y2={y} className={y === 202 ? 'lt-middle-line' : ''}/>)}</g>
                        <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            {model.strokes.map((path, i) => <polyline key={'outline' + i} points={pointsAttribute(path.points)} className="lt-outline"/>)}
                            {model.strokes.map((path, i) => <polyline key={'inside' + i} points={pointsAttribute(path.points)} className="lt-interior"/>)}
                            {model.strokes.map((path, i) => <polyline key={'guide' + i} points={pointsAttribute(path.points)} className="lt-centre-guide"/>)}
                            {model.strokes.map((path, i) => i <= state.stroke && <polyline key={'ink' + i} points={pointsAttribute(i < state.stroke ? path.points : path.points.slice(0, state.point + 1))} className="lt-ink"/>)}
                            {demo !== null && <polyline points={pointsAttribute(remaining.slice(0, demoIndex + 1))} className="lt-demo-ink"/>}
                        </g>
                        {!done && active && <g aria-hidden="true">
                            {remaining.filter((_, i) => i > 3 && i % 6 === 0).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.7} className="lt-trail-dot"/>)}
                            {anchor && <g className="lt-start" transform={`translate(${anchor[0]} ${anchor[1]})`}><circle r={17} className="lt-start-halo"/><circle r={12}/><text textAnchor="middle" dominantBaseline="central">{state.stroke + 1}</text></g>}
                            {anchor && direction && <path className="lt-direction" d="M-4-6L3 0L-4 6" transform={`translate(${direction[0]} ${direction[1]}) rotate(${Math.atan2(direction[1] - anchor[1], direction[0] - anchor[0]) * 180 / Math.PI})`}/>}
                        </g>}
                        {demoPoint && <g className="lt-demo-pencil" transform={`translate(${demoPoint[0]} ${demoPoint[1]})`} aria-hidden="true"><circle r={14}/><path d="M0 0L13-26L21-22L8 4Z"/></g>}
                        {done && <g className="lt-finished-stars" aria-hidden="true"><text x={90} y={52}>✧</text><text x={302} y={345}>✧</text></g>}
                    </svg>
                    <div className="lt-stroke-progress"><span>{done ? 'Hoàn thành!' : `Nét ${state.stroke + 1} / ${model.strokes.length}`}</span><div role="progressbar" aria-label="Tiến độ tô chữ" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)}><i style={{ width: fraction * 100 + '%' }}/></div><span>{Math.round(fraction * 100)}%</span></div>
                </div>
                <div className="lt-tools"><button onClick={demonstrate} disabled={done || demo !== null}><Play size={16}/>{demo !== null ? 'Cáo đang chỉ nét…' : 'Xem nét mẫu'}</button><button onClick={reset}><Eraser size={16}/>Tô lại</button></div>
                {done ? <div className="lt-reward" role="status"><span className="lt-reward-sticker">{letter.emoji}<Check size={13}/></span><div><strong>{earned ? 'Bé tô đẹp lắm!' : 'Sticker mới cho bé!'}</strong><p>Đã khám phá, ghép chữ và tập tô.</p></div></div>
                    : <p className="lt-gentle"><PencilLine size={14}/>Cứ thong thả. Bé có thể nhấc tay rồi tô tiếp.</p>}
            </div>
        </div>
    </section>;
}
