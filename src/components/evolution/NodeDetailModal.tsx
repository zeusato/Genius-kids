import React from 'react';
import { EvolutionNode } from '@/src/data/evolutionData';
import { X, ExternalLink, Scroll, Clock, Dna } from 'lucide-react';

interface NodeDetailModalProps {
    node: EvolutionNode | null;
    onClose: () => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ node, onClose }) => {
    if (!node) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Card */}
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header Image/Banner */}
                <div className="h-40 relative bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden">
                    {node.imageUrl ? (
                        <div className="absolute inset-0">
                            <img src={node.imageUrl} alt={node.label} className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 opacity-30" style={{ backgroundColor: node.color }} />
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="absolute bottom-4 left-6">
                        <span className="text-white/60 text-xs uppercase tracking-widest bg-white/10 px-2 py-1 rounded mb-2 inline-block">
                            {node.era}
                        </span>
                        <h2 className="text-3xl font-bold text-white mb-0 flex items-center gap-3">
                            {node.label}
                            {node.milestone && (
                                <span className="text-yellow-400 text-lg" title={node.milestone.label}>★</span>
                            )}
                        </h2>
                        <p className="text-white/70 text-sm capitalize">{node.type}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <p className="text-lg text-slate-300 leading-relaxed mb-8">
                        {node.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Traits Section */}
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                            <h3 className="flex items-center gap-2 text-purple-400 font-bold uppercase text-sm mb-4">
                                <Dna size={16} /> Đặc Điểm Nổi Bật
                            </h3>
                            <ul className="space-y-3">
                                {node.traits.map((trait, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-slate-300">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        {trait}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Milestone/Era Section */}
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                            <h3 className="flex items-center gap-2 text-amber-400 font-bold uppercase text-sm mb-4">
                                <Clock size={16} /> Cột Mốc Thời Gian
                            </h3>
                            {node.milestone ? (
                                <div>
                                    <div className="text-2xl font-bold text-white mb-1">{node.milestone.label}</div>
                                    <div className="text-amber-200/60 text-sm mb-3">{node.milestone.year}</div>
                                    <p className="text-slate-400 text-sm italic">
                                        "{node.milestone.description || 'Một bước tiến quan trọng trong lịch sử sự sống.'}"
                                    </p>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">
                                    Thịnh vượng trong kỷ nguyên <span className="text-white font-bold">{node.era}</span>.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Infographic Button */}
                    <div className="mt-8 flex justify-center">
                        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1 font-bold">
                            <Scroll size={20} />
                            Xem Infographic Chi Tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
