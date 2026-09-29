import {build} from 'esbuild';
import {cpus,platform,release} from 'node:os';
import {mkdir,writeFile} from 'node:fs/promises';
const bundle=await build({stdin:{contents:"export {solveNetlist} from './src/components/electricity/engine/solver'; export {compile} from './src/components/electricity/engine/parts'; export {preset} from './src/components/electricity/engine/fixtures';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {solveNetlist,compile,preset}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const net=compile(preset('trafficLight'));
// Two passive probe parts make a reproducible 12-part, 14-wire educational bench.
net.nodes.push('probeA:a','probeA:b','probeV:a','probeV:b');
net.branches.push({id:'probeA',a:'probeA:a',b:'probeA:b',R:.01,kind:'ammeter'},{id:'probeV',a:'probeV:a',b:'probeV:b',R:1e7,kind:'voltmeter'},{id:'probe1',a:'B:minus',b:'probeV:a',R:.02,kind:'wire'},{id:'probe2',a:'B:plus',b:'probeV:b',R:.02,kind:'wire'});
const stress={nodes:Array.from({length:63},(_,i)=>`n${i}`),branches:[]};
for(let i=0;i<62;i++)stress.branches.push({id:`r${i}`,a:`n${i}`,b:`n${i+1}`,R:10+i%7,kind:'resistor'});
stress.branches.push({id:'source',a:'n62',b:'n0',R:.2,E:3,kind:'battery'});
for(let i=0;i<29;i++)stress.branches.push({id:`cross${i}`,a:`n${i}`,b:`n${i+31}`,R:100,kind:'resistor'});
const measure=(fixture,model)=>{for(let i=0;i<100;i++)solveNetlist(model);const times=[];for(let i=0;i<1000;i++){const t=performance.now(),solution=solveNetlist(model);if(!solution.ok)throw new Error('Invalid benchmark fixture');times.push(performance.now()-t);}times.sort((a,b)=>a-b);return {fixture,nodes:model.nodes.length,branches:model.branches.length,warmup:100,samples:1000,medianMs:+times[500].toFixed(4),p95Ms:+times[950].toFixed(4)};};
const report={date:new Date().toISOString(),cpu:cpus()[0]?.model,os:`${platform()} ${release()}`,runtime:process.version,build:'esbuild production bundle, Node CPU timing; not Android or browser',results:[measure('12 parts / 14 wires',net),measure('63 nodes / 92 branches',stress)]};
await mkdir('docs/electricity-wow/evidence',{recursive:true});await writeFile('docs/electricity-wow/evidence/solver-metrics.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
