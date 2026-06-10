import React, { useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { SolarSystem } from './SolarSystem';
import { PlanetData } from '../../data/solarData';
import galaxyBg from '../../assets/galaxy.png';

interface Legacy2DViewProps {
    selectedPlanet: PlanetData | null;
    onPlanetSelect: (id: string) => void;
}

// View 2.5D CSS cũ — giữ làm fallback khi thiết bị không có WebGL (hoặc ?view=2d).
// Toàn bộ logic pan/zoom DOM chuyển từ SolarSystemPage cũ vào đây.
export const Legacy2DView: React.FC<Legacy2DViewProps> = ({ selectedPlanet, onPlanetSelect }) => {
    const [zoomLevel, setZoomLevel] = useState<number>(1);
    const [viewOffset, setViewOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));

    const handleMouseDown = (e: React.MouseEvent) => {
        if (selectedPlanet) return;
        setIsPanning(true);
        setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning || !dragStart) return;
        const maxOffset = 1000;
        setViewOffset({
            x: Math.max(-maxOffset, Math.min(maxOffset, e.clientX - dragStart.x)),
            y: Math.max(-maxOffset, Math.min(maxOffset, e.clientY - dragStart.y))
        });
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setDragStart(null);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (selectedPlanet) return;
        const touch = e.touches[0];
        setIsPanning(true);
        setDragStart({ x: touch.clientX - viewOffset.x, y: touch.clientY - viewOffset.y });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPanning || !dragStart) return;
        const touch = e.touches[0];
        const maxOffset = 1000;
        setViewOffset({
            x: Math.max(-maxOffset, Math.min(maxOffset, touch.clientX - dragStart.x)),
            y: Math.max(-maxOffset, Math.min(maxOffset, touch.clientY - dragStart.y))
        });
    };

    const handleTouchEnd = () => {
        setIsPanning(false);
        setDragStart(null);
    };

    return (
        <div
            className="absolute inset-0"
            style={{ cursor: isPanning ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default') }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <img
                src={galaxyBg}
                alt="Galaxy Background"
                className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />

            <SolarSystem
                selectedPlanet={selectedPlanet}
                onPlanetSelect={onPlanetSelect}
                zoomLevel={zoomLevel}
                viewOffset={viewOffset}
            />

            {!selectedPlanet && (
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
            )}
        </div>
    );
};
