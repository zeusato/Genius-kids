import { describe, expect, it } from 'vitest';
import { CUTAWAY_BODIES } from '../../../data/planetLayersData';
import { maxTemperatureC } from './CutawayPlanet';

describe('đọc nhiệt độ lớp địa tầng', () => {
    it('hiểu các kiểu chuỗi trong dữ liệu', () => {
        expect(maxTemperatureC('~4.000 – 5.000°C')).toBe(5000);
        expect(maxTemperatureC('15 triệu °C')).toBe(15e6);
        expect(maxTemperatureC('2 triệu → 5.500°C')).toBe(2e6);
        expect(maxTemperatureC('-180°C đến 430°C')).toBe(430);
        expect(maxTemperatureC('mát mẻ dễ chịu')).toBeNull();
    });

    it('lõi Trái Đất nóng hơn manti, manti nóng hơn vỏ', () => {
        const earth = CUTAWAY_BODIES.find((b) => b.id === 'earth')!;
        const t = (id: string) => maxTemperatureC(earth.layers.find((l) => l.id === id)!.temperature) ?? -Infinity;
        expect(t('inner-core')).toBeGreaterThan(t('mantle'));
        expect(t('mantle')).toBeGreaterThan(t('crust'));
    });
});
