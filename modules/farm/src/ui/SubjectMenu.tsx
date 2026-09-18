import { ASSETS, CROPS } from '../core/catalog';
import type { FarmState } from '../core/types';
import type { Tool } from '../core/interaction';
import { Icon } from './Icon';
import { Sickle } from './HarvestEffects';
import { duration } from './shared';
import { obstacleName } from '../core/scenery';

export function SubjectMenu({ s, id, busy, tool, details, move, close }: { s: FarmState; id: string; busy: boolean; tool: (t: Tool) => void; details: () => void; move: () => void; close: () => void }) {
  const plot = s.plots.find(p => p.id === id), entity = s.entities.find(e => e.id === id), obstacle = s.world.obstacles.find(o => o.id === id);
  const ripe = plot?.crop && plot.readyAt! <= s.clock;
  const title = plot ? plot.crop ? CROPS[plot.crop].name : 'Luống đất trống' : entity ? ASSETS[entity.asset].name : obstacle ? obstacleName(s.world, obstacle) : 'Cầu qua sông';
  return <div className="farm-subject-menu" role="group" aria-label={`Thao tác: ${title}`}>
    <header><div><b>{title}</b><small>{plot ? ripe ? 'Đã chín · sẵn sàng thu hoạch' : plot.crop ? `Còn ${duration(plot.readyAt! - s.clock)}` : 'Gieo một mùa mới' : entity ? `Cấp ${entity.level} · ${entity.construction ? 'Đang thi công' : 'Nông trại của mình'}` : 'Chọn một hoạt động'}</small></div><button onClick={close} aria-label="Bỏ chọn">×</button></header>
    <div className="farm-subject-options">
      {plot && (ripe ? <button className="farm-primary" disabled={busy} onClick={() => tool('harvest')}><Sickle/><span>Thu hoạch<small>Cầm liềm & kéo qua các luống</small></span></button> : !plot.crop ? <button className="farm-primary" onClick={() => tool('plant')}><Icon name="sprout" size={28}/><span>Gieo hạt<small>Chọn giống, quét nhiều ô</small></span></button> : !plot.watered && <button className="farm-primary" disabled={busy} onClick={() => tool('water')}><Icon name="water" size={28}/><span>Tưới cây<small>Kéo qua những cây đang lớn</small></span></button>)}
      {entity && <button onClick={details}><Icon name={entity.asset === 'home' ? 'home' : entity.asset === 'warehouse' ? 'basket' : 'hammer'} size={27}/><span>{ASSETS[entity.asset].kind === 'decor' ? 'Tùy chỉnh' : entity.asset === 'home' ? 'Nâng cấp nhà' : entity.asset === 'warehouse' ? 'Quản lý nhà kho' : 'Mở công trình'}<small>{ASSETS[entity.asset].kind === 'decor' ? 'Di chuyển · cất vào kho' : 'Sản xuất · nâng cấp · thành phẩm'}</small></span></button>}
      {entity && <button disabled={!!entity.construction} onClick={move}><Icon name="move" size={27}/><span>Di chuyển<small>Kéo vật thể · xoay cạnh vật thể</small></span></button>}
      {!entity && (!plot || plot.crop && !ripe) && <button onClick={details}><Icon name={obstacle ? 'shovel' : 'eye'} size={26}/><span>{obstacle ? 'Khai phá' : plot ? 'Chăm sóc & tăng tốc' : 'Xây cầu'}</span></button>}
    </div>
  </div>;
}
