import React from 'react';
import { Building, FLOOR_LIMITS, floorsOf, STYLES } from './engine/region';
export function BuildingAppearance({ building, preview = false, onChange }: { building: Pick<Building, 'type' | 'floors' | 'style'>; preview?: boolean; onChange: (changes: { floors?: number; style?: number }) => void }) {
    const limit = FLOOR_LIMITS[building.type];
    return <div className="pm-building-appearance">
        <label>Số tầng <span>(tối đa {limit})</span><select aria-label={preview ? 'Số tầng công trình mới' : 'Số tầng công trình'} value={floorsOf(building)} disabled={limit === 1} onChange={e => onChange({ floors: Number(e.target.value) })}>{Array.from({ length: limit }, (_, i) => <option key={i} value={i + 1}>{i + 1} tầng</option>)}</select></label>
        <label>Kiến trúc<select aria-label={preview ? 'Kiến trúc công trình mới' : 'Kiến trúc công trình'} value={building.style ?? 0} onChange={e => onChange({ style: Number(e.target.value) })}>{STYLES.map((name, i) => <option key={name} value={i}>{name}</option>)}</select></label>
        {limit > 1 && <small>Thêm tầng tăng sức chứa và nhu cầu điện, nước.</small>}
    </div>;
}
