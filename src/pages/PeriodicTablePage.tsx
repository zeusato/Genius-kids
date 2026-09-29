import React, { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, FlaskConical, Gamepad2, Archive } from 'lucide-react';
import * as THREE from 'three';
import { MusicControls } from '@/src/components/MusicControls';
import { PeriodicTable, InfoModal } from '@/src/components/periodic/PeriodicTable';
import { ELEMENTS, byZ, gridPos, parseElementParam, type ElementFull } from '@/src/components/periodic/engine/elements';
import { DEFAULT_CTX, LENSES, lookFor, dominantOrigin, type LensCtx, type LensId, type CellLook } from '@/src/components/periodic/engine/lenses';
import { stateAt } from '@/src/components/periodic/engine/states';
import { fracYear, yearAtFrac } from '@/src/components/periodic/engine/history';
import { searchElements } from '@/src/components/periodic/engine/search';
import { INTRO_BEATS, INTRO_LENGTH, STORY_BEATS, ignitionTimes } from '@/src/components/periodic/engine/intro';
import { elementOfDay } from '@/src/components/periodic/engine/games';
import { CHALLENGES, type ShellShape } from '@/src/data/periodic/fireworks';
import { BUILDER_GOALS, goalMet } from '@/src/components/periodic/engine/builder';
import { ORIGIN_INFO } from '@/src/data/periodic/origin';
import { HISTORY_EVENTS } from '@/src/data/periodic/discovery';
import type { ExperimentSpec } from '@/src/data/periodic/experiments';
import { LensBar, LensControls, TableBay } from '@/src/components/periodic/ui/LensUI';
import { ElementSheet, ScaleHud } from '@/src/components/periodic/ui/ElementSheet';
import { FindGame, CoordGame, ScaleGame, StateGame, GAMES, Frame, type GameId } from '@/src/components/periodic/ui/Games';
import { Cabinet, FireworksUI, BuilderUI, IntroOverlay, TowerSilhouette, CityUI, KitchenUI } from '@/src/components/periodic/ui/Panels';
import { ATOMS, RECIPES, matchRecipe, nearestRecipe, type Counts } from '@/src/components/periodic/engine/molecules';
import { InfographicViewer } from '@/src/components/shared/Infographic';
import type { CellMark } from '@/src/components/periodic/ElementCell';
import { loadCollection, saveCollection, addUnique, earnedBadges, PERIODIC_BADGES, type Collection } from '@/src/components/periodic/collectionStore';
import { LEGACY_VIEW, INTRO_DISABLED, START_ELEMENT, START_LENS, START_TEMP, START_YEAR, supportsWebGL2, prefersReducedMotion, type QualityTier } from '@/src/components/periodic/stage/params';
import { CellRects } from '@/src/components/periodic/stage/screen';
import { createStageLive } from '@/src/components/periodic/stage/live';
import type { FireworksApi } from '@/src/components/periodic/stage/Labs';
import type { CellFxState, IntroPlan } from '@/src/components/periodic/stage/TableFx';
import type { Cue } from '@/src/components/periodic/stage/Experiments';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { getAvatarById } from '@/services/avatarService';
import { Grade } from '@/types';
import { speak, cancelSpeech } from '@/src/utils/speech';
import { playBlip, playWhoosh, playSuccess, playImpact, playFizz, playPop, playZap, playBoom, playLaunch, playChime, playGeigerClick } from '@/src/components/solar/sfx';
import '@/src/components/periodic/periodic.css';

// Phần 3D là chunk lazy: chỉ tải khi mở màn / chạm ô / vào phòng thí nghiệm / bật kính 🌡️.
const Stage3D = lazy(() => import('@/src/components/periodic/stage/Stage3D'));
// Modal cũ cho máy không có WebGL2 / ?view=legacy
const ElementDetail = lazy(() => import('@/src/components/periodic/legacy/ElementDetail').then(m => ({ default: m.ElementDetail })));

type Lab = 'fireworks' | 'builder' | 'city' | 'kitchen' | null;
const BADGE_STARS = 10;
const INTRO_KEY = 'ptIntroSeen';

