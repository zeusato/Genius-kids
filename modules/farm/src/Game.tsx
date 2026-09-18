import { NATURAL_VARIANTS, obstacleName, type NaturalVariant } from './core/scenery';
import { naturalAssetUrl } from './render/naturalAssets';
import {MiniTerrain} from './ui/MiniTerrain';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ASSETS, CROPS, type AssetId, type CropId } from './core/catalog';
import { expansionCost } from './core/engine';
import { homeLevel, regionCap, storageCap, usedStorage, CHAPTER_TITLES, upgradePrice, upgradeRequirements } from './core/progression';
import { previewStroke, type Tool } from './core/interaction';
import { fishPuzzle } from './core/simulation';
import { chunkNeighbors } from './core/world';
import type { FarmCommand, FarmSession, FarmState, Rotation } from './core/types';
import { parseBackup, serializeBackup } from './core/validation';
import { FarmWorld, type CameraIntent } from './render/FarmWorld';
import { AssetPreview, type Placement } from './render/FarmScene';
import { Icon } from './ui/Icon';
import { useFarm } from './ui/useFarm';
import { Dialog } from './ui/shared';
import { CatalogPicture } from './ui/CatalogPicture';
import { SeedCards } from './ui/SeedCards';
import { UpgradeResources, hasUpgradeResources } from './ui/UpgradeResources';
import { SubjectMenu } from './ui/SubjectMenu';
import { HarvestCursor, HarvestEffects, Sickle, type HarvestFlight } from './ui/HarvestEffects';
import { Panels, menus, type Panel, type Confirmation } from './ui/Panels';
import './farm.css';
export default function Game({ openSession, accountPanel, accountStatus, openAccount, onExit }: {
    openSession?: () => Promise<FarmSession>;
    accountPanel?: ReactNode;
    accountStatus?: string;
    openAccount?: boolean;
    onExit?: () => void;
} = {}) {
    const { state: s, error, busy, toast, saved, dispatch, restore, notify, exportOriginal } = useFarm(openSession);
    const [panel, setPanel] = useState<Panel>('quests'), [panelOpen, setPanelOpen] = useState(false), [selected, setSelected] = useState<string | null>(null), [tool, setTool] = useState<Tool>('select'), [seed, setSeed] = useState<CropId>('wheat'), [placement, setPlacement] = useState<Placement | null>(null), [stroke, setStroke] = useState<string[]>([]), [hover, setHover] = useState('');
    const [camera, setCamera] = useState<CameraIntent>({ serial: 0, kind: 'home' }), [quality, setQuality] = useState<'soft' | 'light'>(() => matchMedia('(max-width: 760px)').matches ? 'light' : 'soft'), [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches), [sound, setSound] = useState(false);
    const [settings, setSettings] = useState(false), [gallery, setGallery] = useState(false), [galleryAsset, setGalleryAsset] = useState<AssetId>('home'), [galleryLevel, setGalleryLevel] = useState(1), [galleryCrop, setGalleryCrop] = useState<CropId | undefined>(), [galleryStage, setGalleryStage] = useState(4), [backup, setBackup] = useState(''), [pending, setPending] = useState<FarmState | null>(null), [backupError, setBackupError] = useState('');
    const [confirm, setConfirm] = useState<Confirmation | null>(null), [map, setMap] = useState(false), [fish, setFish] = useState(false), [fishMoves, setFishMoves] = useState<number[]>([]), [fishMemory, setFishMemory] = useState(true);
    const [seedChoices, setSeedChoices] = useState(false);
    const basket = useRef<HTMLButtonElement>(null), [flights, setFlights] = useState<HarvestFlight[]>([]);
    useEffect(() => { if (openAccount) setSettings(true); }, [openAccount]);
    useEffect(() => { setStroke([]); }, [tool, seed, placement?.asset]);
    useEffect(() => { const key = (e: KeyboardEvent) => { if (!e.defaultPrevented && e.key === 'Escape') {
        setPlacement(null);
        setStroke([]);
        setTool('select');
        setSelected(null);
    } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
    function chime() { if (!sound)
        return; const ctx = new AudioContext(), o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(523, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + .15); g.gain.setValueAtTime(.035, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .25); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .26); o.onended = () => void ctx.close(); }
    async function act(c: FarmCommand) { const ok = await dispatch({ ...c, requestId: crypto.randomUUID() }); if (ok)
        chime(); return ok; }
    function cam(kind: CameraIntent['kind'], x?: number, z?: number) { setCamera(c => ({ serial: c.serial + 1, kind, x, z })); }
    function select(id: string) { setSelected(id); setPanelOpen(false); setTool('select'); setStroke([]); }
    function useTool(next: Tool) { setSeedChoices(next === 'plant'); setTool(next); setSelected(null); setPanelOpen(false); setPlacement(null); setStroke([]); }
    function openPanel(next: Panel) { useTool('select'); setPanel(next); setPanelOpen(true); }
    function begin(asset: AssetId | 'plot', moveId?: string) { const old = s?.entities.find(e => e.id === moveId); setPlacement({ asset, moveId, rotation: old?.rotation ?? 0, x: old?.x ?? 8, z: old?.z ?? 11 }); setTool('arrange'); setPanelOpen(false); setStroke([]); }
    async function place(p: Placement) { const ok = await act(p.asset === 'plot' ? { type: 'dig', x: p.x, z: p.z } : p.moveId ? { type: 'move', entityId: p.moveId, x: p.x, z: p.z, rotation: p.rotation } : { type: 'build', asset: p.asset, x: p.x, z: p.z, rotation: p.rotation }); if (ok || p.moveId)
        setPlacement(null); }
    function rotate() { setPlacement(p => p && ({ ...p, rotation: ((p.rotation + 1) % 4) as Rotation })); }
    function download(text: string, name = 'lang-mam-backup.json') { const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }
    function previewBackup(text: string) { try {
        setPending(parseBackup(text));
        setBackupError('');
    }
    catch (e) {
        setBackupError(e instanceof Error ? e.message : String(e));
    } }
    if (!s)
        return <main className="farm-root farm-loading"><Icon name="sprout" size={48}/><h1>Làng Mầm</h1><p>{error || 'Mở cánh cổng nông trại…'}</p>{error && <button onClick={() => location.reload()}>Tải lại</button>}{onExit && <button onClick={onExit}>Về trò chơi</button>}</main>;
    const level = homeLevel(s), entity = s.entities.find(e => e.id === selected), plot = s.plots.find(p => p.id === selected), obstacle = s.world.obstacles.find(o => o.id === selected), bridge = s.world.bridges.find(b => b.id === selected);
    const chapter = Array.from({ length: 25 }, (_, i) => i + 1).find(n => !s.claimed.includes(`chapter:${n}`)) ?? 25, home = s.entities.find(e => e.asset === 'home')!, preview = ['plant', 'water', 'harvest'].includes(tool) ? previewStroke(s, tool as 'plant' | 'water' | 'harvest', seed, stroke) : null;
    const selectedTitle = entity ? ASSETS[entity.asset].name : plot ? plot.crop ? CROPS[plot.crop].name : 'Luống đất trống' : obstacle ? obstacleName(s.world, obstacle) : bridge ? 'Cầu qua sông' : menus.find(m => m.id === panel)!.label;
    const upgradeId = confirm?.command.type === 'upgrade' ? confirm.command.entityId : null;
    const upgradeEntity = upgradeId ? s.entities.find(e => e.id === upgradeId) : undefined;
    const pendingPrice = upgradeEntity && upgradeEntity.level < 25 ? upgradePrice(upgradeEntity) : null;
    const pendingRequirements = upgradeEntity ? upgradeRequirements(s, upgradeEntity) : [];
    const upgradeBlocked = !!upgradeId && (!pendingPrice || !!pendingRequirements.length || !hasUpgradeResources(s, pendingPrice));
    const auxiliaryModal = settings || gallery || !!confirm || map || fish || seedChoices;
    const modal = auxiliaryModal || panelOpen;
    return <main className={`farm-root ${tool === 'harvest' ? 'harvesting' : ''}`}>
 <div inert={modal || undefined} className="farm-play">
 <header className="farm-header"><div className="farm-brand">{onExit && <button className="farm-exit" aria-label="Về danh sách trò chơi" title="Về trò chơi" onClick={onExit}><Icon name="left"/></button>}<span><Icon name="sprout" size={29}/></span><div><b>Làng Mầm</b><small>MỘT GÓC BÌNH YÊN</small></div></div><div className="farm-overview"><button onClick={() => { select(home.id); cam('focus', home.x, home.z); }}><Icon name="home"/><span>Nhà chính <b>{level}/25</b></span></button><span className="farm-coins"><Icon name="coins"/><b>{s.coins.toLocaleString('vi-VN')}</b><small>xu</small></span><button ref={basket} aria-label="Mở kho hàng" onClick={() => openPanel('inventory')}><Icon name="basket"/><span>{usedStorage(s)}/{storageCap(s)}</span></button></div><div className="farm-header-actions">{accountPanel && <button className="farm-account-button" onClick={() => setSettings(true)}><Icon name="home" size={17}/><span>{accountStatus}</span></button>}<small className={error ? 'farm-warning' : 'farm-save'}>{error ? 'Lưu cần kiểm tra' : saved ? 'Đã lưu trên máy' : 'Đang lưu…'}</small><button aria-label="Xưởng tài nguyên" onClick={() => setGallery(true)}><Icon name="eye"/></button><button aria-label="Cài đặt và sao lưu" onClick={() => setSettings(true)}><Icon name="settings"/></button></div></header>
 {error && <div className="farm-error" role="alert">{error}<button onClick={() => location.reload()}>Tải bản mới nhất</button></div>}
 <div className="farm-layout"><section className="farm-world" aria-label="Nông trại">
 {!gallery && <FarmWorld state={s} selected={selected} placement={placement} tool={tool} seed={seed} quality={quality} reduced={reduced} camera={camera} onSelect={select} onDeselect={() => setSelected(null)} subjectMenu={selected && !panelOpen ? <SubjectMenu s={s} id={selected} busy={busy || !!error} tool={useTool} details={() => setPanelOpen(true)} move={() => { if (entity) begin(entity.asset, entity.id); }} close={() => setSelected(null)}/> : null} onPosition={(x, z) => setPlacement(p => p && ({ ...p, x, z }))} onMoveStart={id => { const e = s.entities.find(e => e.id === id); if (e)
        begin(e.asset, id); }} onPlace={place} onRotate={rotate} onCancel={() => { setPlacement(null); setStroke([]); setTool('select'); }} onPreview={setStroke} onHover={setHover} stroke={stroke} onStroke={async (ids, revision, origins) => {
        if (!['plant', 'water', 'harvest'].includes(tool) || busy || error) return;
        const action = tool as 'plant' | 'water' | 'harvest', p = previewStroke(s, action, seed, ids);
        if (!p.accepted.length) { if (p.skipped.length) notify(p.skipped[0].reason); return; }
        const rewards: HarvestFlight[] = action === 'harvest' ? p.accepted.flatMap((id, index) => {
            const plot = s.plots.find(v => v.id === id), point = origins.find(v => v.id === id);
            return plot?.crop && point ? [{ key: crypto.randomUUID(), crop: plot.crop, quantity: CROPS[plot.crop].yield, x: point.x, y: point.y, delay: Math.min(index * 45, 450) }] : [];
        }) : [];
        if (await act({ type: 'batch', action, plotIds: p.accepted, crop: seed, expectedRevision: revision })) setFlights(f => [...f, ...rewards]);
    }}/>}
 <div className="farm-world-heading"><span>{s.world.biome === 'forest' ? 'RỪNG VEN SUỐI' : s.world.biome === 'stone' ? 'THUNG LŨNG ĐÁ' : 'ĐỒI QUẶNG'}</span><h1>{CHAPTER_TITLES[chapter - 1]}</h1><button onClick={() => { setSelected(null); setPanel('quests'); setPanelOpen(true); }}>Chương {chapter} · Xem mục tiêu <Icon name="next" size={15}/></button></div>
 <div className="farm-camera-controls"><button aria-label="Phóng to" onClick={() => cam('zoom-in')}>+</button><button aria-label="Thu nhỏ" onClick={() => cam('zoom-out')}>−</button><button aria-label="Về Nhà chính" onClick={() => cam('home')}><Icon name="home"/></button><button aria-label="Ngắm toàn thung lũng" onClick={() => { cam('overview'); setPanelOpen(false); }}>◇</button>{import.meta.env.DEV && new URLSearchParams(location.search).has('lab') && <button aria-label="Xem khu trưng bày" onClick={() => { cam('district'); setPanelOpen(false); }}>▦</button>}<button aria-label="Bản đồ tổng quan" onClick={() => setMap(true)}><Icon name="expand"/></button></div>
 <div className="farm-world-bottom"><div className="farm-feedback" aria-live="polite">{stroke.length && preview ? <span>{preview.accepted.length} ô hợp lệ · {preview.cost ? `${preview.cost} xu` : preview.quantity ? `+${preview.quantity} hàng` : 'Tưới cây'}{preview.skipped.length ? ` · Bỏ qua ${preview.skipped.length}: ${preview.skipped[0].reason}` : ''}</span> : toast ? <span role="status">{toast}</span> : hover && !placement ? <span>{hover}</span> : placement ? <span>{placement.asset === 'plot' ? 'Luống mới' : ASSETS[placement.asset].name} · kéo hoặc chạm đất để đặt</span> : null}</div>
 {tool === 'plant' && <button className="farm-seed-current" onClick={() => setSeedChoices(true)} aria-label="Đổi giống đang gieo"><CatalogPicture crop={seed}/><span><b>{CROPS[seed].name}</b><small>{CROPS[seed].seed} xu / ô · Đổi giống</small></span><Icon name="next"/></button>}
 {tool !== 'select' && !placement && <div className="farm-held-tool">{tool === 'harvest' ? <Sickle/> : <Icon name={tool === 'plant' ? 'sprout' : tool === 'water' ? 'water' : 'move'}/>}<span><b>{tool === 'harvest' ? 'Liềm thu hoạch' : tool === 'plant' ? 'Túi hạt giống' : tool === 'water' ? 'Bình tưới' : 'Sắp xếp nông trại'}</b><small>Kéo qua các luống · thả tay để hoàn tất</small></span><button onClick={() => useTool('select')}>Cất dụng cụ <span aria-hidden="true">×</span></button></div>}
 {s.undo && tool === 'arrange' && <button onClick={() => act({ type: 'undo' })}>↶ Hoàn tác bố trí</button>}
 <nav className="farm-dock" aria-label="Hoạt động nông trại">{menus.map(m => <button key={m.id} aria-pressed={panel === m.id && panelOpen && !selected} onClick={() => openPanel(m.id)}><Icon name={m.icon}/><span>{m.label}</span></button>)}</nav></div>
 <span className="farm-controls-hint">Chạm vật thể để thao tác · Space + kéo: xem vườn · Cuộn / chụm hai ngón: zoom</span>
 </section>
 </div></div>
 {panelOpen && !auxiliaryModal && <Dialog title={selectedTitle} wide onClose={() => { setPanelOpen(false); setSelected(null); }}>
 {!selected && <nav className="farm-window-tabs" aria-label="Sổ nông trại">{menus.map(m => <button key={m.id} aria-pressed={panel === m.id} onClick={() => setPanel(m.id)}><Icon name={m.icon}/>{m.label}</button>)}</nav>}
 <div className={`farm-panel-body farm-window-page farm-page-${selected ? 'subject' : panel}`}><Panels key={selected ?? panel} s={s} panel={panel} selected={selected} busy={busy || !!error} act={act} confirm={setConfirm} select={id => { select(id); setPanelOpen(true); const e = s.entities.find(e => e.id === id); if (e)
        cam('focus', e.x, e.z); }} begin={begin} map={() => setMap(true)} plant={id => { if (id)
        setSeed(id); setSeedChoices(!id); setSelected(null); setTool('plant'); setPanelOpen(false); }} fish={() => { setFish(true); setFishMoves([]); setFishMemory(true); }}/></div></Dialog>}
 {seedChoices && <Dialog title="Chọn hạt giống" wide onClose={() => setSeedChoices(false)}><p className="farm-seed-intro">Chọn cây cho mùa mới. Hạt giống chỉ được trừ xu khi gieo xuống luống.</p><SeedCards level={level} selected={seed} choose={id => { setSeed(id); setSeedChoices(false); setTool('plant'); setSelected(null); setPanelOpen(false); }}/></Dialog>}
 {tool === 'harvest' && !modal && <HarvestCursor/>}
 <HarvestEffects flights={flights} basket={basket} reduced={reduced} done={key => setFlights(f => f.filter(v => v.key !== key))}/>

 {settings && <Dialog title="Cài đặt & bản sao" onClose={() => setSettings(false)}>{accountPanel ?? <p className="farm-note">Sân thử lưu riêng, không đồng bộ tài khoản. <a href="./">Mở nông trại chính</a></p>}<label className="farm-setting">Đồ họa<select value={quality} onChange={e => setQuality(e.target.value as 'soft' | 'light')}><option value="soft">Ánh sáng mềm</option><option value="light">Nhẹ · tắt bóng</option></select></label><label className="farm-setting">Giảm chuyển động<input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)}/></label><label className="farm-setting">Âm thanh thao tác<input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)}/></label><button className="farm-primary" onClick={() => download(serializeBackup(s))}>Xuất bản sao hiện tại</button>{s.migrationNotes.length > 0 && <button onClick={async () => { const text = await exportOriginal(); if (text)
        download(text, 'lang-mam-original-v1.json');
    else
        notify('Bản nguyên gốc chưa được ghi. Chờ lần lưu kế rồi thử lại.'); }}>Xuất bản gốc trước nâng cấp</button>}<label>Nhập bản sao JSON<input type="file" accept=".json,application/json" onChange={e => { const f = e.target.files?.[0]; if (f)
        void f.text().then(text => { setBackup(text); previewBackup(text); }); }}/></label><details><summary>Nhập từ nội dung JSON</summary><textarea aria-label="Nội dung bản sao" value={backup} onChange={e => setBackup(e.target.value)}/><button onClick={() => previewBackup(backup)}>Xem trước bản nhập</button></details>{backupError && <p role="alert" className="farm-warning">{backupError}</p>}{pending && <section className="farm-card"><h3>Xác nhận thay bản đang chơi</h3><p>Nhà chính {homeLevel(pending)} · {pending.coins} xu · {pending.plots.length} ruộng.</p><button onClick={async () => { download(serializeBackup(s), 'lang-mam-before-import.json'); await restore(pending); setPending(null); }}>Xuất bản hiện tại rồi nhập bản này</button><button onClick={() => setPending(null)}>Hủy nhập</button></section>}{s.migrationNotes.map(n => <p key={n}>{n}</p>)}{import.meta.env.DEV && s.world.version === 1 && <section className="farm-card"><h3>Thung lũng mới</h3><p>Vườn này giữ địa hình đã lưu. Có thể xem bản đồ mới trong sân thử riêng.</p><button onClick={() => { location.href = '?lab=qa'; }}>Mở sân thử thung lũng</button></section>}<p className="farm-note">Nghỉ chơi không làm mất cây hay hàng. Bản sao JSON giúp giữ thêm một bản dự phòng.</p></Dialog>}
 {confirm && <Dialog title={confirm.title} onClose={() => setConfirm(null)}><p>{confirm.body}</p>{pendingPrice && <UpgradeResources state={s} cost={pendingPrice}/>}<div>{pendingRequirements.map((requirement, i) => <p key={i} className="farm-warning">Cần: {requirement}</p>)}</div><button className="farm-primary" disabled={busy || upgradeBlocked} onClick={async () => { if (await act(confirm.command))
        setConfirm(null); }}>Xác nhận</button><button onClick={() => setConfirm(null)}>Để sau</button>{toast && <p role="status">{toast}</p>}</Dialog>}
 {gallery && <Dialog title="Xưởng tài nguyên" onClose={() => setGallery(false)}><div className="farm-gallery-canvas"><AssetPreview asset={galleryAsset} level={galleryLevel} crop={galleryCrop} stage={galleryStage} reduced={reduced}/></div><details><summary>Cây và đá · 14 mẫu cố định</summary><p>Cây, đá tự nhiên không xoay. Mỗi mẫu có hình riêng, phân bố theo địa hình.</p><div className="farm-natural-gallery">{(Object.keys(NATURAL_VARIANTS) as NaturalVariant[]).map(id => <figure key={id}><img src={naturalAssetUrl(id)} alt={NATURAL_VARIANTS[id].label}/><figcaption>{NATURAL_VARIANTS[id].label}</figcaption></figure>)}</div></details><label>Công trình<select value={galleryAsset} onChange={e => { setGalleryAsset(e.target.value as AssetId); setGalleryCrop(undefined); }}>{Object.entries(ASSETS).map(([id, a]) => <option key={id} value={id}>{a.name}</option>)}</select></label><label>Cấp<input type="range" min={1} max={25} value={galleryLevel} onChange={e => setGalleryLevel(Number(e.target.value))}/> {galleryLevel}</label><label>Cây<select value={galleryCrop ?? ''} onChange={e => setGalleryCrop(e.target.value ? e.target.value as CropId : undefined)}><option value="">Xem công trình</option>{Object.entries(CROPS).map(([id, c]) => <option key={id} value={id}>{c.name}</option>)}</select></label>{galleryCrop && <label>Giai đoạn<input type="range" min={0} max={4} value={galleryStage} onChange={e => setGalleryStage(Number(e.target.value))}/></label>}</Dialog>}
 {map && <Dialog title="Bản đồ tổng quan" onClose={() => setMap(false)}><p>{s.world.owned.length}/{regionCap(s)} khu · nhận khu kế {expansionCost(s)} xu. Sương tan khi nhận thêm khu đất. Chọn khu đã có để đưa camera tới.</p>{s.world.version === 2 && <div className="farm-tabs">{[{ label: 'Ngắm bờ hồ', x: 27, z: 42 }, { label: 'Ngắm rừng', x: 14, z: 56 }, { label: 'Ngắm cao nguyên', x: 79, z: 29 }].map(v => <button key={v.label} onClick={() => { cam('focus', v.x, v.z); setMap(false); setPanelOpen(false); }}>{v.label}</button>)}</div>}<div className="farm-minimap">{Array.from({ length: 36 }, (_, i) => { const owned = s.world.owned.includes(i), adjacent = chunkNeighbors(i).some(id => s.world.owned.includes(id)); return <button key={i} className={owned ? 'owned' : adjacent ? 'available' : ''} aria-label={`Khu ${i + 1} ${owned ? 'đã có' : adjacent ? 'liền kề' : 'chưa tiếp cận'}`} disabled={!owned && !adjacent} onClick={() => { if (owned) {
        cam('focus', i % 6 * 16 + 8, Math.floor(i / 6) * 16 + 8);
        setMap(false);
    }
    else {
        setMap(false);
        setConfirm({ title: `Nhận khu ${i + 1}`, body: `${expansionCost(s)} xu. Vật cản có chi phí khai phá riêng.`, command: { type: 'expand', chunk: i } });
    } }}><MiniTerrain world={s.world} chunk={i}/><b>{owned ? '✓' : adjacent ? '+' : '·'}</b><small>{i + 1}</small></button>; })}</div><p className="farm-note">Xanh lam: nước · nâu: cao nguyên · vạch vàng: vị trí cầu. Mỗi ô lớn là một khu đất; cần đường đi hoặc cầu để mở sang bờ bên kia.</p></Dialog>}
 {fish && <Dialog title="Nhịp câu bên hồ" onClose={() => setFish(false)}><p>Nhớ sáu hướng gợn nước, rồi chọn lại đúng thứ tự. Trò phụ, không bắt buộc để phát triển trại.</p>{fishMemory ? <><div className="farm-fish-pattern">{fishPuzzle(s.world.seed, s.fishing.round).map((v, i) => <span key={i}>{['←', '↓', '→'][v]}</span>)}</div><button className="farm-primary" onClick={() => setFishMemory(false)}>Đã nhớ · bắt đầu</button></> : <><p>Đã chọn {fishMoves.length}/6</p><div className="farm-fish-pattern">{[0, 1, 2].map(v => <button key={v} disabled={fishMoves.length >= 6} onClick={() => setFishMoves(a => [...a, v])}>{['←', '↓', '→'][v]}</button>)}</div><button disabled={fishMoves.length !== 6} onClick={async () => { await act({ type: 'fish', moves: fishMoves, round: s.fishing.round }); setFish(false); }}>Kéo cần</button></>}<small>Đúng ít nhất 5/6: thưởng 1 cá mỗi kỳ chợ. Luyện tiếp miễn phí.</small></Dialog>}
 </main>;
}

