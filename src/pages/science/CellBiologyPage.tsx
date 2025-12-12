import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Microscope } from 'lucide-react';
import { CELL_DATA, Organelle } from '@/src/data/cellData';
import { CellCanvas } from '@/src/components/cell/CellCanvas';
import { DetailPanel } from '@/src/components/cell/DetailPanel';
import { DNAHelix } from '@/src/components/cell/DNAHelix';

export const CellBiologyPage: React.FC = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'lab' | 'microscope'>('lab');
    const [selectedCellId, setSelectedCellId] = useState<string>('animal');
    const [selectedOrganelle, setSelectedOrganelle] = useState<Organelle | null>(null);
    const [isZooming, setIsZooming] = useState(false);
    const [isZoomingOut, setIsZoomingOut] = useState(false);

    const selectedCell = CELL_DATA.find(c => c.id === selectedCellId) || CELL_DATA[0];

    const handleSlideSelect = (cellId: string) => {
        setSelectedCellId(cellId);
        setIsZooming(true);
        setTimeout(() => {
            setViewMode('microscope');
            setIsZooming(false);
        }, 1500);
    };

    const handleBackToLab = () => {
        setIsZoomingOut(true);
        setSelectedOrganelle(null);
        setViewMode('lab'); // Switch immediately
        setTimeout(() => {
            setIsZoomingOut(false);
        }, 100); // Short delay to trigger CSS transition
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative selection:bg-purple-500/30 font-sans">

            {/* Common Header */}
            <header className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none">
                {/* Back Button - Left */}
                <button
                    onClick={() => {
                        if (viewMode === 'microscope') {
                            handleBackToLab();
                        } else {
                            navigate('/science');
                        }
                    }}
                    className="absolute left-4 top-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-md pointer-events-auto border border-white/10 hover:border-white/20"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline">
                        {viewMode === 'microscope' ? 'Chọn mẫu vật khác' : 'Quay lại'}
                    </span>
                </button>

                {/* Title - Centered */}
                <div className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-2 px-6 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                    <Microscope className="text-purple-400" size={24} />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 whitespace-nowrap">
                        {viewMode === 'lab' ? 'Chọn Mẫu Vật' : selectedCell.name}
                    </h1>
                </div>
            </header>

            {/* VIEW 1: LAB ROOM SELECTION */}
            {viewMode === 'lab' && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${isZooming ? 'scale-[3] opacity-0' : isZoomingOut ? 'scale-[3] opacity-0' : 'scale-100 opacity-100'}`}>

                    {/* Background - More colorful gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 -z-10">
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-pink-500 via-transparent to-transparent" />
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_80%,_var(--tw-gradient-stops))] from-cyan-500 via-transparent to-transparent" />
                        {/* Floating particles */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute w-2 h-2 bg-pink-400 rounded-full top-[20%] left-[15%] animate-pulse opacity-60" />
                            <div className="absolute w-3 h-3 bg-cyan-400 rounded-full top-[40%] right-[20%] animate-bounce opacity-50" />
                            <div className="absolute w-2 h-2 bg-purple-400 rounded-full bottom-[30%] left-[25%] animate-ping opacity-40" />
                            <div className="absolute w-4 h-4 bg-green-400 rounded-full top-[60%] right-[10%] animate-pulse opacity-30" />
                        </div>
                    </div>

                    <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 tracking-wide drop-shadow-lg animate-pulse">
                        🔬 Chọn Mẫu Vật Để Soi!
                    </h2>
                    <p className="text-white/60 mb-10 text-lg">Nhấp vào mẫu vật bạn muốn khám phá</p>

                    {/* Slides Container - More vibrant cards */}
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center perspective-[1000px] py-8 overflow-visible">
                        {CELL_DATA.map((cell, index) => (
                            <button
                                key={cell.id}
                                onClick={() => handleSlideSelect(cell.id)}
                                className={`
                                    group relative w-48 h-24 md:w-40 md:h-56 rounded-2xl transition-all duration-300 
                                    hover:-translate-y-2 md:hover:-translate-y-6 hover:scale-105 md:hover:rotate-2
                                    flex flex-row md:flex-col items-center justify-center gap-3 px-4 md:px-0
                                    border-2 shadow-2xl overflow-hidden shrink-0
                                    ${cell.id === 'animal' ? 'bg-gradient-to-br from-rose-500/80 to-red-600/80 border-rose-400 hover:shadow-[0_0_40px_rgba(244,63,94,0.5)]' : ''}
                                    ${cell.id === 'plant' ? 'bg-gradient-to-br from-emerald-500/80 to-green-600/80 border-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]' : ''}
                                    ${cell.id === 'bacteria' ? 'bg-gradient-to-br from-amber-500/80 to-orange-600/80 border-amber-400 hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]' : ''}
                                `}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Glass shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Cell Icon/Emoji */}
                                <div className="text-4xl md:text-6xl group-hover:scale-125 group-hover:animate-bounce transition-transform duration-300">
                                    {cell.id === 'animal' && '🔴'}
                                    {cell.id === 'plant' && '🌿'}
                                    {cell.id === 'bacteria' && '🦠'}
                                </div>

                                {/* Cell Name */}
                                <span className="relative font-bold text-lg text-white drop-shadow-lg">
                                    {cell.name.replace('Tế Bào ', '')}
                                </span>

                                {/* Subtitle - hidden on mobile */}
                                <span className="hidden md:inline text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full">
                                    Nhấp để soi 👆
                                </span>

                                {/* Sparkle on hover */}
                                <div className="absolute top-2 right-2 text-2xl opacity-0 group-hover:opacity-100 group-hover:animate-spin transition-opacity">
                                    ✨
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Fun microscope icon */}
                    <div className="absolute pointer-events-none opacity-10 scale-150 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                        <Microscope size={400} className="text-purple-300" />
                    </div>
                </div>
            )}

            {/* VIEW 2: MICROSCOPE (Cell Canvas) */}
            {viewMode === 'microscope' && (
                <main className={`relative z-10 w-full h-screen flex flex-col items-center justify-center pt-20 transition-all duration-700 ${isZoomingOut ? 'scale-[0.3] opacity-0' : 'animate-in fade-in zoom-in duration-1000'}`}>

                    {/* Dynamic Background Based on Cell Type */}
                    <div className={`absolute inset-0 -z-10 transition-colors duration-1000
                        ${selectedCell.id === 'animal' ? 'bg-gradient-to-br from-slate-950 via-rose-950/30 to-slate-950' : ''}
                        ${selectedCell.id === 'plant' ? 'bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-950' : ''}
                        ${selectedCell.id === 'bacteria' ? 'bg-gradient-to-br from-slate-950 via-amber-950/30 to-slate-950' : ''}
                    `}>
                        {/* Floating particles matching cell type */}
                        <div className="absolute inset-0 overflow-hidden opacity-40">
                            <div className={`absolute w-3 h-3 rounded-full top-[15%] left-[10%] animate-pulse
                                ${selectedCell.id === 'animal' ? 'bg-rose-400' : ''}
                                ${selectedCell.id === 'plant' ? 'bg-emerald-400' : ''}
                                ${selectedCell.id === 'bacteria' ? 'bg-amber-400' : ''}
                            `} />
                            <div className={`absolute w-2 h-2 rounded-full top-[30%] right-[15%] animate-bounce
                                ${selectedCell.id === 'animal' ? 'bg-pink-400' : ''}
                                ${selectedCell.id === 'plant' ? 'bg-green-400' : ''}
                                ${selectedCell.id === 'bacteria' ? 'bg-orange-400' : ''}
                            `} />
                            <div className={`absolute w-4 h-4 rounded-full bottom-[25%] left-[20%] animate-ping opacity-30
                                ${selectedCell.id === 'animal' ? 'bg-red-400' : ''}
                                ${selectedCell.id === 'plant' ? 'bg-teal-400' : ''}
                                ${selectedCell.id === 'bacteria' ? 'bg-yellow-400' : ''}
                            `} />
                            <div className={`absolute w-2 h-2 rounded-full bottom-[40%] right-[25%] animate-pulse
                                ${selectedCell.id === 'animal' ? 'bg-rose-300' : ''}
                                ${selectedCell.id === 'plant' ? 'bg-lime-400' : ''}
                                ${selectedCell.id === 'bacteria' ? 'bg-amber-300' : ''}
                            `} />
                        </div>
                    </div>

                    {/* Viewport Vignette Effect (Microscope Lens Look) */}
                    <div className="absolute inset-0 pointer-events-none radial-vignette z-50 opacity-40" />

                    {/* Floating Title in Background - CENTERED ON SCREEN with color */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <h2 className={`text-6xl md:text-8xl font-bold uppercase tracking-[0.5em] md:tracking-[1em] whitespace-nowrap
                            ${selectedCell.id === 'animal' ? 'text-rose-500/10' : ''}
                            ${selectedCell.id === 'plant' ? 'text-emerald-500/10' : ''}
                            ${selectedCell.id === 'bacteria' ? 'text-amber-500/10' : ''}
                        `}>
                            {selectedCell.id}
                        </h2>
                    </div>

                    {/* Active Cell Canvas */}
                    <div className="relative w-full h-full flex items-center justify-center transition-all duration-700 z-10">
                        <div className={`transition-all duration-500 ${selectedOrganelle ? 'mr-[0px] md:mr-[400px] scale-90' : 'scale-100'}`}>
                            <CellCanvas
                                cellType={selectedCell}
                                onOrganelleClick={setSelectedOrganelle}
                            />
                        </div>

                        {/* DNA Helix Animation - Shows when Nucleus/Nucleoid is selected */}
                        {selectedOrganelle && (selectedOrganelle.id === 'nucleus' || selectedOrganelle.id === 'nucleoid') && (
                            <>
                                {/* Mobile: Show in center of canvas area - Fixed position relative to viewport */}
                                {/* Top of model = bottom of header (approx 70px). Horizontal center = screen/2 - model/2 (2.5rem) */}
                                <div className="flex md:hidden fixed left-[calc(50%-2.5rem)] top-[70px] w-20 h-32 animate-in fade-in zoom-in duration-700 z-50 pointer-events-none">
                                    <DNAHelix
                                        className="w-full h-full"
                                        color={selectedOrganelle.color}
                                    />
                                </div>
                                {/* Desktop: Show next to info panel */}
                                <div className="hidden md:flex absolute right-[420px] top-1/2 -translate-y-1/2 w-28 h-72 animate-in fade-in slide-in-from-right duration-700">
                                    <DNAHelix
                                        className="w-full h-full"
                                        color={selectedOrganelle.color}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DetailPanel
                        organelle={selectedOrganelle}
                        onClose={() => setSelectedOrganelle(null)}
                    />
                </main>
            )}

            {/* Add Vignette CSS inline for now */}
            <style>{`
                .radial-vignette {
                    background: radial-gradient(circle, transparent 50%, black 100%);
                }
                .perspective-[1000px] {
                    perspective: 1000px;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};
