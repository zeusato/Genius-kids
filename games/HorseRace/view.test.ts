import {describe,it,expect} from 'vitest';
import {PerspectiveCamera,Plane,Raycaster,Spherical,Vector2,Vector3} from 'three';
import {BOARD_FOV,BOARD_SIDE,fitBoardCamera,frameBoardCamera,boardOrbitDistance,MIN_POLAR,MAX_POLAR} from './view';

const layouts=[
 [1024,768,{left:14,top:68,width:762,height:684}],
 [820,1180,{left:12,top:65,width:796,height:841}],
 [390,844,{left:12,top:65,width:366,height:505}],
 [1920,800,{left:14,top:68,width:1610,height:716}],
] as const;

describe('physical perspective projection',()=>{
 it.each(layouts)('does not stretch a square or a circle in a %s × %s viewport',(width,height,frame)=>{
  const camera=new PerspectiveCamera(BOARD_FOV,width/height,.1,350);
  fitBoardCamera(camera,width,height,'straight',frame);
  const pixel=(x:number,z:number)=>{const p=new Vector3(x,.43,z).project(camera);return new Vector2((p.x+1)*width/2,(1-p.y)*height/2);};
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>pixel(x*BOARD_SIDE/2,z*BOARD_SIDE/2));
  const sides=corners.map((p,i)=>p.distanceTo(corners[(i+1)%4]));
  expect(Math.max(...sides)/Math.min(...sides)).toBeCloseTo(1,3);
  const horizontal=pixel(-.4,0).distanceTo(pixel(.4,0)),vertical=pixel(0,-.4).distanceTo(pixel(0,.4));
  expect(horizontal/vertical).toBeCloseTo(1,5);
  const center=pixel(0,0);expect(center.x).toBeCloseTo(frame.left+frame.width/2);
  expect(camera.isPerspectiveCamera).toBe(true);
 });
 it('makes an equally sized object near the camera larger than one at the back',()=>{
  const camera=new PerspectiveCamera(BOARD_FOV,1,.1,350);
  camera.position.set(0,30,30);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const projectedWidth=(z:number)=>new Vector3(.4,.5,z).project(camera).x-new Vector3(-.4,.5,z).project(camera).x;
  expect(projectedWidth(7)/projectedWidth(-7)).toBeGreaterThan(1.2);
 });
 it('fits the solid square at every orbit direction without changing distance, FOV or zoom',()=>{
  for(const [width,height,frame] of layouts){
   const camera=new PerspectiveCamera(BOARD_FOV,width/height,.1,350);
   fitBoardCamera(camera,width,height,'tilted',frame);const distance=camera.position.length(),projection=camera.projectionMatrix.clone();
   for(const polar of [MIN_POLAR,.35,.7,MAX_POLAR])for(let angle=0;angle<Math.PI*2;angle+=Math.PI/16){
    camera.position.setFromSpherical(new Spherical(distance,polar,angle));camera.lookAt(0,0,0);camera.updateMatrixWorld();
    for(const x of [-8.8,8.8])for(const z of [-8.8,8.8])for(const y of [-.85,3.2]){
     const p=new Vector3(x,y,z).project(camera),px=(p.x+1)*width/2,py=(1-p.y)*height/2;
     expect(px).toBeGreaterThan(frame.left);expect(px).toBeLessThan(frame.left+frame.width);
     expect(py).toBeGreaterThan(frame.top);expect(py).toBeLessThan(frame.top+frame.height);
    }
    expect(camera.position.length()).toBeCloseTo(distance,9);expect(camera.projectionMatrix.equals(projection)).toBe(true);
    expect(boardOrbitDistance(camera,height,frame)).toBeCloseTo(distance,9);
   }
  }
 });
 it('reframes without changing the camera pose, FOV or dolly distance',()=>{
  const camera=new PerspectiveCamera(BOARD_FOV,1,.1,350);
  camera.position.set(-23,21,-17);camera.lookAt(0,0,0);
  const position=camera.position.clone(),rotation=camera.quaternion.clone();
  frameBoardCamera(camera,820,1180,{left:12,top:65,width:796,height:841});
  expect(camera.position.equals(position)).toBe(true);expect(camera.quaternion.equals(rotation)).toBe(true);
  expect(camera.zoom).toBe(1);expect(camera.fov).toBe(BOARD_FOV);
 });
 it('raycasts back to the same board cells after rotation, dolly and off-center framing',()=>{
  const plane=new Plane(new Vector3(0,1,0),-.43),ray=new Raycaster(),hit=new Vector3();
  for(const [width,height,frame] of layouts){
   const camera=new PerspectiveCamera(BOARD_FOV,width/height,.1,350);
   fitBoardCamera(camera,width,height,'tilted',frame);const distance=camera.position.length();
   for(const azimuth of [0,Math.PI/3,Math.PI,Math.PI*1.5])for(const zoom of [.65,1,2.4]){
    camera.position.setFromSpherical(new Spherical(distance/zoom,.9,azimuth));camera.lookAt(0,0,0);camera.updateMatrixWorld();
    for(const [x,z] of [[-1,-7],[-7,1],[1,7],[7,-1],[0,0]]){
     const cell=new Vector3(x,.43,z),p=cell.clone().project(camera);ray.setFromCamera(new Vector2(p.x,p.y),camera);
     expect(ray.ray.intersectPlane(plane,hit)).not.toBeNull();expect(hit.distanceTo(cell)).toBeLessThan(1e-8);
    }
   }
  }
 });
});
