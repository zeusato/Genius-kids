import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as T from 'three';
import type { AssetId } from '../core/catalog';
import type { Rotation } from '../core/types';
import { dimensions } from '../core/engine';
import { buildingAssetUrl } from './buildingAssets';
import { foliageCoverage, contactShadowVertex, contactShadowFragment } from './cutoutMaterials';
import { buildingSpritePose, spriteRotation } from './buildingSpritePose';
export { spriteRotation } from './buildingSpritePose';

const alphaCache = new WeakMap<HTMLImageElement, ReturnType<typeof readAlpha>>();
function readAlpha(source: HTMLImageElement) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d')!; ctx.drawImage(source, 0, 0, 128, 128);
    const data = ctx.getImageData(0, 0, 128, 128).data;
    let bottom = 0, minX = 127, maxX = 0, sum = 0, count = 0;
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (data[(y * 128 + x) * 4 + 3] > 80) { bottom = Math.max(bottom, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
    for (let y = Math.max(0, bottom - 2); y <= bottom; y++) for (let x = 0; x < 128; x++) if (data[(y * 128 + x) * 4 + 3] > 80) { sum += x + .5; count++; }
    return { bottom: 1 - (bottom + 1) / 128, rootX: count ? sum / count / 128 : .5, coverage: Math.max(.25, (maxX - minX + 1) / 128),
        hit: (uv: T.Vector2) => data[(Math.min(127, Math.max(0, Math.floor((1 - uv.y) * 128))) * 128 + Math.min(127, Math.max(0, Math.floor(uv.x * 128)))) * 4 + 3] > 80 };
}
export function spriteAlpha(texture: T.Texture) {
    texture.colorSpace = T.SRGBColorSpace;
    const source = texture.image as HTMLImageElement;
    let alpha = alphaCache.get(source); if (!alpha) { alpha = readAlpha(source); alphaCache.set(source, alpha); }
    return alpha;
}
/** Two triangles per building; only the visible tier/view is requested. */
export function SpriteBuilding({ asset, level, rotation = 0, id, reveal = false }: { asset: AssetId; level: number; rotation?: Rotation; id?: string; reveal?: boolean }) {
    const texture = useTexture(buildingAssetUrl(asset, level, rotation));
    const alpha = useMemo(() => spriteAlpha(texture), [texture]);
    const { gl } = useThree(), msaa = gl.getContext().getContextAttributes()?.antialias === true;
    const [w, d] = dimensions(asset, rotation);
    const source = texture.image as HTMLImageElement;
    const { width, height, position } = buildingSpritePose(w, d, source.height / source.width, alpha);
    return <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .006, 0]} scale={[w * 1.12, d * 1.12, 1]} raycast={() => {}}><planeGeometry args={[1, 1]}/><shaderMaterial vertexShader={contactShadowVertex} fragmentShader={contactShadowFragment} transparent depthWrite={false}/></mesh>
        <mesh position={position} quaternion={spriteRotation} scale={[width, height, 1]} userData={{ id, buildingSprite: true, opaqueAt: alpha.hit }}>
            <planeGeometry args={[1, 1]}/><meshBasicMaterial map={texture} alphaTest={.035} alphaToCoverage={msaa && !reveal} alphaHash={!msaa && !reveal} onBeforeCompile={foliageCoverage} transparent={reveal} opacity={reveal ? .38 : 1} depthWrite={!reveal} side={T.DoubleSide} toneMapped={false}/>
        </mesh>
    </>;
}
