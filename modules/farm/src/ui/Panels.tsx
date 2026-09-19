import { ResourceAction } from './ResourceAction';
import { BuildChoice } from './BuildChoice';
import { Inventory } from './Inventory';
import { roadName } from '../render/roadAssets';
import { CatalogPicture } from './CatalogPicture';
import { SeedCards } from './SeedCards';
import { UpgradeResources, hasUpgradeResources } from './UpgradeResources';
import { obstacleName } from '../core/scenery';
import { Activities } from './Activities';
import { professionFactor } from '../core/activities';
import { useState } from 'react';
import { ASSETS, CROPS, ITEMS, QUESTS, RECIPES, SPEEDUPS, type AssetId, type BuildingId, type CropId, type ItemId, type RecipeId } from '../core/catalog';
import { productBuilding } from '../core/guidance';
import { HOME_LEVELS } from '../core/progression';
import { contractNeed } from '../core/engine';
import { homeLevel, homeSpec, plotCap, regionCap, storageCap, usedStorage, queueCap, outputCap, productionFactor, upgradePrice, upgradeMs, upgradeRequirements, CHAPTER_TITLES, CHAPTER_PRODUCTS, chapterReady, orderFor, recipeAllowed } from '../core/progression';
import { marketItems, marketHome, marketPrice, marketStock } from '../core/simulation';
import { ownedAt } from '../core/world';
import type { FarmCommand, FarmState } from '../core/types';
import { CropIcon, Icon, type IconName } from './Icon';
import { Goods, Progress, duration } from './shared';
export type Panel = 'build' | 'shop' | 'inventory' | 'quests' | 'orders';
export const menus: {
    id: Panel;
    label: string;
    icon: IconName;
}[] = [{ id: 'build', label: 'Xây dựng', icon: 'hammer' }, { id: 'shop', label: 'Cửa hàng', icon: 'store' }, { id: 'inventory', label: 'Kho hàng', icon: 'basket' }, { id: 'quests', label: 'Nhiệm vụ', icon: 'book' }, { id: 'orders', label: 'Đơn hàng', icon: 'package' }];
export type Confirmation = {
    title: string;
    body: string;
    command: FarmCommand;
};
type Props = {
    s: FarmState;
    panel: Panel;
    selected: string | null;
    busy: boolean;
    act: (c: FarmCommand) => Promise<boolean>;
    confirm: (c: Confirmation) => void;
    select: (id: string) => void;
    begin: (a: AssetId | 'plot', id?: string) => void;
    map: () => void;
    plant: (id?: CropId) => void;
    fish: () => void;
    guide: (asset: BuildingId, level: number) => void;
    buildTarget?: AssetId;
};
export function Panels({ s, panel, selected, busy, act, confirm, select, begin, map, plant, fish, guide, buildTarget }: Props) {
    const [filter, setFilter] = useState(''), [category, setCategory] = useState('all'), [amount, setAmount] = useState(1), [batches, setBatches] = useState(1), [questTab, setQuestTab] = useState('story');
    const level = homeLevel(s), entity = s.entities.find(e => e.id === selected), plot = s.plots.find(p => p.id === selected), obstacle = s.world.obstacles.find(o => o.id === selected), bridge = s.world.bridges.find(b => b.id === selected), order = orderFor(s), home = s.entities.find(e => e.asset === 'home')!;
    const chapter = Array.from({ length: 25 }, (_, i) => i + 1).find(n => !s.claimed.includes(`chapter:${n}`)) ?? 25;
    const speed = (id: string, remaining: number) => <div className="farm-speedups">{SPEEDUPS.map(n => <button key={n} disabled={busy || !s.speedups[n]} onClick={() => confirm({ title: `Dùng phiếu ${n} phút`, body: `Còn ${duration(remaining)} → ${duration(Math.max(0, remaining - n * 60000))}. ${remaining < n * 60000 ? 'Phần thời gian dư không được hoàn.' : ''}`, command: { type: 'speedup', targetId: id, minutes: n } })}>{n < 60 ? `${n}p` : '1 giờ'} <small>×{s.speedups[n]}</small></button>)}</div>;
    if (entity) {
        const price = entity.level < 25 ? upgradePrice(entity) : null, errors = upgradeRequirements(s, entity);
        return <>
  <div className="farm-panel-lead"><CatalogPicture asset={entity.asset} level={entity.asset === 'path' ? homeLevel(s) : entity.level}/><div><b>{ASSETS[entity.asset].kind === 'building' ? `Cấp ${entity.level}/25` : 'Trang trí'}</b><p>{entity.asset === 'path' ? `${roadName(homeLevel(s))} · Tự nâng cấp theo ngoại hình Nhà chính.` : ASSETS[entity.asset].description}</p></div></div>
  {entity.construction && <section className="farm-card"><h3>{entity.construction.newBuilding ? 'Đang xây' : `${entity.level} → ${entity.construction.target}`}</h3>{entity.construction.waitingFor ? <><p>Đã giữ chi phí và đội thợ. Chờ mẻ hiện tại xong.</p><button onClick={() => act({ type: 'cancel-upgrade', entityId: entity.id })}>Hủy lịch, hoàn chi phí</button></> : <><Progress start={entity.construction.startedAt} end={entity.construction.readyAt} now={s.clock}/>{speed(entity.construction.id, entity.construction.readyAt - s.clock)}</>}</section>}
  {entity.asset === 'home' && <><div className="farm-stat-grid"><span><b>{s.plots.length}/{plotCap(s)}</b>ruộng</span><span><b>{s.world.owned.length}/{regionCap(s)}</b>khu đất</span><span><b>{homeSpec(s).builderSlots}</b>đội thợ</span></div><p>{homeSpec(s).milestone}</p>{level < 25 && <div className="farm-quest-buildings">{HOME_LEVELS[level].requires.map(req => <button className="farm-quest-target" key={req.building} onClick={() => guide(req.building as BuildingId, req.level)}>{ASSETS[req.building as BuildingId].name} cấp {req.level}<Icon name="next" size={15}/></button>)}</div>}</>}
  {entity.asset === 'warehouse' && <p>Kho {usedStorage(s)}/{storageCap(s)}. Mỗi cấp thêm 80 chỗ; phiếu và trang trí có túi riêng.</p>}
  {!!Object.keys(entity.output).length && <section className="farm-card"><h3>Thành phẩm đang chờ</h3><Goods items={entity.output}/><button className="farm-primary" disabled={busy} onClick={() => act({ type: 'collect', entityId: entity.id })}>Nhận vào kho</button></section>}
  {entity.job && <section className="farm-card"><h3>{RECIPES[entity.job.recipe].name}</h3><Progress start={entity.job.startedAt} end={entity.job.readyAt} now={s.clock}/>{entity.job.readyAt > s.clock && speed(entity.job.id, entity.job.readyAt - s.clock)}<small>Kho tại trạm: {outputCap(entity)} sản phẩm. Đầy sẽ dừng mẻ kế.</small></section>}
  {!!entity.queue.length && <section className="farm-card"><h3>{entity.queue.length} mẻ đang chờ</h3>{entity.queue.map(j => <p key={j.id}>{RECIPES[j.recipe].name} · {duration(j.duration)}</p>)}<button onClick={() => act({ type: 'cancel-queue', entityId: entity.id })}>Hủy mẻ chờ, hoàn nguyên liệu</button></section>}
  {Object.entries(RECIPES).some(([, r]) => r.building === entity.asset) && <><label>Số mẻ mỗi lần<select value={batches} onChange={e => setBatches(Number(e.target.value))}>{Array.from({ length: queueCap(entity) }, (_, i) => <option key={i} value={i + 1}>{i + 1} mẻ</option>)}</select></label>{Object.entries(RECIPES).filter(([, r]) => r.building === entity.asset).map(([id, r]) => <section className="farm-recipe" key={id}><h3>{r.name}</h3><Goods items={r.inputs} state={s}/><p>{r.quantity} {ITEMS[r.output].name.toLowerCase()} · {duration(r.seconds * 1000 * productionFactor(entity) * professionFactor(s, id as RecipeId))}</p><button disabled={busy || !recipeAllowed(s, entity, id as RecipeId)} onClick={() => act({ type: 'produce', entityId: entity.id, recipe: id as RecipeId, quantity: batches })}>{level < r.home && !entity.legacy ? `Nhà chính ${r.home}` : entity.level < r.buildingLevel ? `Trạm cấp ${r.buildingLevel}` : `Xếp ${batches} mẻ`}</button></section>)}</>}
  {entity.asset === 'fishing_pier' && !entity.construction && <button className="farm-primary" onClick={fish}>Câu cá · trò nhớ nhịp</button>}
  {ASSETS[entity.asset].kind === 'building' && price && !entity.construction && <section className="farm-card"><h3>Nâng lên cấp {entity.level + 1}</h3><p>{entity.asset === 'home' ? 'Mở thêm quyền phát triển.' : entity.asset === 'warehouse' ? '+80 sức chứa kho.' : `Mẻ mới nhanh hơn; sức chứa ${outputCap(entity)} → ${outputCap({ ...entity, level: entity.level + 1 })}; hàng đợi ${queueCap(entity)} → ${queueCap({ ...entity, level: entity.level + 1 })}.`}</p><UpgradeResources state={s} cost={price}/><small>{duration(upgradeMs(entity))} · {s.entities.filter(e => e.construction).length}/{homeSpec(s).builderSlots} đội thợ đang dùng</small>{errors.map((e, i) => <p key={i} className="farm-warning">Cần: {e}</p>)}<button className="farm-primary" disabled={busy || !!errors.length || !hasUpgradeResources(s, price)} onClick={() => confirm({ title: `Nâng ${ASSETS[entity.asset].name}`, body: `Thời gian: ${duration(upgradeMs(entity))}. ${entity.job ? 'Chờ mẻ hiện tại; hàng đợi tạm dừng.' : 'Đã khởi công thì không hủy.'}`, command: { type: 'upgrade', entityId: entity.id } })}>{!hasUpgradeResources(s, price) ? 'Chưa đủ tài nguyên' : errors.length ? 'Chưa đủ điều kiện' : 'Xem và nâng cấp'}</button></section>}
  <button disabled={!!entity.construction} onClick={() => begin(entity.asset, entity.id)}><Icon name="move"/>Chuyển vị trí</button>{ASSETS[entity.asset].kind === 'decor' && <button onClick={() => act({ type: 'store', entityId: entity.id })}>Cất vào kho trang trí</button>}
 </>;
    }
    if (plot)
        return <><CropIcon id={plot.crop ?? 'wheat'} size={52}/><h3>{plot.crop ? CROPS[plot.crop].name : 'Đất đang chờ hạt'}</h3>{plot.crop ? <><Progress start={plot.plantedAt!} end={plot.readyAt!} now={s.clock}/><button className="farm-primary" onClick={() => act({ type: 'harvest', plotId: plot.id })} disabled={busy || s.clock < plot.readyAt!}>Thu hoạch</button><button onClick={() => act({ type: 'water', plotId: plot.id })} disabled={!!plot.watered || s.clock >= plot.readyAt!}>Tưới · nhanh hơn 10%</button>{plot.readyAt! > s.clock && speed(plot.id, plot.readyAt! - s.clock)}</> : <><p>Chọn giống rồi chạm hoặc quét nhiều luống.</p><button className="farm-primary" onClick={() => plant()}>Gieo nhiều ô</button></>}</>;
    if (obstacle) return <ResourceAction state={s} obstacle={obstacle} busy={busy} act={act}/>;
    if (bridge)
        return <><p>Cần Nhà chính 4 và sở hữu hai đầu cầu.</p>{bridge.built ? <p>Cầu đã mở.</p> : bridge.readyAt ? <p>Còn {duration(bridge.readyAt - s.clock)}</p> : <button onClick={() => confirm({ title: 'Xây cầu gỗ', body: '100 xu · 6 ván · 4 đá · 5 phút.', command: { type: 'bridge', bridgeId: bridge.id } })}>Xây cầu</button>}</>;
    if (panel === 'build')
        return <><div>{buildTarget && <p className="farm-build-guidance"><Icon name="hammer"/> Nhiệm vụ: xây {ASSETS[buildTarget].name}. Chuẩn bị đủ vật liệu, chọn thẻ bên dưới rồi chạm đất trống để đặt.</p>}</div><div className="farm-inline"><select aria-label="Nhóm xây dựng" value={category} onChange={e => setCategory(e.target.value)}><option value="all">Tất cả</option><option value="building">Công trình</option><option value="decor">Trang trí</option><option value="open">Đã mở</option></select><input aria-label="Tìm công trình" placeholder="Tìm công trình…" value={filter} onChange={e => setFilter(e.target.value)}/></div><button className="farm-primary" disabled={s.plots.length >= plotCap(s)} onClick={() => begin('plot')}>Thêm luống · 15 xu ({s.plots.length}/{plotCap(s)})</button><button onClick={map}>Khai phá · {s.world.owned.length}/{regionCap(s)} khu đất</button><div className="farm-shop-grid farm-picture-cards">{Object.entries(ASSETS).filter(([id, a]) => id !== 'home' && (!buildTarget || id === buildTarget) && (category === 'all' || category === a.kind || category === 'open' && a.level <= level) && a.name.toLowerCase().includes(filter.toLowerCase())).map(([id]) => <BuildChoice key={id} id={id as AssetId} s={s} busy={busy} select={select} begin={begin}/>)}</div></>;
    if (panel === 'shop')
        return <><h3>Hạt giống</h3><p>Mua hạt khi gieo; chỉ trừ xu cho những ô đã xác nhận.</p><SeedCards level={level} choose={plant}/><h3>Vật tư của làng</h3><p>Giá cao hơn bán lại. Bổ sung sau {duration((s.market.epoch + 1) * 14400000 - s.clock)}.</p><label>Số lượng mỗi lần<input type="number" min={1} max={30} value={amount} onChange={e => setAmount(Number(e.target.value))}/></label>{marketItems.map(id => <div className="farm-row" key={id}><span><b>{ITEMS[id].name}</b><small>{marketPrice(id)} xu/món · còn {marketStock(s, id)}</small></span><button disabled={busy || level < marketHome[id]} onClick={() => act({ type: 'buy', item: id, quantity: amount, epoch: s.market.epoch })}>{level < marketHome[id] ? `Nhà chính ${marketHome[id]}` : `Mua ${amount}`}</button></div>)}</>;
    if (panel === 'inventory') return <Inventory s={s} busy={busy} act={act} begin={begin}/>;
    if (panel === 'orders')
        return <><section className="farm-story"><small>{order.person}</small><h3>{order.name}</h3><Goods items={order.need} state={s}/><p>Nhận {order.coins} xu · {order.xp} danh tiếng</p><button className="farm-primary" disabled={busy} onClick={() => act({ type: 'deliver' })}>Giao đơn</button><button onClick={() => act({ type: 'skip-order' })}>Đổi đơn miễn phí</button></section><h3>Hợp đồng phiên chợ</h3>{level < 12 ? <p>Mở từ Nhà chính 12. Ba chặng qua nhiều phiên.</p> : <section className="farm-card"><p>Hợp đồng {s.contract.round + 1} · chặng {s.contract.stage + 1}/3</p><Goods items={contractNeed(s)} state={s}/><p>Mỗi chặng trả 150% giá NPC; xong nhận phiếu 30 phút.</p><button onClick={() => act({ type: 'contract' })}>Giao chặng này</button></section>}</>;
    return <><div className="farm-tabs"><button aria-pressed={questTab === 'story'} onClick={() => setQuestTab('story')}>Chính tuyến</button><button aria-pressed={questTab === 'achievements'} onClick={() => setQuestTab('achievements')}>Thành tựu</button></div>{questTab === 'story' ? <><section className="farm-story"><small>CHƯƠNG {chapter}/25</small><h3>{CHAPTER_TITLES[chapter - 1]}</h3><p>{homeSpec(s).milestone}</p><ul><li><button className="farm-quest-target" onClick={() => guide('home', chapter)}>Nhà chính cấp {chapter}: {level >= chapter ? '✓' : `${level}/${chapter}`} <Icon name="next" size={15}/></button></li><li>Thu hoạch {chapter * 3} luống: {s.stats.harvest}/{chapter * 3}</li>{CHAPTER_PRODUCTS[chapter - 1] && <li><button className="farm-quest-target" onClick={() => { const target = productBuilding(CHAPTER_PRODUCTS[chapter - 1]!); if (target) guide(target.asset, target.level); }}>Tự làm {ITEMS[CHAPTER_PRODUCTS[chapter - 1]!].name}: {(s.produced[CHAPTER_PRODUCTS[chapter - 1]!] ?? 0) > 0 ? '✓' : 'chưa có'} <Icon name="next" size={15}/></button></li>}</ul><p>Thưởng {80 + chapter * 40} xu + phiếu tăng tốc.</p><button className="farm-primary" disabled={busy || s.claimed.includes(`chapter:${chapter}`) || !chapterReady(s, chapter)} onClick={() => act({ type: 'chapter', chapter })}>Nhận thưởng chương</button><button onClick={() => guide('home', Math.min(25, level + 1))}>Chuẩn bị nâng Nhà chính</button>{level < 25 && <div className="farm-quest-buildings"><small>Để nâng Nhà chính {level + 1}</small>{HOME_LEVELS[level].requires.map(req => <button className="farm-quest-target" key={req.building} onClick={() => guide(req.building as BuildingId, req.level)}>{ASSETS[req.building as BuildingId].name} cấp {req.level}<Icon name="next" size={15}/></button>)}</div>}</section><details><summary>Hành trình 25 chương</summary>{CHAPTER_TITLES.map((title, i) => <p key={title}>{s.claimed.includes(`chapter:${i + 1}`) ? '✓' : '○'} {i + 1}. {title}</p>)}</details></> : QUESTS.map(q => <section key={q.id} className="farm-card"><h3>{q.name}</h3><p>{q.description}</p>{q.stat === 'upgrade' && <button className="farm-quest-target" onClick={() => guide('home', Math.min(25, level + 1))}>Đi đến công trình cần nâng <Icon name="next" size={15}/></button>}<div className="farm-progress"><span style={{ width: `${Math.min(100, s.stats[q.stat] / q.target * 100)}%` }}/></div><small>{Math.min(q.target, s.stats[q.stat])}/{q.target} · {q.coins} xu + phiếu 5 phút</small><button disabled={busy || s.claimed.includes(q.id) || s.stats[q.stat] < q.target} onClick={() => act({ type: 'claim', questId: q.id })}>{s.claimed.includes(q.id) ? 'Đã nhận' : 'Nhận thưởng'}</button></section>)}<button className="farm-link" onClick={() => act({ type: 'help-seeds' })}>Nhờ giúp giống khi hết vốn</button>{level>=3&&<Activities s={s} act={act} confirm={confirm}/>}<h3>Công trình của mình</h3>{s.entities.filter(e => ASSETS[e.asset].kind === 'building').map(e => <button className="farm-building-link" key={e.id} onClick={() => select(e.id)}>{ASSETS[e.asset].name}<small>Cấp {e.level}{e.construction ? ' · đang thi công' : e.job ? ' · đang làm' : ''}</small></button>)}</>;
}


