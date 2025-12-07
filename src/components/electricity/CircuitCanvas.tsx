import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ComponentType, CircuitComponentData, WireData, CircuitData, COMPONENTS } from '@/src/data/electricityData';
import { CircuitComponent } from './CircuitComponent';
import { ComponentToolbar } from './ComponentToolbar';
import { Trash2, Undo2, Zap, ZapOff } from 'lucide-react';

interface CircuitCanvasProps {
    initialCircuit?: CircuitData;
    onChange?: (circuit: CircuitData) => void;
    onCircuitStatusChange?: (status: { isComplete: boolean; isPowered: boolean }) => void;
    readOnly?: boolean;
    hideToolbar?: boolean;  // Hide component toolbar (for lesson exercises)
}

let componentIdCounter = 0;
let wireIdCounter = 0;

interface HistoryState {
    components: CircuitComponentData[];
    wires: WireData[];
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
    initialCircuit,
    onChange,
    onCircuitStatusChange,
    readOnly = false,
    hideToolbar = false
}) => {
    const [components, setComponents] = useState<CircuitComponentData[]>(
        initialCircuit?.components || []
    );
    const [wires, setWires] = useState<WireData[]>(initialCircuit?.wires || []);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isCircuitComplete, setIsCircuitComplete] = useState(false);
    const [isPowered, setIsPowered] = useState(false);
    const [wireStates, setWireStates] = useState<Map<string, { isActive: boolean, isReverse: boolean }>>(new Map());

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

    // Sync circuit status (isComplete, isPowered) to parent
    useEffect(() => {
        onCircuitStatusChange?.({ isComplete: isCircuitComplete, isPowered });
    }, [isCircuitComplete, isPowered, onCircuitStatusChange]);

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
            id: `comp_${++componentIdCounter}`,
            type,
            x: Math.max(0, Math.min(x, rect.width - 64)),
            y: Math.max(0, Math.min(y, rect.height - 64)),
            rotation: 0,
            state: type === 'switch' ? 'off' : 'on',
            isActive: false,
        };

        const newComponents = [...components, newComponent];
        setComponents(newComponents);
        onChange?.({ components: newComponents, wires });
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
            onChange?.({ components, wires });
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
            onChange?.({ components, wires });
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
                    id: `wire_${++wireIdCounter}`,
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
        setIsCircuitComplete(false);
        setIsPowered(false);
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
    // ========== ROBUST CIRCUIT ANALYSIS ==========

    // Analyze circuit to determine active components and electron flow direction
    const analyzeCircuit = (comps: CircuitComponentData[], wiresData: WireData[]) => {
        const battery = comps.find(c => c.type === 'battery');
        if (!battery) return { activeIds: new Set<string>(), wireAnalysis: new Map() };

        // Adjacency list with port info
        const adj = new Map<string, Array<{ id: string, wireId: string, myPort: string, otherPort: string }>>();
        comps.forEach(c => adj.set(c.id, []));

        wiresData.forEach(w => {
            adj.get(w.fromId)?.push({ id: w.toId, wireId: w.id, myPort: w.fromPort, otherPort: w.toPort });
            adj.get(w.toId)?.push({ id: w.fromId, wireId: w.id, myPort: w.toPort, otherPort: w.fromPort });
        });

        // BFS from Battery Input (Source of electrons / Negative terminal)
        const distNeg = new Map<string, number>();
        const qNeg: string[] = [battery.id];
        distNeg.set(battery.id, 0);

        let head = 0;
        while (head < qNeg.length) {
            const u = qNeg[head++];
            const neighbors = adj.get(u) || [];

            for (const edge of neighbors) {
                // If starting from battery, MUST go through Input port (Negative)
                if (u === battery.id && edge.myPort !== 'input') continue;

                const v = edge.id;
                const compV = comps.find(c => c.id === v);
                if (compV?.type === 'switch' && compV.state === 'off') continue;

                if (!distNeg.has(v)) {
                    distNeg.set(v, distNeg.get(u)! + 1);
                    qNeg.push(v);
                }
            }
        }

        // BFS from Battery Output (Sink of electrons / Positive terminal)
        const distPos = new Map<string, number>();
        const qPos: string[] = [battery.id];
        distPos.set(battery.id, 0);

        head = 0;
        while (head < qPos.length) {
            const u = qPos[head++];
            const neighbors = adj.get(u) || [];

            for (const edge of neighbors) {
                // If starting from battery, MUST go through Output port (Positive)
                if (u === battery.id && edge.myPort !== 'output') continue;

                const v = edge.id;
                const compV = comps.find(c => c.id === v);
                if (compV?.type === 'switch' && compV.state === 'off') continue;

                if (!distPos.has(v)) {
                    distPos.set(v, distPos.get(u)! + 1);
                    qPos.push(v);
                }
            }
        }

        // Active Components: Reachable from BOTH Input and Output (Closed Loop)
        const activeIds = new Set<string>();
        comps.forEach(c => {
            if (c.type === 'battery') return; // Handled later
            // Load is active if it has path to Negative AND Positive terminals
            if (distNeg.has(c.id) && distPos.has(c.id)) {
                activeIds.add(c.id);
            }
        });

        // Battery is active if any load is active (i.e., circuit is doing work)
        const anyLoadActive = Array.from(activeIds).some(id => {
            const c = comps.find(comp => comp.id === id);
            return c && ['bulb', 'bell', 'fan', 'buzzer'].includes(c.type);
        });
        if (anyLoadActive) activeIds.add(battery.id);


        // Wire Analysis
        const wireAnalysis = new Map<string, { isActive: boolean, isReverse: boolean }>();
        wiresData.forEach(w => {
            const u = w.fromId;
            const v = w.toId;

            const isUActive = activeIds.has(u);
            const isVActive = activeIds.has(v);

            // Wire is active if connects two active components
            if (isUActive && isVActive) {
                let isReverse = false;

                // Special handling for wires connected explicitly to Battery ports
                const uComp = comps.find(c => c.id === u);
                const vComp = comps.find(c => c.id === v);

                const uIsBat = uComp?.type === 'battery';
                const vIsBat = vComp?.type === 'battery';

                if (uIsBat) {
                    // u is Battery. Check port used by wire.
                    if (w.fromPort === 'input') isReverse = false; // Bat(-) -> Out works normal
                    else if (w.fromPort === 'output') isReverse = true; // Bat(+) -> Out needs reverse to show In
                } else if (vIsBat) {
                    // v is Battery. Wire to v.
                    if (w.toPort === 'input') isReverse = true; // In -> Bat(-) needs reverse to show In? Wait.
                    // Wire A->B. A=Comp, B=Bat(-).
                    // Flow A->B. Electron enters Bat(-)? No. Electron LEAVES Bat(-).
                    // So if connected to Bat(-), flow should be Bat->Comp.
                    // Wire defined A->B. If B is Bat(-), flow is B->A. (Reverse).
                    // Wait. If w.toPort is 'input' (-). Logic: electrons leave (-).
                    // Path A->B. Flow B->A. So Reverse. TRUE.

                    else if (w.toPort === 'output') isReverse = false;
                    // Wire A->B. B=Bat(+).
                    // Flow enters Bat(+). A->B. Normal. TRUE.
                } else {
                    // Standard components: Flow from Low Potential (Neg) to High Potential (Pos)
                    // Score = distNeg - distPos

                    const dNegU = distNeg.get(u) ?? 9999;
                    const dPosU = distPos.get(u) ?? 9999;
                    const scoreU = dNegU - dPosU;

                    const dNegV = distNeg.get(v) ?? 9999;
                    const dPosV = distPos.get(v) ?? 9999;
                    const scoreV = dNegV - dPosV;

                    // If scoreU < scoreV => flow u->v (Normal)
                    // If scoreU > scoreV => flow v->u (Reverse)
                    if (scoreU < scoreV) {
                        isReverse = false;
                    } else if (scoreU > scoreV) {
                        isReverse = true;
                    }
                }

                wireAnalysis.set(w.id, { isActive: true, isReverse });
            } else {
                wireAnalysis.set(w.id, { isActive: false, isReverse: false });
            }
        });

        return { activeIds, wireAnalysis };
    };

    // Update power state of components
    const updateCircuitPower = (
        comps: CircuitComponentData[],
        wiresData: WireData[],
        forcePoweredState?: boolean
    ) => {
        const powerOn = forcePoweredState ?? isPowered;

        // If power is OFF, reset everything
        if (!powerOn) {
            setIsCircuitComplete(false);
            setComponents(comps.map(c => ({ ...c, isActive: false })));
            setWireStates(new Map());
            return;
        }

        const { activeIds, wireAnalysis } = analyzeCircuit(comps, wiresData);

        // Update components
        const updatedComponents = comps.map(c => ({
            ...c,
            isActive: activeIds.has(c.id)
        }));

        const anyLoadActive = updatedComponents.some(
            c => ['bulb', 'bell', 'fan', 'buzzer'].includes(c.type) && c.isActive
        );
        setIsCircuitComplete(anyLoadActive);

        // Fan blows out nearby candles
        const activeFan = updatedComponents.find(c => c.type === 'fan' && c.isActive);
        if (activeFan) {
            updatedComponents.forEach(c => {
                if (c.type === 'candle') {
                    const distance = Math.sqrt(Math.pow(activeFan.x - c.x, 2) + Math.pow(activeFan.y - c.y, 2));
                    if (distance < 150) {
                        c.isActive = true; // blown out
                    }
                }
            });
        }

        setComponents(updatedComponents);
        setWireStates(wireAnalysis);
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

    return (
        <div className="flex gap-4 h-full">
            {/* Toolbar - hidden for lesson exercises */}
            {!readOnly && !hideToolbar && (
                <div className="w-32 flex-shrink-0">
                    <ComponentToolbar
                        onDragStart={() => { }}
                        onMobileDrop={handleMobileDrop}
                        disabled={false}
                    />
                </div>
            )}

            {/* Canvas */}
            <div className="flex-1 flex flex-col gap-3">
                {/* Control bar */}
                <div className="flex items-center justify-between bg-gradient-to-r from-sky-100 to-blue-100 rounded-lg px-4 py-2 border border-sky-200">
                    <div className="flex items-center gap-2">
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

                        <span className={`text-sm px-3 py-1 rounded-full font-medium ${isCircuitComplete
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-red-100 text-red-700 border border-red-300'
                            }`}>
                            {isCircuitComplete ? '✓ Mạch kín' : '✗ Mạch hở'}
                        </span>

                        {wireStart && (
                            <span className="text-sm px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 border border-cyan-300 animate-pulse font-medium">
                                🔗 Đang nối dây...
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
                        relative flex-1 min-h-[400px] bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-xl border-2
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

                            // Get analysis state
                            const wireState = wireStates.get(wire.id);
                            const isWireActive = wireState?.isActive ?? false;
                            const isReverse = wireState?.isReverse ?? false;

                            // Calculate orthogonal wire path to avoid going through components
                            // Wire goes: horizontal from source -> vertical segment -> horizontal to target
                            const deltaX = to.x - from.x;
                            const deltaY = to.y - from.y;

                            // Offset distance to go around components
                            const offset = 25;

                            // Determine path points based on port positions
                            // From port: output (right) or input (left)
                            // To port: output (right) or input (left)
                            let pathPoints: string;

                            if (wire.fromPort === 'output' && wire.toPort === 'input') {
                                // Normal: output -> input (right to left)
                                // Go right from source, then up/down, then left to target
                                const midX = from.x + Math.max(offset, Math.abs(deltaX) / 2);
                                pathPoints = `${from.x},${from.y} ${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`;
                            } else if (wire.fromPort === 'input' && wire.toPort === 'output') {
                                // Reverse: input -> output (left to right)
                                const midX = from.x - Math.max(offset, Math.abs(deltaX) / 2);
                                pathPoints = `${from.x},${from.y} ${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`;
                            } else if (wire.fromPort === 'output' && wire.toPort === 'output') {
                                // Both outputs: go right from both, meet in middle
                                const maxX = Math.max(from.x, to.x) + offset;
                                pathPoints = `${from.x},${from.y} ${maxX},${from.y} ${maxX},${to.y} ${to.x},${to.y}`;
                            } else {
                                // Both inputs: go left from both, meet in middle
                                const minX = Math.min(from.x, to.x) - offset;
                                pathPoints = `${from.x},${from.y} ${minX},${from.y} ${minX},${to.y} ${to.x},${to.y}`;
                            }

                            // Calculate wire midpoint for delete button
                            const points = pathPoints.split(' ').map(p => {
                                const [x, y] = p.split(',').map(Number);
                                return { x, y };
                            });
                            // Midpoint is at the middle of the vertical segment (point 1 to point 2)
                            const midX = (points[1].x + points[2].x) / 2;
                            const midY = (points[1].y + points[2].y) / 2;
                            // Calculate animation path based on analysis direction
                            let animPath: string;
                            if (!isReverse) {
                                // Normal direction: follow pathPoints as-is
                                animPath = `M${pathPoints.split(' ').map(p => p.replace(',', ' ')).join(' L ')}`;
                            } else {
                                // Reverse direction: reverse the points
                                const reversedPoints = pathPoints.split(' ').reverse().join(' ');
                                animPath = `M${reversedPoints.split(' ').map(p => p.replace(',', ' ')).join(' L ')}`;
                            }

                            const isHovered = hoveredWireId === wire.id;

                            return (
                                <g
                                    key={wire.id}
                                    onMouseEnter={() => setHoveredWireId(wire.id)}
                                    // onMouseLeave={() => setHoveredWireId(null)} // Disable leave for easier touch
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setHoveredWireId(hoveredWireId === wire.id ? null : wire.id);
                                    }}
                                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                                >
                                    {/* Invisible wider stroke for easier hovering */}
                                    <polyline
                                        points={pathPoints}
                                        fill="none"
                                        stroke="transparent"
                                        strokeWidth={15}
                                        style={{ pointerEvents: 'stroke' }}
                                    />
                                    {/* Visible wire */}
                                    <polyline
                                        points={pathPoints}
                                        fill="none"
                                        stroke={isHovered ? '#ef4444' : (isWireActive ? '#22d3ee' : '#64748b')}
                                        strokeWidth={isHovered ? 4 : 3}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                    {/* Electron animation */}
                                    {isWireActive && !isHovered && (
                                        <circle r="4" fill="#22d3ee">
                                            <animateMotion
                                                dur="1.5s"
                                                repeatCount="indefinite"
                                                path={animPath}
                                            />
                                        </circle>
                                    )}
                                    {/* Delete button on hover */}
                                    {isHovered && !readOnly && (
                                        <g
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteWire(wire.id);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <circle
                                                cx={midX}
                                                cy={midY}
                                                r={12}
                                                fill="#ef4444"
                                                stroke="white"
                                                strokeWidth={2}
                                            />
                                            <text
                                                x={midX}
                                                y={midY + 1}
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
                            onTouchStart={(e) => handleTouchStart(component.id, e)}
                            isDragging={draggingId === component.id}
                        />
                    ))}

                    {/* Empty state */}
                    {components.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white/30">
                                <p className="text-lg mb-2">Kéo thả linh kiện vào đây</p>
                                <p className="text-sm">Nhấn vào đầu xanh/đỏ để nối dây</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
