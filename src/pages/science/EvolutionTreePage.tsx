import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Gamepad2, Home, Info, Library, Minus, Plus, Hourglass } from 'lucide-react';
import '@/src/components/evolution/evolution.css';
import { EvolutionTreeLegacy } from '@/src/components/evolution/legacy/EvolutionTreeLegacy';
import { EvoScene3D } from '@/src/components/evolution/scene/EvoScene3D';
import { EvoWorld, AtlasInfo } from '@/src/components/evolution/scene/world';
import type { CameraApi, Insets } from '@/src/components/evolution/scene/CameraRig';
import { INTRO_DISABLED, LEGACY_VIEW, START_MIX, START_TIME, prefersReducedMotion, supportsWebGL2 } from '@/src/components/evolution/scene/params';
import { NodeSheet } from '@/src/components/evolution/ui/NodeSheet';
import { TimeMachine } from '@/src/components/evolution/ui/TimeMachine';
import { ContextLostVeil, CreditsModal, EventToast, LoadingVeil, NotebookPanel, OverlayMenu, SearchBox, TopBar } from '@/src/components/evolution/ui/Panels';
import { AncestorJourney, MysteryKey, RelativesQuiz } from '@/src/components/evolution/ui/Games';
import { IconButton } from '@/src/components/evolution/ui/common';
import { MiniMap } from '@/src/components/evolution/ui/MiniMap';
import { SYMBIOSES } from '@/src/data/evolution/overlays';
import { addTo, EvoNotebook, loadEvoNotebook } from '@/src/components/evolution/notebookStore';
import { idx } from '@/src/components/evolution/engine/tree';
import { fanBounds } from '@/src/components/evolution/engine/layout';
import { TIME_EVENTS, TimeEvent } from '@/src/data/evolution/events';
import { SPLIT_TIMES } from '@/src/data/evolution/times';
import { EVO_BADGES, EVO_BADGE_STARS } from '@/src/data/evolution/games';
import { MusicControls } from '@/src/components/MusicControls';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { getAvatarById } from '@/services/avatarService';
import { cancelSpeech, speak } from '@/src/utils/speech';
import { playBlip, playImpact, playSuccess } from '@/src/components/solar/sfx';
import { Grade } from '@/types';

/** Thời gian đọc ước tính (ms) khi không có giọng đọc: ~0,4 s/chữ, tối thiểu 4 s. */
function readingMs(text: string): number { return Math.max(4000, text.trim().split(/\s+/).length * 400); }

type Mode = 'explore' | 'intro' | 'time' | 'quiz' | 'key' | 'journey';
const INTRO_KEY = 'evoIntroSeen';

function introSeen(): boolean { try { return sessionStorage.getItem(INTRO_KEY) === '1'; } catch { return false; } }
function markIntroSeen() { try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* chế độ riêng tư */ } }

export const EvolutionTreePage: React.FC = () => {
    const use2D = useMemo(() => LEGACY_VIEW || !supportsWebGL2(), []);
    if (use2D) return <EvolutionTreeLegacy />;
    return <EvolutionTree3D />;
};

