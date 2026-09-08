import { describe, expect, it } from 'vitest';
import { CAMPAIGN, seq } from '../content/campaign';
import { countBlocks, initialWorld, newNode, validateProgram } from './model';
import { evaluate, execute, solveBoard, transition, walkable } from './runtime';

describe('KidCoder campaign', () => {
    it('has 40 unique, ordered lessons', () => {
        expect(CAMPAIGN).toHaveLength(40); expect(new Set(CAMPAIGN.map(m => m.id)).size).toBe(40);
    });
    for (const m of CAMPAIGN) it(`${m.id}: witness completes all goals and earns all badges`, () => {
        const result = evaluate(m, m.solution);
        expect(result.runs.map(r => r.error), m.title).toEqual(m.boards.map(() => undefined));
        expect(result.badges).toHaveLength(3);
        expect(countBlocks(m.solution)).toBeLessThanOrEqual(48);
        for (const b of m.boards) {
            const w = initialWorld(b); expect(walkable(b, w, b.start)).toBe(true);
            expect(b.tiles).toHaveLength(b.size * b.size);
        }
    });
    it('debugging starters genuinely need a correction', () => {
        for (const m of CAMPAIGN.filter(m => m.starter)) expect(evaluate(m, m.starter!).success, m.id).toBe(false);
    });
    it('replay retains every sample regardless of completion history', () => {
        const m = CAMPAIGN[10]; const a = evaluate(m, m.solution), b = evaluate(m, m.solution);
        expect(a).toEqual(b); expect(a.runs[0].frames.at(-1)!.world.scanned.length).toBe(2);
    });
    it('rewards the taught control structure rather than a hardcoded detour', () => {
        const m=CAMPAIGN.find(m=>m.id==='ice-02')!;
        const withoutIf=evaluate(m,seq('RFLFFLFR'));
        expect(withoutIf.success).toBe(true); expect(withoutIf.badges).not.toContain('coder');
        expect(evaluate(m,m.solution).badges).toContain('coder');
    });
    it('bounds cyclic and malformed programs in the full evaluator', () => {
        const loop={id:'cycle',type:'repeat',count:2,body:[]} as any; loop.body.push(loop);
        expect(evaluate(CAMPAIGN[16],[loop]).success).toBe(false);
        expect(evaluate(CAMPAIGN[0],null as any).success).toBe(false);
    });
});
describe('rover rules', () => {
    it('turns stay in place; blocked movement does not mutate state', () => {
        const b = CAMPAIGN[0].boards[0], w = initialWorld(b);
        const rotated = transition(b, w, 'left'); expect(rotated.world.rover).toEqual(w.rover);
        const blocked = transition(b, rotated.world, 'forward'); expect(blocked.error).toBeTruthy(); expect(blocked.world).toEqual(rotated.world);
    });
    it('requires samples and rejects commands after reaching the goal', () => {
        const m = CAMPAIGN[8]; expect(execute(m.boards[0], seq('F'), m.allowed).success).toBe(false);
        const b = CAMPAIGN[0]; expect(execute(b.boards[0], seq('FFF'), b.allowed).success).toBe(false);
    });
    it('cannot push one box through another', () => {
        const b = structuredClone(CAMPAIGN[35].boards[0]); b.boxes.push({ id: 'other', x: 3, y: 3 });
        expect(transition(b, initialWorld(b), 'push').error).toBeTruthy();
    });
    it('a bridge removes the box obstacle and can be traversed', () => {
        const b = CAMPAIGN[35].boards[0], result = transition(b, initialWorld(b), 'push');
        expect(result.world.boxes).toHaveLength(0); expect(result.world.bridges).toEqual(['3,3']);
        expect(walkable(b, result.world, { x: 3, y: 3 })).toBe(true);
    });
    it('search accounts for bridge and required samples, and distinguishes budget exhaustion', () => {
        for (const index of [8, 35]) {
            const m = CAMPAIGN[index], found = solveBoard(m.boards[0], m.allowed, 20000, 1000);
            expect(found.status).toBe('solved');
            expect(execute(m.boards[0], found.actions!.map((type, i) => ({ id: `s${i}`, type })), m.allowed).success).toBe(true);
        }
        expect(solveBoard(CAMPAIGN[0].boards[0], ['forward'], 0).status).toBe('budgetExceeded');
    });
    it('validates malformed and oversized drafts before interpretation', () => {
        expect(validateProgram(null, ['forward'])).toBeTruthy();
        expect(validateProgram(Array.from({ length: 49 }, () => newNode('forward')), ['forward'])).toBeTruthy();
        expect(validateProgram([{ id: 'r', type: 'repeat', count: 9, body: [] }], ['repeat'])).toBeTruthy();
        const loop = newNode('repeat'); expect(validateProgram([loop], ['repeat'], true)).toBeNull();
        expect(validateProgram([loop], ['repeat'])).toBeTruthy();
    });
});
