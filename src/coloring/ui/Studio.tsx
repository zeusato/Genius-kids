import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Undo2, Redo2, ZoomIn, ZoomOut, Hand, PaintBucket, Paintbrush, Download, Volume2, Play, Printer, Sparkles, Share2 } from 'lucide-react';
import { PALETTE, type Artwork, type Brush, type Mode, type Op, type Page, type Style, type CompletionDetail } from '../model';
import { coverage, completion, mathLabel, regionAt, targetColor, latestColor } from '../engine/core';
import { paintMarkup, svgDocument, pngData, download, printPage, sharePng } from '../render/svg';
import { saveArt, updateThumbnail } from '../progress/artworkRepo';
import { speak, speakSequence, cancelSpeech } from '../../utils/speech';
import { soundManager } from '../../../utils/sound';
const BRUSHES: Record<Brush, string> = { marker: 'Bút dạ', crayon: 'Bút sáp', watercolor: 'Màu nước', glitter: 'Kim tuyến', rainbow: 'Cầu vồng', erase: 'Tẩy' };
const STYLES: Record<Style, string> = { solid: 'Màu đặc', gradient: 'Chuyển màu', dots: 'Chấm bi', stripes: 'Sọc', stars: 'Ngôi sao', hearts: 'Trái tim', checks: 'Ca-rô', scales: 'Vảy cá', bricks: 'Gạch', clouds: 'Mây', crayon: 'Sáp kín vùng', glitter: 'Kim tuyến', watercolor: 'Màu nước', rainbow: 'Cầu vồng' };
const MODES: Record<Mode, string> = { free: 'Tô tự do', number: 'Tô theo số', math: 'Toán tô màu', listen: 'Nghe và tô' };
export function Studio({ page, labels, initial, owner, grade, onBack, onComplete, initialMode = 'free' }: {
    page: Page;
    labels: Uint16Array;
    initial?: Artwork;
    owner: string;
    grade: number;
    onBack: () => void;
    onComplete: (id: string, detail?: CompletionDetail) => {
        ok: boolean;
        earned: number;
    };
    initialMode?: Mode;
}) {
    const [ops, setOps] = useState<Op[]>(initial?.ops || []), [redo, setRedo] = useState(0), [pending, setPending] = useState<Op | null>(null), [tool, setTool] = useState<'fill' | 'brush' | 'pan'>('fill'), [brush, setBrush] = useState<Brush>('crayon'), [style, setStyle] = useState<Style>('solid'), [color, setColor] = useState<string>(PALETTE[0][0]), [size, setSize] = useState(65), [mode, setMode] = useState<Mode>(initialMode), [view, setView] = useState({ z: 1, x: 0, y: 0 }), [status, setStatus] = useState('Tô màu theo ý em nhé!'), [saveState, setSaveState] = useState('Đã mở tranh'), [magic, setMagic] = useState(grade === 0), [replay, setReplay] = useState<number | null>(null), [celebrate, setCelebrate] = useState(false), [living, setLiving] = useState(initial?.living || false), [selected, setSelected] = useState(0), [audio, setAudio] = useState(true), [author, setAuthor] = useState(false), [editName, setEditName] = useState(''), [exporting, setExporting] = useState(false), [editDecor, setEditDecor] = useState(false), [editBg, setEditBg] = useState(false), [editListen, setEditListen] = useState(false);
    const attempts = useRef(new Map<number, boolean>()), history = useRef<Op[][]>([]), future = useRef<Op[][]>([]), clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const thumbnail=useRef(initial?.thumb),livingImage=useRef(initial?.livingThumb);
    const [holding, setHolding] = useState(false),[color2,setColor2]=useState('#fff0a7'),[wave,setWave]=useState<{op:Extract<Op,{kind:'fill'}>;before:Op[];key:number}|null>(null);
    const svg = useRef<SVGSVGElement>(null), pointers = useRef(new Map<number, number[]>()), gesture = useRef<any>(null), draft = useRef<Op | null>(null), rev = useRef(initial?.revision || 0), queue = useRef(Promise.resolve()), alive = useRef(true), savedOps = useRef(ops), lastSpeech = useRef(0), awarded = useRef(initial?.complete || false), snapshot = useRef({ ops, living }), completeRef = useRef(false), saving = useRef(false);
    snapshot.current = { ops, living };
    const covered = useMemo(() => coverage(page, ops, labels), [page, ops, labels]), ratio = useMemo(() => completion(page, covered), [page, covered]);
    completeRef.current = ratio >= .95;
    const targets = useMemo(() => page.regions.filter(r => !r.bg && !r.decor && (mode !== 'listen' || (page.book === 'generated' ? r.inr >= 15 : r.listen))), [page, mode]);
    const lessonRatio = targets.length ? targets.filter(r => latestColor(ops, r.id) === PALETTE[targetColor(r)][0]).length / targets.length : 0;
    const shownRatio = mode === 'free' ? ratio : lessonRatio;
    const next = targets.find(r => latestColor(ops, r.id) !== PALETTE[targetColor(r)][0]);
    const markup = useMemo(() => paintMarkup(page, replay === null ? (wave?wave.before:ops) : ops.slice(0, replay), 'studio'), [page, ops, replay,wave]);
    const pendingMarkup = useMemo(() => pending ? paintMarkup({ ...page, regions: page.regions.filter(r => r.id === pending.r), ink: '' }, [pending], 'pending', false, true) : '', [page, pending]);
    useEffect(()=>{if(!wave)return;const timer=setTimeout(()=>setWave(null),280);return()=>clearTimeout(timer);},[wave]);
    function commit(add: Op[]) {if(add.length===1&&add[0].kind==='fill'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)setWave({op:add[0],before:ops,key:Date.now()});else setWave(null); history.current.push(ops); if(history.current.length>50)history.current.shift(); future.current = []; setOps(prev => [...prev, ...add]); setRedo(0); setReplay(null); }
    function undo() {setWave(null); if (!ops.length && !history.current.length)
        return; future.current.push(ops); if(future.current.length>50)future.current.shift(); setOps(history.current.pop() || ops.slice(0, -1)); setRedo(future.current.length); setReplay(null); }
    function redoAction() {setWave(null); const next = future.current.pop(); if (!next)
        return; history.current.push(ops); if(history.current.length>50)history.current.shift(); setOps(next); setRedo(future.current.length); setReplay(null); }
    function stopClear() { if (clearTimer.current)
        clearTimeout(clearTimer.current); setHolding(false); }
    function startClear() { setHolding(true); clearTimer.current = setTimeout(() => { history.current.push(ops); if(history.current.length>50)history.current.shift(); future.current = []; setOps([]); setRedo(0); setHolding(false); setStatus('Đã xoá màu. Hoàn tác để lấy lại tranh.'); }, 1000); }
    function save(force = false) {
        const snap = snapshot.current;
        if (!force && snap.ops === savedOps.current) return queue.current;
        const finished = completeRef.current;
        const job = async () => {
            if (alive.current) setSaveState('Đang lưu…');
            const art: Artwork = {owner,id:page.id,rev:page.rev,revision:rev.current,ops:snap.ops,updated:Date.now(),complete:finished,living:snap.living,scene:page.scene,thumb:thumbnail.current,livingThumb:livingImage.current,...(page.book==='generated'?{page}:{})};
            try {
                // Persist the journal first, before awaiting image decoding/export.
                rev.current = await saveArt(art,rev.current);
                savedOps.current = snap.ops;
            } catch (e) {
                if (alive.current) setSaveState('Chưa lưu: '+(e as Error).message);
                throw e;
            }
            try {
                const thumb = await pngData(page,snap.ops,320,true);
                const livingThumb = snap.living?await pngData(page,snap.ops,512,true,true):undefined;
                await updateThumbnail(owner,page.id,rev.current,thumb,livingThumb);
                thumbnail.current=thumb;livingImage.current=livingThumb;
                if (alive.current) setSaveState('Đã lưu trên thiết bị');
            } catch {
                if (alive.current) setSaveState('Đã lưu nét vẽ; ảnh thu nhỏ chưa sẵn sàng');
            }
        };
        queue.current=queue.current.catch(()=>{}).then(job);
        return queue.current;
    }
    const saveRef = useRef(save);
    saveRef.current = save;
    useEffect(() => { alive.current = true; const flush = () => { void saveRef.current().catch(() => { }); if (document.hidden)
        setReplay(null); }; document.addEventListener('visibilitychange', flush); window.addEventListener('pagehide', flush); return () => { if (clearTimer.current)
        clearTimeout(clearTimer.current); void saveRef.current().catch(() => { }); alive.current = false; document.removeEventListener('visibilitychange', flush); window.removeEventListener('pagehide', flush); cancelSpeech(); }; }, []);
    useEffect(() => { if (ops === savedOps.current)
        return; setSaveState('Chờ lưu…'); const id = setTimeout(() => void saveRef.current().catch(() => { }), 800); return () => clearTimeout(id); }, [ops]);
    useEffect(() => { const ready = mode === 'free' ? ratio >= .95 : targets.length > 0 && targets.filter(r => latestColor(ops, r.id) === PALETTE[targetColor(r)][0]).length / targets.length >= .95; if (!ready || awarded.current)
        return; const result = onComplete(page.id, { paintingComplete: ratio >= .95, tier: page.tier, regions: page.regions.filter(r => !r.bg && !r.decor).length, colors: new Set(ops.map(o => o.color)).size, patterns: new Set(ops.filter(o => o.kind === 'fill' && o.style !== 'solid').map(o => (o as Extract<Op, {
            kind: 'fill';
        }>).style)).size, mode, correct: [...attempts.current.values()].filter(Boolean).length, total: attempts.current.size, math: mode === 'math' ? [...attempts.current].map(([region, firstTry]) => ({ region, firstTry, answer: targetColor(page.regions.find(r => r.id === region)!) + 1 })) : undefined }); if (result.ok) {
        awarded.current = true;
        setCelebrate(true);
        setStatus(result.earned ? `Bức tranh thật đẹp! Em nhận được ${result.earned} sao.` : (mode === 'free' ? 'Bức tranh của em đã hoàn thành!' : 'Em đã hoàn thành thử thách tô màu!'));
        if (audio)
            speak('Bức tranh thật đẹp!');
        soundManager.playCorrect();
    } }, [ratio, onComplete, page.id, audio, mode, ops, targets]);
    useEffect(() => { if (replay === null)
        return; if (replay >= ops.length) {
        const id = setTimeout(() => setReplay(null), 600);
        return () => clearTimeout(id);
    } const id = setTimeout(() => setReplay(i => i === null ? null : i + 1), Math.max(40, 4000 / Math.max(1, ops.length))); return () => clearTimeout(id); }, [replay, ops.length]);
    useEffect(() => { if (!celebrate)
        return; const id = setTimeout(() => setCelebrate(false), 4500); return () => clearTimeout(id); }, [celebrate]);
    const point = (e: React.PointerEvent) => { const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse()); return [Math.round(p.x), Math.round(p.y)]; };
    const read = () => { if (mode === 'listen' && next) {
        const instruction = `Tô ${next.name.startsWith('Vùng ') ? 'vùng đang sáng' : next.name} màu ${PALETTE[targetColor(next)][1]}`;
        setStatus(instruction);
        speak(instruction);
    }
    else
        speak('Chọn màu rồi chạm hoặc kéo bút trong tranh.'); };
    const chooseColor = (c: typeof PALETTE[number]) => { setColor(c[0]); if (audio && Date.now() - lastSpeech.current > 1500) {
        lastSpeech.current = Date.now();
        cancelSpeech();
        speakSequence([{ text: c[1], lang: 'vi-VN' }, { text: c[2], lang: 'en-US' }]);
    } };
    const fill = (id: number,at?:number[]) => { const r = page.regions.find(r => r.id === id); if (!r)
        return; if (author) {
        setSelected(id);
        setEditName(r.name);
        setEditDecor(!!r.decor);
        setEditBg(r.bg);
        setEditListen(!!r.listen);
        return;
    } if (mode !== 'free' && targets.some(t => t.id === id)) {
        if (mode === 'listen' && next && id !== next.id) {
            setStatus('Tìm vùng đang sáng nhé!');
            return;
        }
        if (!attempts.current.has(id))
            attempts.current.set(id, color === PALETTE[targetColor(r)][0]);
        if (color !== PALETTE[targetColor(r)][0]) {
            setStatus(`Thử màu số ${targetColor(r) + 1} nhé!`);
            if (audio)
                speak('Thử màu khác nhé!');
            return;
        }
    } const add: Op[] = [{ kind: 'fill', r: id, color, color2,at,style, seed: Date.now() }]; if (page.symmetry) {
        const mirrored = regionAt(labels, page.size, page.size - r.anchor[0], r.anchor[1]);
        if (mirrored && mirrored !== id)
            add.push({ ...add[0], r: mirrored });
    } commit(add); setSelected(id); setStatus('Đẹp lắm! Em có thể đổi màu bất cứ lúc nào.'); };
    const down = (e: React.PointerEvent<SVGSVGElement>) => { if (e.button !== 0 || replay !== null)
        return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, [e.clientX, e.clientY]); if (pointers.current.size > 1) {
        draft.current = null;
        setPending(null);
        const [a, b] = [...pointers.current.values()];
        gesture.current = { pinch: true, d: Math.hypot(a[0] - b[0], a[1] - b[1]), v: view };
        return;
    } const [x, y] = point(e), id = regionAt(labels, page.size, x, y); gesture.current = { start: [e.clientX, e.clientY], v: view, id, at:[x,y] }; if (tool === 'brush' && mode === 'free' && id) {
        draft.current = { kind: 'stroke', r: id, color, brush, size, seed: Date.now(), pts: [x, y, x + .01, y] };
        setPending(draft.current);
        setSelected(id);
    } };
    const move = (e: React.PointerEvent) => { if (!pointers.current.has(e.pointerId))
        return; pointers.current.set(e.pointerId, [e.clientX, e.clientY]); const g = gesture.current; if (!g)
        return; if (g.pinch && pointers.current.size > 1) {
        const [a, b] = [...pointers.current.values()];
        setView({ ...g.v, z: Math.min(4, Math.max(1, g.v.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / Math.max(g.d, 1))) });
        return;
    } if (g.pinch)
        return; if (tool === 'pan') {
        setView({ ...g.v, x: g.v.x + e.clientX - g.start[0], y: g.v.y + e.clientY - g.start[1] });
        return;
    } if (draft.current?.kind === 'stroke') {
        const pts = draft.current.pts, p = point(e);
        if (Math.hypot(p[0] - pts[pts.length - 2], p[1] - pts[pts.length - 1]) < 2)
            return;
        if (pts.length < 12000) {
            draft.current = { ...draft.current, pts: [...pts, ...p] };
            setPending(draft.current);
        }
    } };
    const up = (e: React.PointerEvent, cancel = false) => { const g = gesture.current; pointers.current.delete(e.pointerId); if (g?.pinch) {
        if (!pointers.current.size)
            gesture.current = null;
        return;
    } if (!cancel && g) {
        if (draft.current) {
            const op = draft.current, add = [op];
            if (magic && op.kind === 'stroke' && op.brush !== 'erase') {
                const cv = coverage(page, [...ops, op], labels).get(op.r) || 0;
                if (cv >= .6)
                    add.push({ kind: 'fill', r: op.r, color: op.color, style: op.brush === 'marker' ? 'solid' : op.brush, seed: op.seed });
            }
            if (page.symmetry && op.kind === 'stroke') {
                const mirror = regionAt(labels, page.size, page.size - op.pts[0], op.pts[1]);
                if (mirror && mirror !== op.r)
                    add.push({ ...op, r: mirror, pts: op.pts.map((v, i) => i % 2 ? v : page.size - v) });
            }
            commit(add);
        }
        else if (tool !== 'pan' && Math.hypot(e.clientX - g.start[0], e.clientY - g.start[1]) < 10)
            fill(g.id,g.at);
    } draft.current = null; setPending(null); gesture.current = null; };
    const leave = async () => { try {
        await save(true);
        onBack();
    }
    catch {
        setStatus('Lưu chưa thành công. Xuất PNG để giữ tranh trước khi rời trang.');
    } };
    const exportPng = async () => { setExporting(true); try {
        download(await pngData(page, ops, 2048), page.id + '.png');
    }
    catch (e) {
        setStatus(String(e));
    }
    finally {
        setExporting(false);
    } };
    return <section className="cs-studio">
  <header className="cs-studio-head"><button className="cs-btn" onClick={leave} aria-label="Về xưởng vẽ"><ArrowLeft size={20}/></button><div><h1>{page.title}</h1><small aria-live="polite">{saveState}</small></div><select aria-label="Chế độ tô màu" value={mode} onChange={e => { setMode(e.target.value as Mode); attempts.current.clear(); awarded.current = false; setTool('fill'); setStatus('Chọn màu theo yêu cầu trên tranh nhé!'); }}>{Object.entries(MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><button className="cs-btn" onClick={() => { setAudio(!audio); cancelSpeech(); }} aria-pressed={audio} aria-label="Bật tắt giọng đọc"><Volume2 size={20}/></button><span className="cs-progress">{Math.round(shownRatio * 100)}%<progress value={shownRatio} max={1}/></span></header>
  <div className="cs-workspace"><aside className="cs-tools"><button className="cs-tool" aria-pressed={tool === 'fill'} onClick={() => setTool('fill')}><PaintBucket />Đổ màu</button><button className="cs-tool" aria-pressed={tool === 'brush'} disabled={mode !== 'free'} onClick={() => setTool('brush')}><Paintbrush />Bút vẽ</button><button className="cs-tool" aria-pressed={tool === 'pan'} onClick={() => setTool('pan')}><Hand />Kéo tranh</button><button className="cs-tool" aria-label="Hoàn tác" disabled={!ops.length && !history.current.length} onClick={undo}><Undo2 />Hoàn tác</button><button className="cs-tool" aria-label="Làm lại" disabled={!redo} onClick={redoAction}><Redo2 />Làm lại</button><button className="cs-tool" aria-label="Phóng to" onClick={() => setView(v => ({ ...v, z: Math.min(4, v.z + .5) }))}><ZoomIn />Phóng to</button><button className="cs-tool" aria-label="Thu nhỏ" onClick={() => setView(v => ({ ...v, z: Math.max(1, v.z - .5) }))}><ZoomOut />Thu nhỏ</button><button className="cs-tool" onClick={() => setView({ z: 1, x: 0, y: 0 })}>{view.z.toFixed(1)}×<small>Vừa trang</small></button></aside>
  <div className="cs-stage"><svg ref={svg} viewBox={`0 0 ${page.size} ${page.size}`} role="img" aria-label={'Tranh tô màu ' + page.title} style={{ transform: `translate(${view.x}px,${view.y}px) scale(${view.z})` }} onPointerDown={down} onPointerMove={move} onPointerUp={e => up(e)} onPointerCancel={e => up(e, true)}>
   <g dangerouslySetInnerHTML={{ __html: markup }}/>{wave&&replay===null&&<g className="cs-fill-wave" key={wave.key} pointerEvents="none"><defs><clipPath id="wave-reveal"><circle cx={wave.op.at?.[0]??page.regions.find(r=>r.id===wave.op.r)!.anchor[0]} cy={wave.op.at?.[1]??page.regions.find(r=>r.id===wave.op.r)!.anchor[1]} r={page.size*1.5}><animate attributeName="r" from="0" to={String(page.size*1.5)} dur=".28s" fill="freeze"/></circle></clipPath></defs><g clipPath="url(#wave-reveal)" dangerouslySetInnerHTML={{__html:paintMarkup({...page,regions:page.regions.filter(r=>r.id===wave.op.r),ink:''},[wave.op],'wave',false,true)}}/></g>}<g pointerEvents="none" dangerouslySetInnerHTML={{ __html: pendingMarkup }}/>

   {author && selected > 0 && <path d={page.regions.find(r => r.id === selected)?.d} fill="#ffd45e" opacity={.4} pointerEvents="none"/>}
   {mode === 'listen' && next && <path d={next.d} fill="#ffe476" opacity={.3} stroke="#e49432" strokeWidth={9} pointerEvents="none"/>}
   {(mode === 'number' || mode === 'math') && targets.filter(r => r.inr * view.z >= 15).map(r => <text key={r.id} x={r.anchor[0]} y={r.anchor[1]} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(mode === 'math' ? 38 : 44, r.inr * 1.2)} fill="#213742" stroke="white" strokeWidth={3} paintOrder="stroke" pointerEvents="none">{mode === 'math' ? mathLabel(targetColor(r) + 1, grade, r.id) : targetColor(r) + 1}</text>)}
  </svg>{celebrate && <div className="cs-celebrate">✦ Bức tranh thật đẹp! ✦</div>}{replay !== null && <div className="cs-replay">Đang xem lại · {replay}/{ops.length}<button className="cs-btn" onClick={() => setReplay(null)}>Dừng</button></div>}</div>
  <aside className="cs-palette-panel"><div className="cs-row"><h2>Hộp màu của em</h2><span className="cs-color-current" style={{ background: color }}/></div><div className="cs-palette">{PALETTE.slice(0, mode === 'free' ? PALETTE.length : 8).map((c, i) => <button key={c[0]} className="cs-swatch" style={{ background: c[0] }} aria-label={`Màu ${c[1]}`} aria-pressed={color === c[0]} title={c[1]} onClick={() => chooseColor(c)}>{mode !== 'free' ? i + 1 : color === c[0] ? '✓' : ''}</button>)}</div>
  {mode === 'free' && <><label className="cs-label">Màu tự pha <input type="color" value={color} onChange={e => setColor(e.target.value)}/></label>{tool === 'brush' ? <><label className="cs-label">Chất liệu<select value={brush} onChange={e => setBrush(e.target.value as Brush)}>{Object.entries(BRUSHES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label><label className="cs-label">Cỡ bút<input type="range" min={15} max={180} value={size} onChange={e => setSize(+e.target.value)}/></label></> : <label className="cs-label">Kiểu tô<select value={style} onChange={e => setStyle(e.target.value as Style)}>{Object.entries(STYLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}<label className="cs-label" hidden={style!=='gradient'||tool==='brush'}>Màu chuyển tới<input type="color" value={color2} onChange={e=>setColor2(e.target.value)}/></label><label className="cs-check"><input type="checkbox" checked={magic} onChange={e => setMagic(e.target.checked)}/>Ngón tay thần kỳ</label></>}
  <p className="cs-instruction" aria-live="polite">{status}</p>{mode === 'listen' && <button className="cs-btn cs-primary" onClick={read}><Volume2 size={18}/>Nghe yêu cầu</button>}
  <div className="cs-actions"><button className="cs-btn" disabled={!ops.length} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); startClear(); }} onPointerUp={stopClear} onPointerCancel={stopClear} onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
        e.preventDefault();
        startClear();
    } }} onKeyUp={stopClear} onBlur={stopClear}>{holding ? 'Giữ thêm chút nữa…' : 'Giữ 1 giây để xoá'}</button><button className="cs-btn" onClick={() => { const r = page.regions.find(r => r.id === selected) || next; if (r) {
        setColor(PALETTE[targetColor(r)][0]);
        setStatus('Đã chọn màu gợi ý. Chạm vùng muốn tô nhé!');
    } }}><Sparkles size={17}/>Gợi ý màu</button><button className="cs-btn" disabled={!ops.length} onClick={() => setReplay(0)}><Play size={17}/>Xem lại</button><button className="cs-btn" disabled={exporting} onClick={exportPng}><Download size={17}/>Xuất PNG</button><button className="cs-btn" onClick={() => download('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgDocument(page, ops)), page.id + '.svg')}>Xuất SVG</button><button className="cs-btn" onClick={() => { try {
        printPage(page);
    }
    catch (e) {
        setStatus(String(e));
    } }}><Printer size={17}/>In trang nét</button><button className="cs-btn" onClick={() => void sharePng(page, ops).catch(e => setStatus(e.name === 'AbortError' ? 'Đã huỷ chia sẻ' : String(e)))}><Share2 size={17}/>Chia sẻ</button><button className="cs-btn" disabled={ratio < .95} onClick={async () => { setLiving(true); snapshot.current.living = true; try {
        await save(true);
        setStatus('Tranh đã vào Thế Giới Sống!');
    }
    catch { } }}>✦ Thế Giới Sống</button></div>
  {import.meta.env.DEV && <details><summary>Biên soạn tranh</summary><label><input type="checkbox" checked={author} onChange={e => setAuthor(e.target.checked)}/>Chọn vùng để đặt tên</label><input aria-label="Tên vùng" value={editName} onChange={e => setEditName(e.target.value)}/><label><input type="checkbox" checked={editBg} onChange={e => setEditBg(e.target.checked)}/>Vùng nền</label><label><input type="checkbox" checked={editDecor} onChange={e => setEditDecor(e.target.checked)}/>Chi tiết nhỏ</label><label><input type="checkbox" checked={editListen} onChange={e => setEditListen(e.target.checked)}/>Dùng cho Nghe và tô</label><small>Chọn màu gợi ý bằng hộp màu phía trên.</small><button className="cs-btn" onClick={() => { const r = page.regions.find(r => r.id === selected); if (r) {
        r.name = editName.trim().slice(0, 80);
        r.bg = editBg;
        r.decor = editDecor;
        r.listen = editListen;
        r.color = Math.max(0, PALETTE.findIndex(c => c[0] === color));
    } download('data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(page)), page.id + '.json'); }}>Xuất dữ liệu vùng</button></details>}
  </aside></div><footer className="cs-studio-foot">Mỗi nét màu, một câu chuyện · Hai ngón tay để thu phóng · Bút luôn nằm trong vùng đã chọn</footer>
 </section>;
}
