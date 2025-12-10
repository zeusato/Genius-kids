import React from 'react';
import { X, ExternalLink, Dna, Brain, Zap, Trash2 } from 'lucide-react';
import { Organelle } from '@/src/data/cellData';

interface DetailPanelProps {
    organelle: Organelle | null;
    onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ organelle, onClose }) => {
    if (!organelle) return null;

    // Helper to get icon for specific type of info
    const getSectionIcon = (type: string) => {
        switch (type) {
            case 'structure': return <Dna size={18} />;
            case 'function': return <Zap size={18} />;
            case 'analogy': return <Brain size={18} />;
            default: return <ExternalLink size={18} />;
        }
    };

    return (
        <>
            {/* Backdrop for mobile - tap to close */}
            <div
                className="fixed inset-0 bg-black/40 z-40 sm:hidden animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Panel - Bottom sheet on mobile, side panel on desktop */}
            <div className="fixed inset-x-0 bottom-0 h-[70vh] sm:h-auto sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[400px] bg-slate-900/95 backdrop-blur-xl border-t sm:border-t-0 sm:border-l border-white/10 shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 rounded-t-3xl sm:rounded-none">

                {/* Mobile drag handle */}
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-12 h-1 bg-white/30 rounded-full" />
                </div>

                {/* Content with padding */}
                <div className="p-5 sm:p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: `${organelle.color}40`, border: `1px solid ${organelle.color}` }}
                            >
                                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-pulse" style={{ backgroundColor: organelle.color }} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                                    {organelle.name}
                                </h2>
                                <p className="text-xs sm:text-sm text-white/50 italic">{organelle.nameEn}</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 active:bg-white/20 rounded-full transition-colors text-white/70 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-6">

                        {/* Summary */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <p className="text-lg text-white/90 leading-relaxed">
                                {organelle.details.summary}
                            </p>
                        </div>

                        {/* Function (The "Job") */}
                        <div className="space-y-2">
                            <h3 className="flex items-center gap-2 text-blue-400 font-bold uppercase text-sm tracking-wider">
                                <Zap size={16} /> Chức Năng
                            </h3>
                            <p className="text-white/80 pl-6 border-l-2 border-blue-500/30">
                                {organelle.details.function}
                            </p>
                        </div>

                        {/* Structure (The "Look") */}
                        <div className="space-y-2">
                            <h3 className="flex items-center gap-2 text-purple-400 font-bold uppercase text-sm tracking-wider">
                                <Dna size={16} /> Cấu Tạo
                            </h3>
                            <p className="text-white/80 pl-6 border-l-2 border-purple-500/30">
                                {organelle.details.structure}
                            </p>
                        </div>

                        {/* Analogy (The "Like A...") */}
                        <div className="space-y-2">
                            <h3 className="flex items-center gap-2 text-pink-400 font-bold uppercase text-sm tracking-wider">
                                <Brain size={16} /> So Sánh Vui
                            </h3>
                            <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/20">
                                <p className="text-pink-200">
                                    " {organelle.details.analogy} "
                                </p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-1 pt-2">
                            <p className="text-sm text-white/50">
                                <span className="font-bold text-white/70">📍 Vị trí:</span> {organelle.details.location}
                            </p>
                        </div>

                        {/* Fun Fact */}
                        <div className="mt-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl transition-opacity opacity-70 group-hover:opacity-100" />
                            <div className="relative p-5 rounded-xl border border-amber-500/30">
                                <span className="absolute top-2 right-2 text-2xl">💡</span>
                                <h4 className="font-bold text-amber-400 mb-1 text-sm uppercase">Bạn có biết?</h4>
                                <p className="text-amber-100 italic text-sm">
                                    {organelle.funFact}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};
