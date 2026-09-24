import { describe, expect, it } from 'vitest';
import { heliocentricLongitude, featureLocalPosition, PLANET_FEATURES } from './astro';

const deg = (rad: number) => (rad * 180) / Math.PI;
const angDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('vị trí thật theo ngày (JPL)', () => {
    it('xuân phân 20/03/2026: Trái Đất ở kinh độ nhật tâm ~180° (Mặt Trời ở điểm xuân phân)', () => {
        const lon = deg(heliocentricLongitude('earth', new Date(Date.UTC(2026, 2, 20, 14, 46))));
        expect(angDiff(lon, 180)).toBeLessThan(1);
    });

    it('hạ chí 21/06/2026: Trái Đất ~270°', () => {
        const lon = deg(heliocentricLongitude('earth', new Date(Date.UTC(2026, 5, 21, 8, 24))));
        expect(angDiff(lon, 270)).toBeLessThan(1);
    });

    it('chu kỳ: Sao Thủy quay đúng 1 vòng sau ~88 ngày', () => {
        const d0 = new Date(Date.UTC(2026, 0, 1));
        const d1 = new Date(d0.getTime() + 87.969 * 86400000);
        expect(angDiff(deg(heliocentricLongitude('mercury', d0)), deg(heliocentricLongitude('mercury', d1)))).toBeLessThan(0.5);
    });

    it('mọi thiên thể trả về góc hợp lệ 0..2π', () => {
        for (const id of ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']) {
            const v = heliocentricLongitude(id, new Date(Date.UTC(2026, 8, 24)));
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(Math.PI * 2);
        }
    });
});

describe('địa danh trên hành tinh', () => {
    it('vị trí trên quả cầu đơn vị, đúng bán cầu', () => {
        for (const f of Object.values(PLANET_FEATURES)) {
            const [x, y, z] = featureLocalPosition(f);
            expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
            expect(Math.sign(y)).toBe(Math.sign(f.lat));
        }
    });
});
