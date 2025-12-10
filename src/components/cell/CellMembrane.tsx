import React from 'react';

interface CellMembraneProps {
    type: 'animal' | 'plant' | 'bacteria';
    color: string;
    children?: React.ReactNode;
}

export const CellMembrane: React.FC<CellMembraneProps> = ({ type, color, children }) => {
    // Custom styles for dynamic membrane
    const membraneStyle = {
        boxShadow: `
            inset 0 0 60px ${color}40, 
            inset 0 0 20px ${color}80, 
            0 0 20px ${color}40, 
            0 0 60px ${color}20
        `,
        borderColor: `${color}60`
    };

    if (type === 'plant') {
        return (
            <div className="relative w-[70vw] h-[70vw] max-w-[300px] max-h-[300px] sm:max-w-[350px] sm:max-h-[350px] md:max-w-[450px] md:max-h-[450px] transition-all duration-700 group">
                {/* Cell Wall (Outer hard shell) - Subtle glow pulse */}
                <div
                    className="absolute inset-[-12px] border-[10px] border-green-800/70 rounded-[30%] z-0 animate-[pulse_4s_ease-in-out_infinite]"
                    style={{
                        boxShadow: `0 0 0 8px #16653430, inset 0 0 50px #16653450, 0 0 30px #16653420`
                    }}
                />

                {/* Cell Membrane (Inner soft shell) - CLIPPED for breathing effect */}
                <div
                    className="absolute inset-0 border-2 rounded-[35%] bg-black/40 backdrop-blur-sm overflow-hidden animate-morph z-10 transition-all duration-1000 ease-in-out"
                    style={membraneStyle}
                >
                    {/* Cytoplasm Particles Background */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="w-full h-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
                    </div>
                    {/* Glossy reflection */}
                    <div className="absolute top-[8%] left-[12%] w-[25%] h-[15%] bg-gradient-to-br from-white/15 to-transparent rounded-full blur-lg pointer-events-none" />
                </div>

                {/* Content Layer - UNCLIPPED FOREGROUND */}
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-full relative pointer-events-auto">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    if (type === 'bacteria') {
        return (
            <div className="relative w-[45vw] h-[80vw] max-w-[180px] max-h-[320px] sm:max-w-[220px] sm:max-h-[400px] transition-all duration-700 animate-float-slow group">
                {/* 1. Capsule (Mucus layer) */}
                <div className="absolute inset-[-10px] bg-amber-500/10 rounded-full blur-md z-0 animate-pulse" />

                {/* 2. Glassy Skin/Body - BACKGROUND LAYER (z-10) */}
                <div
                    className="absolute inset-0 border-2 rounded-full bg-black/20 overflow-hidden z-10"
                    style={membraneStyle}
                >
                    {/* Internal Fog */}
                    <div className="absolute inset-0 opacity-30 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* 3. Content Layer (Organelles + Flagellum) - FOREGROUND (z-20) */}
                {/* Placing Logic: Above Skin to avoid Blur, Below Gloss for Sheen */}
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                    {children}
                </div>

                {/* 4. Gloss/Reflection - OVERLAY (z-30) */}
                <div className="absolute inset-0 rounded-full z-30 pointer-events-none overflow-hidden">
                    <div className="absolute top-[5%] left-[10%] w-[30%] h-[15%] bg-gradient-to-br from-white/40 to-transparent rounded-full blur-md opacity-80" />
                </div>
            </div>
        );
    }

    // Default: Animal Cell
    return (
        <div className="relative w-[70vw] h-[70vw] max-w-[280px] max-h-[280px] sm:max-w-[320px] sm:max-h-[320px] md:max-w-[400px] md:max-h-[400px] transition-all duration-1000 ease-in-out group">
            {/* 1. Glassy Skin/Membrane - CLIPPED BACKGROUND */}
            <div
                className="absolute inset-0 border-2 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-black/40 backdrop-blur-sm overflow-hidden animate-morph z-10"
                style={membraneStyle}
            >
                <div className="absolute inset-0 opacity-30">
                    <div className="w-full h-full bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
                </div>
                {/* Internal Reflection */}
                <div className="absolute top-[10%] left-[10%] w-[30%] h-[20%] bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl pointer-events-none" />
            </div>

            {/* 2. Content Layer - UNCLIPPED FOREGROUND (Organelles + Labels) */}
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                {/* Enable pointer events for children (organelles) */}
                <div className="w-full h-full relative pointer-events-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};
