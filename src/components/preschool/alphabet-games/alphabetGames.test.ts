import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALPHABET_WORDS, LETTER_IDS, WORDS_BY_LETTER } from './content';
import { buildListenRounds, buildMatchBoards, buildWordRounds, mulberry32, shuffle } from './sequence';
import { completePracticeSession, mastered, readAlphabetPractice, recordOutcome } from './progress';
import { completeAlphabetPractice, persistAlphabetPractice } from './persistence';
import { createProfile, migrateProfile } from '../../../../services/profileService';
import { Grade } from '../../../../types';
import type { AlphabetSession } from './types';

describe('alphabet activity content and seeded sequences', () => {
    it('has exactly 53 reviewed entries covering A-Z with stable unique ids', () => {
        expect(ALPHABET_WORDS).toHaveLength(53);
        expect(new Set(ALPHABET_WORDS.map(item => item.id)).size).toBe(53);
        expect(new Set(ALPHABET_WORDS.map(item => item.letterId))).toEqual(new Set(LETTER_IDS));
        for (const item of ALPHABET_WORDS) { expect(item.wordEn.startsWith(item.letterId)).toBe(true); expect(item.wordVi.length).toBeGreaterThan(1); expect(item.art).toContain('/preschool/alphabet-games/objects/'); }
        expect(WORDS_BY_LETTER.x.map(item => item.id)).toEqual(['xylophone']);
    });
    it('uses a reproducible Fisher-Yates shuffle without mutating input', () => {
        const input = [1,2,3,4,5], a = shuffle(input, mulberry32(123)), b = shuffle(input, mulberry32(123));
        expect(a).toEqual(b); expect(a).not.toEqual(input); expect(input).toEqual([1,2,3,4,5]);
    });
    it.each(['intro','practice','challenge'] as const)('builds valid word sessions for 200 seeds at %s', level => {
        for (let seed = 0; seed < 200; seed++) for (const round of buildWordRounds(seed, level)) {
            expect(round.options.length).toBeGreaterThanOrEqual(3); expect(new Set(round.options.map(o => o.id)).size).toBe(round.options.length);
            expect(round.correctIds.length).toBeGreaterThan(0); expect(round.correctIds.every(id => round.options.some(o => o.id === id))).toBe(true);
        }
    });
    it('keeps the X-only practice solvable at every level', () => {
        for (const level of ['intro','practice','challenge'] as const) for (const round of buildWordRounds(9, level, 'x')) { expect(round.mode).toBe('one'); expect(round.correctIds).toEqual(['xylophone']); }
    });
    it.each(['intro','practice','challenge'] as const)('builds two bijective post boards at %s', level => {
        const boards = buildMatchBoards(77, level), size = level === 'intro' ? 3 : level === 'practice' ? 4 : 5;
        expect(boards).toHaveLength(2); expect(boards.every(b => b.letterIds.length === size && new Set(b.letterIds).size === size)).toBe(true);
    });
    it.each(['intro','practice','challenge'] as const)('builds six sound rounds with one target at %s', level => {
        const count = level === 'intro' ? 2 : level === 'practice' ? 3 : 4;
        for (const round of buildListenRounds(44, level)) { expect(round.options).toHaveLength(count); expect(round.options.filter(id => id === round.letterId)).toHaveLength(1); expect(new Set(round.options).size).toBe(count); }
    });
});

describe('alphabet practice progress and persistence', () => {
    let store: Record<string,string>;
    beforeEach(() => { store = {}; vi.stubGlobal('localStorage', { getItem:(key:string)=>store[key]??null, setItem:(key:string,value:string)=>{store[key]=value;}, removeItem:(key:string)=>{delete store[key];} }); vi.spyOn(Math,'random').mockReturnValue(.99); });
    const outcome = (id: string, firstTry = true, assisted = false) => ({ roundId: id, letterId: 'a', correct: true, firstTry, assisted });
    it('normalizes corrupt values and only marks repeated independent work as mastery', () => {
        expect(readAlphabetPractice(null)).toEqual({ version:1, letters:{}, lastLevel:{}, lastScene:{}, completedSessions:[] });
        let value: unknown; value = recordOutcome(value,'word',outcome('1')); value = recordOutcome(value,'word',outcome('2')); expect(mastered(value,'word','a')).toBe(false); value = recordOutcome(value,'word',outcome('3')); expect(mastered(value,'word','a')).toBe(true); value = recordOutcome(value,'word',outcome('4',true,true)); expect(mastered(value,'word','a')).toBe(false);
    });
    it('deduplicates a completed session and preserves unrelated profile data', () => {
        let progress = completePracticeSession(undefined,'pick','intro','s1',[outcome('r1')],'0'); progress = completePracticeSession(progress,'pick','intro','s1',[outcome('r1')],'0'); expect(progress.letters.pick?.a.solved).toBe(1); expect(progress.completedSessions).toEqual(['s1']);
        const migrated = migrateProfile({ id:'old', name:'Bé', stars:5, alphabetPractice:progress }); expect(migrated.alphabetPractice).toEqual(progress); expect(migrated.stars).toBe(5);
    });
    it('commits stars/history/progress once and rejects the wrong owner', () => {
        const profile = { ...createProfile('Bé thử',Grade.Preschool), id:'student-a', alphabetGarden:{ explored:['z'], matched:[], traced:[], stickers:[] } };
        const session: AlphabetSession = { version:1,id:'session-1',ownerId:'student-a',activity:'word',level:'intro',seed:7,startedAt:new Date().toISOString(),seconds:22,total:2,outcomes:[outcome('r1'),{...outcome('r2',false),letterId:'b'}],phase:'complete' };
        const first = completeAlphabetPractice(profile,session); expect(first.accepted).toBe(true); expect(first.changed).toBe(true); expect(first.profile.alphabetGarden).toEqual(profile.alphabetGarden); expect(first.profile.gameHistory.at(-1)?.alphabet?.activity).toBe('word'); expect(first.profile.alphabetPractice?.completedSessions).toEqual(['session-1']);
        const again = completeAlphabetPractice(first.profile,session); expect(again.accepted).toBe(true); expect(again.changed).toBe(false); expect(again.profile.stars).toBe(first.profile.stars);
        expect(completeAlphabetPractice(profile,{...session,ownerId:'other'}).accepted).toBe(false);
    });
    it('does not change the snapshot when the write fails', () => {
        const profile = { ...createProfile('Bé thử',Grade.Preschool), id:'student-a' }, session: AlphabetSession = { version:1,id:'session-2',ownerId:'student-a',activity:'pick',level:'intro',seed:8,startedAt:new Date().toISOString(),seconds:5,total:1,outcomes:[outcome('p1')],phase:'complete' };
        const result = persistAlphabetPractice([profile],'student-a',session,()=>{throw new Error('quota')}); expect(result.ok).toBe(false); expect(result.profiles[0]).toBe(profile);
    });
});
