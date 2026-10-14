import sharp from 'sharp';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {segment,contours,encodeMap,decodeMap} from '../src/coloring/engine/geometry.mjs';
const root=new URL('../',import.meta.url),catalog=JSON.parse(await readFile(new URL('scripts/coloring/catalog.json',root),'utf8'));
const out=new URL('public/coloring/',root),cache=new URL('scripts/coloring/pages/',root);
await mkdir(out,{recursive:true});await mkdir(cache,{recursive:true});
const names=JSON.parse(await readFile(new URL('scripts/coloring/region-names.json',root),'utf8'));
const check=process.argv.includes('--check'),partial=process.argv.includes('--partial'),reports=[],ready=[];
// Relative axis-aligned commands preserve every pixel edge while compressing far better.
function compact(d){if(!d.includes('L'))return d;let x=0,y=0;return d.replace(/([ML])(\d+) (\d+)|Z/g,(all,kind,xx,yy)=>{if(all==='Z')return 'Z';const a=+xx,b=+yy,result=kind==='M'?`M${a} ${b}`:a===x?`v${b-y}`:b===y?`h${a-x}`:`L${a} ${b}`;x=a;y=b;return result;});}
for(const info of catalog.pages){
 const {id}=info;if(!/^[a-z0-9-]+$/.test(id))throw Error('Mã tranh không hợp lệ');
 const source=new URL(`scripts/coloring/sources/${id}.png`,root),target=new URL(id+'.page.bin',out);
 try{await stat(source);}catch{if(partial)continue;throw Error('Thiếu ảnh '+id);}
 let page,labels;
 if(check){page=JSON.parse(gunzipSync(await readFile(target)));labels=decodeMap(gunzipSync(await readFile(new URL(id+'.bin',out))));}
 else{
  const bytes=await readFile(source),hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
  try{page=JSON.parse(gunzipSync(await readFile(target)));}catch{try{page=JSON.parse(await readFile(new URL(id+'.json',out),'utf8'));}catch{}}
  if(page?.rev!==hash){
   const size=2048,gray=await sharp(bytes).resize(size,size).flatten({background:'#fff'}).greyscale().raw().toBuffer(),seg=segment(gray,size),paths=contours(seg.labels,size);labels=seg.labels;
   const regions=seg.regions.map(r=>({...r,d:paths.get(r.id),color:(r.id*7)%24,name:r.bg?'Nền tranh':`Vùng ${r.id}`,decor:r.area<16}));
   page={...info,subject:undefined,version:1,rev:hash,size,regions,ink:paths.get(0)||'',source:'OpenAI imagegen',promptRef:'scripts/coloring/prompts.json'};
   await writeFile(new URL(id+'.bin',out),gzipSync(encodeMap(labels,size),{level:9}));
  }else labels=decodeMap(gunzipSync(await readFile(new URL(id+'.bin',out))));
  for(const r of page.regions){r.d=compact(r.d);if(names[id]?.[r.id]){r.name=names[id][r.id];r.listen=true;}}
  page.ink=compact(page.ink);page.count=page.regions.filter(r=>!r.bg&&!r.decor).length;page.tier=page.count<=60?'easy':page.count<=120?'medium':'hard';
  await writeFile(target,gzipSync(JSON.stringify(page),{level:9}));
  await writeFile(new URL(id+'.json',cache),JSON.stringify(page));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${page.size} ${page.size}"><rect width="${page.size}" height="${page.size}" fill="white"/><path fill="#182b36" fill-rule="evenodd" d="${page.ink}"/></svg>`;
  await writeFile(new URL(id+'.svg',cache),svg);
  await sharp(Buffer.from(svg)).resize(400,400).webp({quality:85}).toFile(new URL(id+'.webp',out).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
 }
 const counts=new Map();for(const l of labels)counts.set(l,(counts.get(l)||0)+1);
 for(const r of page.regions)if(counts.get(r.id)!==r.area||!r.d.endsWith('Z')||labels[Math.floor(r.anchor[1])*page.size+Math.floor(r.anchor[0])]!==r.id)throw Error('Vùng không hợp lệ '+id+':'+r.id);
 if(page.regions.length<5||page.regions.filter(r=>r.listen).length<4)throw Error('Thiếu vùng tô hoặc vùng có tên: '+id);
 ready.push({...info,subject:undefined,tier:page.tier,count:page.count});
 reports.push({id,regions:page.regions.length,tiny:page.regions.filter(r=>r.decor).length,bytes:(await stat(target)).size,mapBytes:(await stat(new URL(id+'.bin',out))).size});
 console.log(id+': '+page.regions.length+' vùng');
}
if(!partial&&ready.length<40)throw Error('Cần ít nhất 40 tranh');
if(!check)await writeFile(new URL('catalog.json',out),JSON.stringify({books:catalog.books,pages:ready}));
await writeFile(new URL('scripts/coloring/build-report.json',root),JSON.stringify({pages:ready.length,reports},null,2));
console.log('Đã kiểm tra '+ready.length+' tranh');

if(!check){for(const id of ['cover','scene-ocean','scene-garden','scene-sky','scene-meadow']){const input=new URL('scripts/coloring/sources/'+id+'.png',root),output=new URL(id+'.webp',out);await sharp(await readFile(input)).resize(id==='cover'?800:1440,id==='cover'?600:810).webp({quality:82}).toFile(output.pathname.replace(/^\/([A-Za-z]:)/,'$1'));}}
