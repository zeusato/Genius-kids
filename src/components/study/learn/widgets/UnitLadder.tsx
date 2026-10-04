// Thang đơn vị đo: mỗi bậc liền nhau gấp 10 (độ dài, khối lượng), 100 (diện tích), 1000 (thể tích, dung tích).
import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { UnitKind, UnitLadderSpec } from '@/services/study/lessons/types';
import { fmt } from '@/services/study/value';
import { Md } from '../../shared';

export const LADDERS: Record<UnitKind, { units: string[]; step: number }> = {
    length: { units: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], step: 10 },
    mass: { units: ['tấn', 'tạ', 'yến', 'kg', 'hg', 'dag', 'g'], step: 10 },
    capacity: { units: ['l', 'ml'], step: 1000 },
    area: { units: ['km²', 'hm²', 'dam²', 'm²', 'dm²', 'cm²', 'mm²'], step: 100 },
    volume: { units: ['m³', 'dm³', 'cm³'], step: 1000 },
};
const ALIAS: Record<string, string> = { ha: 'hm²' };
const round9 = (x: number) => Math.round(x * 1e9) / 1e9;

export function convert(kind: UnitKind, value: number, from: string, to: string): { value: number; factor: number; up: boolean; steps: number } {
    const { units, step } = LADDERS[kind];
    const i = units.indexOf(ALIAS[from] ?? from), j = units.indexOf(ALIAS[to] ?? to);
    if (i < 0 || j < 0) throw new Error(`Đơn vị không thuộc thang ${kind}`);
    const steps = Math.abs(j - i), factor = step ** steps;
    return { value: round9(j >= i ? value * factor : value / factor), factor, up: j >= i, steps };
}

export function UnitLadder({ spec }: { spec: UnitLadderSpec }) {
    const { units, step } = LADDERS[spec.kind];
    const [from, setFrom] = useState(ALIAS[spec.from] ?? spec.from);
    const [to, setTo] = useState(ALIAS[spec.to] ?? spec.to);
    const [value, setValue] = useState(spec.value);
    const r = convert(spec.kind, value, from, to);
    const i = units.indexOf(from), j = units.indexOf(to);
    const lo = Math.min(i, j), hi = Math.max(i, j);
    const label = (u: string) => (u === 'hm²' ? 'hm² (ha)' : u);
    const pick = (u: string) => { if (u === from) return; if (u === to) { setTo(from); setFrom(u); } else setTo(u); };
    return (
        <div className="learn-widget ul">
            <h3>Thang đơn vị: mỗi bậc liền nhau gấp {fmt(step)} lần</h3>
            <div className="ul-ladder" role="group" aria-label="Chọn đơn vị cần đổi sang">
                {units.map((u, k) => <React.Fragment key={u}>
                    {k > 0 && <span className={`ul-gap${k > lo && k <= hi ? ' on' : ''}`}>{r.up ? '×' : ':'} {fmt(step)}</span>}
                    <button type="button" className={`ul-unit${u === from ? ' from' : u === to ? ' to' : ''}`} aria-pressed={u === to} onClick={() => pick(u)}>{label(u)}</button>
                </React.Fragment>)}
            </div>
            {spec.editable !== false && <div className="explore-row ul-value">
                <button type="button" className="hub-icon" aria-label="Giảm số đo" onClick={() => setValue(v => Math.max(0, round9(v - 1)))}><Minus size={18} /></button>
                <b>{fmt(value)} {label(from)}</b>
                <button type="button" className="hub-icon" aria-label="Tăng số đo" onClick={() => setValue(v => round9(v + 1))}><Plus size={18} /></button>
            </div>}
            <div className="explore-caption" aria-live="polite"><span><Md inline>{
                r.steps === 0 ? `${fmt(value)} ${label(from)} = ${fmt(value)} ${label(to)}` :
                `Từ ${label(from)} đến ${label(to)}: ${r.steps} bậc, ${r.up ? 'nhân' : 'chia'} cho ${fmt(r.factor)}. ${fmt(value)} ${label(from)} = ${fmt(r.value)} ${label(to)}.`
            }</Md></span></div>
            <p className="learn-hint-line">Chạm một đơn vị để đổi sang đơn vị đó. Đơn vị lớn ở bên trái.</p>
        </div>
    );
}
