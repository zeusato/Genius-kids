import { useEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { FarmState } from '../core/types';
import { roadConnections } from '../core/roads';
import { heightAt } from '../core/world';
import type { Placement } from './FarmScene';
import { roadGeometry } from './roadGeometry';
import { roadAssetUrl } from './roadAssets';
import { homeLevel } from '../core/progression';

function useRoadTexture(level: number) {
    const texture = useTexture(roadAssetUrl(level));
    useMemo(() => { texture.colorSpace = T.SRGBColorSpace; texture.wrapS = texture.wrapT = T.MirroredRepeatWrapping; texture.anisotropy = 4; texture.needsUpdate = true; }, [texture]);
    return texture;
}
export function RoadSample({ mask = 0, level = 1 }: { mask?: number; level?: number }) {
    const texture = useRoadTexture(level), geometry = useMemo(() => roadGeometry(-.5, -.5, 0, mask), [mask]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    return <mesh geometry={geometry} receiveShadow><meshStandardMaterial map={texture} roughness={1}/></mesh>;
}
export function Roads({ state: s, placement }: { state: FarmState; placement: Placement | null }) {
    const texture = useRoadTexture(homeLevel(s));
    const signature = s.entities.filter(e => e.asset === 'path' && !e.stored && e.id !== placement?.moveId).map(e => `${e.id}:${e.x}:${e.z}`).join('|');
    const kit = useMemo(() => {
        const entries = s.entities.filter(e => e.asset === 'path' && e.id !== placement?.moveId);
        if (placement?.asset === 'path') entries.push({ id: 'road-preview', asset: 'path', x: placement.x, z: placement.z, rotation: 0, level: 1, output: {}, queue: [] });
        const roads = roadConnections(entries, s.world), owners: { end: number; id: string }[] = [];
        let faces = 0;
        const geometries = roads.map(e => {
            const indexed = roadGeometry(e.x, e.z, heightAt(s.world, e.x, e.z), e.mask), g = indexed.toNonIndexed(); indexed.dispose();
            faces += g.getAttribute('position').count / 3; owners.push({ end: faces, id: e.id === 'road-preview' ? placement?.moveId ?? '' : e.id });
            return g;
        });
        const geometry = geometries.length ? mergeGeometries(geometries)! : null;
        geometries.forEach(g => g.dispose()); geometry?.computeBoundingSphere();
        return { geometry, owners };
    }, [signature, s.world.heights, placement?.asset, placement?.moveId, placement?.x, placement?.z]);
    useEffect(() => () => kit.geometry?.dispose(), [kit]);
    return kit.geometry ? <mesh geometry={kit.geometry} userData={{ faceOwners: kit.owners }} receiveShadow><meshStandardMaterial map={texture} roughness={1} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1}/></mesh> : null;
}
