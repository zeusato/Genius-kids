import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, ChevronDown, ChevronUp, Pause, Rocket, Eye, EyeOff } from 'lucide-react';
import { PlanetDetail } from '../components/solar/PlanetDetail';
import { Legacy2DView } from '../components/solar/Legacy2DView';
import { SolarCollection } from '../components/solar/SolarCollection';
import { TrueScaleOverlay } from '../components/solar/TrueScaleOverlay';
import { PlanetCutaway } from '../components/solar/PlanetCutaway';
import { TourCard } from '../components/solar/TourCard';
import { BodyInfoCard, InfoBodyView } from '../components/solar/BodyInfoCard';
import { SOLAR_TOUR } from '../data/solarTour';
import { useStudent } from '../contexts/StudentContext';
import { COLLECTIBLE_BODY_IDS } from '../data/solarQuizData';
import { Scene3D } from '../components/solar/scene3d/Scene3D';
import { createSimClock, Scene3DApi, supportsWebGL } from '../components/solar/scene3d/core';
import { INTRO_DISABLED, overridePhase, prefersReducedMotion, sceneLighting, setSceneBrightness } from '../components/solar/scene3d/sceneParams';
import { heliocentricLongitude, REAL_POSITION_BODIES } from '../components/solar/scene3d/astro';
import { ArrivalCard } from '../components/solar/ArrivalCard';
import { SolarQuiz } from '../components/solar/SolarQuiz';
import { playBlip } from '../components/solar/sfx';
import { PlanetData, SOLAR_SYSTEM_DATA, SUN_DATA, ASTEROID_BELT_DATA, MOON_DATA, PLUTO_INFO, COMET_INFO } from '../data/solarData';
import { loadCustomPlanet, CustomPlanetDoc } from '../components/planetmaker/planetStore';
import { loadPublishedPlanet } from '../components/planetmaker/persistence/repository';
import { MusicControls } from '../components/MusicControls';

function lookupBody(id: string): PlanetData | null {
    if (id === 'sun') return SUN_DATA;
    if (id === 'asteroid-belt') return ASTEROID_BELT_DATA;
    return SOLAR_SYSTEM_DATA.find(p => p.id === id) ?? null;
}

// Tốc độ mô phỏng: ⏸ dừng / 🐢 1x / 🐇 5x / 🚀 20x — dạy chu kỳ quỹ đạo trực quan
const SPEED_OPTIONS: { value: number; label: string; title: string }[] = [
    { value: 1, label: '🐢', title: 'Tốc độ thường' },
    { value: 5, label: '🐇', title: 'Nhanh gấp 5 lần' },
    { value: 20, label: '🚀', title: 'Nhanh gấp 20 lần' }
];

