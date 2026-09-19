import { useLayoutEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as T from 'three';
import { heightAt, type Obstacle, type World } from '../core/world';
import { spriteAlpha, spriteRotation } from './SpriteBuilding';
import { foliageCoverage, contactShadowVertex, contactShadowFragment } from './cutoutMaterials';
const url = new URL('../assets/terrain/optimized/berry-v1.webp', import.meta.url).href;

/** Generated cutout plus contact-shadow, shared by every berry bush. */
export function BerryBushes({ objects, world, reveal = false }: { objects: Obstacle[]; world: World; reveal?: boolean }) {
    const texture = useTexture(url), ref = useRef<T.InstancedMesh>(null), shadows = useRef<T.InstancedMesh>(null);
    const alpha = useMemo(() => spriteAlpha(texture), [texture]);
    const { gl } = useThree(), msaa = gl.getContext().getContextAttributes()?.antialias === true;
    useLayoutEffect(() => {
        if (!ref.current || !shadows.current) return;
        const pose = new T.Object3D(), up = new T.Vector3(0, 1, 0).applyQuaternion(spriteRotation), right = new T.Vector3(1, 0, 0).applyQuaternion(spriteRotation);
        objects.forEach((o, i) => {
            const source = texture.image as HTMLImageElement;
            const width = 1.45, height = width * source.height / source.width;
            pose.position.set(o.x + .5, heightAt(world, o.x, o.z) + .025, o.z + .5);
            pose.position.addScaledVector(up, height * (.5 - alpha.bottom)).addScaledVector(right, width * (.5 - alpha.rootX));
            pose.quaternion.copy(spriteRotation); pose.scale.set(width, height, 1); pose.updateMatrix(); ref.current!.setMatrixAt(i, pose.matrix);
            pose.position.set(o.x + .5, heightAt(world, o.x, o.z) + .013, o.z + .5); pose.rotation.set(-Math.PI / 2, 0, 0); pose.scale.set(1.3, .9, 1); pose.updateMatrix(); shadows.current!.setMatrixAt(i, pose.matrix);
        });
        for (const mesh of [ref.current, shadows.current]) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }
    }, [objects, world.heights, texture, alpha]);
    return <>
        <instancedMesh ref={shadows} args={[undefined, undefined, objects.length]} raycast={() => {}}><planeGeometry args={[1, 1]}/><shaderMaterial vertexShader={contactShadowVertex} fragmentShader={contactShadowFragment} transparent depthWrite={false}/></instancedMesh>
        <instancedMesh ref={ref} args={[undefined, undefined, objects.length]} userData={{ natural: true, ids: objects.map(o => o.id), opaqueAt: alpha.hit }}><planeGeometry args={[1, 1]}/><meshBasicMaterial map={texture} alphaTest={.035} alphaToCoverage={msaa && !reveal} alphaHash={!msaa && !reveal} onBeforeCompile={foliageCoverage} transparent={reveal} opacity={reveal ? .4 : 1} depthWrite={!reveal} toneMapped={false} side={T.DoubleSide}/></instancedMesh>
    </>;
}
