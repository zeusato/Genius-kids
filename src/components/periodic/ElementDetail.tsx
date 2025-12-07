import React, { Suspense } from 'react';
import { X, Atom, Thermometer, Scale, Calendar, Lightbulb, Image as ImageIcon, Circle } from 'lucide-react';
import { ElementData, CATEGORY_COLORS } from '@/src/data/elementsData';
import { Atom3D } from './Atom3D';

// Flag to control infographic button visibility
const SHOW_INFOGRAPHIC_BUTTON = false;

interface ElementDetailProps {
    element: ElementData;
    onClose: () => void;
}

const categoryNames: Record<string, string> = {
    'alkali-metal': 'Kim loại kiềm',
    'alkaline-earth': 'Kim loại kiềm thổ',
    'transition-metal': 'Kim loại chuyển tiếp',
    'post-transition': 'Kim loại sau chuyển tiếp',
    'metalloid': 'Á kim',
    'nonmetal': 'Phi kim',
    'halogen': 'Halogen',
    'noble-gas': 'Khí hiếm',
    'lanthanide': 'Lanthanide',
    'actinide': 'Actinide',
    'unknown': 'Chưa xác định',
};

const stateNames: Record<string, string> = {
    'solid': 'Rắn',
    'liquid': 'Lỏng',
    'gas': 'Khí',
    'unknown': 'Chưa biết',
};

export const ElementDetail: React.FC<ElementDetailProps> = ({ element, onClose }) => {
    const categoryStyle = CATEGORY_COLORS[element.category];

    // Calculate particle counts
    const protons = element.atomicNumber;
    const electrons = element.atomicNumber; // Neutral atom
    const neutrons = Math.round(element.atomicMass - protons);
    const totalElectrons = element.electronShells.reduce((sum, n) => sum + n, 0);

    const handleInfographicClick = () => {
        // TODO: Implement infographic modal when images are available
        console.log('Infographic clicked for:', element.symbol);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-white/10"
                style={{
                    boxShadow: `0 0 50px ${categoryStyle.glow}, 0 0 100px ${categoryStyle.glow}40`,
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b border-white/10 backdrop-blur-md"
                    style={{ backgroundColor: `${categoryStyle.color}10` }}
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
                            style={{
                                backgroundColor: `${categoryStyle.color}20`,
                                border: `3px solid ${categoryStyle.color}`,
                                boxShadow: `0 0 20px ${categoryStyle.glow}`,
                            }}
                        >
                            <span
                                className="text-3xl sm:text-4xl font-bold"
                                style={{
                                    color: categoryStyle.color,
                                    textShadow: `0 0 20px ${categoryStyle.glow}`
                                }}
                            >
                                {element.symbol}
                            </span>
                        </div>
                        <div>
                            <h2
                                className="text-2xl sm:text-3xl font-bold"
                                style={{ color: categoryStyle.color }}
                            >
                                {element.name}
                            </h2>
                            <p className="text-white/60 text-sm sm:text-base">
                                {element.nameEn} • #{element.atomicNumber}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6">
                    {/* Left: 3D Model */}
                    <div className="relative h-[300px] sm:h-[400px] rounded-2xl overflow-hidden bg-black/50 border border-white/10">
                        <Suspense fallback={
                            <div className="w-full h-full flex items-center justify-center text-white/50">
                                <Atom className="animate-spin" size={48} />
                            </div>
                        }>
                            <Atom3D element={element} />
                        </Suspense>

                        {/* Particle counts overlay - compact top */}
                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                            <div className="flex items-center gap-1" title="Protons">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                <span className="text-red-400 text-xs font-semibold">{protons}p</span>
                            </div>
                            <div className="flex items-center gap-1" title="Neutrons">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-blue-400 text-xs font-semibold">{neutrons}n</span>
                            </div>
                            <div className="flex items-center gap-1" title="Electrons">
                                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                                <span className="text-cyan-400 text-xs font-semibold">{electrons}e⁻</span>
                            </div>
                        </div>

                        {/* Electron shells overlay - compact bottom */}
                        <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                            <div className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                    <span className="text-white/50">Lớp:</span>
                                    <span className="text-cyan-400 font-mono font-semibold">
                                        {element.electronShells.join(' · ')}
                                    </span>
                                </div>
                                <span className="text-white/40 font-mono hidden sm:inline">{element.electronConfig}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="space-y-4">
                        {/* Category badge */}
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                            style={{
                                backgroundColor: `${categoryStyle.color}20`,
                                color: categoryStyle.color,
                                border: `1px solid ${categoryStyle.color}50`,
                            }}
                        >
                            <Atom size={16} />
                            {categoryNames[element.category]}
                        </div>

                        {/* Description */}
                        <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                            {element.description}
                        </p>

                        {/* Properties grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                                    <Scale size={14} />
                                    Khối lượng nguyên tử
                                </div>
                                <p className="text-white font-semibold">{element.atomicMass} u</p>
                            </div>

                            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                                    <Atom size={14} />
                                    Trạng thái
                                </div>
                                <p className="text-white font-semibold">{stateNames[element.state]}</p>
                            </div>

                            {element.meltingPoint !== undefined && (
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                                        <Thermometer size={14} />
                                        Điểm nóng chảy
                                    </div>
                                    <p className="text-white font-semibold">{element.meltingPoint}°C</p>
                                </div>
                            )}

                            {element.boilingPoint !== undefined && (
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                                        <Thermometer size={14} />
                                        Điểm sôi
                                    </div>
                                    <p className="text-white font-semibold">{element.boilingPoint}°C</p>
                                </div>
                            )}

                            {element.density !== undefined && (
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                                        <Scale size={14} />
                                        Mật độ
                                    </div>
                                    <p className="text-white font-semibold">{element.density} g/cm³</p>
                                </div>
                            )}

                            {element.discoveryYear && (
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                                        <Calendar size={14} />
                                        Năm phát hiện
                                    </div>
                                    <p className="text-white font-semibold">
                                        {element.discoveryYear < 0
                                            ? `${Math.abs(element.discoveryYear)} TCN`
                                            : element.discoveryYear}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Fun Facts */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <h3 className="flex items-center gap-2 text-white font-semibold mb-3">
                                <Lightbulb size={18} style={{ color: categoryStyle.color }} />
                                Bạn có biết?
                            </h3>
                            <ul className="space-y-2">
                                {element.facts.map((fact, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-2 text-white/70 text-sm"
                                    >
                                        <span
                                            className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: categoryStyle.color }}
                                        />
                                        {fact}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Infographic Button (Hidden by default) */}
                        {SHOW_INFOGRAPHIC_BUTTON && (
                            <button
                                onClick={handleInfographicClick}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all"
                                style={{
                                    backgroundColor: `${categoryStyle.color}20`,
                                    color: categoryStyle.color,
                                    border: `2px solid ${categoryStyle.color}`,
                                }}
                            >
                                <ImageIcon size={20} />
                                Xem Infographic
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
