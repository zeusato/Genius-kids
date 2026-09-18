import { useLayoutEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as T from 'three';
import { ASSETS, type AssetId } from '../core/catalog';
import { assetModel } from '../render/models';
import { AssetPreview } from '../render/FarmScene';
import '../farm.css';
const ids = Object.keys(ASSETS).filter(id => ASSETS[id as AssetId].kind === 'building') as AssetId[];
function Sheet({ level, side, choose }: { level: number; side: number; choose: (id: AssetId) => void }) {
    const { camera, size, invalidate } = useThree(), columns = size.width < 700 ? 3 : 5, rows = Math.ceil(ids.length / columns);
    const right = useMemo(() => new T.Vector3(30, 0, -24).normalize(), []);
    const up = useMemo(() => new T.Vector3(30, 0, -24).normalize().cross(new T.Vector3(-24, -27, -30).normalize()).normalize(), []);
    const models = useMemo(() => ids.map(id => assetModel(id, level)), [level]);
    useLayoutEffect(() => { camera.position.set(240, 270, 300); camera.lookAt(0, 0, 0); camera.zoom = Math.min(size.width / (columns * 5.6), size.height / (rows * 4.8)); camera.updateProjectionMatrix(); invalidate(); }, [camera, size, columns, rows, invalidate]);
    return <>{ids.map((id, i) => {
        const pos = right.clone().multiplyScalar((i % columns - (columns - 1) / 2) * 5.6).addScaledVector(up, ((rows - 1) / 2 - Math.floor(i / columns)) * 4.8 - .7);
        return <group key={id} position={pos}><group rotation={[0, side * Math.PI / 2, 0]}><primitive object={models[i]} dispose={null}/></group><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.06, 0]}><circleGeometry args={[2.1, 40]}/><meshStandardMaterial color="#ddd8c5"/></mesh><Html center position={[0, -.6, 0]}><button className="farm-sheet-label" onClick={() => choose(id)}>{ASSETS[id].name}</button></Html></group>;
    })}</>;
}
export default function ArchitectureLab() {
    const [level, setLevel] = useState(25), [side, setSide] = useState(0), [selected, setSelected] = useState<AssetId | null>(null);
    return <main className="farm-architecture-lab"><header><div><small>XƯỞNG KIẾN TRÚC · SÂN THỬ</small><h1>Nhìn hình, nhận ra nghề.</h1><p>29 công trình · chọn một mẫu để xem gần. Đây là bảng trưng bày, không phải nông trại khởi đầu.</p></div><a href="?lab=qa">Về sân thử nông trại ↗</a></header><nav aria-label="Chọn cấp và hướng"><span>Cấp công trình</span>{[1, 5, 10, 15, 20, 25].map(n => <button key={n} aria-pressed={level === n} onClick={() => setLevel(n)}>{n}</button>)}<span>Hướng</span>{[0, 1, 2, 3].map(n => <button key={n} aria-label={`Hướng ${n + 1}`} aria-pressed={side === n} onClick={() => setSide(n)}>{n + 1}</button>)}</nav><div className="farm-architecture-sheet"><Canvas orthographic frameloop="demand" camera={{position:[240,270,300],zoom:35,near:.1,far:2000}} dpr={[1,1.5]}><color attach="background" args={['#f3efe4']}/><hemisphereLight args={['#fff2dc','#8a9277',2]}/><directionalLight position={[-6,20,12]} intensity={2.3}/><Sheet level={level} side={side} choose={setSelected}/></Canvas></div>{selected && <section className="farm-architecture-detail" aria-label="Công trình đang xem"><div><h2>{ASSETS[selected].name} · cấp {level}</h2><button onClick={() => setSelected(null)} aria-label="Đóng xem gần">×</button></div><p>{ASSETS[selected].description}</p><div className="farm-gallery-canvas"><AssetPreview asset={selected} level={level} stage={4} reduced/></div><p>Kéo để xem quanh công trình; cuộn để phóng to.</p></section>}</main>;
}
