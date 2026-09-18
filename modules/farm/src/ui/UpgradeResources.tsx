import { ITEMS, type ItemId } from '../core/catalog';
import type { Cost } from '../core/progression';
import type { FarmState } from '../core/types';
import { ResourceIcon } from './ResourceIcon';

// Upgrades spend inventory directly, including stock reserved only for sales/orders.
export function hasUpgradeResources(s: FarmState, cost: Cost) {
    return s.coins >= cost.coins && Object.entries(cost.items).every(([id, need]) => s.inventory[id as ItemId] >= need!);
}

export function UpgradeResources({ state, cost, label = 'Tài nguyên nâng cấp' }: { state: FarmState; cost: Cost; label?: string }) {
    const rows = [
        { id: 'coins', name: 'Xu', have: state.coins, need: cost.coins, color: '#c99d48' },
        ...Object.entries(cost.items).map(([id, need]) => ({ id, name: ITEMS[id as ItemId].name, have: state.inventory[id as ItemId], need: need!, color: ITEMS[id as ItemId].color })),
    ];
    const number = (n: number) => n.toLocaleString('vi-VN');
    return <div className="farm-upgrade-resources" role="group" aria-label={label}>{rows.map(r => {
            const missing = Math.max(0, r.need - r.have);
            const label = `${r.name}: có ${number(r.have)}, cần ${number(r.need)} · ${missing ? `Thiếu ${number(missing)}` : 'Đủ'}`;
            return <span key={r.id} className={`farm-resource-chip ${missing ? 'is-missing' : 'is-ready'}`} title={label} aria-label={label}>
                <ResourceIcon id={r.id}/><span><b>{number(r.have)}</b><span>/{number(r.need)}</span></span>
            </span>;
        })}</div>;
}
