import { describe, expect, it } from 'vitest';
import { brushDistance, brushPressure, brushSamples } from './brush';
import { exportBackup, importBackup, newArtwork, validateArtwork } from './document';
import type { PaintStroke } from '../model';

const stroke=(points:PaintStroke['points']):PaintStroke=>({kind:'brush',brushStyle:'bristle-v1',color:'#ffffff',size:.09,opacity:.7,stamp:'flower',pattern:'plain',points});
describe('bristle brush',()=>{
  it('tapers both ends while keeping a full middle and deterministic replay',()=>{
    const s=stroke(Array.from({length:25},(_,i)=>({u:.5,v:.15+i*.025,radius:.7,pressure:.8})));
    const samples=brushSamples(s,2.4),middle=samples[Math.floor(samples.length/2)];
    expect(samples[0].width).toBeLessThan(middle.width*.2);
    expect(samples.at(-1)!.width).toBeLessThan(middle.width*.2);
    expect(brushSamples(structuredClone(s),2.4)).toEqual(samples);
    expect(brushSamples(stroke([{u:.5,v:.5,radius:.7}]),2.4)[0].width).toBeGreaterThan(0);
  });
  it('uses physical distance across the seam and stays continuous for multiple revolutions',()=>{
    const points=Array.from({length:121},(_,i)=>({u:(.9+i*.025)%1,v:.5,radius:.7,pressure:.7}));
    expect(brushDistance(points[3],points[4],2.4)).toBeCloseTo(.025*2*Math.PI*.7);
    const samples=brushSamples(stroke(points),2.4);
    expect(samples.at(-1)!.u-samples[0].u).toBeCloseTo(3);
    for(let i=1;i<samples.length;i++)expect(samples[i].u-samples[i-1].u).toBeLessThan(.01);
  });
  it('mouse speed produces thinner strokes, pen pressure overrides speed, and filtering is time based',()=>{
    expect(brushPressure(.65,6,.1)).toBeLessThan(brushPressure(.65,.1,.1));
    expect(brushPressure(.65,8,.1,.9)).toBeGreaterThan(brushPressure(.65,0,.1,.1));
    const values=[30,60,120].map(hz=>{let p=.65;for(let i=0;i<hz;i++)p=brushPressure(p,2,1/hz);return p;});
    expect(values[0]).toBeCloseTo(values[2],10);
  });
  it('preserves brush metadata in backups and still accepts legacy strokes',()=>{
    const a=newArtwork({account:'guest',student:'brush-test'}),s=stroke([{u:.5,v:.5,radius:.7,pressure:.33}]);
    a.decoration.strokes=[s];
    expect(importBackup(exportBackup(a),a).decoration).toEqual(a.decoration);
    delete s.brushStyle;delete s.points[0].pressure;
    expect(validateArtwork(a)).toBe(a);
    for(const bad of [NaN,Infinity,-.1,1.1]){s.points[0].pressure=bad;expect(()=>validateArtwork(a)).toThrow();}
    s.points[0].pressure=.5;(s as any).brushStyle='unknown';expect(()=>validateArtwork(a)).toThrow();
  });
});
