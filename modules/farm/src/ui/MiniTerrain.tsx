import {useMemo} from 'react';
import {heightAt,isWater,type World} from '../core/world';
/** A compact rendering of the same persisted terrain used by the 3D world. */
export function MiniTerrain({world,chunk}:{world:World;chunk:number}){
 const terrain=useMemo(()=>{const groups=new Map<string,string>();for(let z=0;z<16;z++)for(let x=0;x<16;x++){const xx=chunk%6*16+x,zz=Math.floor(chunk/6)*16+z,color=isWater(world,xx,zz)?'#6daba9':heightAt(world,xx,zz)>.5?'#a49980':'#b5c290';groups.set(color,(groups.get(color)??'')+`M${x} ${z}h1v1h-1z`);}return [...groups];},[world.seed,chunk]);
 return <svg viewBox="0 0 16 16" aria-hidden="true" className="farm-mini-terrain">{terrain.map(([fill,d])=><path key={fill} fill={fill} d={d}/>)}{world.bridges.filter(b=>Math.floor(b.x/16)+Math.floor(b.z/16)*6===chunk).map(b=><rect key={b.id} x={b.x%16} y={b.z%16} width={6} height={2} fill={b.built?'#80643e':'#ecd59f'}/>)}</svg>;
}
