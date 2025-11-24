import React, { useState, useEffect } from 'react';
import { AlbumImage } from '../../types';
import { getRarityColor, getRarityName } from '../../services/albumService';
import { X, Sparkles } from 'lucide-react';

interface GachaPreviewModalProps {
    isOpen: boolean;
    result: { image: AlbumImage; isNew: boolean } | null;
    onClose: () => void;
}

export const GachaPreviewModal: React.FC<GachaPreviewModalProps> = ({
    isOpen,
    result,
    onClose,
}) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        if (isOpen && result) {
            // Start spinning animation
            setIsSpinning(true);
            setShowResult(false);

            // Show result after spinning
            setTimeout(() => {
                setIsSpinning(false);
                setShowResult(true);
            }, 1500); // 1.5s spinning
        } else {
            setIsSpinning(false);
            setShowResult(false);
        }
    }, [isOpen, result]);

    if (!isOpen || !result) return null;

    const rarityColor = getRarityColor(result.image.rarity);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110"
                >
                    <X size={20} className="text-gray-600" />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-full shadow-lg">
                            <Sparkles size={20} className="animate-pulse" />
                            <span className="font-bold">QUAY THỬ MIỄN PHÍ</span>
                        </div>
                    </div>

                    {/* Card Animation Area */}
                    <div className="relative h-80 flex items-center justify-center mb-6">
                        {isSpinning ? (
                            /* Spinning Animation */
                            <div className="relative">
                                <div className="w-48 h-64 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl shadow-2xl animate-spin-slow flex items-center justify-center">
                                    <div className="text-white text-6xl">🎴</div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                            </div>
                        ) : showResult ? (
                            /* Result Display - Flip Animation */
                            <div
                                className="w-56 h-72 perspective-1000 animate-in flip-x duration-500"
                                style={{
                                    borderColor: rarityColor,
                                    boxShadow: `0 0 40px ${rarityColor}40`
                                }}
                            >
                                <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 shadow-2xl transform-gpu">
                                    {/* Glow effect */}
                                    <div
                                        className="absolute inset-0 opacity-50 blur-xl"
                                        style={{ backgroundColor: rarityColor }}
                                    ></div>

                                    {/* Card Image */}
                                    <img
                                        src={result.image.imagePath}
                                        alt={result.image.name}
                                        className="relative w-full h-full object-cover"
                                    />

                                    {/* Rarity Badge */}
                                    <div
                                        className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm"
                                        style={{ backgroundColor: rarityColor }}
                                    >
                                        ✨ {getRarityName(result.image.rarity)}
                                    </div>

                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                                </div>

                                {/* Floating particles */}
                                <div className="absolute -top-4 -left-4 text-2xl animate-float-slow">✨</div>
                                <div className="absolute -top-2 -right-6 text-3xl animate-float-slower delay-100">⭐</div>
                                <div className="absolute -bottom-4 left-1/2 text-2xl animate-float-slow delay-200">💫</div>
                            </div>
                        ) : null}
                    </div>

                    {/* Card Info */}
                    {showResult && (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                            <h3 className="text-2xl font-extrabold text-gray-800 mb-2">
                                {result.image.name}
                            </h3>
                            <p
                                className="text-sm font-semibold mb-4"
                                style={{ color: rarityColor }}
                            >
                                {getRarityName(result.image.rarity)}
                            </p>

                            {/* Warning */}
                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-4">
                                <p className="text-xs text-yellow-800 font-medium">
                                    ⚠️ Đây chỉ là xem trước miễn phí!
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                    Nhấn "Quay Gacha" ở bên dưới để nhận thật (50 ⭐)
                                </p>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
                            >
                                Đóng
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotateY(0deg); }
                    to { transform: rotateY(360deg); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes float-slower {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(10deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 1.5s ease-in-out;
                }
                .animate-shimmer {
                    animation: shimmer 1.5s ease-in-out infinite;
                }
                .animate-float-slow {
                    animation: float-slow 3s ease-in-out infinite;
                }
                .animate-float-slower {
                    animation: float-slower 4s ease-in-out infinite;
                }
                .delay-100 {
                    animation-delay: 0.1s;
                }
                .delay-200 {
                    animation-delay: 0.2s;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
};