const EvolutionTree3D: React.FC = () => {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { updateStudent } = useStudentActions();
    const reducedMotion = useMemo(() => prefersReducedMotion(), []);

    const [portrait, setPortrait] = useState(() => window.innerHeight > window.innerWidth);
    const [vw, setVw] = useState(() => window.innerWidth);
    useEffect(() => {
        const on = () => { setPortrait(window.innerHeight > window.innerWidth); setVw(window.innerWidth); };
        window.addEventListener('resize', on);
        return () => window.removeEventListener('resize', on);
    }, []);
    const compact = vw < 640;
    const bottomSheet = portrait || vw < 760;

    const world = useMemo(() => new EvoWorld(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape', START_MIX), []);
    const camera = useRef<CameraApi | null>(null);
    const insets = useRef<Insets>({ right: 0, bottom: 0 });
    const [atlas, setAtlas] = useState<AtlasInfo | null>(null);
    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}evolution/atlas.json`).then(r => r.json()).then(setAtlas)
            .catch(() => setAtlas({ size: 2048, cell: 128, cols: 16, items: {} }));
    }, []);

    const [ready, setReady] = useState(false);
    const [contextLost, setContextLost] = useState(false);
    const [mode, setMode] = useState<Mode>('explore');
    const modeRef = useRef<Mode>(mode);
    modeRef.current = mode;
    const [selected, setSelected] = useState<number | null>(null);
    const [overlayId, setOverlayId] = useState<string | null>(null);
    const [overlayMenu, setOverlayMenu] = useState(false);
    const [trueScale, setTrueScale] = useState(START_MIX === 1);
    const [panel, setPanel] = useState<null | 'search' | 'notebook' | 'credits' | 'games'>(null);
    const [journeyLeaf, setJourneyLeaf] = useState<number | null>(null);
    const [toast, setToast] = useState<TimeEvent | null>(null);
    const [flash, setFlash] = useState<null | 'impact' | 'dying'>(null);
    const [flashKey, setFlashKey] = useState(0);
    const [badgeToast, setBadgeToast] = useState<string | null>(null);
    const [notebook, setNotebook] = useState<EvoNotebook>(() => loadEvoNotebook(currentStudent?.id));
    useEffect(() => { setNotebook(loadEvoNotebook(currentStudent?.id)); }, [currentStudent?.id]);
    const autoSpeak = (currentStudent?.grade ?? Grade.Grade2) <= Grade.Grade1;
    const badges = currentStudent?.evoBadges ?? [];

    const avatarHtml = useMemo(() => {
        const a = currentStudent ? getAvatarById(currentStudent.currentAvatarId) : undefined;
        if (!a) return '🧒';
        return a.isEmoji ? a.imagePath : `<img src="${a.imagePath}" alt="" />`;
    }, [currentStudent]);

    useEffect(() => () => cancelSpeech(), []);
    // Đọc to. onEnd luôn được gọi đúng MỘT lần: khi đọc xong, khi lỗi, hoặc (máy không có giọng) sau thời gian
    // đọc ước tính theo độ dài câu — để nội dung không bị cắt giữa chừng (góp ý người dùng 28/09).
    const speakingRef = useRef(false);
    const say = useCallback((text: string, onEnd?: () => void) => {
        let done = false;
        const finish = () => { if (done) return; done = true; speakingRef.current = false; onEnd?.(); };
        speakingRef.current = true;
        const started = speak(text, { lang: 'vi-VN', rate: 0.92, onEnd: finish, onError: finish });
        if (!started) window.setTimeout(finish, readingMs(text));
        else window.setTimeout(finish, readingMs(text) * 2 + 3000); // an toàn: Chrome đôi khi không báo onend
    }, []);
    /** Chỉ đọc khi không có câu nào đang đọc (chú thích sự kiện không cắt ngang nhau). */
    const sayIfIdle = useCallback((text: string) => { if (!speakingRef.current) say(text); }, [say]);

    // ---- khung hình chừa chỗ cho sheet ----
    const sheetOpen = selected !== null && (mode === 'explore' || mode === 'time');
    useEffect(() => {
        insets.current = sheetOpen ? (bottomSheet ? { right: 0, bottom: Math.round(window.innerHeight * 0.46) } : { right: 392, bottom: 0 }) : { right: 0, bottom: mode === 'time' ? 150 : 0 };
    }, [sheetOpen, bottomSheet, mode]);

    // ---- hướng màn ----
    useEffect(() => {
        const o = portrait ? 'portrait' : 'landscape';
        if (world.orientation !== o) { world.setOrientation(o); requestAnimationFrame(() => camera.current?.fitAll(false)); }
    }, [portrait, world]);

    // ---- huy hiệu ----
    const award = useCallback((id: string) => {
        if (!currentStudent || currentStudent.evoBadges?.includes(id)) return;
        updateStudent({ ...currentStudent, stars: currentStudent.stars + EVO_BADGE_STARS, evoBadges: [...(currentStudent.evoBadges ?? []), id] });
        const b = EVO_BADGES.find(x => x.id === id);
        setBadgeToast(`${b?.icon ?? '🏅'} Huy hiệu mới: ${b?.label ?? id} · +${EVO_BADGE_STARS} ⭐`);
        playSuccess();
        window.setTimeout(() => setBadgeToast(null), 4200);
    }, [currentStudent, updateStudent]);

    // đánh dấu "đã xem" khi thẻ mở ≥ 1,2 s + huy hiệu theo giới
    useEffect(() => {
        if (selected === null) return;
        const id = world.tree.nodes[selected].id;
        const t = window.setTimeout(() => {
            setNotebook(nb => {
                const next = addTo(nb, 'seen', id, currentStudent?.id);
                const seen = new Set(next.seen);
                for (const b of EVO_BADGES) {
                    if (!b.sector) continue;
                    const leaves = world.tree.leaves.filter(l => world.tree.nodes[l].sector === b.sector);
                    const need = Math.min(b.need!, leaves.length);
                    if (leaves.filter(l => seen.has(world.tree.nodes[l].id)).length >= need) award(b.id);
                }
                return next;
            });
        }, 1200);
        return () => window.clearTimeout(t);
    }, [selected, world, currentStudent?.id, award]);

    // ---- chọn node ----
    const select = useCallback((i: number | null, fly = true) => {
        if (modeRef.current === 'quiz' || modeRef.current === 'key' || modeRef.current === 'journey' || modeRef.current === 'intro') return;
        setSelected(i);
        world.select(i);
        if (i !== null) {
            playBlip();
            if (fly) camera.current?.flyToNode(i, !world.tree.nodes[i].isLeaf);
        }
    }, [world]);
    const onScenePick = useCallback((i: number | null) => {
        if (i === null) { if (modeRef.current === 'explore' || modeRef.current === 'time') { setSelected(null); world.select(null); } return; }
        select(i);
    }, [select, world]);

    // ---- sự kiện thời gian ----
    const fireEvent = useCallback((eventId: string) => {
        const ev = TIME_EVENTS.find(e => e.id === eventId);
        if (!ev) return;
        setToast(ev);
        window.setTimeout(() => setToast(cur => (cur?.id === ev.id ? null : cur)), Math.max(3800, readingMs(ev.text) + 1200));
        // mở màn: 13 mốc trong 14 giây → chỉ hiện chữ, không đọc từng mốc (tránh câu này cắt câu kia)
        if (modeRef.current === 'time' && autoSpeak) sayIfIdle(`${ev.title}. ${ev.text}`);
        switch (ev.fx) {
            case 'impact':
                setFlash('impact'); setFlashKey(k => k + 1);
                world.triggerShock(); camera.current?.shake(0.6); playImpact();
                window.setTimeout(() => { world.pulse(['birds']); setToast({ ...ev, id: 'kpg-birds', icon: '🐦', title: 'Nhưng chim đã sống sót!', text: 'Chim chính là khủng long, hậu duệ của khủng long chân thú.' }); }, 1400);
                break;
            case 'great-dying': setFlash('dying'); setFlashKey(k => k + 1); world.pulse(['trilobites']); break;
            case 'burst': world.pulse(Object.entries(SPLIT_TIMES).filter(([, s]) => s.ma >= 500 && s.ma <= 545).map(([id]) => id)); break;
            case 'green-haze': world.pulse(['land_plants', 'mosses']); break;
            case 'symbiosis-mito': world.pulse(['alpha_proteobacteria', 'eukarya']); world.showSymbiosis('mito', 6); break;
            case 'symbiosis-chloro': world.pulse(['cyanobacteria', 'archaeplastida']); world.showSymbiosis('chloro', 6); break;
            case 'you-are-here': world.pulse(['humans']); break;
        }
    }, [world, sayIfIdle, autoSpeak]);
    useEffect(() => { world.onEvent = fireEvent; return () => { world.onEvent = null; }; }, [world, fireEvent]);

    // ---- mở màn "Cây mọc" ----
    const introTimer = useRef<number | null>(null);
    const finishIntro = useCallback(() => {
        if (introTimer.current) { window.clearInterval(introTimer.current); introTimer.current = null; }
        world.stopTimeAnim();
        world.setNow(0);
        world.timeActive = false;
        markIntroSeen();
        setMode('explore');
        camera.current?.fitAll(true);
    }, [world]);
    const startIntro = useCallback(() => {
        world.select(null);
        world.timeActive = true;
        world.setNow(4540);
        setMode('intro');
        const b = fanBounds(world.orientation);
        const scaled = (s: number): [number, number, number, number] => [b[0] * s, b[1] * s, b[2] * s, b[3] * s];
        camera.current?.fitBox(scaled(0.18), false);
        say('Bốn tỷ rưỡi năm trước, Trái Đất vừa ra đời. Hãy xem cây sự sống mọc lên nhé!');
        window.setTimeout(() => {
            world.animateNowTo(0, 14, () => { say('Và đây là hôm nay. Bạn ở đây, trên một ngọn nhỏ của cây sự sống!'); window.setTimeout(finishIntro, 1400); });
            introTimer.current = window.setInterval(() => {
                const f = world.nowMa <= 0 ? 1 : world.fracOf(world.nowMa);
                camera.current?.fitBox(scaled(Math.min(1, 0.16 + f * 1.02)), true, 1.04);
            }, 380);
        }, 1300);
    }, [world, finishIntro, say]);

    const onReady = useCallback(() => {
        setReady(true);
        requestAnimationFrame(() => {
            camera.current?.fitAll(false);
            if (START_TIME !== null) { world.timeActive = true; world.setNow(START_TIME); setMode('time'); return; }
            if (!INTRO_DISABLED && !reducedMotion && !introSeen()) startIntro();
        });
    }, [world, reducedMotion, startIntro]);

    // ---- cỗ máy thời gian ----
    const openTime = () => { setPanel(null); setOverlayMenu(false); world.timeActive = true; setMode('time'); if (world.nowMa <= 0) { world.setNow(4540); world.animateNowTo(0, 30); } };
    const closeTime = () => { world.animateNowTo(0, 1.5, () => { world.timeActive = false; }); setMode('explore'); };
    const setScale = (on: boolean) => { setTrueScale(on); world.setMixTarget(on ? 1 : 0); if (on) say('Thời gian đúng tỉ lệ: hơn ba tỷ năm đầu gần như chỉ có vi sinh vật!'); window.setTimeout(() => camera.current?.fitAll(true), 1250); };

    // ---- trò chơi ----
    const startGame = (m: 'quiz' | 'key') => { setPanel(null); setSelected(null); world.select(null); setOverlayId(null); world.setOverlay(null); setOverlayMenu(false); if (mode === 'time') closeTime(); setMode(m); };
    const startJourney = (leaf: number) => { setSelected(null); world.select(null); setJourneyLeaf(leaf); setMode('journey'); };
    const exitGame = () => { cancelSpeech(); world.select(null); setMode('explore'); camera.current?.fitAll(); };

    // ---- lớp phủ ----
    const pickOverlay = (id: string | null) => { setOverlayId(id); world.setOverlay(id); if (id) { setSelected(null); world.select(null); camera.current?.fitAll(); } };

    // ---- bàn phím ----
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
            const t = world.tree;
            if (e.key === 'Escape') { if (panel) setPanel(null); else if (selected !== null) { setSelected(null); world.select(null); } return; }
            if (selected === null || (mode !== 'explore' && mode !== 'time')) return;
            const n = t.nodes[selected];
            const sib = n.parent >= 0 ? t.nodes[n.parent].children : [];
            const p = sib.indexOf(selected);
            if (e.key === 'ArrowUp' && n.parent > 0) select(n.parent);
            else if (e.key === 'ArrowDown' && n.children.length) select(n.children[0]);
            else if (e.key === 'ArrowRight' && sib.length > 1) select(sib[(p + 1) % sib.length]);
            else if (e.key === 'ArrowLeft' && sib.length > 1) select(sib[(p - 1 + sib.length) % sib.length]);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [world, selected, mode, panel, select]);

    const gameProps = { world, atlas, camera, compact, say, onExit: exitGame, onAward: award };
    const showChrome = mode !== 'intro';

    return (
        <div className="evo-root fixed inset-0 overflow-hidden bg-[#04070f] select-none">
            {atlas && !contextLost && (
                <EvoScene3D world={world} atlasInfo={atlas} cameraApi={camera} insets={insets} onPick={onScenePick}
                    onReady={onReady} onContextLost={() => setContextLost(true)} paused={false}
                    labelsHidden={false} avatarHtml={avatarHtml} reducedMotion={reducedMotion} />
            )}
            {flash && <div key={flashKey} className={flash === 'impact' ? 'evo-flash' : 'evo-dying'} onAnimationEnd={() => setFlash(null)} />}
            <LoadingVeil visible={!ready} />
            {contextLost && <ContextLostVeil onReload={() => window.location.reload()} />}

            {showChrome && (
                <TopBar world={world} atlas={atlas} selected={selected} compact={compact} onBack={() => navigate('/science')}
                    onSelect={(i) => { if (i === null) { setSelected(null); world.select(null); camera.current?.fitAll(); } else select(i); }}
                    onSearch={() => setPanel('search')} right={!compact ? <MusicControls /> : undefined} />
            )}

            {mode === 'intro' && (
                <button type="button" onClick={finishIntro} className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-full bg-white/12 border border-white/20 text-white font-bold backdrop-blur-md">
                    Chạm để bỏ qua
                </button>
            )}

            {showChrome && (
                <div className={`absolute z-30 flex gap-2 ${bottomSheet ? 'left-1/2 -translate-x-1/2 bottom-3 flex-row' : 'right-3 bottom-4 flex-col'} ${sheetOpen && bottomSheet ? 'hidden' : ''} ${sheetOpen && !bottomSheet ? 'right-[400px]' : ''}`}>
                    <IconButton label="Cả cây sự sống" onClick={() => { setSelected(null); world.select(null); camera.current?.fitAll(); }}><Home size={18} /></IconButton>
                    <IconButton label="Phóng to" onClick={() => camera.current?.zoomBy(1)}><Plus size={18} /></IconButton>
                    <IconButton label="Thu nhỏ" onClick={() => camera.current?.zoomBy(-1)}><Minus size={18} /></IconButton>
                    <IconButton label="Cỗ máy thời gian" active={mode === 'time'} onClick={() => (mode === 'time' ? closeTime() : openTime())}><Hourglass size={18} /></IconButton>
                    <IconButton label="Nhóm theo SGK" active={overlayMenu || !!overlayId} onClick={() => setOverlayMenu(v => !v)}><Library size={18} /></IconButton>
                    <IconButton label="Thử thách" active={panel === 'games' || mode === 'quiz' || mode === 'key'} onClick={() => setPanel(p => (p === 'games' ? null : 'games'))}><Gamepad2 size={18} /></IconButton>
                    <IconButton label="Sổ tay hạt giống" onClick={() => setPanel('notebook')}><BookOpen size={18} /></IconButton>
                    <IconButton label="Nguồn hình ảnh" onClick={() => setPanel('credits')}><Info size={18} /></IconButton>
                </div>
            )}

            {panel === 'games' && (
                <div className={`absolute z-40 ${bottomSheet ? 'left-2 right-2 bottom-20' : 'right-16 bottom-24 w-[320px]'} rounded-3xl bg-slate-950/92 border border-white/12 backdrop-blur-xl p-3 text-white space-y-2 shadow-2xl`}>
                    <div className="font-extrabold px-1">🎮 Thử thách</div>
                    <button type="button" onClick={() => startGame('quiz')} className="w-full text-left rounded-2xl bg-white/6 hover:bg-white/12 p-3"><b>🧬 Ai là họ hàng gần nhất?</b><span className="block text-xs text-white/55">Đoán xem ai gần ai hơn trên cây sự sống.</span></button>
                    <button type="button" onClick={() => startGame('key')} className="w-full text-left rounded-2xl bg-white/6 hover:bg-white/12 p-3"><b>🗝️ Đoán xem tớ là ai?</b><span className="block text-xs text-white/55">Trả lời Có/Không theo khóa lưỡng phân.</span></button>
                    <button type="button" onClick={() => { setPanel(null); startJourney(idx(world.tree, 'humans')); }} className="w-full text-left rounded-2xl bg-white/6 hover:bg-white/12 p-3"><b>🧭 Hành trình về tổ tiên</b><span className="block text-xs text-white/55">Từ con người lùi về tận LUCA. (Chọn ngọn khác trong thẻ sinh vật.)</span></button>
                </div>
            )}

            {overlayMenu && showChrome && <OverlayMenu active={overlayId} onPick={pickOverlay} onClose={() => setOverlayMenu(false)} compact={bottomSheet} />}
            {mode === 'time' && <TimeMachine world={world} trueScale={trueScale} onTrueScale={setScale} onClose={closeTime} compact={bottomSheet} />}
            {mode === 'explore' && trueScale && (
                <div className="absolute left-1/2 -translate-x-1/2 top-20 z-30 flex items-center gap-2 rounded-full bg-amber-300/15 border border-amber-300/40 text-amber-100 text-xs px-3 py-1.5 backdrop-blur">
                    Đang xem thời gian đúng tỉ lệ <button type="button" onClick={() => setScale(false)} className="font-bold underline">Trở lại</button>
                </div>
            )}

            {sheetOpen && selected !== null && (
                <NodeSheet world={world} atlas={atlas} index={selected} portrait={bottomSheet} autoSpeak={autoSpeak}
                    onClose={() => { setSelected(null); world.select(null); cancelSpeech(); }}
                    onSelect={(i) => select(i)} onJourney={(i) => startJourney(i)}
                    onOpenCell={(cell) => navigate(`/science/cell-biology?cell=${cell}`)}
                    onSymbiosis={(id) => {
                        const sym = SYMBIOSES.find(x => x.id === id)!;
                        world.showSymbiosis(id, 10);
                        camera.current?.fitNodes([idx(world.tree, sym.from), idx(world.tree, sym.to)], 1.6);
                        const ev: TimeEvent = { id: `sym-${id}`, ma: sym.ma, title: id === 'mito' ? 'Ty thể từng là vi khuẩn!' : 'Lục lạp từng là vi khuẩn lam!', text: sym.text, icon: id === 'mito' ? '🔋' : '🌿' };
                        setToast(ev);
                        window.setTimeout(() => setToast(cur => (cur?.id === ev.id ? null : cur)), Math.max(5000, readingMs(sym.text) + 1500));
                        say(`${ev.title} ${sym.text}`);
                    }} />
            )}

            {mode === 'quiz' && <RelativesQuiz {...gameProps} />}
            {mode === 'key' && <MysteryKey {...gameProps} solved={notebook.keySolved} onSolved={(id) => setNotebook(nb => addTo(nb, 'keySolved', id, currentStudent?.id))} />}
            {mode === 'journey' && journeyLeaf !== null && (
                <AncestorJourney {...gameProps} leaf={journeyLeaf} onDone={(id) => { setNotebook(nb => addTo(nb, 'journeys', id, currentStudent?.id)); award('journey'); }} />
            )}

            {showChrome && !bottomSheet && vw >= 900 && !overlayMenu && (
                <MiniMap world={world} camera={camera} className="absolute left-3 bottom-9 z-20" />
            )}
            <EventToast event={toast} />
            {badgeToast && <div className="absolute left-1/2 -translate-x-1/2 top-36 z-50 rounded-full bg-amber-300 text-amber-950 font-extrabold px-4 py-2 shadow-2xl evo-sheet-enter-bottom">{badgeToast}</div>}

            {panel === 'search' && <SearchBox world={world} atlas={atlas} onClose={() => setPanel(null)} onPick={(i) => { setPanel(null); if (mode !== 'explore' && mode !== 'time') setMode('explore'); setTimeout(() => select(i), 0); }} />}
            {panel === 'notebook' && <NotebookPanel world={world} notebook={notebook} badges={badges} onClose={() => setPanel(null)} />}
            {panel === 'credits' && <CreditsModal world={world} onClose={() => setPanel(null)} />}

            {showChrome && !sheetOpen && mode === 'explore' && !compact && (
                <div className="absolute bottom-3 left-4 z-20 text-[11px] text-white/40 pointer-events-none">
                    Kéo để di chuyển · Véo hoặc cuộn để phóng to · Chạm vào sinh vật để xem · Hình: PhyloPic (CC0 · CC BY)
                </div>
            )}
        </div>
    );
};
