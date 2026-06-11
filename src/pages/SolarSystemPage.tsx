import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, ChevronDown, Pause, Rocket } from 'lucide-react';
import { PlanetDetail } from '../components/solar/PlanetDetail';
import { Legacy2DView } from '../components/solar/Legacy2DView';
import { SolarCollection } from '../components/solar/SolarCollection';
import { TrueScaleOverlay } from '../components/solar/TrueScaleOverlay';
import { TourCard } from '../components/solar/TourCard';
import { BodyInfoCard, InfoBodyView } from '../components/solar/BodyInfoCard';
import { SOLAR_TOUR } from '../data/solarTour';
import { useStudent } from '../contexts/StudentContext';
import { COLLECTIBLE_BODY_IDS } from '../data/solarQuizData';
import { Scene3D } from '../components/solar/scene3d/Scene3D';
import { createSimClock, Scene3DApi, supportsWebGL } from '../components/solar/scene3d/core';
import { playBlip } from '../components/solar/sfx';
import { PlanetData, SOLAR_SYSTEM_DATA, SUN_DATA, ASTEROID_BELT_DATA, MOON_DATA, PLUTO_INFO, COMET_INFO } from '../data/solarData';
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
    const [tourIndex, setTourIndex] = useState<number | null>(null); // null = không tour
    const [tourReady, setTourReady] = useState<boolean>(false);      // camera đã bay tới chặng
    const touring = tourIndex !== null;
    const { currentStudent } = useStudent();
    const badgeCount = COLLECTIBLE_BODY_IDS.filter(
        id => currentStudent?.solarBadges?.includes(id)
    ).length;

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
        // Vệ tinh / hành tinh lùn / sao chổi: chấm nhỏ → mở thẻ info nhẹ ngay (không fly-to)
        const moon = MOON_DATA.find(m => m.id === planetId);
        if (moon) {
            setSelectedInfo({ ...moon, kindLabel: `Vệ tinh của ${moon.parentName}` });
            return;
        }
        if (planetId === 'pluto') { setSelectedInfo(PLUTO_INFO); return; }
        if (planetId === 'comet') { setSelectedInfo(COMET_INFO); return; }
        // Vành đai không có điểm bay tới cụ thể → mở thẻ ngay; 2D giữ hành vi cũ
        if (use2D || planetId === 'asteroid-belt') {
            setSelectedPlanet(lookupBody(planetId));
            return;
        }
        // 3D: bay camera tới trước (NASA Eyes pattern), tới nơi mới mở thẻ
        setFocusedId(planetId);
    };

    const handleFocusComplete = (planetId: string) => {
        // Trong tour: bay tới nơi → hiện thẻ thuyết minh (không mở modal chi tiết)
        if (tourIndex !== null) {
            setTourReady(true);
            return;
        }
        setSelectedPlanet(lookupBody(planetId));
    };

    // Tour điều khiển focusedId theo chặng
    useEffect(() => {
        if (tourIndex === null) return;
        setTourReady(false);
        setFocusedId(SOLAR_TOUR[tourIndex].id);
    }, [tourIndex]);

    const startTour = () => {
        setSelectedPlanet(null);
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
                        paused={!!selectedPlanet || !!selectedInfo || showTrueScale}
                        apiRef={sceneApiRef}
                        onContextLost={() => setContextLost(true)}
                    />
                </div>
            )}

            {/* UI Controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-4">
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
                        className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                    >
                        <span className="text-sm font-semibold">Chọn thiên thể</span>
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
                        </div>
                    )}
                </div>}
            </div>

            <div className="absolute top-4 right-4 z-50">
                <MusicControls />
            </div>

            {/* Bộ sưu tập huy hiệu + Kích thước thật + Du hành */}
            {!selectedPlanet && !touring && (
                <div className="absolute top-20 left-4 z-50 flex flex-col gap-2">
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
                </div>
            )}

            {/* Điều khiển thời gian — chỉ ở chế độ 3D, ẩn khi modal mở / khi tour */}
            {!use2D && !selectedPlanet && !touring && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-2 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
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
            {!use2D && !selectedPlanet && !touring && (
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
                <div className="absolute bottom-2 left-3 z-40 text-[10px] text-white/40 pointer-events-none leading-tight">
                    <div>Hình ảnh: NASA · Solar System Scope (CC BY 4.0)</div>
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
