import React, { useState, useRef, useMemo } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { EVOLUTION_TREE_DATA, EvolutionNode as IEvolutionNode } from '@/src/data/evolutionData';
import { EvolutionNode } from '@/src/components/evolution/EvolutionNode';
import { NodeDetailModal } from '@/src/components/evolution/NodeDetailModal';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Minimize2, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Helper to get all IDs from the tree
const getAllNodeIds = (node: IEvolutionNode): string[] => {
    let ids = [node.id];
    if (node.children) {
        node.children.forEach(child => {
            ids = [...ids, ...getAllNodeIds(child)];
        });
    }
    return ids;
};

export const EvolutionTreePage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedNode, setSelectedNode] = useState<IEvolutionNode | null>(null);
    const transformRef = useRef<ReactZoomPanPinchRef>(null);

    // Drill-down State
    interface HistoryState {
        root: IEvolutionNode;
        expandedIds: Set<string>;
    }
    const [currentRoot, setCurrentRoot] = useState<IEvolutionNode>(EVOLUTION_TREE_DATA);
    const [history, setHistory] = useState<HistoryState[]>([]);

    // Expansion State
    // Expansion State
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['life_origin']));

    // Animation State
    const [isZooming, setIsZooming] = useState(false);
    const [isZoomingOut, setIsZoomingOut] = useState(false);

    // Update expandedIds when root changes to ensure the new root is expanded
    React.useEffect(() => {
        setExpandedIds(prev => new Set(prev).add(currentRoot.id));
    }, [currentRoot]);

    const handleToggle = (nodeId: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    const handleExpandAll = () => {
        const allIds = getAllNodeIds(currentRoot);
        setExpandedIds(new Set(allIds));
    };

    const handleCollapseAll = () => {
        setExpandedIds(new Set([currentRoot.id]));
    };

    const handleDrillDown = (node: IEvolutionNode, parentNode?: IEvolutionNode) => {
        setIsZooming(true);

        setTimeout(() => {
            // Snapshot current state before drilling
            setHistory(prev => [...prev, { root: currentRoot, expandedIds: new Set(expandedIds) }]);

            let newRoot = node;
            if (parentNode) {
                // Create a "Focused View" where the Parent is the Root, but it only shows the target node
                newRoot = {
                    ...parentNode,
                    children: [node],
                };
            }

            setCurrentRoot(newRoot);
            // Clear unnecessary expansions for the new view to keep it clean
            setExpandedIds(new Set([newRoot.id, node.id]));

            if (transformRef.current) {
                transformRef.current.resetTransform(0);
            }
            setIsZooming(false);
        }, 700);
    };

    const handleNavigateUp = (index: number) => {
        setIsZoomingOut(true);

        setTimeout(() => {
            if (index === -1) {
                // Reset to global root
                setCurrentRoot(EVOLUTION_TREE_DATA);
                setHistory([]);
                setExpandedIds(new Set(['life_origin'])); // Reset expansion default
            } else {
                const targetState = history[index];
                setHistory(history.slice(0, index));
                setCurrentRoot(targetState.root);
                setExpandedIds(targetState.expandedIds); // Restore snapshot
            }

            if (transformRef.current) {
                transformRef.current.resetTransform(0);
            }
            setIsZoomingOut(false);
        }, 700);
    };

    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans relative">
            {/* Header Controls */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-between items-start">
                <button
                    onClick={() => navigate('/science')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md pointer-events-auto border border-white/10 text-white transition-all"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline">Quay Lại</span>
                </button>

                <div className="flex flex-col items-center pointer-events-auto">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 mb-4 bg-slate-900/50 p-2 rounded-xl backdrop-blur-sm border border-white/10 z-50">
                        {history.map((state, index) => (
                            <div key={state.root.id} className="flex items-center gap-2">
                                <button
                                    onClick={() => handleNavigateUp(index)}
                                    className="text-white/60 hover:text-white text-xs font-medium transition-colors"
                                >
                                    {state.root.label}
                                </button>
                                <span className="text-white/20">/</span>
                            </div>
                        ))}
                        <span className="text-white text-xs font-bold px-2 py-1 bg-white/10 rounded-lg">
                            {currentRoot.label}
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 drop-shadow-lg text-center mb-1">
                        Cây Tiến Hóa
                    </h1>
                </div>
            </div>

            {/* Main Canvas */}
            <TransformWrapper
                ref={transformRef}
                initialScale={0.8}
                initialPositionX={-1000}
                initialPositionY={-1000}
                minScale={0.2}
                maxScale={2}
                limitToBounds={false}
                wheel={{ step: 0.1 }}
                centerOnInit={false}
            >
                {({ zoomIn, zoomOut }) => (
                    <>
                        {/* Control Bar (Floating) */}
                        <div className="absolute bottom-8 right-8 z-50 flex flex-col gap-2 pointer-events-auto">
                            <button onClick={() => transformRef.current?.centerView(0.8, 1000, "easeOut")} title="Căn Giữa" className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur border border-white/10 transition-colors mb-2">
                                <Target size={20} />
                            </button>
                            {history.length > 0 && (
                                <button onClick={() => handleNavigateUp(history.length - 1)} title="Quay Lại Cấp Cha" className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur border border-white/10 transition-colors mb-2">
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <button onClick={handleExpandAll} title="Mở Rộng Tất Cả" className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur border border-white/10 transition-colors">
                                <Maximize2 size={20} />
                            </button>
                            <button onClick={handleCollapseAll} title="Thu Gọn Tất Cả" className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur border border-white/10 transition-colors">
                                <Minimize2 size={20} />
                            </button>
                            <div className="h-px bg-white/10 my-1" />
                            <button onClick={() => zoomIn(0.1)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur border border-white/10 transition-colors">
                                <ZoomIn size={20} />
                            </button>
                            <button onClick={() => zoomOut(0.1)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur border border-white/10 transition-colors">
                                <ZoomOut size={20} />
                            </button>
                        </div>

                        <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
                            {/* Infinite Grid Background */}
                            <div className={`min-w-[4000px] min-h-[3000px] flex items-center justify-center relative bg-[#0B0F19] transition-all duration-700 ease-in-out ${isZooming ? 'scale-[2] opacity-0' : isZoomingOut ? 'scale-50 opacity-0' : 'scale-100 opacity-100'}`}>
                                {/* Ambient Background Effects */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/50 to-slate-950 pointer-events-none" />
                                <div className="absolute inset-0 opacity-20"
                                    style={{
                                        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                                        backgroundSize: '40px 40px'
                                    }}
                                />

                                {/* The Root of the Tree */}
                                <div className="relative z-10">
                                    <EvolutionNode
                                        node={currentRoot}
                                        onInfoClick={setSelectedNode}
                                        onDrillDown={handleDrillDown}
                                        onNavigateUp={() => handleNavigateUp(history.length - 1)}
                                        isDrilled={history.length > 0}
                                        expandedIds={expandedIds}
                                        onToggle={handleToggle}
                                    />
                                </div>
                            </div>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
            {/* Time Scale Footer (Fixed) */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent z-40 flex items-end justify-center pb-1 pointer-events-none">
                <div className="flex gap-20 text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono">
                    <span>Hadean</span>
                    <span>Archean</span>
                    <span>Proterozoic</span>
                    <span>Phanerozoic</span>
                    <span>Present</span>
                </div>
            </div>

            {/* Detail Modal */}
            <NodeDetailModal
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
            />
        </div>
    );
};
