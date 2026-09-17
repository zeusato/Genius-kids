import { useLayoutEffect, useMemo, useRef } from 'react';
import * as T from 'three';
import type { FarmState, Plot } from '../core/types';
import { growthStage } from '../core/engine';
import { heightAt, type World } from '../core/world';
import { cropModel } from './models';
function Batch({ plots, world, geometry, material, y, soil = false }: {
    plots: Plot[];
    world: World;
    geometry: T.BufferGeometry;
    material: T.Material;
    y: number;
    soil?: boolean;
}) {
    const ref = useRef<T.InstancedMesh>(null);
    useLayoutEffect(() => { const mesh = ref.current; if (!mesh)
        return; const matrix = new T.Matrix4(); plots.forEach((p, i) => { matrix.makeTranslation(p.x + .5, heightAt(world, p.x, p.z) + y, p.z + .5); mesh.setMatrixAt(i, matrix); if (soil)
        mesh.setColorAt(i, new T.Color(p.watered ? '#70513b' : '#8e6a47')); }); mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor)
        mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); }, [plots, world, y, soil]);
    return <instancedMesh ref={ref} args={[geometry, material, plots.length]} userData={{ ids: plots.map(p => p.id) }} castShadow={!soil} receiveShadow dispose={null}/>;
}
/** Share mesh submissions for the same crop/stage, including picking by instance. */
export function CropField({ state: s }: {
    state: FarmState;
}) {
    const signature = s.plots.map(p => `${p.id}:${p.x}:${p.z}:${p.crop}:${growthStage(p, s.clock)}:${p.watered}`).join('|');
    const groups = useMemo(() => { const map = new Map<string, Plot[]>(); for (const p of s.plots) {
        if (!p.crop)
            continue;
        const key = `${p.crop}:${growthStage(p, s.clock)}`;
        map.set(key, [...(map.get(key) ?? []), p]);
    } return [...map].map(([key, plots]) => ({ key, plots, model: cropModel(plots[0].crop!, growthStage(plots[0], s.clock)) })); }, [signature]);
    const soil = useMemo(() => ({ geometry: new T.BoxGeometry(.9, .1, .9), material: new T.MeshStandardMaterial({ color: 'white', roughness: 1 }) }), []);
    return <><Batch plots={s.plots} world={s.world} {...soil} y={.04} soil/>{groups.flatMap(({ key, plots, model }) => model.children.map((child, i) => { const mesh = child as T.Mesh; return <Batch key={`${key}:${i}`} plots={plots} world={s.world} geometry={mesh.geometry} material={mesh.material as T.Material} y={.13}/>; }))}</>;
}
