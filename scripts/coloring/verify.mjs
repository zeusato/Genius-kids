import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import sharp from 'sharp';
import {decodeMap,segment,contours} from '../../src/coloring/engine/geometry.mjs';
const catalog=JSON.parse(await readFile('public/coloring/catalog.json','utf8')),rows=[];
for(const {id} of catalog.pages){
 const start=performance.now(),page=JSON.parse(gunzipSync(await readFile(`public/coloring/${id}.page.bin`))),labels=decodeMap(gunzipSync(await readFile(`public/coloring/${id}.bin`)));
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048"><rect width="2048" height="2048" fill="black"/>${page.regions.map(r=>`<path d="${r.d}" fill="rgb(${r.id&255},${r.id>>8},0)" fill-rule="evenodd"/>`).join('')}</svg>`;
 const pixels=await sharp(Buffer.from(svg)).removeAlpha().raw().toBuffer();let mismatch=0;for(let i=0;i<labels.length;i++)if(pixels[i*3]+pixels[i*3+1]*256!==labels[i])mismatch++;
 rows.push({id,regions:page.regions.length,pixels:labels.length,mismatch,elapsedMs:Math.round(performance.now()-start)});if(mismatch)throw Error(`${id}: ${mismatch} pixels khác bản đồ vùng`);
}
const gray=await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048"><rect width="2048" height="2048" fill="white"/><g fill="none" stroke="black" stroke-width="18"><circle cx="600" cy="600" r="300"/><rect x="1050" y="900" width="600" height="600"/></g></svg>')).greyscale().raw().toBuffer();
const start=performance.now(),seg=segment(gray,2048),paths=contours(seg.labels,2048),workerCoreMs=Math.round(performance.now()-start);
const result={pages:rows.length,pixels:rows.reduce((s,r)=>s+r.pixels,0),mismatches:rows.reduce((s,r)=>s+r.mismatch,0),workerCoreMs,workerRegions:paths.size,rows};
await writeFile('scripts/coloring/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,rows:undefined}));
