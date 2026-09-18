import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as T from 'three';
import { heightAt, isWater, random, type World, type Obstacle } from '../core/world';
import { createLandscapeGeometry } from './landscapeGeometry';
import { waterVertex, waterFragment } from './waterMaterial';
import { NATURAL_VARIANTS, obstacleVariant, type NaturalVariant } from '../core/scenery';
import { naturalAssetUrl } from './naturalAssets';
import { foliageCoverage, contactShadowVertex, contactShadowFragment } from './cutoutMaterials';
import { sceneryVisible } from './sceneryVisibility';
import { performanceMetrics } from './performanceMetrics';
import { resourceTier, RESOURCE_TIERS } from '../core/harvesting';
import { BerryBushes } from './BerryBushes';
import type { FamilyWork } from './Family';

// Orthographic scale comes from zoom; a distant camera keeps the foreground in front of its near plane at overview zoom.
export const CAMERA_OFFSET = new T.Vector3(240, 270, 300);
export const CAMERA_POLAR = Math.acos(CAMERA_OFFSET.y / CAMERA_OFFSET.length());
export const CAMERA_AZIMUTH = Math.atan2(CAMERA_OFFSET.x, CAMERA_OFFSET.z);
const fixedCamera = new T.PerspectiveCamera();
fixedCamera.position.copy(CAMERA_OFFSET); fixedCamera.lookAt(0, 0, 0);
const billboardRotation = fixedCamera.quaternion.clone();
const billboardUp = new T.Vector3(0, 1, 0).applyQuaternion(billboardRotation);
const billboardRight = new T.Vector3(1, 0, 0).applyQuaternion(billboardRotation);
const meadowShader: T.MeshStandardMaterial['onBeforeCompile'] = shader => {
    shader.uniforms.shoreSand = { value: new T.Color('#c8b68b') };
    shader.vertexShader = 'attribute float shoreDistance; varying float coastDistance; varying vec2 meadowXZ;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nmeadowXZ=position.xz; coastDistance=shoreDistance;');
    shader.fragmentShader = `varying vec2 meadowXZ; varying float coastDistance; uniform vec3 shoreSand;
        float meadowHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float meadowNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(meadowHash(i),meadowHash(i+vec2(1.,0.)),f.x),mix(meadowHash(i+vec2(0.,1.)),meadowHash(i+vec2(1.,1.)),f.x),f.y);}
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        float shoreNoise=meadowNoise(meadowXZ*1.7);
        float beach=1.-smoothstep(.05,1.2+shoreNoise*.35,coastDistance);
        diffuseColor.rgb=mix(diffuseColor.rgb,shoreSand,beach*.86);
        diffuseColor.rgb *= .9 + .1*meadowNoise(meadowXZ*.38) + .07*meadowNoise(meadowXZ*4.);
    `);
};

export function Landscape({ world, reduced }: { world: World; reduced: boolean }) {
    const meshes = useMemo(() => {
        const started = import.meta.env.DEV ? performance.now() : 0;
        const result = createLandscapeGeometry(world);
        if (import.meta.env.DEV) {
            performanceMetrics.landscapeBuilds++;
            performanceMetrics.landscapeBuildMs = performance.now() - started;
        }
        return result;
    }, [world.heights, world.water, world.seed, world.version, world.bridges[0]?.x]);
    useEffect(() => () => { meshes.land.dispose(); meshes.water.dispose(); meshes.banks.dispose(); }, [meshes]);
    const water = useRef<T.ShaderMaterial>(null);
    const uniforms = useMemo(() => ({ time: { value: 0 }, deepTint: { value: new T.Color('#59a8a3') }, shallowTint: { value: new T.Color('#9bc3af') }, sandTint: { value: new T.Color('#c7bb94') }, foamTint: { value: new T.Color('#e4ead2') } }), []);
    useFrame(({ clock }) => { if (water.current) water.current.uniforms.time.value = reduced ? 0 : clock.elapsedTime; });
    return <>
        <mesh geometry={meshes.land} receiveShadow userData={{ terrain: true }}><meshStandardMaterial vertexColors roughness={1} side={T.DoubleSide} onBeforeCompile={meadowShader}/></mesh>
        <mesh geometry={meshes.banks}><meshStandardMaterial vertexColors roughness={1} side={T.DoubleSide}/></mesh>
        <mesh geometry={meshes.water} userData={{ terrain: true }}>
            <shaderMaterial ref={water} vertexColors uniforms={uniforms} side={T.DoubleSide}
                vertexShader={waterVertex} fragmentShader={waterFragment}/>
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[48, -.65, 48]}><planeGeometry args={[1000, 1000]}/><meshBasicMaterial color="#59a8a3" fog={false}/></mesh>
        <ShoreLife world={world}/>
    </>;
}

/** Small non-blocking reeds along the water, grouped into one geometry. */
function ShoreLife({ world }: { world: World }) {
    const geometry = useMemo(() => {
        const positions: number[] = [], colors: number[] = [], rng = random(world.seed ^ 839);
        for (let z = 1; z < 95; z++) for (let x = 1; x < 95; x++) {
            if (isWater(world, x, z) || x >= 22 && x <= 30 && z >= 34 && z <= 43 || world.bridges.some(b => Math.abs(z - b.z) < 3)) continue;
            const waterEdge = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dz]) => isWater(world, x + dx, z + dz));
            if (!waterEdge || rng() > .42) continue;
            const baseX = x + .5 + waterEdge[0] * .3, baseZ = z + .5 + waterEdge[1] * .3;
            for (let k = 0; k < 5; k++) {
                const px = baseX + (rng() - .5) * .4, pz = baseZ + (rng() - .5) * .4, h = .25 + rng() * .55, y = heightAt(world, x, z) + .025;
                positions.push(px - .025, y, pz, px + .025, y, pz, px + .12, y + h, pz + .035);
                const c = new T.Color(k % 2 ? '#749251' : '#a0b562');
                for (let v = 0; v < 3; v++) colors.push(c.r, c.g, c.b);
            }
        }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); g.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); g.computeVertexNormals(); return g;
    }, [world.seed, world.heights, world.water, world.bridges]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    return <mesh geometry={geometry}><meshBasicMaterial vertexColors side={T.DoubleSide}/></mesh>;
}

