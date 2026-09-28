import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { EvolutionNode as IEvolutionNode } from '@/src/data/evolutionData';
import { ChevronRight, ChevronDown, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


interface EvolutionNodeProps {
    node: IEvolutionNode;
    parentNode?: IEvolutionNode;
    depth?: number;
    onInfoClick: (node: IEvolutionNode) => void;
    onDrillDown?: (node: IEvolutionNode, parentNode?: IEvolutionNode) => void;
    onNavigateUp?: () => void;
    isDrilled?: boolean;
    expandedIds: Set<string>;
    onToggle: (nodeId: string) => void;
}

const GAP = 125;

// Stagger breathing so nodes don't pulse in sync
const breathDuration = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
    return 3 + (Math.abs(hash) % 3); // 3-5s
};
const breathDelay = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
    return (Math.abs(hash) % 2000) / 1000; // 0-2s
};

export const EvolutionNode: React.FC<EvolutionNodeProps> = ({
    node,
    parentNode,
    depth = 0,
    onInfoClick,
    onDrillDown,
    onNavigateUp,
    isDrilled,
    expandedIds,
    onToggle
}) => {
    const isExpanded = expandedIds.has(node.id);
    const [connectorPaths, setConnectorPaths] = useState<string[]>([]);
    const [childYs, setChildYs] = useState<number[]>([]);
    const [hoveredChildIndex, setHoveredChildIndex] = useState<number | null>(null);

    const childrenContainerRef = useRef<HTMLDivElement>(null);
    const childRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Safe state setter to prevent infinite loops from identical path updates
    const setConnectorPathsSafe = useCallback((nextPaths: string[]) => {
        setConnectorPaths(prev => {
            if (prev.length === nextPaths.length && prev.every((p, i) => p === nextPaths[i])) {
                return prev;
            }
            return nextPaths;
        });
    }, []);

    const isRoot = node.type === 'root';
    const hasChildren = node.children && node.children.length > 0;

    // === UX FIX: Click node → show info (primary action) ===
    const handleNodeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Navigate up when clicking parent context node only if currently drilled down
        if (depth === 0 && onNavigateUp && isDrilled) {
            onNavigateUp();
            return;
        }
        // Primary action: always show info
        onInfoClick(node);
    };

    // Separate handler for expand/collapse chevron
    const handleToggleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) onToggle(node.id);
    };

    // Separate handler for drill-down
    const handleDrillDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDrillDown && hasChildren) {
            onDrillDown(node, parentNode);
        }
    };

    // Calculate connector paths
    const updateConnectors = useCallback(() => {
        if (!isExpanded || !childrenContainerRef.current) {
            setConnectorPathsSafe([]);
            setChildYs([]);
            return;
        }

        const container = childrenContainerRef.current;
        const containerHeight = Math.round(container.offsetHeight);
        const startY = Math.round(containerHeight / 2);
        const startX = 0;
        const paths: string[] = [];
        const ys: number[] = [];

        node.children?.forEach((_, index) => {
            const childEl = childRefs.current[index];
            if (!childEl) return;
            const childY = Math.round(childEl.offsetTop + (childEl.offsetHeight / 2));
            ys.push(childY);
            const endX = Math.round(GAP);
            const midX = Math.round(GAP / 2);
            const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${childY}, ${endX} ${childY}`;
            paths.push(d);
        });

        setConnectorPathsSafe(paths);
        setChildYs(prev => {
            if (prev.length === ys.length && prev.every((v, idx) => v === ys[idx])) {
                return prev;
            }
            return ys;
        });
    }, [isExpanded, node.children, setConnectorPathsSafe]);

    // Observe size changes of the children container
    useLayoutEffect(() => {
        if (!childrenContainerRef.current) return;
        const observer = new ResizeObserver(updateConnectors);
        observer.observe(childrenContainerRef.current);
        return () => observer.disconnect();
    }, [updateConnectors]);

    // Recalculate paths on key frames during and after the expansion animation
    useEffect(() => {
        if (isExpanded) {
            const t1 = setTimeout(updateConnectors, 50);
            const t2 = setTimeout(updateConnectors, 150);
            const t3 = setTimeout(updateConnectors, 400); // 350ms transition + 50ms buffer
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
            };
        }
    }, [isExpanded, updateConnectors]);

    const bDur = breathDuration(node.id);
    const bDel = breathDelay(node.id);

    return (
        <div className="flex items-center">
            {/* NODE */}
            <div className={`relative group flex-shrink-0 mx-6 my-4 ${isRoot ? 'z-20' : 'z-10'}`}>
                {/* Breathing glow behind node */}
                <div
                    className="absolute -inset-3 rounded-full pointer-events-none -z-10"
                    style={{
                        background: `radial-gradient(circle, ${node.color}40 0%, transparent 70%)`,
                        animation: `evo-breathe ${bDur}s ease-in-out ${bDel}s infinite`,
                    }}
                />

                {/* Orbit ring (visual flair) */}
                {!isRoot && hasChildren && (
                    <div
                        className="absolute -inset-1.5 rounded-full border border-white/10 pointer-events-none -z-10"
                        style={{
                            animation: `evo-orbit ${8 + (depth % 3) * 2}s linear infinite`,
                            borderRadius: '45% 55% 60% 40% / 50% 45% 55% 50%',
                        }}
                    />
                )}

                {/* Main clickable node — shows info */}
                <button
                    id={`node-${node.id}`}
                    onClick={handleNodeClick}
                    title={`${node.label} — ${node.era}`}
                    className={`
                        relative w-28 h-28 md:w-36 md:h-36 flex flex-col items-center justify-center p-3 text-center
                        transition-all duration-300 hover:scale-110 active:scale-95 z-20
                        ${isRoot ? 'animate-blob' : 'shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]'}
                        border-2 rounded-full cursor-pointer
                    `}
                    style={{
                        backgroundColor: node.color,
                        borderColor: isExpanded ? '#ffffff' : 'rgba(255,255,255,0.3)',
                        borderRadius: isRoot ? '60% 40% 30% 70% / 60% 30% 70% 40%' : '50%',
                        animation: isRoot ? undefined : `evo-breathe ${bDur}s ease-in-out ${bDel}s infinite`,
                    }}
                >
                    {isRoot && (
                        <>
                            <div className="absolute -inset-8 bg-blue-500/40 rounded-full blur-2xl animate-pulse -z-10" />
                            <div className="absolute -inset-2 border border-white/30 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-[spin_8s_linear_infinite] opacity-60 pointer-events-none" />
                        </>
                    )}

                    {/* Gloss sphere effect */}
                    <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent_60%)] mix-blend-overlay" />
                        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.4),transparent_50%)] mix-blend-multiply" />
                        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]" />
                    </div>

                    {/* Label */}
                    <span className="font-bold text-white drop-shadow-md text-xs md:text-sm pointer-events-none leading-tight relative z-10">
                        {node.label}
                    </span>
                    {!isRoot && (
                        <span className="text-[8px] uppercase tracking-wider text-white/70 mt-0.5 pointer-events-none">
                            {node.englishLabel || node.type}
                        </span>
                    )}

                    {/* "Quay lại" hint for root in drilled view */}
                    {depth === 0 && onNavigateUp && isDrilled && (
                        <div className="flex items-center gap-1 text-[9px] text-white/60 mt-1 opacity-80 group-hover:text-white transition-colors">
                            <ChevronRight size={10} className="rotate-180" />
                            <span>Quay lại</span>
                        </div>
                    )}

                    {/* Hover tooltip — era + first trait */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                        <div className="bg-black/80 backdrop-blur-sm text-[10px] text-white/80 px-2.5 py-1 rounded-full border border-white/10 shadow-lg">
                            {node.era}{node.traits.length > 0 ? ` · ${node.traits[0]}` : ''}
                        </div>
                    </div>
                </button>

                {/* === SEPARATE ACTION BUTTONS (always visible) === */}
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-30">
                    {/* Expand/Collapse chevron (separate from info click) */}
                    {hasChildren && !node.drillable && (
                        <button
                            onClick={handleToggleClick}
                            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                            className={`
                                p-1.5 rounded-full shadow-md transition-all duration-300
                                bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900
                                hover:scale-110 active:scale-95
                            `}
                        >
                            {isExpanded
                                ? <ChevronDown size={14} />
                                : <ChevronRight size={14} />
                            }
                        </button>
                    )}

                    {/* Drill-down button for drillable nodes */}
                    {node.drillable && onDrillDown && hasChildren && depth !== 0 && !(isDrilled && depth === 1) && (
                        <button
                            onClick={handleDrillDown}
                            title="Khám phá chi tiết"
                            className="p-1.5 rounded-full shadow-md bg-yellow-400 hover:bg-yellow-300 text-yellow-900 transition-all hover:scale-110 active:scale-95"
                        >
                            <Compass size={14} />
                        </button>
                    )}
                </div>

                {/* Milestone badge */}
                {node.milestone && depth > 0 && (
                    <div className="absolute -top-2 -left-2 bg-black/80 backdrop-blur border border-yellow-500/40 text-yellow-300 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap z-30">
                        ★ {node.milestone.label}
                    </div>
                )}
            </div>

            {/* CONNECTORS + CHILDREN */}
            <AnimatePresence initial={false}>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, width: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, width: 'auto', transitionEnd: { overflow: 'visible' } }}
                        exit={{ opacity: 0, width: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="flex"
                    >
                        {/* SVG Connector Area */}
                        <div className="relative h-auto flex-shrink-0" style={{ width: GAP }}>
                            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                <defs>
                                    {node.children!.map((child, i) => (
                                        <linearGradient
                                            key={`grad-${child.id}`}
                                            id={`conn-${node.id}-${i}`}
                                            gradientUnits="userSpaceOnUse"
                                            x1="0"
                                            y1="0"
                                            x2={GAP}
                                            y2="0"
                                        >
                                            <stop offset="0%" stopColor={node.color} stopOpacity="0.6" />
                                            <stop offset="100%" stopColor={child.color} stopOpacity="0.6" />
                                        </linearGradient>
                                    ))}
                                </defs>
                                {connectorPaths.map((d, i) => {
                                    const isHovered = hoveredChildIndex === i;
                                    return (
                                        <g key={i}>
                                            {/* Glow path */}
                                            <path
                                                d={d}
                                                fill="none"
                                                stroke={`url(#conn-${node.id}-${i})`}
                                                strokeWidth={isHovered ? 8 : 6}
                                                strokeLinecap="round"
                                                opacity={isHovered ? 0.7 : 0.3}
                                                className="transition-all duration-300"
                                            />
                                            {/* Main path with animated dash */}
                                            <path
                                                d={d}
                                                fill="none"
                                                stroke={`url(#conn-${node.id}-${i})`}
                                                strokeWidth={isHovered ? 3 : 2}
                                                strokeLinecap="round"
                                                strokeDasharray="6 4"
                                                className="evo-connector-flow"
                                                style={{ opacity: isHovered ? 1 : 0.7 }}
                                            />
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* CHILDREN COLUMN */}
                        <div ref={childrenContainerRef} className="relative flex flex-col gap-12 py-6 flex-shrink-0 w-max">
                            {node.children!.map((child, index) => (
                                <div
                                    key={child.id}
                                    ref={el => { childRefs.current[index] = el }}
                                    className="relative animate-in fade-in slide-in-from-left-4 duration-500"
                                    style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
                                    onMouseEnter={() => setHoveredChildIndex(index)}
                                    onMouseLeave={() => setHoveredChildIndex(null)}
                                >
                                    <EvolutionNode
                                        node={child}
                                        parentNode={node}
                                        depth={depth + 1}
                                        onInfoClick={onInfoClick}
                                        onDrillDown={onDrillDown}
                                        onNavigateUp={onNavigateUp}
                                        isDrilled={isDrilled}
                                        expandedIds={expandedIds}
                                        onToggle={onToggle}
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes blob {
                    0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
                    50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
                    100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
                }
                .animate-blob {
                    animation: blob 8s ease-in-out infinite;
                }
                @keyframes evo-breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.03); }
                }
                @keyframes evo-orbit {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .evo-connector-flow {
                    animation: evo-dash-flow 2s linear infinite;
                }
                @keyframes evo-dash-flow {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: -20; }
                }
            `}</style>
        </div>
    );
};
