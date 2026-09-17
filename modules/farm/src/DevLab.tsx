import { useState } from 'react';
import Game from './Game';
import { LocalFarmGateway, LocalFarmRepository } from './adapters/local';
import { createFarm, dimensions, placementError } from './core/engine';
import { ASSETS, ITEMS, CROPS, type AssetId, type ItemId } from './core/catalog';
let offset = 0;
const time = () => Date.now() + offset;
const database = 'lang-mam-qa-only-v2' + (new URLSearchParams(location.search).get('lab') === 'mobile' ? '-mobile' : '');
const open = () => LocalFarmGateway.open(new LocalFarmRepository(database), time);
/** Explicit developer playground. Never opens, imports into or resets the player's database. */
export default function DevLab() {
    const [version, setVersion] = useState(0), [status, setStatus] = useState('Save QA riêng · không chạm vườn đang chơi');
    async function fixture(level: number) {
        const repo = new LocalFarmRepository(database), old = await repo.load(), s = createFarm(time(), 20260917);
        s.entities.forEach(e => e.level = level);
        s.coins = level > 1 ? 1000000 : 180;
        s.revision = (old?.revision ?? -1) + 1;
        if (level > 1) {
            s.legacyStorageCap = 100000;
            for (const id of Object.keys(ITEMS))
                s.inventory[id as ItemId] = 500;
            s.world.owned = Array.from({ length: 36 }, (_, i) => i);
            s.stats.explore = 36;
            for (const [id, a] of Object.entries(ASSETS)) {
                if (a.kind !== 'building' || id === 'home' || id === 'warehouse')
                    continue;
                let placed = false;
                const [w, d] = dimensions(id as AssetId, 0);
                for (let z = 0; z < 30 && !placed; z++)
                    for (let x = 0; x < 30 && !placed; x++)
                        if (!placementError(s, x, z, w, d, undefined, id as AssetId, 0)) {
                            s.entities.push({ id: `entity-${s.nextId++}`, asset: id as AssetId, x, z, rotation: 0, level, queue: [], output: {} });
                            placed = true;
                        }
            }
            for (let z = 0; z < 32 && s.plots.length < 120; z++)
                for (let x = 0; x < 32 && s.plots.length < 120; x++)
                    if (!placementError(s, x, z, 1, 1)) {
                        const crop = Object.keys(CROPS)[s.plots.length % 12] as keyof typeof CROPS;
                        s.plots.push({ id: `plot-${s.nextId++}`, x, z, crop, plantedAt: s.clock - 10000, readyAt: s.clock - 1, watered: false });
                    }
            if (!s.entities.some(e => e.asset === 'fishing_pier'))
                s.entities.push({ id: `entity-${s.nextId++}`, asset: 'fishing_pier', x: 24, z: 37, rotation: 0, level, queue: [], output: {} });
        }
        await repo.save(s, old?.revision ?? null);
        await repo.close();
        setVersion(v => v + 1);
        setStatus(`Bản thử Nhà chính ${level} · chỉ DB QA`);
    }
    return <><div className="farm-lab-tools" style={{ position: 'fixed', zIndex: 200, bottom: 0, right: 0, display: 'flex', gap: 4, padding: 4, background: '#f5dda0', fontSize: 10 }}><span>{status}</span><button onClick={() => fixture(1)}>QA Home 1</button><button onClick={() => fixture(25)}>QA Home 25</button><button onClick={() => { offset += 60000; setStatus('QA +1 phút'); }}>+1p</button><button onClick={() => { offset += 86400000 * 7; setStatus('QA +7 ngày'); }}>+7 ngày</button></div><Game key={version} openSession={open}/></>;
}
