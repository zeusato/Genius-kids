import { ITEMS, type ItemId } from '../core/catalog';
import { ENERGY_POINT_MS, resourceHome, resourcePayment, resourceTier, RESOURCE_TIERS } from '../core/harvesting';
import { homeLevel } from '../core/progression';
import type { FarmCommand, FarmState } from '../core/types';
import { canWorkTile, ownedAt, type Obstacle } from '../core/world';
import { Icon } from './Icon';
import { EnergyIcon } from './EnergyIcon';
import type { Ref } from 'react';

export function EnergyMeter({ state: s, targetRef }: { state: FarmState; targetRef?: Ref<HTMLDivElement> }) {
    const remaining = Math.max(0, ENERGY_POINT_MS - (s.clock - s.energy.updatedAt));
    const seconds = Math.ceil(remaining / 1000), full = s.energy.value >= s.energy.capacity;
    return <div ref={targetRef} className="farm-energy" title="Hồi 1 năng lượng mỗi 3 phút. Mỗi cấp Nhà chính thêm 5 sức chứa.">
        <EnergyIcon size={30}/><div><b>{s.energy.value}/{s.energy.capacity}</b><div role="progressbar" aria-label="Năng lượng" aria-valuemin={0} aria-valuemax={s.energy.capacity} aria-valuenow={s.energy.value}><i style={{ width: `${100 * s.energy.value / s.energy.capacity}%` }}/></div><small>{full ? 'Đã đầy' : `+1 sau ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}</small></div>
    </div>;
}
export function ResourceAction({ state: s, obstacle: o, busy, act }: { state: FarmState; obstacle: Obstacle; busy: boolean; act: (c: FarmCommand) => Promise<boolean> }) {
    const tier = resourceTier(s.world, o), spec = RESOURCE_TIERS[tier], home = resourceHome(s.world, o), cost = resourcePayment(s, o);
    const item: ItemId = o.kind === 'tree' ? 'wood' : o.kind === 'ore' ? 'ore' : 'stone';
    const accessible = canWorkTile(s.world, o.x, o.z);
    const problem = o.cleared ? 'Đã khai phá' : !ownedAt(s.world, o.x, o.z) ? 'Cần mở khu đất này' : homeLevel(s) < home ? `Cần Nhà chính ${home}` : !accessible ? 'Cần mở lối tới đây' : o.kind === 'berry' && s.energy.value >= s.energy.capacity ? 'Năng lượng đang đầy' : cost.energy > s.energy.value ? 'Chưa đủ năng lượng' : null;
    return <div className="farm-resource-action"><div className="farm-resource-yield">{o.kind === 'berry' ? <><b className="farm-energy-amount" aria-label="Hồi 5 đến 10 năng lượng">+5–10 <EnergyIcon size={20}/></b><small>Hái miễn phí · hồi năng lượng</small></> : <><b>Cấp {tier} · {spec.min}–{spec.max} {ITEMS[item].name.toLowerCase()}</b><small>{o.kind === 'rock' ? `Kèm ${tier} đất sét · ` : o.kind === 'ore' ? `Kèm ${tier} đá · ` : ''}Nhà chính {home}</small></>}</div>
        <button className="farm-primary" aria-label={problem ?? (o.kind === 'berry' ? 'Hái quả · miễn phí' : cost.tools ? `Khai phá · ${cost.tools} dụng cụ` : `Khai phá · ${cost.energy} năng lượng`)} disabled={busy || !!problem} onClick={() => act({ type: 'clear', obstacleId: o.id, generation: o.generation ?? 0, pay: 'auto' })}><Icon name={o.kind === 'berry' ? 'leaf' : 'shovel'}/>{problem ?? (o.kind === 'berry' ? 'Hái quả · miễn phí' : cost.tools ? `Khai phá · ${cost.tools} dụng cụ` : <span className="farm-energy-amount">Khai phá · {cost.energy} <EnergyIcon size={21}/></span>)}</button>
        {!problem && o.kind !== 'berry' && <small>{cost.tools ? 'Dùng dụng cụ thay năng lượng' : 'Nhận ngay vào kho · không tốn xu'}</small>}
    </div>;
}
