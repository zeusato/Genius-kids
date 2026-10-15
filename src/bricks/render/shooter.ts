import { acquireRenderer, releaseRenderer } from './auxRenderer';
// Renderer phụ cho tài liệu lắp ghép (plan mục 8.4, 11.2): chụp mô hình (hoặc một phần, tô sáng mảnh mới) ở góc cho trước.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { World } from '../engine/world';
import type { PartLibrary } from './loader';
import { Materials } from './materials';
import { ModelMeshes, buildSingle, pieceMatrix } from './modelMeshes';
import { LDRAW_TO_WORLD } from './BrickCanvas';

export interface ShotView { az: number; polar: number }
export const VIEWS: Record<string, ShotView & { label: string }> = {
  iso: { az: 35, polar: 58, label: 'Nghiêng' },
  front: { az: 0, polar: 80, label: 'Trước' },
  back: { az: 180, polar: 80, label: 'Sau' },
  left: { az: -90, polar: 80, label: 'Trái' },
  right: { az: 90, polar: 80, label: 'Phải' },
  top: { az: 0, polar: 1, label: 'Trên' },
  isoBack: { az: 215, polar: 58, label: 'Nghiêng sau' },
};

export class Shooter {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 2000);
  private root = new THREE.Group();
  private mats: Materials;
  private env: THREE.Texture;
  /** Viền tô sáng mảnh mới: vẽ mặt sau, phóng to quanh tâm mảnh → chỉ thấy viền, không đổi màu mảnh. */
  private outline = new THREE.MeshBasicMaterial({ color: '#ffb000', side: THREE.BackSide });
  private hiddenMat = new THREE.MeshBasicMaterial({ visible: false });

  constructor(private lib: PartLibrary, private full: World) {
    const canvas = document.createElement('canvas');
    this.renderer = acquireRenderer();
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.env = pmrem.fromScene(room, 0.04).texture; room.dispose(); pmrem.dispose();
    this.scene.environment = this.env; this.scene.environmentIntensity = 0.6;
    this.scene.background = new THREE.Color('#ffffff');
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#c9d3df', 0.55));
    const sun = new THREE.DirectionalLight('#ffffff', 1.5);
    sun.position.set(18, 30, 14); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 120 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    this.scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.12 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.scene.add(ground);
    this.root.matrixAutoUpdate = false; this.root.matrix.copy(LDRAW_TO_WORLD); this.scene.add(this.root);
    this.mats = new Materials(full.catalog, 'high');
  }

  /** Khung hình cố định theo TOÀN mô hình để các bước không nhảy cỡ. */
  private frame(view: ShotView, w: number, h: number) {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const p of this.full.pieces.values()) for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p.bbox[i]); hi[i] = Math.max(hi[i], p.bbox[i + 3]); }
    const a = new THREE.Vector3(lo[0], -lo[1], -lo[2]).divideScalar(20), b = new THREE.Vector3(hi[0], -hi[1], -hi[2]).divideScalar(20);
    const box = new THREE.Box3().setFromPoints([a, b]), center = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2 + 0.6;
    this.camera.aspect = w / h;
    const fov = THREE.MathUtils.degToRad(this.camera.fov), hfov = 2 * Math.atan(Math.tan(fov / 2) * this.camera.aspect);
    const dist = radius / Math.sin(Math.min(fov, hfov) / 2);
    const az = THREE.MathUtils.degToRad(view.az), pol = THREE.MathUtils.degToRad(Math.max(view.polar, 0.5));
    this.camera.position.set(center.x + dist * Math.sin(pol) * Math.sin(az), center.y + dist * Math.cos(pol), center.z + dist * Math.sin(pol) * Math.cos(az));
    this.camera.up.set(0, 1, 0);
    if (view.polar < 2) this.camera.up.set(0, 0, -1);
    this.camera.near = Math.max(0.1, dist - radius * 2); this.camera.far = dist + radius * 3;
    this.camera.lookAt(center); this.camera.updateProjectionMatrix();
  }

  /** Chụp: `ids` = mảnh hiện (mặc định tất cả), `highlight` = mảnh mới của bước (tô viền vàng). */
  async shot(view: ShotView, w: number, h: number, ids?: number[], highlight: number[] = []): Promise<HTMLCanvasElement> {
    const sub = new World(this.full.catalog);
    for (const id of ids ?? this.full.pieces.keys()) { const p = this.full.pieces.get(id)!; sub.add(p.part, p.color, p.pos, p.o, id); }
    await this.lib.ensureParts([...sub.pieces.values()].map(p => p.part));
    const meshes = new ModelMeshes(this.lib, this.mats);
    meshes.rebuild(sub);
    this.root.add(meshes.group);
    const marks = new THREE.Group();
    for (const id of highlight) {
      const p = sub.pieces.get(id); if (!p) continue;
      const hidden = this.hiddenMat;
      const g = buildSingle(this.lib, this.full.catalog, p.part, code => ((this.full.catalog.fixedColors[String(code)]?.alpha ?? 255) < 255 ? hidden : this.outline));
      const c = new THREE.Vector3((p.bbox[0] + p.bbox[3]) / 2, (p.bbox[1] + p.bbox[4]) / 2, (p.bbox[2] + p.bbox[5]) / 2);
      // nới đều ~3 LDU mỗi phía theo từng trục (tấm mỏng không bị viền quá dày)
      const kx = 1 + 6 / Math.max(4, p.bbox[3] - p.bbox[0]), ky = 1 + 6 / Math.max(4, p.bbox[4] - p.bbox[1]), kz = 1 + 6 / Math.max(4, p.bbox[5] - p.bbox[2]);
      g.matrixAutoUpdate = false;
      g.matrix.makeTranslation(c.x, c.y, c.z).multiply(new THREE.Matrix4().makeScale(kx, ky, kz)).multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z)).multiply(pieceMatrix(p.pos, p.o, new THREE.Matrix4(), 1));
      marks.add(g);
    }
    this.root.add(marks);
    this.renderer.setPixelRatio(1); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(w, h, false);
    this.frame(view, w, h);
    this.renderer.render(this.scene, this.camera);
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    out.getContext('2d')!.drawImage(this.renderer.domElement, 0, 0);
    this.root.remove(meshes.group, marks); meshes.clear();
    return out;
  }

  /**
   * Tỉ lệ mảnh mới nhìn thấy được ở một góc (mục 11.4): bộ đệm ID 256×192, mỗi mảnh một màu (mã = chỉ số + 1),
   * mảnh mới đủ ≥ MIN_PX điểm ảnh thì tính là thấy. Không đèn, không tone mapping (vẽ vào render target tuyến tính).
   */
  visible(view: ShotView, ids: number[], fresh: number[], w = 256, h = 192): number {
    if (!fresh.length) return 1;
    const MIN_PX = 6, scene = new THREE.Scene(), root = new THREE.Group(), mats: THREE.Material[] = [];
    root.matrixAutoUpdate = false; root.matrix.copy(LDRAW_TO_WORLD); scene.add(root);
    ids.forEach((id, i) => {
      const p = this.full.pieces.get(id); if (!p || !this.lib.has(p.part)) return;
      const m = new THREE.MeshBasicMaterial(); m.color.setRGB(((i + 1) & 255) / 255, ((i + 1) >> 8 & 255) / 255, 0, THREE.LinearSRGBColorSpace); mats.push(m);
      const g = buildSingle(this.lib, this.full.catalog, p.part, () => m);
      g.matrixAutoUpdate = false; g.matrix.copy(pieceMatrix(p.pos, p.o, new THREE.Matrix4(), 1)); root.add(g);
    });
    const target = new THREE.WebGLRenderTarget(w, h, { colorSpace: THREE.NoColorSpace });
    const r = this.renderer, prevTarget = r.getRenderTarget(), prevClear = r.getClearColor(new THREE.Color()), prevAlpha = r.getClearAlpha(), prevShadow = r.shadowMap.enabled;
    this.frame(view, w, h);
    r.shadowMap.enabled = false; r.setRenderTarget(target); r.setClearColor(0x000000, 1); r.clear(); r.render(scene, this.camera);
    const px = new Uint8Array(w * h * 4); r.readRenderTargetPixels(target, 0, 0, w, h, px);
    r.setRenderTarget(prevTarget); r.setClearColor(prevClear, prevAlpha); r.shadowMap.enabled = prevShadow;
    const count = new Map<number, number>();
    for (let k = 0; k < px.length; k += 4) { const id = px[k] | (px[k + 1] << 8); if (id) count.set(id, (count.get(id) ?? 0) + 1); }
    const index = new Map(ids.map((id, i) => [id, i + 1]));
    const seen = fresh.filter(id => (count.get(index.get(id) ?? -1) ?? 0) >= MIN_PX).length;
    target.dispose(); for (const m of mats) m.dispose();   // hình học là bản dùng chung của thư viện mảnh (subGeometry có cache): không dispose
    return seen / fresh.length;
  }

  /** Bề ngang mô hình trên ảnh chụp ở góc `view` (px), để vẽ thước cm dưới ảnh góc Trước (mục 11.1). */
  span(view: ShotView, w: number, h: number): { x0: number; x1: number } | null {
    if (!this.full.pieces.size) return null;
    this.frame(view, w, h);
    let x0 = Infinity, x1 = -Infinity;
    for (const p of this.full.pieces.values()) for (const X of [p.bbox[0], p.bbox[3]]) for (const Y of [p.bbox[1], p.bbox[4]]) for (const Z of [p.bbox[2], p.bbox[5]]) {
      const v = new THREE.Vector3(X / 20, -Y / 20, -Z / 20).project(this.camera);
      const x = (v.x + 1) / 2 * w; x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    }
    return { x0, x1 };
  }

  dispose() { this.outline.dispose(); this.mats.dispose(); this.env.dispose(); this.hiddenMat.dispose(); this.scene.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); if (!Array.isArray(o.material)) o.material.dispose(); } if (o instanceof THREE.Light && "shadow" in o) (o as THREE.DirectionalLight).shadow.dispose(); }); releaseRenderer(this.renderer); }
}
