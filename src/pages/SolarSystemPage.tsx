import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ZoomIn, ZoomOut, ChevronDown } from 'lucide-react';
import { SolarSystem } from '../components/solar/SolarSystem';
import { PlanetDetail } from '../components/solar/PlanetDetail';
import { PlanetData, SOLAR_SYSTEM_DATA, SUN_DATA, ASTEROID_BELT_DATA } from '../data/solarData';
import { MusicControls } from '../components/MusicControls';
import galaxyBg from '../assets/galaxy.png';

export function SolarSystemPage() {
    const navigate = useNavigate();
    const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [viewOffset, setViewOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

    const handlePlanetSelect = (planetId: string) => {
        if (planetId === 'sun') {
            setSelectedPlanet(SUN_DATA);
        } else if (planetId === 'asteroid-belt') {
            setSelectedPlanet(ASTEROID_BELT_DATA);
        } else {
            const planet = SOLAR_SYSTEM_DATA.find(p => p.id === planetId);
            if (planet) {
                setSelectedPlanet(planet);
            }
        }
        setIsMenuOpen(false);
    };

    const handleCloseDetail = () => {
        setSelectedPlanet(null);
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.2, 3));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
    };

    // Pan handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (selectedPlanet) return; // Don't pan when detail is open
        setIsPanning(true);
        setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning || !dragStart) return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Apply boundary limits (max 1000px in any direction)
        const maxOffset = 1000;
        setViewOffset({
            x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
            y: Math.max(-maxOffset, Math.min(maxOffset, newY))
        });
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setDragStart(null);
    };

    // Touch handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if (selectedPlanet) return;
        const touch = e.touches[0];
        setIsPanning(true);
        setDragStart({ x: touch.clientX - viewOffset.x, y: touch.clientY - viewOffset.y });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPanning || !dragStart) return;
        const touch = e.touches[0];
        const newX = touch.clientX - dragStart.x;
        const newY = touch.clientY - dragStart.y;

        const maxOffset = 1000;
        setViewOffset({
            x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
            y: Math.max(-maxOffset, Math.min(maxOffset, newY))
        });
    };

    const handleTouchEnd = () => {
        setIsPanning(false);
        setDragStart(null);
    };

    return (
        <div
            className="w-full h-screen bg-black overflow-hidden relative"
            style={{ cursor: isPanning ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default') }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background Stars */}
            <img
                src={galaxyBg}
                alt="Galaxy Background"
                className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />

            {/* UI Controls */}
            <div className="absolute top-4 left-4 z-50 flex gap-4">
                <button
                    onClick={() => navigate('/mode')}
                    className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>

                {/* Planet Selection Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                    >
                        <span className="text-sm font-semibold">Chọn thiên thể</span>
                        <ChevronDown size={16} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden max-h-96 overflow-y-auto">
                            {/* Sun */}
                            <button
                                onClick={() => handlePlanetSelect('sun')}
                                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/10"
                            >
                                <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]"></div>
                                <span className="font-semibold">Mặt Trời</span>
                            </button>

                            {/* Planets */}
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

                            {/* Asteroid Belt */}
                            <button
                                onClick={() => handlePlanetSelect('asteroid-belt')}
                                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                            >
                                <div className="w-3 h-3 rounded-full bg-amber-700 shadow-[0_0_10px_rgba(180,83,9,0.6)]"></div>
                                <span className="text-sm">Vành Đai Tiểu Hành Tinh</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute top-4 right-4 z-50">
                <MusicControls />
            </div>

            {/* Zoom Controls */}
            {
                !selectedPlanet && (
                    <div className="absolute bottom-8 right-8 z-50 flex flex-col gap-2">
                        <button
                            onClick={handleZoomIn}
                            className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                        >
                            <ZoomIn size={24} />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                        >
                            <ZoomOut size={24} />
                        </button>
                    </div>
                )
            }

            {/* Main 3D Scene */}
            <SolarSystem
                selectedPlanet={selectedPlanet}
                onPlanetSelect={handlePlanetSelect}
                zoomLevel={zoomLevel}
                viewOffset={viewOffset}
            />

            {/* Detail Overlay */}
            {selectedPlanet && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    {/* Click outside to close (optional, but good UX) */}
                    <div className="absolute inset-0" onClick={handleCloseDetail} />

                    {/* Modal Content */}
                    <div className="relative z-10 w-full h-full pointer-events-auto">
                        <PlanetDetail
                            planet={selectedPlanet}
                            onClose={handleCloseDetail}
                        />
                    </div>
                </div>
            )}
        </div >
    );
}
