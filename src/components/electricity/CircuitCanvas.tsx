import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ComponentType, CircuitComponentData, WireData, CircuitData } from '@/src/data/electricityData';
import { CircuitComponent } from './CircuitComponent';
import { ComponentToolbar } from './ComponentToolbar';
import { analyzeCircuit, statusFromAnalysis, POWERED_OFF_STATUS, CircuitStatus, LoadConnection } from './circuitEngine';
import { Trash2, Undo2, Zap, ZapOff } from 'lucide-react';

interface CircuitCanvasProps {
    initialCircuit?: CircuitData;
    onChange?: (circuit: CircuitData) => void;
    onCircuitStatusChange?: (status: CircuitStatus) => void;
    readOnly?: boolean;
    hideToolbar?: boolean;  // Hide component toolbar (for lesson exercises)
    autoPower?: boolean;    // Start powered & stay live (challenge mode)
}

let componentIdCounter = 0;
let wireIdCounter = 0;
// Per-module-load base so ids stay unique even if the module hot-reloads while
// React preserves the old component state (avoids duplicate-key collisions).
const ID_BASE = Math.random().toString(36).slice(2, 7);

interface HistoryState {
    components: CircuitComponentData[];
    wires: WireData[];
}

// Educational pill shown when 2+ loads are lit, so kids can see the topology
// they actually built. Empty string => no pill.
const CONNECTION_LABEL: Record<LoadConnection, string> = {
    none: '',
    single: '',
    series: '🔗 Nối tiếp',
    parallel: '🔀 Song song',
    mixed: '🔧 Mạch hỗn hợp',
};

// Stable hash of a wire id → used to give each wire its own "lane" so
// overlapping wires fan apart deterministically (separation survives re-renders).
const hashId = (id: string): number => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
    return Math.abs(h);
};

interface Pt { x: number; y: number; }

