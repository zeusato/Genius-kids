import { describe, expect, it } from 'vitest';
import type { StudentProfile } from '../../../types';
import { persistPapercut } from './progress';

const kid = { id: 'k1', name: 'Bé', grade: 2, stars: 0 } as unknown as StudentProfile;

describe('papercut rewards', () => {
  it('pays each key once and grants badges', () => {
    let profiles = [kid];
    const write = (p: StudentProfile[]) => { profiles = p; };
    const a = persistPapercut(profiles, 'k1', { kind: 'save', id: 'a', pieces: 1, maxLayers: 6 }, write);
    expect(a.earned).toBe(3); // first + art:a + six
    expect(a.badges).toEqual(['Đôi tay khéo', 'Bông tuyết đầu tiên']);
    const again = persistPapercut(profiles, 'k1', { kind: 'save', id: 'a', pieces: 1, maxLayers: 6 }, write);
    expect(again.earned).toBe(0);
    expect(persistPapercut(profiles, 'k1', { kind: 'save', id: 'b', pieces: 3, maxLayers: 4 }, write).badges).toEqual(['Dây người nắm tay']);
    expect(persistPapercut(profiles, 'k1', { kind: 'guide' }, write).earned).toBe(1);
    expect(persistPapercut(profiles, 'k1', { kind: 'guide' }, write).earned).toBe(0);
    expect(profiles[0].papercut?.badges).toContain('Người chia sẻ');
  });
  it('caps artwork stars at 20', () => {
    let profiles = [kid];
    const write = (p: StudentProfile[]) => { profiles = p; };
    let total = 0;
    for (let i = 0; i < 30; i++) total += persistPapercut(profiles, 'k1', { kind: 'save', id: 'x' + i, pieces: 1, maxLayers: 1 }, write).earned;
    expect(total).toBe(1 + 20 + 1); // first + 20 tác phẩm + ten
  });
});
