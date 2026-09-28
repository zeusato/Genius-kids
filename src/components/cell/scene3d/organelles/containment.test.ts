import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildER, insideShell } from './erGeometry';
import { scatterInShell, insideSuperellipsoid } from './placement';
import { createRandom } from '../noise';
import { ANIMAL_ER, ANIMAL_INNER, ANIMAL_NUCLEUS, PLANT_ER, PLANT_INNER, PLANT_VAC_CENTER, PLANT_VAC_EXP, PLANT_VAC_HALF } from '../cells/layouts';

// Hồi quy lỗi bé/phụ huynh phát hiện 28/09/2026: ống lưới nội chất trơn thò ra ngoài màng tế bào.
// Lưới nội chất (và mọi bào quan) phải nằm TRỌN trong mặt trong của màng.

function allVertices(g: THREE.BufferGeometry): THREE.Vector3[] {
    const p = g.attributes.position;
    if (!p) return [];
    return Array.from({ length: p.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(p as THREE.BufferAttribute, i));
}

describe.each([
    ['động vật', ANIMAL_ER, ANIMAL_INNER],
    ['thực vật', { ...PLANT_ER, tubes: 5 }, PLANT_INNER]
] as const)('lưới nội chất của tế bào %s', (_name, params, inner) => {
    for (const high of [true, false]) {
        const geo = buildER(params, high);

        it(`tier ${high ? 'cao' : 'thấp'}: mọi đỉnh ống trơn nằm trong màng`, () => {
            const verts = allVertices(geo.smooth);
            expect(verts.length).toBeGreaterThan(0);
            const outside = verts.filter((v) => !insideShell(v, inner, 0.97));
            expect(outside).toHaveLength(0);
        });

        it(`tier ${high ? 'cao' : 'thấp'}: tấm lưới hạt được dùng (có tam giác) đều nằm trong màng`, () => {
            const pos = geo.sheets.attributes.position as THREE.BufferAttribute;
            const idx = geo.sheets.index!;
            expect(idx.count).toBeGreaterThan(0);
            const v = new THREE.Vector3();
            const used = new Set<number>();
            for (let i = 0; i < idx.count; i++) used.add(idx.getX(i));
            let outside = 0;
            for (const i of used) {
                v.fromBufferAttribute(pos, i);
                if (!insideShell(v, inner, 0.95)) outside++;
            }
            expect(outside).toBe(0);
        });

        it(`tier ${high ? 'cao' : 'thấp'}: ribôxôm bám lưới cũng nằm trong màng`, () => {
            const v = new THREE.Vector3();
            const outside = geo.ribosomes.filter((m) => !insideShell(v.setFromMatrixPosition(m), inner, 0.97)).length;
            expect(outside).toBe(0);
        });
    }
});

describe('lưới nội chất thực vật không chui vào không bào', () => {
    it('không có đỉnh ống nào bên trong không bào', () => {
        const geo = buildER({ ...PLANT_ER, tubes: 5 }, true);
        for (const v of allVertices(geo.smooth)) {
            expect(insideSuperellipsoid(v, PLANT_VAC_CENTER, PLANT_VAC_HALF, PLANT_VAC_EXP, 0)).toBe(false);
        }
    });
});

describe('scatterInShell — rải bào quan', () => {
    it('điểm rải nằm trong vỏ, ngoài vùng cấm và giữ khoảng cách', () => {
        const rand = createRandom('test-scatter');
        const avoid = [{ center: ANIMAL_NUCLEUS.center, radius: ANIMAL_NUCLEUS.radius + 0.6 }];
        const pts = scatterInShell(rand, 14, ANIMAL_INNER, { rMin: 0.4, rMax: 0.79, avoid, minGap: 0.6 });
        expect(pts.length).toBe(14);
        const nuc = new THREE.Vector3(...ANIMAL_NUCLEUS.center);
        for (const p of pts) {
            expect(insideShell(p, ANIMAL_INNER, 0.8)).toBe(true);
            expect(p.distanceTo(nuc)).toBeGreaterThanOrEqual(ANIMAL_NUCLEUS.radius + 0.6);
        }
        for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) expect(pts[i].distanceTo(pts[j])).toBeGreaterThanOrEqual(0.6);
        }
    });
});
