import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useStudent } from '../contexts/StudentContext';
import { supportsWebGL } from '../components/solar/scene3d/core';
import { PlanetModel } from '../components/planetmaker/PlanetModel';
import { applyBrush, BrushTool, createTerrain, makeSnap, randomizeTerrain, restoreSnap, TerrainSnap } from '../components/planetmaker/terrainOps';
import { CustomPlanetDoc } from '../components/planetmaker/planetStore';
import { brush, BuildingType, BUILDINGS, clamp, covers, heightAt, markTiles, placement, placeBuilding, PRESETS, Preset, RegionHistory, RegionTool, roadLine, simulate } from '../components/planetmaker/engine/region';
import { cloneWorld, exportWorld, importWorld, loadWorld, publish, recoveryBackup, restoreCheckpoint, saveWorld, World } from '../components/planetmaker/persistence/repository';
import { Draft, RegionScene } from '../components/planetmaker/rendering/RegionScene';
import { regionThumbnail } from '../components/planetmaker/rendering/thumbnail';
import { StrokeSampler } from '../components/planetmaker/engine/stroke';
import { EditTimeline } from '../components/planetmaker/engine/timeline';
import { BuildingAppearance } from '../components/planetmaker/BuildingAppearance';
import { buildingDemand } from '../components/planetmaker/engine/region';
import './PlanetMakerPage.css';

