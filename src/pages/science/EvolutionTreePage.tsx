import React, { useState, useRef, useMemo } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { EVOLUTION_TREE_DATA, EvolutionNode as IEvolutionNode } from '@/src/data/evolutionData';
import { EvolutionNode } from '@/src/components/evolution/EvolutionNode';
import { NodeDetailModal } from '@/src/components/evolution/NodeDetailModal';
import { EvolutionParticles } from '@/src/components/evolution/EvolutionParticles';
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

// Canvas Constants
const CANVAS_WIDTH = 4000;
const CANVAS_HEIGHT = 3000;
const INITIAL_SCALE = 0.8;

export const EvolutionTreePage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedNode, setSelectedNode] = useState<IEvolutionNode | null>(null);
    const transformRef = useRef<ReactZoomPanPinchRef>(null);

    // Calculate initial center position based on screen size
    const getInitialPosition = () => {
        if (typeof window === 'undefined') return { x: -1000, y: -1000 };
        const x = (window.innerWidth - CANVAS_WIDTH * INITIAL_SCALE) / 2;
        const y = (window.innerHeight - CANVAS_HEIGHT * INITIAL_SCALE) / 2;
        return { x, y };
    };

    const [initialPos] = useState(getInitialPosition());

    // Drill-down State
    interface HistoryState {
        root: IEvolutionNode;
        expandedIds: Set<string>;
    }
    const [currentRoot, setCurrentRoot] = useState<IEvolutionNode>(EVOLUTION_TREE_DATA);
    const [history, setHistory] = useState<HistoryState[]>([]);

    // Expansion State
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['life_origin']));

    // Animation State
    const [transition, setTransition] = useState<'none' | 'zoom-in' | 'zoom-out'>('none');

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
        setTransition('zoom-in');

        setTimeout(() => {
            // Snapshot current state before drilling
            setHistory(prev => [...prev, { root: currentRoot, expandedIds: new Set(expandedIds) }]);

            let newRoot = node;
            if (parentNode) {
                newRoot = {
                    ...parentNode,
                    children: [node],
                };
            }

            setCurrentRoot(newRoot);
            setExpandedIds(new Set([newRoot.id, node.id]));

            if (transformRef.current) {
                transformRef.current.resetTransform(0);
            }
            // Start fade-in of new scene
            requestAnimationFrame(() => {
                setTransition('none');
            });
        }, 800);
    };

    const handleNavigateUp = (index: number) => {
        setTransition('zoom-out');

        setTimeout(() => {
            if (index === -1) {
                setCurrentRoot(EVOLUTION_TREE_DATA);
                setHistory([]);
                setExpandedIds(new Set(['life_origin']));
            } else {
                const targetState = history[index];
                setHistory(history.slice(0, index));
                setCurrentRoot(targetState.root);
                setExpandedIds(targetState.expandedIds);
            }

            if (transformRef.current) {
                transformRef.current.resetTransform(0);
            }
            requestAnimationFrame(() => {
                setTransition('none');
            });
        }, 800);
    };

    // Derive era from current root for particle palette
    const currentEra = currentRoot.era;

    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-950 font-sans relative">
            {/* Living particle background */}
            <div className="absolute inset-0 z-0">
                <EvolutionParticles era={currentEra} />
            </div>

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
                        {/* Global root link */}
                        {history.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleNavigateUp(-1)}
                                    className="text-white/60 hover:text-white text-xs font-medium transition-colors"
                                >
                                    🌍 Gốc
                                </button>
                                <span className="text-white/20">/</span>
                            </div>
                        )}
                        {history.map((state, index) => {
                            const displayLabel = state.root.children && state.root.children.length === 1
                                ? state.root.children[0].label
                                : state.root.label;
                            return (
                                <div key={state.root.id} className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleNavigateUp(index)}
                                        className="text-white/60 hover:text-white text-xs font-medium transition-colors"
                                    >
                                        {displayLabel}
                                    </button>
                                    <span className="text-white/20">/</span>
                                </div>
                            );
                        })}
                        <span className="text-white text-xs font-bold px-2 py-1 bg-white/10 rounded-lg">
                            {currentRoot.children && currentRoot.children.length === 1
                                ? currentRoot.children[0].label
                                : currentRoot.label}
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400 drop-shadow-lg text-center mb-1">
                        🧬 Cây Tiến Hóa
                    </h1>
                    <p className="text-white/40 text-xs">Nhấp vào sinh vật để khám phá</p>
                </div>

                {/* Spacer for right side */}
                <div className="w-24" />
            </div>

            {/* Main Canvas */}
            <TransformWrapper
                ref={transformRef}
                initialScale={INITIAL_SCALE}
                initialPositionX={initialPos.x}
                initialPositionY={initialPos.y}
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
                            <button onClick={() => transformRef.current?.setTransform(initialPos.x, initialPos.y, INITIAL_SCALE)} title="Căn Giữa" className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur border border-white/10 transition-colors mb-2">
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
                            <div
                                className={`min-w-[4000px] min-h-[3000px] flex items-center justify-center relative transition-all ease-in-out
                                    ${transition === 'zoom-in' ? 'scale-[2] opacity-0 blur-sm' : ''}
                                    ${transition === 'zoom-out' ? 'scale-50 opacity-0 blur-sm' : ''}
                                    ${transition === 'none' ? 'scale-100 opacity-100 blur-0' : ''}
                                `}
                                style={{ transitionDuration: '800ms' }}
                            >
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

            {/* Detail Modal */}
            <NodeDetailModal
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
            />

            {/* Hint at bottom */}
            <div className="absolute bottom-3 left-4 z-40 text-[10px] text-white/30 pointer-events-none">
                Kéo để di chuyển · Cuộn để phóng to/thu nhỏ · Nhấp vào sinh vật để xem chi tiết
            </div>
        </div>
    );
};
