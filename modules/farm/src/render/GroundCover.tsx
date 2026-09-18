import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as T from 'three';
import type { FarmState } from '../core/types';
import { heightAt, isWater, random, tileIndex } from '../core/world';
import { landcoverAt } from '../core/landcover';
import { dimensions } from '../core/engine';
import { CAMERA_OFFSET } from './Landscape';
import fern from '../assets/terrain/fern-v1.png';
import shrub from '../assets/terrain/shrub-v1.png';
import wildflowers from '../assets/terrain/wildflowers-v1.png';
import { foliageCoverage } from './cutoutMaterials';
const urls = [fern, shrub, wildflowers];
type Spot = { x: number; z: number; size: number; y: number };
const camera = new T.PerspectiveCamera(); camera.position.copy(CAMERA_OFFSET); camera.lookAt(0, 0, 0);
const rotation = camera.quaternion.clone(), up = new T.Vector3(0, 1, 0).applyQuaternion(rotation);
function CoverInstances({ spots, kind }: { spots: Spot[]; kind: number }) {
    const texture = useTexture(urls[kind]), mesh = useRef<T.InstancedMesh>(null);
    const gl = useThree(s => s.gl), multisampled = gl.getContext().getContextAttributes()?.antialias === true;
    const image = texture.image as HTMLImageElement;
    useLayoutEffect(() => {
        if (!mesh.current) return;
        texture.colorSpace = T.SRGBColorSpace;
        const dummy = new T.Object3D();
        spots.forEach((p, i) => {
            const height = p.size * image.height / image.width;
            dummy.position.set(p.x, p.y + .018, p.z); dummy.position.addScaledVector(up, height * .42);
            dummy.quaternion.copy(rotation); dummy.scale.set(p.size, height, 1); dummy.updateMatrix(); mesh.current!.setMatrixAt(i, dummy.matrix);
            mesh.current!.setColorAt(i, new T.Color('#ffffff').multiplyScalar(.84 + (i % 7) * .025));
        });
        mesh.current.instanceMatrix.needsUpdate = true; mesh.current.computeBoundingSphere();
    }, [spots, texture]);
    return <instancedMesh ref={mesh} args={[undefined, undefined, spots.length]} raycast={() => {}}><planeGeometry args={[1, 1]}/><meshBasicMaterial map={texture} alphaTest={.035} alphaToCoverage={multisampled} alphaHash={!multisampled} onBeforeCompile={foliageCoverage} side={T.DoubleSide} toneMapped={false}/></instancedMesh>;
}
/** Non-blocking understory, hidden around buildings/plots and removed with a cleared resource. */
export function GroundCover({ state: s }: { state: FarmState }) {
    const layout = s.entities.filter(e => !e.stored).map(e => `${e.asset}:${e.x}:${e.z}:${e.rotation}`).join('|') + s.plots.map(p => `${p.x}:${p.z}`).join('|');
    const groups = useMemo(() => {
        const out: Spot[][] = [[], [], []], rng = random(s.world.seed ^ 9571), excluded = new Set<number>();
        for (const e of s.entities) if (!e.stored) { const [w, d] = dimensions(e.asset, e.rotation); for (let z = e.z - 1; z <= e.z + d; z++) for (let x = e.x - 1; x <= e.x + w; x++) excluded.add(tileIndex(x, z)); }
        for (const p of s.plots) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) excluded.add(tileIndex(p.x + dx, p.z + dz));
        for (const o of s.world.obstacles) if (o.cleared) excluded.add(tileIndex(o.x, o.z));
        for (let z = 1; z < 95; z++) for (let x = 1; x < 95; x++) {
            const n = rng(), cover = landcoverAt(s.world, x, z);
            if (excluded.has(tileIndex(x, z)) || isWater(s.world, x, z) || cover === 'trail' || cover === 'upland') continue;
            const chance = cover === 'woodland' ? .29 : cover === 'marsh' ? .3 : cover === 'yard' ? .045 : .12;
            if (n > chance) continue;
            const h = heightAt(s.world, x, z);
            if (heightAt(s.world, x + 1, z) !== h || heightAt(s.world, x, z + 1) !== h) continue;
            const kind = cover === 'marsh' ? 0 : cover === 'woodland' ? n < .13 ? 0 : 1 : n < .06 ? 2 : 1;
            out[kind].push({ x: x + .2 + rng() * .6, z: z + .2 + rng() * .6, size: (kind === 2 ? .7 : 1) * (.8 + rng() * .7), y: h });
        }
        return out;
    }, [layout, s.world.heights, s.world.water, s.world.obstacles, s.world.seed]);
    return <>{groups.map((spots, kind) => <Suspense key={kind} fallback={null}><CoverInstances spots={spots} kind={kind}/></Suspense>)}</>;
}
