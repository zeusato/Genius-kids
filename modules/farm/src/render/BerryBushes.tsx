import { useLayoutEffect, useRef } from 'react';
import * as T from 'three';
import { heightAt, type Obstacle, type World } from '../core/world';

/** Two instanced draws for all bushes; berries are visible geometry, not a new
 * full-size texture or an animation loop per resource. */
export function BerryBushes({ objects, world }: { objects: Obstacle[]; world: World }) {
    const leaves = useRef<T.InstancedMesh>(null), fruit = useRef<T.InstancedMesh>(null);
    useLayoutEffect(() => {
        if (!leaves.current || !fruit.current) return;
        const pose = new T.Object3D();
        objects.forEach((o, i) => {
            const y = heightAt(world, o.x, o.z);
            for (let j = 0; j < 3; j++) {
                pose.position.set(o.x + .5 + (j - 1) * .26, y + .28 + (j === 1 ? .13 : 0), o.z + .5 + (j % 2) * .13);
                pose.scale.set(.46, .4, .42); pose.updateMatrix(); leaves.current!.setMatrixAt(i * 3 + j, pose.matrix);
            }
            for (let j = 0; j < 7; j++) {
                const a = j * 2.4;
                pose.position.set(o.x + .5 + Math.cos(a) * .42, y + .38 + (j % 3) * .095, o.z + .5 + Math.sin(a) * .32);
                pose.scale.setScalar(.095); pose.updateMatrix(); fruit.current!.setMatrixAt(i * 7 + j, pose.matrix);
            }
        });
        for (const mesh of [leaves.current, fruit.current]) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }
    }, [objects, world.heights]);
    return <group>
        <instancedMesh ref={leaves} args={[undefined, undefined, objects.length * 3]} userData={{ ids: objects.flatMap(o => [o.id, o.id, o.id]) }}><icosahedronGeometry args={[1, 1]}/><meshStandardMaterial color="#557746" roughness={1}/></instancedMesh>
        <instancedMesh ref={fruit} args={[undefined, undefined, objects.length * 7]} raycast={() => {}}><icosahedronGeometry args={[1, 1]}/><meshStandardMaterial color="#b53e65" roughness={.65}/></instancedMesh>
    </group>;
}
