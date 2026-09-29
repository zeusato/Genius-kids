import {expect,it} from 'vitest';
import {LESSONS} from '../../../data/electricity/content';
import {POWER_OBJECTS,HAZARDS,SAMPLES} from '../../../data/electricity/labs';
import {createRun,predicate} from './evidence';
import {preset,wire} from './fixtures';
import {startSimulation} from './simulation';
it.each(LESSONS)('$id rejects three incomplete or misleading attempts',spec=>{
 for(let wrong=0;wrong<3;wrong++){
  const c=preset(spec.initialCircuitId),run=createRun('qa',spec,c);
  if(spec.activity==='sorting'){const answers=Object.fromEntries(POWER_OBJECTS);const key=POWER_OBJECTS[wrong][0];answers[key]=answers[key]==='battery'?'mains':'battery';run.activity={sort:answers};}
  else if(spec.activity==='safety')run.activity={safe:HAZARDS.slice(0,5).filter((_,i)=>i!==wrong).map(h=>h.id)};
  else if(spec.activity==='conductors')run.activity={tested:SAMPLES.filter((_,i)=>i!==wrong).map(s=>s.id),classified:Object.fromEntries(SAMPLES.map(s=>[s.id,s.resistance!==null]))};
  else if(spec.activity==='house')run.activity={off:wrong===0?['lamp0','fridge']:['lamp1','lamp2','lamp3','lamp4','tv','fan'],ledCount:wrong===1?4:5,houseReason:wrong!==2};
  else if(spec.activity==='journey')run.activity={sequence:wrong===0?'house,source,distribution,transmission':'source,transmission,distribution,house',matched:wrong===1?3:4,night:true,backup:wrong===2?'solar':'storage'};
  else if(wrong===0)c.wires=[];
  else if(wrong===1)c.parts.forEach(p=>{if(p.kind==='battery')p.cells?.forEach(cell=>cell.charge01=0);});
  else c.parts.forEach(p=>{if(p.kind==='bulb')p.broken=true;});
  expect(predicate(spec,run,startSimulation(c)),`${spec.id} bad attempt ${wrong}`).toBe(false);
 }
});
it('first light refuses one wire, both ends to the same source pole, and a bypass',()=>{
 const spec=LESSONS[2];for(const wires of [[wire('a','B','plus','L1','a')],[wire('a','B','plus','L1','a'),wire('b','B','plus','L1','b')],[...preset().wires,wire('bypass','L1','a','L1','b')]]){const c=preset();c.wires=wires;expect(predicate(spec,createRun('qa',spec,c),startSimulation(c))).toBe(false);}
});
