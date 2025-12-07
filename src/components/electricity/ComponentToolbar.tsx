import React from 'react';
import { ComponentType, COMPONENTS } from '@/src/data/electricityData';

interface ComponentToolbarProps {
    onDragStart: (type: ComponentType) => void;
    onMobileDrop?: (type: ComponentType, x: number, y: number) => void;
    disabled?: boolean;
}

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
        <div className="flex flex-col gap-2 p-3 bg-slate-800/50 rounded-xl border border-white/10">
            <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                Linh kiện
            </h3>
            <div className="grid grid-cols-2 gap-2">
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
                                flex flex-col items-center justify-center p-2 rounded-lg
                                bg-slate-700/50 border border-white/10
                                hover:bg-slate-600/50 hover:border-cyan-500/50
                                transition-all cursor-grab active:cursor-grabbing
                                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            title={component.description}
                        >
                            <span className="text-2xl mb-1">{component.icon}</span>
                            <span className="text-white/70 text-[10px] text-center leading-tight">
                                {component.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-white/40 text-[10px] text-center">
                    Kéo thả vào canvas
                </p>
                <p className="text-cyan-400/60 text-[10px] text-center mt-1">
                    💡 Nhấn vào đầu nối để tạo dây
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
                    <div className="w-full h-full bg-slate-700/50 border border-cyan-500 rounded-xl flex items-center justify-center text-3xl shadow-xl backdrop-blur-sm">
                        {COMPONENTS[draggingType].icon}
                    </div>
                </div>
            )}
        </div>
    );
};
