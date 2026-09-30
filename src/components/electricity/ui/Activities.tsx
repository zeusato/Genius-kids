import { HouseView } from './HouseView';
import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ContentSpec } from '../../../data/electricity/content';
import { APPLIANCES, dailyEnergy, earthHourEnergy, HAZARDS, POWER_OBJECTS, SAMPLES } from '../../../data/electricity/labs';
import { Circuit, emptyCircuit, newPart, postIds } from '../engine/circuit';
import { preset, wire } from '../engine/fixtures';
import { compile } from '../engine/parts';
import { reading, solve, solveNetlist } from '../engine/solver';
import { bulbBrightness, startSimulation } from '../engine/simulation';
import { PartGlyph } from '../flat/FlatBench';
import { seededOrder } from '../engine/shuffle';
type Evidence = (state: Record<string, unknown>) => void;
type ActivityState = Record<string, unknown>;
export function Sorting({ onEvidence, initial = {} }: {
    onEvidence: Evidence;
    initial?: ActivityState;
}) { const [answers, setAnswers] = useState<Record<string, string>>(initial.sort as Record<string, string> ?? {}); return <section className="ew-activity"><h2>Nguồn điện ở đâu?</h2><p>Nhìn dấu hiệu trên từng món. Có thể đổi lựa chọn bất cứ lúc nào.</p><div className="ew-object-sort">{POWER_OBJECTS.map(([name, group], i) => <article key={name}><span className="ew-object-number">{String(i + 1).padStart(2, '0')}</span><h3>{name}</h3><div className="ew-segment">{[['battery', 'Dùng pin'], ['mains', 'Điện nhà'], ['none', 'Không dùng điện']].map(([id, label]) => <button key={id} aria-pressed={answers[name] === id} onClick={() => { const next = { ...answers, [name]: id }; setAnswers(next); onEvidence({ sort: next }); }}>{label}</button>)}</div>{answers[name] && <small>{answers[name] === group ? 'Đúng nguồn của mẫu này.' : 'Nhìn lại pin hoặc phích cắm nhé.'}</small>}</article>)}</div></section>; }
export function SafetyRoom({ onEvidence, all = false, initial = {} }: {
    onEvidence: Evidence;
    all?: boolean;
    initial?: ActivityState;
}) { const [selected, setSelected] = useState<string | null>(null), [safe, setSafe] = useState<string[]>(initial.safe as string[] ?? []), [feedback, setFeedback] = useState(''); const hazards = all ? HAZARDS : HAZARDS.slice(0, 5), h = hazards.find(h => h.id === selected); return <section className="ew-activity"><div className="ew-section-intro"><div><span className="ew-eyebrow">Quan sát & quyết định</span><h2>Căn phòng an toàn</h2></div><strong>{safe.length}/{hazards.length} tình huống</strong></div><div className="ew-safety-room"><svg viewBox="0 0 900 480" aria-hidden="true"><path d="M40 100 450 15 860 100V440H40Z" fill="#e7ddc8" stroke="#b4aa92" strokeWidth="4"/><path d="M40 320H860M450 15V440" stroke="#c9bfa8" strokeWidth="3"/><rect x="100" y="100" width="210" height="150" rx="12" fill="#a6c4b8"/><path d="M205 100V250M100 175H310" stroke="#eee6d2" strokeWidth="12"/><rect x="525" y="210" width="230" height="100" rx="16" fill="#668c82"/><rect x="560" y="125" width="150" height="88" rx="9" fill="#324e4a"/><path d="M120 350H350V390H120Z" fill="#bb9973"/></svg><div className="ew-hotspots">{hazards.map((v, i) => <button className={safe.includes(v.id) ? 'is-safe' : ''} style={{ left: `${14 + (i % 3) * 31}%`, top: `${29 + Math.floor(i / 3) * 40}%` }} key={v.id} onClick={() => { setSelected(v.id); setFeedback(''); }}><span>{safe.includes(v.id) ? '✓' : i + 1}</span>{v.name}</button>)}</div></div>{h ? <article className="ew-decision"><h3>{h.sign}</h3><div className="ew-options">{(seededOrder(2, h.id)[0] ? [h.safe, h.wrong] : [h.wrong, h.safe]).map(answer => ({ answer, i: answer === h.safe ? 0 : 1 })).map(({ answer, i }) => <button key={answer} onClick={() => { if (i === 0) {
    const next = [...new Set([...safe, h.id])];
    setSafe(next);
    onEvidence({ safe: next });
    setFeedback('Đúng rồi. Giữ khoảng cách và tìm người lớn giúp.');
}
else
    setFeedback('Cách này vẫn có thể chạm vào chỗ nguy hiểm. Hãy tránh chạm và gọi người lớn.'); }}>{answer}</button>)}</div><p aria-live="polite">{feedback}</p></article> : <p>Chọn một dấu trên căn phòng để xem chuyện gì đang xảy ra.</p>}</section>; }
