import * as THREE from 'three';

// Texture vân procedural cho các lớp địa tầng — vẽ canvas 1 lần rồi cache,
// không cần tải asset. Vân deterministic (seed từ key) để mỗi lần mở giống nhau.
// 5 chất liệu: nham thạch nóng chảy / đá / kim loại / băng / khí.

export type LayerTextureKind = 'molten' | 'rock' | 'metallic' | 'ice' | 'gas';

// Gán chất liệu cho từng lớp (bodyId/layerId) — tách khỏi planetLayersData
// vì đây là chi tiết render, không phải nội dung dạy học. Mặc định 'rock'.
const LAYER_KIND: Record<string, LayerTextureKind> = {
    'sun/core': 'molten',
    'sun/radiative': 'gas',
    'sun/convective': 'molten',
    'sun/photosphere': 'molten',
    'mercury/core': 'metallic',
    'mercury/mantle': 'rock',
    'mercury/crust': 'rock',
    'venus/core': 'metallic',
    'venus/mantle': 'molten',
    'venus/crust': 'rock',
    'earth/inner-core': 'metallic',
    'earth/outer-core': 'molten',
    'earth/mantle': 'molten',
    'earth/crust': 'rock',
    'mars/core': 'molten',
    'mars/mantle': 'rock',
    'mars/crust': 'rock',
    'jupiter/core': 'molten',
    'jupiter/metallic': 'metallic',
    'jupiter/molecular': 'ice',
    'jupiter/clouds': 'gas',
    'saturn/core': 'molten',
    'saturn/metallic': 'metallic',
    'saturn/molecular': 'ice',
    'saturn/clouds': 'gas',
    'uranus/core': 'rock',
    'uranus/ice-mantle': 'ice',
    'uranus/atmosphere': 'gas',
    'neptune/core': 'rock',
    'neptune/ice-mantle': 'ice',
    'neptune/atmosphere': 'gas'
};

export function layerKind(bodyId: string, layerId: string): LayerTextureKind {
    return LAYER_KIND[`${bodyId}/${layerId}`] ?? 'rock';
}

// RNG deterministic nhỏ gọn
function hashStr(s: string): number {
    let h = 1779033703;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
}

function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Trộn màu hex về trắng (f>0) hoặc đen (f<0), trả về rgba string
function shade(hex: string, f: number, alpha = 1): string {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f >= 0) {
        r = Math.round(r + (255 - r) * f);
        g = Math.round(g + (255 - g) * f);
        b = Math.round(b + (255 - b) * f);
    } else {
        r = Math.round(r * (1 + f));
        g = Math.round(g * (1 + f));
        b = Math.round(b * (1 + f));
    }
    return `rgba(${r},${g},${b},${alpha})`;
}

const SIZE = 256;
const cache = new Map<string, THREE.CanvasTexture>();

// Cache giữ vĩnh viễn (vài chục texture 256² — không đáng kể), tái dùng giữa các body
export function getLayerTexture(kind: LayerTextureKind, color: string): THREE.CanvasTexture {
    const key = `${kind}:${color}`;
    const hit = cache.get(key);
    if (hit) return hit;

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    const rnd = mulberry32(hashStr(key));

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, SIZE, SIZE);

    if (kind === 'molten') {
        // Nham thạch: đốm sáng loang + vệt chảy cong
        for (let i = 0; i < 30; i++) {
            const x = rnd() * SIZE, y = rnd() * SIZE, r = 12 + rnd() * 40;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            const hot = rnd() > 0.35;
            g.addColorStop(0, shade(color, hot ? 0.45 : -0.3, 0.5));
            g.addColorStop(1, shade(color, 0, 0));
            ctx.fillStyle = g;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
        ctx.lineCap = 'round';
        for (let i = 0; i < 9; i++) {
            ctx.strokeStyle = shade(color, 0.55, 0.22 + rnd() * 0.15);
            ctx.lineWidth = 1.5 + rnd() * 2;
            ctx.beginPath();
            const y0 = rnd() * SIZE;
            ctx.moveTo(0, y0);
            ctx.bezierCurveTo(SIZE * 0.3, y0 + (rnd() - 0.5) * 90, SIZE * 0.7, y0 + (rnd() - 0.5) * 90, SIZE, y0 + (rnd() - 0.5) * 50);
            ctx.stroke();
        }
    } else if (kind === 'rock') {
        // Đá: hạt lấm tấm + vài đường nứt
        for (let i = 0; i < 500; i++) {
            const x = rnd() * SIZE, y = rnd() * SIZE, r = 0.6 + rnd() * 2.2;
            ctx.fillStyle = shade(color, rnd() > 0.5 ? 0.2 + rnd() * 0.2 : -(0.15 + rnd() * 0.25), 0.35);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        for (let i = 0; i < 6; i++) {
            ctx.strokeStyle = shade(color, -0.4, 0.35);
            ctx.lineWidth = 1;
            ctx.beginPath();
            let x = rnd() * SIZE, y = rnd() * SIZE;
            ctx.moveTo(x, y);
            for (let s = 0; s < 5; s++) {
                x += (rnd() - 0.5) * 70;
                y += (rnd() - 0.3) * 50;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    } else if (kind === 'metallic') {
        // Kim loại: dải ánh chéo + lấp lánh thưa
        ctx.save();
        ctx.translate(SIZE / 2, SIZE / 2);
        ctx.rotate(-0.5);
        for (let i = 0; i < 16; i++) {
            const y = -SIZE + rnd() * SIZE * 2;
            const h = 6 + rnd() * 22;
            ctx.fillStyle = shade(color, rnd() > 0.45 ? 0.28 : -0.2, 0.2);
            ctx.fillRect(-SIZE, y, SIZE * 2, h);
        }
        ctx.restore();
        for (let i = 0; i < 60; i++) {
            ctx.fillStyle = shade(color, 0.6, 0.3);
            const x = rnd() * SIZE, y = rnd() * SIZE;
            ctx.fillRect(x, y, 1.5 + rnd() * 2, 1.5);
        }
    } else if (kind === 'ice') {
        // Băng/chất lỏng đặc: vân lượn ngang mềm
        ctx.lineCap = 'round';
        for (let i = 0; i < 16; i++) {
            const y0 = rnd() * SIZE;
            ctx.strokeStyle = shade(color, rnd() > 0.4 ? 0.3 + rnd() * 0.2 : -0.18, 0.25);
            ctx.lineWidth = 3 + rnd() * 7;
            ctx.beginPath();
            ctx.moveTo(0, y0);
            ctx.bezierCurveTo(SIZE * 0.33, y0 + (rnd() - 0.5) * 40, SIZE * 0.66, y0 + (rnd() - 0.5) * 40, SIZE, y0 + (rnd() - 0.5) * 24);
            ctx.stroke();
        }
    } else {
        // Khí: dải mây ngang nhiều tầng
        for (let i = 0; i < 18; i++) {
            const y0 = rnd() * SIZE;
            const h = 8 + rnd() * 26;
            const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
            const tint = rnd() > 0.45 ? 0.22 + rnd() * 0.15 : -(0.12 + rnd() * 0.15);
            g.addColorStop(0, shade(color, tint, 0));
            g.addColorStop(0.5, shade(color, tint, 0.35));
            g.addColorStop(1, shade(color, tint, 0));
            ctx.fillStyle = g;
            ctx.fillRect(0, y0, SIZE, h);
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    cache.set(key, tex);
    return tex;
}
