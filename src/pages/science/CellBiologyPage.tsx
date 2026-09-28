import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ZoomIn, ZoomOut, Tag, Volume2, VolumeX, Clapperboard, ChevronUp } from 'lucide-react';
import { CELL_DATA, Organelle } from '@/src/data/cellData';
import { CELL_STORIES, CellId } from '@/src/data/cellStory';
import { CELL_BADGE_STARS } from '@/src/data/cellQuizData';
import { CellCanvas } from '@/src/components/cell/CellCanvas';
import { DetailPanel } from '@/src/components/cell/DetailPanel';
import { CellScene3D } from '@/src/components/cell/scene3d/CellScene3D';
import { createSimClock, Scene3DApi, supportsWebGL } from '@/src/components/cell/scene3d/core';
import { INTRO_DISABLED, prefersReducedMotion } from '@/src/components/cell/scene3d/params';
import { LabScreen } from '@/src/components/cell/ui/LabScreen';
import { MicroscopeHud } from '@/src/components/cell/ui/MicroscopeHud';
import { OrganelleCard } from '@/src/components/cell/ui/OrganelleCard';
import { FindGameOverlay } from '@/src/components/cell/ui/FindGameOverlay';
import { useFindGame } from '@/src/components/cell/ui/useFindGame';
import { CellNotebook } from '@/src/components/cell/ui/CellNotebook';
import { WateringPanel } from '@/src/components/cell/ui/WateringPanel';
import { DoublingFinale, TimelinePanel } from '@/src/components/cell/ui/TimelinePanel';
import { MITOSIS_STAGES } from '@/src/data/mitosisStages';
import { doublingRows, FISSION_STAGES } from '@/src/data/fissionStages';
import { loadNotebook, markSeen, Notebook } from '@/src/components/cell/notebookStore';
import { playBlip } from '@/src/components/solar/sfx';
import { MusicControls } from '@/src/components/MusicControls';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { musicManager } from '@/services/musicManager';
import { cancelSpeech, speak } from '@/src/utils/speech';
import { Grade } from '@/types';

type Mode = 'explore' | 'find' | 'water' | 'divide' | 'fission';

const INTRO_KEY = 'cellDiveSeen';

function introSeen(id: CellId): boolean {
    try { return (sessionStorage.getItem(INTRO_KEY) ?? '').split(',').includes(id); } catch { return false; }
}
function markIntroSeen(id: CellId): void {
    try {
        const cur = (sessionStorage.getItem(INTRO_KEY) ?? '').split(',').filter(Boolean);
        if (!cur.includes(id)) sessionStorage.setItem(INTRO_KEY, [...cur, id].join(','));
    } catch { /* chế độ riêng tư */ }
}

function soundOn(): boolean {
    try { return musicManager.getMusicState().soundEnabled; } catch { return true; }
}

