import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { cavityExposure, cavityRadius } from './cavity';
import { SHAPES, initialShape, openVessel, referenceShape, sculpt } from './profile';
import { vesselGeometry } from '../render/vesselGeometry';

describe('usable hollow vessels', () => {
  for (const spec of SHAPES) it(`${spec.id}: an actual opening leads to the floor, with an inward wall and sealed base`, () => {
    const shape = referenceShape(spec.id), { geometry, innerStart, innerEnd } = vesselGeometry(shape, 64);
    const materials = [new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial()];
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, shape.height + 1, 0), new THREE.Vector3(0, -1, 0));
    const floor = ray.intersectObject(mesh)[0];
    expect(floor).toBeDefined();
    expect(floor.point.y).toBeCloseTo(shape.height - shape.depth, 5);
    expect(floor.face!.materialIndex).toBe(2);
    // FrontSide materials must be hittable from within the volume, without a
    // fake dark cap or DoubleSide hiding an incorrectly wound interior wall.
    const y = shape.height - shape.depth * .45;
    ray.set(new THREE.Vector3(0, y, 0), new THREE.Vector3(0, 0, 1));
    const wall = ray.intersectObject(mesh)[0];
    expect(wall.face!.materialIndex).toBe(2);
    expect(wall.face!.normal.z).toBeLessThan(0);
    expect(wall.point.z).toBeCloseTo(cavityRadius(shape, y / shape.height), 2);
    ray.set(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 1, 0));
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(0, 5);
    const positions = geometry.getAttribute('position'), light = geometry.getAttribute('cavityExposure');
    expect(light.getX(innerStart * 65)).toBe(1);
    expect(light.getX(innerEnd * 65)).toBeLessThan(.65);
    expect(positions.getY(positions.count - 1)).toBeCloseTo(shape.height - shape.depth, 5);
    geometry.dispose(); materials.forEach(m => m.dispose());
  });

  it('keeps a clear neck aperture rather than doubling the requested straight wall thickness', () => {
    const shape = initialShape(); shape.radii.fill(.48); openVessel(shape);
    expect(cavityRadius(shape, .5)).toBeCloseTo(.48 - shape.thickness, 8);
    expect(cavityRadius(shape, 1)).toBeGreaterThan(.35);
  });

  it('insets sloped and pinched walls by a real normal distance', () => {
    const shape = referenceShape('vase');
    sculpt(shape, .7, -.13); shape.thickness = .09;
    const step = shape.height / 63;
    for (let i = 2; i < 62; i++) {
      const point = new THREE.Vector2(cavityRadius(shape, i / 63), i * step);
      let distance = Infinity;
      for (let j = 0; j < 63; j++) {
        const a = new THREE.Vector2(shape.radii[j], j * step), b = new THREE.Vector2(shape.radii[j + 1], (j + 1) * step);
        const edge = b.clone().sub(a), t = THREE.MathUtils.clamp(point.clone().sub(a).dot(edge) / edge.lengthSq(), 0, 1);
        distance = Math.min(distance, point.distanceTo(a.addScaledVector(edge, t)));
      }
      expect(distance).toBeGreaterThanOrEqual(shape.thickness - 1e-7);
    }
  });

  it('opening removes the solid cap, changing depth moves the floor, and closing restores the cap', () => {
    const shape = initialShape(), g = vesselGeometry(shape).geometry;
    const mesh = new THREE.Mesh(g, [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()]);
    const ray = new THREE.Raycaster(new THREE.Vector3(.001, 5, 0), new THREE.Vector3(0, -1, 0));
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(shape.height, 5);
    openVessel(shape); vesselGeometry(shape, 96, g);
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(.16, 5);
    shape.depth = .4; vesselGeometry(shape, 96, g);
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(shape.height - .4, 5);
    shape.depth = 0; vesselGeometry(shape, 96, g);
    expect(ray.intersectObject(mesh)[0].point.y).toBeCloseTo(shape.height, 5);
    g.dispose(); (mesh.material as THREE.Material[]).forEach(m => m.dispose());
  });

  it('deep cavities receive less ambient fill than a shallow bowl while the mouth stays lit', () => {
    const vase = referenceShape('vase'), bowl = referenceShape('bowl');
    expect(cavityExposure(vase, vase.height)).toBe(1);
    expect(cavityExposure(vase, .16)).toBeLessThan(cavityExposure(bowl, .16));
    expect(cavityExposure(vase, .16)).toBeGreaterThan(.1);
  });
});