/** Bàn thử vật dẫn: pin 3 V → bóng thử → ampe kế → hai kẹp mẫu. Chưa kẹp thì mạch hở. */
export function testerCircuit(resistance: number | null | undefined): Circuit {
    const c = emptyCircuit('tester'), b = newPart('battery', 'B', 3, 4.3);
    b.cells = [{ polarity: 1, charge01: 1, present: true }, { polarity: 1, charge01: 1, present: true }];
    const a = newPart('ammeter', 'A', 11, 4.3); a.rot = 90;
    const x = newPart('sample', 'X', 7, 6.1); x.resistance = resistance ?? null;
    c.parts = [b, newPart('bulb', 'L1', 7, 2), a, x];
    c.wires = [wire('w0', 'B', 'plus', 'L1', 'a'), wire('w1', 'L1', 'b', 'A', 'a'), wire('w2', 'A', 'b', 'X', 'b'), wire('w3', 'X', 'a', 'B', 'minus')];
    return c;
}
const ConductorBench = lazy(() => import('../bench/ConductorBench'));
const hasWebGL = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };
const formatCurrent = (i: number) => i >= 0.1 ? `${(i).toFixed(2).replace('.', ',')} A` : i >= 1e-3 ? `${(i * 1000).toFixed(1).replace('.', ',')} mA` : `${(i * 1e6).toFixed(1).replace('.', ',')} µA`;

