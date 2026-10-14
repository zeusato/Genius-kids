import * as THREE from 'three';

export function createCavityMaterial() {
  const material = new THREE.MeshStandardMaterial({ envMapIntensity: .65 });
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float cavityExposure;\nvarying float vCavityExposure;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCavityExposure = cavityExposure;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vCavityExposure;')
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\nreflectedLight.indirectDiffuse *= vCavityExposure;\nreflectedLight.indirectSpecular *= vCavityExposure;');
  };
  material.customProgramCacheKey = () => 'pottery-cavity-exposure-v1';
  return material;
}
