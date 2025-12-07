import React from 'react';
import { ComponentType, COMPONENTS } from '@/src/data/electricityData';

interface ComponentToolbarProps {
    onDragStart: (type: ComponentType) => void;
    disabled?: boolean;
}

export const ComponentToolbar: React.FC<ComponentToolbarProps> = ({ onDragStart, disabled }) => {
    // Exclude 'wire' from toolbar - wires are created by connecting ports
    const componentTypes: ComponentType[] = ['battery', 'bulb', 'switch', 'bell', 'fan', 'candle', 'buzzer'];

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
        </div>
    );
};
