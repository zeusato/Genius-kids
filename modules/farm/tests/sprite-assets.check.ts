import { describe, expect, it } from 'vitest';
import { ASSETS, type AssetId } from '../src/core/catalog';
import { buildingAssetUrl, VISUAL_LEVELS } from '../src/render/buildingAssets';
import type { Rotation } from '../src/core/types';
import fs from 'node:fs';
import sharp from 'sharp';

describe('directional building asset contract', () => {
    it('provides all 696 independently addressable views with no clipped cell borders', async () => {
        const ids = Object.keys(ASSETS).filter(id=>ASSETS[id as AssetId].kind==='building') as AssetId[];
        expect(ids).toHaveLength(29);
        const urls = new Set<string>();
        for(const id of ids) for(const level of VISUAL_LEVELS) for(const rotation of [0,1,2,3] as Rotation[]) {
            const url=buildingAssetUrl(id,level,rotation); expect(url).toBeTruthy(); urls.add(url);
            const path = new URL(`../src/assets/buildings/runtime/${id}-${level}-${rotation}.webp`,import.meta.url);
            const { data, info }=await sharp(fs.readFileSync(path)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
            expect([info.width,info.height]).toEqual([256,256]);
            let opaqueEdge=0;
            for(let n=0;n<256;n++) for(const p of [n,255*256+n,n*256,n*256+255]) opaqueEdge+=data[p*4+3];
            expect(opaqueEdge,`${id}/${level}/${rotation} edge`).toBe(0);
        }
        expect(urls.size).toBe(696);
    }, 30000);
});
