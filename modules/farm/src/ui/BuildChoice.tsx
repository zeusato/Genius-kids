import { ASSETS, type AssetId } from '../core/catalog';
import { buildingCount, buildingLimit, buildPrice, buildRequirements } from '../core/construction';
import { homeLevel } from '../core/progression';
import type { FarmState } from '../core/types';
import { CatalogPicture } from './CatalogPicture';
import { UpgradeResources } from './UpgradeResources';

export function BuildChoice({ id, s, busy, select, begin }: {
    id: AssetId; s: FarmState; busy: boolean;
    select: (id: string) => void; begin: (id: AssetId) => void;
}) {
    const a = ASSETS[id], existing = a.kind === 'building' ? s.entities.find(e => e.asset === id) : undefined;
    const locked = homeLevel(s) < a.level, limit = buildingLimit(id), errors = buildRequirements(s, id);
    return <button className="farm-build-choice" disabled={busy || (!existing && !!errors.length)} title={existing ? 'Chọn để xem công trình' : errors.join(' · ')} onClick={() => existing ? select(existing.id) : begin(id)}>
        <CatalogPicture asset={id} level={existing?.level}/><b>{a.name}</b>
        {limit !== null && <small className="farm-build-limit">{buildingCount(s, id)}/{limit}{existing ? existing.construction?.newBuilding ? ' · Đang xây' : ` · Cấp ${existing.level}` : ' công trình'}</small>}
        {locked && <small className="farm-catalog-lock">Nhà chính {a.level}</small>}
        {!existing && (a.kind === 'building' ? <UpgradeResources state={s} cost={buildPrice(id)} label={`Chi phí xây ${a.name}`}/> : <small className="farm-catalog-price">{a.price} xu</small>)}
        {!existing && !locked && errors.some(e => e.includes('đội thợ')) && <small>Đang chờ đội thợ</small>}
    </button>;
}
