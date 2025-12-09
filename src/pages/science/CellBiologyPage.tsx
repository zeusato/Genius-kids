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
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        {viewMode === 'lab' ? 'Chọn Mẫu Vật' : selectedCell.name}
                    </h1>
                </div>
            </header>

            {/* VIEW 1: LAB ROOM SELECTION */}
            {viewMode === 'lab' && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${isZooming ? 'scale-[3] opacity-0' : isZoomingOut ? 'scale-[3] opacity-0' : 'scale-100 opacity-100'}`}>

                    {/* Background Lab Environment */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 -z-10">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent" />
                        {/* Table Surface */}
                        <div className="absolute bottom-0 w-full h-1/3 bg-slate-900 border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" />
                    </div>

                    <h2 className="text-3xl font-bold mb-12 text-white/80 tracking-wide drop-shadow-md">
                        Chọn một lam kính để soi
                    </h2>

                    {/* Slides Container */}
                    <div className="flex gap-8 items-end perspective-[1000px]">
                        {CELL_DATA.map((cell) => (
                            <button
                                key={cell.id}
                                onClick={() => handleSlideSelect(cell.id)}
                                className="group relative w-32 h-48 bg-white/5 border border-white/10 hover:border-purple-400/50 rounded-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-4 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] flex flex-col items-center justify-end pb-4 overflow-hidden"
                            >
                                {/* Glass Shine */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Specimen Sample Look */}
                                <div className={`
                                    absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full blur-sm opacity-80 group-hover:blur-none group-hover:scale-110 transition-all duration-500
                                    ${cell.id === 'animal' ? 'bg-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''}
                                    ${cell.id === 'plant' ? 'bg-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : ''}
                                    ${cell.id === 'bacteria' ? 'bg-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : ''}
                                `} />

                                <span className="relative font-bold text-sm text-white/60 group-hover:text-purple-300 transition-colors uppercase tracking-wider">
                                    {cell.name.replace('Tế Bào ', '')}
                                </span>
                                <span className="text-[10px] text-white/30 uppercase">{cell.id} Sample</span>
                            </button>
                        ))}
                    </div>

                    {/* Microscope Illustration (Abstract/Iconic Background) */}
                    <div className="absolute pointer-events-none opacity-5 blur-[2px] scale-150 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                        <Microscope size={400} />
                    </div>
                </div>
            )}

            {/* VIEW 2: MICROSCOPE (Cell Canvas) */}
            {viewMode === 'microscope' && (
                <main className={`relative z-10 w-full h-screen flex flex-col items-center justify-center pt-20 transition-all duration-700 ${isZoomingOut ? 'scale-[0.3] opacity-0' : 'animate-in fade-in zoom-in duration-1000'}`}>

                    {/* Viewport Vignette Effect (Microscope Lens Look) */}
                    <div className="absolute inset-0 pointer-events-none radial-vignette z-50 opacity-50" />

                    {/* Floating Title in Background - CENTERED ON SCREEN */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <h2 className="text-6xl md:text-8xl font-bold text-white/5 uppercase tracking-[0.5em] md:tracking-[1em] whitespace-nowrap">
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

                        {/* DNA Helix Animation - Shows when Nucleus/Nucleoid is selected, NEXT TO INFO PANEL */}
                        {selectedOrganelle && (selectedOrganelle.id === 'nucleus' || selectedOrganelle.id === 'nucleoid') && (
                            <div className="hidden md:flex absolute right-[420px] top-1/2 -translate-y-1/2 w-28 h-72 animate-in fade-in slide-in-from-right duration-700">
                                <DNAHelix
                                    className="w-full h-full"
                                    color={selectedOrganelle.color}
                                />
                            </div>
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
            `}</style>
        </div>
    );
};
