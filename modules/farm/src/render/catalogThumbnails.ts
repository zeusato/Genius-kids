import * as T from 'three';
import { assetModel, cropModel } from './models';
import { roadGeometry } from './roadGeometry';
import type { AssetId, CropId } from '../core/catalog';
import soilUrl from '../assets/terrain/tilled-soil-v1.png';
import roadUrl from '../assets/terrain/road-stone-v1.png';

export type ThumbnailSubject = { asset: AssetId; level?: number } | { crop: CropId };
export const thumbnailKey = (s: ThumbnailSubject) => 'crop' in s ? `crop:${s.crop}` : `asset:${s.asset}:${s.level ?? 1}`;
const images = new Map<string, Promise<string>>(), textures = new Map<string, Promise<T.Texture>>();
let renderer: T.WebGLRenderer | null = null, releaseTimer: ReturnType<typeof setTimeout> | undefined;
let queue = Promise.resolve();
function texture(url: string) {
    if (!textures.has(url)) textures.set(url, new T.TextureLoader().loadAsync(url).then(t => { t.colorSpace = T.SRGBColorSpace; return t; }));
    return textures.get(url)!;
}

/** One transient renderer for the entire catalog, cached PNGs thereafter — never a canvas per card. */
export function catalogThumbnail(subject: ThumbnailSubject): Promise<string> {
    const key = thumbnailKey(subject), existing = images.get(key);
    if (existing) return existing;
    const result = queue.then(async () => {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        clearTimeout(releaseTimer);
        const scene = new T.Scene(), model = 'crop' in subject ? cropModel(subject.crop, 4) : assetModel(subject.asset, subject.level ?? 1);
        const disposable: (T.BufferGeometry | T.Material)[] = [];
        if ('crop' in subject || subject.asset === 'path') {
            const crop = 'crop' in subject, map = await texture(crop ? soilUrl : roadUrl);
            const geometry = crop ? new T.PlaneGeometry(1.04, 1.04).rotateX(-Math.PI / 2) : roadGeometry(-.5, -.5, 0, 0);
            const material = new T.MeshStandardMaterial({ map, alphaTest: .2, roughness: 1, side: T.DoubleSide });
            if (!crop) { model.clear(); map.wrapS = map.wrapT = T.MirroredRepeatWrapping; map.needsUpdate = true; }
            const surface = new T.Mesh(geometry, material); surface.position.y = crop ? -.015 : 0; model.add(surface); disposable.push(geometry, material);
        }
        scene.add(model);
        scene.add(new T.HemisphereLight('#fff2dd', '#809276', 1.7));
        const light = new T.DirectionalLight('#fff3df', 2); light.position.set(-6, 12, 8); scene.add(light);
        model.updateMatrixWorld(true);
        const bounds = new T.Box3().setFromObject(model), center = bounds.getCenter(new T.Vector3());
        const camera = new T.OrthographicCamera(-2, 2, 1.5, -1.5, .1, 200);
        camera.position.copy(center).add(new T.Vector3(24, 27, 30)); camera.lookAt(center); camera.updateMatrixWorld(true);
        const projected = new T.Box3();
        for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) projected.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
        const width = projected.max.x - projected.min.x, height = projected.max.y - projected.min.y;
        const halfHeight = Math.max(height, width * .75) * .59;
        camera.left = -halfHeight * 4 / 3; camera.right = halfHeight * 4 / 3; camera.top = halfHeight; camera.bottom = -halfHeight; camera.updateProjectionMatrix();
        try {
            if (!renderer) { renderer = new T.WebGLRenderer({ alpha: true, antialias: true }); renderer.setSize(320, 240, false); renderer.setPixelRatio(1); renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; }
            renderer.render(scene, camera);
            return renderer.domElement.toDataURL('image/png');
        } finally {
            scene.clear(); disposable.forEach(d => d.dispose());
            releaseTimer = setTimeout(() => { renderer?.dispose(); renderer?.forceContextLoss(); renderer = null; }, 500);
        }
    });
    images.set(key, result); queue = result.then(() => {}, () => { images.delete(key); });
    return result;
}
