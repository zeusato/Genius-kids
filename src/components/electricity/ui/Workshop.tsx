import React, { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Columns2, Download, Eraser, Eye, Gauge, Headphones, Lightbulb, List, Microscope, Moon, MoreHorizontal, PackageOpen, Redo2, RotateCcw, RotateCw, Save, Sun, Trash2, Undo2, Volume2, VolumeX, X, Zap } from 'lucide-react';
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
import { seededOrder } from '../engine/shuffle';
import { command, Command, emptyHistory, History, record, travel } from '../controller/commands';
import { CircuitDocument, createDocument, downloadDocument, listDocuments, saveDocument, cacheThumbnail } from '../progress/notebook';
import { BenchProps } from './benchTypes';
import { FlatBench, PartGlyph } from '../flat/FlatBench';
import { Activity } from './Activities';
import { Inside } from './Inside';
import { Compare } from './Compare';
import { CircuitThumbnail } from './CircuitThumbnail';
import { VirtualCandle } from './VirtualCandle';
import { legacyPreset } from '../legacy/adapter';
import { usePartIcons } from '../bench/icons';
import './workshop.css';

const BenchCanvas = lazy(() => import('../bench/BenchCanvas'));

class RendererBoundary extends Component<{ children: React.ReactNode; fallback: React.ReactNode; onError: () => void }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch() { this.props.onError(); }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function webglAvailable() {
    try {
        const canvas = document.createElement('canvas'), gl = canvas.getContext('webgl2');
        if (!gl) return false;
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return true;
    } catch { return false; }
}
const uid = (prefix: string) => `${prefix}${crypto.randomUUID().slice(0, 8)}`;
const BASIC_KIT: PartKind[] = ['battery', 'bulb', 'switch', 'button', 'bell', 'buzzer', 'motor', 'led', 'resistor', 'junction'];
const fmt = (v: number, digits = 2) => v.toFixed(digits).replace('.', ',');

/** Chip trạng thái mạch: một câu, một màu, không che bàn. */
function statusOf(sim: Simulation, a: ReturnType<typeof analyze>): { tone: 'ok' | 'warn' | 'bad' | 'idle'; text: string } {
    if (!sim.solution.ok) return 'deferred' in sim.solution && sim.solution.deferred ? { tone: 'idle', text: 'Đang kiểm tra mạch…' } : { tone: 'bad', text: 'Mạch chưa tính được · thử hoàn tác' };
    if (a.shortPaths.length) return { tone: 'bad', text: 'Nối tắt! Dòng điện đi thẳng, bỏ qua tải' };
    if (a.overload.length) return { tone: 'bad', text: 'Quá tải · giảm pin hoặc thêm điện trở' };
    if (a.poweredLoadIds.length) {
        const bulbs = sim.circuit.parts.filter(p => a.poweredLoadIds.includes(p.id) && (p.kind === 'bulb' || p.kind === 'led')).length;
        return { tone: 'ok', text: bulbs ? `Mạch kín · ${bulbs} đèn sáng` : 'Mạch kín · năng lượng tới tải' };
    }
    if (!sim.circuit.wires.length) return { tone: 'idle', text: 'Kéo từ một cọc sang cọc khác để nối dây' };
    return { tone: 'warn', text: 'Mạch hở · tìm chỗ còn thiếu' };
}
const TOPOLOGY: Record<string, string> = { series: 'Nối tiếp', parallel: 'Song song', mixed: 'Hỗn hợp' };