export function Conductors({ onEvidence, initial = {} }: {
    onEvidence: Evidence;
    initial?: ActivityState;
}) {
    const [index, setIndex] = useState(0), [prediction, setPrediction] = useState<boolean | null>(null), [tested, setTested] = useState<string[]>(initial.tested as string[] ?? []), [classified, setClassified] = useState<Record<string, boolean>>(initial.classified as Record<string, boolean> ?? {}), [measured, setMeasured] = useState(false), [sensitive, setSensitive] = useState(false);
    const sample = SAMPLES[index], reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []), webgl = useMemo(hasWebGL, []);
    const sim = useMemo(() => startSimulation(testerCircuit(measured ? sample.resistance : null)), [measured, sample.id]);
    const current = Math.abs(reading(sim.solution, 'A').Iab), lit = bulbBrightness(reading(sim.solution, 'L1').Pabsorbed) > 0.05;
    const verdict = !measured ? null : lit ? { tone: 'ok', title: 'Đèn sáng', text: 'Dòng điện đủ lớn để thắp bóng: mẫu dẫn điện tốt.' }
        : current >= 1e-4 ? { tone: 'weak', title: 'Đèn tắt, nhưng ampe kế vẫn thấy dòng', text: 'Mẫu có dẫn điện, chỉ là dẫn yếu. Đèn tắt chưa đủ để kết luận vật không dẫn điện.' }
            : current >= 1e-6 ? (sensitive ? { tone: 'weak', title: 'Có dòng rất nhỏ', text: 'Chỉ đồng hồ đo nhạy mới thấy. Nước vẫn dẫn điện, nên không bao giờ dùng điện gần nước.' } : { tone: 'none', title: 'Kim gần như không nhúc nhích', text: 'Thử bật "Đo nhạy" để kiểm tra kỹ hơn.' })
                : { tone: 'none', title: 'Chưa phát hiện dòng điện', text: 'Kể cả khi đo nhạy. Mẫu này cách điện trong điều kiện thử pin.' };
    const pick = (i: number) => { setIndex(i); setPrediction(null); setMeasured(false); };
    const done = SAMPLES.filter(s => s.core && tested.includes(s.id) && classified[s.id] === (s.resistance !== null)).length;
    return <section className="ew-activity ew-tester">
        <div className="ew-section-intro"><div><span className="ew-eyebrow">Phòng vật liệu · 16 mẫu</span><h2>Bên trong có đường đi?</h2></div><strong>{done}/12 mẫu cơ bản</strong></div>
        <div className="ew-lab-layout">
            <nav className="ew-sample-list" aria-label="Chọn mẫu vật">{SAMPLES.map((s, i) => <button key={s.id} aria-pressed={i === index} onClick={() => pick(i)}><span>{tested.includes(s.id) ? '✓' : String(i + 1).padStart(2, '0')}</span>{s.name}{!s.core && <small>Mở rộng</small>}</button>)}</nav>
            <div className="ew-lab-main">
                <div className="ew-tester-stage">
                    {webgl ? <Suspense fallback={<div className="ew-tester-loading">Đang bày bàn thử…</div>}><ConductorBench sim={sim} sampleId={sample.id} clamped={measured} sensitive={sensitive} reduced={reduced} /></Suspense>
                        : <div className="ew-meter-stage"><div className="ew-clamp">Kẹp A</div><div className={`ew-sample-material material-${sample.id}`}><span>{sample.name}</span></div><div className="ew-clamp">Kẹp B</div></div>}
                    <div className={`ew-tester-meter ${measured && current > 1e-6 ? 'is-live' : ''}`} aria-live="polite">
                        <span>Ampe kế</span>
                        <b>{!measured ? '—' : current < 1e-6 ? '0' : current < 1e-4 && !sensitive ? '≈ 0' : formatCurrent(current)}</b>
                        <label><input type="checkbox" checked={sensitive} onChange={e => setSensitive(e.target.checked)} /> Đo nhạy</label>
                    </div>
                </div>
                <p className="ew-tester-note"><b>{sample.name}.</b> {sample.assumptions}</p>
                {!measured && <>
                    <div className="ew-options"><button aria-pressed={prediction === true} onClick={() => setPrediction(true)}>Em đoán: có dẫn điện</button><button aria-pressed={prediction === false} onClick={() => setPrediction(false)}>Em đoán: không dẫn điện</button></div>
                    <button className="ew-primary" disabled={prediction === null} onClick={() => { setMeasured(true); const next = [...new Set([...tested, sample.id])]; setTested(next); onEvidence({ tested: next, classified }); }}>Kẹp thử mẫu này</button>
                </>}
                {measured && verdict && <div className={`ew-lab-result is-${verdict.tone}`} aria-live="polite">
                    <strong>{verdict.title}</strong><p>{verdict.text}</p>
                    <p className="ew-lab-ask">Ghi kết luận của em:</p>
                    <div className="ew-options">{[true, false].map(value => <button key={String(value)} aria-pressed={classified[sample.id] === value} onClick={() => { const next = { ...classified, [sample.id]: value }; setClassified(next); onEvidence({ tested, classified: next }); }}>{value ? 'Mẫu có dẫn điện' : 'Chưa phát hiện dòng ở mẫu này'}</button>)}</div>
                    {classified[sample.id] !== undefined && <p>{classified[sample.id] === (sample.resistance !== null) ? 'Kết luận phù hợp phép đo.' : 'Nhìn lại ampe kế và thử bật đo nhạy nhé.'}</p>}
                    <div className="ew-options">{index < SAMPLES.length - 1 && <button onClick={() => pick(index + 1)}>Mẫu tiếp theo →</button>}<button onClick={() => { setMeasured(false); setPrediction(null); }}>Tháo kẹp</button></div>
                </div>}
                <small>Điện trở mẫu là giả định minh họa. Chỉ thử bằng nguồn pin thấp; không thử với điện nhà.</small>
            </div>
        </div>
    </section>;
}
function FruitCircuit(count: number, kind: 'lemon' | 'potato', load: 'led' | 'bulb'): Circuit { const c = emptyCircuit('fruit'); for (let i = 0; i < count; i++)
    c.parts.push(newPart(kind, `B${i}`, 2 + i * 3, 2)); c.parts.push(newPart(load, 'L', 7, 6)); let previous = 'L', port = postIds(c.parts.at(-1)!)[1]; for (let i = 0; i < count; i++) {
    c.wires.push(wire(`w${i}`, previous, port, `B${i}`, 'minus'));
    previous = `B${i}`;
    port = 'plus';
} c.wires.push(wire('return', previous, port, 'L', postIds(c.parts.at(-1)!)[0])); return c; }
export function MiniReadout({ circuit }: {
    circuit: Circuit;
}) { const solution = solve(circuit), loads = circuit.parts.filter(p => ['bulb', 'led', 'electromagnet'].includes(p.kind)); return <div className="ew-mini-readout"><svg viewBox="0 0 720 230" aria-label="Linh kiện và độ sáng theo kết quả bộ giải"><defs><filter id="lab-glow"><feGaussianBlur stdDeviation="10"/></filter></defs>{circuit.parts.slice(0, 5).map((p, i) => <g key={p.id} transform={`translate(${90 + i * 130} 105) scale(.65)`}><PartGlyph part={p} brightness={p.kind === 'led' ? Math.min(1, Math.max(0, reading(solution, p.id).Iab) / .02) : Math.min(1, Math.max(0, reading(solution, p.id).Pabsorbed) / .75)} scope="lab"/></g>)}</svg>{loads.map(p => { const r = reading(solution, p.id); return <div className="ew-measurements" key={p.id}><span><b>{r.Uab.toFixed(3)}</b> V</span><span><b>{(r.Iab * 1000).toFixed(3)}</b> mA</span><span><b>{(r.Pabsorbed * 1000).toFixed(3)}</b> mW</span></div>; })}</div>; }
export function FruitLab() { const [count, setCount] = useState(1), [fruit, setFruit] = useState<'lemon' | 'potato'>('lemon'), [load, setLoad] = useState<'led' | 'bulb'>('led'); const c = FruitCircuit(count, fruit, load), r = reading(solve(c), 'L'); return <section className="ew-activity"><span className="ew-eyebrow">Nguồn điện hóa · mô hình minh họa</span><h2>Một quả chanh có đủ?</h2><p>Điện cực đồng và kẽm tạo một nguồn điện nhỏ. Dung dịch bên trong dẫn điện bằng ion.</p><div className="ew-controls"><label>Mẫu trái cây<select value={fruit} onChange={e => setFruit(e.target.value as typeof fruit)}><option value="lemon">Chanh Cu/Zn · 0,95 V / 450 Ω</option><option value="potato">Khoai Cu/Zn · 0,85 V / 700 Ω</option></select></label><label>{count} nguồn nối tiếp<input type="range" min="1" max="4" value={count} onChange={e => setCount(+e.target.value)}/></label><label>Thử tải<select value={load} onChange={e => setLoad(e.target.value as typeof load)}><option value="led">LED đỏ</option><option value="bulb">Bóng sợi đốt</option></select></label></div><MiniReadout circuit={c}/><p className="ew-observation">{load === 'led' ? r.Iab >= .0005 ? 'LED đã đủ sáng trong mẫu này.' : r.Iab > 1e-7 ? 'Đã có dòng nhưng LED chưa sáng rõ.' : 'Chưa có dòng thuận đủ lớn.' : r.Pabsorbed / .75 < .005 ? 'Vẫn có dòng, nhưng bóng thường chưa sáng thấy được.' : 'Bóng đã nhận đủ công suất.'}</p><p className="ew-model-note">Thông số hiệu chuẩn của hai mẫu. Số quả để thắp LED ngoài đời còn tùy điện cực, khoảng cách và tình trạng trái cây.</p></section>; }
export function MagnetLab() { const [cells, setCells] = useState(1), [turns, setTurns] = useState(20), [iron, setIron] = useState(true), [closed, setClosed] = useState(true); const c = preset('switch'); c.parts[0].cells = Array.from({ length: cells }, () => ({ polarity: 1 as const, present: true, charge01: 1 })); c.parts[1].kind = 'electromagnet'; c.parts.find(p => p.id === 'K')!.closed = closed; const current = reading(solve(c), 'L1').Iab, strength = Math.abs(current) * turns * (iron ? 3 : 1), clips = Math.min(12, Math.floor(strength / 2)); return <section className="ew-activity"><span className="ew-eyebrow">Khám phá thêm KHTN 7</span><h2>Điện biến thành nam châm</h2><div className="ew-controls"><label>Số pin<select value={cells} onChange={e => setCells(+e.target.value)}>{[1, 2, 3].map(n => <option key={n}>{n}</option>)}</select></label><label>Số vòng dây<select value={turns} onChange={e => setTurns(+e.target.value)}>{[20, 40, 80].map(n => <option key={n}>{n}</option>)}</select></label><label>Lõi<select value={iron ? 'iron' : 'air'} onChange={e => setIron(e.target.value === 'iron')}><option value="iron">Sắt</option><option value="air">Không khí</option></select></label><button onClick={() => setClosed(!closed)}>{closed ? 'Ngắt điện' : 'Đóng mạch'}</button></div><div className="ew-magnet-stage"><svg viewBox="0 0 600 280"><rect x="140" y="80" width="320" height="70" rx="20" fill={iron ? '#8d9b90' : '#d9dfce'}/>{Array.from({ length: Math.round(turns / 4) }, (_, i) => <ellipse key={i} cx={155 + i * 280 / (turns / 4)} cy="115" rx="10" ry="49" stroke="#c58453" strokeWidth="7" fill="none"/>)}{Array.from({ length: 12 }, (_, i) => <path key={i} d="M0 0v25a8 8 0 0 0 16 0V5a4 4 0 0 0-8 0v20" transform={`translate(${80 + i * 38} ${i < clips ? 160 : 235}) rotate(${i % 2 ? 12 : -12})`} fill="none" stroke="#6b7e74" strokeWidth="4"/>)}</svg></div><output>{(current * 1000).toFixed(1)} mA · N × I = {(Math.abs(current) * turns).toFixed(2)} · {clips} kẹp minh họa</output><p>Tăng số vòng hoặc dòng điện làm chỉ báo lực hút tăng trong mô hình. Khi ngắt điện, kẹp rơi xuống.</p><small>Số kẹp là chỉ báo hiệu chuẩn, không phải phép tính lực từ chính xác. Lõi sắt làm tăng chỉ báo; không đổi điện trở cuộn trong mô hình này.</small></section>; }
export function StaticLab() { const [charge, setCharge] = useState(0), [distance, setDistance] = useState(1), [wet, setWet] = useState(false); useEffect(() => { const t = setInterval(() => { if (!document.hidden)
    setCharge(q => Math.max(0, q - (wet ? .8 : .12))); }, 100); return () => clearInterval(t); }, [wet]); const attraction = charge / (distance * distance + 1); return <section className="ew-activity"><span className="ew-eyebrow">Khám phá thêm KHTN 8 · điện tích tĩnh</span><h2>Không có pin, vẫn hút giấy?</h2><div className="ew-static-stage"><div className="ew-balloon" style={{ transform: `translateY(${-distance * 12}px)` }}>− − −<br />Bóng bay</div><div className="ew-paper-bits">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ transform: `translateY(${-Math.min(90, attraction * 5) * (i % 3 + 1) / 3}px) rotate(${i * 31}deg)` }}/>)}</div></div><div className="ew-controls"><button className="ew-primary" onClick={() => setCharge(q => Math.min(30, q + 6))}>Cọ bóng vào khăn khô</button><button onClick={() => setCharge(0)}>Nối đất · trung hòa</button><label>Khoảng cách<input type="range" min="1" max="5" step=".2" value={distance} onChange={e => setDistance(+e.target.value)}/></label><label><input type="checkbox" checked={wet} onChange={e => setWet(e.target.checked)}/> Không khí ẩm</label></div><p>{charge > 1 ? 'Bóng tích điện làm giấy phân cực và bị hút.' : 'Cọ bóng để tạo điện tích trong mô hình.'}</p><small>Mô hình định tính tách riêng khỏi bộ giải mạch DC. Điện tích giảm nhanh hơn khi ẩm; chuyển động giấy đã phóng đại.</small></section>; }
