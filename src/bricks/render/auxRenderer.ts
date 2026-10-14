import * as THREE from 'three';
// One auxiliary WebGL context shared by tray previews and document snapshots.
let renderer: THREE.WebGLRenderer | undefined;
let users = 0;
export function acquireRenderer() {
  if (!renderer) renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), alpha: true, antialias: true, preserveDrawingBuffer: true });
  users++; return renderer;
}
export function releaseRenderer(r: THREE.WebGLRenderer) {
  if (r !== renderer) return;
  if (--users === 0) { r.dispose(); r.forceContextLoss(); r.domElement.width = r.domElement.height = 0; renderer = undefined; }
}
