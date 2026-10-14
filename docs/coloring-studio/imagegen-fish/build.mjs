import sharp from 'sharp';
import {readFile, writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const root = new URL('./', import.meta.url);
const S=1024, N=S*S, W=S+1;
const gray=await sharp(await readFile(new URL('source.png',root))).resize(S,S).flatten({background:'#fff'}).greyscale().raw().toBuffer();
const labels=new Int32Array(N).fill(-1), queue=new Int32Array(N), regions=[];
for(let start=0;start<N;start++){
  if(labels[start]!==-1||gray[start]<160)continue;
  const id=regions.length; let head=0,tail=1;queue[0]=start;labels[start]=id;
  let area=0,x0=S,y0=S,x1=0,y1=0,border=false,sx=0,sy=0;
  while(head<tail){const p=queue[head++],x=p%S,y=Math.floor(p/S);area++;sx+=x;sy+=y;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);border ||= x===0||y===0||x===S-1||y===S-1;
    for(const q of [x>0?p-1:-1,x<S-1?p+1:-1,y>0?p-S:-1,y<S-1?p+S:-1])if(q>=0&&labels[q]===-1&&gray[q]>=160){labels[q]=id;queue[tail++]=q;}
  }
  regions.push({id,area,border,bbox:[x0,y0,x1,y1],center:[sx/area,sy/area],locked:false});
}
// Pixel-edge contours retain every hole; no smoothing that could alter topology.
function contour(inside){
  const edges=new Map();
  function add(a,b){if(!edges.has(a))edges.set(a,[]);edges.get(a).push(b);}
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const p=y*S+x;if(!inside(p))continue;const a=y*W+x,b=a+1,c=a+W,d=c+1;
    if(y===0||!inside(p-S))add(a,b);
    if(x===S-1||!inside(p+1))add(b,d);
    if(y===S-1||!inside(p+S))add(d,c);
    if(x===0||!inside(p-1))add(c,a);
  }
  const paths=[]; const dir=(a,b)=>b-a===1?0:b-a===W?1:b-a===-1?2:3;
  while(edges.size){const start=edges.keys().next().value;let a=start,lastDir=0;const pts=[];
    do{pts.push(a);const choices=edges.get(a);if(!choices?.length)throw Error('Open contour');
      const order=[(lastDir+1)%4,lastDir,(lastDir+3)%4,(lastDir+2)%4];
      let k=0;if(choices.length>1)k=choices.map((b,i)=>({i,rank:order.indexOf(dir(a,b))})).sort((u,v)=>u.rank-v.rank)[0].i;
      const b=choices.splice(k,1)[0];if(!choices.length)edges.delete(a);lastDir=dir(a,b);a=b;
    }while(a!==start);
    const corners=pts.filter((p,i)=>dir(pts[(i+pts.length-1)%pts.length],p)!==dir(p,pts[(i+1)%pts.length]));
    paths.push(corners.map((p,i)=>(i?'L':'M')+(p%W)+' '+Math.floor(p/W)).join('')+'Z');
  }
  return paths.join('');
}
for(const r of regions)r.d=contour(p=>labels[p]===r.id);
const ink=contour(p=>gray[p]<160);
const svgStart=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">`;
const shapes=regions.map(r=>`<path id="region-${r.id}" data-region="${r.id}" data-locked="${r.locked}" fill="white" fill-rule="evenodd" d="${r.d}"/>`).join('');
const inkPath=`<path id="ink" pointer-events="none" fill="#151e28" fill-rule="evenodd" d="${ink}"/>`;
const svg=svgStart+shapes+inkPath+'</svg>';
await writeFile(new URL('regions.svg',root),svg);
await writeFile(new URL('line.svg',root),svgStart+'<rect width="1024" height="1024" fill="white"/>'+inkPath+'</svg>');
const colors=['#92dbed','#ffcb55','#ff9877','#79cdb5','#b4a4e8','#f3a7c7','#85bfed'];
const filled=regions.map(r=>`<path fill="${r.locked?'white':r.border?'#e7f8fc':colors[r.id%colors.length]}" fill-rule="evenodd" d="${r.d}"/>`).join('');
await sharp(Buffer.from(svgStart+filled+inkPath+'</svg>')).png().toFile(new URL('colored.png',root).pathname.replace(/^\/([A-Z]:)/,'$1'));
// Verify each exported vector region against source labels at pixel centers.
let mismatchedPixels=0,brushLeakPixels=0; const perRegion=[];
for(const r of regions){
  const mask=await sharp(Buffer.from(svgStart+`<path fill="white" fill-rule="evenodd" d="${r.d}"/></svg>`)).ensureAlpha().raw().toBuffer();
  let mismatch=0;for(let p=0;p<N;p++)if((mask[p*4+3]>127)!==(labels[p]===r.id))mismatch++;
  mismatchedPixels+=mismatch;
  if(!r.locked){
    const clipped=svgStart+`<defs><clipPath id="c"><path clip-rule="evenodd" d="${r.d}"/></clipPath></defs><path clip-path="url(#c)" d="M0 0L1024 1024M0 512H1024M512 0V1024M0 1024L1024 0" stroke="red" stroke-width="100" fill="none"/></svg>`;
    const brush=await sharp(Buffer.from(clipped)).ensureAlpha().raw().toBuffer();
    for(let p=0;p<N;p++)if(brush[p*4+3]>0&&labels[p]!==r.id)brushLeakPixels++;
  }
  perRegion.push({id:r.id,area:r.area,border:r.border,locked:r.locked,mismatch});
}
const report={source:'Built-in imagegen; prompt.txt',size:S,threshold:160,gapRepairs:0,regions:regions.length,paintable:regions.filter(r=>!r.locked).length,locked:regions.filter(r=>r.locked).length,background:regions.filter(r=>r.border).map(r=>r.id),tinyComponents:regions.filter(r=>r.area<3).map(r=>({id:r.id,area:r.area})),svgBytes:Buffer.byteLength(svg),svgGzipBytes:gzipSync(svg).length,mismatchedPixels,brushLeakPixels,validationScope:'Sharp/librsvg at 1024x1024: every region mask compared at pixel centers; four 100px-wide crossing strokes clipped to every region. Not a tablet performance benchmark.',limitations:['Pixel-edge polygon tracing; zoom reveals steps. Smooth vector curves not implemented.','Two 1-2px components retained; no region removal or gap repair.','One generated page only; does not establish acceptance rate for a larger catalog.'],perRegion};
await writeFile(new URL('report.json',root),JSON.stringify(report,null,2));
const template=await readFile(new URL('template.html',root),'utf8');
const defs='<defs>'+regions.map(r=>`<clipPath id="clip-${r.id}"><path clip-rule="evenodd" d="${r.d}"/></clipPath>`).join('')+'</defs>';
await writeFile(new URL('demo.html',root),template.replace('<!--ART-->',svgStart.replace('<svg ','<svg id="art" aria-label="Tranh cá dưới biển để tô màu" ')+defs+shapes+'<g id="strokes" pointer-events="none"></g>'+inkPath+'</svg>').replace('/*DATA*/',JSON.stringify(regions.map(({d,...r})=>r))));
console.log(JSON.stringify({...report,perRegion:undefined},null,2));
if(mismatchedPixels||brushLeakPixels)process.exitCode=1;