export function GeneratorLab() { const [speed, setSpeed] = useState(0), [load, setLoad] = useState<'bulb' | 'led'>('bulb'), last = useRef<{
    angle: number;
    time: number;
} | null>(null); const c = preset(); c.parts[0] = newPart('generator', 'B', 3, 4); c.parts[0].speed = speed; if (load === 'led') {
    c.parts[1] = newPart('led', 'L1', 10, 4);
    c.wires = [wire('w0', 'B', 'plus', 'L1', 'anode'), wire('w1', 'L1', 'cathode', 'B', 'minus')];
    c.parts.push({ ...newPart('resistor', 'R', 7, 6), resistance: 220 });
    c.wires[1] = wire('w1', 'L1', 'cathode', 'R', 'a');
    c.wires.push(wire('w2', 'R', 'b', 'B', 'minus'));
} const stop = () => { setSpeed(0); last.current = null; }; useEffect(() => { window.addEventListener('blur', stop); return () => window.removeEventListener('blur', stop); }, []); return <section className="ew-activity"><span className="ew-eyebrow">Cơ năng → điện năng</span><h2>Tự tay tạo ra ánh sáng</h2><div className="ew-generator-knob" tabIndex={0} role="slider" aria-label="Tay quay máy phát; dùng thanh tốc độ bên dưới để điều khiển bằng bàn phím" aria-valuenow={speed} aria-valuemin={-2} aria-valuemax={2} onKeyDown={e => { if (e.key === 'ArrowRight')
    setSpeed(v => Math.min(2, v + .1)); if (e.key === 'ArrowLeft')
    setSpeed(v => Math.max(-2, v - .1)); if (e.key === 'Escape')
    stop(); }} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); const r = e.currentTarget.getBoundingClientRect(); last.current = { angle: Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2), time: performance.now() }; }} onPointerMove={e => { if (!last.current)
    return; const r = e.currentTarget.getBoundingClientRect(), angle = Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2), now = performance.now(), dt = (now - last.current.time) / 1000; if (dt < .05)
    return; let delta = angle - last.current.angle; if (delta > Math.PI)
    delta -= 2 * Math.PI; if (delta < -Math.PI)
    delta += 2 * Math.PI; setSpeed(v => Math.max(-2, Math.min(2, v + (delta / (2 * Math.PI * dt) - v) * (1 - Math.exp(-dt / .1))))); last.current = { angle, time: now }; }} onPointerUp={stop} onPointerCancel={stop} onBlur={stop}><span style={{ transform: `rotate(${speed * 80}deg)` }}>╱</span><b>Quay quanh tâm</b></div><div className="ew-controls"><label>Tốc độ có dấu: {speed.toFixed(2)} vòng/s<input type="range" min="-2" max="2" step=".05" value={speed} onChange={e => setSpeed(+e.target.value)}/></label><button onClick={stop}>Dừng quay</button><select aria-label="Tải của máy phát" value={load} onChange={e => setLoad(e.target.value as typeof load)}><option value="bulb">Bóng sợi đốt</option><option value="led">LED + điện trở 220 Ω</option></select></div><MiniReadout circuit={c}/><p>Quay ngược làm đổi cực nguồn. Bóng sợi đốt vẫn có thể sáng; LED chỉ dẫn thuận.</p><small>Máy phát DC tương đương, tối đa ±6 V. Tốc độ và hiệu ứng minh họa, chưa mô phỏng lực cản tay quay.</small></section>; }
