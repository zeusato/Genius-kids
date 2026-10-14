import { dayIndex } from '../engine/core';
import { speak } from '../../utils/speech';
import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useStudent, useStudentActions } from '../../contexts/StudentContext';
import { HubShell } from '../../components/hub/HubShell';
import { Palette, Images, Sparkles, ArrowRight, Plus, Search } from 'lucide-react';
import { asset, loadCatalog, loadPage } from '../content/loader';
import { listArt, readArt } from '../progress/artworkRepo';
import { generate, mapFromPage, GENERATORS, type GeneratorKind } from '../engine/generators';
import { TIERS, type Artwork, type Catalog, type Mode, type Page, type PageInfo, type Tier, type Scene, type CompletionDetail } from '../model';
import { Studio } from './Studio';
import { DrawPage } from './DrawPage';
import './coloring.css';
const SCENES: Record<Scene, string> = { ocean: 'Bể cá thần kỳ', garden: 'Vườn bướm', sky: 'Bầu trời mơ ước', meadow: 'Đồng cỏ vui vẻ' };
export function ColoringPage() { const { currentStudent } = useStudent(), { saveColoring } = useStudentActions(), navigate = useNavigate(), [search] = useSearchParams(); const done = useCallback((id: string, detail?: CompletionDetail) => saveColoring(currentStudent!.id, id, detail), [saveColoring, currentStudent?.id]); if (!currentStudent)
    return <Navigate to="/" replace/>; return <HubShell student={currentStudent} section="Xưởng Tô Màu" backLabel="Về Góc Thủ Công" onBack={() => navigate('/crafts')}><ColoringApp key={currentStudent.id} owner={currentStudent.id} grade={currentStudent.grade} onExit={() => navigate('/crafts')} onComplete={done} initialMode={search.get('mode') === 'listen' ? 'listen' : 'free'} badges={currentStudent.coloring?.badges || []}/></HubShell>; }
