import { describe, expect, it } from 'vitest';
import { Grade } from '../../../types';
import { gamesFor, modesFor, resolveEntry, type LegacyFlags } from './catalog';

const modern: LegacyFlags = { memory:false, sound:false, dragon:false };
const resolve = (query: string, grade: Grade = 3, flags = modern) => resolveEntry(new URLSearchParams(query), grade, flags);
describe('hub entry contracts', () => {
    it('keeps preschool destinations and order, including grade zero', () => {
        expect(modesFor(Grade.Preschool).map(m => m.id)).toEqual(['alphabet','counting','colors','game','library','science']);
        expect(gamesFor(Grade.Preschool).map(g => g.id)).toEqual(['memory','sound-memory']);
        expect(modesFor(3).map(m => m.id)).toEqual(['study','game','library','riddle','coding','science']);
        expect(gamesFor(3)).toHaveLength(7);
    });
    it('rejects direct links that bypass the preschool card gate', () => {
        for (const id of ['speed-math','dragon-quest','math-racing','sudoku','gears-menu','gears-build','gears-guess']) {
            expect(resolve('play=' + id + '&level=easy', Grade.Preschool)).toBeNull();
        }
    });
    it('requires configuration before launching classic games', () => {
        for (const query of ['play=math-racing&edition=classic','play=gears-build&edition=classic','play=gears-guess&edition=classic','play=memory&edition=classic','play=sound-memory&edition=classic','play=dragon-quest&edition=classic']) {
            expect(resolve(query)?.needsSetup).toBe(true);
            expect(resolve(query + '&level=medium')).toMatchObject({ needsSetup:false, level:'medium' });
        }
        expect(resolve('play=gears-menu')?.needsSetup).toBe(false);
    });
    it('opens the workshop directly and honors explicit difficulty without inheriting the racing legacy flag',()=>{
        for(const id of ['gears-build','gears-guess']){
            expect(resolve('play='+id,3,{...modern,racing:true})).toMatchObject({classic:false,needsSetup:false});
            expect(resolve('play='+id+'&level=hard')).toMatchObject({classic:false,needsSetup:false,level:'hard',requestedLevel:'hard'});
        }
    });
    it('keeps modern setup authoritative and Speed defaults equal to its direct route', () => {
        for (const id of ['memory','sound-memory','dragon-quest','speed-math','sudoku']) {
            expect(resolve('play=' + id + '&level=hard')).toMatchObject({ needsSetup:false, level:'easy', classic:false });
        }
    });
    it('preserves deployment flags and validates difficulty', () => {
        const old = { memory:true, sound:true, dragon:true };
        for (const id of ['memory','sound-memory','dragon-quest']) {
            expect(resolve('play=' + id, 3, old)).toMatchObject({ classic:true, needsSetup:true });
            expect(resolve('play=' + id + '&level=hard', 3, old)).toMatchObject({ classic:true, needsSetup:false, level:'hard' });
        }
        expect(resolve('play=math-racing&edition=classic&level=impossible')?.needsSetup).toBe(true);
        expect(resolve('play=memory&edition=classic&level=hard', Grade.Preschool)?.needsSetup).toBe(true);
    });
    it('falls back to the catalog for missing or unknown games', () => {
        for (const query of ['', 'play=not-a-game', 'play=__proto__', 'play=profile']) expect(resolve(query)).toBeNull();
    });
    it('does not let edition parameters change other game types', () => {
        expect(resolve('play=speed-math&edition=classic&level=hard')).toMatchObject({ id:'speed-math', classic:false, needsSetup:false, level:'easy' });
    });
    it('opens Racing garage once and gives an explicit valid URL level priority over preferences', () => {
        expect(resolve('play=math-racing')).toMatchObject({ classic: false, needsSetup: false, level: 'easy' });
        expect(resolve('play=math-racing')?.requestedLevel).toBeUndefined();
        for (const level of ['easy', 'medium', 'hard']) expect(resolve('play=math-racing&level=' + level)).toMatchObject({ needsSetup: false, level, requestedLevel: level });
        expect(resolve('play=math-racing&level=impossible')?.requestedLevel).toBeUndefined();
        expect(resolve('play=math-racing', 3, { ...modern, racing: true })).toMatchObject({ classic: true, needsSetup: true });
    });
});
