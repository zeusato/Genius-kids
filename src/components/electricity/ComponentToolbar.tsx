import React from 'react';
import { ComponentType, COMPONENTS } from '@/src/data/electricityData';

interface ComponentToolbarProps {
    onDragStart: (type: ComponentType) => void;
    onMobileDrop?: (type: ComponentType, x: number, y: number) => void;
    disabled?: boolean;
}

// Soft accent tile behind each icon so the palette reads as a designed icon set.
const ACCENT: Record<string, string> = {
    battery: 'bg-gradient-to-br from-emerald-100 to-emerald-200 ring-emerald-300',
    bulb: 'bg-gradient-to-br from-amber-100 to-yellow-200 ring-amber-300',
    switch: 'bg-gradient-to-br from-slate-100 to-slate-200 ring-slate-300',
    bell: 'bg-gradient-to-br from-yellow-100 to-amber-200 ring-yellow-300',
    fan: 'bg-gradient-to-br from-cyan-100 to-sky-200 ring-cyan-300',
    candle: 'bg-gradient-to-br from-orange-100 to-orange-200 ring-orange-300',
    buzzer: 'bg-gradient-to-br from-purple-100 to-fuchsia-200 ring-purple-300',
};

export const ComponentToolbar: React.FC<ComponentToolbarProps> = ({ onDragStart, onMobileDrop, disabled }) => {
    // Exclude 'wire' from toolbar - wires are created by connecting ports
    const componentTypes: ComponentType[] = ['battery', 'bulb', 'switch', 'bell', 'fan', 'candle', 'buzzer'];

    // Touch handling state
    const [draggingType, setDraggingType] = React.useState<ComponentType | null>(null);
    const [touchPos, setTouchPos] = React.useState<{ x: number; y: number } | null>(null);

    React.useEffect(() => {
        if (!draggingType) return;

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault(); // Prevent scrolling while dragging
            const touch = e.touches[0];
            setTouchPos({ x: touch.clientX, y: touch.clientY });
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touch = e.changedTouches[0];
            if (touch && onMobileDrop) {
                onMobileDrop(draggingType, touch.clientX, touch.clientY);
            }
            setDraggingType(null);
            setTouchPos(null);
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [draggingType, onMobileDrop]);

    const handleTouchStart = (type: ComponentType, e: React.TouchEvent) => {
        // Only prevent default if we want to block scrolling immediately. 
        // For toolbar, we might want to allow scrolling if not holding long enough? 
        // Let's assume direct drag for now as standard mobile drag-drop pattern.
        // e.preventDefault(); // Use passive listener instead or let gesture resolve

        const touch = e.touches[0];
        setDraggingType(type);
        setTouchPos({ x: touch.clientX, y: touch.clientY });

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(50);
    };

    return (
        <div className="flex flex-col gap-2 p-3 bg-white/70 rounded-xl border border-sky-200 shadow-sm">
            <h3 className="text-sky-700/80 text-xs font-semibold uppercase tracking-wider mb-1 hidden md:block">
                Linh kiện
            </h3>
            {/* Mobile: horizontal scroll, Desktop: 2-column grid */}
            <div className="flex md:grid md:grid-cols-2 gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
                {componentTypes.map(type => {
                    const component = COMPONENTS[type];
                    return (
                        <button
                            key={type}
                            draggable={!disabled}
                            onTouchStart={(e) => handleTouchStart(type, e)}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('componentType', type);
                                onDragStart(type);
                            }}
                            disabled={disabled}
                            className={`
                                group flex flex-col items-center justify-center gap-1 p-2 rounded-xl
                                bg-white border border-sky-200
                                hover:bg-sky-50 hover:border-sky-400 hover:shadow-md
                                transition-all cursor-grab active:cursor-grabbing
                                flex-shrink-0 w-16 md:w-auto
                                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            title={component.description}
                        >
                            <span className={`w-10 h-10 flex items-center justify-center rounded-xl text-2xl ring-1 shadow-sm group-hover:scale-110 transition-transform ${ACCENT[type] ?? 'bg-slate-100 ring-slate-200'}`}>
                                {component.icon}
                            </span>
                            <span className="text-slate-600 text-[10px] text-center leading-tight font-semibold">
                                {component.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-1 pt-2 border-t border-sky-200 hidden md:block">
                <p className="text-sky-600/80 text-[10px] text-center leading-snug">
                    💡 Nhấn đầu nối để tạo dây
                </p>
            </div>
            {/* Ghost Element for Touch Dragging */}
            {draggingType && touchPos && (
                <div
                    className="fixed pointer-events-none z-[9999] opacity-80"
                    style={{
                        left: touchPos.x,
                        top: touchPos.y,
                        transform: 'translate(-50%, -50%)',
                        width: '64px', // Approx component size
                        height: '64px'
                    }}
                >
                    <div className="w-full h-full bg-white border-2 border-sky-400 rounded-xl flex items-center justify-center text-3xl shadow-xl">
                        {COMPONENTS[draggingType].icon}
                    </div>
                </div>
            )}
        </div>
    );
};