export function SolarSystemPage() {
    const navigate = useNavigate();
    const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
    const [selectedInfo, setSelectedInfo] = useState<InfoBodyView | null>(null); // vệ tinh / hành tinh lùn / sao chổi
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [speed, setSpeed] = useState<number>(1);
    const [contextLost, setContextLost] = useState<boolean>(false);
    const [showCollection, setShowCollection] = useState<boolean>(false);
    const [showTrueScale, setShowTrueScale] = useState<boolean>(false);
    const [showCutaway, setShowCutaway] = useState<boolean>(false);
    const [tourIndex, setTourIndex] = useState<number | null>(null); // null = không tour
    const [tourReady, setTourReady] = useState<boolean>(false);      // camera đã bay tới chặng
    const touring = tourIndex !== null;
    // Chế độ "Tới nơi": bay xong KHÔNG mở modal ngay — hành tinh thật trong scene là nhân vật chính,
    // thẻ ArrivalCard chiếm phần còn lại; modal chi tiết chỉ mở khi bé bấm "Chi tiết".
    const [arrivedId, setArrivedId] = useState<string | null>(null);
    const [quizBody, setQuizBody] = useState<PlanetData | null>(null);
    const [showConstellations, setShowConstellations] = useState(false);
    const [stormNote, setStormNote] = useState(false);
    const [datePanel, setDatePanel] = useState(false);
    const [dateValue, setDateValue] = useState(() => new Date().toISOString().slice(0, 10));
    const [snapshotDate, setSnapshotDate] = useState<string | null>(null); // đang hiển thị vị trí thật ngày này
    const [portrait, setPortrait] = useState(() => window.innerHeight >= window.innerWidth);
    // Màn hẹp (điện thoại): cột công cụ mặc định gập lại, ẩn nút zoom (đã có pinch) để nhường chỗ cho cảnh
    const [compact, setCompact] = useState(() => window.innerWidth < 640);
    useEffect(() => {
        const onResize = () => {
            setPortrait(window.innerHeight >= window.innerWidth);
            setCompact(window.innerWidth < 640);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const [toolsOpen, setToolsOpen] = useState(() => window.innerWidth >= 640);
    const [uiHidden, setUiHidden] = useState(false);          // 👁 ẩn toàn bộ nút để ngắm cảnh
    const [brightness, setBrightness] = useState(sceneLighting.brightness);
    const [brightnessPanel, setBrightnessPanel] = useState(false);
    const changeBrightness = (v: number) => {
        setBrightness(v);
        setSceneBrightness(v); // scene đọc mỗi frame — không cần re-render Canvas
    };
    // Cảnh bay mở màn: mỗi phiên một lần, bỏ khi giảm chuyển động hoặc ?intro=0
    const [introActive, setIntroActive] = useState(() => {
        try {
            return !INTRO_DISABLED && !prefersReducedMotion() && sessionStorage.getItem('solarIntroSeen') !== '1';
        } catch {
            return false;
        }
    });
    const [introRequested] = useState(introActive);
    const endIntro = () => {
        setIntroActive(false);
        try { sessionStorage.setItem('solarIntroSeen', '1'); } catch { /* chế độ riêng tư */ }
    };
    const { currentStudent } = useStudent();
    const badgeCount = COLLECTIBLE_BODY_IDS.filter(
        id => currentStudent?.solarBadges?.includes(id)
    ).length;

    // Hành tinh bé tự nặn trong Xưởng Hành Tinh — chỉ hiện khi bé bật 🌌
    const [customPlanet, setCustomPlanet] = useState<CustomPlanetDoc | null>(null);
    useEffect(() => {
        let active = true;
        setCustomPlanet(null);
        loadPublishedPlanet(currentStudent?.id || 'guest').then(doc => {
            if (active) setCustomPlanet(doc || loadCustomPlanet(currentStudent?.id));
        }).catch(() => { if (active) setCustomPlanet(loadCustomPlanet(currentStudent?.id)); });
        return () => { active = false; };
    }, [currentStudent?.id]);
    const shownCustomPlanet = customPlanet?.showInSolar ? customPlanet : null;

    // Đồng hồ mô phỏng — ref thuần, UI ghi timeScale trực tiếp, không re-render mỗi frame
    const clockRef = useRef(createSimClock());
    const sceneApiRef = useRef<Scene3DApi | null>(null);

    // Fallback 2D: thiết bị không có WebGL hoặc ?view=2d
    const use2D = useMemo(
        () =>
            new URLSearchParams(window.location.search).get('view') === '2d' ||
            !supportsWebGL(),
        []
    );

    const handlePlanetSelect = (planetId: string) => {
        setIsMenuOpen(false);
        playBlip();
        // Hành tinh bé tự tạo → thẻ info nhẹ (không fly-to, không nằm trong registry)
        if (planetId === 'custom-planet' && customPlanet) {
            const treeCount = Math.floor(atob(customPlanet.trees).length / 2);
            setSelectedInfo({
                id: 'custom-planet',
                name: customPlanet.name,
                kindLabel: `Hành tinh do ${currentStudent?.name ?? 'bé'} tạo`,
                diameter: 'Do bé quyết định!',
                description: `${customPlanet.name} là hành tinh độc nhất vô nhị do chính tay ${currentStudent?.name ?? 'bé'} nặn ra trong Xưởng Hành Tinh — có núi non, biển cả${treeCount > 0 ? ` và ${treeCount} cây xanh` : ''}!`,
                facts: [
                    'Hành tinh này không có trong sách thiên văn nào — vì nó là của riêng bé!',
                    customPlanet.settlement ? `${customPlanet.settlement.name}: ${customPlanet.settlement.buildings} công trình, ${customPlanet.settlement.residents} cư dân. Ghé Xưởng Hành Tinh để xây tiếp!` : 'Muốn sửa núi non hay trồng thêm rừng, hãy quay lại Xưởng Hành Tinh nhé.',
                    'Có thể ẩn/hiện hành tinh trong mục Màu trời & trang trí của Xưởng.'
                ],
                funFact: 'Biết đâu sau này bé sẽ đặt tên cho một hành tinh THẬT — Hiệp hội Thiên văn Quốc tế vẫn tổ chức thi đặt tên thiên thể đấy!',
                color: customPlanet.cosmetics.atmosphere ?? '#7EC8E3',
                gradientColors: ['#9FE38B', '#3FA7D6', '#20486B']
            });
            return;
        }
        // Vệ tinh / hành tinh lùn / sao chổi: chấm nhỏ → mở thẻ info nhẹ ngay (không fly-to)
        const moon = MOON_DATA.find(m => m.id === planetId);
        if (moon) {
            setSelectedInfo({ ...moon, kindLabel: `Vệ tinh của ${moon.parentName}` });
            return;
        }
        if (planetId === 'pluto') { setSelectedInfo(PLUTO_INFO); return; }
        if (planetId === 'comet') { setSelectedInfo(COMET_INFO); return; }
        // 2D giữ hành vi cũ (mở thẻ ngay)
        if (use2D) {
            setSelectedPlanet(lookupBody(planetId));
            return;
        }
        // 3D: bay camera tới trước (NASA Eyes pattern) — kể cả vành đai (lướt giữa các viên đá)
        setArrivedId(null);
        setFocusedId(planetId);
    };

    const handleFocusComplete = (planetId: string) => {
        // Trong tour: bay tới nơi → hiện thẻ thuyết minh (không mở modal chi tiết)
        if (tourIndex !== null) {
            setTourReady(true);
            return;
        }
        setArrivedId(planetId);
    };

    const leaveArrival = () => {
        setArrivedId(null);
        setFocusedId(null);
        clockRef.current.timeScale = speed;
    };

    const arrivedBody = arrivedId ? lookupBody(arrivedId) : null;
    const hasBadge = (id: string) => !!currentStudent?.solarBadges?.includes(id);

    // 📅 Vị trí THẬT của các hành tinh vào một ngày (tham số quỹ đạo JPL). Đặt đồng hồ về 0 và dừng:
    // đây là "ảnh chụp" ngày đó — chạy tiếp thì chu kỳ đã nén làm vị trí lệch dần khỏi thực tế.
    const applySnapshot = (iso: string) => {
        const [y, m, d] = iso.split('-').map(Number);
        if (!y || !m || !d) return;
        const date = new Date(Date.UTC(y, m - 1, d, 12));
        for (const id of REAL_POSITION_BODIES) overridePhase(id, heliocentricLongitude(id, date));
        clockRef.current.t = 0;
        setSpeed(0);
        clockRef.current.timeScale = 0;
        setSnapshotDate(iso);
        setDatePanel(false);
        playBlip();
    };

    const triggerStorm = () => {
        sceneApiRef.current?.triggerStorm();
        setStormNote(true);
        playBlip();
    };

    // Tour điều khiển focusedId theo chặng
    useEffect(() => {
        if (tourIndex === null) return;
        setTourReady(false);
        setFocusedId(SOLAR_TOUR[tourIndex].id);
    }, [tourIndex]);

    const startTour = () => {
        setSelectedPlanet(null);
        setArrivedId(null);
        setShowCollection(false);
        setShowTrueScale(false);
        setIsMenuOpen(false);
        setTourIndex(0);
    };

    const nextTour = () => {
        if (tourIndex === null) return;
        if (tourIndex >= SOLAR_TOUR.length - 1) {
            exitTour();
            return;
        }
        setTourIndex(tourIndex + 1);
    };

    const exitTour = () => {
        setTourIndex(null);
        setTourReady(false);
        setFocusedId(null);
        clockRef.current.timeScale = speed;
    };

    const handleCloseDetail = () => {
        setSelectedPlanet(null);
        // Mở từ thẻ "Tới nơi" → đóng modal là quay lại hành tinh đang đứng (không bay về)
        if (arrivedId) return;
        setFocusedId(null);
        // Khôi phục tốc độ người dùng đã chọn (fly-to đã đặt timeScale = 0)
        clockRef.current.timeScale = speed;
    };

    const handleSpeedChange = (value: number) => {
        setSpeed(value);
        clockRef.current.timeScale = value;
    };

    const isPaused = speed === 0;

    return (
        <div className="w-full h-screen bg-black overflow-hidden relative">
            {/* Scene chính */}
            {use2D ? (
                <Legacy2DView selectedPlanet={selectedPlanet} onPlanetSelect={handlePlanetSelect} />
            ) : (
                <div className="absolute inset-0">
                    <Scene3D
                        focusedId={focusedId}
                        onPlanetSelect={handlePlanetSelect}
                        onFocusComplete={handleFocusComplete}
                        clock={clockRef.current}
                        paused={!!selectedPlanet || !!selectedInfo || !!quizBody || showTrueScale || showCutaway}
                        apiRef={sceneApiRef}
                        onContextLost={() => setContextLost(true)}
                        customPlanet={shownCustomPlanet}
                        arrivedId={touring ? (tourReady && tourIndex !== null ? SOLAR_TOUR[tourIndex].id : null) : arrivedId}
                        framing={touring ? 'upper' : arrivedId ? (portrait ? 'upper' : 'left') : 'center'}
                        showConstellations={showConstellations}
                        intro={introRequested}
                        onIntroEnd={endIntro}
                    />
                </div>
            )}

            {/* UI Controls */}
            {/* z-[60]: cao hơn cột nút bên dưới (z-50) — trước đây menu thả xuống bị cột nút đè */}
            {!uiHidden && <div className="absolute top-4 left-4 z-[60] flex gap-3 sm:gap-4">
                <button
                    onClick={() => navigate('/science')}
                    className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>

                {/* Planet Selection Dropdown — ẩn khi đang tour */}
                {!touring && <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`flex items-center gap-2 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all ${compact ? 'px-3' : 'px-4'}`}
                    >
                        <span className="text-sm font-semibold">{compact ? 'Thiên thể' : 'Chọn thiên thể'}</span>
                        <ChevronDown size={16} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden max-h-96 overflow-y-auto">
                            <button
                                onClick={() => handlePlanetSelect('sun')}
                                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/10"
                            >
                                <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]"></div>
                                <span className="font-semibold">Mặt Trời</span>
                            </button>

                            {SOLAR_SYSTEM_DATA.map((planet) => (
                                <button
                                    key={planet.id}
                                    onClick={() => handlePlanetSelect(planet.id)}
                                    className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/10"
                                >
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{
                                            backgroundColor: planet.color,
                                            boxShadow: `0 0 10px ${planet.color}80`
                                        }}
                                    ></div>
                                    <span className="text-sm">{planet.name}</span>
                                </button>
                            ))}

                            <button
                                onClick={() => handlePlanetSelect('asteroid-belt')}
                                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                            >
                                <div className="w-3 h-3 rounded-full bg-amber-700 shadow-[0_0_10px_rgba(180,83,9,0.6)]"></div>
                                <span className="text-sm">Vành Đai Tiểu Hành Tinh</span>
                            </button>

                            {shownCustomPlanet && (
                                <button
                                    onClick={() => handlePlanetSelect('custom-planet')}
                                    className="w-full px-4 py-3 text-left text-yellow-100 hover:bg-yellow-400/10 transition-colors flex items-center gap-3 border-t border-white/10"
                                >
                                    <span className="text-sm leading-none">⭐</span>
                                    <span className="text-sm font-semibold">{shownCustomPlanet.name}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>}
            </div>}

            {/* Góc phải: 👁 ẩn/hiện nút (luôn còn để bật lại) + nhạc */}
            <div className="absolute top-4 right-4 z-[60] flex items-center gap-2">
                {!use2D && (
                    <button
                        onClick={() => { setUiHidden((v) => !v); setIsMenuOpen(false); setBrightnessPanel(false); setDatePanel(false); }}
                        title={uiHidden ? 'Hiện các nút' : 'Ẩn các nút để ngắm cảnh'}
                        className={`p-2.5 sm:p-3 rounded-full backdrop-blur-md border text-white transition-all ${uiHidden ? 'bg-white/5 border-white/15 opacity-70 hover:opacity-100' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                    >
                        {uiHidden ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                )}
                {!uiHidden && <MusicControls />}
            </div>

            {/* Bộ sưu tập huy hiệu + Kích thước thật + Du hành */}
            {/* Màn hẹp + đang gập: chỉ một nút mở hộp công cụ */}
            {!selectedPlanet && !touring && !arrivedId && !uiHidden && !toolsOpen && (
                <button
                    onClick={() => setToolsOpen(true)}
                    title="Mở hộp công cụ"
                    className="absolute top-20 left-4 z-50 flex items-center gap-2 px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                >
                    <span className="text-lg leading-none">🧰</span>
                    <span className="text-xs font-bold">Công cụ</span>
                    <ChevronDown size={14} />
                </button>
            )}

            {!selectedPlanet && !touring && !arrivedId && !uiHidden && toolsOpen && (
                <div className="absolute top-20 left-4 z-50 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {!use2D && (
                        <button
                            onClick={startTour}
                            title="Tour có thuyết minh"
                            className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-blue-500/80 to-purple-600/80 backdrop-blur-md border border-white/20 rounded-full text-white hover:from-blue-400/80 hover:to-purple-500/80 transition-all shadow-lg"
                        >
                            <Rocket size={16} />
                            <span className="text-xs font-bold">Du hành</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowCollection(true)}
                        title="Bộ sưu tập huy hiệu"
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                    >
                        <span className="text-lg leading-none">🏆</span>
                        <span className="text-xs font-bold">{badgeCount}/{COLLECTIBLE_BODY_IDS.length}</span>
                    </button>
                    <button
                        onClick={() => setShowTrueScale(true)}
                        title="So sánh kích thước thật theo NASA"
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                    >
                        <span className="text-lg leading-none">🌍</span>
                        <span className="text-xs font-bold">Kích thước thật</span>
                    </button>
                    <button
                        onClick={() => setShowCutaway(true)}
                        title="Cắt hành tinh xem các lớp bên trong"
                        className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                    >
                        <span className="text-lg leading-none">🔪</span>
                        <span className="text-xs font-bold">Cắt hành tinh</span>
                    </button>

                    {/* Khám phá thêm: chòm sao thật · bão Mặt Trời → cực quang · vị trí thật theo ngày */}
                    {!use2D && (
                        <div className="relative flex gap-2">
                            <button
                                onClick={() => { setBrightnessPanel((v) => !v); setDatePanel(false); }}
                                title="Chỉnh độ sáng"
                                className={`w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md border text-lg transition-all ${brightnessPanel ? 'bg-yellow-300/25 border-yellow-200/60' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                            >
                                ☀️
                            </button>
                            <button
                                onClick={() => setShowConstellations((v) => !v)}
                                title="Chòm sao trên bầu trời thật"
                                className={`w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md border text-lg transition-all ${showConstellations ? 'bg-sky-400/30 border-sky-300/60' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                            >
                                ✨
                            </button>
                            <button
                                onClick={triggerStorm}
                                title="Bão Mặt Trời và cực quang"
                                className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-lg hover:bg-white/20 transition-all"
                            >
                                🌞
                            </button>
                            <button
                                onClick={() => { setDatePanel((v) => !v); setBrightnessPanel(false); }}
                                title="Các hành tinh ở đâu vào một ngày?"
                                className={`w-11 h-11 flex items-center justify-center rounded-full backdrop-blur-md border text-lg transition-all ${datePanel || snapshotDate ? 'bg-amber-400/25 border-amber-300/60' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                            >
                                📅
                            </button>
                            {brightnessPanel && (
                                <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/20 p-3 text-white shadow-xl">
                                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                                        <span>🌑 Thực tế</span>
                                        <span>☀️ Sáng rõ</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={Math.round(brightness * 100)}
                                        onChange={(e) => changeBrightness(Number(e.target.value) / 100)}
                                        className="w-full accent-yellow-300"
                                        aria-label="Độ sáng"
                                    />
                                    <p className="text-[11px] text-white/70 mt-2 leading-relaxed">
                                        Ngoài vũ trụ, phía hành tinh không được Mặt Trời chiếu thì tối đen. Kéo sang phải để nhìn rõ hơn nhé!
                                    </p>
                                </div>
                            )}
                            {datePanel && (
                                <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-white/20 p-3 text-white shadow-xl">
                                    <p className="text-xs text-white/80 mb-2 leading-relaxed">
                                        Chọn một ngày (ví dụ sinh nhật con) để xem các hành tinh <b>thật sự</b> nằm ở đâu quanh Mặt Trời hôm đó!
                                    </p>
                                    <input
                                        type="date"
                                        min="1800-01-01"
                                        max="2050-12-31"
                                        value={dateValue}
                                        onChange={(e) => setDateValue(e.target.value)}
                                        className="w-full mb-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white [color-scheme:dark]"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { const t = new Date().toISOString().slice(0, 10); setDateValue(t); applySnapshot(t); }}
                                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/10 border border-white/20 hover:bg-white/20"
                                        >
                                            Hôm nay
                                        </button>
                                        <button
                                            onClick={() => applySnapshot(dateValue)}
                                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600"
                                        >
                                            Xem
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={() => { setToolsOpen(false); setBrightnessPanel(false); setDatePanel(false); }}
                        title="Thu gọn hộp công cụ"
                        className="self-start flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/30 border border-white/15 text-white/70 text-[11px] font-semibold hover:bg-white/15 hover:text-white transition-all"
                    >
                        <ChevronUp size={14} /> Thu gọn
                    </button>
                </div>
            )}

            {/* Nhãn "ảnh chụp" vị trí thật theo ngày */}
            {snapshotDate && !touring && !arrivedId && !selectedPlanet && !uiHidden && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 mt-16 sm:mt-0 max-w-[92vw] px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-300/40 backdrop-blur-md text-amber-50 text-xs sm:text-sm text-center">
                    📅 {snapshotDate.split('-').reverse().join('/')} — {speed === 0
                        ? 'vị trí thật của các hành tinh ngày này (khoảng cách đã thu nhỏ)'
                        : 'đang chạy tiếp — vị trí sẽ lệch dần khỏi thực tế'}
                    <button onClick={() => setSnapshotDate(null)} className="ml-2 text-amber-200/80 hover:text-white">✕</button>
                </div>
            )}

            {/* Bão Mặt Trời — lời giải thích */}
            {stormNote && !touring && !selectedPlanet && !uiHidden && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-50 w-[min(560px,92vw)] rounded-2xl bg-slate-900/90 border border-orange-300/40 backdrop-blur-md p-4 text-white shadow-2xl animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">🌞</span>
                        <p className="text-sm leading-relaxed flex-1">
                            <b>Bão Mặt Trời!</b> Mặt Trời vừa phun ra một đám hạt khổng lồ. Khi tới Trái Đất, từ trường
                            dẫn chúng về hai cực, làm bầu trời sáng rực màu xanh lục — đó là <b>cực quang</b>.
                            (Ngoài đời, đám hạt mất 1–3 ngày mới bay tới nơi!)
                        </p>
                        <button onClick={() => setStormNote(false)} className="text-white/60 hover:text-white">✕</button>
                    </div>
                    <button
                        onClick={() => { setStormNote(false); handlePlanetSelect('earth'); }}
                        className="mt-3 w-full py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-600"
                    >
                        🌍 Bay tới Trái Đất xem cực quang
                    </button>
                </div>
            )}

            {/* Cảnh mở màn — chạm bất kỳ đâu để bỏ qua */}
            {introActive && !use2D && (
                <div
                    className="absolute inset-0 z-40 flex items-end justify-center pb-24 cursor-pointer"
                    onPointerDown={() => sceneApiRef.current?.skipIntro()}
                >
                    <span className="px-4 py-2 rounded-full text-xs text-white/80 bg-black/40 border border-white/15 backdrop-blur-sm animate-pulse">
                        Chạm để bỏ qua
                    </span>
                </div>
            )}

            {/* Thẻ "Tới nơi" */}
            {arrivedBody && !touring && !selectedPlanet && (
                <ArrivalCard
                    body={arrivedBody}
                    layout={portrait ? 'bottom' : 'side'}
                    hasBadge={hasBadge(arrivedBody.id)}
                    onDetail={() => setSelectedPlanet(arrivedBody)}
                    onChallenge={() => setQuizBody(arrivedBody)}
                    onClose={leaveArrival}
                />
            )}
            {quizBody && <SolarQuiz planet={quizBody} onClose={() => setQuizBody(null)} />}

            {/* Điều khiển thời gian — chỉ ở chế độ 3D, ẩn khi modal mở / khi tour */}
            {!use2D && !selectedPlanet && !touring && !arrivedId && !uiHidden && (
                <div className={`absolute left-1/2 -translate-x-1/2 z-50 flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full ${compact ? 'bottom-12 gap-1 px-1.5 py-1' : 'bottom-6 gap-1.5 px-2 py-1.5'}`}>
                    <button
                        onClick={() => handleSpeedChange(0)}
                        title="Tạm dừng"
                        className={`p-2.5 rounded-full transition-all text-white ${isPaused ? 'bg-white/30' : 'hover:bg-white/15'}`}
                    >
                        <Pause size={18} />
                    </button>
                    {SPEED_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => handleSpeedChange(opt.value)}
                            title={opt.title}
                            className={`px-2.5 py-1.5 rounded-full text-lg leading-none transition-all ${speed === opt.value ? 'bg-white/30' : 'hover:bg-white/15'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Zoom buttons — giữ song song với pinch/wheel cho dễ khám phá */}
            {/* Zoom: ẩn trên điện thoại (đã có pinch 2 ngón) để nhường chỗ cho cảnh */}
            {!use2D && !selectedPlanet && !touring && !arrivedId && !uiHidden && !compact && (
                <div className="absolute bottom-8 right-8 z-50 flex flex-col gap-2">
                    <button
                        onClick={() => sceneApiRef.current?.zoomIn()}
                        className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                    >
                        <ZoomIn size={24} />
                    </button>
                    <button
                        onClick={() => sceneApiRef.current?.zoomOut()}
                        className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                    >
                        <ZoomOut size={24} />
                    </button>
                </div>
            )}

            {/* Ghi công nguồn ảnh (CC BY 4.0 yêu cầu hiển thị trong UI) + lưu ý tỷ lệ */}
            {!selectedPlanet && !touring && (
                <div className={`absolute bottom-2 left-3 z-40 text-[10px] text-white/40 pointer-events-none leading-tight ${compact ? 'right-3 text-center' : ''}`}>
                    <div>Hình ảnh: NASA · Solar System Scope (CC BY 4.0) · Sao: Yale Bright Star Catalogue</div>
                    <div>Kích thước và tốc độ đã được điều chỉnh để dễ quan sát</div>
                </div>
            )}

            {/* WebGL context lost — thực tế xảy ra trên tablet Android giá rẻ */}
            {contextLost && (
                <div
                    className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center gap-4 cursor-pointer"
                    onClick={() => window.location.reload()}
                >
                    <span className="text-5xl">🛸</span>
                    <p className="text-white text-xl font-bold">Ôi! Tàu vũ trụ gặp trục trặc nhỏ.</p>
                    <p className="text-white/70">Chạm vào màn hình để tải lại nhé!</p>
                </div>
            )}

            {/* Bộ sưu tập */}
            {showCollection && <SolarCollection onClose={() => setShowCollection(false)} />}

            {/* Kích thước thật */}
            {showTrueScale && <TrueScaleOverlay onClose={() => setShowTrueScale(false)} />}

            {/* Cắt hành tinh xem địa tầng */}
            {showCutaway && <PlanetCutaway onClose={() => setShowCutaway(false)} />}

            {/* Tour có thuyết minh */}
            {touring && tourIndex !== null && (
                <TourCard index={tourIndex} ready={tourReady} onNext={nextTour} onExit={exitTour} />
            )}

            {/* Thẻ thông tin vệ tinh / hành tinh lùn / sao chổi */}
            {selectedInfo && (
                <BodyInfoCard body={selectedInfo} onClose={() => setSelectedInfo(null)} />
            )}

            {/* Detail Overlay */}
            {selectedPlanet && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="absolute inset-0" onClick={handleCloseDetail} />
                    <div className="relative z-10 w-full h-full pointer-events-auto">
                        <PlanetDetail
                            planet={selectedPlanet}
                            onClose={handleCloseDetail}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
