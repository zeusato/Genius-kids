import React from 'react';
import { PlanetData } from '../../data/solarData';
import { X, Thermometer, Ruler, Move, Zap } from 'lucide-react';
import { Planet3D } from './Planet3D';

interface PlanetDetailProps {
    planet: PlanetData;
    onClose: () => void;
}

export const PlanetDetail: React.FC<PlanetDetailProps> = ({ planet, onClose }) => {
    const [showInfographic, setShowInfographic] = React.useState(false);

    // Auto-rotate logic for mobile
    const [isPortrait, setIsPortrait] = React.useState(false);

    React.useEffect(() => {
        const checkOrientation = () => {
            // Check if device is portrait and likely mobile (width < 768px or just aspect ratio)
            // Using window.innerWidth < window.innerHeight is a good proxy for portrait
            setIsPortrait(window.innerWidth < window.innerHeight);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    // Handle ESC key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showInfographic) {
                    setShowInfographic(false);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showInfographic, onClose]);

    const getInfographicPath = (planetId: string) => {
        const map: Record<string, string> = {
            'mercury': 'Mercury.png',
            'venus': 'Vernus.png', // Typo in file
            'earth': 'Earth.png',
            'mars': 'Mars.png',
            'jupiter': 'Jupiter.png',
            'saturn': 'Sarturn.png', // Typo in file
            'uranus': 'Uranus.png',
            'neptune': 'Neptune.png',
            'sun': 'sun.png',
            'asteroid-belt': 'asteroidBelt.png'
        };
        return `/Genius-kids/infographic/${map[planetId] || 'Earth.png'}`;
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-6 md:p-12 animate-in fade-in zoom-in-95 duration-500">

            {/* Content Container - redesigned with cosmic theme */}
            <div className="relative w-full max-w-6xl h-full max-h-[90vh] rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-[0_0_100px_rgba(59,130,246,0.3)]"
                style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
                    border: '1px solid rgba(148, 163, 184, 0.2)'
                }}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-sm border border-white/10"
                >
                    <X size={20} />
                </button>

                {/* Left Side: 3D Model */}
                <div className="w-full md:w-1/2 h-64 md:h-full relative flex items-center justify-center overflow-hidden">
                    <Planet3D planet={planet} />

                    {/* Glow effect */}
                    <div
                        className="absolute inset-0 opacity-20 blur-3xl pointer-events-none"
                        style={{ background: `radial-gradient(circle at center, ${planet.color}, transparent 70%)` }}
                    />
                </div>

                {/* Right Side: Info - Redesigned with better typography */}
                <div className="w-full md:w-1/2 h-auto md:h-full p-4 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar text-white flex flex-col">
                    {/* Title */}
                    <div className="mb-4 md:mb-6">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200">
                            {planet.name}
                        </h1>
                        <div className="h-1 w-24 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full"></div>
                    </div>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-slate-300 mb-4 md:mb-6 leading-relaxed">
                        {planet.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="mb-6">
                        <button
                            onClick={() => setShowInfographic(true)}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
                        >
                            <span className="text-xl">📊</span>
                            <span>Xem Infographic</span>
                            <Move size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Stats Grid - Compact & Modern */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 md:mb-6">
                        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 p-3 rounded-xl border border-orange-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-orange-300 mb-1">
                                <Thermometer size={14} />
                                <span className="text-xs font-bold uppercase tracking-wider">Nhiệt độ</span>
                            </div>
                            <div className="text-sm sm:text-base font-bold text-white">{planet.temperature}</div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-3 rounded-xl border border-blue-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-blue-300 mb-1">
                                <Move size={14} />
                                <span className="text-xs font-bold uppercase tracking-wider">Khoảng cách</span>
                            </div>
                            <div className="text-sm sm:text-base font-bold text-white">{planet.distanceFromSun}</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-3 rounded-xl border border-purple-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-purple-300 mb-1">
                                <Ruler size={14} />
                                <span className="text-xs font-bold uppercase tracking-wider">Đường kính</span>
                            </div>
                            <div className="text-sm sm:text-base font-bold text-white">{planet.diameter}</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-3 rounded-xl border border-green-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-green-300 mb-1">
                                <Zap size={14} />
                                <span className="text-xs font-bold uppercase tracking-wider">Trọng lực</span>
                            </div>
                            <div className="text-sm sm:text-base font-bold text-white">{planet.gravity}</div>
                        </div>
                    </div>

                    {/* Fun Facts - Compact */}
                    <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2">
                            <span className="text-2xl">💡</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
                                Sự thật thú vị
                            </span>
                        </h3>
                        <div className="space-y-2">
                            {planet.facts.map((fact, index) => (
                                <div key={index} className="flex gap-2 p-2.5 sm:p-3 bg-yellow-400/5 rounded-lg border border-yellow-400/20 backdrop-blur-sm hover:bg-yellow-400/10 transition-colors">
                                    <span className="text-yellow-400 font-bold text-sm shrink-0">{index + 1}.</span>
                                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">{fact}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Infographic Modal */}
            {showInfographic && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    {/* Click outside to close */}
                    <div className="absolute inset-0" onClick={() => setShowInfographic(false)} />

                    <button
                        onClick={() => setShowInfographic(false)}
                        className="absolute top-4 right-4 z-[210] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/20"
                    >
                        <X size={24} />
                    </button>

                    <div
                        className="absolute top-1/2 left-1/2 flex items-center justify-center pointer-events-none transition-all duration-500 ease-in-out origin-center"
                        style={isPortrait ? {
                            width: '100vh',
                            height: '100vw',
                            transform: 'translate(-50%, -50%) rotate(90deg)',
                            maxWidth: 'none',
                            maxHeight: 'none'
                        } : {
                            width: '100%',
                            height: '100%',
                            transform: 'translate(-50%, -50%)',
                            padding: '1rem'
                        }}
                    >
                        <img
                            src={getInfographicPath(planet.id)}
                            alt={`${planet.name} Infographic`}
                            className="w-full h-full object-contain pointer-events-auto"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
