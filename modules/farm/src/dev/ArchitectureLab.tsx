import { useState } from 'react';
import { ASSETS, type AssetId } from '../core/catalog';
import type { Rotation } from '../core/types';
import { buildingAssetUrl, VISUAL_LEVELS } from '../render/buildingAssets';
import { AssetPreview } from '../render/FarmScene';
import '../farm.css';
import '../ui/construction.css';
const ids = Object.keys(ASSETS).filter(id => ASSETS[id as AssetId].kind === 'building') as AssetId[];
export default function ArchitectureLab() {
    const [level, setLevel] = useState(25), [side, setSide] = useState<Rotation>(0), [selected, setSelected] = useState<AssetId | null>(null);
    return <main className="farm-architecture-lab"><header><div><small>XƯỞNG KIẾN TRÚC · SÂN THỬ</small><h1>Nhìn hình, nhận ra nghề.</h1><p>29 công trình · 6 mốc ngoại hình · đủ 4 góc xoay. Chọn một mẫu để xem gần.</p></div><a href="?lab=qa">Về sân thử nông trại ↗</a></header><nav aria-label="Chọn cấp và hướng"><span>Cấp công trình</span>{VISUAL_LEVELS.map(n => <button key={n} aria-pressed={level === n} onClick={() => setLevel(n)}>{n}</button>)}<span>Hướng</span>{([0, 1, 2, 3] as Rotation[]).map(n => <button key={n} aria-label={`Hướng ${n + 1}`} aria-pressed={side === n} onClick={() => setSide(n)}>{n + 1}</button>)}</nav><div className="farm-sprite-sheet">{ids.map(id => <button key={id} onClick={() => setSelected(id)}><img src={buildingAssetUrl(id, level, side)} alt={`${ASSETS[id].name}, cấp ${level}, hướng ${side + 1}`}/><b>{ASSETS[id].name}</b></button>)}</div>{selected && <section className="farm-architecture-detail" aria-label="Công trình đang xem"><div><h2>{ASSETS[selected].name} · cấp {level}</h2><button onClick={() => setSelected(null)} aria-label="Đóng xem gần">×</button></div><p>{ASSETS[selected].description}</p><div className="farm-gallery-canvas"><AssetPreview asset={selected} level={level} stage={4} reduced/></div><p>Bấm các góc xoay để xem đủ bốn mặt công trình.</p></section>}</main>;
}
