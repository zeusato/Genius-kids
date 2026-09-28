import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createCutUniforms, createWaves, inCutWindow, NO_WAVES, shellPoint, shellRadius, ShellState, WAVE_COUNT } from './shell';

const dirs = Array.from({ length: 40 }, (_, i) => {
    const y = 1 - ((i + 0.5) / 40) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996;
    return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
});

describe('shellRadius — vỏ hướng tâm', () => {
    it('cầu: mọi hướng cùng một bán kính', () => {
        for (const d of dirs) expect(shellRadius(d.x, d.y, d.z, { half: [2, 2, 2], exp: 2 })).toBeCloseTo(2, 6);
    });

    it('hộp bo tròn (siêu elip): theo trục đúng bằng nửa kích thước, theo đường chéo nằm giữa elip và góc hộp', () => {
        const box = { half: [3, 2, 1.5] as [number, number, number], exp: 5 };
        expect(shellRadius(1, 0, 0, box)).toBeCloseTo(3, 6);
        expect(shellRadius(0, 1, 0, box)).toBeCloseTo(2, 6);
        expect(shellRadius(0, 0, -1, box)).toBeCloseTo(1.5, 6);
        const d = new THREE.Vector3(3, 2, 1.5).normalize();
        const r = shellRadius(d.x, d.y, d.z, box);
        const ellipse = shellRadius(d.x, d.y, d.z, { half: box.half, exp: 2 });
        expect(r).toBeGreaterThan(ellipse);
        expect(r).toBeLessThan(Math.hypot(3, 2, 1.5));
    });

    it('hình que: tiết diện vuông góc trục x luôn tròn', () => {
        const rod = { half: [2.5, 1, 1] as [number, number, number], exp: 3.2, round: true };
        const base = shellRadius(0.3, Math.sqrt(1 - 0.09), 0, rod);
        for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            const s = Math.sqrt(1 - 0.09);
            expect(shellRadius(0.3, Math.cos(a) * s, Math.sin(a) * s, rod)).toBeCloseTo(base, 6);
        }
    });
});

describe('shellPoint — sóng màng và thắt eo', () => {
    const waves = createWaves('test', { freq: 1.5, speed: 0.4 });

    it('trọng số các sóng cộng lại bằng 1 → |δ| không vượt biên độ', () => {
        expect(waves.ta).toHaveLength(WAVE_COUNT);
        expect(waves.ta.reduce((s, t) => s + t.y, 0)).toBeCloseTo(1, 6);
        const st: ShellState = { shape: { half: [2, 2, 2], exp: 2 }, waves, amp: 0.05, pinch: 0, pinchWidth: 0.3 };
        const p = new THREE.Vector3();
        for (const d of dirs) {
            for (const t of [0, 1.7, 12.3]) {
                const r = shellPoint(p, d, st, t).length();
                expect(r).toBeGreaterThanOrEqual(2 * 0.95 - 1e-9);
                expect(r).toBeLessThanOrEqual(2 * 1.05 + 1e-9);
            }
        }
    });

    it('không có sóng → điểm nằm đúng trên vỏ tĩnh', () => {
        const st: ShellState = { shape: { half: [3, 2, 1.5], exp: 5 }, waves: NO_WAVES, amp: 0, pinch: 0, pinchWidth: 0.3 };
        const p = new THREE.Vector3();
        for (const d of dirs) expect(shellPoint(p, d, st, 5).length()).toBeCloseTo(shellRadius(d.x, d.y, d.z, st.shape), 6);
    });

    it('thắt eo: hẹp nhất ở mặt phẳng x = 0, hai đầu không đổi', () => {
        const st: ShellState = { shape: { half: [2, 1, 1], exp: 2 }, waves: NO_WAVES, amp: 0, pinch: 0.6, pinchWidth: 0.3 };
        const p = new THREE.Vector3();
        expect(shellPoint(p, new THREE.Vector3(0, 1, 0), st, 0).length()).toBeCloseTo(0.4, 6);
        expect(shellPoint(p, new THREE.Vector3(1, 0, 0), st, 0).length()).toBeCloseTo(2 * (1 - 0.6 * Math.exp(-((1 / 0.3) ** 2))), 6);
    });
});

describe('inCutWindow — cửa sổ cắt quay về camera', () => {
    it('đóng (cos > 1) thì không điểm nào nằm trong cửa sổ', () => {
        const cut = createCutUniforms([2, 2, 2]);
        expect(inCutWindow(new THREE.Vector3(0, 0, 2), cut)).toBe(false);
    });

    it('mở 60°: điểm hướng về trục nằm trong, điểm phía sau nằm ngoài', () => {
        const cut = createCutUniforms([2, 2, 2]);
        cut.uCutAxis.value.set(0, 0, 1);
        cut.uCutCos.value = Math.cos(Math.PI / 3);
        expect(inCutWindow(new THREE.Vector3(0.3, 0.2, 2), cut)).toBe(true);
        expect(inCutWindow(new THREE.Vector3(0, 0, -2), cut)).toBe(false);
        expect(inCutWindow(new THREE.Vector3(2, 0, 0.1), cut)).toBe(false);
    });

    it('chuẩn hóa theo nửa kích thước: cửa sổ trên hình que phủ đều theo chiều dài', () => {
        const cut = createCutUniforms([2.5, 1, 1]);
        cut.uCutAxis.value.set(0, 0, 1);
        cut.uCutCos.value = Math.cos(1.0);
        // điểm gần đầu que (x = 2) trên mặt hướng camera vẫn lọt cửa sổ nhờ chuẩn hóa x/2.5
        expect(inCutWindow(new THREE.Vector3(2, 0, 0.9), cut)).toBe(true);
    });
});
