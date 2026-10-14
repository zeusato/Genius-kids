import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { clearBricksData, listModels, newModel, readModel, saveModel, saveThumb } from './modelRepo';
import { advanceBricks } from './progress';
import { pruneMetrics } from './metrics';
it('rejects conflicting writes, ignores stale thumbnails, isolates owners and deletes both stores', async () => {
  const a = newModel('a', 'A'), b = { ...newModel('b', 'B'), id: a.id };
  expect(await saveModel(a, 0)).toBe(1); await saveModel(b, 0);
  await expect(saveModel({ ...a, name: 'stale' }, 0)).rejects.toThrow('tab khác');
  expect((await readModel('a', a.id))?.name).toBe('A');
  await saveThumb('a', a.id, 0, new Blob(['old']));
  expect((await listModels('a'))[0].thumb).toBeUndefined();
  await saveThumb('a', a.id, 1, new Blob(['new']));
  expect((await listModels('a'))[0].thumb?.size).toBe(3);
  await clearBricksData('a'); expect(await listModels('a')).toEqual([]);
  expect((await readModel('b', a.id))?.name).toBe('B'); await clearBricksData('b');
});
it('badges persist after deleting models; free building has no stars', () => {
  let p = advanceBricks(undefined, { type: 'models', count: 10 });
  for (let i = 0; i < 100; i++) p = advanceBricks(p, { type: 'placed', group: String(i % 12), heightCm: 32 });
  p = advanceBricks(p, { type: 'models', count: 0 });
  expect(p.placed).toBe(100); expect(p.badges).toHaveLength(5); expect(p.models).toBe(0); expect(p).not.toHaveProperty('stars');
});
it('keeps only 30 local calendar days of usage metrics', () => {
  expect(pruneMetrics({ '2026-09-15': {}, '2026-09-16': { placed: 1 }, '2026-10-15': { placed: 2 } }, new Date('2026-10-15T12:00:00'))).toEqual({ '2026-09-16': { placed: 1 }, '2026-10-15': { placed: 2 } });
});
