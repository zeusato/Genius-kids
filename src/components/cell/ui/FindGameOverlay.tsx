import React from 'react';
import { X, Volume2, RotateCcw } from 'lucide-react';
import { FindGame } from './useFindGame';
import { CELL_BADGE_STARS } from '../../../data/cellQuizData';

interface FindGameOverlayProps {
    game: FindGame;
    cellName: string;
    accent: string;
    onClose: () => void;
}

// Pháo giấy CSS (không canvas) cho màn thắng
function Confetti() {
    const colors = ['#f472b6', '#38bdf8', '#facc15', '#4ade80', '#a78bfa', '#fb923c'];
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {Array.from({ length: 36 }, (_, i) => (
                <span
                    key={i}
                    className="absolute top-0 w-2 h-3 rounded-sm animate-[cellConfetti_2.4s_ease-in_forwards]"
                    style={{
                        left: `${(i * 37) % 100}%`,
                        background: colors[i % colors.length],
                        animationDelay: `${(i % 12) * 0.08}s`,
                        transform: `rotate(${i * 29}deg)`
                    }}
                />
            ))}
        </div>
    );
}

export const FindGameOverlay: React.FC<FindGameOverlayProps> = ({ game, cellName, accent, onClose }) => {
    if (!game.active) return null;
    const fb = game.feedback;

    if (game.finished) {
        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center text-white shadow-2xl">
                    <Confetti />
                    <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(250,204,21,0.45)] ring-4 ring-amber-300/60"
                        style={{ background: `radial-gradient(circle at 30% 30%, #fff7cc, ${accent})` }}>
                        🔬
                    </div>
                    <h3 className="mt-4 text-2xl font-black">{game.awarded ? 'Huy hiệu mới! 🎉' : 'Giỏi quá! 🎉'}</h3>
                    <p className="mt-2 text-sm text-white/75 leading-relaxed">
                        {game.awarded
                            ? <>Em nhận huy hiệu <b className="text-white">Nhà Sinh Học — {cellName}</b> và <b className="text-amber-300">+{CELL_BADGE_STARS} ⭐</b>!</>
                            : <>Em đã tìm đúng hết {game.total} bộ phận của {cellName.toLowerCase()}.</>}
                    </p>
                    {game.mistakes === 0 && <p className="mt-1 text-xs font-bold text-emerald-300">Không nhầm lần nào — mắt thần luôn! 👀</p>}
                    <div className="mt-5 flex gap-2">
                        <button onClick={game.start} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/10 border border-white/15 font-bold hover:bg-white/20">
                            <RotateCcw size={16} /> Chơi lại
                        </button>
                        <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-black bg-gradient-to-r from-sky-500 to-violet-600 hover:from-sky-400 hover:to-violet-500">
                            Khám phá tiếp
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed left-1/2 -translate-x-1/2 top-16 sm:top-20 z-[95] w-[min(560px,94vw)] rounded-3xl border border-white/15 bg-slate-950/80 backdrop-blur-xl shadow-2xl px-4 py-3 text-white animate-[cellCardIn_0.35s_ease-out]">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wider text-amber-300">🎯 TRUY TÌM {game.round + 1}/{game.total}</span>
                    <div className="flex gap-1 ml-1">
                        {Array.from({ length: game.total }, (_, i) => (
                            <span key={i} className={`w-2 h-2 rounded-full ${i < game.round ? 'bg-emerald-400' : i === game.round ? 'bg-amber-300' : 'bg-white/20'}`} />
                        ))}
                    </div>
                    <div className="ml-auto flex gap-1.5">
                        <button onClick={game.replay} title="Nghe lại" aria-label="Nghe lại gợi ý" className="p-2 rounded-xl bg-white/10 hover:bg-white/20"><Volume2 size={16} /></button>
                        <button onClick={onClose} title="Thoát trò chơi" aria-label="Thoát trò chơi" className="p-2 rounded-xl bg-white/10 hover:bg-white/20"><X size={16} /></button>
                    </div>
                </div>
                <p className="mt-2 text-lg sm:text-xl font-black leading-snug">{game.promptText}</p>
                <p className="mt-1 text-xs text-white/55">Xoay tế bào rồi chạm vào đúng bộ phận nhé — nhãn tên đã được giấu đi!</p>
            </div>
            {fb && (
                <div className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[95] w-[min(520px,92vw)] rounded-2xl border px-4 py-3 text-white shadow-2xl backdrop-blur-xl animate-[cellCardIn_0.3s_ease-out] ${fb.kind === 'correct' ? 'bg-emerald-600/80 border-emerald-300/60' : 'bg-amber-600/80 border-amber-300/60'}`}>
                    <div className="flex items-start gap-3">
                        <span className="text-3xl leading-none">{fb.kind === 'correct' ? '✅' : fb.organelle.emoji}</span>
                        <div>
                            <p className="font-black">{fb.kind === 'correct' ? `Đúng rồi! Đây là ${fb.organelle.name}` : `Đây là ${fb.organelle.name} — ${fb.organelle.short.toLowerCase()}.`}</p>
                            <p className="text-sm text-white/90 mt-0.5">{fb.kind === 'correct' ? fb.organelle.kid : 'Chưa đúng rồi, thử tìm lại nhé! 💪'}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
