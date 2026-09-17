import raw from './songs.generated.json';
import type { Song } from '../model';
export const SONGS = (raw as Song[]).sort((a,b) => ({easy:0,medium:1,hard:2}[a.level] - {easy:0,medium:1,hard:2}[b.level]));
