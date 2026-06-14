import React from 'react';
import { CircuitComponentData, COMPONENTS } from '@/src/data/electricityData';

interface CircuitComponentProps {
    component: CircuitComponentData;
    isSelected: boolean;
    isConnecting?: boolean;
    onClick: () => void;
    onToggle?: () => void;
    onPortClick?: (port: 'input' | 'output') => void;
    onDragStart?: (e: React.MouseEvent) => void;
    onDelete?: () => void;
    isDragging?: boolean;
    onTouchStart?: (e: React.TouchEvent) => void;
    onTouchMove?: (e: React.TouchEvent) => void;
    onTouchEnd?: (e: React.TouchEvent) => void;
}

export const CircuitComponent: React.FC<CircuitComponentProps> = ({
    component,
    isSelected,
    isConnecting,
    onClick,
    onToggle,
    onPortClick,
    onDragStart,
    onDelete,
    isDragging,
    onTouchStart,
    onTouchMove,
    onTouchEnd
}) => {
    const definition = COMPONENTS[component.type];
    const [hovered, setHovered] = React.useState(false);
    const showDelete = !!onDelete && !isDragging && (hovered || isSelected);

    const isOn = component.isActive;
    const switchState = component.type === 'switch' ? component.state : null;

    // Light "chip" when idle, bright + glow when active — reads cleanly on the
    // light canvas and makes the on/off state obvious.
    const OFF = 'bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300';
    const getComponentStyles = () => {
        switch (component.type) {
            case 'battery':
                return {
                    bg: 'bg-gradient-to-br from-rose-400 to-red-500 border border-red-500',
                    glow: isOn ? 'shadow-lg shadow-red-500/50' : 'shadow-sm'
                };
            case 'bulb':
                return {
                    bg: isOn ? 'bg-gradient-to-br from-yellow-300 to-amber-400 border border-amber-400' : OFF,
                    glow: isOn ? 'shadow-lg shadow-yellow-400/80' : ''
                };
            case 'switch':
                return {
                    bg: switchState === 'on' ? 'bg-gradient-to-br from-green-400 to-emerald-500 border border-emerald-500' : OFF,
                    glow: switchState === 'on' ? 'shadow-md shadow-green-500/50' : ''
                };
            case 'bell':
                return {
                    bg: isOn ? 'bg-gradient-to-br from-yellow-400 to-amber-500 border border-amber-500' : OFF,
                    glow: isOn ? 'shadow-md shadow-yellow-500/50' : ''
                };
            case 'fan':
                return {
                    bg: isOn ? 'bg-gradient-to-br from-cyan-400 to-sky-500 border border-cyan-500' : OFF,
                    glow: isOn ? 'shadow-md shadow-cyan-500/50' : ''
                };
            case 'candle':
                // isActive = true means blown out (no flame)
                return {
                    bg: component.isActive ? OFF : 'bg-gradient-to-br from-orange-300 to-orange-400 border border-orange-400',
                    glow: component.isActive ? '' : 'shadow-md shadow-orange-400/50'
                };
            case 'buzzer':
                return {
                    bg: isOn ? 'bg-gradient-to-br from-purple-400 to-fuchsia-500 border border-purple-500' : OFF,
                    glow: isOn ? 'shadow-md shadow-purple-500/50' : ''
                };
            default:
                return { bg: OFF, glow: '' };
        }
    };

    const styles = getComponentStyles();

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (component.type === 'switch' && onToggle) {
            onToggle();
        } else {
            onClick();
        }
    };

    const handlePortClick = (e: React.MouseEvent, port: 'input' | 'output') => {
        e.stopPropagation();
        onPortClick?.(port);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Only start drag if not clicking on ports or the delete button
        const target = e.target as HTMLElement;
        if (!target.closest('.port-button') && !target.closest('.delete-button')) {
            onDragStart?.(e);
        }
    };

    return (
        <div
            className={`
                absolute w-16 h-16 rounded-xl
                flex flex-col items-center justify-center
                ${isDragging ? '' : 'transition-all duration-200'}
                ${styles.bg} ${styles.glow}
                ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}
                ${isConnecting ? 'ring-2 ring-cyan-400 animate-pulse' : ''}
                ${isDragging ? 'cursor-grabbing scale-105 opacity-80' : 'cursor-grab'}
                hover:scale-105
            `}
            style={{
                left: component.x,
                top: component.y,
                zIndex: isDragging || showDelete ? 100 : 1,
            }}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Delete button */}
            {showDelete && (
                <button
                    className="delete-button absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 border-2 border-white text-white flex items-center justify-center shadow-md z-30 leading-none"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                    title="Xóa linh kiện"
                >
                    <span className="text-sm font-bold -mt-px">×</span>
                </button>
            )}

            {/* Name label */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500 whitespace-nowrap pointer-events-none select-none">
                {definition.name}
            </div>

            {/* Icon */}
            <span className={`text-2xl select-none ${component.type === 'fan' && isOn ? 'animate-spin' : ''}`}>
                {definition.icon}
            </span>

            {/* State indicator for switch */}
            {component.type === 'switch' && (
                <span className={`text-[10px] font-bold mt-0.5 select-none ${switchState === 'on' ? 'text-white' : 'text-slate-500'}`}>
                    {switchState === 'on' ? 'BẬT' : 'TẮT'}
                </span>
            )}

            {/* Candle flame */}
            {component.type === 'candle' && !component.isActive && (
                <div className="absolute -top-2 text-sm animate-pulse select-none">🔥</div>
            )}

            {/* Input port (blue/left) */}
            {definition.hasInput && (
                <>
                    {/* Hit area container (40x40) */}
                    <div
                        className="absolute -left-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center z-20 cursor-pointer"
                        onClick={(e) => handlePortClick(e, 'input')}
                        title="Đầu vào (−)"
                    >
                        {/* Visual Dot */}
                        <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white hover:scale-125 hover:bg-blue-400 transition-all shadow-sm" />
                    </div>
                    {component.type === 'battery' && (
                        <span className="absolute left-1 top-1/2 -translate-y-[55%] text-lg font-bold text-white select-none pointer-events-none drop-shadow-md">
                            −
                        </span>
                    )}
                </>
            )}

            {/* Output port (red/right) */}
            {definition.hasOutput && (
                <>
                    {/* Hit area container (40x40) */}
                    <div
                        className="absolute -right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center z-20 cursor-pointer"
                        onClick={(e) => handlePortClick(e, 'output')}
                        title="Đầu ra (+)"
                    >
                        {/* Visual Dot */}
                        <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white hover:scale-125 hover:bg-red-400 transition-all shadow-sm" />
                    </div>
                    {component.type === 'battery' && (
                        <span className="absolute right-1 top-1/2 -translate-y-[55%] text-lg font-bold text-white select-none pointer-events-none drop-shadow-md">
                            +
                        </span>
                    )}
                </>
            )}
        </div>
    );
};