export function ColoringApp({ owner, grade, onExit, onComplete, initialMode = 'free', badges = [] }: {
    owner: string;
    grade: number;
    onExit: () => void;
    onComplete: (id: string, detail?: CompletionDetail) => {
        ok: boolean;
        earned: number;
    };
    initialMode?: Mode;
    badges?: string[];
}) {
    const [catalog, setCatalog] = useState<Catalog | null>(null), [artworks, setArtworks] = useState<Artwork[]>([]), [screen, setScreen] = useState<'home' | 'gallery' | 'living' | 'draw'>('home'), [active, setActive] = useState<{
        page: Page;
        labels: Uint16Array;
        art?: Artwork;
    } | null>(null), [book, setBook] = useState('all'), [tier, setTier] = useState<Tier | 'all'>(grade === 0 ? 'easy' : 'all'), [query, setQuery] = useState(''), [loading, setLoading] = useState(false), [error, setError] = useState(''), [scene, setScene] = useState<Scene>('ocean'), [seed, setSeed] = useState(() => Date.now() >>> 0), [genTier, setGenTier] = useState<Tier>(grade === 0 ? 'easy' : grade < 3 ? 'medium' : 'hard'), [paused, setPaused] = useState(false);
    useEffect(() => { const ctrl = new AbortController(); loadCatalog(ctrl.signal).then(setCatalog).catch(e => { if (!ctrl.signal.aborted)
        setError(e.message); }); return () => ctrl.abort(); }, []);
    useEffect(() => { let cancelled = false; listArt(owner).then(a => { if (!cancelled)
        setArtworks(a); }).catch(e => { if (!cancelled)
        setError('Chưa mở được phòng tranh: ' + e.message); }); return () => { cancelled = true; }; }, [owner, active, screen]);
    useEffect(() => { const update = () => setPaused(document.hidden); document.addEventListener('visibilitychange', update); return () => document.removeEventListener('visibilitychange', update); }, []);
    async function open(info: PageInfo | Artwork) { if (loading)
        return; setError(''); setLoading(true); try {
        const art = 'ops' in info ? info : await readArt(owner, info.id);
        const loaded = art?.page ? { page: art.page, labels: await mapFromPage(art.page) } : await loadPage(info.id);
        if (art && art.rev !== loaded.page.rev)
            throw Error('Tranh đã đổi phiên bản. Bản lưu cũ vẫn được giữ lại; cần khôi phục phiên bản nguồn trước khi tô tiếp.');
        setActive({ ...loaded, art });
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setLoading(false);
    } }
    async function create(kind: GeneratorKind) { setLoading(true); try {
        const page = generate(kind, seed, genTier), labels = await mapFromPage(page), art = await readArt(owner, page.id);
        setActive({ page, labels, art });
        setSeed(s => s + 1);
    }
    catch (e) {
        setError(String(e));
    }
    finally {
        setLoading(false);
    } }
    const home = () => { setActive(null); setScreen('home'); window.scrollTo(0, 0); };
    useEffect(() => { window.scrollTo(0, 0); }, [active, screen]);
    if (active)
        return <div className="cs-root"><Studio key={owner + active.page.id} page={active.page} labels={active.labels} initial={active.art} owner={owner} grade={grade} onBack={home} onComplete={(id, detail) => onComplete(id, detail ? { ...detail, bookPages: catalog?.pages.filter(p => p.book === active.page.book).map(p => p.id), daily: catalog?.pages[dayIndex() % catalog.pages.length]?.id === id } : undefined)} initialMode={active.page.id.startsWith('gen-pixel-') ? 'number' : initialMode}/></div>;
    if (screen === 'draw')
        return <div className="cs-root"><DrawPage onBack={home} onReady={(page, labels) => setActive({ page, labels })}/></div>;
    const pages = catalog?.pages || [], today = pages.length ? pages[dayIndex() % pages.length] : null;
    const filtered = pages.filter(p => (book === 'all' || p.book === book) && (tier === 'all' || p.tier === tier) && p.title.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
    return <div className="cs-root"><main className="cs-lobby"><nav className="cs-nav"><button className="cs-btn" onClick={screen === 'home' ? onExit : home}>← {screen === 'home' ? 'Góc Thủ Công' : 'Xưởng vẽ'}</button><div><button className="cs-btn" aria-pressed={screen === 'gallery'} onClick={() => setScreen('gallery')}><Images size={18}/>Phòng tranh <b>{artworks.length}</b></button><button className="cs-btn" aria-pressed={screen === 'living'} onClick={() => setScreen('living')}><Sparkles size={18}/>Thế Giới Sống</button></div></nav>
 {error && <div className="cs-error" role="alert">{error}<button className="cs-btn" onClick={() => { setError(''); loadCatalog().then(setCatalog).catch(e => setError(e.message)); }}>Thử lại</button></div>}{loading && <div className="cs-loading" role="status">Đang mở hộp màu…</div>}
 {screen === 'home' && <><section className="cs-hero"><div className="cs-hero-copy"><span className="cs-eyebrow">MỖI NÉT MÀU, MỘT CÂU CHUYỆN</span><h1>Xưởng<br /><em>Tô Màu</em><span>✦</span></h1><p>Một chút màu vàng. Một chút tưởng tượng.<br />Cả thế giới đang chờ nét cọ của em.</p><button className="cs-btn cs-primary" disabled={loading || !pages.length} onClick={() => void open(artworks[0] || today!)}><Palette size={21}/>{artworks.length ? 'Tô tiếp tranh của em' : 'Mở hộp màu'}<ArrowRight size={20}/></button><small>{pages.length} bức tranh · 8 chủ đề · Tô màu không lem</small></div><div className="cs-hero-art"><div className="cs-art-card cs-art-back"><img src={asset('butterfly.webp')} alt="Tranh bướm hoa"/></div><div className="cs-art-card cs-art-front"><img src={artworks[0]?.thumb || asset('fish.webp')} alt="Giá vẽ của em"/></div><span className="cs-paint-dot cs-dot-one"/><span className="cs-paint-dot cs-dot-two"/><span className="cs-hero-star">✦</span><div className="cs-pencil cs-pencil-red"/><div className="cs-pencil cs-pencil-yellow"/><div className="cs-pencil cs-pencil-green"/></div></section>
 <div className="cs-quick"><button onClick={() => today && void open(today)}><span>☀</span><div><b>Tranh hôm nay · +1★</b><small>{today?.title || 'Đang mở kệ sách…'}</small></div><ArrowRight /></button><button onClick={() => setScreen('draw')}><span>✎</span><div><b>Vẽ rồi tô</b><small>Tự vẽ một thế giới mới</small></div><Plus /></button><button onClick={() => setScreen('living')}><span>✦</span><div><b>Tranh biết chuyển động</b><small>Mang tác phẩm vào thế giới sống</small></div><ArrowRight /></button></div>
 <section className="cs-library"><div className="cs-section-title"><div><span className="cs-eyebrow">KỆ SÁCH CỦA EM</span><h2>Hôm nay mình tô gì?</h2></div><label className="cs-search"><Search size={18}/><input aria-label="Tìm tranh" placeholder="Tìm một bức tranh…" value={query} onChange={e => setQuery(e.target.value)}/></label></div><div className="cs-books"><button aria-pressed={book === 'all'} onClick={() => setBook('all')}>🎨 Tất cả</button>{catalog?.books.map(b => <button key={b.id} aria-pressed={book === b.id} onClick={() => setBook(b.id)}>{b.icon} {b.title}<small>{artworks.filter(a => a.complete && pages.find(p => p.id === a.id)?.book === b.id).length}/{pages.filter(p => p.book === b.id).length}</small></button>)}</div><div className="cs-tier"><span>Mức chi tiết</span>{(['all', 'easy', 'medium', 'hard'] as const).map(t => <button key={t} aria-pressed={tier === t} onClick={() => setTier(t)}>{t === 'all' ? 'Tất cả' : TIERS[t]}</button>)}<span>{filtered.length} tranh</span></div><div className="cs-grid">{filtered.map(p => { const art = artworks.find(a => a.id === p.id); return <button className="cs-card" key={p.id} onClick={() => void open(p)} disabled={loading}><div className="cs-card-art"><img src={art?.thumb || asset(p.id + '.webp')} alt={p.title} loading="lazy"/>{art?.complete && <span className="cs-done">★</span>}</div><div className="cs-card-text"><h3>{p.title}</h3><span>{TIERS[p.tier]} · {p.count} vùng</span></div></button>; })}</div>{catalog && !filtered.length && <p>Chưa có tranh phù hợp. Em thử chủ đề khác nhé.</p>}</section>
 <section className="cs-generators"><div className="cs-section-title"><div><span className="cs-eyebrow">MỖI LẦN MỘT BẤT NGỜ</span><h2>Xưởng hoạ tiết</h2></div><label>Mức chi tiết <select value={genTier} onChange={e => setGenTier(e.target.value as Tier)}>{Object.entries(TIERS).map(([k, v]) => <option value={k} key={k}>{v}</option>)}</select></label></div><div className="cs-generator-grid">{Object.entries(GENERATORS).map(([k, v], i) => <button key={k} onClick={() => void create(k as GeneratorKind)} disabled={loading}><span>{['❋', '◇', '▦', '▧', '⋈'][i]}</span><b>{v}</b><small>Tạo mẫu mới →</small></button>)}</div><label className="cs-seed">Mã mẫu <input type="number" min={1} max={4294967295} value={seed} onChange={e => setSeed(Math.max(1, Number(e.target.value) || 1))}/></label></section>
 {badges.length > 0 && <div className="cs-badges">{badges.map(b => <span key={b}>🏅 {b}</span>)}</div>}</>}
 {screen === 'gallery' && <><div className="cs-section-title"><div><span className="cs-eyebrow">NHỮNG ĐIỀU EM TẠO NÊN</span><h1>Phòng tranh của em</h1><p>Tranh tự lưu trên thiết bị này. Chạm để tô tiếp hoặc xuất ảnh.</p></div></div>{!artworks.length ? <div className="cs-empty">🎨<h2>Giá vẽ đang đợi em</h2><button className="cs-btn cs-primary" onClick={home}>Chọn bức tranh đầu tiên</button></div> : <div className="cs-grid">{artworks.map(a => <button className="cs-card" key={a.id} onClick={() => void open(a)}><div className="cs-card-art"><img src={a.thumb || asset(a.id + '.webp')} alt="Tranh của em"/></div><div className="cs-card-text"><h3>{a.page?.title || pages.find(p => p.id === a.id)?.title || a.id}</h3><span>{a.complete ? '★ Đã hoàn thành' : 'Đang tô'} · {new Date(a.updated).toLocaleDateString('vi-VN')}</span></div></button>)}</div>}</>}
 {screen === 'living' && <><div className="cs-section-title"><div><span className="cs-eyebrow">SẮC MÀU THỨC DẬY</span><h1>Thế Giới Sống</h1></div><button className="cs-btn" onClick={() => setPaused(p => !p)}>{paused ? 'Tiếp tục' : 'Tạm dừng'}</button></div><div className="cs-books">{Object.entries(SCENES).map(([k, v]) => <button key={k} aria-pressed={scene === k} onClick={() => setScene(k as Scene)}>{v}</button>)}</div><div className={`cs-world cs-world-${scene} ${paused ? 'cs-paused' : ''}`} style={{ backgroundImage: `url(${asset('scene-' + scene + '.webp')})` }}><div className="cs-world-sun"/>{Array.from({ length: 12 }, (_, i) => <i className="cs-world-bubble" key={i} style={{ left: i * 9 + '%', animationDelay: -i * 2 + 's' }}/>)}{artworks.filter(a => a.living && a.scene === scene).slice(0, 24).map((a, i) => <button className="cs-creature" key={a.id} aria-label={a.page?.title || pages.find(p => p.id === a.id)?.title} onClick={() => speak(`Đây là ${a.page?.title || pages.find(p => p.id === a.id)?.title} của em!`)} style={{ left: (i * 29) % 78 + '%', top: 15 + (i * 17) % 52 + '%', width: 16 + (i % 3) * 4 + '%', animationDelay: -i * 1.7 + 's', animationDuration: 12 + (i % 6) * 3 + 's' }}><img src={a.livingThumb || a.thumb} alt=""/></button>)}{!artworks.some(a => a.living && a.scene === scene) && <div className="cs-world-empty"><Sparkles size={40}/><h2>Mang màu sắc đến đây nhé!</h2><p>Tô xong một tranh, rồi chọn “Thế Giới Sống”.</p><button className="cs-btn" onClick={home}>Về xưởng vẽ</button></div>}<div className="cs-world-floor"/></div></>}
 <footer className="cs-footer">✦ Sáng tạo theo cách của em · Không có màu sai trong Tô tự do ✦</footer></main></div>;
}
