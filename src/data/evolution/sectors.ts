// Sector = "vùng màu" của cây: màu cành phát sáng + trọng số góc của mỗi ngọn (data-spec mục J).
export type SectorId = 'bacteria' | 'archaea' | 'protist' | 'fungi' | 'plant' | 'animal' | 'trunk';

/** Node gốc của sector — mọi hậu duệ (trừ khi gặp một gốc sector khác) cùng sector. */
export const SECTOR_ROOTS: Record<string, SectorId> = {
    bacteria: 'bacteria',
    archaea: 'archaea',
    amoebozoa: 'protist',
    sar: 'protist',
    flagellates: 'protist',
    archaeplastida: 'plant',
    fungi_simple: 'fungi',
    animalia: 'animal',
};

/** "Thân cây" — đường nối các giới lớn, màu trắng xanh. */
export const TRUNK_IDS: ReadonlySet<string> = new Set(['life_origin', 'luca', 'eukarya', 'amorphea', 'opisthokonta']);

export const SECTOR_COLOR: Record<SectorId, string> = {
    bacteria: '#38bdf8',
    archaea: '#cbd5e1',
    protist: '#c084fc',
    fungi: '#fbbf24',
    plant: '#4ade80',
    animal: '#fb7185',
    trunk: '#e0f2fe',
};

export const SECTOR_LABEL: Record<SectorId, string> = {
    bacteria: 'Vi khuẩn',
    archaea: 'Cổ khuẩn',
    protist: 'Nguyên sinh vật',
    fungi: 'Nấm',
    plant: 'Thực vật & tảo',
    animal: 'Động vật',
    trunk: 'Thân cây',
};

/** Trọng số góc của MỘT ngọn — cân lại vì dữ liệu nhiều động vật (đo: động vật 49%, vi khuẩn 14%…). */
export const SECTOR_WEIGHT: Record<Exclude<SectorId, 'trunk'>, number> = {
    bacteria: 1.6,
    archaea: 1.8,
    protist: 1.8,
    fungi: 1.5,
    plant: 1.5,
    animal: 1.0,
};

export const EXTINCT_COLOR = '#9aa3ad';
export const HUMAN_COLOR = '#fde68a';
