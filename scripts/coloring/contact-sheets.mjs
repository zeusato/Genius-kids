import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {gunzipSync} from 'node:zlib';
const catalog=JSON.parse(await readFile('public/coloring/catalog.json','utf8')),colors=['#f7a4ac','#a0d8ba','#ffe5a0','#a5cbee'];
const annotations={};
for(const book of catalog.books){
 const layers=[],pages=catalog.pages.filter(p=>p.book===book.id);
 for(const [i,info] of pages.entries()){
  const p=JSON.parse(gunzipSync(await readFile(`public/coloring/${info.id}.page.bin`))),chosen=p.regions.filter(r=>!r.bg&&!r.decor&&r.inr>=15).sort((a,b)=>b.area-a.area).slice(0,4);annotations[p.id]=chosen.map(r=>({id:r.id,anchor:r.anchor,area:r.area}));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048"><rect width="2048" height="2048" fill="white"/>${chosen.map((r,j)=>`<path d="${r.d}" fill="${colors[j]}" fill-rule="evenodd"/>`).join('')}<path d="${p.ink}" fill="#182b36" fill-rule="evenodd"/>${chosen.map(r=>`<text x="${r.anchor[0]}" y="${r.anchor[1]}" font-size="100" text-anchor="middle" fill="#a20e40" stroke="white" stroke-width="8" paint-order="stroke">${r.id}</text>`).join('')}</svg>`;
  const img=await sharp(Buffer.from(svg)).resize(360,360).png().toBuffer();layers.push({input:img,left:i*380+10,top:45});
  layers.push({input:Buffer.from(`<svg width="380" height="40"><text x="190" y="26" font-family="Arial" font-size="20" text-anchor="middle" fill="#284f51">${info.id} · ${info.count}</text></svg>`),left:i*380,top:0});
 }
 await sharp({create:{width:1900,height:420,channels:3,background:'#faf6ec'}}).composite(layers).png().toFile(`scripts/coloring/contact-${book.id}.png`);
}
await writeFile('scripts/coloring/annotation-regions.json',JSON.stringify(annotations,null,2));