export const CellBiologyPage: React.FC = () => {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();
    const { updateStudent } = useStudentActions();

    const [phase, setPhase] = useState<'lab' | 'scope'>('lab');
    const [pickedId, setPickedId] = useState<CellId | null>(null);
    const [enteredScope, setEnteredScope] = useState(false); // Canvas mount 1 lần (đổi mẫu không tạo context mới)
    const [cellId, setCellId] = useState<CellId>('animal');
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [cardId, setCardId] = useState<string | null>(null);
    const [intro, setIntro] = useState(false);
    const [introPlaying, setIntroPlaying] = useState(false);
    const [mode, setMode] = useState<Mode>('explore');
    const [labelsOn, setLabelsOn] = useState(true);
    const [autoSpeak, setAutoSpeak] = useState(() => (currentStudent?.grade ?? Grade.Grade2) <= Grade.Grade1);
    const [showNotebook, setShowNotebook] = useState(false);
    const [water, setWater] = useState(100);
    const [menuOpen, setMenuOpen] = useState(false);
    const [contextLost, setContextLost] = useState(false);
    const [portrait, setPortrait] = useState(() => window.innerHeight >= window.innerWidth);
    const [compact, setCompact] = useState(() => window.innerWidth < 640);
    const [toolsOpen, setToolsOpen] = useState(() => window.innerWidth >= 640);
    const [notebook, setNotebook] = useState<Notebook>(() => loadNotebook(currentStudent?.id));
    const [legacyOrganelle, setLegacyOrganelle] = useState<Organelle | null>(null); // chế độ 2D
    const [readyCell, setReadyCell] = useState<CellId | null>(null); // shader của mẫu này đã biên dịch xong

    useEffect(() => { setNotebook(loadNotebook(currentStudent?.id)); }, [currentStudent?.id]);
    useEffect(() => {
        const onResize = () => {
            setPortrait(window.innerHeight >= window.innerWidth);
            setCompact(window.innerWidth < 640);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    useEffect(() => () => cancelSpeech(), []);

    const clockRef = useRef(createSimClock());
    const sceneApiRef = useRef<Scene3DApi | null>(null);
    const use2D = useMemo(() => new URLSearchParams(window.location.search).get('view') === '2d' || !supportsWebGL(), []);

    const cell = CELL_DATA.find((c) => c.id === cellId) ?? CELL_DATA[0];
    const story = CELL_STORIES[cellId];
    const badges = currentStudent?.cellBadges ?? [];
    const cardOrganelle = cardId ? cell.organelles.find((o) => o.id === cardId) ?? null : null;
    const seenCount = cell.organelles.filter((o) => notebook[cellId].includes(o.id)).length;

    const game = useFindGame({
        cell,
        easy: (currentStudent?.grade ?? Grade.Grade2) <= Grade.Grade2,
        hasBadge: badges.includes(cellId),
        onAward: () => {
            if (!currentStudent || currentStudent.cellBadges?.includes(cellId)) return;
            updateStudent({
                ...currentStudent,
                stars: currentStudent.stars + CELL_BADGE_STARS,
                cellBadges: [...(currentStudent.cellBadges ?? []), cellId]
            });
        },
        onCorrect: (id) => {
            setFocusedId(id);
            setNotebook((nb) => markSeen(nb, cellId, id, currentStudent?.id)); // tìm đúng = cũng đã khám phá
        },
        onRoundStart: () => setFocusedId(null)
    });

    // ---- chuyển cảnh ----
    const beginDive = useCallback((id: CellId) => {
        const dive = !use2D && !INTRO_DISABLED && !prefersReducedMotion() && !introSeen(id);
        setIntro(dive);
        setIntroPlaying(dive);
        if (dive) markIntroSeen(id);
    }, [use2D]);

    const resetTimelines = () => {
        for (const which of ['mitosis', 'fission'] as const) {
            const tl = sceneApiRef.current?.timeline(which);
            if (tl) { tl.t = 0; tl.playing = false; }
        }
    };

    const startTimeline = (m: 'divide' | 'fission') => {
        closeCard();
        resetTimelines();
        setMode(m);
        const tl = sceneApiRef.current?.timeline(m === 'divide' ? 'mitosis' : 'fission');
        if (tl) { tl.t = 0; tl.playing = true; }
    };

    const stopTimeline = () => {
        resetTimelines();
        setMode('explore');
    };

    const readMitosis = useCallback(() => sceneApiRef.current?.timeline('mitosis') ?? null, []);
    const readFission = useCallback(() => sceneApiRef.current?.timeline('fission') ?? null, []);

    const resetView = () => {
        cancelSpeech();
        setCardId(null);
        setFocusedId(null);
        setMenuOpen(false);
        if (game.active) game.exit();
        setMode('explore');
        setWater(100);
        sceneApiRef.current?.setWater(1);
        resetTimelines();
    };

    const pickSpecimen = (id: CellId) => {
        if (pickedId) return;
        playBlip();
        setPickedId(id);
        setCellId(id);
        // quyết định cảnh lặn NGAY (trước khi Canvas mount) → camera bắt đầu ở ngoài xa từ frame đầu,
        // mô và tế bào cùng được biên dịch shader một lượt trong lúc phòng thí nghiệm mờ đi
        beginDive(id);
        setEnteredScope(true);
        window.setTimeout(() => {
            setPhase('scope');
            setPickedId(null);
        }, 650);
    };

    const switchCell = (id: CellId) => {
        resetView();
        if (id === cellId) return;
        setCellId(id);
        beginDive(id);
    };

    const backToLab = () => {
        resetView();
        setIntro(false);
        setIntroPlaying(false);
        setPhase('lab');
    };

    const replayDive = () => {
        resetView();
        setIntro(false);
        // tắt rồi bật lại ở frame sau để camera rig nhận lượt lặn mới
        window.setTimeout(() => { setIntro(true); setIntroPlaying(true); }, 30);
    };

    const onIntroEnd = () => {
        setIntro(false);
        setIntroPlaying(false);
        if (soundOn()) speak(story.arrive, { lang: 'vi-VN', rate: 0.92 });
    };

    // ---- chọn bào quan ----
    const handleSelect = useCallback((id: string) => {
        if (use2D) {
            const o = cell.organelles.find((x) => x.id === id);
            if (o) setLegacyOrganelle(o);
            return;
        }
        if (introPlaying) return;
        if (mode === 'find') { game.pick(id); return; }
        if (mode !== 'explore') return; // đang thí nghiệm: giữ nguyên góc nhìn toàn tế bào
        playBlip();
        cancelSpeech();
        setCardId(null);
        setFocusedId(id);
        setNotebook((nb) => markSeen(nb, cellId, id, currentStudent?.id));
    }, [use2D, cell, introPlaying, mode, game, cellId, currentStudent?.id]);

    const handleFocusComplete = useCallback((id: string) => {
        if (mode === 'find') return;
        setCardId(id);
    }, [mode]);

    const closeCard = () => {
        cancelSpeech();
        setCardId(null);
        setFocusedId(null);
    };

    const handleBackground = () => {
        if (mode === 'find' || introPlaying) return;
        if (focusedId) closeCard();
    };

    const stepCard = (dir: 1 | -1) => {
        const list = cell.organelles;
        const i = Math.max(0, list.findIndex((o) => o.id === cardId));
        const next = list[(i + dir + list.length) % list.length];
        handleSelect(next.id);
    };

    const startFind = () => {
        closeCard();
        setMode('find');
        setWater(100);
        sceneApiRef.current?.setWater(1);
        game.start();
    };

    const exitFind = () => {
        game.exit();
        setMode('explore');
        setFocusedId(null);
    };

    const startWater = () => {
        closeCard();
        setMode('water');
    };

    const stopWater = () => {
        setMode('explore');
        setWater(100);
        sceneApiRef.current?.setWater(1);
    };

    const changeWater = (v: number) => {
        setWater(v);
        sceneApiRef.current?.setWater(v / 100);
    };

    const handleHeaderBack = () => {
        if (phase === 'scope') backToLab();
        else navigate('/science');
    };

    const cardIndex = cardOrganelle ? cell.organelles.findIndex((o) => o.id === cardOrganelle.id) : 0;
    const sceneReady = use2D || readyCell === cellId;
    const showChrome = phase === 'scope' && !introPlaying && sceneReady;
    const findActive = mode === 'find' && game.active;

    return (
        <div className="min-h-screen h-screen bg-slate-950 text-white overflow-hidden relative select-none">
            {/* === LỚP SCENE 3D BỀN (mount 1 lần, đổi tế bào không tạo WebGL context mới) === */}
            {enteredScope && !use2D && (
                <div className={`absolute inset-0 z-0 ${phase === 'scope' && introPlaying ? 'cell-focus-pull' : ''}`}>
                    <CellScene3D
                        cellType={cell}
                        focusedId={focusedId}
                        working={cardId}
                        onSelect={handleSelect}
                        onBackground={handleBackground}
                        onFocusComplete={handleFocusComplete}
                        clock={clockRef.current}
                        paused={phase === 'lab' && !pickedId}
                        apiRef={sceneApiRef}
                        onContextLost={() => setContextLost(true)}
                        intro={intro}
                        onIntroEnd={onIntroEnd}
                        framing={cardId ? (portrait ? 'upper' : 'left') : 'center'}
                        labelsHidden={!labelsOn || findActive || (mode !== 'explore' && mode !== 'find')}
                        experiment={mode === 'divide' ? 'divide' : mode === 'fission' ? 'fission' : null}
                        onReady={(id) => setReadyCell(id as CellId)}
                    />
                </div>
            )}

            {/* Thị kính kính hiển vi trong cảnh lặn: vòng tròn sáng nở rộng dần, chạm để bỏ qua */}
            {/* Đang biên dịch shader lần đầu (máy chưa có cache) — màn chờ nhẹ bằng CSS */}
            {phase === 'scope' && !sceneReady && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_50%_45%,#0e3a4a_0%,#050b16_70%)]">
                    <div className="relative w-28 h-28">
                        <div className="absolute inset-0 rounded-full border-4 border-cyan-300/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-300 animate-spin" />
                        <div className="absolute inset-3 rounded-full bg-cyan-300/10 blur-md animate-pulse" />
                        <span className="absolute inset-0 flex items-center justify-center text-4xl">🔬</span>
                    </div>
                    <p className="text-white font-black text-lg">Đang chỉnh tiêu cự kính hiển vi…</p>
                    <p className="text-white/55 text-sm">{story.compare}</p>
                </div>
            )}

            {phase === 'scope' && introPlaying && sceneReady && (
                <div className="absolute inset-0 z-20 cursor-pointer" onPointerDown={() => sceneApiRef.current?.skipIntro()}>
                    <div className="absolute inset-0 cell-eyepiece pointer-events-none" />
                    <div className="absolute inset-x-0 top-20 sm:top-24 flex flex-col items-center text-center px-4 pointer-events-none">
                        <p className="text-[11px] tracking-[0.3em] font-bold text-cyan-200/90">ĐANG LẶN VÀO MẪU VẬT</p>
                        <p className="mt-1 text-lg sm:text-2xl font-black drop-shadow-lg">{story.tissue}</p>
                    </div>
                    <span className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs text-white/85 bg-black/45 border border-white/15 backdrop-blur-sm animate-pulse">
                        Chạm để bỏ qua
                    </span>
                </div>
            )}

            {/* === Header === */}
            <header className="absolute top-0 left-0 right-0 z-[60] p-3 sm:p-4 flex items-start gap-2 pointer-events-none">
                <button
                    onClick={handleHeaderBack}
                    className="pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md border border-white/15 transition-all"
                    aria-label={phase === 'scope' ? 'Về phòng thí nghiệm' : 'Quay lại'}
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline text-sm font-bold">{phase === 'scope' ? 'Phòng thí nghiệm' : 'Khoa học'}</span>
                </button>

                {/* Tiêu đề giữa chỉ trên màn rộng; màn hẹp gộp tên mẫu vào nút đổi mẫu (tránh đè nhau) */}
                {phase === 'scope' && !compact && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-3 sm:top-4 flex items-center gap-2 px-4 sm:px-5 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: story.accent, boxShadow: `0 0 10px ${story.accent}` }} />
                        <h1 className="text-base sm:text-xl font-black whitespace-nowrap">{story.specimen}</h1>
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2 pointer-events-auto">
                    {phase === 'scope' && (
                        <div className="relative">
                            <button
                                onClick={() => { if (showChrome && !findActive) setMenuOpen((v) => !v); }}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md border border-white/15 transition-all disabled:opacity-60"
                                aria-expanded={menuOpen}
                                aria-label="Đổi mẫu vật"
                                disabled={!showChrome || findActive}
                            >
                                {compact && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: story.accent }} />}
                                <span className="text-sm font-bold whitespace-nowrap">{compact ? story.specimen : 'Đổi mẫu'}</span>
                                <ChevronDown size={16} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-52 bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-xl">
                                    {(['animal', 'plant', 'bacteria'] as CellId[]).map((id) => (
                                        <button
                                            key={id}
                                            onClick={() => switchCell(id)}
                                            className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2.5 hover:bg-white/10 transition-colors ${id === cellId ? 'font-black' : ''}`}
                                        >
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CELL_STORIES[id].accent }} />
                                            {CELL_STORIES[id].specimen}
                                            {badges.includes(id) && <span className="ml-auto">🏅</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <MusicControls />
                </div>
            </header>

            {/* === Phòng thí nghiệm (chọn mẫu) === */}
            {phase === 'lab' && (
                <LabScreen notebook={notebook} badges={badges} pickedId={pickedId} onPick={pickSpecimen} />
            )}

            {/* === Kính hiển vi === */}
            {phase === 'scope' && (
                <>
                    {use2D && (
                        <div className="absolute inset-0 flex items-center justify-center pt-20">
                            <CellCanvas cellType={cell} onOrganelleClick={(o) => setLegacyOrganelle(o)} />
                            <DetailPanel organelle={legacyOrganelle} onClose={() => setLegacyOrganelle(null)} />
                        </div>
                    )}

                    {!use2D && !introPlaying && sceneReady && <MicroscopeHud apiRef={sceneApiRef} umPerUnit={story.umPerUnit} compact={compact} />}

                    {/* Hộp công cụ */}
                    {showChrome && !use2D && !findActive && !cardOrganelle && (
                        toolsOpen ? (
                            <div className="absolute top-20 left-3 sm:left-4 z-50 flex flex-col gap-2 animate-[cellCardIn_0.25s_ease-out]">
                                <ToolButton onClick={startFind} highlight title="Trò chơi tìm bộ phận">
                                    <span className="text-lg leading-none">🎯</span>
                                    <span className="text-xs font-black">Truy tìm</span>
                                    {badges.includes(cellId) && <span className="text-xs">🏅</span>}
                                </ToolButton>
                                {cellId === 'plant' && (
                                    <ToolButton onClick={mode === 'water' ? stopWater : startWater} active={mode === 'water'} title="Thí nghiệm tưới nước">
                                        <span className="text-lg leading-none">💧</span>
                                        <span className="text-xs font-black">Tưới nước</span>
                                    </ToolButton>
                                )}
                                {cellId === 'animal' && (
                                    <ToolButton onClick={mode === 'divide' ? stopTimeline : () => startTimeline('divide')} active={mode === 'divide'} title="Thí nghiệm phân chia tế bào">
                                        <span className="text-lg leading-none">🧬</span>
                                        <span className="text-xs font-black">Phân chia</span>
                                    </ToolButton>
                                )}
                                {cellId === 'bacteria' && (
                                    <ToolButton onClick={mode === 'fission' ? stopTimeline : () => startTimeline('fission')} active={mode === 'fission'} title="Thí nghiệm vi khuẩn nhân đôi">
                                        <span className="text-lg leading-none">✂️</span>
                                        <span className="text-xs font-black">Nhân đôi</span>
                                    </ToolButton>
                                )}
                                <ToolButton onClick={() => setShowNotebook(true)} title="Sổ tay khám phá">
                                    <span className="text-lg leading-none">📒</span>
                                    <span className="text-xs font-black">Sổ tay {seenCount}/{cell.organelles.length}</span>
                                </ToolButton>
                                <div className="flex gap-2">
                                    <RoundButton onClick={() => setLabelsOn((v) => !v)} active={labelsOn} title={labelsOn ? 'Ẩn nhãn tên' : 'Hiện nhãn tên'}>
                                        <Tag size={18} />
                                    </RoundButton>
                                    <RoundButton onClick={() => setAutoSpeak((v) => !v)} active={autoSpeak} title={autoSpeak ? 'Tắt tự đọc' : 'Bật tự đọc'}>
                                        {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                    </RoundButton>
                                    <RoundButton onClick={replayDive} title="Xem lại chuyến lặn">
                                        <Clapperboard size={18} />
                                    </RoundButton>
                                </div>
                                {compact && (
                                    <button onClick={() => setToolsOpen(false)} className="self-start flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/30 border border-white/15 text-white/70 text-[11px] font-bold">
                                        <ChevronUp size={14} /> Thu gọn
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button onClick={() => setToolsOpen(true)} className="absolute top-20 left-3 z-50 flex items-center gap-2 px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                                <span className="text-lg leading-none">🧰</span>
                                <span className="text-xs font-bold">Công cụ</span>
                                <ChevronDown size={14} />
                            </button>
                        )
                    )}

                    {/* Zoom (máy bàn; điện thoại đã có pinch) */}
                    {showChrome && !use2D && !compact && !cardOrganelle && (
                        <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-2">
                            <RoundButton onClick={() => sceneApiRef.current?.zoomIn()} title="Phóng to"><ZoomIn size={20} /></RoundButton>
                            <RoundButton onClick={() => sceneApiRef.current?.zoomOut()} title="Thu nhỏ"><ZoomOut size={20} /></RoundButton>
                        </div>
                    )}

                    {showChrome && !use2D && !cardOrganelle && mode === 'explore' && (
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 text-white/50 text-[11px] sm:text-xs pointer-events-none text-center px-4 hidden sm:block">
                            Kéo để xoay · cuộn hoặc chụm hai ngón để phóng to · chạm vào một bộ phận để khám phá
                        </div>
                    )}

                    {cardOrganelle && mode === 'explore' && (
                        <OrganelleCard
                            organelle={cardOrganelle}
                            index={cardIndex}
                            total={cell.organelles.length}
                            seen={seenCount}
                            layout={portrait ? 'bottom' : 'side'}
                            autoSpeak={autoSpeak}
                            onPrev={() => stepCard(-1)}
                            onNext={() => stepCard(1)}
                            onClose={closeCard}
                        />
                    )}

                    {mode === 'water' && <WateringPanel water={water} onChange={changeWater} onClose={stopWater} />}
                    {mode === 'divide' && (
                        <TimelinePanel
                            heading="🧬 THÍ NGHIỆM: PHÂN CHIA TẾ BÀO"
                            stages={MITOSIS_STAGES}
                            read={readMitosis}
                            autoSpeak={autoSpeak}
                            onClose={stopTimeline}
                            note="Người có 46 nhiễm sắc thể — mô phỏng vẽ 4 cặp (hồng từ mẹ, xanh từ bố) cho dễ nhìn."
                        />
                    )}
                    {mode === 'fission' && (
                        <TimelinePanel
                            heading="✂️ THÍ NGHIỆM: VI KHUẨN NHÂN ĐÔI"
                            stages={FISSION_STAGES}
                            read={readFission}
                            autoSpeak={autoSpeak}
                            onClose={stopTimeline}
                            finale={<DoublingFinale rows={doublingRows()} />}
                        />
                    )}

                    <FindGameOverlay game={game} cellName={story.specimen} accent={story.accent} onClose={exitFind} />
                </>
            )}

            {showNotebook && (
                <CellNotebook
                    notebook={notebook}
                    badges={badges}
                    current={cellId}
                    onOpenCell={(id) => { setShowNotebook(false); switchCell(id); }}
                    onClose={() => setShowNotebook(false)}
                />
            )}

            {contextLost && (
                <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center gap-4 cursor-pointer" onClick={() => window.location.reload()}>
                    <span className="text-5xl">🔬</span>
                    <p className="text-white text-xl font-bold">Ôi! Kính hiển vi gặp trục trặc nhỏ.</p>
                    <p className="text-white/70">Chạm vào màn hình để tải lại nhé!</p>
                </div>
            )}

            <style>{`
                @keyframes cellCardIn { from { opacity: 0; translate: 0 14px; scale: 0.98; } to { opacity: 1; translate: 0 0; scale: 1; } }
                @keyframes cellConfetti { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(520px) rotate(540deg); opacity: 0; } }
                @keyframes cellEyepiece { 0% { --eye: 30%; } 100% { --eye: 140%; } }
                @property --eye { syntax: '<percentage>'; inherits: false; initial-value: 30%; }
                .cell-eyepiece {
                    background: radial-gradient(circle at 50% 52%, transparent calc(var(--eye) - 2%), rgba(2, 6, 12, 0.6) var(--eye), #01040a calc(var(--eye) + 12%));
                    animation: cellEyepiece 6.2s cubic-bezier(0.5, 0, 0.3, 1) forwards;
                }
                @keyframes cellFocusPull { 0% { filter: blur(7px) saturate(0.7); } 30% { filter: blur(0) saturate(1); } 100% { filter: none; } }
                .cell-focus-pull { animation: cellFocusPull 2.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

const ToolButton: React.FC<{ onClick: () => void; title: string; active?: boolean; highlight?: boolean; children: React.ReactNode }> = ({ onClick, title, active, highlight, children }) => (
    <button
        onClick={onClick}
        title={title}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full backdrop-blur-md border text-white transition-all shadow-lg ${highlight
            ? 'bg-gradient-to-r from-amber-500/85 to-orange-600/85 border-amber-200/40 hover:from-amber-400/85 hover:to-orange-500/85'
            : active ? 'bg-sky-500/30 border-sky-300/60' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
    >
        {children}
    </button>
);

const RoundButton: React.FC<{ onClick: () => void; title: string; active?: boolean; children: React.ReactNode }> = ({ onClick, title, active, children }) => (
    <button
        onClick={onClick}
        title={title}
        aria-label={title}
        aria-pressed={active}
        className={`w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md border text-white transition-all ${active ? 'bg-white/25 border-white/40' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
    >
        {children}
    </button>
);
