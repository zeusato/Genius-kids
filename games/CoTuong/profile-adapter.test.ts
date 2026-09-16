import { expect, it, vi } from 'vitest';
import type { StudentProfile } from '../../types';
import { newMatch, finishMatch } from './engine';
import { persistResult } from './profile-adapter';

const profile = (id: string): StudentProfile => ({ id, name: 'An', grade: 3, age: 8, avatarId: 0, currentAvatarId: 'avatar_01', currentThemeId: 'default', stars: 30, ownedAvatarIds: [], ownedThemeIds: [], ownedImageIds: [], history: [], gameHistory: [], shopDailyPhotos: [] });
it('records a black-owner win once without changing other profiles or currency', () => {
  const profiles = [profile('host'), profile('other')], before = structuredClone(profiles);
  const match = finishMatch(newMatch({ id: 'host', name: 'An' }, 1, 'human', 'easy', 'test-match'), 'resign', 0);
  const write = vi.fn(), result = persistResult(profiles, 'host', match, write);
  expect(result.ok).toBe(true);
  expect(profiles).toEqual(before);
  expect(result.profiles[1]).toBe(profiles[1]);
  expect(result.profiles[0].stars).toBe(30);
  expect(result.profiles[0].stats?.gameWins['co-tuong']).toBe(1);
  expect(result.profiles[0].gameHistory[0]).toMatchObject({ id: match.id, gameType: 'co-tuong', score: 1, starsEarned: 0 });
  expect(persistResult(result.profiles, 'host', match, write).profiles).toBe(result.profiles);
  expect(write).toHaveBeenCalledTimes(1);
});
it('rejects unfinished or foreign games and leaves the profile unchanged after storage failure', () => {
  const profiles = [profile('host')], match = newMatch({ id: 'host', name: 'An' }, 0, 'human', 'easy', 'test-match');
  expect(persistResult(profiles, 'host', match, vi.fn()).ok).toBe(false);
  const ended = finishMatch(match, 'agreement');
  expect(persistResult(profiles, 'other', ended, vi.fn()).ok).toBe(false);
  expect(persistResult(profiles, 'host', ended, () => { throw Error('quota'); })).toEqual({ ok: false, profiles });
  expect(persistResult(profiles, 'host', ended, vi.fn()).profiles[0].gameHistory[0].score).toBe(.5);
});
