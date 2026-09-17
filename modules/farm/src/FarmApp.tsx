import { useEffect, useState } from 'react';
import { ASSETS, CROPS, ITEMS, LEVEL_XP, ORDERS, QUESTS, RECIPES, levelOf, type AssetId, type CropId, type ItemId, type RecipeId } from './core/catalog';
import { boundsOf, dimensions, expansionCost, growthStage, placementError, progressOf, upgradeCost } from './core/engine';
import type { FarmSession, FarmState, Rotation } from './core/types';
import { parseBackup, serializeBackup } from './core/validation';
import { AssetPreview, FarmScene, type Placement } from './render/FarmScene';
import { CropIcon, Icon, type IconName } from './ui/Icon';
import { useFarm } from './ui/useFarm';
import './farm.css';

type Panel = 'garden' | 'shop' | 'inventory' | 'journal' | 'orders';
const tabs: { id: Panel; label: string; icon: IconName }[] = [{ id: 'garden', label: 'Khu vườn', icon: 'sprout' }, { id: 'shop', label: 'Cửa hàng', icon: 'store' }, { id: 'inventory', label: 'Kho hàng', icon: 'basket' }, { id: 'orders', label: 'Đơn hàng', icon: 'package' }, { id: 'journal', label: 'Nhật ký', icon: 'book' }];
const duration = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return s < 60 ? `${s} giây` : `${Math.floor(s / 60)} phút ${s % 60} giây`; };
const assetIcon = (id: AssetId): IconName => ASSETS[id].kind === 'building' ? id === 'barn' ? 'tractor' : 'home' : id === 'flowers' || id === 'arch' ? 'flower' : 'leaf';
function revealMobile(section: 'world' | 'panel', reduced: boolean) {
  if (window.innerWidth > 720) return;
  requestAnimationFrame(() => document.querySelector(`.farm-${section}`)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' }));
}

export default function FarmApp({ openSession }: { openSession?: () => Promise<FarmSession> } = {}) {
  const { state, error, busy, toast, saved, dispatch, restore, notify } = useFarm(openSession);
  const [panel, setPanel] = useState<Panel>('garden'), [selected, setSelected] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null), [seed, setSeed] = useState<CropId>('wheat');
  const [quality, setQuality] = useState<'soft' | 'light'>('soft'), [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [cameraReset, setCameraReset] = useState(0), [settings, setSettings] = useState(false), [gallery, setGallery] = useState(false);
  const [galleryAsset, setGalleryAsset] = useState<AssetId>('bakery'), [galleryLevel, setGalleryLevel] = useState(1), [galleryCrop, setGalleryCrop] = useState<CropId | undefined>();
  const [galleryStage, setGalleryStage] = useState(4), [backup, setBackup] = useState(''), [pendingRestore, setPendingRestore] = useState<FarmState | null>(null), [backupError, setBackupError] = useState('');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPlacement(null); setSettings(false); setPendingRestore(null); setGallery(false); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!settings && !gallery && !pendingRestore) return;
    const previous = document.activeElement as HTMLElement | null, oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = document.querySelector<HTMLElement>(pendingRestore ? '[role="alertdialog"]' : gallery ? '.farm-gallery' : '.farm-modal');
    const focusable = () => [...(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea, select, summary, a[href]') ?? [])].filter(el => el.getClientRects().length);
    focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusable(), first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', trap); previous?.focus(); };
  }, [settings, gallery, pendingRestore]);
  if (!state) return <main className="farm-root farm-loading"><Icon name="sprout" size={50} /><h1>Làng Mầm</h1><p>{error || 'Mở cánh cổng khu vườn…'}</p>{error && <button onClick={() => location.reload()}>Thử tải lại</button>}</main>;
  const level = levelOf(state.xp), plot = state.plots.find(p => p.id === selected), entity = state.entities.find(e => e.id === selected);
  const readyPlots = state.plots.filter(p => p.crop && p.readyAt! <= state.clock), readyJobs = state.entities.filter(e => e.job && e.job.readyAt <= state.clock);
  const earned = QUESTS.filter(q => !state.claimed.includes(q.id) && state.stats[q.stat] >= q.target).length;
  const order = ORDERS[state.orderIndex % ORDERS.length];
  const canDeliver = Object.entries(order.need).every(([id, n]) => state.inventory[id as ItemId] >= n!);
  const [pw, pd] = placement && placement.asset !== 'plot' ? dimensions(placement.asset, placement.rotation) : [1, 1];
  const placementProblem = placement ? placementError(state, placement.x, placement.z, pw, pd, placement.moveId) : null;
  const xpStart = LEVEL_XP[level - 1], xpEnd = LEVEL_XP[level] ?? xpStart;
  function choose(id: string) { if (placement) { notify('Chọn một ô đất trống để đặt, hoặc dùng các nút mũi tên.'); return; } setSelected(id); setPanel('garden'); revealMobile('panel', reduced); }
  function beginPlacement(asset: AssetId | 'plot', moveId?: string) {
    const old = state!.entities.find(e => e.id === moveId);
    setPlacement({ asset, moveId, rotation: old?.rotation ?? 0, x: old?.x ?? 8, z: old?.z ?? 10 }); setPanel('garden'); revealMobile('world', reduced);
  }
  async function place() {
    if (!placement) return;
    const p = placement;
    const ok = await dispatch(p.asset === 'plot' ? { type: 'dig', x: p.x, z: p.z } : p.moveId ? { type: 'move', entityId: p.moveId, x: p.x, z: p.z, rotation: p.rotation } : { type: 'build', asset: p.asset, x: p.x, z: p.z, rotation: p.rotation });
    if (ok) { setPlacement(null); setSelected(p.moveId ?? null); }
  }
  function downloadBackup() {
    const text = serializeBackup(state!), url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'lang-mam-backup.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); setBackup(text);
  }
  function previewBackup(text = backup) { try { setPendingRestore(parseBackup(text)); setBackupError(''); } catch (e) { setBackupError(e instanceof Error ? e.message : 'Tệp chưa hợp lệ.'); } }
  return <main className="farm-root">
    <header className="farm-header"><div className="farm-brand"><span className="farm-brand-mark"><Icon name="sprout" size={29} /></span><div><span className="farm-wordmark">Làng Mầm</span><small>MỘT GÓC BÌNH YÊN</small></div><span className="farm-lab-badge">BẢN THỬ RIÊNG</span></div>
      <div className="farm-header-actions"><span className="farm-save"><span className={`farm-save-dot ${error ? 'error' : ''}`} />{error ? 'Cần kiểm tra lưu' : saved ? 'Đã lưu trên máy' : 'Đang lưu…'}</span><button className="farm-subtle" aria-label="Mẫu 3D" onClick={() => setGallery(true)}><Icon name="eye" /><span>Mẫu 3D</span></button><button className="farm-icon-button" aria-label="Cài đặt và bản sao lưu" onClick={() => setSettings(true)}><Icon name="settings" /></button></div>
    </header>
    <div className="farm-statusbar"><div className="farm-level"><span className="farm-level-medallion">{level}</span><div><b>Người làm vườn {level < 3 ? 'tập sự' : 'khéo tay'}</b><div className="farm-xp-track" role="progressbar" aria-label="Kinh nghiệm lên cấp" aria-valuenow={state.xp} aria-valuemin={xpStart} aria-valuemax={xpEnd || state.xp}><span style={{ width: `${xpEnd === xpStart ? 100 : (state.xp - xpStart) / (xpEnd - xpStart) * 100}%` }} /></div><small>{xpEnd === xpStart ? 'Đạt mốc cao nhất bản thử' : `${state.xp} / ${xpEnd} kinh nghiệm`}</small></div></div>
      <div className="farm-weather"><Icon name="sun" size={25} /><span>Một ngày đẹp trời<small>Cứ thong thả, cây chín sẽ đợi em.</small></span></div>
      <div className="farm-wallet"><span className="farm-coin"><Icon name="coins" size={22} /></span><strong aria-label="Số xu">{state.coins.toLocaleString('vi-VN')}</strong><span>xu nông trại</span></div>
    </div>
    {error && <div className="farm-error" role="alert">{error}<button onClick={() => location.reload()}>Tải bản mới nhất</button></div>}
    <div className="farm-layout">
      <section className="farm-world" aria-label="Bản đồ nông trại">
        {!gallery && <FarmScene state={state} selected={selected} placement={placement} onSelect={choose} onPosition={(x, z) => { setPlacement(p => p && { ...p, x, z }); revealMobile('panel', reduced); }} quality={quality} reduced={reduced} cameraReset={cameraReset} />}
        <div className="farm-world-heading"><span className="farm-eyebrow">KHU VƯỜN CỦA EM</span><h1>Mùa vui bắt đầu<br />từ một hạt mầm.</h1></div>
        <div className="farm-world-controls"><button aria-label="Đưa camera về giữa vườn" title="Về giữa vườn" onClick={() => setCameraReset(v => v + 1)}><Icon name="expand" /></button><button aria-label="Bật hoặc tắt bóng đổ" title="Đổi chất lượng hình ảnh" onClick={() => setQuality(v => v === 'soft' ? 'light' : 'soft')}><Icon name="sun" /></button></div>
        <div className="farm-world-note"><span><Icon name={placement ? 'move' : 'help'} size={16} />{placement ? 'Chạm đất trống để chọn chỗ • Xác nhận ở bảng bên cạnh' : 'Chạm để chăm vườn · Kéo để xem · Cuộn / chụm để phóng to'}</span></div>
        <nav className="farm-dock" aria-label="Hoạt động nông trại">{tabs.map(t => <button key={t.id} className={panel === t.id ? 'active' : ''} onClick={() => { setPanel(t.id); setPlacement(null); revealMobile('panel', reduced); }} aria-pressed={panel === t.id}><Icon name={t.icon} size={23} /><span>{t.label}</span>{t.id === 'journal' && earned > 0 && <i>{earned}</i>}</button>)}</nav>
      </section>
      <aside className="farm-panel" aria-label={tabs.find(t => t.id === panel)!.label}>
        <div className="farm-panel-top"><button className="farm-mobile-map farm-subtle" onClick={() => revealMobile('world', reduced)}><Icon name="up" size={16} />Xem vườn</button><span className="farm-eyebrow">{panel === 'garden' ? 'CHẬM MỘT CHÚT, VUI NHIỀU HƠN' : 'CHUYỆN TRONG VƯỜN'}</span><h2>{placement ? 'Sắp một góc mới' : panel === 'garden' && plot ? 'Luống nhỏ của em' : panel === 'garden' && entity ? ASSETS[entity.asset].name : tabs.find(t => t.id === panel)!.label}</h2></div>
        <div className="farm-panel-body">
          {panel === 'garden' && placement && <>
            <div className="farm-feature-icon"><Icon name={placement.asset === 'plot' ? 'sprout' : assetIcon(placement.asset)} size={45} /></div><h3>{placement.asset === 'plot' ? 'Luống đất mới' : ASSETS[placement.asset].name}</h3><p>{placement.moveId ? 'Di chuyển miễn phí. Công việc đang làm vẫn được giữ.' : placement.asset === 'plot' ? '15 xu · thêm chỗ trồng cây' : `${ASSETS[placement.asset].price} xu · ${pw} × ${pd} ô đất`}</p>
            <div className="farm-placement-controls"><button aria-label="Dịch sang trái" onClick={() => setPlacement({ ...placement, x: placement.x - 1 })}><Icon name="left" /></button><button aria-label="Dịch lên trên" onClick={() => setPlacement({ ...placement, z: placement.z - 1 })}><Icon name="up" /></button><button aria-label="Dịch xuống dưới" onClick={() => setPlacement({ ...placement, z: placement.z + 1 })}><Icon name="down" /></button><button aria-label="Dịch sang phải" onClick={() => setPlacement({ ...placement, x: placement.x + 1 })}><Icon name="right" /></button></div>
            <button className="farm-secondary farm-full" onClick={() => setPlacement({ ...placement, rotation: ((placement.rotation + 1) % 4) as Rotation })}><Icon name="rotate" />Xoay 90°</button>
            <p className={placementProblem ? 'farm-warning' : 'farm-success'} aria-live="polite">{placementProblem || `Chỗ này vừa đẹp · ô ${placement.x + 1}, ${placement.z + 1}`}</p>
            <button className="farm-primary farm-full" disabled={!!placementProblem || busy || !!error} onClick={place}><Icon name="check" />{placement.moveId ? 'Chuyển tới đây' : 'Đặt ở đây'}</button><button className="farm-subtle farm-full" onClick={() => setPlacement(null)}>Để sau</button>
          </>}
          {panel === 'garden' && !placement && plot && <>
            <div className="farm-crop-card"><CropIcon id={plot.crop ?? seed} size={72} /><div><h3>{plot.crop ? CROPS[plot.crop].name : 'Đất đã sẵn sàng'}</h3><p>{plot.crop ? growthStage(plot, state.clock) === 4 ? 'Đến mùa thu hoạch rồi!' : 'Một chút kiên nhẫn, một chút yêu thương.' : 'Chọn một hạt giống cho vụ mới.'}</p></div></div>
            {plot.crop ? <>
              <div className="farm-progress"><span style={{ width: `${progressOf(plot.plantedAt!, plot.readyAt!, state.clock) * 100}%` }} /></div><p className="farm-progress-caption">{state.clock >= plot.readyAt! ? `Thu được ${CROPS[plot.crop].yield} ${CROPS[plot.crop].name.toLowerCase()}` : `Còn ${duration(plot.readyAt! - state.clock)}`}</p>
              <button className="farm-primary farm-full" disabled={busy || !!error || state.clock < plot.readyAt!} onClick={() => dispatch({ type: 'harvest', plotId: plot.id })}><Icon name="basket" />Thu hoạch</button>
              {state.clock < plot.readyAt! && <button className="farm-secondary farm-full" disabled={busy || !!error || plot.watered} onClick={() => dispatch({ type: 'water', plotId: plot.id })}><Icon name="water" />{plot.watered ? 'Đã tưới hôm nay' : 'Tưới nước · nhanh hơn 10%'}</button>}
            </> : <>
              <div className="farm-seeds">{(Object.keys(CROPS) as CropId[]).map(id => <button key={id} className={seed === id ? 'selected' : ''} aria-pressed={seed === id} disabled={level < CROPS[id].level} onClick={() => setSeed(id)}><CropIcon id={id} size={36} /><b>{CROPS[id].name}</b><small>{level < CROPS[id].level ? `Mở cấp ${CROPS[id].level}` : `${CROPS[id].seed} xu · ${CROPS[id].seconds}s`}</small></button>)}</div>
              <button className="farm-primary farm-full" disabled={busy || !!error || state.coins < CROPS[seed].seed || level < CROPS[seed].level} onClick={() => dispatch({ type: 'plant', plotId: plot.id, crop: seed })}><Icon name="sprout" />Gieo {CROPS[seed].name.toLowerCase()} · {CROPS[seed].seed} xu</button>
            </>}
            <button className="farm-subtle farm-full" onClick={() => setSelected(null)}>Về khu vườn</button>
          </>}
          {panel === 'garden' && !placement && entity && <>
            <div className="farm-feature-icon"><Icon name={assetIcon(entity.asset)} size={42} /></div><span className="farm-pill">{ASSETS[entity.asset].kind === 'building' ? `CÔNG TRÌNH CẤP ${entity.level}` : 'GÓC TRANG TRÍ'}</span><p>{ASSETS[entity.asset].description}</p>
            {entity.job ? <div className="farm-job"><b>{RECIPES[entity.job.recipe].name}</b><div className="farm-progress"><span style={{ width: `${progressOf(entity.job.startedAt, entity.job.readyAt, state.clock) * 100}%` }} /></div><p>{entity.job.readyAt <= state.clock ? 'Sản phẩm đang chờ em nhận.' : `Còn ${duration(entity.job.readyAt - state.clock)}`}</p><button className="farm-primary farm-full" disabled={busy || !!error || entity.job.readyAt > state.clock} onClick={() => dispatch({ type: 'collect', entityId: entity.id })}><Icon name="basket" />Nhận sản phẩm</button></div> : Object.entries(RECIPES).filter(([, r]) => r.building === entity.asset).map(([id, r]) => {
              const missing = Object.entries(r.inputs).some(([item, n]) => state.inventory[item as ItemId] < n!);
              return <div className="farm-recipe" key={id}><div><b>{r.name}</b><small>{Object.entries(r.inputs).map(([item, n]) => `${n} ${ITEMS[item as ItemId].name.toLowerCase()} (${state.inventory[item as ItemId]})`).join(' + ')}</small><span>{Math.round(r.seconds * (1 - (entity.level - 1) * .15))} giây · {r.quantity} sản phẩm</span></div><button aria-label={r.name} disabled={busy || !!error || missing || entity.level < r.buildingLevel} onClick={() => dispatch({ type: 'produce', entityId: entity.id, recipe: id as RecipeId })}>{entity.level < r.buildingLevel ? `Cấp ${r.buildingLevel}` : missing ? 'Thiếu hàng' : 'Bắt đầu'}</button></div>;
            })}
            <div className="farm-divider" /><button className="farm-secondary farm-full" onClick={() => beginPlacement(entity.asset, entity.id)}><Icon name="move" />Chuyển vị trí</button>
            {ASSETS[entity.asset].kind === 'building' && entity.level < 3 && <button className="farm-secondary farm-full" disabled={busy || !!error || level < entity.level + 1 || state.coins < upgradeCost(entity)} onClick={() => dispatch({ type: 'upgrade', entityId: entity.id })}><Icon name="hammer" />{level < entity.level + 1 ? `Nâng cấp khi vườn đạt cấp ${entity.level + 1}` : `Nâng cấp · ${upgradeCost(entity)} xu`}</button>}
            <button className="farm-subtle farm-full" onClick={() => setSelected(null)}>Về khu vườn</button>
          </>}
          {panel === 'garden' && !placement && !plot && !entity && <>
            <div className="farm-greeting"><span><Icon name="sun" size={38} /></span><h3>Vườn nhỏ,<br />niềm vui lớn.</h3><p>{state.stats.harvest === 0 ? 'Bà An để dành vài luống chín làm quà. Thu hoạch vụ đầu rồi gieo những hạt giống của riêng em nhé.' : 'Mỗi luống cây, mỗi góc hiên đều có một câu chuyện của riêng em.'}</p></div>
            <button className="farm-ready-card" disabled={!readyPlots.length && !readyJobs.length} onClick={() => choose(readyPlots[0]?.id ?? readyJobs[0]?.id)}><span className="farm-round-icon"><Icon name="basket" size={25} /></span><span><b>{readyPlots.length} luống đã chín</b><small>{readyJobs.length ? `${readyJobs.length} mẻ sản phẩm cũng đang chờ` : 'Cây chín sẽ đợi, không héo khi vắng nhà'}</small></span><Icon name="next" /></button>
            <h4 className="farm-section-label">GHÉ THĂM CÔNG TRÌNH</h4><div className="farm-building-list">{state.entities.filter(e => ASSETS[e.asset].kind === 'building').map(e => <button key={e.id} onClick={() => choose(e.id)}><span className="farm-small-icon"><Icon name={assetIcon(e.asset)} /></span><span><b>{ASSETS[e.asset].name}</b><small>{e.job ? e.job.readyAt <= state.clock ? 'Sẵn sàng nhận' : 'Đang làm việc' : `Cấp ${e.level} · Đang nghỉ`}</small></span><Icon name="next" size={16} /></button>)}</div>
            <details className="farm-plot-list"><summary>Chọn luống cây ({state.plots.length})</summary><div>{state.plots.map((p, i) => <button key={p.id} onClick={() => choose(p.id)}>Luống {i + 1} · {p.crop ? CROPS[p.crop].name : 'Đất trống'}</button>)}</div></details>
            <button className="farm-secondary farm-full" onClick={() => beginPlacement('plot')}><Icon name="plus" />Thêm luống · 15 xu</button>
            <p className="farm-small-note">Sắp mở: {level < 2 ? 'ngô, đèn vườn và công trình cấp 2' : level < 3 ? 'bí đỏ, cổng hoa và thêm đất mới' : 'nâng cấp và những góc vườn mới'}.</p>
          </>}
          {panel === 'inventory' && <><p>Nông sản để bán, làm bánh hoặc giao cho hàng xóm. Chọn bán từng món để giữ lại nguyên liệu cần dùng.</p>{(Object.keys(ITEMS) as ItemId[]).map(id => <div className="farm-stock-row" key={id}><span className="farm-item-icon" style={{ color: ITEMS[id].color }}><CropIcon id={id} size={32} /></span><div><b>{ITEMS[id].name}</b><small>{state.inventory[id]} trong kho · {ITEMS[id].sell} xu / món</small></div><button disabled={busy || !!error || state.inventory[id] < 1} onClick={() => dispatch({ type: 'sell', item: id, quantity: 1 })}>Bán 1</button></div>)}<div className="farm-note"><Icon name="store" /><p>Đây là cửa hàng của làng. Chợ trao đổi với người chơi sẽ mở ở giai đoạn online.</p></div>{state.coins < 3 && <button className="farm-secondary farm-full" onClick={() => dispatch({ type: 'help-seeds' })}>Nhờ bà An giúp hạt giống</button>}</>}
          {panel === 'shop' && <><p>Một món đồ nhỏ cũng có thể làm khu vườn trở nên rất riêng.</p><div className="farm-shop-grid">{(Object.keys(ASSETS) as AssetId[]).map(id => <button key={id} disabled={level < ASSETS[id].level || state.coins < ASSETS[id].price} onClick={() => beginPlacement(id)}><span className="farm-shop-image" style={{ color: ASSETS[id].color }}><Icon name={assetIcon(id)} size={34} /></span><b>{ASSETS[id].name}</b><small>{level < ASSETS[id].level ? `Mở ở cấp ${ASSETS[id].level}` : `${ASSETS[id].price} xu`}</small></button>)}</div><div className="farm-divider" /><h3>Thêm đất, thêm ước mơ</h3><p>Hiện có {boundsOf(state).width} × {boundsOf(state).depth} ô đất. Mở rộng giữ nguyên mọi thứ đã đặt.</p><button className="farm-primary farm-full" disabled={busy || !!error || state.expansion >= 2 || level < 3 + state.expansion * 2 || state.coins < expansionCost(state)} onClick={() => dispatch({ type: 'expand' })}>{state.expansion >= 2 ? 'Đã mở hết đất bản thử' : level < 3 + state.expansion * 2 ? `Mở đất ở cấp ${3 + state.expansion * 2}` : `Mở rộng · ${expansionCost(state)} xu`}</button></>}
          {panel === 'journal' && <><p>Những việc nhỏ mỗi ngày, những thành quả của riêng em.</p>{QUESTS.map(q => { const done = state.claimed.includes(q.id), progress = Math.min(q.target, state.stats[q.stat]); return <div key={q.id} className={`farm-quest ${done ? 'done' : ''}`}><div className="farm-quest-heading"><Icon name={done ? 'check' : 'target'} /><h3>{q.name}</h3><span>{progress}/{q.target}</span></div><p>{q.description}</p><div className="farm-progress"><span style={{ width: `${progress / q.target * 100}%` }} /></div><button disabled={busy || !!error || done || progress < q.target} onClick={() => dispatch({ type: 'claim', questId: q.id })}>{done ? 'Đã ghi vào nhật ký' : `Nhận ${q.coins} xu · ${q.xp} KN`}</button></div>; })}<div className="farm-note"><Icon name="sparkles" /><p>Thành tích: {state.stats.harvest} vụ thu hoạch · {state.stats.produce} mẻ hàng · {state.stats.deliver} đơn đã giao.</p></div></>}
          {panel === 'orders' && <><div className="farm-letter"><span className="farm-letter-stamp"><Icon name="leaf" size={30} /></span><span className="farm-eyebrow">LỜI NHẮN TỪ {order.person.toLocaleUpperCase('vi-VN')}</span><h3>{order.name}</h3><p>“Nếu vườn mình có sẵn, mang giúp nhé. Cứ từ từ, không vội đâu!”</p>{Object.entries(order.need).map(([id, n]) => <div className="farm-order-item" key={id}><CropIcon id={id} size={32} /><b>{ITEMS[id as ItemId].name}</b><span className={state.inventory[id as ItemId] >= n! ? 'farm-success' : ''}>{state.inventory[id as ItemId]} / {n}</span></div>)}<div className="farm-letter-reward"><Icon name="coins" />{order.coins} xu <span>+ {order.xp} kinh nghiệm</span></div><button className="farm-primary farm-full" disabled={busy || !!error || !canDeliver} onClick={() => dispatch({ type: 'deliver' })}><Icon name="package" />{canDeliver ? 'Giao cho hàng xóm' : 'Gom đủ hàng để giao'}</button></div><p className="farm-small-note">Đã giúp hàng xóm {state.stats.deliver} lần. Đơn hàng không hết hạn.</p></>}
        </div>
        <footer className="farm-panel-footer"><Icon name="leaf" size={15} />Một chút chăm chút, một chút bình yên.</footer>
      </aside>
    </div>
    {toast && <div className="farm-toast" role="status"><Icon name="leaf" />{toast}</div>}
    {settings && <div className="farm-modal-backdrop" onClick={() => setSettings(false)}><section className="farm-modal" role="dialog" aria-modal="true" aria-label="Cài đặt và bản sao lưu" onClick={e => e.stopPropagation()}><button className="farm-modal-close" aria-label="Đóng cài đặt" onClick={() => setSettings(false)}><Icon name="close" /></button><span className="farm-eyebrow">CHĂM CHÚT TRẢI NGHIỆM</span><h2>Một góc riêng của em</h2><p>Vườn được lưu trong trình duyệt này. Xuất bản sao để giữ một bản bên ngoài trước khi xóa dữ liệu trình duyệt.</p><label className="farm-setting"><span>Bóng đổ mềm</span><input type="checkbox" checked={quality === 'soft'} onChange={e => setQuality(e.target.checked ? 'soft' : 'light')} /></label><label className="farm-setting"><span>Giảm chuyển động</span><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} /></label><div className="farm-divider" /><div className="farm-backup-actions"><button className="farm-secondary" onClick={downloadBackup}><Icon name="download" />Xuất bản sao</button><label className="farm-file-button"><Icon name="upload" />Đọc tệp bản sao<input type="file" accept=".json,application/json" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 1000000) { setBackupError('Tệp sao lưu quá lớn.'); return; } const text = await f.text(); setBackup(text); previewBackup(text); e.target.value = ''; }} /></label></div><details><summary>Dán hoặc xem nội dung bản sao</summary><textarea aria-label="Nội dung bản sao lưu" value={backup} onChange={e => setBackup(e.target.value)} placeholder="Dán bản sao Làng Mầm tại đây…" /><button className="farm-secondary" onClick={() => previewBackup()}>Kiểm tra bản sao</button></details>{backupError && <p className="farm-warning" role="alert">{backupError}</p>}<div className="farm-note"><Icon name="help" /><p>Bản thử dùng dữ liệu riêng. Liên kết tài khoản, thăm vườn và chợ người chơi chưa mở.</p></div></section></div>}
    {pendingRestore && <div className="farm-modal-backdrop"><section className="farm-modal farm-small-modal" role="alertdialog" aria-modal="true" aria-label="Xác nhận khôi phục"><h2>Khôi phục khu vườn?</h2><p>Bản sao có {pendingRestore.coins} xu, cấp {levelOf(pendingRestore.xp)} và {pendingRestore.plots.length} luống. Thao tác này thay thế khu vườn hiện tại. Em nên xuất bản hiện tại trước nếu muốn giữ cả hai.</p><button className="farm-primary farm-full" disabled={busy} onClick={async () => { await restore(pendingRestore); setPendingRestore(null); setSettings(false); setSelected(null); setPlacement(null); }}>Khôi phục bản này</button><button className="farm-subtle farm-full" onClick={() => setPendingRestore(null)}>Giữ khu vườn hiện tại</button></section></div>}
    {gallery && <div className="farm-gallery" role="dialog" aria-modal="true" aria-label="Xưởng xem mẫu 3D"><header><div><span className="farm-eyebrow">XƯỞNG MẪU · TÁCH KHỎI TIẾN TRÌNH CHƠI</span><h2>Mỗi thứ, một dáng riêng.</h2></div><button className="farm-secondary" onClick={() => setGallery(false)}><Icon name="close" />Về vườn</button></header><div className="farm-gallery-body"><AssetPreview asset={galleryAsset} level={galleryLevel} crop={galleryCrop} stage={galleryStage} reduced={reduced} /><aside><h3>{galleryCrop ? CROPS[galleryCrop].name : ASSETS[galleryAsset].name}</h3><p>Kéo để xoay mẫu, cuộn để nhìn gần. Các thay đổi ở đây không tiêu xu hoặc sửa nông trại.</p><label>Chọn mẫu<select aria-label="Chọn mẫu 3D" value={galleryCrop ? `crop:${galleryCrop}` : galleryAsset} onChange={e => { if (e.target.value.startsWith('crop:')) setGalleryCrop(e.target.value.slice(5) as CropId); else { setGalleryCrop(undefined); setGalleryAsset(e.target.value as AssetId); } }}>{Object.entries(ASSETS).map(([id, a]) => <option key={id} value={id}>{a.name}</option>)}{Object.entries(CROPS).map(([id, c]) => <option key={id} value={`crop:${id}`}>{c.name} · cây trồng</option>)}</select></label>{galleryCrop ? <><h4>Giai đoạn lớn</h4><div className="farm-stage-buttons">{['Đã gieo', 'Mầm', 'Cây non', 'Đang lớn', 'Thu hoạch'].map((label, i) => <button key={label} aria-pressed={galleryStage === i} className={galleryStage === i ? 'active' : ''} onClick={() => setGalleryStage(i)}>{label}</button>)}</div></> : ASSETS[galleryAsset].kind === 'building' && <><h4>Cấp công trình</h4><div className="farm-stage-buttons">{[1, 2, 3].map(l => <button key={l} aria-pressed={galleryLevel === l} className={galleryLevel === l ? 'active' : ''} onClick={() => setGalleryLevel(l)}>Cấp {l}</button>)}</div></>}<div className="farm-note"><Icon name="eye" /><p>Bộ mẫu 3D dựng bằng hình học trong module. Đây là bản kiểm chứng bố cục và dáng; còn khâu tinh chỉnh mỹ thuật trước bộ tài nguyên chính thức.</p></div></aside></div></div>}
  </main>;
}