export function House({ onEvidence, initial = {} }: {
    onEvidence: Evidence;
    initial?: ActivityState;
}) { const [off, setOff] = useState<string[]>(initial.off as string[] ?? []), [ledCount, setLedCount] = useState(Number(initial.ledCount ?? 0)), [reason, setReason] = useState(initial.houseReason === true), [rate, setRate] = useState<number | null>(null), [seconds, setSeconds] = useState(0), [running, setRunning] = useState(false), [energy, setEnergy] = useState(0), state = useRef({ seconds, off }); state.current = { seconds, off }; useEffect(() => { if (!running)
    return; let last = performance.now(); const t = setInterval(() => { const now = performance.now(), dt = (now - last) / 1000; last = now; if (document.hidden || dt > .5)
    return; const from = state.current.seconds, to = Math.min(3600, from + dt * 600); state.current.seconds = to; setSeconds(to); setEnergy(v => v + earthHourEnergy(from, to, state.current.off)); if (to === 3600)
    setRunning(false); }, 100); return () => clearInterval(t); }, [running]); const emit = (o = off, l = ledCount, r = reason) => onEvidence({ off: o, ledCount: l, houseReason: r }); return <section className="ew-activity"><span className="ew-eyebrow">Một căn nhà giả lập · công suất minh họa</span><h2>Nhà vẫn sáng, công tơ chậm hơn</h2><div className="ew-house-layout"><HouseView off={off} ledCount={ledCount} onToggle={id => { const next = off.includes(id) ? off.filter(v => v !== id) : [...off, id]; setOff(next); emit(next); }}/><aside className="ew-house-meter"><h3>Thử một giờ tiết kiệm</h3><p>Tắt TV, quạt phòng trống và bốn đèn thừa. Giữ đèn học và nguồn tủ lạnh. Các thiết bị khác ngoài lịch đo một giờ này.</p><output>{energy.toFixed(5)} <small>kWh</small></output><p>{Math.floor(seconds / 60)} / 60 phút · 1 giây = 10 phút</p><div className="ew-options"><button onClick={() => setRunning(v => !v)}>{running ? 'Tạm dừng' : 'Chạy công tơ'}</button><button onClick={() => { setRunning(false); setSeconds(0); setEnergy(0); state.current.seconds = 0; }}>Đo lại từ đầu</button></div><p>Cùng lịch 1 giờ: trước {earthHourEnergy(0, 3600).toFixed(4)} kWh; lựa chọn hiện tại {earthHourEnergy(0, 3600, off).toFixed(4)} kWh.</p>{(off.includes('fridge') || off.includes('lamp0')) && <p className="ew-warning">Đèn học và tủ lạnh đang cần dùng. Giữ nguồn cho hai thiết bị này nhé.</p>}<hr /><h3>Cùng ánh sáng, khác công suất</h3><small>Phép so sánh dưới đây dùng lịch trọn ngày và độc lập với lượt đo một giờ phía trên.</small><label>Đã thay {ledCount}/5 bóng 60 W bằng LED 9 W<input type="range" min="0" max="5" value={ledCount} onChange={e => { setLedCount(+e.target.value); emit(off, +e.target.value); }}/></label><p>Một ngày cùng lịch: <b>{dailyEnergy(ledCount).toFixed(4)} kWh</b><br />Giảm {(dailyEnergy() - dailyEnergy(ledCount)).toFixed(3)} kWh/ngày.</p><label><input type="checkbox" checked={reason} onChange={e => { setReason(e.target.checked); emit(off, ledCount, e.target.checked); }}/> So sánh cùng thời gian và đủ ánh sáng.</label><label><input type="checkbox" checked={rate !== null} onChange={e => setRate(e.target.checked ? 2000 : null)}/> Thử bài toán tiền điện</label>{rate !== null && <><input aria-label="Đơn giá giả định đồng trên kWh" type="number" min="0" value={rate} onChange={e => setRate(Math.max(0, +e.target.value))}/><p>{(energy * rate).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ · Đơn giá giả định để học, không phải biểu giá/hóa đơn.</p></>}</aside></div></section>; }
export function PowerJourney({ onEvidence, initial = {} }: {
    onEvidence: Evidence;
    initial?: ActivityState;
}) { const [sequence, setSequence] = useState<string[]>(String(initial.sequence ?? '').split(',').filter(Boolean)), [matches, setMatches] = useState<Record<string, string>>(initial.matches as Record<string, string> ?? {}), [night, setNight] = useState(initial.night === true), [backup, setBackup] = useState(String(initial.backup ?? '')); const order = ['source', 'transmission', 'distribution', 'house'], names: Record<string, string> = { source: 'Nguồn phát', transmission: 'Truyền tải', distribution: 'Phân phối', house: 'Ngôi nhà' }, sources = [['hydro', 'Nước', 'Nước → tuabin → máy phát'], ['wind', 'Gió', 'Gió → tuabin → máy phát'], ['thermal', 'Nhiên liệu', 'Nhiệt → tuabin → máy phát'], ['solar', 'Ánh sáng', 'Ánh sáng → tấm pin → điện']]; const emit = (seq = sequence, m = matches, n = night, b = backup) => onEvidence({ sequence: seq.join(','), matches: m, matched: sources.filter(([id]) => m[id] === id).length, night: n, backup: b }); return <section className="ew-activity"><span className="ew-eyebrow">Từ nơi tạo điện đến ngôi nhà</span><h2>Một hành trình rất dài</h2><p>Chọn các chặng theo thứ tự điện đi từ nguồn đến nhà.</p><div className="ew-journey-options">{['house', 'distribution', 'source', 'transmission'].map(id => <button key={id} disabled={sequence.includes(id)} onClick={() => { const next = [...sequence, id]; setSequence(next); emit(next); }}>{names[id]}</button>)}<button onClick={() => { setSequence([]); emit([]); }}>Xếp lại</button></div><div className="ew-journey-line">{sequence.map(id => <React.Fragment key={id}><span>{names[id]}</span><b>→</b></React.Fragment>)}</div>{sequence.length === 4 && <p>{sequence.join() === order.join() ? 'Đường đi đã đúng.' : 'Thử bắt đầu từ nơi tạo điện nhé.'}</p>}<div className="ew-source-grid">{sources.map(([id, label, explanation]) => <article key={id}><h3>{label}</h3><select aria-label={`Cách tạo điện từ ${label}`} value={matches[id] ?? ''} onChange={e => { const next = { ...matches, [id]: e.target.value }; setMatches(next); emit(sequence, next); }}><option value="">Chọn quá trình</option>{sources.map(([v, , text]) => <option value={v} key={v}>{text}</option>)}</select>{matches[id] === id && <small>{explanation}</small>}</article>)}</div><div className="ew-day-model"><button onClick={() => { setNight(!night); emit(sequence, matches, !night); }}>{night ? 'Đang ban đêm · chuyển sang ngày' : 'Đang ban ngày · thử ban đêm'}</button><p>Nhu cầu minh họa: 100 đơn vị. Mặt trời cung cấp {night ? 0 : 100} đơn vị.</p>{night && <label>Chọn nguồn hoặc kho điện bù thiếu<select value={backup} onChange={e => { setBackup(e.target.value); emit(sequence, matches, night, e.target.value); }}><option value="">Chọn phương án</option><option value="storage">Bộ lưu trữ đã nạp</option><option value="hydro">Thủy điện có nước</option><option value="wind">Gió đang thổi</option><option value="thermal">Nhiệt điện đang hoạt động</option><option value="solar">Chỉ tấm pin mặt trời lúc đêm</option></select></label>}</div><small>Đây là mô hình cung–cầu minh họa. Tái tạo không đồng nghĩa hoàn toàn không tác động môi trường. Tấm pin quang điện không cần tuabin.</small></section>; }
export function Activity({ spec, onEvidence, initial }: {
    spec: ContentSpec;
    onEvidence: Evidence;
    initial?: ActivityState;
}) { switch (spec.activity) {
    case 'sorting': return <Sorting onEvidence={onEvidence} initial={initial}/>;
    case 'safety': return <SafetyRoom onEvidence={onEvidence} initial={initial}/>;
    case 'conductors': return <Conductors onEvidence={onEvidence} initial={initial}/>;
    case 'house': return <House onEvidence={onEvidence} initial={initial}/>;
    case 'journey': return <PowerJourney onEvidence={onEvidence} initial={initial}/>;
    default: return null;
} }
