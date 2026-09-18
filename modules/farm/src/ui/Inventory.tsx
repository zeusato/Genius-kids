import { useState } from 'react';
import { ASSETS, ITEMS, SPEEDUPS, type AssetId, type ItemId } from '../core/catalog';
import { storageCap, usedStorage } from '../core/progression';
import type { FarmCommand, FarmState } from '../core/types';
import { CatalogPicture } from './CatalogPicture';
import { CropIcon, Icon } from './Icon';
import { ResourceIcon } from './ResourceIcon';
import { Goods } from './shared';

function ItemPicture({ id }: { id: ItemId }) {
    return <span className="farm-stock-picture" style={{ color: ITEMS[id].color }}>
        {['wood', 'stone', 'plank', 'iron', 'brick', 'glass', 'cloth', 'tools'].includes(id) ? <ResourceIcon id={id}/> : <CropIcon id={id} size={42}/>}
    </span>;
}

export function Inventory({ s, busy, act, begin }: {
    s: FarmState; busy: boolean;
    act: (command: FarmCommand) => Promise<boolean>;
    begin: (asset: AssetId | 'plot', id?: string) => void;
}) {
    const [selected, setSelected] = useState<ItemId | null>(null);
    const [filter, setFilter] = useState(''), [quantity, setQuantity] = useState(1);
    const stock = Object.entries(s.inventory).filter(([id, n]) => n > 0 && ITEMS[id as ItemId].name.toLocaleLowerCase('vi').includes(filter.toLocaleLowerCase('vi')));
    if (selected) {
        const item = ITEMS[selected], count = s.inventory[selected], reserved = s.reserve[selected] ?? 0;
        const available = Math.max(0, count - reserved);
        const amount = Math.min(available, Math.max(1, Number.isFinite(quantity) ? Math.floor(quantity) : 1));
        return <section className="farm-stock-detail">
            <button className="farm-stock-back" autoFocus onClick={() => setSelected(null)}><Icon name="left"/>Kho hàng</button>
            <ItemPicture id={selected}/><h3>{item.name}</h3><p>Đang có <b>{count}</b>{reserved > 0 && <> · Giữ lại {reserved}</>}</p>
            <div className="farm-stock-amount">
                <button aria-label="Giảm số lượng bán" disabled={busy || amount <= 1} onClick={() => setQuantity(amount - 1)}>−</button>
                <input aria-label="Số lượng bán" type="number" inputMode="numeric" min={available ? 1 : 0} max={available} value={amount} disabled={busy || !available} onChange={e => setQuantity(e.target.valueAsNumber)}/>
                <button aria-label="Tăng số lượng bán" disabled={busy || amount >= available} onClick={() => setQuantity(amount + 1)}>+</button>
                <button disabled={busy || !available} onClick={() => setQuantity(available)}>Tối đa</button>
            </div>
            <button className="farm-primary farm-stock-sell" disabled={busy || !available} onClick={async () => {
                if (await act({ type: 'sell', item: selected, quantity: amount })) setSelected(null);
            }}>Bán {amount} · <Icon name="coins"/>{(amount * item.sell).toLocaleString('vi-VN')} xu</button>
            <button className="farm-link" disabled={busy || !count} onClick={() => act({ type: 'reserve', item: selected, quantity: reserved ? 0 : count })}>{reserved ? 'Bỏ giữ lại' : 'Giữ lại vật phẩm này'}</button>
        </section>;
    }
    return <>
        <div className="farm-stock-heading"><span><Icon name="basket"/>{usedStorage(s)}/{storageCap(s)}</span><input aria-label="Tìm hàng trong kho" placeholder="Tìm vật phẩm…" value={filter} onChange={e => setFilter(e.target.value)}/></div>
        <div className="farm-stock-grid">{stock.map(([id, n]) => <button key={id} aria-label={`${ITEMS[id as ItemId].name}, đang có ${n}`} onClick={() => { setSelected(id as ItemId); setQuantity(1); }}>
            <ItemPicture id={id as ItemId}/><b>{ITEMS[id as ItemId].name}</b><span className="farm-stock-count">×{n.toLocaleString('vi-VN')}</span>
        </button>)}</div>
        {!stock.length && <p className="farm-stock-empty">{filter ? 'Không tìm thấy vật phẩm.' : 'Kho đang trống. Thu hoạch để cất những món đầu tiên nhé.'}</p>}
        <details><summary>Túi hỗ trợ</summary><div className="farm-stock-grid farm-stock-tickets">{SPEEDUPS.filter(n => s.speedups[n] > 0).map(n => <span key={n}><Icon name="sparkles"/><b>{n < 60 ? `${n} phút` : '1 giờ'}</b><span>×{s.speedups[n]}</span></span>)}</div>{!SPEEDUPS.some(n => s.speedups[n] > 0) && <p>Chưa có phiếu tăng tốc.</p>}</details>
        <details><summary>Trang trí đã cất · {s.entities.filter(e => e.stored).length}</summary><div className="farm-stock-grid">{s.entities.filter(e => e.stored).map(e => <button key={e.id} onClick={() => begin(e.asset, e.id)} title="Chọn để đặt lại"><CatalogPicture asset={e.asset}/><b>{ASSETS[e.asset].name}</b><span>×1</span></button>)}</div></details>
        <details><summary>Sổ sản phẩm · {s.discovered.length}/{Object.keys(ITEMS).length}</summary><Goods items={Object.fromEntries(s.discovered.map(id => [id, s.produced[id] ?? 0]))}/></details>
    </>;
}
