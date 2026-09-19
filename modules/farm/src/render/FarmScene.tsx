import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as T from 'three';
import { ASSETS, type AssetId, type CropId } from '../core/catalog';
import { boundsOf, dimensions, growthStage, placementError } from '../core/engine';
import type { Entity, FarmState, Plot, Rotation } from '../core/types';
import { assetModel, cropModel, sceneryModel } from './models';
import { RoadSample } from './Roads';
import { SpriteBuilding } from './SpriteBuilding';
import { isSpriteBuilding, buildingAssetUrl } from './buildingAssets';
export function BuildingModel({ asset, level, rotation = 0, working = false, reduced = false }: { asset: AssetId; level: number; rotation?: Rotation; working?: boolean; reduced?: boolean }) {
    return isSpriteBuilding(asset) ? <Suspense fallback={null}><SpriteBuilding asset={asset} level={level} rotation={rotation}/></Suspense> : <group rotation={[0, rotation * Math.PI / 2, 0]}><LegacyBuildingModel asset={asset} level={level} working={working} reduced={reduced}/></group>;
}
export type Placement = {
    asset: AssetId | 'plot';
    rotation: Rotation;
    moveId?: string;
    x: number;
    z: number;
};
export class SceneBoundary extends Component<{
    children: ReactNode;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() {
        if (this.state.failed)
            return <div className="farm-scene-error"><h2>Chưa mở được khu vườn 3D</h2><p>Thử tải lại hoặc bật tăng tốc đồ họa trong trình duyệt. Tiến trình đã lưu vẫn được giữ.</p><button onClick={() => location.reload()}>Tải lại</button></div>;
        return this.props.children;
    }
}
function FitCamera({ width, depth, reset, gallery = false }: {
    width: number;
    depth: number;
    reset: number;
    gallery?: boolean;
}) {
    const { camera, size, invalidate } = useThree();
    useEffect(() => {
        if (!(camera instanceof T.OrthographicCamera))
            return;
        const x = width / 2, z = depth / 2;
        camera.position.set(x + 17, 23, z + 22);
        camera.lookAt(x, 0, z);
        camera.zoom = Math.min(size.width / (gallery ? 8 : width + 10), size.height / (gallery ? 7 : depth + 6));
        camera.updateProjectionMatrix();
        invalidate();
    }, [width, depth, size.width, size.height, reset, gallery, camera, invalidate]);
    return null;
}
function LegacyBuildingModel({ asset, level, working = false, reduced = false }: {
    asset: AssetId;
    level: number;
    working?: boolean;
    reduced?: boolean;
}) {
    const model = useMemo(() => assetModel(asset, level), [asset, level]);
    const head = useMemo(() => model.getObjectByName('cow-head'), [model]);
    const cow = useMemo(() => model.getObjectByName('cow'), [model]);
    const sails = useMemo(() => model.getObjectByName('sails'), [model]);
    const origin = useMemo(() => cow?.position.clone(), [cow]);
    useFrame(({ clock }, delta) => {
        if (reduced)
            return;
        if (sails && working)
            sails.rotation.z -= Math.min(delta, .06) * .45;
        if (head)
            head.rotation.x = working ? .32 + Math.sin(clock.elapsedTime * 2) * .17 : Math.sin(clock.elapsedTime * .7) * .07;
        if (cow && origin)
            cow.position.y = origin.y + Math.sin(clock.elapsedTime * 1.8) * .009;
    });
    return asset === 'path' ? <RoadSample level={level}/> : <primitive object={model} dispose={null}/>;
}
function Light({ quality }: {
    quality: 'soft' | 'light';
}) {
    return <>
    <hemisphereLight args={['#fff3d9', '#7d8e68', 2.1]}/>
    <directionalLight position={[-5, 18, 10]} intensity={3.1} color="#fff1d2" castShadow={quality === 'soft'} shadow-mapSize={[2048, 2048]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-camera-far={80} shadow-bias={-.0004} shadow-normalBias={.045}/>
  </>;
}
function SampleCrop({ crop, stage }: {
    crop: CropId;
    stage: number;
}) {
    const model = useMemo(() => cropModel(crop, stage), [crop, stage]);
    return <primitive object={model} dispose={null}/>;
}
export function AssetPreview({ asset, level, crop, stage, reduced }: {
    asset: AssetId;
    level: number;
    crop?: CropId;
    stage: number;
    reduced: boolean;
}) {
    const [view, setView] = useState<Rotation>(0);
    if (!crop && isSpriteBuilding(asset)) return <div className="farm-sprite-preview"><img src={buildingAssetUrl(asset, level, view)} alt={ASSETS[asset].name + ' · hướng ' + (view + 1)}/><nav aria-label="Góc nhìn công trình">{([0, 1, 2, 3] as Rotation[]).map(n => <button key={n} aria-label={'Góc ' + (n + 1)} aria-pressed={view === n} onClick={() => setView(n)}>{n * 90}°</button>)}</nav></div>;
    return <SceneBoundary><Canvas shadows orthographic camera={{ position: [6, 6, 8], zoom: 80 }} dpr={[1, 1.5]} aria-label="Mẫu tài nguyên 3D có thể xoay">
    <color attach="background" args={['#eee9db']}/><Light quality="soft"/><FitCamera width={0} depth={0} reset={0} gallery/>
    <group scale={crop ? 3 : 1}>{crop ? <SampleCrop crop={crop} stage={stage}/> : <BuildingModel asset={asset} level={level} working reduced={reduced}/>}</group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.04, 0]} receiveShadow><circleGeometry args={[3.1, 64]}/><meshStandardMaterial color="#ddd6c1" roughness={1}/></mesh>
    <OrbitControls makeDefault target={[0, .8, 0]} minZoom={35} maxZoom={200} maxPolarAngle={Math.PI / 2.1}/>
  </Canvas></SceneBoundary>;
}