export function Workshop({ owner, grade, spec, initialDocument, onBack, practice = false }: {
    owner: string;
    grade: number;
    spec?: ContentSpec;
    initialDocument?: CircuitDocument;
    onBack: () => void;
    practice?: boolean;
}) {
    const { completeElectricity } = useStudentActions();
    const initial = useMemo(() => {
        const c = initialDocument ? cloneCircuit(initialDocument.circuit)
            : spec?.initialCircuitId.startsWith('legacy-') ? legacyPreset(spec.initialCircuitId)
                : preset(spec?.initialCircuitId ?? new URLSearchParams(location.search).get('preset') ?? 'intro');
        if (spec?.build) c.wires = [];
        return c;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const initialSimulation = useMemo(() => startSimulation(initial), []), initialRun = useMemo(() => spec ? createRun(owner, spec, initial) : null, []);
    const simRef = useRef(initialSimulation), history = useRef<History>(emptyHistory()), runRef = useRef<Run | null>(initialRun);
    const [sim, setSim] = useState(simRef.current), [run, setRun] = useState(runRef.current);
    const [selected, setSelected] = useState<string | null>(null), [preview, setPreview] = useState<BenchProps['preview']>(null);
    const [mode, setMode] = useState<'bench' | 'schematic'>(initialDocument?.view.mode ?? 'bench');
    const [renderer, setRenderer] = useState<'3d' | 'svg'>(() => new URLSearchParams(location.search).get('renderer') === 'svg' || !webglAvailable() ? 'svg' : '3d');
    const [night, setNight] = useState(initialDocument?.view.night ?? spec?.id === 'L03-firstLight');
    const [numbers, setNumbers] = useState(grade >= 5), [flow, setFlow] = useState<BenchProps['flow']>('electron');
    const [portrait, setPortrait] = useState(false), [fitKey, setFitKey] = useState(0);
    const [message, setMessage] = useState(''), [toolbox, setToolbox] = useState(false), [inside, setInside] = useState<string | null>(null), [compare, setCompare] = useState(false);
    const [hint, setHint] = useState(0), [muted, setMuted] = useState(false), [saved, setSaved] = useState(false), [saveTitle, setSaveTitle] = useState(initialDocument?.title ?? 'Sáng chế của mình');
    const [saving, setSaving] = useState(false), [pending, setPending] = useState(false), [clearConfirm, setClearConfirm] = useState(false), [advanced, setAdvanced] = useState(grade > 2), [reference, setReference] = useState(false);
    const [menu, setMenu] = useState(false), [sheet, setSheet] = useState<'save' | 'posts' | null>(null), [wide, setWide] = useState(() => window.innerWidth >= 1100);
    const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);
    const alive = useRef(true), paused = useRef(false), stage = useRef<HTMLDivElement>(null), audio = useRef<AudioContext | null>(null), lastStrike = useRef(0);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null), draftRevision = useRef(0), persistedTier = useRef(0), busyReward = useRef(false), saveQueue = useRef(Promise.resolve());
    const viewRef = useRef(mode), documentRef = useRef(initialDocument), tone = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
    const icons = usePartIcons();
    viewRef.current = mode;
    paused.current = compare || clearConfirm || reference;

    const publish = () => { setSim(simRef.current); setRun(runRef.current ? { ...runRef.current } : null); };
    const draft = useCallback(() => {
        const c = cloneCircuit(simRef.current.circuit), doc = createDocument(owner, c, 'Mạch đang làm', mode, night);
        doc.id = `${owner}:${spec?.id ?? 'sandbox'}`; doc.revision = ++draftRevision.current;
        if (runRef.current) doc.run = structuredClone(runRef.current);
        saveQueue.current = saveQueue.current.then(() => saveDocument(doc, true)).then(() => { }).catch(() => { if (alive.current) setMessage('Nháp chưa lưu được. Có thể tải mạch JSON để giữ bản này.'); });
    }, [owner, spec?.id, mode, night]);
    const draftRef = useRef(draft); draftRef.current = draft;
    const scheduleDraft = () => { if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(draft, 600); };
    const sound = (frequency = 700) => {
        if (muted) return;
        try {
            const ctx = audio.current ?? new AudioContext(); audio.current = ctx; void ctx.resume();
            const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = frequency; gain.gain.setValueAtTime(.035, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .09);
            osc.start(); osc.stop(ctx.currentTime + .1);
        } catch { /* Chữ và hình vẫn phản hồi. */ }
    };
    const dispatch = (action: Command, remember = true) => {
        const before = simRef.current, result = command(before, action);
        if (result.ok === false) { setMessage(result.message); return; }
        if (remember) history.current = record(history.current, before);
        simRef.current = result.sim; setSaved(false); setPreview(null); publish(); scheduleDraft();
        if (action.type === 'wire' || action.type === 'patch') sound();
    };
    const patch = (id: string, value: Partial<Part>, electrical = true) => dispatch({ type: 'patch', id, patch: value, electrical });
    const hold = (id: string, closed: boolean) => { const p = simRef.current.circuit.parts.find(p => p.id === id); if (p && p.closed !== closed) dispatch({ type: 'patch', id, patch: { closed } }, false); };
    const releaseButtons = () => {
        const c = cloneCircuit(simRef.current.circuit); let changed = false;
        for (const p of c.parts) if (p.kind === 'button' && p.closed) { p.closed = false; changed = true; }
        if (changed) { simRef.current = applyCircuit(simRef.current, c); publish(); }
        setPreview(null);
    };
    const toggle = (id: string) => {
        const p = simRef.current.circuit.parts.find(p => p.id === id); if (!p) return;
        if (p.kind === 'switch') patch(id, p.actuator === 'doorContact' ? { doorClosed: !p.doorClosed } : { closed: !p.closed });
        if (p.kind === 'spdt') patch(id, { position: p.position ? 0 : 1 });
    };
    const connect = (a: PostRef, b: PostRef) => { if (runRef.current) runRef.current.contacts = [...new Set([...runRef.current.contacts, key(a), key(b)])]; dispatch({ type: 'wire', wire: { id: uid('w'), a, b } }); };
    const selectPost = (post: PostRef) => {
        if (preview?.from) { if (key(preview.from) !== key(post)) connect(preview.from, post); setPreview(null); }
        else { setPreview({ from: post }); setMessage('Đã chọn cọc đầu. Chọn cọc còn lại.'); }
        if (runRef.current) { runRef.current.contacts = [...new Set([...runRef.current.contacts, key(post)])]; publish(); }
    };
    const inspect = (id: string) => { if (runRef.current) { runRef.current.observed = [...new Set([...runRef.current.observed, id])]; publish(); } setInside(id); setPreview(null); releaseButtons(); };
    const add = (kind: PartKind) => {
        if (spec?.kind === 'fault' && !['ammeter', 'voltmeter'].includes(kind)) { setMessage('Giữ các linh kiện của vụ việc; sửa đúng món đang có nhé.'); return; }
        const c = simRef.current.circuit, prefix = kind === 'bulb' || kind === 'led' || kind === 'motor' || kind === 'bell' ? 'L' : kind === 'switch' || kind === 'button' || kind === 'spdt' ? 'K' : kind === 'battery' ? 'B' : 'P';
        let id = prefix === 'L' ? 'L1' : prefix, n = 1;
        while (c.parts.some(p => p.id === id)) id = `${prefix}${n++}`;
        const placed = freeSpot(c, newPart(kind, id, 7, 4));
        if (!placed) { setMessage('Bàn đã kín. Dọn một khoảng trống nhé.'); return; }
        dispatch({ type: 'add', part: placed }); setSelected(id); if (!wide) setToolbox(false);
    };

    // Vòng mô phỏng cố định 20 ms; React chỉ nhận bản mới 10 lần/giây (renderer 3D đọc simRef mỗi khung).
    useEffect(() => {
        alive.current = true;
        const clock = new FixedClock(); let frame = 0, lastPublish = 0;
        const loop = (now: number) => {
            if (!document.hidden && !paused.current) {
                clock.advance(now, () => {
                    simRef.current = tick(simRef.current);
                    if (spec && runRef.current) { runRef.current.view = viewRef.current; runRef.current = sampleEvidence(spec, runRef.current, simRef.current, .02); }
                });
                if (now - lastPublish >= 100) { publish(); lastPublish = now; }
            } else clock.reset();
            frame = requestAnimationFrame(loop);
        };
        frame = requestAnimationFrame(loop);
        const pause = () => { if (document.hidden) { releaseButtons(); window.speechSynthesis?.cancel(); void audio.current?.suspend(); clock.reset(); } };
        document.addEventListener('visibilitychange', pause); window.addEventListener('blur', releaseButtons);
        return () => {
            alive.current = false; cancelAnimationFrame(frame);
            document.removeEventListener('visibilitychange', pause); window.removeEventListener('blur', releaseButtons);
            if (saveTimer.current) clearTimeout(saveTimer.current);
            draftRef.current(); window.speechSynthesis?.cancel(); void audio.current?.close().catch(() => { });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => { window.scrollTo({ top: 0 }); }, []);
    useEffect(() => {
        const el = stage.current; if (!el) return;
        const observer = new ResizeObserver(entries => { const r = entries[0].contentRect; setPortrait(r.height > r.width * 1.15 && r.width < 760); setWide(window.innerWidth >= 1100); setPreview(null); });
        observer.observe(el); return () => observer.disconnect();
    }, [inside, compare]);
    useEffect(() => {
        if (initialDocument) return;
        let active = true;
        void listDocuments(owner, 'drafts').then(docs => {
            const doc = docs.find(d => d.id === `${owner}:${spec?.id ?? 'sandbox'}`);
            if (active && doc && !doc.run?.done && history.current.past.length === 0) {
                simRef.current = startSimulation(doc.circuit);
                if (spec && doc.run?.ownerId === owner && doc.run.contentId === spec.id && Number.isInteger(doc.run.step) && doc.run.step >= 0 && doc.run.step <= spec.steps.length)
                    runRef.current = { ...doc.run, stable: 0, windowEdit: -1 };
                setMode(doc.view.mode); setNight(doc.view.night); publish();
                setMessage('Đã mở nháp đang làm của hồ sơ này.');
            }
        }).catch(() => { });
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const speak = () => {
        if (muted || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const text = run?.done ? spec?.takeaway : spec?.steps[run?.step ?? 0]?.text ?? 'Chọn một linh kiện, rồi nối hai cọc bằng dây.';
        const voice = new SpeechSynthesisUtterance(text); voice.lang = 'vi-VN'; voice.rate = .88; window.speechSynthesis.speak(voice);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { if (grade <= 2 && spec && !muted) speak(); }, [run?.step, muted]);
    useEffect(() => { const event = sim.runtime.strikes.at(-1); if (event && event.time > lastStrike.current) { lastStrike.current = event.time; sound(950); } }, [sim.runtime.strikes.at(-1)?.time]);
    useEffect(() => {
        const ctx = audio.current; if (!ctx || ctx.state === 'closed') return;
        const buzzer = sim.circuit.parts.some(p => p.kind === 'buzzer' && Math.abs(reading(sim.solution, p.id).Iab) >= .004);
        const motor = sim.circuit.parts.filter(p => p.kind === 'motor').reduce((max, p) => Math.max(max, Math.abs(sim.runtime.visual[p.id]?.motorRps ?? 0)), 0);
        const active = !muted && !paused.current && !document.hidden && (buzzer || motor > .1);
        if (active && !tone.current) { const osc = ctx.createOscillator(), gain = ctx.createGain(); osc.type = 'sine'; gain.gain.value = 0; osc.connect(gain); gain.connect(ctx.destination); osc.start(); tone.current = { osc, gain }; }
        if (tone.current) { tone.current.osc.frequency.setTargetAtTime(buzzer ? 660 : 70 + motor * 8, ctx.currentTime, .05); tone.current.gain.gain.setTargetAtTime(active ? .008 : 0, ctx.currentTime, .04); if (active) void ctx.resume(); }
    }, [sim, muted, compare, clearConfirm]);
    const persist = async () => {
        if (!spec || !runRef.current || practice || owner === 'guest' || busyReward.current) return;
        const tier = earnedTier(spec, runRef.current); if (tier <= persistedTier.current) return;
        busyReward.current = true;
        const result = await completeElectricity(owner, structuredClone(runRef.current));
        busyReward.current = false; if (!alive.current) return;
        if (result.ok) { persistedTier.current = tier; setPending(false); setMessage(result.earned ? `Đã lưu khám phá · +${result.earned} sao.` : 'Khám phá đã có trong hồ sơ.'); }
        else { setPending(true); setMessage(result.message ?? 'Chưa lưu được. Thử lại nhé.'); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { void persist(); }, [run?.step]);
    const leave = () => { releaseButtons(); draft(); window.speechSynthesis?.cancel(); onBack(); };
    const undo = (redo = false) => { releaseButtons(); const next = travel(history.current, simRef.current, redo); if (next) { history.current = next.history; simRef.current = next.sim; publish(); scheduleDraft(); } };
    const rotate = () => { const p = simRef.current.circuit.parts.find(p => p.id === selected); if (p) patch(p.id, { rot: (p.rot + 90) % 360 }, false); };
    const remove = () => {
        if (!selected) return;
        if (spec?.kind === 'fault' && simRef.current.circuit.parts.some(p => p.id === selected && !['ammeter', 'voltmeter'].includes(p.kind))) { setMessage('Hãy sửa hoặc thay mới linh kiện trong vụ việc.'); return; }
        dispatch({ type: 'remove', id: selected }); setSelected(null);
    };
    const closeOverlays = () => { setPreview(null); setInside(null); setCompare(false); setClearConfirm(false); setReference(false); setMenu(false); setSheet(null); };
    const keydown = (e: React.KeyboardEvent) => {
        if ((e.target as HTMLElement).closest('input,textarea,select')) return;
        if (e.key === 'Escape') { closeOverlays(); if (!preview) setSelected(null); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(e.shiftKey); return; }
        const p = simRef.current.circuit.parts.find(p => p.id === selected); if (!p) return;
        if (e.key.toLowerCase() === 'r') { e.preventDefault(); rotate(); }
        if (e.key === 'Delete') { e.preventDefault(); remove(); }
        const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        if (delta[e.key] && (e.target as HTMLElement).dataset.partControl) { e.preventDefault(); patch(p.id, { x: p.x + delta[e.key][0], z: p.z + delta[e.key][1] }, false); }
    };
    const save = async () => {
        setSaving(true);
        try {
            const doc = createDocument(owner, simRef.current.circuit, saveTitle, mode, night);
            if (documentRef.current) { doc.id = documentRef.current.id; doc.createdAt = documentRef.current.createdAt; doc.revision = documentRef.current.revision + 1; }
            documentRef.current = await saveDocument(doc);
            const savedDocument = documentRef.current;
            void import('../progress/thumbnail').then(({ makeThumbnail }) => makeThumbnail(savedDocument)).then(blob => cacheThumbnail(savedDocument, blob)).catch(() => { });
            if (alive.current) { setSaved(true); setSheet(null); setMessage('Đã lưu vào Sổ sáng chế.'); }
        } catch (e) { setMessage((e as Error).message); }
        finally { setSaving(false); }
    };

    // ---- vùng HUD che bàn → camera "vừa bàn" chừa đúng chỗ
    const topRef = useRef<HTMLDivElement>(null), dockRef = useRef<HTMLElement>(null), railRef = useRef<HTMLElement>(null), inspRef = useRef<HTMLElement>(null), taskRef = useRef<HTMLElement>(null);
    const [insets, setInsets] = useState({ top: 80, bottom: 100, left: 0, right: 0 });
    useLayoutEffect(() => {
        const measure = () => {
            const s = stage.current?.getBoundingClientRect(); if (!s || !s.width || !s.height) return;
            // Phần tử bị ẩn (display:none) có khung 0×0 → bỏ qua, không để bàn co lại.
            const box = (el: Element | null) => { const r = el?.getBoundingClientRect(); return r && r.width > 0 && r.height > 0 ? r : null; };
            const hdr = box(topRef.current), task = box(taskRef.current), dock = box(dockRef.current), rail = wide ? box(railRef.current) : null, insp = wide ? box(inspRef.current) : null;
            const clampV = (v: number, max: number) => Math.max(0, Math.min(max, v));
            const top = clampV(Math.max(hdr ? hdr.bottom - s.top + 8 : 0, task ? task.bottom - s.top + 6 : 0), s.height * 0.4);
            const bottom = clampV(dock ? s.bottom - dock.top + 8 : 0, s.height * 0.3);
            const left = clampV(rail ? rail.right - s.left + 8 : 0, s.width * 0.3);
            // Máy rộng: thẻ thuộc tính là cột bên phải → bàn trượt sang trái, không che linh kiện đang chọn.
            const right = clampV(insp ? s.right - insp.left + 8 : 0, s.width * 0.35);
            setInsets(v => (Math.abs(v.top - top) + Math.abs(v.bottom - bottom) + Math.abs(v.left - left) + Math.abs(v.right - right) > 2 ? { top, bottom, left, right } : v));
        };
        measure();
        const ro = new ResizeObserver(measure); [topRef.current, taskRef.current, dockRef.current, railRef.current, inspRef.current, stage.current].forEach(el => el && ro.observe(el));
        return () => ro.disconnect();
    });

    const props: BenchProps = {
        sim, getSim: () => simRef.current, selected, schematic: mode === 'schematic', night, portrait, reduced, flow, preview, fitKey, insets,
        onPreview: value => { setPreview(value); if (value?.from && runRef.current) runRef.current.contacts = [...new Set([...runRef.current.contacts, key(value.from)])]; },
        onSelect: id => { setSelected(id); if (!wide) setToolbox(false); setMenu(false); },
        onConnect: connect,
        onMove: (id, p) => patch(id, { x: Math.round(p[0]), z: Math.round(p[1]) }, false),
        onToggle: toggle, onHold: hold,
        onContextLost: () => { releaseButtons(); setRenderer('svg'); setMessage('Đã chuyển sang bàn phẳng; mạch và tiến độ vẫn giữ nguyên.'); },
    };
    const analysis = useMemo(() => analyze(sim.circuit, sim.solution, sim.runtime.strikes, sim.runtime.time), [sim]);
    const part = sim.circuit.parts.find(p => p.id === selected), selectedWire = sim.circuit.wires.find(w => w.id === selected), step = spec?.steps[run?.step ?? 0];
    const changeKind = (kind: PartKind) => {
        if (!part) return;
        const c = cloneCircuit(simRef.current.circuit), p = c.parts.find(p => p.id === part.id)!, old = postIds(p);
        Object.assign(p, newPart(kind, p.id, p.x, p.z)); p.kind = kind;
        const posts = postIds(p);
        c.wires = c.wires.map(w => ({ ...w, a: w.a.partId === p.id ? ref(p.id, posts[Math.max(0, old.indexOf(w.a.postId)) % posts.length]) : w.a, b: w.b.partId === p.id ? ref(p.id, posts[Math.max(0, old.indexOf(w.b.postId)) % posts.length]) : w.b }));
        dispatch({ type: 'replace', circuit: c });
    };
    const reverseLed = () => {
        if (!part) return;
        const c = cloneCircuit(simRef.current.circuit);
        c.wires = c.wires.map(w => ({ ...w, a: w.a.partId === part.id ? ref(part.id, w.a.postId === 'anode' ? 'cathode' : 'anode') : w.a, b: w.b.partId === part.id ? ref(part.id, w.b.postId === 'anode' ? 'cathode' : 'anode') : w.b }));
        dispatch({ type: 'replace', circuit: c });
    };
    useEffect(() => {
        if (sim.solution.ok || !('deferred' in sim.solution) || !sim.solution.deferred) return;
        const worker = new Worker(new URL('../engine/solver.worker.ts', import.meta.url), { type: 'module' }), revision = sim.runtime.solveRevision;
        worker.onmessage = event => { if (!alive.current || simRef.current.runtime.solveRevision !== revision) return; simRef.current = { ...simRef.current, solution: event.data }; publish(); worker.terminate(); };
        worker.onerror = () => { setMessage('Chưa giải được mạch này. Hãy hoàn tác hoặc giảm linh kiện.'); worker.terminate(); };
        worker.postMessage({ circuit: sim.circuit, runtime: sim.runtime });
        return () => worker.terminate();
    }, [sim.solution]);
    // Tin nhắn tự tắt sau vài giây.
    useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(''), 4200); return () => clearTimeout(t); }, [message]);

    const renderBench = () => renderer === 'svg'
        ? <FlatBench {...props} />
        : <RendererBoundary onError={props.onContextLost!} fallback={<FlatBench {...props} />}>
            <Suspense fallback={<div className="ew-ws-loading"><span>Đang bày bàn ánh sáng…</span><button onClick={() => setRenderer('svg')}>Dùng bàn phẳng</button></div>}><BenchCanvas {...props} /></Suspense>
        </RendererBoundary>;

    const status = statusOf(sim, analysis);
    const topo = analysis.poweredLoadIds.length >= 2 ? TOPOLOGY[analysis.topology] : undefined;
    const kit = (spec?.allowedParts ?? Object.keys(PARTS) as PartKind[]).filter(k => k !== 'sample' && (advanced || BASIC_KIT.includes(k)));
    const showRail = wide && !spec?.activity && spec?.kind !== 'fault';
    const eyebrow = practice ? 'Luyện thêm · không phát sao' : spec ? spec.kind === 'fault' ? 'Thám tử mạch điện' : spec.kind === 'mission' ? 'Sổ nhiệm vụ' : 'Hành trình khám phá' : 'Bàn tự do';
    const battery = sim.circuit.parts.find(p => p.kind === 'battery');
    const sources = sim.circuit.parts.filter(p => ['battery', 'lemon', 'potato', 'generator'].includes(p.kind));
    const sourceCurrent = battery ? Math.abs(reading(sim.solution, battery.id).Iab) : 0;
    const selReading = part ? reading(sim.solution, part.id) : null;
    const canCompare = !spec || ['L10-series', 'L11-parallel'].some(id => spec.id.startsWith(id.slice(0, 3)));
    const resetLesson = () => { releaseButtons(); simRef.current = startSimulation(initial); history.current = emptyHistory(); if (spec) runRef.current = createRun(owner, spec, initial); persistedTier.current = 0; setHint(0); publish(); scheduleDraft(); };

    // ------------------------------------------------------------------ các cảnh toàn màn (hoạt động / soi / so sánh)
    const header = <div className="ew-ws-top" ref={topRef}>
        <button className="ew-round" onClick={inside ? () => setInside(null) : compare ? () => setCompare(false) : leave} aria-label={inside || compare ? 'Về bàn' : 'Về xưởng'}><ArrowLeft size={20} /></button>
        <div className="ew-ws-title"><span>{eyebrow}</span><h1>{spec?.title ?? 'Sáng chế của mình'}</h1></div>
        {!spec?.activity && !inside && !compare && <div className={`ew-chip is-${status.tone}`} role="status"><i />{status.text}</div>}
        {topo && !inside && !compare && <div className="ew-chip is-topo">{topo}</div>}
        {numbers && battery && !spec?.activity && !inside && !compare && <div className="ew-chip is-meter">{fmt(Math.abs((battery.cells ?? []).reduce((s, c) => s + (c.present && c.charge01 > 0 ? 1.5 * c.polarity : 0), 0)), 1)} V · {fmt(sourceCurrent * 1000, 0)} mA</div>}
        <div className="ew-ws-actions">
            <button className="ew-round" onClick={() => { setMuted(!muted); window.speechSynthesis?.cancel(); }} aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'} aria-pressed={!muted}>{muted ? <VolumeX size={19} /> : <Volume2 size={19} />}</button>
            {!spec?.activity && <button className="ew-round" onClick={() => setNight(!night)} aria-label={night ? 'Bật đèn phòng' : 'Tắt đèn phòng'} aria-pressed={night}>{night ? <Sun size={19} /> : <Moon size={19} />}</button>}
            {!spec?.activity && <button className="ew-round" onClick={() => setNumbers(!numbers)} aria-label="Hiện số đo V, A, W" aria-pressed={numbers}><Gauge size={19} /></button>}
            {!spec?.activity && <div className="ew-menu-wrap">
                <button className="ew-round" onClick={() => setMenu(!menu)} aria-label="Thêm lựa chọn" aria-expanded={menu}><MoreHorizontal size={19} /></button>
                {menu && <div className="ew-menu" role="menu">
                    <button role="menuitem" onClick={() => { setSheet('save'); setMenu(false); }}><Save size={16} />Lưu vào Sổ sáng chế</button>
                    <button role="menuitem" onClick={() => { downloadDocument(createDocument(owner, simRef.current.circuit, saveTitle, mode, night)); setMenu(false); }}><Download size={16} />Tải mạch (JSON)</button>
                    <button role="menuitem" onClick={() => { setSheet('posts'); setMenu(false); }}><List size={16} />Nối bằng danh sách cọc</button>
                    <div className="ew-menu-group" role="group" aria-label="Cách nhìn dòng điện">
                        <span>Chấm chuyển động</span>
                        {([['electron', 'Electron'], ['conventional', 'Dòng quy ước'], ['off', 'Ẩn']] as const).map(([v, label]) => <button key={v} role="menuitemradio" aria-checked={flow === v} onClick={() => setFlow(v)}>{flow === v && <Check size={14} />}{label}</button>)}
                    </div>
                    <button role="menuitem" onClick={() => { setRenderer(renderer === '3d' ? 'svg' : '3d'); setMenu(false); }}>{renderer === '3d' ? 'Dùng bàn phẳng (máy yếu)' : 'Dùng bàn 3D'}</button>
                    <button role="menuitem" className="is-danger" onClick={() => { setClearConfirm(true); setMenu(false); }}><Eraser size={16} />Dọn bàn</button>
                    {import.meta.env.DEV && <button role="menuitem" onClick={() => { stage.current?.querySelector('canvas')?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(); setMenu(false); }}>Thử mất WebGL (dev)</button>}
                </div>}
            </div>}
        </div>
    </div>;

    const taskCard = spec && !inside && !compare && <section ref={taskRef} className={`ew-task ${run?.done ? 'is-done' : ''}`} aria-live="polite">
        <span className="ew-task-step">{run?.done ? <Check size={18} /> : `${(run?.step ?? 0) + 1}/${spec.steps.length}`}</span>
        <div className="ew-task-body">
            <p>{run?.done ? spec.takeaway : step?.text}</p>
            {!run?.done && hint > 0 && <small><Lightbulb size={13} /> {spec.hintRules[Math.min(2, hint - 1)]}</small>}
            {step?.choice && !run?.done && <div className="ew-task-choices">{seededOrder(step.choice.options.length, `${run?.id}:${step.id}`).map(i => { const text = step.choice!.options[i]; return <button key={text} aria-pressed={run?.choices[step.id] === i} onClick={() => { if (runRef.current) { runRef.current.choices[step.id] = i; publish(); } }}>{text}</button>; })}</div>}
            {run?.done && <div className="ew-task-done"><span>{practice ? 'Luyện tập đã hoàn thành.' : owner === 'guest' ? 'Kết quả của khách giữ trong phiên này.' : pending ? 'Kết quả đang chờ lưu.' : 'Đã ghi vào hồ sơ.'}</span><button className="ew-cta" onClick={leave}>Tiếp tục khám phá →</button></div>}
        </div>
        {!run?.done && <div className="ew-task-tools">
            <button onClick={speak} aria-label="Nghe lại"><Headphones size={17} /></button>
            <button onClick={() => setHint(v => Math.min(3, v + 1))} aria-label="Gợi ý"><Lightbulb size={17} /></button>
            {hint === 3 && !spec.activity && <button onClick={() => setReference(true)} className="is-text">Mạch gợi ý</button>}
            {spec.id === 'fuseRescue' && <button className="is-text" onClick={() => dispatch({ type: 'wire', wire: wire('fault', 'L1', 'a', 'L1', 'b') })}>Thử sự cố nối tắt</button>}
            <button onClick={resetLesson} aria-label="Làm lại bài"><RotateCcw size={17} /></button>
            {pending && <button className="is-text" onClick={() => void persist()}>Thử lưu lại</button>}
        </div>}
    </section>;

    if (spec?.activity) return <div className="ew-ws is-page" onKeyDown={keydown}>
        {header}{taskCard}
        <div className="ew-ws-page"><Activity key={run?.id} spec={spec} initial={run?.activity} onEvidence={state => { if (runRef.current) runRef.current.activity = { ...runRef.current.activity, ...state }; scheduleDraft(); }} /></div>
        {message && <div className="ew-toast" role="status">{message}</div>}
    </div>;
    if (compare) return <Compare onClose={() => setCompare(false)} />;
    if (inside) return <Inside sim={sim} selected={inside} onClose={() => setInside(null)} onToggle={toggle} reduced={reduced} onObserve={id => { if (runRef.current) runRef.current.observed = [...new Set([...runRef.current.observed, id])]; }} />;

    // ------------------------------------------------------------------ bàn làm việc
    return <div className={`ew-ws ${night ? 'is-night' : ''} ${mode === 'schematic' ? 'is-schematic' : ''} ${portrait ? 'is-portrait' : ''}`} onKeyDown={keydown}>
        <button className="ew-skip" onClick={() => setSheet('posts')}>Bỏ qua bàn 3D · nối bằng danh sách cọc</button>
        <div className="ew-ws-stage" ref={stage}>{renderBench()}</div>
        {header}
        {taskCard}

        {numbers && !(wide && (part || selectedWire)) && <aside className="ew-readout" aria-label="Số đo">
            {sources.length > 0 && battery && <p><b>{battery.cells?.filter(c => c.present).length ?? 0} pin · {fmt(Math.abs((battery.cells ?? []).reduce((s, c) => s + (c.present && c.charge01 > 0 ? 1.5 * c.polarity : 0), 0)), 1)} V</b><span>Dòng qua pin: {fmt(sourceCurrent * 1000, 0)} mA</span></p>}
            {part && selReading && part.kind !== 'battery' && <p><b>{PARTS[part.kind].name} {part.id}</b><span>{fmt(Math.abs(selReading.Uab))} V · {fmt(Math.abs(selReading.Iab) * 1000, 1)} mA · {fmt(Math.max(0, selReading.Pabsorbed), 3)} W{part.kind === 'bulb' ? ` · ${Math.round(Math.max(0, selReading.Pabsorbed) / 0.75 * 100)}% định mức` : ''}</span></p>}
            {flow !== 'off' && <p className={`ew-legend is-${flow}`}><i />{flow === 'electron' ? 'Electron chạy từ cực (−) về cực (+)' : 'Dòng điện quy ước: từ (+) qua tải về (−)'}</p>}
        </aside>}

        {(showRail || toolbox) && <aside ref={railRef} className={`ew-kit ${showRail ? 'is-rail' : 'is-tray'}`} aria-label="Đồ nghề">
            <header><h2>Đồ nghề</h2>{!showRail && <button className="ew-round is-small" onClick={() => setToolbox(false)} aria-label="Đóng đồ nghề"><X size={16} /></button>}</header>
            <div className="ew-kit-grid">{kit.map(kind => <button key={kind} onClick={() => add(kind)} title={`Đặt ${PARTS[kind].name} lên bàn`}>
                {icons?.[kind] ? <img src={icons[kind]} alt="" draggable={false} /> : <svg viewBox="-110 -65 220 150" aria-hidden="true"><PartGlyph part={newPart(kind, 'icon', 0, 0)} /></svg>}
                <span>{PARTS[kind].name}</span>
            </button>)}</div>
            <footer>
                <button onClick={() => setAdvanced(v => !v)}>{advanced ? 'Bộ đồ nghề gọn' : 'Thêm đồ nghề khám phá'}</button>
                {kit.includes('led') && kit.includes('resistor') && <button onClick={() => { add('led'); add('resistor'); }}>LED + điện trở 100 Ω</button>}
            </footer>
        </aside>}

        {(part || selectedWire) && <aside ref={inspRef} className="ew-inspector" aria-label="Thuộc tính">
            <header>
                <div><span>{part ? `Đang chọn · ${part.id}` : 'Dây dẫn'}</span><h2>{part ? PARTS[part.kind].name : `${selectedWire!.a.partId} ↔ ${selectedWire!.b.partId}`}</h2></div>
                <button className="ew-round is-small" onClick={() => setSelected(null)} aria-label="Bỏ chọn"><X size={16} /></button>
            </header>
            {part && <>
                {numbers && selReading && <div className="ew-insp-meter"><span><b>{fmt(Math.abs(selReading.Uab))}</b> V</span><span><b>{fmt(Math.abs(selReading.Iab) * 1000, 1)}</b> mA</span><span><b>{fmt(Math.max(0, selReading.Pabsorbed), 3)}</b> W</span>{part.kind === 'bulb' && <em>{Math.round(Math.max(0, selReading.Pabsorbed) / 0.75 * 100)}% công suất định mức</em>}</div>}
                <div className="ew-insp-row ew-post-pick">{postIds(part).map(id => <button key={id} aria-pressed={key(preview?.from ?? ref('', '')) === key(ref(part.id, id))} onClick={() => selectPost(ref(part.id, id))}>{postLabel(part, id)}</button>)}</div>
                {part.kind === 'battery' && <div className="ew-insp-cells">
                    <label>Số viên pin<div className="ew-stepper">{[1, 2, 3, 4].map(n => <button key={n} aria-pressed={(part.cells?.length ?? 1) === n} onClick={() => patch(part.id, { cells: Array.from({ length: n }, (_, i) => part.cells?.[i] ?? { polarity: 1 as const, charge01: 1, present: true }) })}>{n}</button>)}</div></label>
                    {part.cells?.map((cell, i) => <div className="ew-cell-row" key={i}><span>Pin {i + 1}: {cell.present ? `${Math.round(cell.charge01 * 100)}% · ${cell.polarity === 1 ? 'đúng chiều' : 'lắp ngược'}` : 'ngăn trống'}</span><button onClick={() => patch(part.id, { cells: part.cells!.map((v, j) => j === i ? { ...v, polarity: v.polarity === 1 ? -1 : 1 } : v) })}>Đảo</button><button onClick={() => patch(part.id, { cells: part.cells!.map((v, j) => j === i ? { ...v, present: !v.present } : v) })}>{cell.present ? 'Lấy ra' : 'Lắp vào'}</button></div>)}
                </div>}
                <div className="ew-insp-actions">
                    {(part.kind === 'switch' || part.kind === 'spdt') && <button className="ew-cta" onClick={() => toggle(part.id)}>{part.actuator === 'doorContact' ? part.doorClosed ? 'Mở cửa' : 'Đóng cửa' : part.kind === 'spdt' ? `Gạt sang vị trí ${part.position ? 1 : 2}` : part.closed ? 'Mở cầu dao' : 'Đóng cầu dao'}</button>}
                    {part.kind === 'button' && <button className="ew-cta" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); hold(part.id, true); }} onPointerUp={() => hold(part.id, false)} onPointerCancel={() => hold(part.id, false)} onLostPointerCapture={() => hold(part.id, false)} onBlur={() => hold(part.id, false)} onKeyDown={e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) hold(part.id, true); } }} onKeyUp={e => { if (e.code === 'Space') { e.preventDefault(); hold(part.id, false); } }}>Giữ để đóng mạch</button>}
                    {part.kind === 'bulb' && <button onClick={() => patch(part.id, { loose: !part.loose })}>{part.loose ? 'Siết lại bóng' : 'Vặn lỏng bóng'}</button>}
                    {part.kind === 'led' && <button onClick={reverseLed}>Đảo hai dây LED</button>}
                    {part.kind === 'sample' && <button onClick={() => patch(part.id, { resistance: .05 })}>Kẹp vào lõi đồng</button>}
                    {(part.broken || part.loose || part.kind === 'battery') && <button onClick={() => dispatch({ type: 'repair', id: part.id })}>{part.kind === 'battery' ? 'Thay pin mới' : part.kind === 'bulb' ? 'Thay bóng mới' : 'Thay linh kiện mới'}</button>}
                    <button onClick={() => inspect(part.id)}><Microscope size={16} />Soi bên trong</button>
                </div>
                {part.kind === 'led' && <label className="ew-insp-field">Màu LED<div className="ew-stepper">{([['red', 'Đỏ'], ['yellow', 'Vàng'], ['green', 'Lục'], ['blue', 'Lam']] as const).map(([v, n]) => <button key={v} aria-pressed={(part.color ?? 'red') === v} onClick={() => patch(part.id, { color: v })}>{n}</button>)}</div></label>}
                {['bulb', 'led', 'motor', 'bell', 'buzzer'].includes(part.kind) && spec?.kind !== 'fault' && <label className="ew-insp-field">Đổi tải<select value={part.kind} onChange={e => changeKind(e.target.value as PartKind)}>{['bulb', 'led', 'motor', 'bell', 'buzzer'].map(k => <option key={k} value={k}>{PARTS[k as PartKind].name}</option>)}</select></label>}
                {part.kind === 'resistor' && <label className="ew-insp-field">Điện trở<div className="ew-stepper">{[10, 47, 100, 220, 1000].map(v => <button key={v} aria-pressed={(part.resistance ?? 100) === v} onClick={() => patch(part.id, { resistance: v })}>{v >= 1000 ? '1k' : v}</button>)}</div></label>}
                {part.kind === 'rheostat' && <label className="ew-insp-field">Biến trở · {(1 + 999 * (part.knob01 ?? .1)).toFixed(0)} Ω<input type="range" min="0" max="1" step=".01" value={part.knob01 ?? .1} onChange={e => patch(part.id, { knob01: +e.target.value })} /></label>}
                {part.kind === 'generator' && <label className="ew-insp-field">Tay quay · {part.speed ?? 0} vòng/s<input type="range" min="-2" max="2" step=".1" value={part.speed ?? 0} onChange={e => patch(part.id, { speed: +e.target.value })} /></label>}
                {part.kind === 'fuse' && <label className="ew-insp-field">Định mức<div className="ew-stepper">{[.25, .5, 1].map(v => <button key={v} aria-pressed={(part.rating ?? .5) === v} onClick={() => patch(part.id, { rating: v })}>{fmt(v)} A</button>)}</div></label>}
                <div className="ew-insp-row"><button onClick={rotate}><RotateCw size={16} />Xoay</button><button onClick={remove} className="is-danger"><Trash2 size={16} />Cất đi</button></div>
            </>}
            {selectedWire && <div className="ew-insp-actions">
                <button onClick={() => inspect(selectedWire.id)}><Microscope size={16} />Soi bên trong dây</button>
                {selectedWire.broken && <button onClick={() => dispatch({ type: 'repair', id: selectedWire.id })}>Thay dây mới</button>}
                <button onClick={remove} className="is-danger"><Trash2 size={16} />Cắt dây</button>
            </div>}
        </aside>}

        <nav className="ew-dock" ref={dockRef} aria-label="Góc nhìn và công cụ">
            <div className="ew-dock-seg" role="group" aria-label="Góc nhìn">
                <button aria-pressed={mode === 'bench'} onClick={() => { releaseButtons(); setMode('bench'); }}><Zap size={20} /><span>Đồ thật</span></button>
                <button aria-pressed={mode === 'schematic'} onClick={() => { releaseButtons(); setMode('schematic'); }}><Eye size={20} /><span>Sơ đồ</span></button>
            </div>
            <button disabled={!selected} onClick={() => selected && inspect(selected)} title={selected ? 'Soi bên trong' : 'Chọn một dây hoặc linh kiện để soi'}><Microscope size={20} /><span>Soi</span></button>
            {canCompare && <button onClick={() => { releaseButtons(); setCompare(true); }}><Columns2 size={20} /><span>Hai cách nối</span></button>}
            {!showRail && spec?.kind !== 'fault' && <button aria-pressed={toolbox} onClick={() => { setToolbox(v => !v); setSelected(null); }}><PackageOpen size={20} /><span>Đồ nghề</span></button>}
            <i className="ew-dock-sep" />
            <button disabled={!history.current.past.length} onClick={() => undo()} aria-label="Hoàn tác"><Undo2 size={20} /><span>Hoàn tác</span></button>
            <button disabled={!history.current.future.length} onClick={() => undo(true)} aria-label="Làm lại"><Redo2 size={20} /><span>Làm lại</span></button>
        </nav>

        {(spec?.id === 'candleFan' || spec?.id === 'legacy-m4') && <div className="ew-float-card"><VirtualCandle out={!!run?.milestones.length} running={analysis.poweredLoadIds.some(id => sim.circuit.parts.some(p => p.id === id && p.kind === 'motor'))} /></div>}
        {message && <div className="ew-toast" role="status">{message}</div>}

        {sheet === 'posts' && <div className="ew-sheet" role="dialog" aria-modal="true" aria-label="Nối bằng danh sách cọc">
            <header><h2>Nối bằng danh sách cọc</h2><button className="ew-round is-small" onClick={() => setSheet(null)} aria-label="Đóng"><X size={16} /></button></header>
            <p>Chọn một cọc, rồi chọn cọc còn lại để nối dây. Dùng Tab và Enter trên bàn phím.</p>
            <div className="ew-parts-list">{sim.circuit.parts.map(p => <div key={p.id} className={selected === p.id ? 'is-selected' : ''}>
                <button data-part-control="true" onFocus={() => setSelected(p.id)} onClick={() => setSelected(p.id)}>{PARTS[p.kind].name} {p.id}{p.broken ? ' · hỏng' : p.loose ? ' · lỏng' : p.kind === 'switch' ? (p.closed ? ' · đóng' : ' · mở') : ''}</button>
                {postIds(p).map(id => { const connections = sim.circuit.wires.filter(w => key(w.a) === key(ref(p.id, id)) || key(w.b) === key(ref(p.id, id))); return <button key={id} aria-label={`${PARTS[p.kind].name} ${p.id}, ${postLabel(p, id)}, ${connections.length ? 'đã nối ' + connections.map(w => w.a.partId === p.id ? w.b.partId : w.a.partId).join(', ') : 'chưa nối'}`} aria-pressed={preview?.from?.partId === p.id && preview.from.postId === id} onClick={() => selectPost(ref(p.id, id))}>{postLabel(p, id)}</button>; })}
            </div>)}</div>
            <div className="ew-wire-list">{sim.circuit.wires.map(w => <button key={w.id} onClick={() => setSelected(w.id)}>Dây {w.a.partId}.{w.a.postId} ↔ {w.b.partId}.{w.b.postId}</button>)}</div>
        </div>}
        {sheet === 'save' && <div className="ew-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSheet(null); }}><section role="dialog" aria-modal="true" aria-labelledby="save-title" className="ew-dialog">
            <h2 id="save-title">Lưu vào Sổ sáng chế</h2>
            <CircuitThumbnail circuit={sim.circuit} title={saveTitle} />
            <label>Tên sáng chế<input autoFocus maxLength={40} value={saveTitle} onChange={e => { setSaveTitle(e.target.value); setSaved(false); }} /></label>
            <div className="ew-dialog-actions"><button onClick={() => setSheet(null)}>Để sau</button><button className="ew-cta" disabled={saving || saved} onClick={() => void save()}>{saving ? 'Đang lưu…' : saved ? 'Đã lưu ✓' : 'Lưu lại'}</button></div>
        </section></div>}
        {reference && spec && <div className="ew-modal-backdrop"><section role="dialog" aria-modal="true" aria-label="Mạch gợi ý" className="ew-dialog">
            <h2>Một cách nối để bắt đầu</h2>
            <CircuitThumbnail circuit={spec.initialCircuitId.startsWith('legacy-') ? legacyPreset(spec.initialCircuitId) : preset(spec.initialCircuitId === 'intro' ? 'single' : spec.initialCircuitId)} title={spec.title} />
            <p>Quan sát hai cọc của từng món, rồi tự thử các trạng thái trong đề bài.</p>
            <div className="ew-dialog-actions"><button className="ew-cta" autoFocus onClick={() => setReference(false)}>Về mạch của mình</button></div>
        </section></div>}
        {clearConfirm && <div className="ew-modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="clear-title" className="ew-dialog">
            <h2 id="clear-title">Dọn bàn để thử ý tưởng mới?</h2>
            <p>Có thể hoàn tác để lấy lại mạch vừa làm.</p>
            <div className="ew-dialog-actions"><button autoFocus onClick={() => setClearConfirm(false)}>Giữ bàn</button><button className="ew-cta" onClick={() => { dispatch({ type: 'replace', circuit: preset('empty') as Circuit }); setClearConfirm(false); setSelected(null); }}>Dọn</button></div>
        </section></div>}
    </div>;
}
