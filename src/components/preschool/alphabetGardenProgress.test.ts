import { describe, expect, it } from 'vitest';
import { answerGardenLetter, exploreGardenLetter, finishGardenTracing, gardenComplete, readGardenProgress } from './alphabetGardenProgress';
import { TRACE_LETTERS, initialTraceState } from './letterTracingModel';
import { GARDEN_SCENES } from './alphabetGardenScenes';
import { ALPHABET_DATA } from '../../data/alphabetData';
import { existsSync } from 'node:fs';

const finish = (value: unknown, id: string) => finishGardenTracing(value, id, { stroke: TRACE_LETTERS[id].strokes.length, point: 0 });

describe('alphabet garden learning progress', () => {
    it('provides 26 distinct, locally available scenes with their own instructions', () => {
        const scenes = ALPHABET_DATA.map(letter => GARDEN_SCENES[letter.id]);
        expect(new Set(scenes.map(scene => scene.art)).size).toBe(26);
        for (const scene of scenes) {
            expect(scene.instruction.length).toBeGreaterThan(10);
            expect(existsSync('public/preschool/garden/' + scene.art + '.webp')).toBe(true);
        }
    });
    it('jumping directly to Z never completes the alphabet', () => {
        const visited = exploreGardenLetter(undefined, 'z');
        expect(visited.explored).toEqual(['z']);
        expect(gardenComplete(answerGardenLetter(visited, 'z', 'z'))).toBe(false);
    });
    it('requires the activity, a correct match and every tracing stroke before awarding a sticker', () => {
        expect(answerGardenLetter(undefined, 'a', 'a').stickers).toEqual([]);
        const explored = exploreGardenLetter(undefined, 'a');
        expect(answerGardenLetter(explored, 'a', 'b').stickers).toEqual([]);
        const matched = answerGardenLetter(explored, 'a', 'a');
        expect(matched.matched).toEqual(['a']);
        expect(matched.stickers).toEqual([]);
        expect(finish(explored, 'a').stickers).toEqual([]);
        expect(finishGardenTracing(matched, 'a', initialTraceState()).stickers).toEqual([]);
        expect(finishGardenTracing(matched, 'a', { stroke: 2, point: 8 }).stickers).toEqual([]);
        const won = finish(matched, 'a');
        expect(won.traced).toEqual(['a']);
        expect(finish(won, 'a').stickers).toEqual(['a']);
        expect(explored.stickers).toEqual([]);
    });
    it('normalizes old or malformed saved data and survives a save/load round trip', () => {
        expect(readGardenProgress(null)).toEqual({ explored: [], matched: [], traced: [], stickers: [] });
        expect(readGardenProgress({ explored: ['a', 'a', 'z', '?', 9], stickers: ['a', 'b', 'z', 'z'] }))
            .toEqual({ explored: ['a', 'z'], matched: ['a', 'z'], traced: [], stickers: ['a', 'z'] });
        const progress = finish(answerGardenLetter(exploreGardenLetter(undefined, 'c'), 'c', 'c'), 'c');
        expect(readGardenProgress(JSON.parse(JSON.stringify(progress)))).toEqual(progress);
    });
    it('keeps separate profile values isolated and only completes all 26 letters', () => {
        const firstProfile = exploreGardenLetter(undefined, 'a');
        const secondProfile = finish(answerGardenLetter(exploreGardenLetter(undefined, 'b'), 'b', 'b'), 'b');
        expect(firstProfile).toEqual({ explored: ['a'], matched: [], traced: [], stickers: [] });
        expect(secondProfile.stickers).toEqual(['b']);
        let progress = readGardenProgress(undefined);
        for (const id of 'abcdefghijklmnopqrstuvwxyz') {
            expect(gardenComplete(progress)).toBe(false);
            progress = finish(answerGardenLetter(exploreGardenLetter(progress, id), id, id), id);
        }
        expect(gardenComplete(progress)).toBe(true);
    });
});
