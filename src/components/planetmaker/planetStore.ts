// Lưu/đọc hành tinh tự tạo — 1 hành tinh mỗi học sinh, localStorage (~30KB/bé).
import { createTerrain, deserializeTerrain } from './terrainOps';

export interface PlanetCosmetics {
    atmosphere: string | null; // màu viền khí quyển, null = không có
    clouds: boolean;
    rings: boolean;
    moons: number; // 0..2
}

export interface CustomPlanetDoc {
    version: 1;
    name: string;
    elevation: string; // base64 Int8 (quantized)
    paint: string;     // base64
    trees: string;     // base64 Uint16 (chỉ số đỉnh)
    seaLevel: number;
    cosmetics: PlanetCosmetics;
    showInSolar: boolean; // hiện trong scene Hệ Mặt Trời chính
    updatedAt: string;
    settlement?: { name: string; buildings: number; residents: number; marker: [number, number, number] };
}

export const DEFAULT_COSMETICS: PlanetCosmetics = {
    atmosphere: '#7EC8E3',
    clouds: true,
    rings: false,
    moons: 1
};

const key = (studentId: string) => `planet_maker_v1_${studentId}`;

export function loadCustomPlanet(studentId?: string | null): CustomPlanetDoc | null {
    try {
        const raw = localStorage.getItem(key(studentId || 'guest'));
        if (!raw) return null;
        const doc = JSON.parse(raw) as CustomPlanetDoc;
        if (doc.version !== 1 || typeof doc.name !== 'string' || !doc.cosmetics || !Number.isFinite(doc.seaLevel) || typeof doc.showInSolar !== 'boolean' || !deserializeTerrain(createTerrain(5), doc)) return null;
        return doc;
    } catch {
        return null;
    }
}

export function saveCustomPlanet(studentId: string | undefined | null, doc: CustomPlanetDoc): void {
    localStorage.setItem(key(studentId || 'guest'), JSON.stringify(doc));
}
