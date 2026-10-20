import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PapercutArtwork } from '../model';
import { TEMPLATES } from '../content/templates';
import { replay } from '../engine/recipe';
import { area } from '../engine/poly';
import { clearPapercutData, closeDatabase, DATABASE, listArtworks, readArtwork, removeArtwork, saveArtwork, saveThumbnail } from './repository';

const scope = { account: 'guest', student: 'papercut-test' };
const art = (over: Partial<PapercutArtwork> = {}): PapercutArtwork => {
  const t = TEMPLATES[0];
  return { ...scope, id: crypto.randomUUID(), name: 'Bông tuyết', spec: t.spec, ops: t.ops(), templateId: t.id, createdAt: '2026-10-20T00:00:00.000Z', updatedAt: '', revision: 0, ...over };
};
beforeEach(async () => { await closeDatabase(); await new Promise<void>((res, rej) => { const r = indexedDB.deleteDatabase(DATABASE); r.onsuccess = () => res(); r.onerror = () => rej(r.error); }); });

describe('papercut repository', () => {
  it('round-trips the recipe exactly and isolates scopes', async () => {
    const a = art(), other = art({ account: 'other' });
    await saveArtwork(a, 0); await saveArtwork(other, 0); await closeDatabase();
    const back = await readArtwork(scope, a.id);
    expect(area(replay(back!.spec, back!.ops).sheet)).toBeCloseTo(area(replay(a.spec, a.ops).sheet), 9);
    expect(await readArtwork({ ...scope, account: 'other' }, a.id)).toBeUndefined();
    expect(await listArtworks(scope)).toHaveLength(1);
    await clearPapercutData(scope);
    expect(await listArtworks(scope)).toHaveLength(0);
    expect(await listArtworks({ ...scope, account: 'other' })).toHaveLength(1);
  });
  it('rejects a stale tab and a stale thumbnail', async () => {
    const a = art(); a.revision = await saveArtwork(a, 0);
    const old = structuredClone(a); a.name = 'Mới hơn'; a.revision = await saveArtwork(a, 1);
    await expect(saveArtwork(old, 1)).rejects.toThrow('tab khác');
    await saveThumbnail(scope, a.id, 1, new Blob(['old']));
    expect((await listArtworks(scope))[0].thumb).toBeUndefined();
    await saveThumbnail(scope, a.id, 2, new Blob(['new']));
    expect((await listArtworks(scope))[0].thumb?.size).toBe(3);
    await removeArtwork(scope, a.id);
    expect(await listArtworks(scope)).toHaveLength(0);
  });
  it('refuses malformed records', async () => {
    await expect(saveArtwork(art({ ops: [{ kind: 'fold', p: { x: NaN, y: 0 }, n: { x: 1, y: 0 }, valley: true }] }), 0)).rejects.toThrow('không hợp lệ');
  });
});
