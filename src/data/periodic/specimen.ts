// Mẫu vật 3D (sinh bằng code) của từng nguyên tố: kiểu mẫu, màu gốc (sRGB), kim loại?, độ nhám, biến thể,
// kiểu sắp xếp nguyên tử ở nhiệt độ phòng (cho tầng L1 khi lặn) và phân tử (phi kim).
// Màu kim loại chỉnh theo F0 đo quang học phổ biến (vàng ≈ 1,00/0,71/0,29 tuyến tính…), đã tinh chỉnh bằng mắt.

export type SpecimenKind = 'metal-cube' | 'ampoule' | 'crystal' | 'gas-tube' | 'gas-flask' | 'liquid' | 'radioactive' | 'atoms-only';
export type Structure = 'bcc' | 'fcc' | 'hcp' | 'diamond' | 'graphite' | 'molecular' | 'monatomic' | 'liquid' | 'other';
export type Molecule = 'H2' | 'N2' | 'O2' | 'F2' | 'Cl2' | 'Br2' | 'I2' | 'P4' | 'S8';

export interface SpecimenInfo {
    kind: SpecimenKind;
    color: string;
    metal: boolean;
    roughness: number;
    variant?: string;       // 'bismuth' | 'sulfur' | 'iodine' | 'graphite' | 'diamond' | 'phosphorus' | 'glow' | 'liquid' …
    structure: Structure;
    molecule?: Molecule;
}

const GAS_TUBE = [1, 2, 7, 8, 10, 18, 36, 54, 86];
const GAS_FLASK = [9, 17];
const AMPOULE = [3, 11, 19, 35, 37, 38, 55, 56];
const CRYSTAL = [5, 6, 14, 15, 16, 32, 33, 34, 51, 52, 53, 83];
const RADIO = [43, 61, 84, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98];
const ATOMS_ONLY = [85, 87];               // + mọi Z ≥ 99

const BCC = [3, 11, 19, 37, 55, 87, 56, 88, 23, 24, 26, 41, 42, 73, 74, 63];
const FCC = [13, 20, 38, 28, 29, 45, 46, 47, 77, 78, 79, 82, 58, 70, 90, 89];
const HCP = [4, 12, 21, 22, 27, 30, 39, 40, 43, 44, 48, 72, 75, 76, 81, 64, 65, 66, 67, 68, 69, 71, 57, 59, 60, 61, 95, 96, 97, 98];
const DIAMOND = [14, 32];
const MOLECULE: Record<number, Molecule> = { 1: 'H2', 7: 'N2', 8: 'O2', 9: 'F2', 17: 'Cl2', 35: 'Br2', 53: 'I2', 15: 'P4', 16: 'S8' };
const NOBLE = [2, 10, 18, 36, 54, 86];

const COLOR: Record<number, string> = {
    // khí: màu ánh sáng khi phóng điện (xem experiments.ts) — mẫu khí không màu
    1: '#e06bb5', 2: '#ffb08a', 7: '#c77dff', 8: '#d9c8ff', 10: '#ff4e1a', 18: '#b57cff', 36: '#ede7f6', 54: '#6fa8ff', 86: '#ff6a88',
    9: '#e8e6a0', 17: '#c9e26a', 35: '#7a1f0e',
    // phi kim, á kim rắn
    5: '#3b3b3e', 6: '#2e2e33', 14: '#7d8590', 15: '#b8322e', 16: '#f2d43a', 32: '#9aa0a6', 33: '#8a8d91', 34: '#5a5a5e',
    51: '#b9bcc0', 52: '#b5b7bb', 53: '#3a2a4a', 83: '#d8cfe0',
    // kim loại
    3: '#d9d9d6', 11: '#e2e0d8', 19: '#dcd8cc', 37: '#d6d2c6', 55: '#f1d38a', 38: '#e3dfd2', 56: '#d9d5c8',
    4: '#c9ccd0', 12: '#d9dbdd', 13: '#e8eaec', 20: '#e5e3dc', 21: '#d6d4cf', 22: '#bfb6aa', 23: '#c4c6c8', 24: '#c9ccd0',
    25: '#bdb6ae', 26: '#a9abae', 27: '#b8b9be', 28: '#d4ccbc', 29: '#f2a283', 30: '#d2d6da', 31: '#d8dce2', 39: '#cfcfcb',
    40: '#c8c6c2', 41: '#b9bcc4', 42: '#b4b7bb', 44: '#c2c4c8', 45: '#d9dadc', 46: '#d3d0c8', 47: '#f4f2ec', 48: '#c6cbd0',
    49: '#d7d9dd', 50: '#d9dcdf', 72: '#b9bbbd', 73: '#a9adb6', 74: '#b0b3b8', 75: '#bfc2c6', 76: '#9fb2c4', 77: '#d4d6da',
    78: '#d6d1c8', 79: '#ffd27a', 80: '#d8dadf', 81: '#b6b9bc', 82: '#9ca3ae',
    43: '#b9bcc0', 61: '#cfd4c8', 84: '#b7b9bb', 88: '#e6efe4', 89: '#dfe9ff', 90: '#aeb1b3', 91: '#b8bbbd', 92: '#9ea3a8',
    93: '#a9adb0', 94: '#b3aea6', 95: '#d8d6d0', 96: '#c9c7c2', 97: '#c8c8c4', 98: '#c9c9c5',
};

const ROUGH: Record<number, number> = { 79: 0.15, 47: 0.12, 29: 0.24, 26: 0.36, 82: 0.45, 76: 0.2, 74: 0.3, 80: 0.04, 24: 0.1, 78: 0.16, 13: 0.28 };

const VARIANT: Record<number, string> = {
    6: 'graphite', 16: 'sulfur', 53: 'iodine', 83: 'bismuth', 15: 'phosphorus', 5: 'lump', 14: 'shard', 32: 'shard', 33: 'lump',
    34: 'lump', 51: 'shard', 52: 'shard', 35: 'liquid', 88: 'glow', 89: 'glow', 55: 'goldish',
};

function kindOf(z: number): SpecimenKind {
    if (z === 80) return 'liquid';
    if (z >= 99 || ATOMS_ONLY.includes(z)) return 'atoms-only';
    if (GAS_TUBE.includes(z)) return 'gas-tube';
    if (GAS_FLASK.includes(z)) return 'gas-flask';
    if (AMPOULE.includes(z)) return 'ampoule';
    if (CRYSTAL.includes(z)) return 'crystal';
    if (RADIO.includes(z)) return 'radioactive';
    return 'metal-cube';
}

function structureOf(z: number): Structure {
    if (z === 80) return 'liquid';
    if (NOBLE.includes(z)) return 'monatomic';
    if (MOLECULE[z]) return 'molecular';
    if (z === 6) return 'graphite';
    if (DIAMOND.includes(z)) return 'diamond';
    if (BCC.includes(z)) return 'bcc';
    if (FCC.includes(z)) return 'fcc';
    if (HCP.includes(z)) return 'hcp';
    return 'other';
}

export function specimenOf(z: number): SpecimenInfo {
    const kind = kindOf(z);
    const structure = structureOf(z);
    const metal = !(kind === 'gas-tube' || kind === 'gas-flask' || [5, 6, 15, 16, 34, 35, 53].includes(z));
    return {
        kind,
        color: COLOR[z] ?? (metal ? '#c8cbd0' : '#9aa3ad'),
        metal,
        roughness: ROUGH[z] ?? (metal ? 0.26 : 0.55),
        variant: VARIANT[z],
        structure,
        molecule: MOLECULE[z],
    };
}
