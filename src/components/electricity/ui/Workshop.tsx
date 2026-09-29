import { CircuitThumbnail } from './CircuitThumbnail';
import { VirtualCandle } from './VirtualCandle';
import React, { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContentSpec } from '../../../data/electricity/content';
import { useStudentActions } from '../../../contexts/StudentContext';
import { Circuit, cloneCircuit, key, newPart, Part, PartKind, postIds, postLabel, PostRef, ref } from '../engine/circuit';
import { PARTS } from '../engine/parts';
import { analyze } from '../engine/analysis';
import { preset, wire } from '../engine/fixtures';
import { freeSpot } from '../engine/route';
import { reading } from '../engine/solver';
import { applyCircuit, FixedClock, Simulation, startSimulation, tick } from '../engine/simulation';
import { createRun, earnedTier, Run, sampleEvidence } from '../engine/evidence';
import { command, Command, emptyHistory, History, record, travel } from '../controller/commands';
import { CircuitDocument, createDocument, downloadDocument, listDocuments, saveDocument, cacheThumbnail } from '../progress/notebook';
import { BenchProps } from './benchTypes';
import { FlatBench, PartGlyph } from '../flat/FlatBench';
import { Activity } from './Activities';
import { Inside } from './Inside';
import { Compare } from './Compare';
import { legacyPreset } from '../legacy/adapter';
const BenchCanvas = lazy(() => import('../bench/BenchCanvas'));
class RendererBoundary extends Component<{
    children: React.ReactNode;
    fallback: React.ReactNode;
    onError: () => void;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch() { this.props.onError(); }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function webglAvailable() { try {
    const canvas = document.createElement('canvas'), gl = canvas.getContext('webgl2');
    if (!gl)
        return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
}
catch {
    return false;
} }
const uid = (prefix: string) => `${prefix}${crypto.randomUUID().slice(0, 8)}`;
export function Workshop({ owner, grade, spec, initialDocument, onBack, practice = false }: {
    owner: string;
    grade: number;
    spec?: ContentSpec;
    initialDocument?: CircuitDocument;
    onBack: () => void;
    practice?: boolean;
}) {
    const { completeElectricity } = useStudentActions();
    const initial = useMemo(() => { const c = initialDocument ? cloneCircuit(initialDocument.circuit) : (spec?.initialCircuitId.startsWith('legacy-') ? legacyPreset(spec.initialCircuitId) : preset(spec?.initialCircuitId ?? 'intro')); if (spec?.build)
        c.wires = []; return c; }, []);
    const initialSimulation = useMemo(() => startSimulation(initial), []), initialRun = useMemo(() => spec ? createRun(owner, spec, initial) : null, []);
    const simRef = useRef(initialSimulation), history = useRef<History>(emptyHistory()), runRef = useRef<Run | null>(initialRun);
    const [sim, setSim] = useState(simRef.current), [run, setRun] = useState(runRef.current), [selected, setSelected] = useState<string | null>(null), [preview, setPreview] = useState<BenchProps['preview']>(null), [mode, setMode] = useState<'bench' | 'schematic'>(initialDocument?.view.mode ?? 'bench'), [renderer, setRenderer] = useState<'3d' | 'svg'>(() => new URLSearchParams(location.search).get('renderer') === 'svg' || !webglAvailable() ? 'svg' : '3d'), [night, setNight] = useState(initialDocument?.view.night ?? spec?.id === 'L03-firstLight'), [numbers, setNumbers] = useState(grade >= 5), [flow, setFlow] = useState<BenchProps['flow']>('electron'), [portrait, setPortrait] = useState(false), [fitKey, setFitKey] = useState(0), [message, setMessage] = useState('Chọn cọc đầu, rồi chọn cọc còn lại để nối dây.'), [toolbox, setToolbox] = useState(false), [inside, setInside] = useState<string | null>(null), [compare, setCompare] = useState(false), [hint, setHint] = useState(0), [muted, setMuted] = useState(false), [saved, setSaved] = useState(false), [saveTitle, setSaveTitle] = useState(initialDocument?.title ?? 'Sáng chế của mình'), [saving, setSaving] = useState(false), [pending, setPending] = useState(false), [clearConfirm, setClearConfirm] = useState(false), [advanced, setAdvanced] = useState(grade > 2), [reference, setReference] = useState(false);
    const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []), alive = useRef(true), paused = useRef(false), stage = useRef<HTMLDivElement>(null), audio = useRef<AudioContext | null>(null), lastStrike = useRef(0), saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null), draftRevision = useRef(0), persistedTier = useRef(0), busyReward = useRef(false), saveQueue = useRef(Promise.resolve());
    const viewRef = useRef(mode), documentRef = useRef(initialDocument);
    const tone=useRef<{osc:OscillatorNode;gain:GainNode}|null>(null);
    viewRef.current = mode;
    paused.current = compare || clearConfirm || reference;
    const publish = () => { setSim(simRef.current); setRun(runRef.current ? { ...runRef.current } : null); };
    const draft = useCallback(() => { const c = cloneCircuit(simRef.current.circuit), doc = createDocument(owner, c, 'Mạch đang làm', mode, night); doc.id = `${owner}:${spec?.id ?? 'sandbox'}`; doc.revision = ++draftRevision.current; if (runRef.current)
        doc.run = structuredClone(runRef.current); saveQueue.current = saveQueue.current.then(() => saveDocument(doc, true)).then(() => { }).catch(() => { if (alive.current)
        setMessage('Nháp chưa lưu được. Có thể tải mạch JSON để giữ bản này.'); }); }, [owner, spec?.id, mode, night]);
    const draftRef = useRef(draft);
    draftRef.current = draft;
    const scheduleDraft = () => { if (saveTimer.current)
        clearTimeout(saveTimer.current); saveTimer.current = setTimeout(draft, 600); };
    const sound = (frequency = 700) => { if (muted)
        return; try {
        const ctx = audio.current ?? new AudioContext();
        audio.current = ctx;
        void ctx.resume();
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .09);
        osc.start();
        osc.stop(ctx.currentTime + .1);
    }
    catch { /* Text and visual feedback remain available. */ } };
    const dispatch = (action: Command, remember = true) => { const before = simRef.current, result = command(before, action); if (result.ok === false) {
        setMessage(result.message);
        return;
    } if (remember)
        history.current = record(history.current, before); simRef.current = result.sim; setSaved(false); setPreview(null); publish(); scheduleDraft(); if (action.type === 'wire' || action.type === 'patch')
        sound(); };
    const patch = (id: string, patch: Partial<Part>, electrical = true) => dispatch({ type: 'patch', id, patch, electrical });
    const hold = (id: string, closed: boolean) => { const p = simRef.current.circuit.parts.find(p => p.id === id); if (p && p.closed !== closed)
        dispatch({ type: 'patch', id, patch: { closed } }, false); };
    const releaseButtons = () => { let c = cloneCircuit(simRef.current.circuit), changed = false; for (const p of c.parts)
        if (p.kind === 'button' && p.closed) {
            p.closed = false;
            changed = true;
        } if (changed) {
        simRef.current = applyCircuit(simRef.current, c);
        publish();
    } setPreview(null); };
    const toggle = (id: string) => { const p = simRef.current.circuit.parts.find(p => p.id === id); if (!p)
        return; if (p.kind === 'switch')
        patch(id, p.actuator === 'doorContact' ? { doorClosed: !p.doorClosed } : { closed: !p.closed }); if (p.kind === 'spdt')
        patch(id, { position: p.position ? 0 : 1 }); };
    const connect = (a: PostRef, b: PostRef) => { if (runRef.current)
        runRef.current.contacts = [...new Set([...runRef.current.contacts, key(a), key(b)])]; dispatch({ type: 'wire', wire: { id: uid('w'), a, b } }); };
    const selectPost = (post: PostRef) => { if (preview?.from) {
        if (key(preview.from) !== key(post))
            connect(preview.from, post);
        setPreview(null);
    }
    else {
        setPreview({ from: post });
        setMessage('Đã chọn cọc đầu. Chọn cọc còn lại.');
    } if (runRef.current) {
        runRef.current.contacts = [...new Set([...runRef.current.contacts, key(post)])];
        publish();
    } };
    const inspect = (id: string) => { if (runRef.current) {
        runRef.current.observed = [...new Set([...runRef.current.observed, id])];
        publish();
    } setInside(id); setPreview(null); releaseButtons(); };
    const add = (kind: PartKind) => { if (spec?.kind === 'fault' && !['ammeter', 'voltmeter'].includes(kind)) {
        setMessage('Giữ các linh kiện của vụ việc; sửa đúng món đang có nhé.');
        return;
    } const c = simRef.current.circuit, prefix = kind === 'bulb' || kind === 'led' || kind === 'motor' || kind === 'bell' ? 'L' : kind === 'switch' || kind === 'button' ? 'K' : kind === 'battery' ? 'B' : 'P'; let id = prefix === 'L' ? 'L1' : prefix; let n = 1; while (c.parts.some(p => p.id === id)) {
        id = `${prefix}${n++}`;
    } const p = newPart(kind, id, 7, 4), placed = freeSpot(c, p); if (!placed) {
        setMessage('Bàn đã kín. Dọn một khoảng trống nhé.');
        return;
    } dispatch({ type: 'add', part: placed }); setSelected(id); setToolbox(false); };
    useEffect(() => { alive.current = true; const clock = new FixedClock(); let frame = 0, lastPublish = 0; const loop = (now: number) => { if (!document.hidden && !paused.current) {
        clock.advance(now, () => { simRef.current = tick(simRef.current); if (spec && runRef.current) {
            runRef.current.view = viewRef.current;
            runRef.current = sampleEvidence(spec, runRef.current, simRef.current, .02);
        } });
        if (now - lastPublish >= 100) {
            publish();
            lastPublish = now;
        }
    }
    else
        clock.reset(); frame = requestAnimationFrame(loop); }; frame = requestAnimationFrame(loop); const pause = () => { if (document.hidden) {
        releaseButtons();
        window.speechSynthesis?.cancel();
        void audio.current?.suspend();
        clock.reset();
    } }; document.addEventListener('visibilitychange', pause); window.addEventListener('blur', releaseButtons); return () => { alive.current = false; cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', pause); window.removeEventListener('blur', releaseButtons); if (saveTimer.current)
        clearTimeout(saveTimer.current); draftRef.current(); window.speechSynthesis?.cancel(); void audio.current?.close().catch(() => { }); }; }, []);
    useEffect(() => { window.scrollTo({ top: 0 }); }, []);
    useEffect(() => { const el = stage.current; if (!el)
        return; const observer = new ResizeObserver(entries => { const r = entries[0].contentRect; setPortrait(window.innerHeight > window.innerWidth && r.width < 760); setPreview(null); }); observer.observe(el); return () => observer.disconnect(); }, [inside, compare]);
    useEffect(() => { if (!initialDocument) {
        let active = true;
        void listDocuments(owner, 'drafts').then(docs => { const doc = docs.find(d => d.id === `${owner}:${spec?.id ?? 'sandbox'}`); if (active && doc && !doc.run?.done && history.current.past.length === 0) {
            simRef.current = startSimulation(doc.circuit);
            if (spec && doc.run?.ownerId === owner && doc.run.contentId === spec.id && Number.isInteger(doc.run.step) && doc.run.step >= 0 && doc.run.step <= spec.steps.length) {
                runRef.current = { ...doc.run, stable: 0, windowEdit: -1 };
            }
            setMode(doc.view.mode);
            setNight(doc.view.night);
            publish();
            setMessage('Đã mở nháp đang làm của hồ sơ này.');
        } }).catch(() => { });
        return () => { active = false; };
    } }, []);
    const speak = () => { if (muted || !('speechSynthesis' in window))
        return; window.speechSynthesis.cancel(); const text = run?.done ? spec?.takeaway : spec?.steps[run?.step ?? 0]?.text ?? 'Chọn một linh kiện, rồi nối hai cọc bằng dây.'; const voice = new SpeechSynthesisUtterance(text); voice.lang = 'vi-VN'; voice.rate = .88; window.speechSynthesis.speak(voice); };
    useEffect(() => { if (grade <= 2 && spec && !muted)
        speak(); }, [run?.step, muted]);
    useEffect(() => { const event = sim.runtime.strikes.at(-1); if (event && event.time > lastStrike.current) {
        lastStrike.current = event.time;
        sound(950);
    } }, [sim.runtime.strikes.at(-1)?.time]);
    useEffect(()=>{
        const ctx=audio.current;if(!ctx||ctx.state==='closed')return;
        const buzzer=sim.circuit.parts.some(p=>p.kind==='buzzer'&&Math.abs(reading(sim.solution,p.id).Iab)>=.004);
        const motor=sim.circuit.parts.filter(p=>p.kind==='motor').reduce((max,p)=>Math.max(max,Math.abs(sim.runtime.visual[p.id]?.motorRps??0)),0);
        const active=!muted&&!paused.current&&!document.hidden&&(buzzer||motor>.1);
        if(active&&!tone.current){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';gain.gain.value=0;osc.connect(gain);gain.connect(ctx.destination);osc.start();tone.current={osc,gain};}
        if(tone.current){tone.current.osc.frequency.setTargetAtTime(buzzer?660:70+motor*8,ctx.currentTime,.05);tone.current.gain.gain.setTargetAtTime(active?.008:0,ctx.currentTime,.04);if(active)void ctx.resume();}
    },[sim,muted,compare,clearConfirm]);
    const persist = async () => { if (!spec || !runRef.current || practice || owner === 'guest' || busyReward.current)
        return; const tier = earnedTier(spec, runRef.current); if (tier <= persistedTier.current)
        return; busyReward.current = true; const result = await completeElectricity(owner, structuredClone(runRef.current)); busyReward.current = false; if (!alive.current)
        return; if (result.ok) {
        persistedTier.current = tier;
        setPending(false);
        setMessage(result.earned ? `Đã lưu khám phá · +${result.earned} sao.` : 'Khám phá đã có trong hồ sơ.');
    }
    else {
        setPending(true);
        setMessage(result.message ?? 'Chưa lưu được. Thử lại nhé.');
    } };
    useEffect(() => { void persist(); }, [run?.step]);
    const leave = () => { releaseButtons(); draft(); window.speechSynthesis?.cancel(); onBack(); };
    const undo = (redo = false) => { releaseButtons(); const next = travel(history.current, simRef.current, redo); if (next) {
        history.current = next.history;
        simRef.current = next.sim;
        publish();
        scheduleDraft();
    } };
    const rotate = () => { const p = simRef.current.circuit.parts.find(p => p.id === selected); if (p)
        patch(p.id, { rot: (p.rot + 90) % 360 }, false); };
    const remove = () => { if (!selected)
        return; if (spec?.kind === 'fault' && simRef.current.circuit.parts.some(p => p.id === selected && !['ammeter', 'voltmeter'].includes(p.kind))) {
        setMessage('Hãy sửa hoặc thay mới linh kiện trong vụ việc.');
        return;
    } dispatch({ type: 'remove', id: selected }); setSelected(null); };
    const keydown = (e: React.KeyboardEvent) => { if ((e.target as HTMLElement).closest('input,textarea,select'))
        return; if (e.key === 'Escape') {
        setPreview(null);
        setInside(null);
        setCompare(false);
        setClearConfirm(false);
        setReference(false);
    } const p = simRef.current.circuit.parts.find(p => p.id === selected); if (!p)
        return; if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        rotate();
    } if (e.key === 'Delete') {
        e.preventDefault();
        remove();
    } const delta: Record<string, [
        number,
        number
    ]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; if (delta[e.key] && (e.target as HTMLElement).dataset.partControl) {
        e.preventDefault();
        patch(p.id, { x: p.x + delta[e.key][0], z: p.z + delta[e.key][1] }, false);
    } };
    const save = async () => { setSaving(true); try {
        const doc = createDocument(owner, simRef.current.circuit, saveTitle, mode, night);
        if (documentRef.current) {
            doc.id = documentRef.current.id;
            doc.createdAt = documentRef.current.createdAt;
            doc.revision = documentRef.current.revision + 1;
        }
        documentRef.current = await saveDocument(doc);
        const savedDocument=documentRef.current;
        void import('../progress/thumbnail').then(({makeThumbnail})=>makeThumbnail(savedDocument)).then(blob => cacheThumbnail(savedDocument, blob)).catch(() => { });
        if (alive.current) {
            setSaved(true);
            setMessage('Đã lưu vào Sổ sáng chế.');
        }
    }
    catch (e) {
        setMessage((e as Error).message);
    }
    finally {
        setSaving(false);
    } };
    const props: BenchProps = { sim, selected, schematic: mode === 'schematic', night, portrait, reduced, flow, preview, onPreview: value => { setPreview(value); if (value?.from && runRef.current)
            runRef.current.contacts = [...new Set([...runRef.current.contacts, key(value.from)])]; }, onSelect: id => { setSelected(id); setToolbox(false); }, onConnect: connect, onMove: (id, p) => patch(id, { x: Math.round(p[0]), z: Math.round(p[1]) }, false), onToggle: toggle, onHold: hold, onContextLost: () => { releaseButtons(); setRenderer('svg'); setMessage('Đã chuyển sang bàn SVG; mạch và tiến độ vẫn giữ nguyên.'); }, fitKey };
    const analysis = useMemo(() => analyze(sim.circuit, sim.solution, sim.runtime.strikes, sim.runtime.time), [sim]), part = sim.circuit.parts.find(p => p.id === selected), selectedWire = sim.circuit.wires.find(w => w.id === selected), step = spec?.steps[run?.step ?? 0];
    const changeKind = (kind: PartKind) => { if (!part)
        return; const c = cloneCircuit(simRef.current.circuit), p = c.parts.find(p => p.id === part.id)!, old = postIds(p); Object.assign(p, newPart(kind, p.id, p.x, p.z)); p.kind = kind; const posts = postIds(p); c.wires = c.wires.map(w => ({ ...w, a: w.a.partId === p.id ? ref(p.id, posts[Math.max(0, old.indexOf(w.a.postId)) % posts.length]) : w.a, b: w.b.partId === p.id ? ref(p.id, posts[Math.max(0, old.indexOf(w.b.postId)) % posts.length]) : w.b })); dispatch({ type: 'replace', circuit: c }); };
    const reverseLed = () => { if (!part)
        return; const c = cloneCircuit(simRef.current.circuit); c.wires = c.wires.map(w => ({ ...w, a: w.a.partId === part.id ? ref(part.id, w.a.postId === 'anode' ? 'cathode' : 'anode') : w.a, b: w.b.partId === part.id ? ref(part.id, w.b.postId === 'anode' ? 'cathode' : 'anode') : w.b })); dispatch({ type: 'replace', circuit: c }); };
    useEffect(() => { if (sim.solution.ok || !('deferred' in sim.solution) || !sim.solution.deferred)
        return; const worker = new Worker(new URL('../engine/solver.worker.ts', import.meta.url), { type: 'module' }), revision = sim.runtime.solveRevision; worker.onmessage = event => { if (!alive.current || simRef.current.runtime.solveRevision !== revision)
        return; simRef.current = { ...simRef.current, solution: event.data }; publish(); worker.terminate(); }; worker.onerror = () => { setMessage('Chưa giải được mạch này. Hãy hoàn tác hoặc giảm linh kiện.'); worker.terminate(); }; worker.postMessage({ circuit: sim.circuit, runtime: sim.runtime }); return () => worker.terminate(); }, [sim.solution]);
    const renderBench = () => renderer === 'svg' ? <FlatBench {...props}/> : <RendererBoundary onError={props.onContextLost!} fallback={<FlatBench {...props}/>}><Suspense fallback={<div className="ew-loading"><span>Đang bày bàn ánh sáng…</span><button onClick={() => setRenderer('svg')}>Dùng bàn SVG</button></div>}><BenchCanvas {...props}/></Suspense></RendererBoundary>;
    return <div className={`ew-workshop ${night ? 'ew-night' : ''} ${selected ? 'is-inspecting' : ''}`} onKeyDown={keydown}>
  <header className="ew-workshop-header"><button onClick={leave}>← Xưởng</button><div><span className="ew-eyebrow">{practice ? 'Luyện thêm · không phát sao' : spec ? spec.kind === 'fault' ? 'Thám tử mạch điện' : spec.kind === 'mission' ? 'Sổ nhiệm vụ' : 'Hành trình khám phá' : 'Bàn tự do'}</span><h1>{spec?.title ?? 'Sáng chế của mình'}</h1></div><div className="ew-header-actions"><button onClick={() => { setMuted(!muted); window.speechSynthesis?.cancel(); }} aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}>{muted ? 'Âm thanh tắt' : 'Có âm thanh'}</button><button onClick={() => setNight(!night)}>{night ? 'Bật đèn phòng' : 'Thử trong tối'}</button></div></header>
  {spec && <section className="ew-taskbar"><span className="ew-step-number">{run?.done ? '✓' : `${(run?.step ?? 0) + 1}/${spec.steps.length}`}</span><div><p>{run?.done ? spec.takeaway : step?.text}</p>{!run?.done && hint > 0 && <small>{spec.hintRules[Math.min(2, hint - 1)]}</small>}</div><button onClick={speak}>Nghe lại</button><button onClick={() => setHint(v => Math.min(3, v + 1))}>Gợi ý</button>{hint === 3 && !spec.activity && <button onClick={() => setReference(true)}>Mạch gợi ý</button>}<button onClick={() => { releaseButtons(); simRef.current = startSimulation(initial); history.current = emptyHistory(); runRef.current = createRun(owner, spec, initial); persistedTier.current = 0; setHint(0); publish(); scheduleDraft(); }}>Làm lại bài</button>{pending && <button onClick={() => void persist()}>Thử lưu lại</button>}</section>}
  {step?.choice && !run?.done && <div className="ew-choice-bar">{step.choice.options.map((text, i) => <button aria-pressed={run?.choices[step.id] === i} key={text} onClick={() => { if (runRef.current) {
        runRef.current.choices[step.id] = i;
        publish();
    } }}>{text}</button>)}</div>}
  {run?.done && <div className="ew-complete" role="status"><strong>Đã khám phá xong {spec?.title.toLowerCase()}.</strong><span>{practice ? 'Luyện tập đã hoàn thành.' : owner === 'guest' ? 'Khám phá của khách được giữ trong phiên này.' : pending ? 'Kết quả đang chờ lưu.' : 'Kết quả đã được ghi nhận theo hồ sơ.'}</span><button onClick={leave}>Tiếp tục khám phá →</button></div>}
  {spec?.activity ? <Activity key={run?.id} spec={spec} initial={run?.activity} onEvidence={state => { if (runRef.current)
            runRef.current.activity = { ...runRef.current.activity, ...state }; scheduleDraft(); }}/> : inside ? <Inside sim={sim} selected={inside} onClose={() => setInside(null)} onToggle={toggle} reduced={reduced} onObserve={id => { if (runRef.current)
            runRef.current.observed = [...new Set([...runRef.current.observed, id])]; }}/> : compare ? <Compare onClose={() => setCompare(false)}/> : <>
   <div className="ew-editor-layout"><aside className={`ew-toolbox ${toolbox ? 'is-open' : ''}`}><header><h2>Đồ nghề</h2><button onClick={() => setToolbox(false)}>Thu gọn</button></header><div>{(spec?.allowedParts ?? Object.keys(PARTS) as PartKind[]).filter(k => k !== 'sample' && (advanced || ['battery', 'bulb', 'switch', 'button', 'bell', 'buzzer', 'motor', 'led', 'resistor', 'junction'].includes(k))).map(kind => <button key={kind} onClick={() => add(kind)} title={`Đặt ${PARTS[kind].name} lên bàn`}><svg viewBox="-110 -65 220 150" aria-hidden="true"><PartGlyph part={newPart(kind, 'icon', 0, 0)}/></svg><span>{PARTS[kind].name}</span></button>)}</div><button onClick={() => setAdvanced(v => !v)}>{advanced ? 'Bộ đồ nghề gọn' : 'Mở đồ nghề khám phá thêm'}</button><button onClick={() => { add('led'); add('resistor'); }}>LED + bảo vệ 100 Ω</button></aside>
   <section className="ew-bench-area"><div className="ew-bench-topline"><span className={analysis.healthy ? '' : 'ew-warning'}>{!sim.solution.ok ? ('deferred' in sim.solution && sim.solution.deferred ? 'Đang kiểm tra mạch…' : 'Mạch chưa tính được — thử hoàn tác') : analysis.shortPaths.length ? 'Có đường nối tắt · kiểm dây bỏ qua tải' : analysis.overload.length ? 'Quá tải · giảm nguồn hoặc thêm bảo vệ' : analysis.poweredLoadIds.length ? 'Năng lượng đang tới tải' : 'Cùng tìm một đường đi khép kín'}</span><button onClick={() => { setFitKey(v => v + 1); setPreview(null); }}>Vừa bàn</button></div><div className="ew-stage" ref={stage}>{renderBench()}</div><nav className="ew-viewbar"><div className="ew-segment"><button aria-pressed={mode === 'bench'} onClick={() => { releaseButtons(); setMode('bench'); }}>Đồ thật</button><button aria-pressed={mode === 'schematic'} onClick={() => { releaseButtons(); setMode('schematic'); }}>Sơ đồ</button></div><button onClick={() => { releaseButtons(); setCompare(true); }}>Đặt cạnh nhau</button><button onClick={() => setRenderer(renderer === '3d' ? 'svg' : '3d')}>{renderer === '3d' ? 'Dùng SVG' : 'Thử 3D'}</button><button className="ew-tools-toggle" onClick={() => { setToolbox(v => !v); setSelected(null); }}>Đồ nghề</button></nav></section>
   <aside className="ew-inspector"><button className="ew-close-inspector" onClick={() => setSelected(null)}>Đóng thuộc tính</button><div className="ew-history"><button disabled={!history.current.past.length} onClick={() => undo()}>↶ Hoàn tác</button><button disabled={!history.current.future.length} onClick={() => undo(true)}>↷ Làm lại</button></div>{part ? <><span className="ew-eyebrow">Đang chọn · {part.id}</span><h2>{PARTS[part.kind].name}</h2><div className="ew-post-buttons">{postIds(part).map(id => <button key={id} aria-pressed={key(preview?.from ?? ref('', '')) === key(ref(part.id, id))} onClick={() => selectPost(ref(part.id, id))}>{postLabel(part, id)}</button>)}</div><button className="ew-inside-button" onClick={() => inspect(part.id)}>Soi bên trong ↗</button>{numbers && <div className="ew-meter-values"><span>{reading(sim.solution, part.id).Uab.toFixed(2)} V</span><span>{Math.abs(reading(sim.solution, part.id).Iab) > 10 ? 'OL' : (reading(sim.solution, part.id).Iab * 1000).toFixed(2) + ' mA'}</span><span>{reading(sim.solution, part.id).Pabsorbed.toFixed(3)} W</span></div>}
    {part.kind === 'battery' && <><label>Số ngăn pin<select value={part.cells?.length ?? 1} onChange={e => { const n = +e.target.value, cells = Array.from({ length: n }, (_, i) => part.cells?.[i] ?? { polarity: 1 as const, charge01: 1, present: true }); patch(part.id, { cells }); }}>{[1, 2, 3, 4].map(n => <option key={n}>{n}</option>)}</select></label>{part.cells?.map((cell, i) => <div className="ew-cell-controls" key={i}><span>Pin {i + 1}: {cell.present ? `${(cell.charge01 * 100).toFixed(0)}% · ${cell.polarity === 1 ? '+ −' : '− +'}` : 'Ngăn trống'}</span><button onClick={() => patch(part.id, { cells: part.cells!.map((v, j) => j === i ? { ...v, polarity: v.polarity === 1 ? -1 : 1 } : v) })}>Đảo</button><button onClick={() => patch(part.id, { cells: part.cells!.map((v, j) => j === i ? { ...v, present: !v.present } : v) })}>{cell.present ? 'Lấy ra' : 'Lắp vào'}</button></div>)}</>}
    {part.kind === 'bulb' && <button onClick={() => patch(part.id, { loose: !part.loose })}>{part.loose ? 'Siết lại bóng' : 'Vặn lỏng bóng'}</button>}
    {part.kind === 'led' && <><label>Màu LED<select value={part.color ?? 'red'} onChange={e => patch(part.id, { color: e.target.value as Part['color'] })}>{[['red', 'Đỏ'], ['yellow', 'Vàng'], ['green', 'Xanh lá'], ['blue', 'Xanh dương']].map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label><button onClick={reverseLed}>Đảo hai dây của LED</button></>}
    {['bulb', 'led', 'motor', 'bell', 'buzzer'].includes(part.kind) && spec?.kind !== 'fault' && <label>Thử tải khác<select value={part.kind} onChange={e => changeKind(e.target.value as PartKind)}>{['bulb', 'led', 'motor', 'bell', 'buzzer'].map(k => <option key={k} value={k}>{PARTS[k as PartKind].name}</option>)}</select></label>}
    {(part.kind === 'switch' || part.kind === 'spdt') && <button onClick={() => toggle(part.id)}>{part.actuator === 'doorContact' ? part.doorClosed ? 'Mở cửa' : 'Đóng cửa' : part.kind === 'spdt' ? `Vị trí ${(part.position ?? 0) + 1} · Chuyển vị trí` : part.closed ? 'Mở cầu dao' : 'Đóng cầu dao'}</button>}
    {part.kind === 'button' && <button onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); hold(part.id, true); }} onPointerUp={() => hold(part.id, false)} onPointerCancel={() => hold(part.id, false)} onLostPointerCapture={() => hold(part.id, false)} onBlur={() => hold(part.id, false)} onKeyDown={e => { if (e.code === 'Space') {
                e.preventDefault();
                if (!e.repeat)
                    hold(part.id, true);
            } }} onKeyUp={e => { if (e.code === 'Space') {
                e.preventDefault();
                hold(part.id, false);
            } }}>Giữ để đóng mạch</button>}
    {part.kind === 'resistor' && <label>Điện trở<select value={part.resistance ?? 100} onChange={e => patch(part.id, { resistance: +e.target.value })}>{[10, 47, 100, 220, 1000].map(v => <option key={v} value={v}>{v} Ω</option>)}</select></label>}
    {part.kind === 'rheostat' && <label>{(1 + 999 * (part.knob01 ?? .1)).toFixed(0)} Ω<input type="range" min="0" max="1" step=".01" value={part.knob01 ?? .1} onChange={e => patch(part.id, { knob01: +e.target.value })}/></label>}
    {part.kind === 'generator' && <label>Tay quay · {part.speed ?? 0} vòng/s<input type="range" min="-2" max="2" step=".1" value={part.speed ?? 0} onChange={e => patch(part.id, { speed: +e.target.value })}/><button onClick={() => patch(part.id, { speed: 0 })}>Dừng quay</button></label>}
    {part.kind === 'sample' && <button onClick={() => patch(part.id, { resistance: .05 })}>Kẹp vào lõi đồng đã tuốt sẵn</button>}
    {part.kind === 'fuse' && <label>Định mức<select value={part.rating ?? .5} onChange={e => patch(part.id, { rating: +e.target.value })}>{[.25, .5, 1].map(v => <option key={v} value={v}>{v} A</option>)}</select></label>}
    {(part.broken || part.loose || part.kind === 'battery') && <button onClick={() => dispatch({ type: 'repair', id: part.id })}>{part.kind === 'battery' ? 'Thay pin mới' : part.kind === 'bulb' ? 'Thay bóng mới' : 'Thay linh kiện mới'}</button>}
    <div className="ew-options"><button onClick={rotate}>Xoay 90°</button><button onClick={remove}>Cất linh kiện</button></div>
   </> : selectedWire ? <><h2>Dây {selectedWire.id}</h2><p>{selectedWire.a.partId} · {selectedWire.a.postId} ↔ {selectedWire.b.partId} · {selectedWire.b.postId}</p><button onClick={() => inspect(selectedWire.id)}>Soi bên trong dây</button><button onClick={remove}>Cắt dây</button>{selectedWire.broken && <button onClick={() => dispatch({ type: 'repair', id: selectedWire.id })}>Thay dây mới</button>}</> : <><span className="ew-eyebrow">Gợi ý thao tác</span><h2>Bắt đầu từ một cọc</h2><p>Chọn linh kiện, rồi chọn hai cọc để nối. Hoặc kéo từ cọc này sang cọc kia.</p><p>Dây cắt nhau không tự nối. Mỗi bóng có hai cọc A và B.</p></>}
   <details><summary>Cách nhìn dòng điện</summary><label><input type="checkbox" checked={numbers} onChange={e => setNumbers(e.target.checked)}/> Hiện V / mA / W</label><select aria-label="Hiển thị dòng điện" value={flow} onChange={e => setFlow(e.target.value as BenchProps['flow'])}><option value="electron">Electron · ngược dòng quy ước</option><option value="conventional">Dòng điện quy ước</option><option value="off">Ẩn chuyển động</option></select></details>
   {spec?.id === 'fuseRescue' && <button onClick={() => dispatch({ type: 'wire', wire: wire('fault', 'L1', 'a', 'L1', 'b') })}>Thử sự cố nối tắt tải</button>}
   </aside></div>
   {(spec?.id === 'candleFan' || spec?.id === 'legacy-m4') && <VirtualCandle out={!!run?.milestones.length} running={analysis.poweredLoadIds.some(id => sim.circuit.parts.some(p => p.id === id && p.kind === 'motor'))}/>}
   <section className="ew-dom-companion"><details open={renderer === '3d'}><summary>Linh kiện & cọc · nối bằng chạm hoặc bàn phím</summary><div className="ew-parts-list">{sim.circuit.parts.map(p => <div key={p.id} className={selected === p.id ? 'is-selected' : ''}><button data-part-control="true" onFocus={() => setSelected(p.id)} onClick={() => setSelected(p.id)}>{PARTS[p.kind].name} {p.id}{p.broken ? ' · hỏng' : p.loose ? ' · lỏng' : p.kind === 'switch' ? (p.closed ? ' · đóng' : ' · mở') : ''}</button>{postIds(p).map(id => { const connections = sim.circuit.wires.filter(w => key(w.a) === key(ref(p.id, id)) || key(w.b) === key(ref(p.id, id))); return <button key={id} aria-label={`${PARTS[p.kind].name} ${p.id}, ${postLabel(p, id)}, ${connections.length ? 'đã nối ' + connections.map(w => w.a.partId === p.id ? w.b.partId : w.a.partId).join(', ') : 'chưa nối'}`} aria-pressed={preview?.from?.partId === p.id && preview.from.postId === id} onClick={() => selectPost(ref(p.id, id))}>{postLabel(p, id)}</button>; })}</div>)}</div><div className="ew-wire-list">{sim.circuit.wires.map(w => <button key={w.id} onClick={() => setSelected(w.id)}>Dây {w.a.partId}.{w.a.postId} ↔ {w.b.partId}.{w.b.postId}</button>)}</div></details></section>
   {import.meta.env.DEV && <details className="ew-debug"><summary>Kiểm tra renderer (bản phát triển)</summary><button onClick={() => { const canvas = stage.current?.querySelector('canvas'); canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(); }}>Mô phỏng mất WebGL</button></details>}
   <footer className="ew-workbench-footer"><div className="ew-save"><input aria-label="Tên sáng chế" maxLength={40} value={saveTitle} onChange={e => setSaveTitle(e.target.value)}/><button disabled={saving || saved} onClick={() => void save()}>{saving ? 'Đang lưu…' : saved ? 'Đã lưu ✓' : 'Lưu sáng chế'}</button><button onClick={() => downloadDocument(createDocument(owner, simRef.current.circuit, saveTitle, mode, night))}>Tải JSON</button></div><button onClick={() => setClearConfirm(true)}>Dọn bàn</button></footer>
  </>}
  <div className="ew-status" role="status" aria-live="polite">{message}</div>
  {reference && spec && <div className="ew-modal-backdrop"><section role="dialog" aria-modal="true" aria-label="Mạch gợi ý"><h2>Một cách nối để bắt đầu</h2><CircuitThumbnail circuit={spec.initialCircuitId.startsWith('legacy-') ? legacyPreset(spec.initialCircuitId) : preset(spec.initialCircuitId === 'intro' ? 'single' : spec.initialCircuitId)} title={spec.title}/><p>Quan sát hai cọc của từng món, rồi tự thử các trạng thái trong đề bài.</p><button autoFocus onClick={() => setReference(false)}>Về mạch của mình</button></section></div>}
  {clearConfirm && <div className="ew-modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="clear-title"><h2 id="clear-title">Dọn bàn để thử ý tưởng mới?</h2><p>Có thể hoàn tác để lấy lại mạch vừa làm.</p><button onClick={() => { dispatch({ type: 'replace', circuit: preset('empty') }); setClearConfirm(false); }}>Dọn</button><button autoFocus onClick={() => setClearConfirm(false)}>Giữ bàn</button></section></div>}
 </div>;
}
