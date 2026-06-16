// ============================================================================
//  GameBoard — bàn cờ rắn + CAMERA BÁM NHÂN VẬT. Bọc trong scroll container;
//  mỗi khi nhân vật đổi ô, tự cuộn để giữ nhân vật ở giữa khung nhìn. Ô lớn hơn
//  trên mobile (kích thước lấy từ engine/constants). Tôn trọng reduced-motion.
// ============================================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair } from 'lucide-react';
import { MapTile, TileType } from '../engine/types';
import { BOARD, MOBILE_BREAKPOINT } from '../engine/constants';
import dragonImg from '../assets/dragon.png';

interface GameBoardProps {
    tiles: MapTile[];
    playerPosition: number;
    isMoving: boolean;
}

interface TilePos { x: number; y: number; }

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const TILE_ICON: Partial<Record<TileType, string>> = {
    [TileType.Combat]: '⚔️',
    [TileType.Buff]: '🍀',
    [TileType.Teleport]: '🌀',
};

const TILE_COLOR: Record<TileType, string> = {
    [TileType.Combat]: 'from-red-400 to-red-600',
    [TileType.Buff]: 'from-green-400 to-emerald-600',
    [TileType.Teleport]: 'from-blue-400 to-cyan-500',
    [TileType.Boss]: 'from-orange-500 to-red-700',
    [TileType.Normal]: 'from-slate-200 to-slate-400',
};

export const GameBoard: React.FC<GameBoardProps> = ({ tiles, playerPosition, isMoving }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeTileRef = useRef<HTMLDivElement>(null);
    const [viewWidth, setViewWidth] = useState(360);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            for (const e of entries) setViewWidth(e.contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const isMobile = viewWidth < MOBILE_BREAKPOINT;
    const geom = isMobile ? BOARD.mobile : BOARD.desktop;
    const stepX = geom.tile + geom.gapX;
    const stepY = geom.tile + geom.gapY;

    // Số cột vừa bề rộng khung (tối thiểu 4, tối đa 10).
    const cols = useMemo(
        () => clamp(4, 10, Math.floor((viewWidth - geom.padding * 2 + geom.gapX) / stepX) || 4),
        [viewWidth, geom.padding, geom.gapX, stepX],
    );

    const positions = useMemo<TilePos[]>(() => {
        return tiles.map((_, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const actualCol = row % 2 === 0 ? col : cols - 1 - col; // rắn: hàng lẻ đảo chiều
            return { x: geom.padding + actualCol * stepX, y: geom.padding + row * stepY };
        });
    }, [tiles, cols, geom.padding, stepX, stepY]);

    const rows = Math.ceil(tiles.length / cols);
    const boardW = geom.padding * 2 + (cols - 1) * stepX + geom.tile;
    // chừa khoảng phía trên cho nhân vật đứng (vẽ phía trên ô) + phía dưới
    const topPad = geom.tile;
    const boardH = topPad + geom.padding * 2 + (rows - 1) * stepY + geom.tile;

    // Camera: căn nhân vật vào giữa khung mỗi khi đổi ô.
    const recenter = (smooth = true) => {
        const c = scrollRef.current, t = activeTileRef.current;
        if (!c || !t) return;
        c.scrollTo({
            top: t.offsetTop - c.clientHeight / 2 + t.offsetHeight / 2,
            left: t.offsetLeft - c.clientWidth / 2 + t.offsetWidth / 2,
            behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
        });
    };

    useEffect(() => {
        recenter(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerPosition, cols]);

    const iconScale = geom.tile * 0.5;

    return (
        <div className="relative w-full h-full">
            <div
                ref={scrollRef}
                className="w-full h-full overflow-auto rounded-3xl bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 shadow-inner border-4 border-amber-200/50"
            >
                <div className="relative mx-auto" style={{ width: boardW, height: boardH, paddingTop: topPad }}>
                    {/* Đường nối các ô */}
                    <svg className="absolute inset-0 pointer-events-none" width={boardW} height={boardH} style={{ zIndex: 1 }}>
                        {tiles.map((_, i) => {
                            if (i === tiles.length - 1) return null;
                            const s = positions[i], e = positions[i + 1];
                            const half = geom.tile / 2;
                            return (
                                <line key={i}
                                    x1={s.x + half} y1={s.y + half + topPad}
                                    x2={e.x + half} y2={e.y + half + topPad}
                                    stroke="#d97706" strokeWidth="6" strokeDasharray="8,4" strokeLinecap="round" opacity="0.45" />
                            );
                        })}
                    </svg>

                    {/* Các ô */}
                    {tiles.map((tile, i) => {
                        const pos = positions[i];
                        const isCurrent = i === playerPosition;
                        const icon = TILE_ICON[tile.type];
                        return (
                            <div
                                key={tile.id}
                                ref={isCurrent ? activeTileRef : undefined}
                                className="absolute"
                                style={{ left: pos.x, top: pos.y + topPad, width: geom.tile, height: geom.tile, zIndex: isCurrent ? 30 : 10 }}
                            >
                                <div
                                    className={`relative w-full h-full rounded-2xl bg-gradient-to-br ${TILE_COLOR[tile.type]} shadow-lg border-2 md:border-4 border-white flex items-center justify-center transition-all duration-300 ${isCurrent ? 'ring-4 ring-yellow-400 scale-110' : ''}`}
                                >
                                    {/* Số thứ tự ô */}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white px-1.5 rounded-full shadow border border-slate-300">
                                        <span className="text-[10px] md:text-xs font-black text-slate-700">{i + 1}</span>
                                    </div>

                                    {tile.type === TileType.Boss ? (
                                        <img src={dragonImg} alt="Boss" className="object-contain drop-shadow-2xl"
                                            style={{ width: geom.tile * 0.8, height: geom.tile * 0.8 }} />
                                    ) : icon ? (
                                        <span className="filter drop-shadow-lg" style={{ fontSize: iconScale }}>{icon}</span>
                                    ) : null}
                                </div>

                                {/* Nhân vật trên ô hiện tại */}
                                {isCurrent && (
                                    <div className="absolute left-1/2 -translate-x-1/2 z-40" style={{ top: -geom.tile * 0.85 }}>
                                        <div className={isMoving ? 'animate-bounce' : 'animate-pulse'} style={{ fontSize: geom.tile * 0.7 }}>🏇</div>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/25 rounded-full blur-sm" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Nút căn lại camera */}
            <button
                onClick={() => recenter(true)}
                title="Về vị trí nhân vật"
                className="absolute bottom-3 left-3 z-20 bg-white/90 hover:bg-white text-amber-700 rounded-full p-2 shadow-lg border-2 border-amber-300 transition-transform hover:scale-110"
            >
                <Crosshair size={20} />
            </button>

            {/* Chỉ báo tiến độ */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-white/90 px-3 py-1 rounded-full shadow border-2 border-amber-300">
                <span className="text-xs md:text-sm font-black text-amber-700">Ô {playerPosition + 1}/{tiles.length}</span>
            </div>
        </div>
    );
};
