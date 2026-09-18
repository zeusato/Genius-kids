import { CROPS, type CropId } from '../core/catalog';
import { CatalogPicture } from './CatalogPicture';
const seedTime = (seconds: number) => seconds < 60 ? `${seconds} giây` : seconds < 3600 ? `${Math.floor(seconds / 60)} phút${seconds % 60 ? ` ${seconds % 60} giây` : ''}` : `${Math.floor(seconds / 3600)} giờ${seconds % 3600 ? ` ${Math.floor(seconds % 3600 / 60)} phút` : ''}`;

export function SeedCards({ level, selected, choose }: { level: number; selected?: CropId; choose: (id: CropId) => void }) {
    return <div className="farm-seeds farm-picture-cards">{Object.entries(CROPS).sort(([, a], [, b]) => a.level - b.level || a.seconds - b.seconds).map(([id, c]) => <button key={id} disabled={level < c.level} aria-pressed={selected === id} onClick={() => choose(id as CropId)}>
        <CatalogPicture crop={id as CropId}/><b>{c.name}</b>
        <span className={level < c.level ? 'farm-catalog-lock' : 'farm-catalog-price'}>{level < c.level ? `Mở ở Nhà chính ${c.level}` : `${c.seed} xu / ô`}</span>
        <small>{seedTime(c.seconds)} · thu {c.yield}</small>
    </button>)}</div>;
}
