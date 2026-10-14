import { expect, it, vi } from 'vitest';
import { ModelSaveQueue } from './saveQueue';
import { newModel } from './modelRepo';

it('serializes overlapping flushes and includes edits made while a write is pending', async () => {
  const base = newModel('owner', 'first'); base.revision = 3;
  let finish!: (rev: number) => void;
  const write = vi.fn().mockImplementationOnce(() => new Promise<number>(r => { finish = r; })).mockResolvedValueOnce(5);
  const q = new ModelSaveQueue(base, write);
  q.update({ ...base, name: 'second' });
  const a = q.flush();
  q.update({ ...base, name: 'third' });
  const b = q.flush();
  expect(write).toHaveBeenCalledTimes(1);
  finish(4); await Promise.all([a, b]);
  expect(write.mock.calls.map(c => [c[0].name, c[1]])).toEqual([['second', 3], ['third', 4]]);
  expect(q.saved.name).toBe('third'); expect(q.dirty).toBe(false);
});

it('keeps failed changes retryable and never advances the revision after rejection', async () => {
  const base = newModel('owner', 'first'); base.revision = 2;
  const write = vi.fn().mockRejectedValueOnce(Error('quota')).mockResolvedValueOnce(3);
  const q = new ModelSaveQueue(base, write); q.update({ ...base, name: 'unsaved' });
  await expect(q.flush()).rejects.toThrow('quota');
  expect(q.dirty).toBe(true); expect(q.latest.name).toBe('unsaved');
  await q.flush(); expect(write.mock.calls[1][1]).toBe(2); expect(q.dirty).toBe(false);
});
