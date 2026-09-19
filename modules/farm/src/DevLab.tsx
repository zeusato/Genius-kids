import { useState } from 'react';
import Game from './Game';
import { LocalFarmGateway, LocalFarmRepository } from './adapters/local';
import { showcaseFarm } from './dev/fixtures';
import { createFarm } from './core/engine';
import { FarmSaveChoice } from './online/FarmSaveChoice';
import { Dialog } from './ui/shared';
let offset = 0;
const time = () => Date.now() + offset;
const params = new URLSearchParams(location.search);
const reviewSession = (params.get('session') ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
const database = 'lang-mam-qa-only-v2' + (params.get('lab') === 'mobile' ? '-mobile' : '') + (reviewSession ? `-${reviewSession}` : '');
const open = () => LocalFarmGateway.open(new LocalFarmRepository(database), time);
/** Explicit developer playground. Never opens, imports into or resets the player's database. */
export default function DevLab() {
    const [version, setVersion] = useState(0), [status, setStatus] = useState('Dữ liệu thử · không phải vườn khởi đầu'), [busy, setBusy] = useState(false);
    const [toolsOpen, setToolsOpen] = useState(() => !matchMedia('(max-width: 700px)').matches);
    const [focus, setFocus] = useState<{ x: number; z: number }>();
    const [cloudPreview, setCloudPreview] = useState(false);
    const [previewLocal] = useState(() => createFarm(time(), 42));
    const [previewCloud] = useState(() => { const state = createFarm(time(), 43); state.entities[0].level = 10; state.coins = 12345; return { owner_id: 'qa-only', revision: 1, updated_at: new Date().toISOString(), state }; });
    async function fixture(level: number | 'harvesting' | 'construction') {
        if (busy) return;
        setBusy(true);
        const repo = new LocalFarmRepository(database);
        try {
            const old = await repo.load(), s = typeof level === 'string' || level === 5 ? createFarm(time(), 20260917) : showcaseFarm(level, time());
            if (level === 5) { s.entities.forEach(e => e.level = 5); s.coins = 25000; s.inventory.wood = 25; s.inventory.stone = 25; s.inventory.plank = 10; s.inventory.tools = 5; }
            if (level === 'construction') {
                const home = s.entities.find(e => e.asset === 'home')!; home.level = 4;
                home.construction = { id: 'qa-home-upgrade', target: 5, duration: 180000, startedAt: s.clock, readyAt: s.clock + 180000, cost: { coins: 0, items: {} } };
                for(let x=8;x<15;x++) s.entities.push({id:`qa-path-${x}`,asset:'path',x,z:7,level:1,rotation:0,queue:[],output:{}});
                s.claimed=['chapter:1']; s.stats.harvest=3;
            }
            if (level === 'harvesting') {
                s.entities.forEach(e => e.level = 5); s.energy = { value: 45, capacity: 120, updatedAt: s.clock }; s.inventory.tools = 2;
                s.world.obstacles = s.world.obstacles.filter(o => !(o.x >= 24 && o.x <= 31 && o.z >= 5 && o.z <= 15));
                s.world.obstacles.push({ id: 'o-25-7', x: 25, z: 7, kind: 'tree', tier: 1, cleared: false }, { id: 'o-29-7', x: 29, z: 7, kind: 'rock', tier: 2, cleared: false }, { id: 'o-29-12', x: 29, z: 12, kind: 'ore', tier: 3, cleared: false }, { id: 'o-25-12', x: 25, z: 12, kind: 'berry', tier: 1, cleared: false });
            }
            s.revision = (old?.revision ?? -1) + 1;
            await repo.save(s, old?.revision ?? null);
            setFocus(level === 'harvesting' ? { x: 27, z: 10 } : undefined);
            setVersion(v => v + 1);
            setStatus(level === 'construction' ? 'Thi công thử: Nhà chính 4 → 5 · 3 phút · đường đất sẽ đổi sau khi xong' : level === 'harvesting' ? 'Khai phá: 45/120 năng lượng · 2 dụng cụ · 4 tài nguyên thử' : level === 1 ? 'Khởi đầu: Nhà chính, kho và 8 luống' : level === 5 ? 'Thử mở đất: Home 5 · còn sương ngoài vùng sở hữu' : 'Trưng bày: 29 công trình cấp 25 · 120 luống · 24 giống');
        } catch (e) { setStatus(`Chưa tạo được sân thử: ${e instanceof Error ? e.message : String(e)}`); }
        finally { await repo.close(); setBusy(false); }
    }
    return <><aside className={`farm-lab-tools ${toolsOpen ? 'is-open' : ''}`} aria-label="Sân thử riêng"><button aria-expanded={toolsOpen} aria-label={toolsOpen ? 'Thu gọn sân thử' : 'Mở công cụ sân thử'} onClick={() => setToolsOpen(v => !v)}><strong>SÂN THỬ {toolsOpen ? '−' : '+'}</strong></button>{toolsOpen && <><span>{status}</span><button disabled={busy} onClick={() => fixture(1)}>Xem khởi đầu</button><button disabled={busy} onClick={() => fixture(25)}>Trưng bày cấp 25</button><button disabled={busy} onClick={() => fixture(5)}>Thử mở đất</button><button disabled={busy} onClick={() => fixture('harvesting')}>Thử khai phá</button><button disabled={busy} onClick={() => fixture('construction')}>Thử thi công</button><button onClick={() => setCloudPreview(true)}>Thử chọn cloud</button><a href="?lab=architecture">Xem từng mẫu</a><a href="?lab=roads">Mẫu đường</a><button onClick={() => { offset += 60000; setStatus('QA +1 phút'); }}>+1p</button><button onClick={() => { offset += 86400000 * 7; setStatus('QA +7 ngày'); }}>+7 ngày</button></>}</aside><Game key={version} openSession={open} initialFocus={focus}/>{cloudPreview && <div className="farm-root"><Dialog title="Chọn nông trại · dữ liệu thử" onClose={() => setCloudPreview(false)}><FarmSaveChoice local={previewLocal} remote={previewCloud} busy={false} choose={source => { setStatus(`QA đã chọn ${source}, không ghi cloud thật`); setCloudPreview(false); }}/></Dialog></div>}</>;
}
