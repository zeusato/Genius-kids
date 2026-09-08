import { describe,expect,it } from 'vitest';
import { newNode, validateProgram } from '../engine/model';
import { seq } from '../content/campaign';
import { findNode, insertNode, moveNode, updateNode } from './operations';
describe('structured editor',()=>{
    it('moves a block in the same list without an off-by-one',()=>{
        const p=seq('FLR'); const next=moveNode(p,p[0].id,{parent:null,branch:'body',index:3});
        expect(next.map(n=>n.type)).toEqual(['left','right','forward']); expect(p.map(n=>n.type)).toEqual(['forward','left','right']);
    });
    it('moves a whole group and rejects dropping it inside its descendants',()=>{
        const inner={...newNode('if'),type:'if' as const,sensor:'clear' as const,body:seq('F'),otherwise:[]};
        const outer={...newNode('repeat'),type:'repeat' as const,count:2,body:[inner]};
        const p=[outer,...seq('L')]; expect(moveNode(p,outer.id,{parent:inner.id,branch:'body',index:0})).toBe(p);
        const moved=moveNode(p,outer.id,{parent:null,branch:'body',index:2}); expect(moved[1]).toEqual(outer);
    });
    it('inserts into else and removes without changing sibling IDs',()=>{
        const c=newNode('if'), f=newNode('forward');
        const inserted=insertNode([c],{parent:c.id,branch:'otherwise',index:0},f);
        expect(findNode(inserted,f.id)).toBe(f);
        expect(validateProgram(inserted,['if','forward'],true)).toBeNull();
        expect(findNode(updateNode(inserted,f.id,()=>null),f.id)).toBeUndefined();
    });
});
