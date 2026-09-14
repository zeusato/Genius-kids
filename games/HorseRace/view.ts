import {MathUtils,PerspectiveCamera,Spherical,Vector3} from 'three';

export const BOARD_SIDE=17.4;
export const BOARD_FOV=39;
export const BOARD_CAMERA:[number,number,number]=[12,28,20];
export type BoardView='straight'|'tilted';
export interface BoardFrame {left:number;top:number;width:number;height:number}
export const MIN_POLAR=.001;
// Match Dragon Quest's lowest viewing angle; keep the playing surface readable.
export const MAX_POLAR=Math.PI*.36;
export const MIN_MAGNIFICATION=.65;
export const MAX_MAGNIFICATION=2.4;

/** Move the optical center into the play area without stretching either axis. */
export function frameBoardCamera(camera:PerspectiveCamera,width:number,height:number,frame:BoardFrame={left:0,top:0,width,height}){
 camera.aspect=width/height;
 camera.setViewOffset(width,height,width/2-frame.left-frame.width/2,height/2-frame.top-frame.height/2,width,height);
 camera.updateProjectionMatrix();
}

/** A rotation-invariant fit: this runs on resize, never in the orbit frame loop. */
export function boardOrbitDistance(camera:PerspectiveCamera,canvasHeight:number,frame:BoardFrame){
 const halfTangent=Math.tan(MathUtils.degToRad(camera.fov/2))/camera.zoom;
 const limitingAngle=Math.atan(halfTangent*Math.min(frame.width,frame.height)/canvasHeight);
 // Sphere around the entire solid board and its towers, with a small edge margin.
 const radius=Math.hypot(8.8,8.8,3.2)*1.04;
 return radius/Math.sin(limitingAngle);
}

export function boardPreset(view:BoardView,distance:number){
 const direction=view==='straight'?new Vector3(0,1,.001):new Vector3(...BOARD_CAMERA);
 return new Spherical().setFromVector3(direction.setLength(distance));
}

export function fitBoardCamera(camera:PerspectiveCamera,width:number,height:number,view:BoardView='tilted',frame:BoardFrame={left:0,top:0,width,height}){
 camera.fov=BOARD_FOV;camera.zoom=1;camera.up.set(0,1,0);
 frameBoardCamera(camera,width,height,frame);
 camera.position.setFromSpherical(boardPreset(view,boardOrbitDistance(camera,height,frame)));
 camera.lookAt(0,0,0);camera.updateMatrixWorld();
}
