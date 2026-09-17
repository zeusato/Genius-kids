import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { ASSETS, CROPS, type AssetId, type CropId } from '../src/core/catalog';
import { assetModel, cropModel } from '../src/render/models';

describe('3D asset contracts', () => {
  it('all catalog models have finite geometry and each clone keeps its own animated transforms', () => {
    for (const id of Object.keys(ASSETS) as AssetId[]) for (const level of ASSETS[id].kind === 'building' ? [1, 2, 3] : [1]) {
      const model = assetModel(id, level), bounds = new T.Box3().setFromObject(model); expect(bounds.isEmpty(), `${id}:${level}`).toBe(false);
      model.traverse(node => { if (node instanceof T.Mesh) { const positions = node.geometry.getAttribute('position'); expect(Array.from(positions.array).every(Number.isFinite)).toBe(true); } });
    }
    const a = assetModel('mill'), b = assetModel('mill'); a.getObjectByName('sails')!.rotation.z = 1;
    expect(b.getObjectByName('sails')!.rotation.z).toBeCloseTo(0);
    expect(assetModel('barn').getObjectByName('cow-head')).toBeTruthy();
  });
  it('all crops provide five nonempty stages with independent silhouettes at maturity', () => {
    const dimensions: number[] = [];
    for (const id of Object.keys(CROPS) as CropId[]) {
      for (let stage = 0; stage <= 4; stage++) expect(new T.Box3().setFromObject(cropModel(id, stage)).isEmpty()).toBe(false);
      dimensions.push(new T.Box3().setFromObject(cropModel(id, 4)).getSize(new T.Vector3()).y);
    }
    expect(new Set(dimensions).size).toBe(4);
  });
});
