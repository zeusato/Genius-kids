import React, { Component, lazy, Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Eye, RotateCcw, Zap } from 'lucide-react';
import { preset } from '../engine/fixtures';
import { startSimulation } from '../engine/simulation';
import { reading } from '../engine/solver';
import { FlatBench } from '../flat/FlatBench';
import './workshop.css';

const CompareCanvas = lazy(() => import('../bench/CompareCanvas'));
class Boundary extends Component<{ children: React.ReactNode; fallback: React.ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
const pct = (p: number) => Math.round(Math.max(0, p) / 0.75 * 100);
const webgl = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };
const PREDICTIONS = ['Cả hai bàn đều tắt hết', 'Nối tiếp tắt hết, song song còn bóng 2 sáng', 'Cả hai bàn vẫn còn bóng 2 sáng'];

/**
 * "Hai bàn, một câu dự đoán": cùng pin, cùng loại bóng, cùng góc máy và thang sáng. Bé chọn dự đoán trước,
 * rồi vặn lỏng bóng 1 (nút lớn cho cả hai bàn, hoặc chạm từng bóng) và thấy kết quả đứng cạnh nhau.
 */
export function Compare({ onClose }: { onClose: () => void }) {
    const [loose, setLoose] = useState<[string[], string[]]>([[], []]);
    const [prediction, setPrediction] = useState<number | null>(null), [schematic, setSchematic] = useState(false), [nudge, setNudge] = useState(false);
    const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);
    const sims = useMemo(() => (['series', 'parallel'] as const).map((name, i) => { const c = preset(name); c.parts.forEach(p => { if (loose[i].includes(p.id)) p.loose = true; }); return startSimulation(c); }), [loose]);
    const P = sims.map(s => [pct(reading(s.solution, 'L1').Pabsorbed), pct(reading(s.solution, 'L2').Pabsorbed)]);
    const anyLoose = loose[0].length + loose[1].length > 0;
    const boards = [
        { key: 'series', title: 'Nối tiếp', sim: sims[0], subtitle: loose[0].length ? `Bóng ${loose[0].map(id => id.slice(1)).join(', ')} lỏng · cả đường đi bị hở` : `2 bóng chung một đường · mỗi bóng ${P[0][0]}% công suất` },
        { key: 'parallel', title: 'Song song', sim: sims[1], subtitle: loose[1].length ? (loose[1].length === 2 ? 'Cả hai bóng lỏng' : `Bóng ${loose[1][0].slice(1)} lỏng · nhánh còn lại vẫn kín: ${Math.max(P[1][0], P[1][1])}%`) : `Mỗi bóng một nhánh riêng · mỗi bóng ${P[1][0]}% công suất` },
    ];
    const tap = useCallback((b: number, id: string) => {
        if (!id.startsWith('L')) return;
        if (prediction === null) { setNudge(true); setTimeout(() => setNudge(false), 900); return; }
        setLoose(v => { const next: [string[], string[]] = [[...v[0]], [...v[1]]]; next[b] = next[b].includes(id) ? next[b].filter(x => x !== id) : [...next[b], id]; return next; });
    }, [prediction]);
    const bothLooseL1 = loose[0].includes('L1') && loose[1].includes('L1');
    const top = useRef<HTMLDivElement>(null), card = useRef<HTMLElement>(null), [insets, setInsets] = useState({ top: 90, bottom: 180 });
    useLayoutEffect(() => {
        const m = () => { const h = window.innerHeight; setInsets(v => { const t = (top.current?.getBoundingClientRect().bottom ?? 80) + 40, b = h - (card.current?.getBoundingClientRect().top ?? h - 170) + 12; return Math.abs(v.top - t) + Math.abs(v.bottom - b) > 2 ? { top: t, bottom: b } : v; }); };
        m(); const ro = new ResizeObserver(m); [top.current, card.current].forEach(el => el && ro.observe(el)); return () => ro.disconnect();
    });
    const verdict = bothLooseL1 && prediction !== null ? (prediction === 1 ? 'Đoán đúng rồi!' : 'Kết quả khác dự đoán — nhìn lại bàn song song nhé.') : null;
    const flat = <div className="ew-compare-flat">{sims.map((sim, i) => <article key={i}><h3>{boards[i].title}</h3><FlatBench sim={sim} selected={null} schematic={schematic} night portrait={false} reduced={reduced} flow="electron" preview={null} onPreview={() => { }} onSelect={id => tap(i, id)} onConnect={() => { }} onMove={() => { }} onToggle={() => { }} onHold={() => { }} fitKey={0} /><p>{boards[i].subtitle}</p></article>)}</div>;
    return <section className="ew-ws ew-compare is-night" aria-label="So sánh nối tiếp và song song">
        <div className="ew-ws-stage">{webgl() ? <Boundary fallback={flat}><Suspense fallback={<div className="ew-ws-loading"><span>Đang bày hai bàn…</span></div>}><CompareCanvas boards={boards} schematic={schematic} reduced={reduced} selected={null} onTapPart={tap} insets={insets} /></Suspense></Boundary> : flat}</div>
        <div className="ew-ws-top" ref={top}>
            <button className="ew-round" onClick={onClose} aria-label="Về bàn"><ArrowLeft size={20} /></button>
            <div className="ew-ws-title"><span>Cùng pin · cùng bóng · cùng thang sáng</span><h1>Hai cách nối, hai kết quả</h1></div>
            <div className="ew-ws-actions"><button className="ew-round" aria-pressed={schematic} onClick={() => setSchematic(!schematic)} aria-label={schematic ? 'Xem đồ thật' : 'Xem sơ đồ'}>{schematic ? <Zap size={19} /> : <Eye size={19} />}</button></div>
        </div>
        <section ref={card} className={`ew-compare-card ${nudge ? 'is-nudge' : ''}`}>
            {!bothLooseL1 && <p>Cùng <b>1 pin 1,5 V</b> và 2 bóng giống nhau. {prediction === null ? <>Nếu <b>vặn lỏng bóng 1</b> ở cả hai bàn, em đoán chuyện gì xảy ra?</> : <>Giờ thử xem nào — chạm vào một bóng hoặc dùng nút bên dưới.</>}</p>}
            {bothLooseL1 && <p className="ew-compare-result"><b>{verdict}</b> Nối tiếp chỉ có <b>một đường đi</b>: hở một chỗ là cả hai tắt. Song song mỗi bóng có <b>nhánh riêng</b> về pin nên bóng 2 vẫn sáng.</p>}
            <div className="ew-task-choices" role="group" aria-label="Dự đoán">{PREDICTIONS.map((t, i) => <button key={t} aria-pressed={prediction === i} disabled={anyLoose} onClick={() => setPrediction(i)}>{t}</button>)}</div>
            <div className="ew-compare-actions">
                <button className="ew-cta" disabled={prediction === null} onClick={() => setLoose(bothLooseL1 ? [[], []] : [['L1'], ['L1']])}>{bothLooseL1 ? <><RotateCcw size={16} />Siết lại bóng 1</> : 'Vặn lỏng bóng 1 ở cả hai bàn'}</button>
                {anyLoose && !bothLooseL1 && <button onClick={() => setLoose([[], []])}><RotateCcw size={16} />Siết lại tất cả</button>}
            </div>
        </section>
    </section>;
}
