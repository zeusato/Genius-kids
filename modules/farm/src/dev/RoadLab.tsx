import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Roads } from '../render/Roads';
import { createFarm } from '../core/engine';
import { ROAD_DIRECTIONS } from '../core/roads';
import '../farm.css';
const cases = [{ name: 'Đứng riêng', mask: 0 }, { name: 'Đầu đường', mask: 2 }, { name: 'Đoạn thẳng', mask: 10 }, { name: 'Góc cua', mask: 3 }, { name: 'Ngã ba', mask: 11 }, { name: 'Ngã tư', mask: 15 }];
function Examples({ all }: { all: boolean }) {
    const { size, camera } = useThree();
    const entries = all ? Array.from({length:16},(_,mask)=>({name:`Kết nối ${mask.toString(2).padStart(4,'0')}`,mask})) : cases;
    const columns = all ? 4 : 3, rows = Math.ceil(entries.length / columns);
    const state = useMemo(() => {
        const s = createFarm(1800000000000, 42); s.entities = []; s.world.heights.fill(0);
        entries.forEach((entry,i) => {
            const x=8+(i%columns)*6, z=8+Math.floor(i/columns)*6;
            for(const [dx,dz] of [[0,0],...ROAD_DIRECTIONS.filter(d=>entry.mask&d.bit).map(d=>[d.dx,d.dz])]) s.entities.push({id:`road-${i}-${dx}-${dz}`,asset:'path',x:x+dx,z:z+dz,level:1,rotation:0,output:{},queue:[]});
        });
        return s;
    }, [all]);
    useEffect(() => {
        camera.position.set(8.5+(columns-1)*3,30,8.5+(rows-1)*3); camera.up.set(0,0,-1); camera.lookAt(camera.position.x,0,camera.position.z);
        camera.zoom=Math.min(size.width/(columns*6+1),size.height/(rows*6+1)); camera.updateProjectionMatrix();
    }, [columns,rows,size,camera]);
    return <><color attach="background" args={['#7d9167']}/><hemisphereLight intensity={2} args={['#fff6e5','#7c8054']}/><Roads state={state} placement={null}/>{entries.map((e,i)=><Html key={e.mask} center position={[8.5+i%columns*6,0,10.75+Math.floor(i/columns)*6]}><span className="farm-road-caption">{e.name}</span></Html>)}</>;
}
export default function RoadLab() {
    const [all,setAll]=useState(false);
    return <main className="farm-root farm-road-lab"><header><div><small>XƯỞNG MỸ THUẬT · LỐI ĐÁ</small><h1>Một con đường, nhiều cách nối</h1><p>Cùng texture, nối theo cạnh thật. Đặt thêm hoặc cất một ô, đường tự cập nhật.</p></div><button aria-pressed={all} onClick={()=>setAll(v=>!v)}>{all?'Xem 6 dạng chính':'Xem đủ 16 hướng nối'}</button><a href="?lab=qa">Về sân thử</a></header><Canvas orthographic camera={{position:[14,30,11],zoom:45,near:.1,far:100}} dpr={[1,1.5]} aria-label="Các dạng đường nối liền"><Suspense fallback={null}><Examples all={all}/></Suspense></Canvas></main>;
}
