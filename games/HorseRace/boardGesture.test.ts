import {describe,it,expect} from 'vitest';
import {BoardGesture} from './boardGesture';

describe('camera gestures must not play a horse',()=>{
 it('accepts a tap after release, including slight finger jitter',()=>{
  const g=new BoardGesture();expect(g.canPick).toBe(false);
  g.begin(1,100,100);expect(g.canPick).toBe(false);
  g.move(1,103,102);g.end(1);expect(g.canPick).toBe(true);
 });
 it('rejects an orbit that returns to its original pixel, then accepts a new tap',()=>{
  const g=new BoardGesture();g.begin(1,100,100);g.move(1,180,100);g.move(1,100,100);g.end(1);
  expect(g.canPick).toBe(false);
  g.begin(2,100,100);g.end(2);expect(g.canPick).toBe(true);
 });
 it('rejects every release of a two-finger gesture',()=>{
  const g=new BoardGesture();g.begin(1,100,100);g.begin(2,140,100);g.end(1);
  expect(g.canPick).toBe(false);g.end(2);expect(g.canPick).toBe(false);
 });
 it('rejects cancelled touches without poisoning the next tap',()=>{
  const g=new BoardGesture();g.begin(1,100,100);g.cancel(1);expect(g.canPick).toBe(false);
  g.begin(3,140,160);g.end(3);expect(g.canPick).toBe(true);
 });
});
