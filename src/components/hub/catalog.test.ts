import { describe, expect, it } from 'vitest';
import { Grade } from '../../../types';
import { gamesFor, boardGamesFor, gameParent, gameTitle, modesFor, scienceFor, SCIENCE_CATALOG, resolveEntry, type LegacyFlags } from './catalog';

const modern: LegacyFlags = { memory:false, sound:false, dragon:false };
const resolve = (query: string, grade: Grade = 3, flags = modern) => resolveEntry(new URLSearchParams(query), grade, flags);
describe('hub entry contracts', () => {
    it('keeps board games first and offers the farm without difficulty setup for every grade', () => {
        for (const grade of [0,1,2,3,4,5] as const) {
            expect(gamesFor(grade).slice(0,2).map(g => g.id)).toEqual(['board-games','farm']);
            expect(resolve('play=farm&edition=classic&level=hard', grade)).toMatchObject({id:'farm',classic:false,needsSetup:false});
        }
        expect(gameParent('farm')).toBe('');
    });
    it('groups six board games and returns each game to its group', () => {
        const ids = ['co-ti-phu','o-an-quan','horse-race','co-vua','co-tuong','caro'] as const;
        expect(boardGamesFor(3).map(g => g.id)).toEqual(ids);
        expect(gamesFor(3).filter(g => ids.some(id => id === g.id))).toEqual([]);
        expect(resolve('play=board-games')).toMatchObject({ id:'board-games', needsSetup:false });
        expect(resolve('play=board-games', Grade.Preschool)).not.toBeNull();
        for (const id of ids) {
            expect(resolve('play=' + id + '&edition=classic&level=hard')).toMatchObject({ id, classic:false, needsSetup:false });
            expect(gameParent(id)).toBe('?play=board-games');
            expect(gameTitle(id)).not.toBe('Trò chơi');
        }
        expect(gameParent('board-games')).toBe('');
        expect(gameParent('gears-build')).toBe('?play=gears-menu');
    });
    it('opens O An Quan directly for every grade with its own lobby',()=>{
        for(const grade of [0,1,2,3,4,5] as const)expect(resolve('play=o-an-quan&edition=classic&level=hard',grade)).toMatchObject({id:'o-an-quan',classic:false,needsSetup:false});
    });
    it('preserves the existing science destinations and preschool choices', () => {
        expect(scienceFor(Grade.Preschool).map(item => item.id)).toEqual(['solar-system', 'planet-maker', 'cell-biology']);
        const routes = ['/science/solar-system', '/science/planet-maker', '/science/periodic-table', '/science/electricity', '/science/cell-biology', '/science/evolution'];
        for (const grade of [1, 2, 3, 4, 5] as const) expect(scienceFor(grade).map(item => item.route)).toEqual(routes);
        expect(new Set(SCIENCE_CATALOG.map(item => item.id)).size).toBe(6);
    });
    it('keeps preschool destinations and order, including grade zero', () => {
        expect(modesFor(Grade.Preschool).map(m => m.id)).toEqual(['alphabet','counting','colors','english','game','library','piano','science']);
        expect(gamesFor(Grade.Preschool).map(g => g.id)).toEqual(['board-games','farm','memory','sound-memory']);
        expect(boardGamesFor(Grade.Preschool).map(g => g.id)).toEqual(['o-an-quan','horse-race','caro']);
        expect(resolve('play=caro',Grade.Preschool)).toMatchObject({id:'caro',classic:false,needsSetup:false});
        expect(modesFor(3).map(m => m.id)).toEqual(['study','english','game','library','riddle','piano','science']);
        expect(gamesFor(3)).toHaveLength(10);
        expect(gamesFor(3).some(g=>g.id==='coding')).toBe(true);
        expect(resolve('play=coding')).toMatchObject({id:'coding',needsSetup:false});
        expect(resolve('play=coding',Grade.Preschool)).toBeNull();
    });
    it('rejects direct links that bypass the preschool card gate', () => {
        for (const id of ['co-ti-phu','co-vua','co-tuong','speed-math','dragon-quest','math-racing','sudoku','gears-menu','gears-build','gears-guess']) {
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
    it('opens the shared-tablet horse-race lobby for every grade without a legacy setup',()=>{
        for(const grade of [0,1,2,3,4,5] as const)expect(resolve('play=horse-race&edition=classic&level=hard',grade)).toMatchObject({id:'horse-race',classic:false,needsSetup:false});
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
