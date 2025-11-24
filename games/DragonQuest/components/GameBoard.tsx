import React, { useMemo, useRef, useState, useEffect } from 'react';
import { MapTile, TileType } from '../dragonQuestEngine';
import dragonImg from '../assets/dragon.png';

interface GameBoardProps {
    tiles: MapTile[];
    playerPosition: number;
    isMoving: boolean;
}

interface TilePosition {
    x: number;
    y: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ tiles, playerPosition, isMoving }) => {
    const boardRef = useRef<HTMLDivElement>(null);
    const [boardWidth, setBoardWidth] = useState(400); // Default to mobile size

    // Observe board width changes
    useEffect(() => {
        if (!boardRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setBoardWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(boardRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Generate snake path layout (classic board game style)
    const tilePositions = useMemo(() => {
        return generateSnakePath(tiles.length, boardWidth);
    }, [tiles.length, boardWidth]);

    const getTileIcon = (type: TileType) => {
        switch (type) {
            case TileType.Combat:
                return '⚔️';
            case TileType.Buff:
                return '🍀';
            case TileType.Teleport:
                return '🌀';
            case TileType.Boss:
                return null; // Will use image
            default:
                return null;
        }
    };

    const getTileColor = (type: TileType) => {
        switch (type) {
            case TileType.Combat:
                return 'from-red-400 to-red-600';
            case TileType.Buff:
                return 'from-green-400 to-emerald-600';
            case TileType.Teleport:
                return 'from-blue-400 to-yellow-300';
            case TileType.Boss:
                return 'from-orange-500 to-red-700';
            default:
                return 'from-slate-200 to-slate-400';
        }
    };

    // Calculate board height dynamically
    const maxY = tilePositions.length > 0
        ? Math.max(...tilePositions.map(p => p.y)) + 150
        : 500;

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div
                ref={boardRef}
                className="relative p-4 md:p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 shadow-2xl w-full max-w-7xl border-4 border-amber-200/50"
                style={{
                    minHeight: `${maxY}px`,
                }}
            >
                {/* Parchment texture overlay */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply rounded-3xl"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        backgroundSize: '200px 200px'
                    }}
                />
                {/* Inner border decoration */}
                <div className="absolute inset-0 pointer-events-none rounded-3xl">
                    <div className="absolute inset-2 border-2 border-yellow-600/20 rounded-2xl" />
                </div>

                {/* Corner decorations */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                    {/* Top left corner */}
                    <div className="absolute top-4 left-4 text-5xl md:text-6xl">🏰</div>
                    <div className="absolute top-16 left-2 text-2xl md:text-3xl rotate-12">⚔️</div>

                    {/* Top right corner */}
                    <div className="absolute top-4 right-4 text-5xl md:text-6xl">🐉</div>
                    <div className="absolute top-16 right-2 text-2xl md:text-3xl -rotate-12">🔥</div>

                    {/* Bottom left corner */}
                    <div className="absolute bottom-4 left-4 text-4xl md:text-5xl">🗡️</div>
                    <div className="absolute bottom-16 left-6 text-2xl md:text-3xl">💎</div>

                    {/* Bottom right corner */}
                    <div className="absolute bottom-4 right-4 text-4xl md:text-5xl">👑</div>
                    <div className="absolute bottom-16 right-6 text-2xl md:text-3xl">🏆</div>
                </div>

                {/* Path connectors */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                    {tiles.map((_, index) => {
                        if (index === tiles.length - 1) return null;
                        const start = tilePositions[index];
                        const end = tilePositions[index + 1];

                        return (
                            <line
                                key={`connector-${index}`}
                                x1={start.x + 40}
                                y1={start.y + 40}
                                x2={end.x + 40}
                                y2={end.y + 40}
                                stroke="#d97706"
                                strokeWidth="6"
                                strokeDasharray="8,4"
                                strokeLinecap="round"
                                opacity="0.5"
                            />
                        );
                    })}
                </svg>

                {/* Tiles */}
                <div className="relative" style={{ zIndex: 2 }}>
                    {tiles.map((tile, index) => {
                        const isCurrentTile = index === playerPosition;
                        const icon = getTileIcon(tile.type);
                        const colorClass = getTileColor(tile.type);
                        const position = tilePositions[index];

                        return (
                            <div
                                key={tile.id}
                                className={`
                                    absolute transition-all duration-500
                                    ${isCurrentTile ? 'z-30' : 'z-10'}
                                `}
                                style={{
                                    left: `${position.x}px`,
                                    top: `${position.y}px`,
                                }}
                            >
                                {/* Tile */}
                                <div
                                    className={`
                                        relative w-10 h-10 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br ${colorClass}
                                        shadow-lg border-2 md:border-4 border-white
                                        flex items-center justify-center
                                        transition-all duration-300
                                        ${isCurrentTile ? 'scale-125 shadow-2xl ring-2 md:ring-4 ring-yellow-400' : ''}
                                    `}
                                    style={{
                                        transform: isCurrentTile ? 'translateY(-8px)' : 'translateY(0)',
                                    }}
                                >
                                    {/* Tile number */}
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-full shadow-md border-2 border-slate-300">
                                        <span className="text-xs font-black text-slate-700">{index + 1}</span>
                                    </div>

                                    {/* Tile icon or image */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {tile.type === TileType.Boss ? (
                                            <img
                                                src={dragonImg}
                                                alt="Dragon Boss"
                                                className="w-8 h-8 md:w-16 md:h-16 object-contain drop-shadow-2xl"
                                            />
                                        ) : icon ? (
                                            <span className="text-2xl md:text-4xl filter drop-shadow-lg">{icon}</span>
                                        ) : null}
                                    </div>

                                    {/* Shadow effect */}
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/20 rounded-full blur-md" />
                                </div>

                                {/* Player character on current tile */}
                                {isCurrentTile && (
                                    <div className="absolute -top-8 md:-top-16 left-1/2 -translate-x-1/2 z-40">
                                        <div className={`text-3xl md:text-5xl ${isMoving ? 'animate-bounce' : ''}`}>
                                            🏇
                                        </div>
                                        {/* Shadow */}
                                        <div className="absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 w-6 h-2 md:w-10 md:h-3 bg-black/30 rounded-full blur-sm" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Generate classic snake path (like Candy Crush or Snakes & Ladders)
function generateSnakePath(tileCount: number, boardWidth: number): TilePosition[] {
    const positions: TilePosition[] = [];

    // Dynamic calculation based on board width
    // Detect mobile screens and adjust spacing accordingly
    const isMobile = boardWidth < 768;
    const paddingX = isMobile ? 20 : 50;
    const paddingY = isMobile ? 25 : 50;
    const spacingX = isMobile ? 75 : 90;
    const spacingY = isMobile ? 55 : 100;

    // Calculate optimal number of columns based on available width
    const availableWidth = boardWidth - (paddingX * 2);
    const cols = Math.max(4, Math.min(10, Math.floor(availableWidth / spacingX)));

    for (let i = 0; i < tileCount; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;

        // Snake pattern: reverse direction on odd rows
        const actualCol = row % 2 === 0 ? col : cols - 1 - col;

        const x = paddingX + actualCol * spacingX;
        const y = paddingY + row * spacingY;

        positions.push({ x, y });
    }

    return positions;
}
