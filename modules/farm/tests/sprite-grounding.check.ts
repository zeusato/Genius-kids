import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { ASSETS, type AssetId } from '../src/core/catalog';
import { dimensions } from '../src/core/engine';
import { buildingSpritePose, spriteRotation } from '../src/render/buildingSpritePose';
import type { Rotation } from '../src/core/types';

describe('building sprite terrain occlusion', () => {
    it('keeps the visible foot on the ground for every building footprint and rotation', () => {
        for (const [asset, spec] of Object.entries(ASSETS)) {
            if (spec.kind !== 'building') continue;
            for (const rotation of [0, 1, 2, 3] as Rotation[]) for (const elevation of [0, 2, 6]) {
                const [w,d] = dimensions(asset as AssetId, rotation);
                // Include wide/tall art and asymmetric foot positions.
                for(const alpha of [{coverage:.8,bottom:.1,rootX:.5},{coverage:.4,bottom:.06,rootX:.64}]) {
                    const pose = buildingSpritePose(w,d,1,alpha);
                    const foot = new T.Vector3((alpha.rootX-.5)*pose.width,(alpha.bottom-.5)*pose.height,0).applyQuaternion(spriteRotation).add(pose.position).add(new T.Vector3(12,elevation,8));
                    expect(foot.y, `${asset}/${rotation} must not sink into soil`).toBeCloseTo(elevation, 9);
                    expect(foot.x).toBeCloseTo(12+w/2,9); expect(foot.z).toBeCloseTo(8+d/2,9);
                    const roof = new T.Vector3(0,.4*pose.height,0).applyQuaternion(spriteRotation).add(pose.position);
                    expect(roof.y).toBeGreaterThan(0);
                    for(const zoom of [2,20,80]) {
                        const camera = new T.OrthographicCamera(-20,20,20,-20,.1,2000);
                        camera.position.set(240,270,300); camera.quaternion.copy(spriteRotation); camera.zoom=zoom; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
                        const projectedFoot=foot.clone().project(camera), ground=new T.Vector3(12+w/2,elevation,8+d/2).project(camera);
                        expect(projectedFoot.distanceTo(ground)).toBeLessThan(1e-8);
                    }
                }
            }
        }
    });
});
