import { expect, it } from 'vitest';
import { clearCoTuongData, loadDraft, loadPrefs, persistResult, recordsFor, saveDraft, type Store } from './persistence';
import { finishMatch, newMatch } from './engine';
function memory(): Store { const map = new Map<string, string>(); return { getItem: k => map.get(k) ?? null, setItem: (k, v) => { map.set(k, v); }, removeItem: k => { map.delete(k); } }; }
it('loads seating and retires the old handoff preference', () => {
  const store = memory(), key = 'co-tuong:standalone:a:prefs';
  store.setItem(key, JSON.stringify({ handoff: true, sound: false }));
  expect(loadPrefs('a', store)).toMatchObject({ seating: 'opposite', sound: false });
  expect(loadPrefs('a', store)).not.toHaveProperty('handoff');
  store.setItem(key, JSON.stringify({ seating: 'same' }));
  expect(loadPrefs('a', store).seating).toBe('same');
  store.setItem(key, JSON.stringify({ seating: 'invalid' }));
  expect(loadPrefs('a', store).seating).toBe('opposite');
});
it('stores black-owner results once and clears only this owner', () => {
  const store = memory(), a = finishMatch(newMatch({ id: 'a', name: 'A' }, 1, 'human', 'easy'), 'resign', 0), b = newMatch({ id: 'b', name: 'B' }, 0, 'human', 'easy');
  expect(saveDraft(a, store)).toBe(true); saveDraft(b, store); expect(loadDraft('a', store).match).toEqual(a);
  expect(persistResult(a, store)).toBe(true); expect(persistResult(a, store)).toBe(true);
  expect(recordsFor('a', store)).toHaveLength(1); expect(recordsFor('a', store)[0].hostResult).toBe('win');
  clearCoTuongData('a', store); expect(loadDraft('a', store).match).toBeNull(); expect(loadDraft('b', store).match).toEqual(b);
});
it('keeps an ended draft when result storage fails, then allows retry', () => {
  const store = memory(), m = finishMatch(newMatch({ id: 'a', name: 'A' }, 0, 'human', 'easy'), 'agreement');
  saveDraft(m, store); const broken = { ...store, setItem: () => { throw new Error('quota'); } };
  expect(persistResult(m, broken)).toBe(false); expect(loadDraft('a', store).match).toEqual(m); expect(persistResult(m, store)).toBe(true);
});