export function LandscapeObjects({ world, reveal, ghosts = [] }: { world: World; reveal: boolean; ghosts?: FamilyWork[] }) {
    const groups = useMemo(() => {
        const result = new Map<NaturalVariant, Obstacle[]>();
        for (const o of world.obstacles) if ((!o.cleared || ghosts.some(g => g.obstacle.id === o.id && g.obstacle.generation === o.generation)) && sceneryVisible(world.owned, o.x + .5, o.z + .5)) {
            const variant = obstacleVariant(world, o), group = result.get(variant) ?? [];
            group.push(o); result.set(variant, group);
        }
        return [...result];
    }, [world.obstacles, world.heights, world.water, world.seed, world.owned, ghosts]);
    return <>{groups.map(([variant, objects]) => variant === 'berry' ? <BerryBushes key={variant} objects={objects} world={world}/> : <Suspense key={variant} fallback={null}><Cutouts objects={objects} world={world} variant={variant} reveal={reveal && NATURAL_VARIANTS[variant].tree}/></Suspense>)}</>;
}

function Cutouts({ objects, world, variant, reveal }: { objects: Obstacle[]; world: World; variant: NaturalVariant; reveal: boolean }) {
    const spec = NATURAL_VARIANTS[variant], tree = spec.tree;
    const texture = useTexture(naturalAssetUrl(variant) ?? naturalAssetUrl(tree ? 'oak' : 'stone'));
    const ref = useRef<T.InstancedMesh>(null), shadows = useRef<T.InstancedMesh>(null);
    const { camera, gl } = useThree();
    const multisampled = gl.getContext().getContextAttributes()?.antialias === true;
    const source = texture.image as HTMLImageElement;
    const alpha = useMemo(() => {
        texture.colorSpace = T.SRGBColorSpace;
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
        const ctx = canvas.getContext('2d')!; ctx.drawImage(source, 0, 0, 128, 128);
        const data = ctx.getImageData(0, 0, 128, 128).data;
        let lastRow = 0, sumX = 0, count = 0;
        for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (data[(y * 128 + x) * 4 + 3] > 80) lastRow = Math.max(lastRow, y);
        for (let y = Math.max(0, lastRow - 5); y <= lastRow; y++) for (let x = 0; x < 128; x++) if (data[(y * 128 + x) * 4 + 3] > 80) { sumX += x + .5; count++; }
        return { bottom: 1 - (lastRow + 1) / 128, rootX: count ? sumX / count / 128 : .5,
            hit: (uv: T.Vector2) => data[(Math.min(127, Math.max(0, Math.floor((1 - uv.y) * 128))) * 128 + Math.min(127, Math.max(0, Math.floor(uv.x * 128)))) * 4 + 3] > 80 };
    }, [texture]);
    useLayoutEffect(() => {
        if (!ref.current || !shadows.current) return;
        const dummy = new T.Object3D(), up = billboardUp;
        objects.forEach((o, i) => {
            const n = ((o.x * 31 + o.z * 17) % 13) / 13, width = spec.width * RESOURCE_TIERS[resourceTier(world, o)].scale * (tree ? 1.15 : 1.25) * (.85 + n * .3);
            const height = width * (source.height / source.width);
            dummy.position.set(o.x + .5, heightAt(world, o.x, o.z) + .025, o.z + .5);
            // Padding is part of the source image; place the visible root at the world anchor.
            dummy.position.addScaledVector(up, height * (.5 - alpha.bottom));
            dummy.position.addScaledVector(billboardRight, width * (.5 - alpha.rootX));
            dummy.quaternion.copy(billboardRotation); dummy.scale.set(width, height, 1); dummy.updateMatrix();
            ref.current!.setMatrixAt(i, dummy.matrix);
            ref.current!.setColorAt(i, new T.Color('#ffffff').multiplyScalar(.94 + n * .06));
            dummy.position.set(o.x + .5, heightAt(world, o.x, o.z) + .013, o.z + .5);
            dummy.rotation.set(-Math.PI / 2, 0, 0); dummy.scale.set(width * .92, width * .65, 1); dummy.updateMatrix(); shadows.current!.setMatrixAt(i, dummy.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true; shadows.current.instanceMatrix.needsUpdate = true;
        ref.current.computeBoundingSphere(); shadows.current.computeBoundingSphere();
    }, [objects, world.heights, camera, texture, tree, spec.width]);
    return <>
        <instancedMesh ref={shadows} args={[undefined, undefined, objects.length]} raycast={() => {}}><planeGeometry args={[1, 1]}/><shaderMaterial vertexShader={contactShadowVertex} fragmentShader={contactShadowFragment} transparent depthWrite={false}/></instancedMesh>
        <instancedMesh ref={ref} args={[undefined, undefined, objects.length]} userData={{ natural: true, ids: objects.map(o => o.id), opaqueAt: alpha.hit }}>
            <planeGeometry args={[1, 1]}/><meshBasicMaterial map={texture} alphaTest={.035} alphaToCoverage={multisampled && !reveal} alphaHash={!multisampled && !reveal} onBeforeCompile={foliageCoverage} transparent={reveal} opacity={reveal ? .4 : 1} depthWrite={!reveal} side={T.DoubleSide} toneMapped={false}/>
        </instancedMesh>
    </>;
}
