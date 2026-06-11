import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Microscope, ZoomIn, ZoomOut, ChevronDown } from 'lucide-react';
import { CELL_DATA, Organelle } from '@/src/data/cellData';
import { CellCanvas } from '@/src/components/cell/CellCanvas';
import { DetailPanel } from '@/src/components/cell/DetailPanel';
import { DNAHelix } from '@/src/components/cell/DNAHelix';
import { CellScene3D } from '@/src/components/cell/scene3d/CellScene3D';
import { createSimClock, Scene3DApi, supportsWebGL } from '@/src/components/cell/scene3d/core';

export const CellBiologyPage: React.FC = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'lab' | 'microscope'>('lab');
    const [enteredMicroscope, setEnteredMicroscope] = useState(false); // canvas mount 1 lần, không unmount khi đổi tế bào
    const [selectedCellId, setSelectedCellId] = useState<string>('animal');
    const [selectedOrganelle, setSelectedOrganelle] = useState<Organelle | null>(null);
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [isZooming, setIsZooming] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [contextLost, setContextLost] = useState(false);

    const selectedCell = CELL_DATA.find(c => c.id === selectedCellId) || CELL_DATA[0];
    const cytoplasmId = useMemo(
        () => selectedCell.organelles.find(o => o.id.startsWith('cytoplasm'))?.id ?? 'cytoplasm',
        [selectedCell]
    );

    const clockRef = useRef(createSimClock());
    const sceneApiRef = useRef<Scene3DApi | null>(null);

    const use2D = useMemo(
        () => new URLSearchParams(window.location.search).get('view') === '2d' || !supportsWebGL(),
        []
    );

    const resetFocus = () => {
        setSelectedOrganelle(null);
        setFocusedId(null);
        clockRef.current.timeScale = 1;
    };

    const enterCell = (cellId: string) => {
        setMenuOpen(false);
        resetFocus();
        setSelectedCellId(cellId);
        if (viewMode === 'microscope') return; // đã trong kính → chỉ đổi mẫu (canvas giữ nguyên)
        setIsZooming(true);
        setEnteredMicroscope(true);
        setTimeout(() => {
            setViewMode('microscope');
            setIsZooming(false);
        }, 1200);
    };

    // Chọn bào quan / chạm nền
    const handleSelect = (organelleId: string) => {
        if (use2D) {
            const o = selectedCell.organelles.find(x => x.id === organelleId);
            if (o) setSelectedOrganelle(o);
            return;
        }
        const isCytoplasm = organelleId.startsWith('cytoplasm');
        // Chạm nền (tế bào chất) khi đang focus một bào quan khác → quay về view mặc định
        if (isCytoplasm && focusedId && focusedId !== organelleId) {
            resetFocus();
            return;
        }
        // Focus / đổi bào quan: xóa panel trước để bỏ pause cho camera bay được
        setSelectedOrganelle(null);
        setFocusedId(organelleId);
    };

    const handleFocusComplete = (organelleId: string) => {
        const o = selectedCell.organelles.find(x => x.id === organelleId);
        if (o) setSelectedOrganelle(o);
    };

    const handleHeaderBack = () => {
        if (viewMode === 'microscope') {
            resetFocus();
            setViewMode('lab'); // canvas KHÔNG unmount (nằm ngoài điều kiện viewMode)
        } else {
            navigate('/science');
        }
    };

    const isDNA = selectedOrganelle && (selectedOrganelle.id === 'nucleus' || selectedOrganelle.id === 'nucleoid');
    const scenePaused = viewMode === 'lab' || !!selectedOrganelle;

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative selection:bg-purple-500/30 font-sans">

            {/* Nền động theo loại tế bào (luôn có) */}
            <div className={`absolute inset-0 -z-10 transition-colors duration-1000
                ${selectedCell.id === 'animal' ? 'bg-gradient-to-br from-slate-950 via-rose-950/30 to-slate-950' : ''}
                ${selectedCell.id === 'plant' ? 'bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-950' : ''}
                ${selectedCell.id === 'bacteria' ? 'bg-gradient-to-br from-slate-950 via-amber-950/30 to-slate-950' : ''}
            `} />

            {/* === LỚP SCENE 3D BỀN (mount 1 lần, đổi tế bào không tạo context mới) === */}
            {enteredMicroscope && !use2D && (
                <div className="absolute inset-0 z-0">
                    <CellScene3D
                        cellType={selectedCell}
                        focusedId={focusedId}
                        onSelect={handleSelect}
                        onFocusComplete={handleFocusComplete}
                        clock={clockRef.current}
                        paused={scenePaused}
                        apiRef={sceneApiRef}
                        onContextLost={() => setContextLost(true)}
                    />
                </div>
            )}

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none">
                <button
                    onClick={handleHeaderBack}
                    className="absolute left-4 top-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-md pointer-events-auto border border-white/10 hover:border-white/20"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline">{viewMode === 'microscope' ? 'Phòng thí nghiệm' : 'Quay lại'}</span>
                </button>

                <div className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center gap-2 px-6 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                    <Microscope className="text-purple-400" size={24} />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 whitespace-nowrap">
                        {viewMode === 'lab' ? 'Chọn Mẫu Vật' : selectedCell.name}
                    </h1>
                </div>

                {/* Đổi mẫu vật NGAY trong kính (không về lab → canvas giữ nguyên, tránh context-lost).
                    Ẩn khi panel thông tin mở để không đè nút X của panel. */}
                {viewMode === 'microscope' && !selectedOrganelle && (
                    <div className="absolute right-4 top-4 pointer-events-auto">
                        <button
                            onClick={() => setMenuOpen(v => !v)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md border border-white/10 transition-all"
                        >
                            <span className="text-sm font-semibold hidden sm:inline">Đổi mẫu</span>
                            <ChevronDown size={16} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-44 bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-xl">
                                {CELL_DATA.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => enterCell(c.id)}
                                        className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 hover:bg-white/10 transition-colors ${c.id === selectedCellId ? 'text-purple-300 font-bold' : 'text-white'}`}
                                    >
                                        <span>{c.id === 'animal' ? '🔴' : c.id === 'plant' ? '🌿' : '🦠'}</span>
                                        {c.name.replace('Tế Bào ', '')}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* === LAB OVERLAY (mờ dần để lộ scene phía sau) === */}
            {viewMode === 'lab' && (
                <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center transition-all duration-1000 ${isZooming ? 'scale-[3] opacity-0' : 'scale-100 opacity-100'}`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 -z-10">
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-pink-500 via-transparent to-transparent" />
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_80%,_var(--tw-gradient-stops))] from-cyan-500 via-transparent to-transparent" />
                    </div>

                    <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 tracking-wide drop-shadow-lg">
                        🔬 Chọn Mẫu Vật Để Soi!
                    </h2>
                    <p className="text-white/60 mb-10 text-lg">Nhấp vào mẫu vật bạn muốn khám phá</p>

                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center py-8">
                        {CELL_DATA.map((cell, index) => (
                            <button
                                key={cell.id}
                                onClick={() => enterCell(cell.id)}
                                className={`
                                    group relative w-48 h-24 md:w-40 md:h-56 rounded-2xl transition-all duration-300
                                    hover:-translate-y-2 md:hover:-translate-y-6 hover:scale-105
                                    flex flex-row md:flex-col items-center justify-center gap-3 px-4 md:px-0
                                    border-2 shadow-2xl overflow-hidden shrink-0
                                    ${cell.id === 'animal' ? 'bg-gradient-to-br from-rose-500/80 to-red-600/80 border-rose-400 hover:shadow-[0_0_40px_rgba(244,63,94,0.5)]' : ''}
                                    ${cell.id === 'plant' ? 'bg-gradient-to-br from-emerald-500/80 to-green-600/80 border-emerald-400 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]' : ''}
                                    ${cell.id === 'bacteria' ? 'bg-gradient-to-br from-amber-500/80 to-orange-600/80 border-amber-400 hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]' : ''}
                                `}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="text-4xl md:text-6xl group-hover:scale-125 transition-transform duration-300">
                                    {cell.id === 'animal' && '🔴'}
                                    {cell.id === 'plant' && '🌿'}
                                    {cell.id === 'bacteria' && '🦠'}
                                </div>
                                <span className="relative font-bold text-lg text-white drop-shadow-lg">
                                    {cell.name.replace('Tế Bào ', '')}
                                </span>
                                <span className="hidden md:inline text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full">Nhấp để soi 👆</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* === MICROSCOPE CHROME === */}
            {viewMode === 'microscope' && (
                <main className="relative z-10 w-full h-screen pointer-events-none">
                    {/* Fallback 2D */}
                    {use2D && (
                        <div className="w-full h-full flex items-center justify-center pt-20 pointer-events-auto">
                            <div className="absolute inset-0 pointer-events-none radial-vignette z-0 opacity-40" />
                            <div className={`transition-all duration-500 ${selectedOrganelle ? 'mr-[0px] md:mr-[400px] scale-90' : 'scale-100'}`}>
                                <CellCanvas cellType={selectedCell} onOrganelleClick={(o) => setSelectedOrganelle(o)} />
                            </div>
                        </div>
                    )}

                    {/* DNA helix khi chọn nhân / vùng nhân.
                        Mobile: căn giữa vùng trống phía trên panel (bottom sheet 70vh).
                        Desktop: cạnh trái panel bên phải. */}
                    {isDNA && (
                        <div className="flex absolute z-30 pointer-events-none animate-in fade-in duration-700
                            left-1/2 -translate-x-1/2 top-[68px] w-20 h-40 slide-in-from-bottom
                            md:left-auto md:translate-x-0 md:right-[420px] md:top-1/2 md:-translate-y-1/2 md:w-28 md:h-72 md:slide-in-from-right">
                            <DNAHelix className="w-full h-full" color={selectedOrganelle!.color} />
                        </div>
                    )}

                    {/* Nút zoom (3D) */}
                    {!use2D && !selectedOrganelle && (
                        <div className="absolute bottom-8 right-8 z-40 flex flex-col gap-2 pointer-events-auto">
                            <button onClick={() => sceneApiRef.current?.zoomIn()} className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all">
                                <ZoomIn size={22} />
                            </button>
                            <button onClick={() => sceneApiRef.current?.zoomOut()} className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-all">
                                <ZoomOut size={22} />
                            </button>
                        </div>
                    )}

                    {/* Gợi ý */}
                    {!selectedOrganelle && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 text-white/45 text-xs sm:text-sm pointer-events-none text-center px-4">
                            Kéo để xoay · chạm tên bộ phận để khám phá · chạm vùng trống để quay lại
                        </div>
                    )}

                    <div className="pointer-events-auto">
                        <DetailPanel organelle={selectedOrganelle} onClose={resetFocus} />
                    </div>
                </main>
            )}

            {/* WebGL context lost */}
            {contextLost && (
                <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center gap-4 cursor-pointer" onClick={() => window.location.reload()}>
                    <span className="text-5xl">🔬</span>
                    <p className="text-white text-xl font-bold">Ôi! Kính hiển vi gặp trục trặc nhỏ.</p>
                    <p className="text-white/70">Chạm vào màn hình để tải lại nhé!</p>
                </div>
            )}

            <style>{`
                .radial-vignette { background: radial-gradient(circle, transparent 50%, black 100%); }
            `}</style>
        </div>
    );
};
