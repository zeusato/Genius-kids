import { useState } from 'react';
import Game from './Game';
import { LocalFarmGateway, LocalFarmRepository } from './adapters/local';
import { showcaseFarm } from './dev/fixtures';
import { createFarm } from './core/engine';
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
    async function fixture(level: number) {
        if (busy) return;
        setBusy(true);
        const repo = new LocalFarmRepository(database);
        try {
            const old = await repo.load(), s = level === 5 ? createFarm(time(), 20260917) : showcaseFarm(level, time());
            if (level === 5) { s.entities.forEach(e => e.level = 5); s.coins = 25000; s.inventory.wood = 25; s.inventory.stone = 25; s.inventory.plank = 10; s.inventory.tools = 5; }
            s.revision = (old?.revision ?? -1) + 1;
            await repo.save(s, old?.revision ?? null);
            setVersion(v => v + 1);
            setStatus(level === 1 ? 'Khởi đầu: Nhà chính, kho và 8 luống' : level === 5 ? 'Thử mở đất: Home 5 · còn sương ngoài vùng sở hữu' : 'Trưng bày: 29 công trình cấp 25 · 120 luống · 24 giống');
        } catch (e) { setStatus(`Chưa tạo được sân thử: ${e instanceof Error ? e.message : String(e)}`); }
        finally { await repo.close(); setBusy(false); }
    }
    return <><aside className={`farm-lab-tools ${toolsOpen ? 'is-open' : ''}`} aria-label="Sân thử riêng"><button aria-expanded={toolsOpen} aria-label={toolsOpen ? 'Thu gọn sân thử' : 'Mở công cụ sân thử'} onClick={() => setToolsOpen(v => !v)}><strong>SÂN THỬ {toolsOpen ? '−' : '+'}</strong></button>{toolsOpen && <><span>{status}</span><button disabled={busy} onClick={() => fixture(1)}>Xem khởi đầu</button><button disabled={busy} onClick={() => fixture(25)}>Trưng bày cấp 25</button><button disabled={busy} onClick={() => fixture(5)}>Thử mở đất</button><a href="?lab=architecture">Xem từng mẫu</a><a href="?lab=roads">Mẫu đường</a><button onClick={() => { offset += 60000; setStatus('QA +1 phút'); }}>+1p</button><button onClick={() => { offset += 86400000 * 7; setStatus('QA +7 ngày'); }}>+7 ngày</button></>}</aside><Game key={version} openSession={open}/></>;
}
