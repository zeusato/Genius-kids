import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { EvolutionNode as IEvolutionNode } from '@/src/data/evolutionData';
import { Info, ChevronRight, ChevronLeft } from 'lucide-react';

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

const GAP = 100; // Horizontal distance between Parent and Children

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

    // Refs for measurements
    const childrenContainerRef = useRef<HTMLDivElement>(null);
    const childRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.children && node.children.length > 0) {
            onToggle(node.id);
        }
    };

    const handleDrillDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDrillDown && node.children && node.children.length > 0) {
            onDrillDown(node, parentNode); // Pass parentNode
        }
    };

    // Calculate connector paths relative to the children container
    const updateConnectors = useCallback(() => {
        if (!isExpanded || !childrenContainerRef.current) {
            setConnectorPaths([]);
            return;
        }

        const container = childrenContainerRef.current;
        const containerHeight = container.offsetHeight;

        // Assumption: Parent is vertically centered relative to this container (due to flex items-center)
        // Adjust Start Y to be the center of the container
        const startY = containerHeight / 2;
        const startX = 0; // Left edge of the SVG area (which equals Parent Right Edge)

        const paths: string[] = [];

        node.children?.forEach((_, index) => {
            const childEl = childRefs.current[index];
            if (!childEl) return;

            // Child Y center relative to the container
            const childY = childEl.offsetTop + (childEl.offsetHeight / 2);
            const endX = GAP; // Right edge of SVG area (Child Left Edge)

            // Cubic Bezier Logic: M start C mid start, mid end, end end
            // This creates the "NotebookLM" style S-curve with branching
            const midX = GAP / 2;

            const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${childY}, ${endX} ${childY}`;
            paths.push(d);
        });

        setConnectorPaths(paths);
    }, [isExpanded, node.children]);

    // Recalculate on layout changes
    useLayoutEffect(() => {
        updateConnectors();
        // Observer for dynamic content changes
        if (!childrenContainerRef.current) return;

        const observer = new ResizeObserver(updateConnectors);
        observer.observe(childrenContainerRef.current);

        return () => observer.disconnect();
    }, [updateConnectors]);

    const handleNodeClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // 1. Navigation UP: If current node is the "Parent Context" (Depth 0)
        // If we have a navigation handler and we are at depth 0, it means we are the "Parent" in a focused view
        if (depth === 0 && onNavigateUp) {
            onNavigateUp();
            return;
        }

        // 2. Expand/Collapse: If current node is the "Focus Node" (Depth 1) in a drilled view
        if (depth === 1 && isDrilled) {
            handleToggle(e);
            return;
        }

        // 3. Drill Down: If explicitly marked drillable
        if (node.drillable && onDrillDown && node.children && node.children.length > 0) {
            handleDrillDown(e);
        } else {
            // 4. Default: Toggle
            handleToggle(e);
        }
    };

    const isRoot = node.type === 'root';
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex items-center">
            {/* PARENT NODE */}
            <div className={`relative group flex-shrink-0 ${isRoot ? 'z-20' : 'z-10'}`}>
                <button
                    id={`node-${node.id}`}
                    onClick={handleNodeClick}
                    className={`
                        relative w-28 h-28 md:w-36 md:h-36 flex flex-col items-center justify-center p-3 text-center
                        transition-all duration-300 hover:scale-105 active:scale-95 z-20
                        ${isRoot ? 'animate-blob' : 'shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]'}
                        border-4 rounded-full
                    `}
                    style={{
                        backgroundColor: node.color,
                        borderColor: isExpanded ? '#ffffff' : 'rgba(255,255,255,0.3)',
                        borderRadius: isRoot ? '60% 40% 30% 70% / 60% 30% 70% 40%' : '50%'
                    }}
                >
                    {isRoot && (
                        <>
                            {/* Outer Glow - Puts a colored haze behind the node */}
                            <div className="absolute -inset-8 bg-blue-500/40 rounded-full blur-2xl animate-pulse -z-10" />

                            {/* Spinning Orbit Ring */}
                            <div className="absolute -inset-2 border border-white/30 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] animate-[spin_8s_linear_infinite] opacity-60 pointer-events-none" />
                        </>
                    )}

                    {/* Internal 3D Highlights - Applied to ALL nodes for "Sphere/Cell" look */}
                    <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
                        {/* Top-left shine (Glassy/Wet look) */}
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent_60%)] mix-blend-overlay" />

                        {/* Bottom-right shadow (Depth) */}
                        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.4),transparent_50%)] mix-blend-multiply" />

                        {/* Subtle inner rim light */}
                        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0_0_10px_rgba(255,255,255,0.2)]" />
                    </div>

                    <span className="font-bold text-white drop-shadow-md text-xs md:text-sm pointer-events-none leading-tight relative z-10">
                        {node.label}
                    </span>
                    {!isRoot && (
                        <span className="text-[8px] uppercase tracking-wider text-white/70 mt-0.5 pointer-events-none">
                            {node.englishLabel || node.type}
                        </span>
                    )}

                    {/* Visual Hint for Back Navigation */}
                    {depth === 0 && onNavigateUp && (
                        <div className="flex items-center gap-1 text-[9px] text-white/60 mt-1 opacity-80 group-hover:text-white transition-colors">
                            <ChevronLeft size={10} />
                            <span>Quay lại</span>
                        </div>
                    )}

                    {/* Visual Hint for Drill Down */}
                    {node.drillable && onDrillDown && hasChildren && depth !== 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-yellow-300 font-bold tracking-wide mt-1 animate-pulse drop-shadow-md">
                            <span>Khám phá</span>
                            <ChevronRight size={12} strokeWidth={3} />
                        </div>
                    )}

                    {hasChildren && !node.drillable && (
                        <div className={`absolute -right-3 top-1/2 -translate-y-1/2 bg-white text-slate-900 rounded-full p-1 shadow-md transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronRight size={14} />
                        </div>
                    )}
                    <div
                        onClick={(e) => { e.stopPropagation(); onInfoClick(node); }}
                        className="absolute -top-1 -right-1 bg-white text-blue-600 rounded-full p-1.5 shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300 hover:bg-blue-50 z-20 pointer-events-auto"
                    >
                        <Info size={14} />
                    </div>
                </button>
            </div>

            {/* CONNECTORS + CHILDREN */}
            {isExpanded && hasChildren && (
                <div className="flex">
                    {/* SVG Connector Area (Fixed Width GAP) */}
                    {/* Positioned relative to the flex container so it sits between Parent and Children */}
                    <div className="relative h-auto flex-shrink-0" style={{ width: GAP }}>
                        <svg
                            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                        // We use the height of the CHILDREN container for the coordinate space
                        // But actually, this div scales with the parent flex container row height.
                        // The start point (Parent Center) corresponds to 50% height of this area if parent is centered.
                        >
                            {connectorPaths.map((d, i) => (
                                <g key={i}>
                                    <path d={d} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" strokeLinecap="round" />
                                    <path d={d} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
                                </g>
                            ))}
                        </svg>
                    </div>

                    {/* CHILDREN COLUMN */}
                    <div ref={childrenContainerRef} className="flex flex-col gap-8 py-4">
                        {node.children!.map((child, index) => (
                            <div
                                key={child.id}
                                ref={el => { childRefs.current[index] = el }}
                                className="relative"
                            >
                                {/* Milestone Badge */}
                                {child.milestone && (
                                    <div className="absolute -left-20 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur border border-yellow-500/40 text-yellow-300 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap z-30">
                                        ★ {child.milestone.label}
                                    </div>
                                )}

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
                </div>
            )}

            <style>{`
                @keyframes blob {
                    0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
                    50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
                    100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
                }
                .animate-blob {
                    animation: blob 8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
