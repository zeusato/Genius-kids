/** Distinguish a tap from orbiting, pinching, or a cancelled touch sequence. */
export class BoardGesture {
 private pointers=new Map<number,{x:number;y:number}>();
 private rejected=true;
 get canPick(){return !this.rejected&&this.pointers.size===0;}
 begin(id:number,x:number,y:number){
  if(!this.pointers.size)this.rejected=false;
  this.pointers.set(id,{x,y});
  if(this.pointers.size>1)this.rejected=true;
 }
 move(id:number,x:number,y:number){
  const start=this.pointers.get(id);
  if(start&&Math.hypot(x-start.x,y-start.y)>6)this.rejected=true;
 }
 end(id:number){this.pointers.delete(id);}
 cancel(id:number){this.rejected=true;this.pointers.delete(id);}
}
