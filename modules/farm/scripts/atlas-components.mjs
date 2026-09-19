export function atlasComponents(data,width,height) {
 const labels=new Int32Array(width*height), parts=[];
 const queue=new Int32Array(width*height);
 for(let pixel=0;pixel<labels.length;pixel++) {
  if(labels[pixel]||data[pixel*4+3]<40)continue;
  const id=parts.length+1,part={id,n:0,left:width,right:0,top:height,bottom:0};let head=0,tail=0;
  labels[pixel]=id;queue[tail++]=pixel;
  while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);part.n++;part.left=Math.min(part.left,x);part.right=Math.max(part.right,x);part.top=Math.min(part.top,y);part.bottom=Math.max(part.bottom,y);
   for(const next of [x>0?p-1:-1,x<width-1?p+1:-1,y>0?p-width:-1,y<height-1?p+width:-1]) if(next>=0&&!labels[next]&&data[next*4+3]>=40){labels[next]=id;queue[tail++]=next;}
  }
  parts.push(part);
 }
 return {labels,parts};
}
