// Lớp 5 — Đơn vị đo diện tích, thể tích (g5_measurements): ha, km², m² … mm²; cm³, dm³, m³, lít.
import { tpl, fromTemplates, single, input, rint, pickOne, chance } from '../kit';
import { fmt } from '../../study/value';
import { fix } from './common';
import type { Template } from '../../study/types';

const AREA: [string, string, number][] = [['km²', 'ha', 100], ['ha', 'm²', 10000], ['km²', 'm²', 1000000], ['m²', 'dm²', 100], ['dm²', 'cm²', 100], ['cm²', 'mm²', 100]];
const VOL: [string, string, number][] = [['m³', 'dm³', 1000], ['dm³', 'cm³', 1000], ['m³', 'cm³', 1000000], ['dm³', 'l', 1], ['l', 'ml', 1000]];

function conv(skill: string, table: [string, string, number][]) {
    return [
        tpl(skill, 1, () => {
            const [big, small, f] = pickOne(table), n = rint(2, 9), r = n * f;
            if (chance(0.5)) return single({ q: `${n} ${big} = ? ${small}`, correct: r, wrong: f === 1 ? [n * 10, n * 1000, n * 100] : [r * 10, fix(r / 10), r * (f === 100 ? 100 : 10) / 10 === r ? r * 100 : r / (f === 100 ? 10 : 100), n + f], format: x => `${fmt(x)} ${small}`, min: 0, step: Math.max(1, f / 10),
                explanation: `1 ${big} = ${fmt(f)} ${small}, nên ${n} ${big} = ${fmt(r)} ${small}.`, hint: `Nhớ: 1 ${big} = ${fmt(f)} ${small}.` });
            return input({ q: `Điền số: ${fmt(r)} ${small} = ? ${big}`, correct: n, explanation: `${fmt(f)} ${small} = 1 ${big}, nên ${fmt(r)} ${small} = ${n} ${big}.` });
        }),
        tpl(skill, 2, () => {
            const [big, small, f] = pickOne(table.filter(t => t[2] >= 100)), a = rint(1, 9), b = rint(1, Math.min(99, f - 1)), r = fix(a + b / f);
            return single({ q: `${a} ${big} ${b} ${small} = ? ${big}`, correct: r, wrong: [fix(a + b / (f / 10)), fix(a + b / (f * 10)), a + b].filter(x => x !== r), format: x => `${fmt(x)} ${big}`, min: 0,
                explanation: `${b} ${small} = ${fmt(fix(b / f))} ${big}, nên ${a} ${big} ${b} ${small} = ${fmt(r)} ${big}.`, hint: `1 ${small} = ${fmt(1 / f)} ${big}.` });
        }, { decimal: true }),
    ];
}

export const templates: Template[] = [...conv('g5.area_units_big', AREA), ...conv('g5.volume_units', VOL)];

export const generateG5Measurements = fromTemplates(templates);
