import * as THREE from 'three';
import type { ShapeDoc } from '../model';
import { arcTable, innerRadius, radiusAt, SAMPLES } from '../engine/profile';
import { cavityExposure } from '../engine/cavity';

export interface VesselGeometry {
  geometry: THREE.BufferGeometry;
  outerEnd: number;
  innerStart: number;
  innerEnd: number;
}
interface MeridianPoint { r: number; y: number; v: number; exposure: number }

// A closed clay shell around an open cavity: underside → outer wall → rounded
// lip → inner wall → rounded floor corner → floor centre. No cap spans the mouth.
// Material groups: 0 outside (paintable), 1 underside/lip, 2 cavity.
export function vesselGeometry(shape: ShapeDoc, segments = 96, reuse?: THREE.BufferGeometry): VesselGeometry {
  const open = shape.depth > .01, arc = arcTable(shape);
  const lipHeight = open ? Math.min(.035, shape.thickness * .3, shape.depth * .15, shape.height / (SAMPLES - 1) * .7) : 0;
  const top = shape.height - lipHeight, floor = shape.height - shape.depth;
  const aperture = Array.from({ length: SAMPLES }, (_, i) => innerRadius(shape, i / (SAMPLES - 1)));
  for (let i = aperture.length - 2; i >= 0; i--) aperture[i] = Math.min(aperture[i], aperture[i + 1]);
  const exposureAt = (y: number) => cavityExposure(shape, y, aperture[Math.min(SAMPLES - 1, Math.max(0, Math.floor(y / shape.height * (SAMPLES - 1))))]);
  const points: MeridianPoint[] = [{ r: 0, y: 0, v: 0, exposure: 1 }];
  for (let i = 0; i < SAMPLES; i++) {
    points.push({ r: shape.radii[i], y: i === SAMPLES - 1 ? top : shape.height * i / (SAMPLES - 1), v: arc[i], exposure: 1 });
  }
  const outerEnd = points.length - 1;
  let innerStart = -1, innerEnd = -1;
  if (open) {
    const outside = shape.radii[SAMPLES - 1], inside = innerRadius(shape, 1);
    for (let i = 1; i <= 8; i++) {
      const angle = i / 8 * Math.PI;
      points.push({ r: (outside + inside) / 2 + (outside - inside) / 2 * Math.cos(angle), y: top + lipHeight * Math.sin(angle), v: 1, exposure: 1 });
    }
    innerStart = points.length - 1;
    const round = Math.min(.07, shape.depth * .1, innerRadius(shape, floor / shape.height) * .35);
    for (let i = 1; i < SAMPLES; i++) {
      const y = top - (top - floor - round) * i / (SAMPLES - 1);
      points.push({ r: innerRadius(shape, y / shape.height), y, v: 1 - i / (SAMPLES - 1), exposure: exposureAt(y) });
    }
    innerEnd = points.length - 1;
    for (let i = 1; i <= 6; i++) {
      const angle = i / 6 * Math.PI / 2, y = floor + round * (1 - Math.sin(angle));
      points.push({ r: innerRadius(shape, y / shape.height) - round * (1 - Math.cos(angle)), y, v: 0, exposure: exposureAt(y) });
    }
    points.push({ r: 0, y: floor, v: 0, exposure: exposureAt(floor) });
  } else {
    points.push({ r: 0, y: shape.height, v: 1, exposure: 1 });
  }

  const count = points.length * (segments + 1), geometry = reuse || new THREE.BufferGeometry();
  const same = geometry.getAttribute('position')?.count === count;
  if (!same) {
    if (geometry.getAttribute('position')) geometry.dispose();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * 2), 2));
    geometry.setAttribute('cavityExposure', new THREE.BufferAttribute(new Float32Array(count), 1).setUsage(THREE.DynamicDrawUsage));
    const indices: number[] = [];
    geometry.clearGroups();
    for (let j = 0; j < points.length - 1; j++) {
      const start = indices.length;
      for (let i = 0; i < segments; i++) {
        const a = j * (segments + 1) + i, b = a + 1, c = a + segments + 1, d = c + 1;
        if (points[j].r > 0) indices.push(a, b, c);
        if (points[j + 1].r > 0) indices.push(b, d, c);
      }
      const material = j >= 1 && j < outerEnd ? 0 : open && j >= innerStart ? 2 : 1;
      const last = geometry.groups.at(-1);
      if (last?.materialIndex === material) last.count += indices.length - start;
      else geometry.addGroup(start, indices.length - start, material);
    }
    geometry.setIndex(indices);
  }
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  const uv = geometry.getAttribute('uv') as THREE.BufferAttribute;
  const exposure = geometry.getAttribute('cavityExposure') as THREE.BufferAttribute;
  for (let j = 0; j < points.length; j++) for (let i = 0; i <= segments; i++) {
    const p = points[j], angle = i / segments * Math.PI * 2, k = j * (segments + 1) + i;
    position.setXYZ(k, p.r * Math.sin(angle), p.y, p.r * Math.cos(angle));
    uv.setXY(k, i / segments, p.v);
    exposure.setX(k, p.exposure);
  }
  position.needsUpdate = uv.needsUpdate = exposure.needsUpdate = true;
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal') as THREE.BufferAttribute;
  for (let j = 0; j < points.length; j++) {
    const a = j * (segments + 1), b = a + segments;
    if (points[j].r === 0) {
      for (let i = 0; i <= segments; i++) normals.setXYZ(a + i, 0, j === 0 ? -1 : 1, 0);
    } else {
      const n = new THREE.Vector3(normals.getX(a) + normals.getX(b), normals.getY(a) + normals.getY(b), normals.getZ(a) + normals.getZ(b)).normalize();
      normals.setXYZ(a, n.x, n.y, n.z); normals.setXYZ(b, n.x, n.y, n.z);
    }
  }
  normals.needsUpdate = true;
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return { geometry, outerEnd, innerStart, innerEnd };
}
export function silhouette(shape: ShapeDoc) {
  return Array.from({ length: SAMPLES }, (_, i) => new THREE.Vector3(radiusAt(shape, i / (SAMPLES - 1)), shape.height * i / (SAMPLES - 1), 0));
}
