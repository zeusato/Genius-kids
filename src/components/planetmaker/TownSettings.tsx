import React from 'react';
import { GraphicsQuality, limitsOf, MAX_ROADS, MAX_TREES, MAX_VEHICLES, Region, roadCount, TownLimits } from './engine/region';
import { GRAPHICS } from './rendering/environment';

export function TownSettings({ region, fallback, onLimits, onGraphics }: { region: Region; fallback: boolean; onLimits: (limits: TownLimits) => void; onGraphics: (quality: GraphicsQuality) => void }) {
    const limits = limitsOf(region), roads = roadCount(region);
    return <div className="pm-town-settings"><h3>Quy mô & đồ họa</h3>
        {([['trees', 'Cây tối đa', MAX_TREES, region.trees.length], ['roads', 'Ô đường tối đa', MAX_ROADS, roads], ['vehicles', 'Xe minh họa tối đa', MAX_VEHICLES, null]] as const).map(([key, label, max, current]) => <label className="pm-slider" key={key}>{label}{current !== null && <output>{current}/{limits[key]}</output>}<input aria-label={label} type="number" min={0} max={max} step={1} value={limits[key]} onChange={e => { const n = e.target.valueAsNumber; if (Number.isInteger(n) && n >= 0 && n <= max) onLimits({ ...limits, [key]: n }); }} /></label>)}
        <p className="pm-help">Tăng giới hạn rồi dùng cọ trồng cây hoặc vẽ đường. Hạ giới hạn không xóa phần đã có. Xe xuất hiện trên đường nối nhà ở; 0 để ẩn xe.</p>
        {(region.trees.length >= limits.trees || roads >= limits.roads) && <p className="pm-invalid">Đã chạm giới hạn cây hoặc đường. Tăng giới hạn hoặc xóa bớt để thêm mới.</p>}
        <label className="pm-slider">Chất lượng hình ảnh<select aria-label="Chất lượng hình ảnh" value={region.graphics || 'balanced'} onChange={e => onGraphics(e.target.value as GraphicsQuality)}>{Object.entries(GRAPHICS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label>
        <p className="pm-help">Chi tiết thêm tán cây, viền đường và bóng sắc hơn. Bản đồ đông nên dùng Nhẹ hoặc Cân bằng.</p>
        {fallback && region.graphics !== 'light' && <p className="pm-help">Đang tự giảm xuống chế độ Nhẹ để giữ thao tác mượt. Chọn lại chất lượng để thử lại.</p>}
    </div>;
}
