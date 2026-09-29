// Ghép dữ liệu gốc (elementsData.ts) + dữ liệu phụ (src/data/periodic/*) thành ElementFull. TS thuần.
import { ELEMENTS_DATA, type ElementData } from '../../../data/elementsData';
import { VIET_NAMES, IUPAC_SPELLING, EXTRA_ALIASES } from '../../../data/periodic/names';
import { KID } from '../../../data/periodic/kid';
import { ISOTOPES, type IsotopeInfo } from '../../../data/periodic/isotopes';
import { specimenOf, type SpecimenInfo } from '../../../data/periodic/specimen';
import { originOf, type OriginId } from '../../../data/periodic/origin';
import { COMPOSITION, type AroundId } from '../../../data/periodic/composition';
import { experimentsOf, FLAME_COLOR, DISCHARGE_COLOR, type ExperimentSpec } from '../../../data/periodic/experiments';
import { DISCOVERER } from '../../../data/periodic/discovery';

export type Hazard = 'radioactive' | 'toxic' | 'reactive' | 'flammable';

export interface ElementFull extends ElementData {
    sgkName: string;          // tên theo SGK (IUPAC, 13 tên Việt), viết hoa chữ đầu
    oldName: string;          // tên cũ (Hiđro, Oxi…)
    aliases: string[];
    kid: string;
    uses: { emoji: string; text: string }[];
    isotope: IsotopeInfo;
    specimen: SpecimenInfo;
    origin: Partial<Record<OriginId, number>>;
    flame?: string;
    discharge?: string;
    experiments: ExperimentSpec[];
    around: Partial<Record<AroundId, number>>;
    found: { year: number; ancient: boolean; by?: string; country?: string };
    hazard: Hazard[];
    sublimes: boolean;        // rắn → khí thẳng ở 1 atm (C, As)
    estimated: boolean;       // nhiệt độ/mật độ chỉ là dự đoán lý thuyết
}

const TOXIC = [4, 33, 48, 80, 81, 82, 9, 17, 35];
const REACTIVE = [3, 11, 19, 37, 55, 87, 9, 17];
const FLAMMABLE = [1, 12, 15];

function build(e: ElementData): ElementFull {
    const z = e.atomicNumber;
    const iso = ISOTOPES[z];
    const sgk = VIET_NAMES[z] ?? IUPAC_SPELLING[z] ?? e.nameEn;
    const around: Partial<Record<AroundId, number>> = {};
    (Object.keys(COMPOSITION) as AroundId[]).forEach(k => { if (COMPOSITION[k][z]) around[k] = COMPOSITION[k][z]; });
    const hazard: Hazard[] = [];
    if (!iso.stable) hazard.push('radioactive');
    if (TOXIC.includes(z)) hazard.push('toxic');
    if (REACTIVE.includes(z)) hazard.push('reactive');
    if (FLAMMABLE.includes(z)) hazard.push('flammable');
    return {
        ...e,
        sgkName: sgk,
        oldName: e.name,
        aliases: [e.name, e.nameEn, sgk, ...(EXTRA_ALIASES[z] ?? [])],
        kid: KID[z]?.kid ?? e.description,
        uses: KID[z]?.uses ?? [],
        isotope: iso,
        specimen: specimenOf(z),
        origin: originOf(z),
        flame: FLAME_COLOR[z]?.color,
        discharge: DISCHARGE_COLOR[z]?.color,
        experiments: experimentsOf(z, !iso.stable),
        around,
        found: { year: e.discoveryYear ?? 0, ancient: (e.discoveryYear ?? 0) < 0, ...DISCOVERER[z] },
        hazard,
        sublimes: z === 6 || z === 33,
        estimated: z >= 99 || [85, 87, 91].includes(z),
    };
}

export const ELEMENTS: ElementFull[] = ELEMENTS_DATA.map(build);
const BY_Z = new Map(ELEMENTS.map(e => [e.atomicNumber, e]));
const BY_SYMBOL = new Map(ELEMENTS.map(e => [e.symbol.toLowerCase(), e]));

export const byZ = (z: number): ElementFull | undefined => BY_Z.get(z);
export const bySymbol = (s: string): ElementFull | undefined => BY_SYMBOL.get(s.toLowerCase());

/** "?el=Au" hoặc "?el=79" */
export function parseElementParam(v: string | null): ElementFull | undefined {
    if (!v) return undefined;
    return /^\d+$/.test(v) ? byZ(Number(v)) : bySymbol(v);
}

/** Vị trí trên lưới (hàng 1–7 là chu kỳ, 9–10 là hai hàng f; cột 1–18). Khớp PeriodicTable.tsx. */
export function gridPos(e: ElementData): { row: number; col: number } {
    const z = e.atomicNumber;
    if (z >= 57 && z <= 71) return { row: 9, col: z - 54 };
    if (z >= 89 && z <= 103) return { row: 10, col: z - 86 };
    return { row: e.period, col: e.group };
}

/** Số electron lớp ngoài cùng. */
export const valence = (e: ElementData) => e.electronShells[e.electronShells.length - 1];
