import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { openLocalFarm } from '../src/adapters/local';
import { profileFarmDatabase } from '../src/adapters/profile';
import { openAccountFarm } from '../src/online/session';
import { authRedirect } from '../src/online/google';

it('keeps two host profiles separate and persists progress after leaving the game', async () => {
    const first = profileFarmDatabase(crypto.randomUUID()), second = profileFarmDatabase(crypto.randomUUID());
    const a = await openLocalFarm(first), b = await openLocalFarm(second);
    expect((await a.execute({ type: 'harvest', plotId: 'plot-1' })).ok).toBe(true);
    expect(a.getSnapshot().inventory.wheat).toBe(3);
    expect(b.getSnapshot().inventory.wheat).toBe(0);
    await a.close(); await b.close();
    const reopened = await openLocalFarm(first);
    expect(reopened.getSnapshot().inventory.wheat).toBe(3);
    await reopened.close();
});

it('seeds a new online cache only from the chosen host profile without uploading', async () => {
    const first = profileFarmDatabase(crypto.randomUUID()), second = profileFarmDatabase(crypto.randomUUID());
    const a = await openLocalFarm(first), b = await openLocalFarm(second);
    await a.execute({ type: 'harvest', plotId: 'plot-1' });
    await a.close(); await b.close();
    let writes = 0;
    const transport = { read: async () => null, write: async () => { writes++; throw new Error('Unexpected upload'); } };
    const onlineA = await openAccountFarm(crypto.randomUUID(), transport, () => {}, first);
    const onlineB = await openAccountFarm(crypto.randomUUID(), transport, () => {}, second);
    expect(onlineA.getSnapshot().inventory.wheat).toBe(3);
    expect(onlineB.getSnapshot().inventory.wheat).toBe(0);
    await onlineA.sync(); await onlineB.sync();
    expect(writes).toBe(0);
    await onlineA.close(); await onlineB.close();
});

it('keeps the deployed nested farm route as the OAuth destination', () => {
    expect(authRedirect('https://zeusato.github.io/Genius-kids/games/farm?code=secret#token=private'))
        .toBe('https://zeusato.github.io/Genius-kids/games/farm');
    expect(() => profileFarmDatabase('')).toThrow();
});
