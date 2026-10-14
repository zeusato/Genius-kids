import { acquireRenderer, releaseRenderer } from './auxRenderer';
// Hình thẻ mảnh trong khay (plan mục 8.4): MỘT renderer phụ dùng chung, vẽ lần lượt khi rảnh, cache theo (mảnh, màu).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { PartLibrary } from './loader';
import type { Materials } from './materials';
import { buildSingle } from './modelMeshes';
import { LDRAW_TO_WORLD } from './BrickCanvas';

const SIZE = 144;

export class IconRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  private cache = new Map<string, string>();
  private queue: { key: string; color: string; resolve: (url: string) => void }[] = [];
  private busy = false;
  private disposed = false;
  private frame = 0;
  private env: THREE.Texture | null = null;

  constructor(private lib: PartLibrary, private mats: Materials) {}

  private init() {
    if (this.renderer) return this.renderer;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const r = acquireRenderer();
    r.setPixelRatio(1); r.setSize(SIZE, SIZE, false);
    const pmrem = new THREE.PMREMGenerator(r);
    const room = new RoomEnvironment();
    this.env = pmrem.fromScene(room, 0.04).texture; room.dispose(); pmrem.dispose();
    this.scene.environment = this.env; this.scene.environmentIntensity = 0.7;
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#c9d3df', 0.6));
    const sun = new THREE.DirectionalLight('#ffffff', 1.4); sun.position.set(3, 6, 4); this.scene.add(sun);
    return (this.renderer = r);
  }

  /** dataURL của hình thẻ; vẽ lần lượt (mỗi khung một hình) để không giật khay. */
  icon(key: string, color: string): Promise<string> {
    if (this.disposed) return Promise.resolve('');
    const id = key + '|' + color;
    const hit = this.cache.get(id);
    if (hit) return Promise.resolve(hit);
    return new Promise(resolve => { this.queue.push({ key, color, resolve }); this.pump(); });
  }
  cached(key: string, color: string) { return this.cache.get(key + '|' + color); }

  private pump() {
    if (this.disposed || this.busy || !this.queue.length) return;
    this.busy = true;
    const run = () => {
      const job = this.queue.shift();
      if (!job) { this.busy = false; return; }
      const id = job.key + '|' + job.color;
      let url = this.cache.get(id);
      try { if (!url) { url = this.draw(job.key, job.color); this.cache.set(id, url); } } catch { url = ''; }
      job.resolve(url);
      this.frame = requestAnimationFrame(run);
    };
    this.frame = requestAnimationFrame(run);
  }

  private draw(key: string, color: string): string {
    const r = this.init();
    if (!this.lib.has(key)) return '';
    const col = this.mats.color(color);
    const mat = new THREE.MeshPhysicalMaterial({ color: col.color, roughness: 0.3, clearcoat: 0.25, transparent: col.bucket === 'trans', opacity: col.bucket === 'trans' ? 0.6 : 1, metalness: col.bucket === 'shiny' ? 0.8 : 0 });
    const holder = new THREE.Group(); holder.matrixAutoUpdate = false; holder.matrix.copy(LDRAW_TO_WORLD);
    holder.add(buildSingle(this.lib, this.lib.catalog, key, c => (c === 16 ? mat : this.mats.fixedMaterial(c))));
    this.scene.add(holder);
    holder.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(holder), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()).length() || 1;
    this.camera.position.copy(center).add(new THREE.Vector3(0.75, 0.62, 1).normalize().multiplyScalar(size * 2));
    this.camera.lookAt(center);
    const half = size * 0.52;
    Object.assign(this.camera, { left: -half, right: half, top: half, bottom: -half, near: 0.01, far: size * 6 });
    this.camera.updateProjectionMatrix();
    r.setPixelRatio(1); r.setSize(SIZE, SIZE, false); r.shadowMap.enabled = false;
    r.setClearColor(0x000000, 0);
    r.render(this.scene, this.camera);
    const url = r.domElement.toDataURL('image/webp', 0.85);
    this.scene.remove(holder); mat.dispose();
    return url;
  }

  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame);
    for (const job of this.queue) job.resolve('');
    this.queue = []; this.cache.clear(); this.env?.dispose();
    if (this.renderer) { releaseRenderer(this.renderer); this.renderer = null; }
  }
}
