import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as T from 'three';
import { ASSETS, type AssetId, type CropId } from '../core/catalog';
import { boundsOf, dimensions, growthStage, placementError } from '../core/engine';
import type { Entity, FarmState, Plot, Rotation } from '../core/types';
import { assetModel, cropModel, sceneryModel } from './models';

export type Placement = { asset: AssetId | 'plot'; rotation: Rotation; moveId?: string; x: number; z: number };
type Props = { state: FarmState; selected: string | null; placement: Placement | null; onSelect: (id: string) => void; onPosition: (x: number, z: number) => void; quality: 'soft' | 'light'; reduced: boolean; cameraReset: number };

export class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="farm-scene-error"><h2>Chưa mở được khu vườn 3D</h2><p>Thử tải lại hoặc bật tăng tốc đồ họa trong trình duyệt. Tiến trình đã lưu vẫn được giữ.</p><button onClick={() => location.reload()}>Tải lại</button></div>;
    return this.props.children;
  }
}
function FitCamera({ width, depth, reset, gallery = false }: { width: number; depth: number; reset: number; gallery?: boolean }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    if (!(camera instanceof T.OrthographicCamera)) return;
    const x = width / 2, z = depth / 2;
    camera.position.set(x + 17, 23, z + 22);
    camera.lookAt(x, 0, z);
    camera.zoom = Math.min(size.width / (gallery ? 8 : width + 10), size.height / (gallery ? 7 : depth + 6));
    camera.updateProjectionMatrix(); invalidate();
  }, [width, depth, size.width, size.height, reset, gallery, camera, invalidate]);
  return null;
}
function Ground({ width, depth, onPick, grid }: { width: number; depth: number; onPick: (e: ThreeEvent<MouseEvent>) => void; grid: boolean }) {
  const scenery = useMemo(() => sceneryModel(width, depth), [width, depth]);
  useEffect(() => () => scenery.traverse(node => { if (node instanceof T.Mesh) node.geometry.dispose(); }), [scenery]);
  return <>
    <mesh position={[width / 2, -.37, depth / 2]} receiveShadow><boxGeometry args={[width + .5, .66, depth + .5]} /><meshStandardMaterial color="#a68b62" roughness={1} /></mesh>
    <mesh position={[width / 2, -.04, depth / 2]} receiveShadow onClick={onPick}><boxGeometry args={[width, .1, depth]} /><meshStandardMaterial color="#a9ba79" roughness={1} /></mesh>
    <mesh position={[width / 2, -.75, depth / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[160, 160]} /><meshStandardMaterial color="#dce0c8" roughness={1} /></mesh>
    <primitive object={scenery} dispose={null} />
    {grid && <group position={[0, .018, 0]}>
      {Array.from({ length: width + 1 }, (_, i) => <mesh key={`x${i}`} position={[i, 0, depth / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[.016, depth]} /><meshBasicMaterial color="#f7f3da" transparent opacity={.45} depthWrite={false} /></mesh>)}
      {Array.from({ length: depth + 1 }, (_, i) => <mesh key={`z${i}`} position={[width / 2, 0, i]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[width, .016]} /><meshBasicMaterial color="#f7f3da" transparent opacity={.45} depthWrite={false} /></mesh>)}
    </group>}
  </>;
}
function Footprint({ x, z, width, depth, invalid = false }: { x: number; z: number; width: number; depth: number; invalid?: boolean }) {
  return <mesh position={[x + width / 2, .08, z + depth / 2]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[width - .04, depth - .04]} /><meshBasicMaterial color={invalid ? '#d86952' : '#f4df93'} transparent opacity={.48} depthWrite={false} />
  </mesh>;
}
function Plant({ plot, now, selected, onSelect }: { plot: Plot; now: number; selected: boolean; onSelect: (id: string) => void }) {
  const stage = growthStage(plot, now);
  const model = useMemo(() => plot.crop ? cropModel(plot.crop, stage) : null, [plot.crop, stage]);
  return <group position={[plot.x + .5, .055, plot.z + .5]} onClick={e => { if (e.delta > 5) return; e.stopPropagation(); onSelect(plot.id); }}>
    <mesh receiveShadow><boxGeometry args={[.88, .1, .88]} /><meshStandardMaterial color={plot.watered ? '#755639' : '#956d4a'} roughness={1} /></mesh>
    {[-.28, 0, .28].map(x => <mesh key={x} position={[x, .058, 0]} receiveShadow><boxGeometry args={[.065, .04, .78]} /><meshStandardMaterial color="#ae8960" roughness={1} /></mesh>)}
    {model && <primitive object={model} position={[0, .085, 0]} dispose={null} />}
    {selected && <mesh position={[0, .055, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.61, .65, 4, 1, Math.PI / 4]} /><meshBasicMaterial color="#fff2ba" side={T.DoubleSide} /></mesh>}
    {stage === 4 && <Html position={[0, 1.55, 0]} center zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}><span className="farm-ready-dot" title="Sẵn thu hoạch">✓</span></Html>}
  </group>;
}
export function BuildingModel({ asset, level, working = false, reduced = false }: { asset: AssetId; level: number; working?: boolean; reduced?: boolean }) {
  const model = useMemo(() => assetModel(asset, level), [asset, level]);
  const head = useMemo(() => model.getObjectByName('cow-head'), [model]);
  const cow = useMemo(() => model.getObjectByName('cow'), [model]);
  const sails = useMemo(() => model.getObjectByName('sails'), [model]);
  const origin = useMemo(() => cow?.position.clone(), [cow]);
  useFrame(({ clock }, delta) => {
    if (reduced) return;
    if (sails && working) sails.rotation.z -= Math.min(delta, .06) * .45;
    if (head) head.rotation.x = working ? .32 + Math.sin(clock.elapsedTime * 2) * .17 : Math.sin(clock.elapsedTime * .7) * .07;
    if (cow && origin) cow.position.y = origin.y + Math.sin(clock.elapsedTime * 1.8) * .009;
  });
  return <primitive object={model} dispose={null} />;
}
function Building({ entity, now, selected, onSelect, reduced }: { entity: Entity; now: number; selected: boolean; onSelect: (id: string) => void; reduced: boolean }) {
  const [w, d] = dimensions(entity.asset, entity.rotation);
  return <>
    {selected && <Footprint x={entity.x} z={entity.z} width={w} depth={d} />}
    <group position={[entity.x + w / 2, .03, entity.z + d / 2]} rotation={[0, entity.rotation * Math.PI / 2, 0]} onClick={e => { if (e.delta > 5) return; e.stopPropagation(); onSelect(entity.id); }}>
      <BuildingModel asset={entity.asset} level={entity.level} working={!!entity.job && entity.job.readyAt > now} reduced={reduced} />
    </group>
    {(selected || entity.job) && <Html position={[entity.x + w / 2, entity.asset === 'mill' ? 3.7 : 2.9, entity.z + d / 2]} center zIndexRange={[2, 0]} style={{ pointerEvents: 'none' }}><span className={`farm-world-label ${entity.job && entity.job.readyAt <= now ? 'ready' : ''}`}>{entity.job && entity.job.readyAt <= now ? '✓ Nhận sản phẩm' : ASSETS[entity.asset].name}</span></Html>}
  </>;
}
function Light({ quality }: { quality: Props['quality'] }) {
  return <>
    <hemisphereLight args={['#fff3d9', '#7d8e68', 2.1]} />
    <directionalLight position={[-5, 18, 10]} intensity={3.1} color="#fff1d2" castShadow={quality === 'soft'} shadow-mapSize={[2048, 2048]} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-camera-far={80} shadow-bias={-.0004} shadow-normalBias={.045} />
  </>;
}
function Scene(props: Props) {
  const { state, placement } = props, { width, depth } = boundsOf(state);
  const [pw, pd] = placement && placement.asset !== 'plot' ? dimensions(placement.asset, placement.rotation) : [1, 1];
  const invalid = placement && placementError(state, placement.x, placement.z, pw, pd, placement.moveId);
  return <>
    <color attach="background" args={['#e1e5d0']} /><fog attach="fog" args={['#e1e5d0', 55, 110]} />
    <Light quality={props.quality} /><FitCamera width={width} depth={depth} reset={props.cameraReset} />
    <Ground width={width} depth={depth} grid={!!placement} onPick={e => { if (placement && e.delta < 5) props.onPosition(Math.floor(e.point.x), Math.floor(e.point.z)); }} />
    {state.plots.map(p => <Plant key={p.id} plot={p} now={state.clock} selected={p.id === props.selected} onSelect={props.onSelect} />)}
    {state.entities.map(e => <Building key={e.id} entity={e} now={state.clock} selected={e.id === props.selected} onSelect={props.onSelect} reduced={props.reduced} />)}
    {placement && <>
      <Footprint x={placement.x} z={placement.z} width={pw} depth={pd} invalid={!!invalid} />
      {placement.asset !== 'plot' && <group position={[placement.x + pw / 2, .2, placement.z + pd / 2]} rotation={[0, placement.rotation * Math.PI / 2, 0]}><BuildingModel asset={placement.asset} level={state.entities.find(e => e.id === placement.moveId)?.level ?? 1} reduced /></group>}
    </>}
    <OrbitControls key={`controls-${props.cameraReset}-${width}-${depth}`} makeDefault target={[width / 2, 0, depth / 2]} enableRotate={false} minZoom={12} maxZoom={95} maxPolarAngle={Math.PI / 2.4} screenSpacePanning={false} mouseButtons={{ LEFT: T.MOUSE.PAN, MIDDLE: T.MOUSE.DOLLY, RIGHT: T.MOUSE.PAN }} touches={{ ONE: T.TOUCH.PAN, TWO: T.TOUCH.DOLLY_PAN }} />
  </>;
}
export function FarmScene(props: Props) {
  return <SceneBoundary><Canvas shadows={props.quality === 'soft'} frameloop={props.reduced ? 'demand' : 'always'} orthographic camera={{ position: [25, 23, 29], zoom: 35, near: .1, far: 180 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }} aria-label="Khu vườn 3D Làng Mầm" onCreated={({ gl }) => { gl.setClearColor('#e1e5d0'); gl.toneMapping = T.ACESFilmicToneMapping; gl.toneMappingExposure = 1.12; }}><Suspense fallback={null}><Scene {...props} /></Suspense></Canvas></SceneBoundary>;
}
function SampleCrop({ crop, stage }: { crop: CropId; stage: number }) {
  const model = useMemo(() => cropModel(crop, stage), [crop, stage]);
  return <primitive object={model} dispose={null} />;
}
export function AssetPreview({ asset, level, crop, stage, reduced }: { asset: AssetId; level: number; crop?: CropId; stage: number; reduced: boolean }) {
  return <SceneBoundary><Canvas shadows orthographic camera={{ position: [6, 6, 8], zoom: 80 }} dpr={[1, 1.5]} aria-label="Mẫu tài nguyên 3D có thể xoay">
    <color attach="background" args={['#eee9db']} /><Light quality="soft" /><FitCamera width={0} depth={0} reset={0} gallery />
    <group scale={crop ? 3 : 1}>{crop ? <SampleCrop crop={crop} stage={stage} /> : <BuildingModel asset={asset} level={level} working reduced={reduced} />}</group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.04, 0]} receiveShadow><circleGeometry args={[3.1, 64]} /><meshStandardMaterial color="#ddd6c1" roughness={1} /></mesh>
    <OrbitControls makeDefault target={[0, .8, 0]} minZoom={35} maxZoom={200} maxPolarAngle={Math.PI / 2.1} />
  </Canvas></SceneBoundary>;
}
