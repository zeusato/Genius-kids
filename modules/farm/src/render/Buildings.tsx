import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { dimensions } from '../core/engine';
import { heightAt } from '../core/world';
import type { FarmState } from '../core/types';
import { assetModel } from './models';
/** Batch static architecture by material; keep face-to-owner picking and articulated parts. */
export function Buildings({ state: s, hide, reduced }: {
    state: FarmState;
    hide?: string;
    reduced: boolean;
}) {
    const signature = s.entities.filter(e => !e.stored && e.id !== hide).map(e => `${e.id}:${e.asset}:${e.level}:${e.x}:${e.z}:${e.rotation}`).join('|');
    const kit = useMemo(() => {
        const materials = new Map<T.Material, {
            geometries: T.BufferGeometry[];
            owners: {
                end: number;
                id: string;
            }[];
            faces: number;
        }>(), moving: {
            id: string;
            group: T.Group;
        }[] = [];
        for (const e of s.entities) {
            if (e.stored || e.id === hide || e.asset === 'path')
                continue;
            const model = assetModel(e.asset, e.level), [w, d] = dimensions(e.asset, e.rotation), pose = new T.Group();
            pose.position.set(e.x + w / 2, heightAt(s.world, e.x, e.z) + .025, e.z + d / 2);
            pose.rotation.y = e.rotation * Math.PI / 2;
            pose.add(model);
            pose.updateMatrixWorld(true);
            const animated = new T.Group();
            animated.position.copy(pose.position);
            animated.rotation.copy(pose.rotation);
            animated.userData.id = e.id;
            const visit = (node: T.Object3D) => {
                if (node.userData.dynamic) {
                    const clone = node.clone(true);
                    clone.applyMatrix4(node.parent === model ? new T.Matrix4() : model.matrixWorld.clone().invert().multiply(node.parent!.matrixWorld));
                    animated.add(clone);
                    return;
                }
                if (node instanceof T.Mesh) {
                    const material = node.material as T.Material, g = node.geometry.clone().applyMatrix4(node.matrixWorld), flat = g.index ? g.toNonIndexed() : g;
                    if (flat !== g)
                        g.dispose();
                    const bucket = materials.get(material) ?? { geometries: [], owners: [], faces: 0 };
                    bucket.geometries.push(flat);
                    bucket.faces += flat.getAttribute('position').count / 3;
                    bucket.owners.push({ end: bucket.faces, id: e.id });
                    materials.set(material, bucket);
                }
                node.children.forEach(visit);
            };
            visit(model);
            if (animated.children.length)
                moving.push({ id: e.id, group: animated });
        }
        const batches = [...materials].map(([material, b]) => { const geometry = mergeGeometries(b.geometries)!; b.geometries.forEach(g => g.dispose()); geometry.computeBoundingSphere(); return { material, geometry, owners: b.owners }; });
        return { batches, moving };
    }, [signature, s.world.seed, s.world.heights]);
    useEffect(() => () => kit.batches.forEach(b => b.geometry.dispose()), [kit]);
    useFrame(({ clock }, delta) => { if (reduced)
        return; for (const { id, group } of kit.moving) {
        const working = s.entities.some(e => e.id === id && e.job && !e.construction), sails = group.getObjectByName('sails'), head = group.getObjectByName('cow-head');
        if (sails && working)
            sails.rotation.z -= Math.min(delta, .06) * .45;
        if (head)
            head.rotation.x = (working ? .32 : 0) + Math.sin(clock.elapsedTime * (working ? 2 : .7)) * (working ? .17 : .07);
    } });
    return <>{kit.batches.map((b, i) => <mesh key={i} geometry={b.geometry} material={b.material} userData={{ faceOwners: b.owners }} castShadow receiveShadow dispose={null}/>)}{kit.moving.map(m => <primitive key={m.id} object={m.group} dispose={null}/>)}</>;
}