// Build a smooth cubic-Bézier wire that leaves each port horizontally (output→
// right, input→left), like a node-editor. `seed` gives the wire a stable bow so
// that wires sharing a route arc apart and (near-)horizontal runs curve around
// whatever sits between the two ports instead of cutting straight through it.
const buildWire = (from: Pt, to: Pt, fromPort: 'input' | 'output', toPort: 'input' | 'output', seed: number) => {
    const fromDir = fromPort === 'output' ? 1 : -1;
    const toDir = toPort === 'output' ? 1 : -1;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const handle = Math.max(34, Math.min(dist * 0.5, 130));

    // Bow the curve only when the two ports sit at nearly the same height
    // (otherwise the natural S-curve already separates them cleanly).
    const aligned = Math.abs(to.y - from.y) < 36;
    const bowMag = aligned ? 32 + (seed % 3) * 26 : (seed % 4) * 10; // 32/58/84 vs 0/10/20/30
    const bow = bowMag * (seed % 2 === 0 ? 1 : -1);

    const c1: Pt = { x: from.x + fromDir * handle, y: from.y + bow };
    const c2: Pt = { x: to.x + toDir * handle, y: to.y + bow };

    const path = `M ${from.x} ${from.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;
    const reversePath = `M ${to.x} ${to.y} C ${c2.x} ${c2.y} ${c1.x} ${c1.y} ${from.x} ${from.y}`;

    // Midpoint at t=0.5 for the delete handle.
    const mid: Pt = {
        x: 0.125 * from.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * to.x,
        y: 0.125 * from.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * to.y,
    };

    return { path, reversePath, mid };
};

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
    initialCircuit,
    onChange,
    onCircuitStatusChange,
    readOnly = false,
    hideToolbar = false,
    autoPower = false
}) => {
    const [components, setComponents] = useState<CircuitComponentData[]>(
        initialCircuit?.components || []
    );
    const [wires, setWires] = useState<WireData[]>(initialCircuit?.wires || []);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [status, setStatus] = useState<CircuitStatus>(POWERED_OFF_STATUS);
    const [isPowered, setIsPowered] = useState(autoPower);
    const [wireStates, setWireStates] = useState<Map<string, { isActive: boolean, isReverse: boolean }>>(new Map());

    // Latest committed state, so post-drag / async recomputes never read stale closures.
    const componentsRef = useRef(components);
    const wiresRef = useRef(wires);
    useEffect(() => { componentsRef.current = components; }, [components]);
    useEffect(() => { wiresRef.current = wires; }, [wires]);

    // Undo history
    const [history, setHistory] = useState<HistoryState[]>([]);

    // Wire drawing state
    const [wireStart, setWireStart] = useState<{ id: string; port: 'input' | 'output' } | null>(null);

    // Dragging component state
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const touchStartPos = useRef<{ x: number, y: number } | null>(null);

    // Auto-sync state to parent whenever components or wires change
    useEffect(() => {
        onChange?.({ components, wires });
    }, [components, wires]);

    // Sync rich circuit status to parent
    useEffect(() => {
        onCircuitStatusChange?.(status);
    }, [status, onCircuitStatusChange]);

    // Challenge mode starts live: compute power once for any seeded circuit.
    useEffect(() => {
        if (autoPower) updateCircuitPower(componentsRef.current, wiresRef.current, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save state to history before changes
    const saveToHistory = () => {
        setHistory(prev => [...prev.slice(-19), { components: [...components], wires: [...wires] }]);
    };

    // Undo last action
    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setComponents(lastState.components);
        setWires(lastState.wires);
        setHistory(prev => prev.slice(0, -1));
        onChange?.({ components: lastState.components, wires: lastState.wires });
    };

    // Handle drop from toolbar
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('componentType') as ComponentType;
        if (!type || type === 'wire') return;
        addComponent(type, e.clientX, e.clientY);
    }, [components, wires, onChange]);

    // Handle mobile drop from toolbar
    const handleMobileDrop = useCallback((type: ComponentType, clientX: number, clientY: number) => {
        addComponent(type, clientX, clientY);
    }, [components, wires, onChange]);

    const addComponent = (type: ComponentType, clientX: number, clientY: number) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        saveToHistory();

        const newComponent: CircuitComponentData = {
            id: `comp_${ID_BASE}_${++componentIdCounter}`,
            type,
            x: Math.max(0, Math.min(x, rect.width - 64)),
            y: Math.max(0, Math.min(y, rect.height - 64)),
            state: type === 'switch' ? 'off' : 'on',
            isActive: false,
        };

        const newComponents = [...components, newComponent];
        setComponents(newComponents);
        onChange?.({ components: newComponents, wires });

        // Keep the live simulation in sync when adding mid-run.
        if (isPowered) updateCircuitPower(newComponents, wires);
    };

    // Handle drag over
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    // Handle component drag start (repositioning)
    const handleComponentDragStart = (id: string, e: React.MouseEvent) => {
        const component = components.find(c => c.id === id);
        if (!component || readOnly || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        setDraggingId(id);
        setDragOffset({
            x: e.clientX - rect.left - component.x,
            y: e.clientY - rect.top - component.y
        });
        saveToHistory();
    };

    // Handle mouse move for dragging
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingId || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const newX = e.clientX - rect.left - dragOffset.x;
        const newY = e.clientY - rect.top - dragOffset.y;

        setComponents(prev => prev.map(c =>
            c.id === draggingId
                ? { ...c, x: Math.max(0, Math.min(newX, rect.width - 64)), y: Math.max(0, Math.min(newY, rect.height - 64)) }
                : c
        ));
    };

    // Handle mouse up for dragging
    const handleMouseUp = () => {
        if (draggingId) {
            setDraggingId(null);
            onChange?.({ components: componentsRef.current, wires: wiresRef.current });
            // Position changes can move a fan near/far from a candle.
            if (isPowered) updateCircuitPower(componentsRef.current, wiresRef.current);
        }
    };

    // --- Touch Handlers (Long Press to Drag) ---
    const handleTouchStart = (id: string, e: React.TouchEvent) => {
        if (readOnly || !canvasRef.current) return;
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };

        // Start 500ms timer for long press
        longPressTimer.current = setTimeout(() => {
            const component = components.find(c => c.id === id);
            if (component) {
                setDraggingId(id);
                const rect = canvasRef.current!.getBoundingClientRect();
                setDragOffset({
                    x: touch.clientX - rect.left - component.x,
                    y: touch.clientY - rect.top - component.y
                });
                // Vibrate to indicate drag mode
                if (navigator.vibrate) navigator.vibrate(50);
            }
        }, 500);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // If dragging, move component
        if (draggingId && canvasRef.current) {
            e.preventDefault(); // Prevent scroll logic
            const touch = e.touches[0];
            const rect = canvasRef.current.getBoundingClientRect();
            const newX = touch.clientX - rect.left - dragOffset.x;
            const newY = touch.clientY - rect.top - dragOffset.y;

            setComponents(prev => prev.map(c =>
                c.id === draggingId
                    ? { ...c, x: Math.max(0, Math.min(newX, rect.width - 64)), y: Math.max(0, Math.min(newY, rect.height - 64)) }
                    : c
            ));
        } else {
            // Check if moved too much -> Cancel long press
            if (touchStartPos.current) {
                const touch = e.touches[0];
                const dx = touch.clientX - touchStartPos.current.x;
                const dy = touch.clientY - touchStartPos.current.y;
                if (dx * dx + dy * dy > 100) { // Moved > 10px
                    if (longPressTimer.current) {
                        clearTimeout(longPressTimer.current);
                        longPressTimer.current = null;
                    }
                }
            }
        }
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (draggingId) {
            setDraggingId(null);
            onChange?.({ components: componentsRef.current, wires: wiresRef.current });
            if (isPowered) updateCircuitPower(componentsRef.current, wiresRef.current);
        }
        touchStartPos.current = null;
    };

    // Handle port click for wire creation
    const handlePortClick = (componentId: string, port: 'input' | 'output') => {
        if (readOnly) return;

        if (!wireStart) {
            // Start wire
            setWireStart({ id: componentId, port });
        } else {
            // Complete wire
            if (wireStart.id !== componentId) {
                saveToHistory();

                const newWire: WireData = {
                    id: `wire_${ID_BASE}_${++wireIdCounter}`,
                    fromId: wireStart.id,
                    fromPort: wireStart.port,
                    toId: componentId,
                    toPort: port,
                };

                const newWires = [...wires, newWire];
                setWires(newWires);
                onChange?.({ components, wires: newWires });

                // Recalculate circuit if power is on (same as toggle switch)
                if (isPowered) {
                    updateCircuitPower(components, newWires);
                }
            }
            setWireStart(null);
        }
    };

    // Toggle switch
    const handleToggleSwitch = (id: string) => {
        saveToHistory();
        const newComponents = components.map(c =>
            c.id === id ? { ...c, state: c.state === 'on' ? 'off' as const : 'on' as const } : c
        );
        setComponents(newComponents);
        onChange?.({ components: newComponents, wires });

        if (isPowered) {
            updateCircuitPower(newComponents, wires);
        }
    };

    // Clear all (reset board)
    const handleClear = () => {
        saveToHistory();
        setComponents([]);
        setWires([]);
        setSelectedId(null);
        setWireStart(null);
        setStatus(POWERED_OFF_STATUS);
        setIsPowered(autoPower); // challenge mode stays live after a reset
        setWireStates(new Map());
        onChange?.({ components: [], wires: [] });
    };

    // Delete a specific wire
    const deleteWire = (wireId: string) => {
        if (readOnly) return;
        saveToHistory();
        const newWires = wires.filter(w => w.id !== wireId);
        setWires(newWires);
        setHoveredWireId(null);
        onChange?.({ components, wires: newWires });

        // Recalculate circuit if power is on (updateCircuitPower receives newWires as param)
        if (isPowered) {
            updateCircuitPower(components, newWires);
        }
    };

    // Delete a component and any wires attached to it
    const deleteComponent = (id: string) => {
        if (readOnly) return;
        saveToHistory();
        const newComponents = components.filter(c => c.id !== id);
        const newWires = wires.filter(w => w.fromId !== id && w.toId !== id);
        setComponents(newComponents);
        setWires(newWires);
        setSelectedId(null);
        setWireStart(null);
        onChange?.({ components: newComponents, wires: newWires });

        if (isPowered) {
            updateCircuitPower(newComponents, newWires);
        }
    };
    // ========== CIRCUIT SIMULATION ==========
    // Heavy graph analysis lives in ./circuitEngine. This just maps the result
    // onto component/wire visuals and the candle "blow out" spatial effect.
    const updateCircuitPower = (
        comps: CircuitComponentData[],
        wiresData: WireData[],
        forcePoweredState?: boolean
    ) => {
        const powerOn = forcePoweredState ?? isPowered;

        // If power is OFF, reset everything
        if (!powerOn) {
            setStatus(POWERED_OFF_STATUS);
            setComponents(comps.map(c => ({ ...c, isActive: false })));
            setWireStates(new Map());
            return;
        }

        const analysis = analyzeCircuit(comps, wiresData);

        const updatedComponents = comps.map(c => ({
            ...c,
            isActive: analysis.activeIds.has(c.id),
        }));

        // Fan blows out nearby candles (spatial, not electrical).
        const activeFan = updatedComponents.find(c => c.type === 'fan' && c.isActive);
        if (activeFan) {
            updatedComponents.forEach(c => {
                if (c.type === 'candle') {
                    const distance = Math.hypot(activeFan.x - c.x, activeFan.y - c.y);
                    if (distance < 150) c.isActive = true; // blown out
                }
            });
        }

        setComponents(updatedComponents);
        setWireStates(analysis.wireStates);
        setStatus(statusFromAnalysis(analysis, true));
    };

    // Toggle power
    const handleTogglePower = () => {
        const newPowered = !isPowered;
        setIsPowered(newPowered);
        updateCircuitPower(components, wires, newPowered);
    };

    // Get component position for wire drawing
    const getPortPosition = (componentId: string, port: 'input' | 'output') => {
        const comp = components.find(c => c.id === componentId);
        if (!comp) return { x: 0, y: 0 };
        return {
            x: comp.x + (port === 'input' ? 0 : 64),
            y: comp.y + 32
        };
    };

    const batteryCount = components.filter(c => c.type === 'battery').length;

    return (
        <div className="flex flex-col-reverse md:flex-row gap-4 h-full min-h-0">
            {/* Toolbar - hidden for lesson exercises */}
            {!readOnly && !hideToolbar && (
                <div className="w-full md:w-32 flex-shrink-0 md:h-full md:min-h-0 md:overflow-y-auto">
                    <ComponentToolbar
                        onDragStart={() => { }}
                        onMobileDrop={handleMobileDrop}
                        disabled={false}
                    />
                </div>
            )}

            {/* Canvas */}
            <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">
                {/* Control bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-sky-100 to-blue-100 rounded-lg px-3 py-2 border border-sky-200">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleTogglePower}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all shadow-md
                                ${isPowered
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/30'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                                }
                            `}
                        >
                            {isPowered ? <Zap size={18} /> : <ZapOff size={18} />}
                            {isPowered ? 'Đang chạy ⚡' : 'Bật nguồn'}
                        </button>

                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${status.hasClosedLoop
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-red-100 text-red-700 border border-red-300'
                            }`}>
                            {status.hasClosedLoop ? '✓ Mạch kín' : '✗ Mạch hở'}
                        </span>

                        {status.hasShortCircuit && (
                            <span
                                className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-300 font-medium animate-pulse"
                                title="Pin bị nối thẳng (+) sang (−) mà không qua thiết bị nào — đừng làm vậy với pin thật nhé!"
                            >
                                ⚠ Đoản mạch!
                            </span>
                        )}

                        {CONNECTION_LABEL[status.loadConnection] && (
                            <span className="text-sm px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300 font-medium">
                                {CONNECTION_LABEL[status.loadConnection]}
                            </span>
                        )}

                        {batteryCount > 1 && (
                            <span
                                className="text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-300 font-medium"
                                title="Mạch chỉ hoạt động với 1 pin. Hãy xóa bớt pin thừa."
                            >
                                ⚠ Chỉ nên dùng 1 pin
                            </span>
                        )}

                        {wireStart && (
                            <span className="text-sm px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 border border-cyan-300 animate-pulse font-medium">
                                Nối dây...
                            </span>
                        )}
                    </div>

                    {!readOnly && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleUndo}
                                disabled={history.length === 0}
                                className="flex items-center gap-1 p-2 rounded-lg bg-white text-gray-600 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 transition-all"
                                title="Hoàn tác"
                            >
                                <Undo2 size={18} />
                            </button>
                            <button
                                onClick={handleClear}
                                className="flex items-center gap-1 p-2 rounded-lg bg-white text-gray-600 hover:bg-red-100 hover:text-red-600 border border-gray-300 hover:border-red-300 transition-all"
                                title="Xóa tất cả"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Canvas area */}
                <div
                    ref={canvasRef}
                    className={`
                        relative flex-1 min-h-[240px] bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-xl border-2
                        ${wireStart ? 'border-cyan-400 shadow-lg shadow-cyan-200/50' : 'border-blue-200'} 
                        overflow-hidden cursor-${draggingId ? 'grabbing' : 'default'}
                    `}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    // Attach global touch handlers to canvas too (for stopping drag)
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseLeave={handleMouseUp}
                    onClick={() => {
                        setSelectedId(null);
                        setWireStart(null);
                        setHoveredWireId(null);
                    }}
                >
                    {/* Grid background */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    />

                    {/* Wires */}
                    <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                        {wires.map(wire => {
                            const from = getPortPosition(wire.fromId, wire.fromPort);
                            const to = getPortPosition(wire.toId, wire.toPort);

                            // Analysis state
                            const wireState = wireStates.get(wire.id);
                            const isWireActive = wireState?.isActive ?? false;
                            const isReverse = wireState?.isReverse ?? false;

                            const { path, reversePath, mid } = buildWire(from, to, wire.fromPort, wire.toPort, hashId(wire.id));
                            const animPath = isReverse ? reversePath : path;
                            const isHovered = hoveredWireId === wire.id;
                            const color = isHovered ? '#ef4444' : (isWireActive ? '#06b6d4' : '#94a3b8');

                            return (
                                <g
                                    key={wire.id}
                                    onMouseEnter={() => setHoveredWireId(wire.id)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setHoveredWireId(hoveredWireId === wire.id ? null : wire.id);
                                    }}
                                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                >
                                    {/* Invisible wider stroke for easier hovering/tapping */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke="transparent"
                                        strokeWidth={16}
                                        style={{ pointerEvents: 'stroke' }}
                                    />
                                    {/* Soft casing so crossings read clearly */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke="white"
                                        strokeOpacity={0.9}
                                        strokeWidth={isHovered ? 7 : 6}
                                        strokeLinecap="round"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                    {/* Visible wire */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={isHovered ? 4 : (isWireActive ? 3.5 : 2.5)}
                                        strokeLinecap="round"
                                        style={{ pointerEvents: 'none', transition: 'stroke 0.2s' }}
                                    />
                                    {/* Electron animation */}
                                    {isWireActive && !isHovered && (
                                        <circle r="4.5" fill="#0891b2">
                                            <animateMotion
                                                dur="1.5s"
                                                repeatCount="indefinite"
                                                path={animPath}
                                            />
                                        </circle>
                                    )}
                                    {/* Delete button on hover/tap */}
                                    {isHovered && !readOnly && (
                                        <g
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteWire(wire.id);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <circle cx={mid.x} cy={mid.y} r={12} fill="#ef4444" stroke="white" strokeWidth={2} />
                                            <text
                                                x={mid.x}
                                                y={mid.y + 1}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fill="white"
                                                fontSize="14"
                                                fontWeight="bold"
                                            >
                                                ×
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Components */}
                    {components.map(component => (
                        <CircuitComponent
                            key={component.id}
                            component={component}
                            isSelected={selectedId === component.id}
                            isConnecting={wireStart?.id === component.id}
                            onClick={() => setSelectedId(component.id)}
                            onToggle={() => handleToggleSwitch(component.id)}
                            onPortClick={(port) => handlePortClick(component.id, port)}
                            onDragStart={(e) => handleComponentDragStart(component.id, e)}
                            onDelete={readOnly ? undefined : () => deleteComponent(component.id)}
                            onTouchStart={(e) => handleTouchStart(component.id, e)}
                            isDragging={draggingId === component.id}
                        />
                    ))}

                    {/* Empty state */}
                    {components.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center text-sky-400">
                                <p className="text-lg mb-2 font-medium">⚡ Kéo thả linh kiện vào đây</p>
                                <p className="text-sm text-sky-500/70">Nhấn vào đầu xanh (−) rồi đầu đỏ (+) để nối dây</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
