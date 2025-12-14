import React from 'react';
import { EvolutionNode } from '@/src/data/evolutionData';
import { X, ExternalLink, Scroll, Clock, Dna, Image as ImageIcon } from 'lucide-react';
import { getInfographicUrl } from '@/src/lib/supabase';

interface NodeDetailModalProps {
    node: EvolutionNode | null;
    onClose: () => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ node, onClose }) => {
    const [showInfographic, setShowInfographic] = React.useState(false);
    const [isPortrait, setIsPortrait] = React.useState(false);

    React.useEffect(() => {
        const checkOrientation = () => {
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

    if (!node) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Card */}
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header Image/Banner */}
                <div className="h-28 relative bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden flex flex-col justify-end p-6">
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

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-white/60 text-[10px] uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">
                                {node.era}
                            </span>
                            <span className="text-white/50 text-xs capitalize">• {node.englishLabel}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-0 flex items-center gap-2">
                            {node.label}
                            {node.milestone && (
                                <span className="text-yellow-400 text-sm" title={node.milestone.label}>★</span>
                            )}
                        </h2>
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
                                {(node.traits || []).map((trait, idx) => (
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
                    {node.infographicUrl && (
                        <div className="mt-8 flex justify-center">
                            <button
                                onClick={() => setShowInfographic(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1 font-bold"
                            >
                                <ImageIcon size={20} />
                                Xem Infographic Chi Tiết
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Infographic Modal Overlay */}
            {showInfographic && node.infographicUrl && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setShowInfographic(false)}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setShowInfographic(false)}
                        className="absolute top-4 right-4 z-[210] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/20"
                    >
                        <X size={24} />
                    </button>

                    {/* Infographic Image Container */}
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
                            src={getInfographicUrl(node.infographicUrl)}
                            alt={`${node.label} Infographic`}
                            className="w-full h-full object-contain pointer-events-auto"
                            onError={(e) => {
                                // Fallback to jpeg if png fails (just a safety precaution)
                                const img = e.target as HTMLImageElement;
                                if (img.src.endsWith('.png')) {
                                    img.src = img.src.replace('.png', '.jpeg');
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