const ALL_TILES = () => new Set(Array.from({ length: 16 }, (_, i) => i));
const GLOBE_TOOLS: [BrushTool | 'rotate', string][] = [['rotate', '🖐️ Xoay'], ['raise', '🏔️ Nâng'], ['lower', '🕳️ Hạ'], ['smooth', '🪄 Mượt'], ['flatten', '🟰 San'], ['forest', '🌲 Rừng'], ['volcano', '🌋 Núi lửa'], ['erase', '🧽 Xóa']];
const LAND_TOOLS: [RegionTool, string][] = [['view', '🖐️ Di chuyển'], ['raise', '🏔️ Nâng đất'], ['lower', '🕳️ Hạ đất'], ['smooth', '🪄 Làm mượt'], ['flatten', '🟰 San phẳng'], ['hill', '⛰️ Đồi'], ['crater', '🌑 Hố thiên thạch'], ['volcano', '🌋 Núi lửa'], ['forest', '🌲 Trồng cây'], ['eraseForest', '🧹 Xóa cây'], ['grass', '🌿 Cỏ'], ['sand', '🏖️ Cát'], ['rock', '🪨 Đá'], ['snow', '❄️ Tuyết']];
type View = 'globe' | 'region';
interface GlobeSnapshot { terrain: TerrainSnap; doc: CustomPlanetDoc; seed: number }
function download(contents: Blob | string, name: string) {
    const url = URL.createObjectURL(typeof contents === 'string' ? new Blob([contents], { type: 'application/json' }) : contents), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
class SceneBoundary extends React.Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch() { this.props.onError(); }
    render() { return this.state.failed ? null : this.props.children; }
}
function SceneRuntime({ view, phase, capture, invalidateRef, stats, cameraAction, controls }: { view: View; phase: string; capture: React.MutableRefObject<(() => Promise<Blob>) | null>; invalidateRef: React.MutableRefObject<() => void>; stats: (s: string) => void; cameraAction: React.MutableRefObject<(action: string) => void>; controls: React.MutableRefObject<any> }) {
    const { gl, camera, scene, invalidate } = useThree(); const elapsed = useRef(0);
    useEffect(() => { invalidateRef.current = invalidate; capture.current = () => new Promise((resolve, reject) => { gl.render(scene, camera); gl.domElement.toBlob(blob => blob ? resolve(blob) : reject(new Error('Không chụp được ảnh.')), 'image/png'); }); return () => { capture.current = null; }; }, [gl, scene, camera, invalidate, capture, invalidateRef]);
    useEffect(() => { camera.position.set(...(view === 'globe' ? [0, .7, 3.3] : [40, 44, 48]) as [number, number, number]); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); invalidate(); }, [view, camera, invalidate]);
    useEffect(() => {
        cameraAction.current = action => {
            if (action === 'reset') { controls.current?.target.set(0, 0, 0); camera.position.set(...(view === 'globe' ? [0, .7, 3.3] : [40, 44, 48]) as [number, number, number]); }
            else { const target = controls.current?.target || new THREE.Vector3(), direction = camera.position.clone().sub(target), distance = clamp(direction.length() * (action === 'in' ? .75 : 1.33), view === 'globe' ? 1.5 : 6, view === 'globe' ? 5 : 105); camera.position.copy(target).add(direction.setLength(distance)); }
            controls.current?.update(); invalidate();
        };
    }, [view, camera, controls, cameraAction, invalidate]);
    useFrame((_, delta) => { if (phase === 'out') { camera.position.multiplyScalar(Math.max(.92, 1 - delta * .9)); invalidate(); } elapsed.current += delta; if (elapsed.current > 1) { stats(`${gl.info.render.calls} lượt vẽ · ${gl.info.memory.geometries} geometry · ${gl.info.memory.textures} texture`); elapsed.current = 0; } });
    return null;
}
export function PlanetMakerPage() { const { currentStudent } = useStudent(); return <PlanetLoader key={currentStudent?.id || 'guest'} studentId={currentStudent?.id || 'guest'} studentName={currentStudent?.name || 'của bé'} />; }
function PlanetLoader({ studentId, studentName }: { studentId: string; studentName: string }) {
    const [world, setWorld] = useState<World | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0); const navigate = useNavigate();
    useEffect(() => { let active = true; setError(''); loadWorld(studentId, studentName).then(w => { if (active) setWorld(w); }).catch(e => { if (active) setError(String(e.message || e)); }); return () => { active = false; }; }, [studentId, studentName, retry]);
    if (world) return <WorldEditor initial={world} />;
    return <main className="pm-loading"><span className="pm-orb">🪐</span><h1>{error ? 'Bản lưu cần được kiểm tra' : 'Đang mở Xưởng Hành Tinh…'}</h1>{error && <><p role="alert">{error}</p><p>Em có thể tải bản dữ liệu phục hồi trước khi thử lại.</p><div className="pm-row"><button onClick={() => setRetry(v => v + 1)}>Thử lại</button><button onClick={async () => { try { download(await recoveryBackup(studentId), 'hanh-tinh-phuc-hoi.json'); } catch (e) { setError(String(e)); } }}>Tải dữ liệu phục hồi</button><button onClick={async () => { try { download(await recoveryBackup(studentId), 'hanh-tinh-truoc-phuc-hoi.json'); setWorld(await restoreCheckpoint(studentId)); } catch (e) { setError(String((e as Error).message || e)); } }}>Xuất dữ liệu và khôi phục bản trước</button><button onClick={() => navigate('/science')}>Về Khoa học</button></div></>}</main>;
}
function WorldEditor({ initial }: { initial: World }) {
    const navigate = useNavigate(), worldRef = useRef(initial), world = worldRef.current;
    const terrain = useMemo(() => { const t = createTerrain(5); restoreSnap(t, initial.globe); return t; }, [initial]);
    const [view, setView] = useState<View>('globe'), [phase, setPhase] = useState(''), [version, setVersion] = useState(0);
    const [globeTool, setGlobeTool] = useState<BrushTool | 'rotate'>('rotate'), [tool, setTool] = useState<RegionTool>('view');
    const [tab, setTab] = useState<'land' | 'build' | 'town' | 'settings'>('land');
    const [radius, setRadius] = useState(2.5), [strength, setStrength] = useState(.16), [globeRadius, setGlobeRadius] = useState(.22);
    const [cursor, setCursor] = useState<[number, number] | null>(null), [globeCursor, setGlobeCursor] = useState<THREE.Vector3 | null>(null);
    const [draft, setDraft] = useState<Draft | null>(null), [selected, setSelected] = useState<string | null>(null);
    const [draggingBuilding, setDraggingBuilding] = useState(false);
    const [notice, setNotice] = useState(''), [saveStatus, setSaveStatus] = useState('Đã lưu trên máy'), [saveError, setSaveError] = useState(false);
    const [setup, setSetup] = useState(false), [preset, setPreset] = useState<Preset>('meadow'), [seedInput, setSeedInput] = useState(String(world.seed));
    const [generating, setGenerating] = useState(false), [markMode, setMarkMode] = useState(false), [traffic, setTraffic] = useState(true), [lowQuality, setLowQuality] = useState(false);
    const [visible, setVisible] = useState(!document.hidden), [gpuError, setGpuError] = useState(() => !supportsWebGL()), [canvasKey, setCanvasKey] = useState(0), [stats, setStats] = useState('');
    const [imported, setImported] = useState<World | null>(null);
    const history = useRef(new RegionHistory()), globeUndo = useRef<GlobeSnapshot[]>([]), globeRedo = useRef<GlobeSnapshot[]>([]);
    const timeline = useRef(new EditTimeline());
    const dirty = useRef(true), renderTiles = useRef(ALL_TILES()), saveTiles = useRef(ALL_TILES()), controls = useRef<any>(null);
    const invalidate = useRef(() => {}), capture = useRef<(() => Promise<Blob>) | null>(null);
    const cameraAction = useRef<(action: string) => void>(() => {});
    const epoch = useRef(0), savedEpoch = useRef(0), timer = useRef<ReturnType<typeof setTimeout> | null>(null), saving = useRef<Promise<boolean> | null>(null), mounted = useRef(true);
    const worker = useRef<Worker | null>(null), workerId = useRef(0), transitionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const pointerIds = useRef(new Set<number>()), multiTouch = useRef(false);
    const stroke = useRef<{ active: boolean; last: THREE.Vector3 | null; target: number; seed: number; globeBefore: GlobeSnapshot | null }>({ active: false, last: null, target: 0, seed: 1, globeBefore: null });
    const fileInput = useRef<HTMLInputElement>(null);
    const sampler = useRef(new StrokeSampler());
    const panelRef = useRef<HTMLElement>(null);
    useEffect(() => { if (draft || selected) panelRef.current?.querySelector('.pm-selection')?.scrollIntoView({ block: 'nearest' }); }, [draft?.type, draft?.movingId, selected]);
    const refresh = () => { setVersion(v => v + 1); invalidate.current(); };
    const refreshAll = () => { dirty.current = true; renderTiles.current = ALL_TILES(); saveTiles.current = ALL_TILES(); refresh(); };
    const save = useCallback((): Promise<boolean> => {
        if (saving.current) return saving.current;
        const work = async () => {
            try {
                while (savedEpoch.current < epoch.current) {
                    if (stroke.current.active) return false;
                    const at = epoch.current, w = worldRef.current;
                    if (w.region) w.region.thumbnail = regionThumbnail(w.region) || undefined;
                    publish(w, terrain); const snapshot = cloneWorld(w), tiles = new Set(saveTiles.current);
                    if (mounted.current) { setSaveStatus('Đang lưu…'); setSaveError(false); }
                    const revision = await saveWorld(snapshot, tiles); w.revision = revision; savedEpoch.current = at;
                    if (epoch.current === at) saveTiles.current.clear();
                }
                if (mounted.current) { setSaveStatus('Đã lưu trên máy'); setSaveError(false); } return true;
            } catch (e) { if (mounted.current) { setSaveStatus(String((e as Error).message || e)); setSaveError(true); } return false; }
        };
        saving.current = work().finally(() => { saving.current = null; }); return saving.current;
    }, [terrain]);
    const changed = () => { epoch.current++; setSaveStatus('Có thay đổi chưa lưu'); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => void save(), 900); refresh(); };
    const snapshotGlobe = (): GlobeSnapshot => ({ terrain: makeSnap(terrain), doc: structuredClone(worldRef.current.doc), seed: worldRef.current.seed });
    const record = (scope: 'globe' | 'region') => { globeRedo.current = []; history.current.redoStack = []; timeline.current.record(scope, { globe: globeUndo.current.length, region: history.current.undoStack.length }); };
    const pushGlobe = (before: GlobeSnapshot) => { globeUndo.current.push(before); if (globeUndo.current.length > 18) globeUndo.current.shift(); record('globe'); };
    const editGlobe = (fn: () => void) => { finish(); const before = snapshotGlobe(); fn(); pushGlobe(before); dirty.current = true; changed(); };
    const editRegion = (label: string, fn: () => void) => { finish(); const r = worldRef.current.region; if (!r) return; history.current.begin(r); fn(); if (history.current.commit(r, label)) { record('region'); renderTiles.current = ALL_TILES(); saveTiles.current = ALL_TILES(); changed(); } };
    function finish(cancel = false) {
        if (!stroke.current.active) return; stroke.current.active = false; if (controls.current) controls.current.enabled = true;
        if (view === 'globe') { const before = stroke.current.globeBefore; if (before) { if (cancel) { restoreSnap(terrain, before.terrain); worldRef.current.doc = before.doc; dirty.current = true; refresh(); } else { pushGlobe(before); changed(); } } }
        else if (worldRef.current.region) { if (cancel) { history.current.cancel(worldRef.current.region); refreshAll(); } else if (history.current.commit(worldRef.current.region, tool)) { record('region'); changed(); } }
        if (epoch.current > savedEpoch.current) { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => void save(), 900); }
        stroke.current.last = null; stroke.current.globeBefore = null;
    }
    const finishRef = useRef(finish); finishRef.current = finish;
    useEffect(() => {
        mounted.current = true;
        const up = (e: PointerEvent) => { pointerIds.current.delete(e.pointerId); finishRef.current(e.type === 'pointercancel'); if (!pointerIds.current.size) multiTouch.current = false; };
        const blur = () => { finishRef.current(true); pointerIds.current.clear(); multiTouch.current = false; };
        const visibility = () => { setVisible(!document.hidden); if (document.hidden) { finishRef.current(); void save(); } };
        const beforeUnload = (e: BeforeUnloadEvent) => { if (epoch.current !== savedEpoch.current || stroke.current.active) { e.preventDefault(); e.returnValue = ''; } };
        window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility); window.addEventListener('beforeunload', beforeUnload);
        return () => { finishRef.current(); mounted.current = false; if (timer.current) clearTimeout(timer.current); void save(); worker.current?.terminate(); transitionTimers.current.forEach(clearTimeout); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('beforeunload', beforeUnload); };
    }, [save]);
    const travel = (redo = false) => {
        finish(); setDraft(null); setSelected(null);
        const scope = timeline.current.travel(redo);
        if (scope === 'region' && world.region) { if (history.current.travel(world.region, redo)) { refreshAll(); changed(); } }
        else if (scope === 'globe') { const source = redo ? globeRedo.current : globeUndo.current, target = redo ? globeUndo.current : globeRedo.current, state = source.pop(); if (!state) return; target.push(snapshotGlobe()); restoreSnap(terrain, state.terrain); world.doc = structuredClone(state.doc); world.seed = state.seed; dirty.current = true; changed(); }
        if (scope && scope !== view) setNotice(`${redo ? 'Đã làm lại' : 'Đã hoàn tác'} thay đổi ở ${scope === 'globe' ? 'hành tinh' : 'thị trấn'}.`);
    };
    const actionRef = useRef({ travel }); actionRef.current = { travel };
    useEffect(() => { const key = (e: KeyboardEvent) => { if ((e.target as HTMLElement).matches('input,textarea,select')) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); actionRef.current.travel(e.shiftKey); } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
    const switchView = async (next: View) => { finish(); if (!(await save())) return; setDraft(null); setSelected(null); setMarkMode(false); setPhase('out'); invalidate.current(); transitionTimers.current.push(setTimeout(() => { setView(next); setTool('view'); setGlobeTool('rotate'); setPhase('in'); dirty.current = true; renderTiles.current = ALL_TILES(); }, 420)); transitionTimers.current.push(setTimeout(() => setPhase(''), 950)); };
    const enterRegion = () => world.region ? void switchView('region') : setSetup(true);
    const createMap = () => {
        const seed = Number(seedInput); if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) { setNotice('Mã địa hình cần là số nguyên từ 0 đến 4294967295.'); return; }
        setGenerating(true); setNotice(''); worker.current?.terminate(); const id = ++workerId.current;
        const w = new Worker(new URL('../components/planetmaker/workers/terrainWorker.ts', import.meta.url), { type: 'module' }); worker.current = w;
        w.onerror = () => { if (id === workerId.current && mounted.current) { setGenerating(false); setNotice('Chưa tạo được địa hình. Hãy thử lại.'); } w.terminate(); };
        w.onmessage = async e => { if (id !== workerId.current || !mounted.current) return; w.terminate(); setGenerating(false); if (e.data.error) { setNotice(e.data.error); return; } worldRef.current.region = e.data.region; saveTiles.current = ALL_TILES(); setSetup(false); changed(); await switchView('region'); }; w.postMessage({ id, preset, seed });
    };
    const canvasDown = (e: React.PointerEvent) => { pointerIds.current.add(e.pointerId); if (pointerIds.current.size > 1) { multiTouch.current = true; finish(true); if (controls.current) controls.current.enabled = true; } };
    const startStroke = (e: ThreeEvent<PointerEvent>) => {
        if (phase || multiTouch.current || e.button !== 0 || gpuError) return;
        if (view === 'globe' && markMode && world.region) { e.stopPropagation(); const p = e.point.clone().normalize(); editRegion('Đổi dấu mốc', () => { world.region!.marker = [p.x, p.y, p.z]; }); setMarkMode(false); setNotice('Đã đặt dấu mốc mới. Địa hình thị trấn vẫn giữ nguyên.'); return; }
        if (view === 'globe' && globeTool === 'rotate' || view === 'region' && tool === 'view') return; e.stopPropagation();
        if (view === 'region') { const x = clamp(e.point.x + 32, 0, 63.99), z = clamp(e.point.z + 32, 0, 63.99); setCursor([x, z]); if (tool === 'build') return; if (tool === 'select') { const b = world.region!.buildings.find(b => covers(b, x, z)); setSelected(b?.id || null); return; } history.current.begin(world.region!); stroke.current.target = heightAt(world.region!, x, z); }
        else { stroke.current.globeBefore = snapshotGlobe(); stroke.current.target = e.point.length() - 1; }
        if (timer.current) clearTimeout(timer.current);
        sampler.current.reset();
        stroke.current.active = true; stroke.current.last = null; stroke.current.seed = world.seed + epoch.current + 1; if (controls.current) controls.current.enabled = false; paintAt(e.point);
    };
    const paintAt = (point: THREE.Vector3) => {
        const last = stroke.current.last;
        if (view === 'region' && world.region) {
            const x = clamp(point.x + 32, 0, 63.99), z = clamp(point.z + 32, 0, 63.99), r = world.region;
            if (tool === 'road' || tool === 'eraseRoad') roadLine(r, last ? last.x + 32 : x, last ? last.z + 32 : z, x, z, tool === 'eraseRoad');
            else { if (last && ['hill', 'crater', 'volcano'].includes(tool)) return; const samples = sampler.current.sample([x, 0, z], Math.max(.2, radius * .2)); for (const [px, , pz] of samples) { brush(r, tool, px, pz, radius, strength, stroke.current.target, stroke.current.seed++); markTiles(px, pz, radius, renderTiles.current); markTiles(px, pz, radius, saveTiles.current); } }
        } else { const p = point.clone().normalize(); if (last && globeTool === 'volcano') return; for (const sample of sampler.current.sample([p.x, p.y, p.z], globeRadius * .2)) { const at = new THREE.Vector3(...sample).normalize(); applyBrush(terrain, globeTool as BrushTool, at.x, at.y, at.z, globeRadius, strength * .06, world.doc.seaLevel, stroke.current.target, stroke.current.seed++); } dirty.current = true; }
        stroke.current.last = point.clone(); refresh();
    };
    const moveStroke = (e: ThreeEvent<PointerEvent>) => { if (view === 'region') setCursor([clamp(e.point.x + 32, 0, 63.99), clamp(e.point.z + 32, 0, 63.99)]); else setGlobeCursor(e.point.clone()); if (stroke.current.active && !multiTouch.current) { e.stopPropagation(); paintAt(e.point); } };
    const chooseTool = (value: RegionTool) => { finish(); setTool(value); setDraft(null); setSelected(null); setNotice(''); };
    const chooseBuilding = (type: BuildingType) => { finish(); setTool('build'); setSelected(null); setDraft({ type, x: Math.floor(cursor?.[0] ?? 30), z: Math.floor(cursor?.[1] ?? 30), yaw: 0, color: BUILDINGS[type].color, roof: 0, floors: 1, style: 0 }); setNotice('Giữ mô hình trong suốt rồi kéo đến vị trí mong muốn. Thả tay, chỉnh mẫu và xác nhận xây.'); };
    const selectedBuilding = world.region?.buildings.find(b => b.id === selected);
    const draftCheck = draft && world.region ? placement(world.region, draft.type, draft.x, draft.z, draft.yaw, draft.movingId) : null;
    const confirmBuilding = () => { if (!draft || !draftCheck?.ok || !world.region) return; let id: string | undefined; editRegion('Xây công trình', () => { id = placeBuilding(world.region!, draft, draft.movingId)?.id; }); setDraft(null); setTool('select'); setSelected(id || null); setNotice('Đã xây! Kéo đường đến ô cổng màu vàng để kết nối.'); };
    const town = useMemo(() => world.region ? simulate(world.region) : null, [world.region, version]);
    const backup = () => { finish(); publish(worldRef.current, terrain); download(exportWorld(cloneWorld(worldRef.current)), 'hanh-tinh-cua-em.json'); setNotice('Đã xuất bản sao. Cất tệp này để phục hồi trên máy khác.'); };
    const selectedStatus = selectedBuilding ? town?.status[selectedBuilding.id] : null;
    const canUndo = timeline.current.undo.length > 0, canRedo = timeline.current.redo.length > 0;
    const region = world.region;
    const exit = async () => { finish(); if (await save()) navigate('/science'); };
    const handleImport = async (file?: File) => { if (!file) return; try { if (file.size > 5_000_000) throw new Error('Bản sao quá lớn (tối đa 5 MB).'); setImported(importWorld(await file.text(), world.studentId, world.revision)); } catch (e) { setNotice(String((e as Error).message || e)); } if (fileInput.current) fileInput.current.value = ''; };
    const acceptImport = async () => { if (!imported) return; finish(); if (!(await save())) return; backup(); imported.revision = world.revision; worldRef.current = imported; restoreSnap(terrain, imported.globe); history.current = new RegionHistory(); timeline.current = new EditTimeline(); globeUndo.current = []; globeRedo.current = []; setImported(null); setDraft(null); setSelected(null); setView('globe'); refreshAll(); changed(); await save(); };
    // UI follows the same mutable world; version only invalidates derived render data.
    return <main className={`pm-workshop ${view === 'region' ? 'pm-day' : ''}`}>
        <header className="pm-header"><button className="pm-icon" aria-label="Về Khoa học" onClick={exit}>←</button><div className="pm-heading"><span className="pm-eyebrow">XƯỞNG HÀNH TINH / {view === 'globe' ? 'TỔNG QUAN' : 'XÂY DỰNG'}</span><input aria-label="Tên hành tinh" maxLength={80} value={world.doc.name} onChange={e => editGlobe(() => { world.doc.name = e.target.value; })} /></div><div className="pm-header-actions"><button aria-label="Hoàn tác" title="Hoàn tác (Ctrl Z)" disabled={!canUndo || !!phase} onClick={() => travel()}>↶</button><button aria-label="Làm lại" title="Làm lại (Ctrl Shift Z)" disabled={!canRedo || !!phase} onClick={() => travel(true)}>↷</button><button className="pm-save" onClick={() => { finish(); void save(); }}>Lưu</button></div></header>
        <div className={`pm-status ${saveError ? 'pm-status-error' : ''}`} role="status">{saveStatus}{saveError && <span><button onClick={() => void save()}>Thử lưu lại</button><button onClick={backup}>Xuất bản sao</button><button onClick={() => { backup(); location.reload(); }}>Xuất rồi tải lại</button></span>}</div>
        <div className="pm-stage" onPointerDownCapture={canvasDown} onPointerLeave={() => { finish(); setCursor(null); setGlobeCursor(null); }}>
            {!gpuError && <SceneBoundary key={canvasKey} onError={() => setGpuError(true)}><Canvas shadows={!lowQuality && view === 'region'} frameloop={!visible ? 'never' : traffic || phase ? 'always' : 'demand'} dpr={lowQuality ? 1 : [1, 1.5]} camera={{ fov: 45, near: .05, far: 250 }} onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); finishRef.current(true); setGpuError(true); }, { once: true }); }}>
                <SceneRuntime view={view} phase={phase} capture={capture} invalidateRef={invalidate} stats={setStats} cameraAction={cameraAction} controls={controls} /><PerformanceMonitor onDecline={() => setLowQuality(true)} />
                <Suspense fallback={null}>{view === 'globe' ? <><color attach="background" args={['#101e32']} /><ambientLight intensity={1.5} /><directionalLight position={[4, 3, 5]} intensity={2.8} /><Stars radius={60} depth={20} count={lowQuality ? 400 : 1000} factor={3} fade />
                    <PlanetModel terrain={terrain} seaLevel={world.doc.seaLevel} cosmetics={world.doc.cosmetics} dirtyRef={dirty} animate={traffic} terrainEvents={{ onPointerDown: startStroke, onPointerMove: moveStroke }}>
                        {region && <group position={new THREE.Vector3(...region.marker).multiplyScalar(1.23)}><mesh onClick={e => { e.stopPropagation(); if (globeTool === 'rotate' && !markMode) enterRegion(); }}><sphereGeometry args={[.035, 12, 8]} /><meshBasicMaterial color="#ffe0a1" /></mesh></group>}
                        {globeCursor && globeTool !== 'rotate' && <mesh position={globeCursor.clone().normalize().multiplyScalar(globeCursor.length() + .006)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), globeCursor.clone().normalize())} raycast={() => null}><ringGeometry args={[globeRadius - .008, globeRadius, 48]} /><meshBasicMaterial color="#fff0aa" transparent opacity={.8} depthTest={false} /></mesh>}
                    </PlanetModel></> : region && <RegionScene region={region} version={version} dirty={renderTiles} tool={tool} cursor={cursor} radius={tool === 'road' || tool === 'eraseRoad' ? .55 : radius} draft={draft} selected={selected} onDown={startStroke} onMove={moveStroke} onSelect={setSelected} onDraftChange={setDraft} onDragState={setDraggingBuilding} traffic={traffic} lowQuality={lowQuality} />}</Suspense>
                <OrbitControls key={view} ref={controls} makeDefault target={[0, 0, 0]} enablePan={view === 'region'} enableDamping minDistance={view === 'globe' ? 1.5 : 6} maxDistance={view === 'globe' ? 5 : 105} maxPolarAngle={view === 'region' ? Math.PI * .47 : Math.PI} enabled={!phase && !draggingBuilding} />
            </Canvas></SceneBoundary>}{gpuError && <div className="pm-gpu-error"><h2>Phần hiển thị 3D đang tạm nghỉ</h2><p>Bản lưu vẫn còn. Hãy xuất một bản sao hoặc thử mở lại cảnh.</p><button onClick={() => { setCanvasKey(k => k + 1); dirty.current = true; renderTiles.current = ALL_TILES(); setGpuError(false); }}>Mở lại 3D</button><button onClick={backup}>Xuất bản sao</button></div>}
        </div>
        <div className="pm-view-switch"><button className={view === 'globe' ? 'active' : ''} disabled={!!phase} onClick={() => view !== 'globe' && void switchView('globe')}>🪐 Hành tinh</button><button className={view === 'region' ? 'active' : ''} disabled={!!phase} onClick={() => view !== 'region' && enterRegion()}>🏡 {region ? 'Thị trấn' : 'Tạo thị trấn'}</button></div>
        <div className="pm-camera-controls"><button aria-label="Phóng to" disabled={!!phase} onClick={() => cameraAction.current('in')}>＋</button><button aria-label="Thu nhỏ" disabled={!!phase} onClick={() => cameraAction.current('out')}>−</button><button aria-label="Đưa máy quay về giữa" disabled={!!phase} onClick={() => cameraAction.current('reset')}>⌖</button></div>
        <aside className="pm-panel" ref={panelRef}>
            {view === 'globe' ? <>
                <div className="pm-panel-title"><span>Thế giới của em</span><span>✦</span></div><p className="pm-help">Nặn hành tinh, rồi ghé vào thị trấn để xây thật chi tiết.</p>
                <div className="pm-tool-grid">{GLOBE_TOOLS.map(([id, label]) => <button key={id} className={globeTool === id ? 'active' : ''} onClick={() => { finish(); setGlobeTool(id); setMarkMode(false); }}>{label}</button>)}</div>
                <label className="pm-slider">Cỡ cọ <output>{globeRadius.toFixed(2)}</output><input aria-label="Cỡ cọ hành tinh" type="range" min=".08" max=".5" step=".02" value={globeRadius} onChange={e => setGlobeRadius(+e.target.value)} /></label>
                <label className="pm-slider">Lực cọ <output>{Math.round(strength * 100)}%</output><input aria-label="Lực cọ" type="range" min=".03" max=".4" step=".01" value={strength} onChange={e => setStrength(+e.target.value)} /></label>
                <details><summary>Màu trời & trang trí</summary><div className="pm-swatches">{[null, '#7EC8E3', '#9FE38B', '#E3B8FF', '#FFC178'].map(color => <button key={color || 'none'} aria-label={`Khí quyển ${color || 'không có'}`} aria-pressed={world.doc.cosmetics.atmosphere === color} style={{ background: color || '#435166' }} onClick={() => editGlobe(() => { world.doc.cosmetics.atmosphere = color; })}>{color ? '' : '×'}</button>)}</div>
                    {(['clouds', 'rings'] as const).map(key => <label className="pm-check" key={key}><input type="checkbox" checked={world.doc.cosmetics[key]} onChange={e => editGlobe(() => { world.doc.cosmetics[key] = e.target.checked; })} />{key === 'clouds' ? 'Mây' : 'Vành đai'}</label>)}
                    <label className="pm-slider">Mặt trăng <select aria-label="Số mặt trăng" value={world.doc.cosmetics.moons} onChange={e => editGlobe(() => { world.doc.cosmetics.moons = +e.target.value; })}><option value={0}>Không có</option><option value={1}>1 mặt trăng</option><option value={2}>2 mặt trăng</option></select></label>
                    <label className="pm-slider">Mực nước hành tinh<input aria-label="Mực nước hành tinh" type="range" min="-.05" max=".1" step=".005" value={world.doc.seaLevel} onChange={e => editGlobe(() => { world.doc.seaLevel = +e.target.value; })} /></label>
                    <label className="pm-check"><input type="checkbox" checked={world.doc.showInSolar} onChange={e => editGlobe(() => { world.doc.showInSolar = e.target.checked; })} />Hiện trong Hệ Mặt Trời</label>
                    <button className="pm-wide" onClick={() => editGlobe(() => { world.seed = (world.seed + 7919) >>> 0; randomizeTerrain(terrain, world.seed, world.doc.seaLevel); })}>🎲 Thử dáng hành tinh khác</button>
                </details>
                <div className="pm-region-card">{region?.thumbnail ? <img src={region.thumbnail} alt="Bản đồ thu nhỏ thị trấn" width={58} height={58} style={{ borderRadius: 8 }} /> : <span>🏡</span>}<div><strong>{region?.name || 'Một nơi để bắt đầu'}</strong><small>{region ? `${region.buildings.length} công trình · ${town?.residents || 0} cư dân` : 'Chọn địa hình và xây thị trấn đầu tiên.'}</small></div><button onClick={enterRegion}>{region ? 'Ghé thăm →' : 'Tạo vùng →'}</button></div>
                {region && <button className={`pm-wide ${markMode ? 'active' : ''}`} onClick={() => { setMarkMode(!markMode); setGlobeTool('rotate'); setNotice('Chạm lên hành tinh để đổi dấu mốc thị trấn.'); }}>📍 {markMode ? 'Đang chọn dấu mốc…' : 'Đổi dấu mốc trên hành tinh'}</button>}
            </> : region && <>
                <div className="pm-panel-title"><input aria-label="Tên thị trấn" maxLength={80} value={region.name} onChange={e => editRegion('Đổi tên vùng', () => { region.name = e.target.value; })} /><span>🏡</span></div>
                <nav className="pm-tabs" aria-label="Nhóm công cụ">{([['land', 'Địa hình'], ['build', 'Xây dựng'], ['town', 'Thị trấn'], ['settings', 'Tùy chọn']] as const).map(([id, name]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{name}</button>)}</nav>
                {tab === 'land' && <><p className="pm-help">Kéo để nặn. Cọ San lấy độ cao ở điểm chạm đầu. Nền nhà được bảo vệ.</p><div className="pm-tool-grid">{LAND_TOOLS.map(([id, label]) => <button key={id} className={tool === id ? 'active' : ''} onClick={() => chooseTool(id)}>{label}</button>)}</div><label className="pm-slider">Cỡ cọ <output>{radius.toFixed(1)} ô</output><input aria-label="Cỡ cọ địa hình" type="range" min=".5" max="6" step=".25" value={radius} onChange={e => setRadius(+e.target.value)} /></label><label className="pm-slider">Lực cọ <output>{Math.round(strength * 100)}%</output><input aria-label="Lực cọ" type="range" min=".03" max=".4" step=".01" value={strength} onChange={e => setStrength(+e.target.value)} /></label></>}
                {tab === 'build' && <><p className="pm-help">Chọn công trình → kéo mô hình trong suốt → thả và xác nhận. Nối đường đến ô cổng màu vàng.</p><div className="pm-tool-grid pm-building-grid">{Object.entries(BUILDINGS).map(([id, s]) => <button key={id} className={draft?.type === id ? 'active' : ''} onClick={() => chooseBuilding(id as BuildingType)}><span>{s.icon}</span>{s.name}<small>{s.w} × {s.d} ô</small></button>)}</div><div className="pm-tool-grid"><button className={tool === 'select' ? 'active' : ''} onClick={() => chooseTool('select')}>👆 Chọn nhà</button><button className={tool === 'view' ? 'active' : ''} onClick={() => chooseTool('view')}>🖐️ Di chuyển</button><button className={tool === 'road' ? 'active' : ''} onClick={() => chooseTool('road')}>🛣️ Vẽ đường</button><button className={tool === 'eraseRoad' ? 'active' : ''} onClick={() => chooseTool('eraseRoad')}>🧽 Xóa đường</button></div></>}
                {tab === 'town' && town && <><div className="pm-metrics"><div><strong>{town.residents}</strong><span>Cư dân</span></div><div><strong>{region.buildings.length}/200</strong><span>Công trình</span></div><div><strong>{town.connectedHomes}</strong><span>Nhà nối đường</span></div><div><strong>{town.servedHomes}</strong><span>Nhà đủ tiện ích</span></div></div><p className="pm-help">Mỗi mạng đường có điện và nước riêng. 1 trạm điện cấp 12 đơn vị; 1 trạm nước có điện cấp 20 đơn vị. Cả mạng cần đủ nguồn cho tổng nhu cầu.</p><div className="pm-networks">{town.networks.filter(n => n.powerNeed || n.waterNeed || n.power).map((n, i) => <p key={i}>Mạng {i + 1}: ⚡ {n.power}/{n.powerNeed} · 💧 {n.power >= n.powerNeed ? n.water : 0}/{n.waterNeed} <small>(nguồn / nhu cầu)</small></p>)}</div><h3>Ba thử thách nhỏ</h3>{['Nối đường cho 5 ngôi nhà', 'Cấp đủ điện, nước cho 3 ngôi nhà', 'Nối trường học và công viên với khu dân cư'].map((m, i) => <div className={`pm-mission ${town.missions[i] ? 'done' : ''}`} key={m}>{town.missions[i] ? '✓' : '○'} {m}</div>)}<p className="pm-help">Chơi tự do, không cần hoàn thành thử thách. Cư dân và xe là minh họa.</p><h3>Thí nghiệm nước dâng</h3><label className="pm-slider">Mực nước vùng <output>{region.seaLevel.toFixed(1)}</output><input aria-label="Mực nước vùng" type="range" min="-2" max="6" step=".1" value={region.seaLevel} onChange={e => editRegion('Nước dâng', () => { region.seaLevel = +e.target.value; })} /></label><p className="pm-help">{town.flooded ? `${town.flooded} công trình đang ngập. Đường ngập ngừng kết nối.` : 'Chưa có công trình bị ngập.'} Bấm Hoàn tác để quay lại.</p></>}
                {tab === 'settings' && <><p className="pm-help">{PRESETS[region.preset]} · Mã {region.seed}<br />Bản đồ 128 × 128 ô địa hình, 64 × 64 ô xây dựng. Thay đổi trên hành tinh không làm đổi bản đồ này.</p><label className="pm-check"><input type="checkbox" checked={traffic} onChange={e => setTraffic(e.target.checked)} />Cư dân đi bộ và xe minh họa</label><label className="pm-check"><input type="checkbox" checked={lowQuality} onChange={e => setLowQuality(e.target.checked)} />Đồ họa nhẹ (ít bóng, DPR 1)</label><p className="pm-help">{region.trees.length}/1000 cây · {region.roads.reduce((s, v) => s + v, 0)} ô đường</p><details><summary>Thông tin hiển thị</summary><small>{stats}</small></details></>}
                {draft && draftCheck && <div className="pm-selection"><strong>{BUILDINGS[draft.type].icon} {draft.movingId ? 'Di chuyển' : 'Xây'} {BUILDINGS[draft.type].name.toLowerCase()}</strong><p className={draftCheck.ok ? 'pm-valid' : 'pm-invalid'}>{draggingBuilding ? 'Đang kéo mô hình…' : draftCheck.reason}</p><p className="pm-help">Giữ và kéo chính mô hình để đổi vị trí. Thả ngoài bản đồ sẽ trả về vị trí trước.</p><BuildingAppearance building={draft} preview onChange={changes => setDraft({ ...draft, ...changes })} /><div className="pm-row"><button onClick={() => setDraft({ ...draft, yaw: (draft.yaw + 1) % 4 })}>↻ Xoay 90°</button><input aria-label="Màu công trình mới" type="color" value={draft.color} onChange={e => setDraft({ ...draft, color: e.target.value })} /><select aria-label="Kiểu mái mới" value={draft.roof} onChange={e => setDraft({ ...draft, roof: +e.target.value })}><option value={0}>Mái nhọn</option><option value={1}>Mái bằng</option><option value={2}>Mái vòm</option></select></div><div className="pm-row"><button className="pm-primary" disabled={!draftCheck.ok || draggingBuilding} onClick={confirmBuilding}>{draft.movingId ? 'Chuyển tới đây' : 'Xây tại đây'}</button><button onClick={() => { setDraft(null); setTool('select'); }}>Hủy</button></div></div>}
                {selectedBuilding && !draft && <div className="pm-selection"><strong>{BUILDINGS[selectedBuilding.type].icon} {BUILDINGS[selectedBuilding.type].name}</strong><p>{selectedStatus?.flooded ? '🌊 Đang ngập' : !selectedStatus?.connected ? '🛣️ Chưa nối cổng với đường' : `⚡ ${selectedStatus.powered ? 'Đủ điện' : 'Thiếu điện'} · 💧 ${selectedStatus.watered ? 'Đủ nước' : 'Thiếu nước'}`}</p><small>Nhu cầu: ⚡ {buildingDemand(selectedBuilding).power} · 💧 {buildingDemand(selectedBuilding).water}</small><BuildingAppearance building={selectedBuilding} onChange={changes => editRegion('Đổi kiến trúc / số tầng', () => { Object.assign(selectedBuilding, changes); })} /><div className="pm-row"><button onClick={() => { setDraft({ ...selectedBuilding, movingId: selectedBuilding.id }); setTool('build'); }}>Di chuyển / xoay</button><button onClick={() => { const { id, foundation, ...copy } = selectedBuilding; setDraft({ ...copy, x: copy.x + 3 }); setTool('build'); }}>Nhân bản</button></div><div className="pm-row"><label>Màu <input aria-label="Màu công trình" type="color" value={selectedBuilding.color} onChange={e => editRegion('Đổi màu nhà', () => { selectedBuilding.color = e.target.value; })} /></label><select aria-label="Kiểu mái" value={selectedBuilding.roof} onChange={e => editRegion('Đổi mái', () => { selectedBuilding.roof = +e.target.value; })}><option value={0}>Mái nhọn</option><option value={1}>Mái bằng</option><option value={2}>Mái vòm</option></select><button className="pm-danger" onClick={() => { editRegion('Xóa nhà', () => { region.buildings = region.buildings.filter(b => b.id !== selected); }); setSelected(null); }}>Xóa</button></div></div>}
            </>}
            <details className="pm-files"><summary>Ảnh & bản sao</summary><div className="pm-row"><button disabled={gpuError} onClick={async () => { try { const blob = await capture.current?.(); if (blob) download(blob, 'the-gioi-cua-em.png'); } catch (e) { setNotice(String(e)); } }}>📷 Chụp PNG</button><button onClick={backup}>↓ Xuất dữ liệu</button><button onClick={() => fileInput.current?.click()}>↑ Nhập bản sao</button></div><p className="pm-help">Bản lưu ở trình duyệt này. Xuất dữ liệu để mang sang máy khác.</p></details>
        </aside>
        <div className="pm-bottom-hint">{markMode ? '📍 Chạm để đặt dấu mốc thị trấn' : view === 'globe' ? 'Kéo để xoay · Cuộn hoặc chụm để zoom' : 'Chọn Di chuyển để xoay cảnh · Chuột phải để kéo · Hai ngón để zoom'}{notice && <p role="status">{notice}<button aria-label="Ẩn thông báo" onClick={() => setNotice('')}>×</button></p>}</div>
        {phase && <div className={`pm-cloud-transition ${phase}`}><span>☁</span><strong>{view === 'globe' ? 'Bay qua những tầng mây…' : 'Chào thị trấn của em!'}</strong></div>}
        {setup && <div className="pm-modal-backdrop"><section role="dialog" aria-modal="true" aria-label="Tạo vùng xây dựng" className="pm-modal"><span className="pm-modal-icon">🏡</span><h2>Chọn nơi thị trấn bắt đầu</h2><p>Một vùng riêng để nặn đất, làm đường và xây nhà. Hành tinh của em sẽ có dấu mốc dẫn đến đây.</p><div className="pm-preset-grid">{Object.entries(PRESETS).map(([id, name]) => <button key={id} className={preset === id ? 'active' : ''} disabled={generating} onClick={() => setPreset(id as Preset)}>{name}</button>)}</div><label>Mã địa hình<input aria-label="Mã địa hình" type="number" min="0" max="4294967295" value={seedInput} onChange={e => setSeedInput(e.target.value)} /></label><p className="pm-help">Cùng loại và mã sẽ tạo cùng địa hình ban đầu. Em luôn có thể nặn thêm sau đó.</p><div className="pm-row"><button className="pm-primary" disabled={generating} onClick={createMap}>{generating ? 'Đang tạo địa hình…' : 'Tạo và ghé thăm →'}</button><button disabled={generating} onClick={() => setSetup(false)}>Để sau</button></div></section></div>}
        {imported && <div className="pm-modal-backdrop"><section role="dialog" aria-modal="true" aria-label="Nhập bản sao" className="pm-modal"><h2>Nhập “{imported.doc.name}”?</h2><p>{imported.region?.buildings.length || 0} công trình. Thao tác sẽ thay thế thế giới hiện tại của hồ sơ này. Bản hiện tại được tải xuống trước khi thay thế.</p><div className="pm-row"><button className="pm-primary" onClick={acceptImport}>Xuất bản hiện tại và nhập</button><button onClick={() => setImported(null)}>Hủy</button></div></section></div>}
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={e => void handleImport(e.target.files?.[0])} />
    </main>;
}
