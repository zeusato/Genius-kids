import { it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import type { StudentProfile } from '../../../types';
import type { Artwork } from '../model';
import { persistColoring } from './progress';
import { saveArt, readArt, listArt, clearColoringData, updateThumbnail } from './artworkRepo';
it('awards once, preserves other profiles and keeps failed writes atomic', () => { const profiles = [{ id: 'a', stars: 3 }, { id: 'b', stars: 7 }] as StudentProfile[]; let writes = 0; const first = persistColoring(profiles, 'a', 'fish', () => writes++); const repeat = persistColoring(first.profiles, 'a', 'fish', () => writes++); expect(repeat.earned).toBe(0); expect(repeat.profiles[0].stars).toBe(4); expect(repeat.profiles[1]).toBe(profiles[1]); expect(writes).toBe(1); const second = persistColoring(repeat.profiles, 'a', 'cat', () => writes++); expect(second.profiles[0].stars).toBe(5); const fail = persistColoring(second.profiles, 'a', 'dog', () => { throw Error('quota'); }); expect(fail.ok).toBe(false); expect(fail.profiles).toBe(second.profiles); expect(persistColoring(profiles, 'missing', 'cat', () => writes++).ok).toBe(false); });
it('separates owners, detects stale tabs and deletes only the removed student', async () => { const a: Artwork = { owner: 'test-a', id: 'fish', rev: 'r1', revision: 0, ops: [], updated: 1, complete: false, scene: 'ocean' }; expect(await saveArt(a, 0)).toBe(1); expect(await saveArt({ ...a, owner: 'test-b' }, 0)).toBe(1); await expect(saveArt(a, 0)).rejects.toThrow('tab khác'); expect((await readArt('test-a', 'fish'))?.revision).toBe(1); await Promise.allSettled([saveArt({ ...a, updated: 2 }, 1), saveArt({ ...a, updated: 3 }, 1)]); expect((await readArt('test-a', 'fish'))?.revision).toBe(2); await clearColoringData('test-a'); expect(await listArt('test-a')).toEqual([]); expect(await listArt('test-b')).toHaveLength(1); await clearColoringData('test-b'); });
it('ignores stale thumbnail writes without replacing a newer journal',async()=>{
 const art:Artwork={owner:'thumb-test',id:'fish',rev:'1',revision:0,ops:[],updated:1,complete:false,scene:'ocean'};
 await saveArt(art,0);await saveArt({...art,complete:true},1);
 await updateThumbnail('thumb-test','fish',1,'old');
 expect((await readArt('thumb-test','fish'))?.thumb).toBeUndefined();
 await updateThumbnail('thumb-test','fish',2,'new');
 const stored=await readArt('thumb-test','fish');expect(stored?.thumb).toBe('new');expect(stored?.complete).toBe(true);expect(stored?.revision).toBe(2);
 await clearColoringData('thumb-test');
});