export const PeriodicTablePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { updateStudent } = useStudentActions();
    const studentRef = useRef(currentStudent);
    studentRef.current = currentStudent;
    const grade = currentStudent?.grade ?? Grade.Grade2;
    const young = grade <= Grade.Grade2;
    const autoSpeak = grade <= Grade.Grade1;
    const webgl = useMemo(() => !LEGACY_VIEW && supportsWebGL2(), []);
    const reduced = useMemo(() => prefersReducedMotion(), []);

    // ---------------------------------------------------------------- kính lọc
    const [lens, setLens] = useState<LensId>(() => (LENSES.some(l => l.id === START_LENS) ? START_LENS as LensId : 'group'));
    const [ctx, setCtx] = useState<LensCtx>(() => ({ ...DEFAULT_CTX, tempC: START_TEMP ?? 25, year: START_YEAR ?? 2016 }));
    const [hover, setHover] = useState<ElementFull | null>(null);
    const onCtx = useCallback((c: Partial<LensCtx>) => setCtx(p => ({ ...p, ...c })), []);

    // ---------------------------------------------------------------- sưu tập + huy hiệu
    const [col, setColState] = useState<Collection>(() => loadCollection(currentStudent?.id));
    const [toast, setToast] = useState<string | null>(null);
    const toastTimer = useRef(0);
    const showToast = useCallback((t: string, ms = 3200) => { setToast(t); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), ms); }, []);
    const setCol = useCallback((fn: (c: Collection) => Collection) => {
        setColState(prev => {
            const next = fn(prev);
            if (next === prev) return prev;
            saveCollection(next, studentRef.current?.id);
            const s = studentRef.current;
            if (s) {
                const have = s.periodicBadges ?? [];
                const fresh = earnedBadges(next).filter(b => !have.includes(b));
                if (fresh.length) {
                    updateStudent({ ...s, stars: s.stars + BADGE_STARS * fresh.length, periodicBadges: [...have, ...fresh] });
                    const b = PERIODIC_BADGES.find(x => x.id === fresh[0])!;
                    window.setTimeout(() => { playSuccess(); showToast(`${b.icon} Huy hiệu mới: ${b.title}! +${BADGE_STARS} ⭐`, 4200); }, 50);
                }
            }
            return next;
        });
    }, [updateStudent, showToast]);
    const collected = useMemo(() => new Set(col.seen), [col.seen]);
    const badges = currentStudent?.periodicBadges ?? [];

    // ---------------------------------------------------------------- sân khấu nguyên tố
    const [selected, setSelected] = useState<ElementFull | null>(null);
    const [closing, setClosing] = useState(false);
    const [legacyEl, setLegacyEl] = useState<ElementFull | null>(null);
    const [experiment, setExperiment] = useState<ExperimentSpec | null>(null);
    const [expPower, setExpPower] = useState(true);
    const [cloud, setCloud] = useState(false);
    const [level, setLevel] = useState(0);
    const live = useRef(createStageLive()).current;
    const [infographic, setInfographic] = useState<string | null>(null);
    const [lab, setLab] = useState<Lab>(null);
    const [canvasOn, setCanvasOn] = useState(false);
    const [ready, setReady] = useState<string | null>(null);
    const [tier, setTier] = useState<QualityTier>('high');
    const [contextLost, setContextLost] = useState(false);
    const [portrait, setPortrait] = useState(() => window.innerWidth < 760 || window.innerHeight > window.innerWidth * 1.05);
    useEffect(() => {
        const on = () => setPortrait(window.innerWidth < 760 || window.innerHeight > window.innerWidth * 1.05);
        window.addEventListener('resize', on);
        return () => window.removeEventListener('resize', on);
    }, []);

    const mode = selected ? 'element' : lab ? 'lab' : 'table';
    const warmKey = selected ? `el${selected.atomicNumber}/${experiment?.id ?? ''}` : lab ?? 'table';

    const openElement = useCallback((e: ElementFull) => {
        if (!webgl) { setLegacyEl(e); return; }
        cancelSpeech();
        playWhoosh();
        setCanvasOn(true);
        setClosing(false);
        setExperiment(null); setCloud(false); setLevel(0); setExpPower(true);
        setSelected(e);
    }, [webgl]);
    const closeElement = useCallback(() => { cancelSpeech(); setExperiment(null); setClosing(true); }, []);
    const fx = useRef<CellFxState>({ gas: [], liquid: [], bursts: [] });
    const [burstOn, setBurstOn] = useState(false);
    const onStageClosed = useCallback(() => {
        const z = selected?.atomicNumber;
        setSelected(null); setClosing(false);
        if (z) {
            fx.current.bursts.push({ z, t0: performance.now() / 1000, color: new THREE.Color('#fde68a') });
            setBurstOn(true); window.setTimeout(() => setBurstOn(false), 1400);
        }
    }, [selected]);

    // đã sưu tầm: thẻ mở ≥ 3 s
    useEffect(() => {
        if (!selected || closing) return;
        const z = selected.atomicNumber;
        const t = window.setTimeout(() => setCol(c => (c.seen.includes(z) ? c : { ...c, seen: [...c.seen, z] })), 3000);
        return () => window.clearTimeout(t);
    }, [selected, closing, setCol]);

    // mở sẵn từ URL (?el=Au)
    useEffect(() => { const e = parseElementParam(START_ELEMENT); if (e) openElement(e); }, [openElement]);

    // HUD tầng: đọc zoom hiện tại ~8 Hz, chỉ setState khi tầng nguyên đổi
    useEffect(() => {
        if (!selected) return;
        const id = window.setInterval(() => { const l = Math.round(live.zoomNow); setLevel(p => (p === l ? p : l)); }, 120);
        return () => window.clearInterval(id);
    }, [selected, live]);

    const onCue = useCallback((c: Cue, power?: number) => {
        if (c === 'fizz') playFizz(power); else if (c === 'pop') playPop(); else if (c === 'boom') playBoom(); else if (c === 'zap') playZap();
        else if (c === 'geiger') playGeigerClick(); else playWhoosh();
    }, []);
    const chooseExperiment = useCallback((x: ExperimentSpec | null) => {
        setExperiment(x); live.expStart = performance.now(); live.zoom = 0; setExpPower(true);
        if (x) { if (x.id === 'discharge') playZap(); if (selected) { const z = selected.atomicNumber; setCol(c => (c.seen.includes(z) ? c : { ...c, seen: [...c.seen, z] })); } }
    }, [live, selected, setCol]);
    const voice = useCallback((x: ExperimentSpec) => {
        const fxv = x.params?.fx === 'xenon' ? 'xenon' : 'helium';
        speak(fxv === 'helium' ? 'Xin chào! Tớ vừa hít helium nên giọng tớ cao chí chóe thế này đây!' : 'Xin chào... tớ vừa hít xenon... nên giọng tớ trầm ồm như người khổng lồ.', { voiceFx: fxv, rate: 0.95 });
    }, []);

    // ---------------------------------------------------------------- điều khiển sân khấu: kéo xoay, cuộn/véo lặn
    useEffect(() => {
        if (mode !== 'element') return;
        const pts = new Map<number, { x: number; y: number }>();
        let pinch0 = 0, zoom0 = 0;
        const onCanvas = (e: Event) => !!(e.target as HTMLElement)?.closest?.('[data-ptcanvas]');
        const down = (e: PointerEvent) => { if (!onCanvas(e)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); live.dragging = true; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = live.zoom; } };
        const move = (e: PointerEvent) => {
            const p = pts.get(e.pointerId); if (!p) return;
            if (pts.size === 2) {
                pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
                const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
                if (!experiment) live.zoom = Math.max(0, Math.min(3, zoom0 + Math.log(d / Math.max(1, pinch0)) * 2.2));
                return;
            }
            live.rotY += (e.clientX - p.x) * 0.01; live.rotX = Math.max(-1.2, Math.min(1.2, live.rotX + (e.clientY - p.y) * 0.008));
            pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        };
        const up = (e: PointerEvent) => { pts.delete(e.pointerId); if (pts.size === 0) live.dragging = false; };
        const wheel = (e: WheelEvent) => { if (!onCanvas(e) || experiment) return; e.preventDefault(); live.zoom = Math.max(0, Math.min(3, live.zoom - e.deltaY * 0.0022)); };
        window.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
        window.addEventListener('wheel', wheel, { passive: false });
        return () => { window.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); window.removeEventListener('wheel', wheel); };
    }, [mode, live, experiment]);

    // ---------------------------------------------------------------- vị trí ô cho FX (cache)
    const rects = useRef(new CellRects()).current;
    const wrapRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    useLayoutEffect(() => {
        const wrap = wrapRef.current, tbl = tableRef.current;
        if (!wrap || !tbl) return;
        const fit = () => {
            const natural = tbl.scrollWidth / (Number(tbl.style.zoom) || 1);
            const avail = wrap.clientWidth - 8;
            const z = Math.min(1, avail / natural);
            setZoom(z < 0.55 ? 0.55 : Math.floor(z * 100) / 100);
            requestAnimationFrame(() => rects.refresh());
        };
        fit();
        const ro = new ResizeObserver(fit); ro.observe(wrap);
        const onScroll = () => rects.refresh();
        window.addEventListener('scroll', onScroll, { passive: true });
        wrap.addEventListener('scroll', onScroll, { passive: true });
        return () => { ro.disconnect(); window.removeEventListener('scroll', onScroll); wrap.removeEventListener('scroll', onScroll); };
    }, [rects]);
    useEffect(() => { requestAnimationFrame(() => rects.refresh()); }, [lens, zoom, rects, mode]);

    // bọt khí bám ô ở kính 🌡️
    useEffect(() => {
        if (lens !== 'state') { fx.current.gas = []; fx.current.liquid = []; return; }
        fx.current.gas = ELEMENTS.filter(e => stateAt(e, ctx.tempC) === 'gas').map(e => e.atomicNumber);
        fx.current.liquid = ELEMENTS.filter(e => stateAt(e, ctx.tempC) === 'liquid').map(e => e.atomicNumber);
        if (webgl && !reduced) setCanvasOn(true);
    }, [lens, ctx.tempC, webgl, reduced]);

    // ---------------------------------------------------------------- mở màn "Từ Vụ Nổ Lớn đến em"
    const [intro, setIntro] = useState<IntroPlan | null>(null);
    const [darkSet, setDarkSet] = useState<Set<number> | null>(null);
    const [caption, setCaption] = useState<string | null>(null);
    const [flash, setFlash] = useState(0);
    const [youBeat, setYouBeat] = useState(false);
    const introEnd = useRef<() => void>(() => { });
    const startIntro = useCallback(() => {
        const ignite = ignitionTimes(ELEMENTS);
        const colors = new Map<number, string>(), fxOf = new Map<number, typeof INTRO_BEATS[number]['fx']>();
        ELEMENTS.forEach(e => { const o = dominantOrigin(e); colors.set(e.atomicNumber, ORIGIN_INFO[o].color); fxOf.set(e.atomicNumber, INTRO_BEATS.find(b => b.origin === o)?.fx ?? 'stars'); });
        setCanvasOn(true);
        setDarkSet(new Set(ELEMENTS.map(e => e.atomicNumber)));
        setIntro({ start: performance.now() / 1000 + 0.6, ignite, colors, fxOf });
    }, []);
    useEffect(() => {
        if (!webgl || reduced || INTRO_DISABLED || START_ELEMENT) return;
        try { if (sessionStorage.getItem(INTRO_KEY)) return; } catch { /* bỏ qua */ }
        startIntro();
    }, [webgl, reduced, startIntro]);
    useEffect(() => {
        if (!intro) return;
        let raf = 0, lastLit = 0, lastChime = 0, beat = -1;
        const lit = new Set<number>();
        const end = () => {
            cancelAnimationFrame(raf);
            setIntro(null); setDarkSet(null); setCaption(null); setFlash(0); setYouBeat(false);
            try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* bỏ qua */ }
        };
        introEnd.current = end;
        const tick = () => {
            const t = performance.now() / 1000 - intro.start;
            intro.ignite.forEach((ti, z) => { if (t >= ti && !lit.has(z)) { lit.add(z); if (t - lastChime > 0.07) { lastChime = t; playChime(lit.size % 24); } } });
            if (lit.size !== lastLit) { lastLit = lit.size; setDarkSet(new Set(ELEMENTS.map(e => e.atomicNumber).filter(z => !lit.has(z)))); }
            const bi = INTRO_BEATS.findIndex((b, i) => t >= b.at && (i === INTRO_BEATS.length - 1 || t < INTRO_BEATS[i + 1].at));
            if (bi !== beat) {
                beat = bi;
                const b = INTRO_BEATS[bi];
                setCaption(b ? b.text : null);
                if (b?.fx === 'bigbang' || b?.fx === 'supernova') playImpact();
                if (b?.fx === 'kilonova') playBoom(false);
                setYouBeat(b?.fx === 'you');
            }
            setFlash(t > 0.6 && t < 1.4 ? 1 - (t - 0.6) / 0.8 : 0);
            if (t >= INTRO_LENGTH) { end(); return; }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [intro]);
    const skipIntro = useCallback(() => introEnd.current(), []);

    // ---------------------------------------------------------------- "Chuyện của vũ trụ" (kể chuyện, chờ đọc xong)
    const [storyIdx, setStoryIdx] = useState<number | null>(null);
    useEffect(() => {
        if (storyIdx === null) return;
        const b = STORY_BEATS[storyIdx];
        if (!b) { setStoryIdx(null); setCol(c => (c.story ? c : { ...c, story: true })); showToast('✨ Em vừa nghe trọn chuyện của vũ trụ!'); return; }
        let done = false;
        const next = () => { if (done) return; done = true; window.setTimeout(() => setStoryIdx(i => (i === null ? null : i + 1)), 900); };
        speak(b.say, { rate: 0.92, onEnd: next, onError: next });
        const safety = window.setTimeout(next, 2500 + b.say.length * 95);
        return () => { done = true; window.clearTimeout(safety); };
    }, [storyIdx, setCol, showToast]);
    const toggleStory = () => { if (storyIdx !== null) { cancelSpeech(); setStoryIdx(null); } else setStoryIdx(0); };

    // ---------------------------------------------------------------- cỗ máy thời gian ▶
    const [histPlay, setHistPlay] = useState(false);
    useEffect(() => {
        if (!histPlay) return;
        let raf = 0, last = performance.now();
        let f = fracYear(ctx.year) >= 0.999 ? 0 : fracYear(ctx.year);
        let prevYear = yearAtFrac(f);
        const tick = (now: number) => {
            f = Math.min(1, f + (now - last) / 1000 / 32); last = now;
            const y = yearAtFrac(f);
            const ev = HISTORY_EVENTS.find(e => prevYear < e.year && y >= e.year);
            if (ev) { showToast(ev.say, 4500); speak(ev.say, { rate: 0.95 }); }
            if (prevYear < 1886 && y >= 1886) setCol(c => (c.mendeleev ? c : { ...c, mendeleev: true }));
            prevYear = y;
            setCtx(c => ({ ...c, year: y }));
            if (f >= 1) { setHistPlay(false); return; }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [histPlay]);
    useEffect(() => { if (lens === 'history' && ctx.year >= 1886 && !histPlay && ctx.year < 2016) setCol(c => (c.mendeleev ? c : { ...c, mendeleev: true })); }, [lens, ctx.year, histPlay, setCol]);
    useEffect(() => { if (lens !== 'history') setHistPlay(false); if (lens !== 'origin' && storyIdx !== null) { cancelSpeech(); setStoryIdx(null); } }, [lens, storyIdx]);

    // ---------------------------------------------------------------- trò chơi
    const [game, setGame] = useState<GameId | null>(null);
    const [gamesMenu, setGamesMenu] = useState(false);
    const [marks, setMarks] = useState<Map<number, CellMark>>(new Map());
    const gameClick = useRef<((e: ElementFull) => void) | null>(null);
    const register = useCallback((fn: ((e: ElementFull) => void) | null) => { gameClick.current = fn; }, []);
    const endGame = useCallback(() => { setGame(null); setMarks(new Map()); gameClick.current = null; cancelSpeech(); }, []);
    const onGameDone = useCallback((score: number, id: GameId) => {
        if (id === 'find') setCol(c => (score > c.bestFind ? { ...c, bestFind: score } : c));
        showToast(`🎉 Xong! Em đúng ${score}/8 câu.`); playSuccess();
        window.setTimeout(endGame, 1200);
    }, [setCol, showToast, endGame]);
    useEffect(() => { if (game === 'find' && young) setLens('uses'); else if (game === 'find' || game === 'coord') setLens('group'); }, [game, young]);

    // ---------------------------------------------------------------- phòng thí nghiệm
    const fwApi = useRef<FireworksApi | null>(null);
    const [picks, setPicks] = useState<number[]>([38]);
    const [shape, setShape] = useState<ShellShape>('peony');
    const shots = useRef<{ zs: number[]; shape: ShellShape }[]>([]);
    const [fwMsg, setFwMsg] = useState<string | null>(null);
    useEffect(() => {
        if (lab !== 'fireworks') return;
        const down = (e: PointerEvent) => {
            if (!(e.target as HTMLElement)?.closest?.('[data-ptcanvas]')) return;
            if (e.clientY > window.innerHeight * 0.7) return;
            fwApi.current?.launch(e.clientX, e.clientY, picks, shape);
            playLaunch();
            shots.current = [...shots.current.slice(-20), { zs: picks, shape }];
            const doneNow = CHALLENGES.filter(c => c.test(shots.current)).map(c => c.id);
            setCol(c => {
                const add = doneNow.filter(id => !c.fireworks.includes(id));
                if (!add.length) return c;
                setFwMsg(`🎯 Hoàn thành: ${CHALLENGES.find(x => x.id === add[0])!.title}!`);
                return { ...c, fireworks: [...c.fireworks, ...add] };
            });
        };
        window.addEventListener('pointerdown', down);
        return () => window.removeEventListener('pointerdown', down);
    }, [lab, picks, shape, setCol]);
    const [bp, setBp] = useState({ p: 1, n: 0, e: 1 });
    const [bLevel, setBLevel] = useState(1);
    const [bGoal, setBGoal] = useState(0);
    const setB = (k: 'p' | 'n' | 'e', d: number) => setBp(s => {
        const v = { ...s, [k]: Math.max(0, Math.min(k === 'n' ? 30 : 20, s[k] + d)) };
        playBlip();
        return v;
    });
    useEffect(() => {
        if (lab !== 'builder' || bp.p === 0) return;
        setCol(c => (c.built.includes(bp.p) ? c : { ...c, built: addUnique(c.built, bp.p) }));
    }, [bp.p, lab, setCol]);
    // mục tiêu Xưởng: đạt → khen + chuyển mục tiêu kế
    useEffect(() => {
        if (lab !== 'builder') return;
        const goals = BUILDER_GOALS.filter(g => g.level === bLevel), g = goals[bGoal % goals.length];
        if (!g || !goalMet(g, bp.p, bp.n, bp.e)) return;
        playSuccess(); showToast('✅ Giỏi quá! ' + g.text.split(':')[0]);
        const t = window.setTimeout(() => setBGoal(i => i + 1), 1500);
        return () => window.clearTimeout(t);
    }, [lab, bp, bLevel, bGoal, showToast]);
    // 🏙️ thành phố + 🧪 bếp phân tử
    const [cityProp, setCityProp] = useState<'melt' | 'density' | 'age' | 'crust'>('melt');
    const [kCounts, setKCounts] = useState<Counts>({ H: 2, O: 1 });
    const kRecipe = useMemo(() => matchRecipe(kCounts), [kCounts]);
    const [kFound, setKFound] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('ptable_kitchen_v1') || '[]'); } catch { return []; } });
    useEffect(() => {
        if (lab !== 'kitchen' || !kRecipe || kFound.includes(kRecipe.id)) return;
        const next = [...kFound, kRecipe.id]; setKFound(next); playSuccess(); showToast(`${kRecipe.emoji} Em vừa tạo ra ${kRecipe.name}!`);
        try { localStorage.setItem('ptable_kitchen_v1', JSON.stringify(next)); } catch { /* bỏ qua */ }
    }, [lab, kRecipe, kFound, showToast]);
    const kHint = useMemo(() => { const n = nearestRecipe(kCounts); return `Thử công thức ${n.formula} (${n.name.toLowerCase()})`; }, [kCounts]);
    const openLab = (l: Lab) => { setGamesMenu(false); endGame(); setCanvasOn(true); setLab(l); if (l === 'fireworks') setFwMsg(null); };

    // ---------------------------------------------------------------- phím
    const focusZ = useRef<number>(1);
    useEffect(() => {
        const key = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
            if (e.key === 'Escape') {
                if (infographic) setInfographic(null);
                else if (selected) closeElement();
                else if (lab) setLab(null);
                else if (game) endGame();
                return;
            }
            if (selected) {
                if (e.key === 'ArrowRight' && selected.atomicNumber < 118) openElement(byZ(selected.atomicNumber + 1)!);
                if (e.key === 'ArrowLeft' && selected.atomicNumber > 1) openElement(byZ(selected.atomicNumber - 1)!);
                return;
            }
            if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key) || lab) return;
            const active = document.activeElement as HTMLElement | null;
            const cur = byZ(Number(active?.dataset?.z) || focusZ.current)!;
            const p = gridPos(cur);
            const dr = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0, dc = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
            let best: ElementFull | null = null, bd = Infinity;
            for (const x of ELEMENTS) {
                const q = gridPos(x), rr = q.row - p.row, cc = q.col - p.col;
                if ((dr && Math.sign(rr) !== dr) || (dc && Math.sign(cc) !== dc) || (dr && rr === 0) || (dc && cc === 0)) continue;
                const d = dr ? Math.abs(rr) * 10 + Math.abs(cc) : Math.abs(cc) * 10 + Math.abs(rr) * 30;
                if (d < bd) { bd = d; best = x; }
            }
            if (best) { focusZ.current = best.atomicNumber; document.querySelector<HTMLElement>(`button[data-z="${best.atomicNumber}"]`)?.focus(); e.preventDefault(); }
        };
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    }, [selected, lab, game, infographic, openElement, closeElement, endGame]);
    useEffect(() => () => cancelSpeech(), []);

    // ---------------------------------------------------------------- chạm ô
    const onCell = useCallback((e: ElementFull) => {
        if (intro) return;
        if (gameClick.current) { gameClick.current(e); return; }
        if (lens === 'uses') { speak(`${e.sgkName}. ${e.uses[0]?.text ?? ''}`, { rate: 0.92 }); }
        openElement(e);
    }, [intro, lens, openElement]);

    // ---------------------------------------------------------------- look của từng ô
    const storyOrigin = storyIdx !== null ? STORY_BEATS[storyIdx]?.origin : null;
    const lookOf = useMemo(() => {
        const cache = new Map<number, CellLook>();
        const effLens: LensId = youBeat ? 'around' : lens;
        const effCtx = youBeat ? { ...ctx, around: 'body' as const } : ctx;
        return (e: ElementFull) => {
            let l = cache.get(e.atomicNumber);
            if (!l) {
                l = lookFor(e, effLens, effCtx);
                if (storyOrigin && storyOrigin !== 'you' && dominantOrigin(e) !== storyOrigin) l = { ...l, key: `${l.key}d`, dim: true };
                if (storyOrigin === 'you') l = lookFor(e, 'around', { ...ctx, around: 'body' });
                cache.set(e.atomicNumber, l);
            }
            return l;
        };
    }, [lens, ctx, youBeat, storyOrigin]);

    // ---------------------------------------------------------------- tìm kiếm
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const results = useMemo(() => searchElements(ELEMENTS, searchQuery, 10), [searchQuery]);
    const [showInfo, setShowInfo] = useState(false);
    const [cabinet, setCabinet] = useState(false);

    const avatar = useMemo(() => {
        const a = currentStudent ? getAvatarById(currentStudent.currentAvatarId) : undefined;
        if (!a) return <span className="text-4xl">🧒</span>;
        return a.isEmoji ? <span className="text-4xl">{a.imagePath}</span> : <img src={a.imagePath} alt="" className="w-14 h-14 rounded-full mx-auto mb-1 ring-2 ring-amber-200" />;
    }, [currentStudent]);

    const elementReady = ready === warmKey;
    const day = useMemo(() => elementOfDay(ELEMENTS), []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />

            {/* Header */}
            <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-4 bg-black/30 backdrop-blur-md border-b border-white/10">
                <button onClick={() => navigate('/science')} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-semibold text-white shadow-md">
                    <ArrowLeft size={20} /><span className="hidden sm:inline">Quay lại</span>
                </button>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400">Bảng Tuần Hoàn</h1>
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <button onClick={() => setGamesMenu(true)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white" title="Trò chơi và phòng thí nghiệm"><Gamepad2 size={20} /></button>
                    <button onClick={() => setCabinet(true)} className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white" title="Tủ sưu tập">
                        <Archive size={20} /><span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-300 text-slate-900 text-[10px] font-bold grid place-items-center">{col.seen.length}</span>
                    </button>
                    <button onClick={() => setShowSearch(!showSearch)} className={`p-2 rounded-xl transition-colors ${showSearch ? 'bg-cyan-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`} title="Tìm nguyên tố"><Search size={20} /></button>
                    <MusicControls />
                </div>
            </header>

            {showSearch && (
                <div className="sticky top-[72px] z-30 px-4 py-3 bg-black/50 backdrop-blur-md border-b border-white/10">
                    <div className="max-w-md mx-auto relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                            placeholder="Tìm nguyên tố (tên, tên cũ, ký hiệu, số)… vd: hidro, sắt, 79"
                            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                        {searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto bg-slate-800/95 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl">
                                {results.length > 0 ? results.map(element => (
                                    <button key={element.atomicNumber} onClick={() => { setShowSearch(false); setSearchQuery(''); openElement(element); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left">
                                        <span className="w-10 h-10 flex items-center justify-center bg-cyan-500/20 rounded-lg text-cyan-400 font-bold">{element.symbol}</span>
                                        <div>
                                            <p className="text-white font-medium">{element.sgkName} {element.uses[0]?.emoji}</p>
                                            <p className="text-white/50 text-sm">#{element.atomicNumber}{element.oldName !== element.sgkName ? ` • tên cũ: ${element.oldName}` : ''}</p>
                                        </div>
                                    </button>
                                )) : <div className="px-4 py-6 text-center text-white/50">Không tìm thấy nguyên tố nào</div>}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <main className="relative py-4 sm:py-6 space-y-3">
                <LensBar lens={lens} onLens={(l) => { setLens(l); playBlip(); }} hintUses={young} />
                <LensControls lens={lens} ctx={ctx} onCtx={onCtx} playing={histPlay} onPlay={() => setHistPlay(p => !p)} onStory={toggleStory} storyOn={storyIdx !== null} onInfo={() => setShowInfo(true)} />
                <div ref={wrapRef} className="w-full overflow-x-auto pt-2">
                    <div ref={tableRef} style={{ zoom, opacity: lab === 'city' ? 0 : 1, transition: 'opacity .8s' }} className="w-fit mx-auto">
                        <PeriodicTable onSelectElement={onCell} onHoverElement={setHover} lookOf={lookOf} collected={collected} marks={marks} darkSet={darkSet}
                            bay={<TableBay hover={hover} lens={lens} onOpen={openElement} avatar={youBeat || storyOrigin === 'you' ? avatar : undefined}
                                caption={intro ? (youBeat ? caption : null) : storyIdx !== null ? (STORY_BEATS[storyIdx]?.say ?? null) : null} />} />
                    </div>
                </div>
                {zoom <= 0.55 && <p className="text-center text-xs text-white/50">📱 Xoay ngang màn hình để xem bảng rõ hơn</p>}
                <div className="text-center text-white/50 text-sm">
                    <p>118 nguyên tố • Chu kỳ 1-7 • Nhóm 1-18 • Em đã sưu tầm {col.seen.length}/118 ✦</p>
                    {!intro && webgl && <button onClick={startIntro} className="mt-1 text-xs text-cyan-300/70 hover:text-cyan-200">✨ Xem lại "Từ Vụ Nổ Lớn đến em"</button>}
                </div>
            </main>

            {/* ------------------------------------------------ sân khấu / lab: nền DOM dưới canvas trong suốt */}
            <div className={`fixed inset-0 z-[42] transition-opacity duration-500 ${mode === 'element' && !closing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ background: selected ? `radial-gradient(ellipse at 35% 45%, ${ELEMENT_TINT(selected)}38 0%, transparent 55%), radial-gradient(ellipse at 35% 45%, #141a3d 0%, #070b1e 55%, #02030a 100%)` : undefined }} />
            {lab === 'fireworks' && (
                <div className="fixed inset-0 z-[42] ptable-night">
                    <div className="absolute inset-0 ptable-stars" />
                    <div className="absolute left-0 right-0 bottom-0 h-[26%] ptable-lake" />
                    <TowerSilhouette />
                </div>
            )}
            {lab === 'kitchen' && <div className="fixed inset-0 z-[42]" style={{ background: 'radial-gradient(ellipse at 35% 45%, #1f2b4f 0%, #0b1026 55%, #030512 100%)' }} />}
            {lab === 'builder' && <div className="fixed inset-0 z-[42]" style={{ background: 'radial-gradient(ellipse at 35% 45%, #1e2a5a 0%, #0b1026 50%, #030512 100%)' }} />}

            {canvasOn && webgl && !contextLost && (
                <Suspense fallback={null}>
                    <Stage3D
                        mode={mode} warmKey={warmKey} onReady={setReady} onTier={setTier} onContextLost={() => setContextLost(true)}
                        active={!!intro || lens === 'state' || burstOn} rects={rects} fx={fx.current} intro={intro}
                        selected={selected} closing={closing} onClosed={onStageClosed} live={live} experiment={experiment} expPower={expPower}
                        cloud={cloud} tempC={ctx.tempC} onCue={onCue} lab={lab} fwApi={fwApi} onBoom={() => playBoom()} builder={bp}
                        cityProp={cityProp} onCityPick={(e) => { setLab(null); openElement(e); }} kitchen={{ counts: kCounts, recipe: kRecipe }}
                    />
                </Suspense>
            )}
            {contextLost && (
                <button onClick={() => window.location.reload()} className="fixed inset-x-0 bottom-6 mx-auto w-fit z-[70] px-5 py-3 rounded-full bg-amber-300 text-slate-900 font-bold">Đồ họa bị gián đoạn — chạm để tải lại</button>
            )}

            {selected && !closing && (
                <>
                    <button onClick={closeElement} className="fixed top-3 left-3 z-[56] flex items-center gap-1.5 h-11 px-4 rounded-full bg-slate-900/70 border border-white/15 text-white backdrop-blur-md"><ArrowLeft size={18} /> Bảng tuần hoàn</button>
                    {!elementReady && <div className="fixed left-0 right-0 top-1/3 z-[56] text-center text-white/80 animate-pulse">Đang mở tủ mẫu vật…</div>}
                    <ElementSheet el={selected} compact={young} autoSpeak={autoSpeak} portrait={portrait} experiment={experiment} onExperiment={chooseExperiment}
                        onReplay={() => { live.expStart = performance.now(); }} power={expPower} onPower={() => { setExpPower(p => !p); playZap(); }} onVoice={voice}
                        onPrev={() => selected.atomicNumber > 1 && openElement(byZ(selected.atomicNumber - 1)!)} onNext={() => selected.atomicNumber < 118 && openElement(byZ(selected.atomicNumber + 1)!)}
                        onClose={closeElement} onInfographic={() => setInfographic(selected.infographicPath)} studentName={currentStudent?.name} />
                    <ScaleHud el={selected} level={level} onLevel={(l) => { live.zoom = l; }} cloud={cloud} onCloud={() => setCloud(c => !c)} portrait={portrait} disabled={!!experiment} />
                </>
            )}

            {lab === 'fireworks' && <FireworksUI picks={picks} setPicks={setPicks} shape={shape} setShape={setShape} done={col.fireworks} onBack={() => setLab(null)} lastMsg={fwMsg} />}
            {lab === 'city' && <CityUI prop={cityProp} setProp={setCityProp} onBack={() => setLab(null)} />}
            {lab === 'kitchen' && <KitchenUI counts={kCounts as Record<string, number>} set={(a, d) => { playBlip(); setKCounts(c => ({ ...c, [a]: Math.max(0, Math.min(6, (c[a as keyof Counts] ?? 0) + d)) })); }} clear={() => setKCounts({})} found={kFound} recipe={kRecipe} hint={kHint} onBack={() => setLab(null)} atoms={ATOMS} recipes={RECIPES} />}
            {lab === 'builder' && <BuilderUI p={bp.p} n={bp.n} e={bp.e} set={setB} reset={() => setBp({ p: 1, n: 0, e: 1 })} level={bLevel} setLevel={(l) => { setBLevel(l); setBGoal(0); }} goalIndex={bGoal} onBack={() => setLab(null)} built={col.built.length} />}

            {game === 'find' && <FindGame easy={young} register={register} setMarks={setMarks} onDone={(s) => onGameDone(s, 'find')} onClose={endGame} />}
            {game === 'coord' && <CoordGame easy={young} register={register} setMarks={setMarks} onDone={(s) => onGameDone(s, 'coord')} onClose={endGame} />}
            {game === 'scale' && <ScaleGame onClose={endGame} onDone={(s) => onGameDone(s, 'scale')} />}
            {game === 'state' && <StateGame onClose={endGame} />}

            {gamesMenu && (
                <Frame title="🎮 Chơi và khám phá" onClose={() => setGamesMenu(false)}>
                    <p className="text-sm font-bold mb-2">🧪 Phòng thí nghiệm</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button onClick={() => openLab('fireworks')} className="rounded-2xl p-3 text-left bg-gradient-to-br from-rose-500/30 to-amber-400/20 border border-white/15 hover:border-white/40"><p className="text-2xl">🎆</p><b>Pháo hoa giao thừa</b><p className="text-xs text-white/60">Pha muối kim loại để có màu pháo hoa</p></button>
                        <button onClick={() => openLab('builder')} className="rounded-2xl p-3 text-left bg-gradient-to-br from-cyan-500/30 to-indigo-500/20 border border-white/15 hover:border-white/40"><p className="text-2xl">⚛️</p><b>Xưởng nguyên tử</b><p className="text-xs text-white/60">Lắp proton, nơtron, electron</p></button>
                        <button onClick={() => openLab('kitchen')} className="rounded-2xl p-3 text-left bg-gradient-to-br from-emerald-500/30 to-sky-500/20 border border-white/15 hover:border-white/40"><p className="text-2xl">🧪</p><b>Bếp phân tử</b><p className="text-xs text-white/60">Ghép nguyên tử thành nước, muối, khí CO₂…</p></button>
                        <button onClick={() => openLab('city')} className="rounded-2xl p-3 text-left bg-gradient-to-br from-fuchsia-500/30 to-amber-400/20 border border-white/15 hover:border-white/40"><p className="text-2xl">🏙️</p><b>Thành phố nguyên tố</b><p className="text-xs text-white/60">Bảng dựng đứng thành các tòa nhà</p></button>
                    </div>
                    <p className="text-sm font-bold mb-2">🎮 Trò chơi</p>
                    <div className="grid grid-cols-2 gap-2">
                        {GAMES.map(g => (
                            <button key={g.id} onClick={() => { setGamesMenu(false); setGame(g.id); }} className="rounded-2xl p-3 text-left bg-white/5 border border-white/15 hover:border-white/40"><p className="text-2xl">{g.icon}</p><b>{g.label}</b><p className="text-xs text-white/60">{g.desc}</p></button>
                        ))}
                    </div>
                    <p className="text-xs text-white/50 mt-3"><FlaskConical size={12} className="inline" /> Nguyên tố của ngày: <button className="underline" onClick={() => { setGamesMenu(false); openElement(day); }}>{day.sgkName}</button></p>
                </Frame>
            )}
            {cabinet && <Cabinet col={col} badges={badges} onOpen={(e) => { setCabinet(false); openElement(e); }} onInfographic={(e) => setInfographic(e.infographicPath)} onClose={() => setCabinet(false)} />}

            {intro && <IntroOverlay caption={youBeat ? null : caption} onSkip={skipIntro} flash={flash} />}
            {infographic && <InfographicViewer url={infographic} onClose={() => setInfographic(null)} />}
            {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
            {legacyEl && <Suspense fallback={null}><ElementDetail element={legacyEl} onClose={() => setLegacyEl(null)} /></Suspense>}
            {toast && <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[80] max-w-[92vw] px-5 py-3 rounded-2xl bg-slate-900/95 border border-amber-300/50 text-amber-100 shadow-2xl text-sm sm:text-base ptable-fade-in">{toast}</div>}
            {import.meta.env.DEV && tier === 'low' && <div className="fixed bottom-1 left-1 z-[90] text-[10px] text-white/30">tier thấp</div>}
        </div>
    );
};

const ELEMENT_TINT = (e: ElementFull) => ({ 'alkali-metal': '#FF6B6B', 'alkaline-earth': '#FFA94D', 'transition-metal': '#FFD43B', 'post-transition': '#69DB7C', 'metalloid': '#38D9A9', 'nonmetal': '#4DABF7', 'halogen': '#748FFC', 'noble-gas': '#DA77F2', 'lanthanide': '#F783AC', 'actinide': '#E599F7', 'unknown': '#868E96' } as Record<string, string>)[e.category];
