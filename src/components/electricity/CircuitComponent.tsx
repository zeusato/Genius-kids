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
    isDragging?: boolean;
}

export const CircuitComponent: React.FC<CircuitComponentProps> = ({
    component,
    isSelected,
    isConnecting,
    onClick,
    onToggle,
    onPortClick,
    onDragStart,
    isDragging
}) => {
    const definition = COMPONENTS[component.type];

    const isOn = component.isActive;
    const switchState = component.type === 'switch' ? component.state : null;

    const getComponentStyles = () => {
        switch (component.type) {
            case 'battery':
                return {
                    bg: 'bg-gradient-to-r from-red-500 to-slate-600',
                    glow: isOn ? 'shadow-red-500/50' : ''
                };
            case 'bulb':
                return {
                    bg: isOn ? 'bg-yellow-400' : 'bg-slate-600',
                    glow: isOn ? 'shadow-yellow-400/80 shadow-lg' : ''
                };
            case 'switch':
                return {
                    bg: switchState === 'on' ? 'bg-green-500' : 'bg-slate-600',
                    glow: switchState === 'on' ? 'shadow-green-500/50' : ''
                };
            case 'bell':
                return {
                    bg: isOn ? 'bg-yellow-500' : 'bg-slate-600',
                    glow: isOn ? 'shadow-yellow-500/50' : ''
                };
            case 'fan':
                return {
                    bg: isOn ? 'bg-cyan-500' : 'bg-slate-600',
                    glow: isOn ? 'shadow-cyan-500/50' : ''
                };
            case 'candle':
                // isActive = true means blown out (no flame)
                return {
                    bg: component.isActive ? 'bg-slate-500' : 'bg-orange-400',
                    glow: component.isActive ? '' : 'shadow-orange-400/50'
                };
            case 'buzzer':
                return {
                    bg: isOn ? 'bg-purple-500' : 'bg-slate-600',
                    glow: isOn ? 'shadow-purple-500/50' : ''
                };
            default:
                return { bg: 'bg-slate-600', glow: '' };
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
        // Only start drag if not clicking on ports
        const target = e.target as HTMLElement;
        if (!target.closest('.port-button')) {
            onDragStart?.(e);
        }
    };

    return (
        <div
            className={`
                absolute w-16 h-16 rounded-xl
                flex flex-col items-center justify-center
                transition-all duration-200
                ${styles.bg} ${styles.glow}
                ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''}
                ${isConnecting ? 'ring-2 ring-cyan-400 animate-pulse' : ''}
                ${isDragging ? 'cursor-grabbing scale-105 opacity-80' : 'cursor-grab'}
                hover:scale-105
            `}
            style={{
                left: component.x,
                top: component.y,
                transform: `rotate(${component.rotation}deg)`,
                zIndex: isDragging ? 100 : 1,
            }}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
        >
            {/* Icon */}
            <span className={`text-2xl select-none ${component.type === 'fan' && isOn ? 'animate-spin' : ''}`}>
                {definition.icon}
            </span>

            {/* State indicator for switch */}
            {component.type === 'switch' && (
                <span className="text-[10px] text-white font-semibold mt-0.5 select-none">
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
                    <button
                        className="port-button absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-500 border-2 border-white hover:scale-125 hover:bg-blue-400 transition-all z-10"
                        onClick={(e) => handlePortClick(e, 'input')}
                        title="Đầu vào (−)"
                    />
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
                    <button
                        className="port-button absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-500 border-2 border-white hover:scale-125 hover:bg-red-400 transition-all z-10"
                        onClick={(e) => handlePortClick(e, 'output')}
                        title="Đầu ra (+)"
                    />
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
