import * as THREE from 'three';

/**
 * Bảng màu và vật liệu dùng chung của bàn đồ chơi (theo bản thử proto/bench.html).
 * Vật liệu tĩnh tạo một lần cho cả phiên; vật liệu có trạng thái riêng (kính bóng, LED…) tạo theo linh kiện.
 */
export const INK = '#1f2a37';
export const PALETTE = {
    board: '#f2e6cd', peg: '#dccba6', cream: '#f6ecd8', teal: '#4f9c95', tealDark: '#3d7f79', coral: '#e07c64',
    cellBody: '#fbf6ea', brass: '#d9b25e', steel: '#c8ced6', copper: '#e39a64', ink: INK,
    wireTeal: '#4f9c95', wireCoral: '#e07c64', wireGold: '#f0c060', wireGrey: '#9b9286',
    electron: '#8fe6ff', conventional: '#ffd27a',
} as const;

const std = (color: string, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });

let cache: ReturnType<typeof build> | null = null;
function build() {
    return {
        board: std(PALETTE.board, { roughness: 0.78 }),
        boardEdge: std('#e3d2b0', { roughness: 0.85 }),
        peg: std(PALETTE.peg, { roughness: 0.95 }),
        cream: std(PALETTE.cream, { roughness: 0.5 }),
        teal: std(PALETTE.teal, { roughness: 0.48 }),
        tealDark: std(PALETTE.tealDark, { roughness: 0.55 }),
        coral: std(PALETTE.coral, { roughness: 0.42 }),
        cellBody: std(PALETTE.cellBody, { roughness: 0.35 }),
        cellFlat: std('#9aa39d', { roughness: 0.5 }),
        brass: std(PALETTE.brass, { metalness: 1, roughness: 0.28 }),
        steel: std(PALETTE.steel, { metalness: 1, roughness: 0.3 }),
        darkSteel: std('#5d6670', { metalness: 0.8, roughness: 0.4 }),
        copper: std(PALETTE.copper, { metalness: 1, roughness: 0.32 }),
        zinc: std('#aeb6bd', { metalness: 0.9, roughness: 0.45 }),
        rubber: std('#2f3638', { roughness: 0.7 }),
        white: std('#fbfaf5', { roughness: 0.4 }),
        beige: std('#e2c793', { roughness: 0.55 }),
        lemon: std('#f1cf45', { roughness: 0.55 }),
        potato: std('#b98b5c', { roughness: 0.85 }),
        glass: new THREE.MeshPhysicalMaterial({ color: '#eef6f4', roughness: 0.1, transparent: true, opacity: 0.35, clearcoat: 1, depthWrite: false }),
        shadowDisc: new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.18, depthWrite: false }),
        ink: new THREE.MeshBasicMaterial({ color: INK, transparent: true, depthWrite: false }),
        paper: new THREE.MeshStandardMaterial({ map: paperTexture(), roughness: 0.92, transparent: true }),
        pool: new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
        select: new THREE.MeshBasicMaterial({ color: '#f2c14e', transparent: true, depthWrite: false }),
    };
}
export type Materials = ReturnType<typeof build>;
export function materials(): Materials { return cache ??= build(); }

/** Vật liệu HDR (màu nhân > 1) để bloom bắt được; tier thấp dùng màu thường. */
export function glowColor(hex: string, gain: number) { return new THREE.Color(hex).multiplyScalar(gain); }

// ------------------------------------------------------------------ canvas textures (sinh bằng code, không tải file)
function canvas(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

export function radialTexture(): THREE.Texture {
    const c = canvas(256, 256), g = c.getContext('2d')!;
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,214,140,1)'); gr.addColorStop(0.35, 'rgba(255,190,110,.45)'); gr.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** Giấy kẻ ô cho góc nhìn Sơ đồ: ô nhỏ 0,25 đơn vị, ô lớn 1 đơn vị (khớp lưới lỗ bàn). */
export function paperTexture(): THREE.Texture {
    const PX = 64, c = canvas(PX * 4, PX * 4), g = c.getContext('2d')!;
    g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i <= 16; i++) {
        g.strokeStyle = i % 4 ? '#dde9f3' : '#bcd3e6'; g.lineWidth = i % 4 ? 1.5 : 3;
        g.beginPath(); g.moveTo(i * PX / 4, 0); g.lineTo(i * PX / 4, c.height); g.stroke();
        g.beginPath(); g.moveTo(0, i * PX / 4); g.lineTo(c.width, i * PX / 4); g.stroke();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    return t;
}

/** Atlas kí tự trắng (tô màu bằng instanceColor) cho nhãn cọc, số hiệu linh kiện và chữ trong kí hiệu. */
export const GLYPHS = ['+', '−', 'A', 'B', 'C', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'V', 'M', 'G', 'K', 'L', 'R', 'N', 'S', 'Ω'] as const;
export type Glyph = typeof GLYPHS[number];
const ATLAS_COLS = 8, ATLAS_CELL = 96;
export const ATLAS = { cols: ATLAS_COLS, rows: Math.ceil(GLYPHS.length / ATLAS_COLS) };
let atlas: THREE.Texture | null = null;
export function glyphAtlas(): THREE.Texture {
    if (atlas) return atlas;
    const c = canvas(ATLAS_COLS * ATLAS_CELL, ATLAS.rows * ATLAS_CELL), g = c.getContext('2d')!;
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    GLYPHS.forEach((ch, i) => {
        const x = (i % ATLAS_COLS + 0.5) * ATLAS_CELL, y = (Math.floor(i / ATLAS_COLS) + 0.5) * ATLAS_CELL;
        g.font = `900 ${ch === '+' || ch === '−' ? 92 : 74}px ElectricityNunito, Nunito, "Segoe UI", sans-serif`;
        g.fillText(ch, x, y + 5);
    });
    atlas = new THREE.CanvasTexture(c); atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 8; atlas.generateMipmaps = true;
    return atlas;
}
export function glyphOffset(ch: Glyph): [number, number] {
    const i = GLYPHS.indexOf(ch);
    return [(i % ATLAS_COLS) / ATLAS_COLS, 1 - (Math.floor(i / ATLAS_COLS) + 1) / ATLAS.rows];
}

/** Vật liệu cho InstancedMesh nhãn: mỗi instance chọn ô atlas qua thuộc tính aGlyph (offset UV). */
export function glyphMaterial(): THREE.MeshBasicMaterial {
    const m = new THREE.MeshBasicMaterial({ map: glyphAtlas(), transparent: true, depthWrite: false, toneMapped: false });
    m.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nattribute vec2 aGlyph;')
            .replace('#include <uv_vertex>', `#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = vMapUv * vec2(${(1 / ATLAS_COLS).toFixed(6)}, ${(1 / ATLAS.rows).toFixed(6)}) + aGlyph;\n#endif`);
    };
    m.customProgramCacheKey = () => 'ew-glyph';
    return m;
}
