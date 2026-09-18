// Read-only diagnostics against the checked-out TypeScript core. No browser DB writes.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(request) {
  const file = [request, request + '.ts', request + '.json'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!file) throw new Error('Cannot resolve ' + request);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  if (file.endsWith('.json')) mod.exports = JSON.parse(fs.readFileSync(file, 'utf8'));
  else {
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    new Function('require', 'module', 'exports', code)(id => id.startsWith('.') ? load(path.resolve(path.dirname(file), id)) : require(id), mod, mod.exports);
  }
  return mod.exports;
}
const root = path.resolve(__dirname, '../../src/core');
const { createFarm, execute, advanceTime, placementError, dimensions } = load(path.join(root, 'engine.ts'));
const { reachableTiles, tileIndex, generateWorld, worldErrors, FAMILIES } = load(path.join(root, 'world.ts'));
const { outputCap } = load(path.join(root, 'progression.ts'));
const { validateSnapshot } = load(path.join(root, 'validation.ts'));
const now = 1800000000000;
function command(s, c) { const r = execute(s, c); if (!r.ok) throw new Error(r.message); return r.state; }
const evidence = {};

// Ownership of a river chunk does not grant walking access to its other bank.
let isolated = createFarm(now, 20260917);
isolated.entities.forEach(e => e.level = 25); isolated.coins = 100000;
for (const chunk of [2, 3, 8, 9]) isolated = command(isolated, {type: 'expand', chunk});
const reachable = reachableTiles(isolated.world), [w,d] = dimensions('bench',0);
let target;
for(let z=0;z<32 && !target;z++) for(let x=56;x<64-w && !target;x++) {
  if(!reachable.has(tileIndex(x,z)) && !placementError(isolated,x,z,w,d,undefined,'bench',0)) target={x,z};
}
if (!target) throw new Error('No isolated placement found');
validateSnapshot(isolated);
const placed=execute(isolated,{type:'build',asset:'bench',...target,rotation:0});
if(placed.ok) validateSnapshot(placed.state);
evidence.isolatedBank = {seed:isolated.world.seed,owned:isolated.world.owned,target,reachable:false,bridgesBuilt:isolated.world.bridges.map(b=>b.built),buildAccepted:placed.ok,message:placed.message};

// A finished job cannot deposit while local output is full. The next queued
// job must not count production time during that blocked interval.
let full = createFarm(now, 1); full.entities.forEach(e=>e.level=4);
full.inventory.wheat=10;
const mill={id:'review-mill',asset:'mill',x:18,z:18,rotation:0,level:4,queue:[],output:{flour:16}};
full.entities.push(mill); validateSnapshot(full);
full=command(full,{type:'produce',entityId:mill.id,recipe:'flour',quantity:2});
const originalJob=structuredClone(full.entities.find(e=>e.id===mill.id).job);
full=advanceTime(full,now+3600000);
const beforeCollect=structuredClone(full.entities.find(e=>e.id===mill.id));
full=command(full,{type:'collect',entityId:mill.id}); validateSnapshot(full);
const afterCollect=full.entities.find(e=>e.id===mill.id);
evidence.fullOutputQueue={capacity:outputCap(mill),firstBatchDuration:originalJob.duration,waitedMs:3600000,beforeCollect:{output:beforeCollect.output,active:!!beforeCollect.job,queued:beforeCollect.queue.length},afterCollect:{output:afterCollect.output,active:!!afterCollect.job,queued:afterCollect.queue.length},expected:'First blocked batch can deposit now; second batch should start now and remain active.'};

// Representative seed from every declared family; observe fixed macro layout.
const reps=[];const found=new Set();
for(let seed=0;seed<1000 && found.size<FAMILIES.length;seed++) {
 const world=generateWorld(seed); if(found.has(world.family))continue;found.add(world.family);
 const aboveBoundary=world.heights.filter((h,i)=>h>0&&(i%96%16===0||i%96%16===15||Math.floor(i/96)%16===0||Math.floor(i/96)%16===15)).length;
 reps.push({seed,family:world.family,raisedBoundaryTiles:aboveBoundary,bridgeCoordinates:world.bridges.map(b=>[b.x,b.z]),errors:worldErrors(world)});
}
evidence.terrainFamilies=reps;
evidence.plateauRow=generateWorld(20260917).heights.slice(72*96+64,72*96+96);

// The validator checks the fixed pier and starter patch, but does not reject
// an obstacle on water or an impossible bridge topology.
const badWater=generateWorld(1), waterIndex=badWater.water.findIndex(v=>v===1), wx=waterIndex%96,wz=Math.floor(waterIndex/96);
badWater.obstacles.push({id:`o-${wx}-${wz}`,x:wx,z:wz,kind:'tree',cleared:false});
evidence.validatorAcceptsTreeOnWater=worldErrors(badWater);

const report=JSON.stringify(evidence,null,2);
fs.writeFileSync(path.join(__dirname,'evidence.json'),report+'\n');
console.log(report);
