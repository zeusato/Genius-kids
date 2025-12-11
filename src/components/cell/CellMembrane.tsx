import React from 'react';

interface CellMembraneProps {
    type: 'animal' | 'plant' | 'bacteria';
    color: string;
    children?: React.ReactNode;
}

export const CellMembrane: React.FC<CellMembraneProps> = ({ type, color, children }) => {
    // Enhanced vibrant styles for kids
    const getMembraneStyle = () => {
        if (type === 'animal') {
            return {
                boxShadow: `
                    inset 0 0 80px #F43F5E60, 
                    inset 0 0 40px #F43F5EA0, 
                    0 0 40px #F43F5E50, 
                    0 0 80px #F43F5E30,
                    0 0 120px #F43F5E20
                `,
                borderColor: '#F43F5E80'
            };
        }
        if (type === 'plant') {
            return {
                boxShadow: `
                    inset 0 0 80px #10B98160, 
                    inset 0 0 40px #10B981A0, 
                    0 0 40px #10B98150, 
                    0 0 80px #10B98130,
                    0 0 120px #10B98120
                `,
                borderColor: '#10B98180'
            };
        }
        return {
            boxShadow: `
                inset 0 0 80px #F59E0B60, 
                inset 0 0 40px #F59E0BA0, 
                0 0 40px #F59E0B50, 
                0 0 80px #F59E0B30,
                0 0 120px #F59E0B20
            `,
            borderColor: '#F59E0B80'
        };
    };

    const membraneStyle = getMembraneStyle();

    if (type === 'plant') {
        return (
            <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] transition-all duration-700 group">
                {/* Cell Wall (Outer hard shell) - More vibrant green */}
                <div
                    className="absolute inset-[-12px] border-[10px] border-emerald-600/80 rounded-[30%] z-0 animate-[pulse_4s_ease-in-out_infinite]"
                    style={{
                        boxShadow: `0 0 0 8px #10B98150, inset 0 0 60px #10B98160, 0 0 40px #10B98140, 0 0 80px #10B98130`
                    }}
                />

                {/* Cell Membrane (Inner soft shell) - Brighter glow */}
                <div
                    className="absolute inset-0 border-3 border-emerald-400/60 rounded-[35%] bg-gradient-to-br from-emerald-950/60 to-green-950/80 backdrop-blur-sm overflow-hidden animate-morph z-10 transition-all duration-1000 ease-in-out"
                    style={membraneStyle}
                >
                    {/* Cytoplasm - more colorful */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/10" />
                    {/* Glossy reflection */}
                    <div className="absolute top-[8%] left-[12%] w-[25%] h-[15%] bg-gradient-to-br from-white/25 to-transparent rounded-full blur-lg pointer-events-none" />
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
            <div className="relative w-[180px] h-[320px] sm:w-[220px] sm:h-[400px] transition-all duration-700 animate-float-slow group">
                {/* Capsule (Mucus layer) - More visible glow */}
                <div
                    className="absolute inset-[-15px] rounded-full z-0 animate-pulse"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.25) 0%, transparent 70%)',
                        boxShadow: '0 0 60px rgba(245,158,11,0.3)'
                    }}
                />

                {/* Glassy Skin/Body - BACKGROUND LAYER */}
                <div
                    className="absolute inset-0 border-3 border-amber-500/60 rounded-full bg-gradient-to-br from-amber-950/60 to-orange-950/80 overflow-hidden z-10"
                    style={membraneStyle}
                >
                    {/* Internal warm glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/15 via-transparent to-amber-500/10" />
                </div>

                {/* Content Layer (Organelles + Flagellum) - FOREGROUND */}
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                    {children}
                </div>

                {/* Gloss/Reflection - OVERLAY */}
                <div className="absolute inset-0 rounded-full z-30 pointer-events-none overflow-hidden">
                    <div className="absolute top-[5%] left-[10%] w-[30%] h-[15%] bg-gradient-to-br from-white/50 to-transparent rounded-full blur-md opacity-90" />
                </div>
            </div>
        );
    }

    // Default: Animal Cell - More vibrant red/pink
    return (
        <div className="relative w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] md:w-[400px] md:h-[400px] transition-all duration-1000 ease-in-out group">
            {/* Glassy Skin/Membrane - CLIPPED BACKGROUND with vibrant glow */}
            <div
                className="absolute inset-0 border-3 border-rose-500/60 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-gradient-to-br from-rose-950/50 to-pink-950/70 backdrop-blur-sm overflow-hidden animate-morph z-10"
                style={membraneStyle}
            >
                {/* Internal warm glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-pink-500/10" />
                {/* Internal Reflection */}
                <div className="absolute top-[10%] left-[10%] w-[30%] h-[20%] bg-gradient-to-br from-white/30 to-transparent rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Content Layer - UNCLIPPED FOREGROUND (Organelles + Labels) */}
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                {/* Enable pointer events for children (organelles) */}
                <div className="w-full h-full relative pointer-events-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};
