import raw from './songs.generated.json';
import type { Song } from '../model';
import { songPhrases } from '../engine';
export const SONGS = (raw as Song[]).sort((a,b) => ({easy:0,medium:1,hard:2}[a.level] - {easy:0,medium:1,hard:2}[b.level]));
/** Beats in the incomplete first bar of the source score (checked against the MusicXML in tests). */
export const SONG_PICKUP: Readonly<Record<string, number>> = {
    '25418-threeships': .5, '25432-aikendrum': .5, '25432-avignon': 1, '25432-looby': 1.5, '25432-threelittlekittens': .5,
};
const cache = new Map<string, ReturnType<typeof songPhrases>>();
/** Musical phrases of a song, split at bar lines. */
export function phrasesOf(song: Song) {
    let phrases = cache.get(song.id);
    if (!phrases) { phrases = songPhrases(song, SONG_PICKUP[song.id] || 0); cache.set(song.id, phrases); }
    return phrases;
}
