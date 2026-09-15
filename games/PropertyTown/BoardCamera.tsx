import {useEffect,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as T from 'three';
import {lotPoint,facing} from './board';
import type {BoardProps} from './Board3D';
export default function BoardCamera(p:BoardProps){const {camera,size}=useThree(),time=useRef(0),look=useRef(new T.Vector3()),last=useRef(''),controls=useRef<any>(null),settle=useRef(0);const portrait=size.width<size.height,scale=portrait?2.4:1;
 useEffect(()=>{time.current=0;last.current='';},[p.s.id]);
 useFrame((_,dt)=>{if(p.paused)return;const home=new T.Vector3(17*scale,24*scale,28*scale),homeLook=new T.Vector3(0,0,0),key=`${p.selected}:${p.intro}:${p.view}:${size.width}`;let pos=home,target=homeLook;
 if(p.intro){time.current+=Math.min(dt,.05);const t=time.current,keys=[0,3,5.5,8,10.8],positions=[new T.Vector3(28*scale,33*scale,42*scale),new T.Vector3(11.8,2.7,13.8),new T.Vector3(9.5,2.5,13.2),new T.Vector3(4.8,3.7,11.4),home],targets=[homeLook,new T.Vector3(9.15,.65,9.15),new T.Vector3(9.15,.65,9.15),new T.Vector3(5.55,.85,7.4),homeLook];let i=0;while(i<3&&t>keys[i+1])i++;const f=T.MathUtils.clamp((t-keys[i])/(keys[i+1]-keys[i]),0,1),e=f*f*(3-2*f);pos=positions[i].clone().lerp(positions[i+1],e);target=targets[i].clone().lerp(targets[i+1],e);camera.position.copy(pos);camera.lookAt(target);look.current.copy(target);if(t>=10.8)p.onIntroEnd();return;}
 if(p.selected!==null){const [x,,z]=lotPoint(p.selected),ang=facing(p.selected),out=new T.Vector3(Math.sin(ang),0,Math.cos(ang));target.set(x,.55,z);pos=target.clone().add(out.multiplyScalar(portrait?7.5:6.2)).add(new T.Vector3(2.2,4.9,0));}
 if(last.current!==key){last.current=key;settle.current=1.8;}if(settle.current>0){settle.current-=dt;const alpha=p.reduced?1:1-Math.exp(-dt*4);camera.position.lerp(pos,alpha);look.current.lerp(target,alpha);camera.lookAt(look.current);controls.current?.target.copy(look.current);}
 });
 return <OrbitControls ref={controls} enabled={!p.intro&&!p.paused&&p.selected===null} enablePan={false} minDistance={9} maxDistance={portrait?125:90} minPolarAngle={.3} maxPolarAngle={1.15} enableDamping dampingFactor={.08}/>;
}
