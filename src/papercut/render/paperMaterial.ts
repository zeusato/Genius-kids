// Vật liệu giấy hai mặt (plan mục 6.3): mặt trước/sau khác màu qua gl_FrontFacing, bỏ pixel theo mặt nạ cắt.
// Phép phản xạ (det = −1) tự đảo chiều tam giác nên mặt sau tự hiện đúng ở vạt đã lật.
import * as THREE from 'three';

export function createPaperMaterial(front: string, back: string, mask: THREE.Texture) {
  const backColor = { value: new THREE.Color(back) };
  const mat = new THREE.MeshStandardMaterial({
    color: front, side: THREE.DoubleSide, roughness: 0.92, metalness: 0,
    alphaMap: mask, alphaTest: 0.5, shadowSide: THREE.DoubleSide,
  });
  mat.onBeforeCompile = shader => {
    shader.uniforms.backColor = backColor;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 backColor;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( gl_FrontFacing ? diffuse : backColor, opacity );');
  };
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: mask, alphaTest: 0.5, side: THREE.DoubleSide });
  return { mat, depth, setColors(f: string, b: string) { mat.color.set(f); backColor.value.set(b); } };
}
