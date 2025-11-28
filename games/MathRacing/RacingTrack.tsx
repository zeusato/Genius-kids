import React from 'react';

interface RacingTrackProps {
    children?: React.ReactNode;
}

export const RacingTrack: React.FC<RacingTrackProps> = ({ children }) => {
    return (
        <div className="relative w-full h-full overflow-hidden bg-sky-300">
            {/* Sky / Horizon */}
            <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-sky-400 to-sky-200 z-0">
                {/* Sun */}
                <div className="absolute top-4 right-8 w-16 h-16 bg-yellow-400 rounded-full shadow-[0_0_40px_rgba(250,204,21,0.6)] animate-pulse"></div>

                {/* Clouds */}
                <div className="absolute top-10 left-10 w-24 h-8 bg-white/80 rounded-full blur-sm opacity-80 animate-[float_20s_linear_infinite]"></div>
                <div className="absolute top-20 right-1/3 w-32 h-10 bg-white/60 rounded-full blur-sm opacity-60 animate-[float_25s_linear_infinite_reverse]"></div>
            </div>

            {/* 3D Container */}
            <div
                className="absolute bottom-0 left-0 w-full h-2/3 z-10"
                style={{
                    perspective: '1000px',
                    perspectiveOrigin: '50% 0%'
                }}
            >
                {/* The Road */}
                <div
                    className="relative w-full h-[200%] bg-emerald-600 origin-top"
                    style={{
                        transform: 'rotateX(60deg)',
                        background: 'linear-gradient(to bottom, #10b981, #059669)'
                    }}
                >
                    {/* Road Surface */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-full bg-slate-700 border-l-8 border-r-8 border-white/50">
                        {/* Lane Markers */}
                        <div className="absolute top-0 left-1/3 w-2 h-full bg-dashed-line opacity-50"></div>
                        <div className="absolute top-0 right-1/3 w-2 h-full bg-dashed-line opacity-50"></div>

                        {/* Moving Texture (simulates speed) */}
                        <div className="absolute inset-0 bg-road-texture animate-road-scroll opacity-30"></div>
                    </div>

                    {/* Grass/Decorations on side (optional) */}
                    <div className="absolute top-0 left-[10%] w-4 h-4 bg-red-400 rounded-full"></div>
                </div>

                {/* Game Elements Layer (Car, Obstacles) - Rendered flat on top of the 3D projection or inside? 
                    Actually, for gameplay simplicity, we usually render the track 3D but keep game logic 2D mapped to it.
                    However, to make items look like they are "on" the road, we might need to put them inside the 3D context 
                    OR scale them based on Y position. 
                    
                    Let's try the "Scale based on Y" approach in the parent component for easier collision logic. 
                    So this component just renders the static background track.
                */}
            </div>

            {/* Overlay for Game Elements (passed as children) */}
            <div className="absolute inset-0 z-20 pointer-events-none">
                {children}
            </div>

            <style>{`
                .bg-dashed-line {
                    background-image: linear-gradient(to bottom, white 50%, transparent 50%);
                    background-size: 10px 100px;
                }
                @keyframes road-scroll {
                    from { background-position: 0 0; }
                    to { background-position: 0 100px; }
                }
                .animate-road-scroll {
                    animation: road-scroll 0.5s linear infinite;
                }
                @keyframes float {
                    0% { transform: translateX(0px); }
                    50% { transform: translateX(20px); }
                    100% { transform: translateX(0px); }
                }
            `}</style>
        </div>
    );
};
