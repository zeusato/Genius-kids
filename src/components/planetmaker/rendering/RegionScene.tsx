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
function RoadTraffic({ r, version }: { r: Region; version: number }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const paths = useMemo(() => {
        const sim = simulate(r), result: number[][] = [];
        for (let g = 0; g < sim.networks.length && result.length < 8; g++) {
            if (!sim.networks[g].homes) continue;
            const start = sim.labels.findIndex(l => l === g); if (start < 0) continue;
            let current = start, previous = -1; const path = [start];
            for (let n = 0; n < 80; n++) {
                const x = current % SIZE, z = Math.floor(current / SIZE), next = [[x - 1, z], [x, z + 1], [x + 1, z], [x, z - 1]].filter(([nx, nz]) => nx >= 0 && nz >= 0 && nx < SIZE && nz < SIZE).map(([nx, nz]) => nz * SIZE + nx).filter(i => sim.labels[i] === g);
                if (!next.length) break;
                const choices = next.filter(i => i !== previous); previous = current; current = (choices.length ? choices : next)[n % (choices.length || next.length)]; path.push(current);
            }
            if (path.length > 1) result.push([...path, ...path.slice(0, -1).reverse()]);
        }
        return result;
    }, [r, version]);
    const obj = useMemo(() => new THREE.Object3D(), []);
    useFrame(({ clock }) => {
        if (!ref.current) return; ref.current.count = paths.length;
        paths.forEach((path, i) => {
            const progress = (clock.elapsedTime * 1.2 + i * 7) % (path.length - 1), j = Math.floor(progress), f = progress - j, a = path[j], b = path[j + 1];
            const x = (a % SIZE) * (1 - f) + (b % SIZE) * f + .5, z = Math.floor(a / SIZE) * (1 - f) + Math.floor(b / SIZE) * f + .5;
            obj.position.set(x - 32, heightAt(r, x, z) + .23, z - 32); obj.rotation.y = Math.atan2(b % SIZE - a % SIZE, Math.floor(b / SIZE) - Math.floor(a / SIZE)); obj.updateMatrix(); ref.current!.setMatrixAt(i, obj.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true;
    });
    return <instancedMesh ref={ref} args={[undefined, undefined, 8]} frustumCulled={false} raycast={noRaycast}><boxGeometry args={[.32, .27, .58]} /><meshStandardMaterial color="#ffb661" /></instancedMesh>;
}
export function RegionScene(props: RegionSceneProps) {
    const { region: r, version, tool, draft, selected, cursor, radius, traffic, lowQuality } = props;
    const instances = useMemo(() => townInstances(r), [r, version]);
    const ground = useRef<THREE.Group>(null);
    const trees = useMemo(() => r.trees.filter(t => heightAt(r, t.x, t.z) > r.seaLevel).map(t => ({ position: [t.x - 32, heightAt(r, t.x, t.z) + t.scale * .9, t.z - 32] as [number, number, number], scale: [t.scale, t.scale * 1.8, t.scale] as [number, number, number], color: r.preset === 'ice' ? '#bfd8d5' : '#448766' })), [r, version]);
    const trunks = useMemo(() => trees.map(t => ({ ...t, position: [t.position[0], t.position[1] - t.scale[1] * .3, t.position[2]] as [number, number, number], scale: [.15, t.scale[1] * .55, .15] as [number, number, number], color: '#896447' })), [trees]);
    const roads = useMemo(() => Array.from(r.roads).flatMap((v, i) => v ? [{ position: [i % SIZE + .5 - 32, heightAt(r, i % SIZE + .5, Math.floor(i / SIZE) + .5) + .035, Math.floor(i / SIZE) + .5 - 32] as [number, number, number], scale: [.98, .06, .98] as [number, number, number], color: '#9a9e9d' }] : []), [r, version]);
    const focus = draft || r.buildings.find(b => b.id === selected), dims = focus ? footprint(focus.type, focus.yaw) : null;
    const valid = draft ? placement(r, draft.type, draft.x, draft.z, draft.yaw, draft.movingId) : null;
    const y = focus ? heightAt(r, focus.x + dims![0] / 2, focus.z + dims![1] / 2) : 0;
    return <>
        <color attach="background" args={['#c2dee2']} /><fog attach="fog" args={['#c2dee2', 95, 180]} />
        <ambientLight intensity={.8} /><hemisphereLight args={['#f4fbff', '#80947c', .9]} />
        <directionalLight position={[25, 45, 20]} intensity={2.2} castShadow={!lowQuality} shadow-mapSize={[1024, 1024]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} shadow-camera-far={120} shadow-bias={-.001} />
        <group ref={ground}>{Array.from({ length: 16 }, (_, tile) => <TerrainTile key={tile} tile={tile} region={r} dirty={props.dirty} onDown={props.onDown} onMove={props.onMove} />)}</group>
        <mesh rotation-x={-Math.PI / 2} position={[0, r.seaLevel, 0]} raycast={noRaycast}><planeGeometry args={[64, 64]} /><meshStandardMaterial color="#5bb9d0" transparent opacity={.72} roughness={.3} depthWrite={false} /></mesh>
        <mesh position={[0, -3.6, 0]} raycast={noRaycast}><boxGeometry args={[64, 1, 64]} /><meshStandardMaterial color="#7d8877" /></mesh>
        <Batch shape="box" items={roads} /><Batch shape="box" items={trunks} /><Batch shape="cone" items={trees} />
        {Object.entries(instances).map(([shape, items]) => <Batch key={shape} shape={shape as Shape} items={items} onSelect={tool === 'select' ? props.onSelect : undefined} />)}
        <Pedestrians region={r} version={version} animate={traffic} />
        {draft && <BuildingPreview region={r} draft={draft} ground={ground} onChange={props.onDraftChange} onDragState={props.onDragState} />}
        {traffic && <RoadTraffic r={r} version={version} />}
        {focus && dims && <group position={[focus.x + dims[0] / 2 - 32, y + .13, focus.z + dims[1] / 2 - 32]}>
            <mesh raycast={noRaycast} position={[0, .15, 0]}><boxGeometry args={[dims[0], .35, dims[1]]} /><meshBasicMaterial color={valid?.ok === false ? '#ef6a70' : '#e7ffab'} transparent opacity={.45} depthTest={false} /></mesh>
        </group>}
        {draft && (() => { const [x, z] = port({ ...draft, id: '', foundation: 0 }); return <mesh position={[x + .5 - 32, heightAt(r, x + .5, z + .5) + .15, z + .5 - 32]} rotation-x={-Math.PI / 2} raycast={noRaycast}><ringGeometry args={[.15, .4, 16]} /><meshBasicMaterial color="#fff199" depthTest={false} /></mesh>; })()}
        {cursor && !['view', 'select', 'build'].includes(tool) && <mesh position={[cursor[0] - 32, Math.max(r.seaLevel, heightAt(r, ...cursor)) + .12, cursor[1] - 32]} rotation-x={-Math.PI / 2} raycast={noRaycast}><ringGeometry args={[Math.max(.05, radius - .08), radius, 48]} /><meshBasicMaterial color="#fff3bd" transparent opacity={.8} depthTest={false} /></mesh>}
    </>;
}
