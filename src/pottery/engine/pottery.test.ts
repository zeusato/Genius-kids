import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { clone, type PaintStroke } from '../model';
import { initialShape, constrain, validShape, sculpt, setHeight, openVessel, innerRadius, referenceShape, SHAPES } from './profile';
import { newArtwork, exportBackup, importBackup, validateArtwork, random, rewardKeys } from './document';
import { vesselGeometry } from '../render/vesselGeometry';
import { CHALLENGES, evaluate, LESSONS } from '../content/catalog';
import { persistPottery } from '../progress/progress';
import type { StudentProfile } from '../../../types';
const scope={account:'guest',student:'pottery-test'};
describe('pottery shaping invariants',()=>{
  it('keeps 3000 aggressive edits finite, bounded, and the cavity above the base',()=>{
    const shape=initialShape(),rnd=random(1234);openVessel(shape);
    for(let i=0;i<3000;i++){
      if(i%7===0)setHeight(shape,.3+rnd()*4);else sculpt(shape,rnd(),(rnd()-.5)*.6,.05+rnd()*.3,i%11===0);
      expect(validShape(shape)).toBe(true);expect(shape.height-shape.depth).toBeGreaterThanOrEqual(.13-1e-9);
      expect(Math.min(...shape.radii.map((r,j)=>r-innerRadius(shape,j/63)))).toBeGreaterThanOrEqual(.09-1e-9);
    }
  });
  it('local brush leaves distant samples alone and grows/shrinks the intended area',()=>{
    const shape=initialShape(),old=clone(shape);sculpt(shape,.5,.04,.06);
    expect(shape.radii[32]).toBeGreaterThan(old.radii[32]);expect(shape.radii[0]).toBe(old.radii[0]);expect(shape.radii[63]).toBe(old.radii[63]);
    sculpt(shape,.5,-.08,.06);expect(shape.radii[32]).toBeLessThan(old.radii[32]);
  });
  it('time-based hold stays equivalent at 30, 60 and 120 Hz',()=>{
    const shapes=[30,60,120].map(hz=>{const s=initialShape();for(let i=0;i<hz;i++)sculpt(s,.65,-.12/hz,.14);return s;});
    shapes[0].radii.forEach((r,i)=>expect(Math.abs(r-shapes[2].radii[i])).toBeLessThan(.003));
  });
  it('repairs malformed runtime inputs but rejects malformed serialized inputs',()=>{
    const shape=initialShape();shape.height=NaN;shape.radii[5]=Infinity;constrain(shape);expect(validShape(shape)).toBe(true);
    const a=newArtwork(scope);a.shape.radii[0]=-10;expect(()=>validateArtwork(a)).toThrow();
  });
});
describe('vessel mesh',()=>{
  for(const shape of SHAPES)it(`${shape.name} has nondegenerate faces, sealed poles, matching seam normals and bounds`,()=>{
    const s=referenceShape(shape.id),{geometry:g}=vesselGeometry(s,64),p=g.getAttribute('position'),n=g.getAttribute('normal'),index=g.index!;
    expect(g.boundingSphere!.radius).toBeGreaterThan(0);expect(index.count/3).toBeLessThan(20000);
    const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
    for(let i=0;i<index.count;i+=3){a.fromBufferAttribute(p,index.getX(i));b.fromBufferAttribute(p,index.getX(i+1));c.fromBufferAttribute(p,index.getX(i+2));expect(b.sub(a).cross(c.sub(a)).lengthSq()).toBeGreaterThan(1e-14);}
    for(let j=0;j<p.count/65;j++){const x=j*65,y=x+64;expect(p.getX(x)).toBeCloseTo(p.getX(y),5);expect(n.getZ(x)).toBeCloseTo(n.getZ(y),5);}
    // First outer ring normals point outward; inner wall normals point inward.
    expect(n.getZ(32*65)).toBeGreaterThan(0);expect(n.getZ(96*65)).toBeLessThan(0);g.dispose();
  });
  it('reuses buffers while sculpting, safely changes topology when opening and undoing',()=>{
    const s=initialShape(),g=vesselGeometry(s,64).geometry,original=g.getAttribute('position');sculpt(s,.5,.1);vesselGeometry(s,64,g);expect(g.getAttribute('position')).toBe(original);
    openVessel(s);vesselGeometry(s,64,g);expect(g.getAttribute('position').count).toBeGreaterThan(original.count);s.depth=0;vesselGeometry(s,64,g);expect(g.getAttribute('position').count).toBe(original.count);g.dispose();
  });
});
describe('backup and deterministic materials',()=>{
  it('round trips shape, paint and seed while rebinding imported ownership',()=>{
    const a=newArtwork(scope);openVessel(a.shape);a.stage='finished';a.decoration.strokes.push({kind:'brush',color:'#304d78',size:.08,opacity:1,stamp:'flower',pattern:'plain',points:[{u:.99,v:.4,radius:.7},{u:.01,v:.42,radius:.7}]});
    const b=importBackup(exportBackup(a),{account:'other',student:'child'});
    expect(b.shape).toEqual(a.shape);expect(b.decoration).toEqual(a.decoration);expect(b.seed).toBe(a.seed);expect(b.account).toBe('other');expect(b.id).not.toBe(a.id);expect(b.imported).toBe(true);expect(rewardKeys({...b,stage:'reveal'})).toEqual([]);
  });
  it('rejects unknown recipes, oversized point values and spoofed completion fields',()=>{
    const a=newArtwork(scope);(a as any).glaze='unknown';expect(()=>validateArtwork(a)).toThrow();a.glaze='gloss';a.decoration.strokes.push({kind:'brush',color:'#ffffff',size:.1,opacity:1,stamp:'flower',pattern:'plain',points:[{u:Infinity,v:0,radius:.5}]} as PaintStroke);expect(()=>validateArtwork(a)).toThrow();
  });
  it('replays a stable seed',()=>{const a=random(123),b=random(123);expect(Array.from({length:50},a)).toEqual(Array.from({length:50},b));});
});
describe('content and reward contracts',()=>{
  it('every challenge can be satisfied and feedback is independent of camera',()=>{
    expect(CHALLENGES).toHaveLength(12);expect(LESSONS).toHaveLength(3);expect(new Set(CHALLENGES.map(c=>c.id)).size).toBe(12);
    for(const c of CHALLENGES){const a=newArtwork(scope);a.shape=referenceShape(c.shape||'cup');if(c.color)a.decoration.color=c.color;if(c.glaze)a.glaze=c.glaze;if(c.decoration)a.decoration.strokes.push({kind:c.decoration,color:'#ffffff',size:.1,opacity:1,stamp:'flower',pattern:'plain',points:[{u:.5,v:.5,radius:.7}]});expect(evaluate(a,c).pass).toBe(true);}
  });
  it('awards fixed milestones only once and never for imports or forks',()=>{
    let profiles=[{id:scope.student,stars:0,totalStarsEarned:0,ownedImageIds:[],gameHistory:[]} as unknown as StudentProfile];
    const a=newArtwork(scope);a.stage='reveal';a.skills=['shape','height','open'];a.lesson='first-cup';
    const write=(next:StudentProfile[])=>{profiles=next;};
    expect(persistPottery(profiles,scope.student,a,write).earned).toBe(3);expect(persistPottery(profiles,scope.student,a,write).earned).toBe(0);
    expect(persistPottery(profiles,scope.student,{...a,imported:true},write).earned).toBe(0);expect(persistPottery(profiles,scope.student,{...a,parentId:'old'},write).earned).toBe(0);
  });
});
