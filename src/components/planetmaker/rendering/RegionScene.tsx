import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useFrame } from '@react-three/fiber';
import { Building, BUILDINGS, covers, footprint, heightAt, placement, port, Region, RegionTool, SIZE, STRIDE, TILE, simulate } from '../engine/region';

const noRaycast = () => null;
const COLORS = ['#77ad65', '#77ad65', '#dfc791', '#8b9097', '#eaf3f8', '#ec6c3c'].map(c => new THREE.Color(c));
const SEA_FLOOR = new THREE.Color('#b6c6a6');
import { Batch } from './Instances';
import { Shape, townInstances } from './architecture';
import { BuildingPreview, Draft } from './BuildingPreview';
import { Pedestrians } from './Pedestrians';
import { Vehicles } from './Vehicles';
import { environmentInstances, GRAPHICS } from './environment';
export type { Draft } from './BuildingPreview';
export interface RegionSceneProps {
    region: Region; version: number; dirty: React.MutableRefObject<Set<number>>; tool: RegionTool;
    cursor: [number, number] | null; radius: number; draft: Draft | null; selected: string | null;
    onDown: (e: ThreeEvent<PointerEvent>) => void; onMove: (e: ThreeEvent<PointerEvent>) => void;
    onSelect: (id: string) => void; onDraftChange: (draft: Draft) => void; onDragState: (dragging: boolean) => void; traffic: boolean; lowQuality: boolean;
}
function TerrainTile({ region: r, tile, dirty, onDown, onMove }: Pick<RegionSceneProps, 'dirty' | 'onDown' | 'onMove'> & { region: Region; tile: number }) {
    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry(), n = (TILE + 1) ** 2, indices: number[] = [];
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
        g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
        for (let z = 0; z < TILE; z++) for (let x = 0; x < TILE; x++) { const a = z * (TILE + 1) + x, b = a + 1, c = a + TILE + 1, d = c + 1; indices.push(a, c, b, b, c, d); }
        g.setIndex(indices); return g;
    }, []);
    const update = () => {
        const ox = tile % 4 * TILE, oz = Math.floor(tile / 4) * TILE;
        const p = geometry.getAttribute('position') as THREE.BufferAttribute, c = geometry.getAttribute('color') as THREE.BufferAttribute, normal = geometry.getAttribute('normal') as THREE.BufferAttribute;
        for (let z = 0; z <= TILE; z++) for (let x = 0; x <= TILE; x++) {
            const gx = ox + x, gz = oz + z, i = gz * STRIDE + gx, v = z * (TILE + 1) + x;
            p.setXYZ(v, gx / 2 - SIZE / 2, r.height[i], gz / 2 - SIZE / 2);
            const color = r.height[i] < r.seaLevel ? SEA_FLOOR : COLORS[r.biome[i]], shade = .94 + Math.sin(gx * 19 + gz * 47) * .035;
            c.setXYZ(v, color.r * shade, color.g * shade, color.b * shade);
            // Shared samples on each side of the tile produce identical seam normals.
            const dx = (r.height[gz * STRIDE + Math.min(128, gx + 1)] - r.height[gz * STRIDE + Math.max(0, gx - 1)]) / (gx === 0 || gx === 128 ? .5 : 1);
            const dz = (r.height[Math.min(128, gz + 1) * STRIDE + gx] - r.height[Math.max(0, gz - 1) * STRIDE + gx]) / (gz === 0 || gz === 128 ? .5 : 1), len = Math.hypot(dx, 1, dz);
            normal.setXYZ(v, -dx / len, 1 / len, -dz / len);
        }
        p.needsUpdate = true; c.needsUpdate = true; normal.needsUpdate = true; geometry.computeBoundingSphere(); geometry.computeBoundingBox();
    };
    useLayoutEffect(update, [r, geometry]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    useFrame(() => { if (dirty.current.delete(tile)) update(); });
    return <mesh geometry={geometry} onPointerDown={onDown} onPointerMove={onMove} receiveShadow><meshStandardMaterial vertexColors roughness={1} /></mesh>;
}
export function RegionScene(props: RegionSceneProps) {
    const { region: r, version, tool, draft, selected, cursor, radius, traffic, lowQuality } = props;
    const instances = useMemo(() => townInstances(r), [r, version]);
    const ground = useRef<THREE.Group>(null);
    const quality = lowQuality ? 'light' : r.graphics || 'balanced';
    const scenery = useMemo(() => environmentInstances(r, quality), [r, version, quality]);
    const focus = draft || r.buildings.find(b => b.id === selected), dims = focus ? footprint(focus.type, focus.yaw) : null;
    const valid = draft ? placement(r, draft.type, draft.x, draft.z, draft.yaw, draft.movingId) : null;
    const y = focus ? heightAt(r, focus.x + dims![0] / 2, focus.z + dims![1] / 2) : 0;
    return <>
        <color attach="background" args={['#c2dee2']} /><fog attach="fog" args={['#c2dee2', 95, 180]} />
        <ambientLight intensity={.8} /><hemisphereLight args={['#f4fbff', '#80947c', .9]} />
        <directionalLight key={quality} position={[25, 45, 20]} intensity={2.2} castShadow={quality !== 'light'} shadow-mapSize={[GRAPHICS[quality].shadow || 512, GRAPHICS[quality].shadow || 512]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-camera-far={120} shadow-bias={-.001} />
        <group ref={ground}>{Array.from({ length: 16 }, (_, tile) => <TerrainTile key={tile} tile={tile} region={r} dirty={props.dirty} onDown={props.onDown} onMove={props.onMove} />)}</group>
        <mesh rotation-x={-Math.PI / 2} position={[0, r.seaLevel, 0]} raycast={noRaycast}><planeGeometry args={[64, 64]} /><meshStandardMaterial color="#5bb9d0" transparent opacity={.72} roughness={.3} depthWrite={false} /></mesh>
        <mesh position={[0, -3.6, 0]} raycast={noRaycast}><boxGeometry args={[64, 1, 64]} /><meshStandardMaterial color="#7d8877" /></mesh>
        {Object.entries(scenery).filter(([, items]) => items.length).map(([shape, items]) => <Batch key={shape} shape={shape as Shape} items={items} />)}
        {Object.entries(instances).map(([shape, items]) => <Batch key={shape} shape={shape as Shape} items={items} onSelect={tool === 'select' ? props.onSelect : undefined} />)}
        <Pedestrians region={r} version={version} animate={traffic} />
        {draft && <BuildingPreview region={r} draft={draft} ground={ground} onChange={props.onDraftChange} onDragState={props.onDragState} />}
        <Vehicles region={r} version={version} animate={traffic} />
        {focus && dims && <group position={[focus.x + dims[0] / 2 - 32, y + .13, focus.z + dims[1] / 2 - 32]}>
            <mesh raycast={noRaycast} position={[0, .15, 0]}><boxGeometry args={[dims[0], .35, dims[1]]} /><meshBasicMaterial color={valid?.ok === false ? '#ef6a70' : '#e7ffab'} transparent opacity={.45} depthTest={false} /></mesh>
        </group>}
        {draft && (() => { const [x, z] = port({ ...draft, id: '', foundation: 0 }); return <mesh position={[x + .5 - 32, heightAt(r, x + .5, z + .5) + .15, z + .5 - 32]} rotation-x={-Math.PI / 2} raycast={noRaycast}><ringGeometry args={[.15, .4, 16]} /><meshBasicMaterial color="#fff199" depthTest={false} /></mesh>; })()}
        {cursor && !['view', 'select', 'build'].includes(tool) && <mesh position={[cursor[0] - 32, Math.max(r.seaLevel, heightAt(r, ...cursor)) + .12, cursor[1] - 32]} rotation-x={-Math.PI / 2} raycast={noRaycast}><ringGeometry args={[Math.max(.05, radius - .08), radius, 48]} /><meshBasicMaterial color="#fff3bd" transparent opacity={.8} depthTest={false} /></mesh>}
    </>;
}
