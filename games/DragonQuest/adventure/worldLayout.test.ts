import { describe, expect, it } from 'vitest';
import { createMap, REGIONS } from './content';
import { worldLayout, worldBounds, cameraDistance } from './worldLayout';

describe('Immersive world geometry',()=>{
 it('gives each region a distinct path with 50 separated tiles, preserving saved rules',()=>{
  const signatures=new Set<string>();
  for(const region of REGIONS){
   const map=createMap(region.id+'-1',42),saved=JSON.stringify(map),world=worldLayout(map,region.id);
   expect(world).toHaveLength(50);expect(JSON.stringify(map)).toBe(saved);
   expect(world.map(n=>[n.id,n.kind,n.index,n.next])).toEqual(map.map(n=>[n.id,n.kind,n.index,n.next]));
   signatures.add(JSON.stringify(world.map(n=>[n.x,n.z])));
   for(let i=0;i<world.length;i++){
    expect(Number.isFinite(world[i].heading)).toBe(true);
    for(let j=i+1;j<world.length;j++)expect(Math.hypot(world[i].x-world[j].x,world[i].z-world[j].z)).toBeGreaterThanOrEqual(1.65-1e-8);
   }
   const bounds=worldBounds(world);expect(bounds.width).toBeLessThan(70);expect(bounds.depth).toBeLessThan(90);
   expect(cameraDistance(.5,true,bounds)).toBeGreaterThan(cameraDistance(1.8,false,bounds));
  }
  expect(signatures.size).toBe(5);
 });
 it('handles empty and singleton maps without invalid coordinates',()=>{
  expect(worldLayout([])).toEqual([]);
  const [node]=worldLayout(createMap('forest-1',3).slice(0,1));
  expect([node.x,node.y,node.z,node.heading].every(Number.isFinite)).toBe(true);
 });
});
