// Reproducible atlas extraction. Keep the authored shapes intact even when row heights differ.
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { atlasComponents } from './atlas-components.mjs';
const root = new URL('../', import.meta.url);
const original = new URL('src/assets/buildings/source/', root), runtime = new URL('src/assets/buildings/runtime/', root);
await mkdir(runtime, { recursive: true });
const levels = [1, 5, 10, 15, 20, 25], report = [];
const sources = (await readdir(original)).filter(f=>f.endsWith('-atlas-v1.png')).sort();
for (const file of sources) {
  const id = file.replace('-atlas-v1.png','');
  const {data,info}=await sharp(fileURLToPath(new URL(file,original))).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {labels,parts}=atlasComponents(data,info.width,info.height);
  const main=parts.filter(p=>p.n>1000);
  if(main.length!==24) throw new Error(`${id}: expected 24 isolated authored sprites, got ${main.length}`);
  const owners=new Int16Array(parts.length+1);
  const boxes=main.map(p=>({...p}));
  for(const part of parts) {
    let owner=main.indexOf(part);
    if(owner<0) {
      const x=(part.left+part.right)/2,y=(part.top+part.bottom)/2;
      let best=Infinity;
      main.forEach((m,i)=>{const dx=Math.max(m.left-x,0,x-m.right),dy=Math.max(m.top-y,0,y-m.bottom),dist=dx*dx+dy*dy;if(dist<best){best=dist;owner=i;}});
    }
    owners[part.id]=owner+1;
    const box=boxes[owner];box.left=Math.min(box.left,part.left);box.right=Math.max(box.right,part.right);box.top=Math.min(box.top,part.top);box.bottom=Math.max(box.bottom,part.bottom);
  }
  let pixels=Int16Array.from(labels,label=>owners[label]);
  // Keep the original soft alpha fringe around each connected shape.
  for(let pass=0;pass<3;pass++) {
    const next=pixels.slice();
    for(let p=0;p<pixels.length;p++) if(!pixels[p]&&data[p*4+3]) {
      const x=p%info.width,y=Math.floor(p/info.width);
      for(const q of [x?p-1:-1,x<info.width-1?p+1:-1,y?p-info.width:-1,y<info.height-1?p+info.width:-1]) if(q>=0&&pixels[q]){next[p]=pixels[q];break;}
    }
    pixels=next;
  }
  for(let rotation=0;rotation<4;rotation++) {
    const column=main.map((p,i)=>({p,i})).filter(({p})=>Math.floor((p.left+p.right)/2/(info.width/4))===rotation).sort((a,b)=>a.p.top-b.p.top);
    if(column.length!==6) throw new Error(`${id}: column ${rotation} has ${column.length} sprites`);
    for(let row=0;row<6;row++) {
      const {i}=column[row],b=boxes[i],left=Math.max(0,b.left-4),top=Math.max(0,b.top-4);
      const width=Math.min(info.width-1,b.right+4)-left+1,height=Math.min(info.height-1,b.bottom+4)-top+1;
      const cutout=Buffer.alloc(width*height*4);
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=(y+top)*info.width+x+left;if(pixels[p]===i+1)data.copy(cutout,(y*width+x)*4,p*4,p*4+4);}
      const name=`${id}-${levels[row]}-${rotation}.webp`;
      const output=await sharp(cutout,{raw:{width,height,channels:4}}).resize(240,240,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).extend({top:8,bottom:8,left:8,right:8,background:{r:0,g:0,b:0,alpha:0}}).webp({quality:90,alphaQuality:100,effort:4}).toBuffer();
      await writeFile(new URL(name,runtime),output);
      report.push({file:name,width:256,height:256,bytes:output.length,sourceBounds:{left,top,width,height}});
    }
  }
  console.log(id);
}
await writeFile(new URL('docs/building-sprite-manifest.json',root),JSON.stringify({generator:'built-in image_gen',extraction:'24 alpha-connected subjects per atlas, transparent padding',tiers:levels,views:[0,90,180,270],sprites:report},null,2));
console.log(`${sources.length} building families; ${report.length} complete sprites; ${(report.reduce((n,r)=>n+r.bytes,0)/1048576).toFixed(2)} MiB runtime`);

