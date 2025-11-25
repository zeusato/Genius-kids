import React, { useState, useEffect } from 'react';
import { AlbumImage, Rarity } from '../../types';
import { Gift, Star, X, Sparkles } from 'lucide-react';

interface GachaModalProps {
    image: AlbumImage;
    isNew: boolean;
    onClose: () => void;
}

export const GachaModal: React.FC<GachaModalProps> = ({ image, isNew, onClose }) => {
    const [stage, setStage] = useState<'box' | 'spinning' | 'reveal'>('box');

    useEffect(() => {
        // Auto transition from box to spinning if needed
    }, [stage]);

    const handleOpen = () => {
        if (stage === 'box') {
            setStage('spinning');
            setTimeout(() => {
                setStage('reveal');
            }, 1500);
        }
    };

    const getRarityColor = (rarity: Rarity) => {
        switch (rarity) {
            case Rarity.Legendary: return '#FFD700';
            case Rarity.Epic: return '#A855F7';
            case Rarity.Rare: return '#3B82F6';
            case Rarity.Uncommon: return '#10B981';
            default: return '#64748B';
        }
    };

    const getRarityName = (rarity: Rarity) => {
        switch (rarity) {
            case Rarity.Legendary: return 'Huyền Thoại';
            case Rarity.Epic: return 'Sử Thi';
            case Rarity.Rare: return 'Hiếm';
            case Rarity.Uncommon: return 'Không Phổ Biến';
            default: return 'Phổ Biến';
        }
    };

    const rarityColor = getRarityColor(image.rarity);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md">
                {/* Close button */}
                {stage === 'reveal' && (
                    <button
                        onClick={onClose}
                        className="absolute -top-12 right-0 p-2 bg-white/20 hover:bg-white/30 rounded-full shadow-lg transition-all hover:scale-110 z-20"
                    >
                        <X size={28} className="text-white" />
                    </button>
                )}

                <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-8">
                        {/* Box Stage - Click to open */}
                        {stage === 'box' && (
                            <div className="flex flex-col items-center justify-center min-h-[400px] relative">
                                <div
                                    className="cursor-pointer transform hover:scale-110 transition-all duration-300"
                                    onClick={handleOpen}
                                >
                                    <div className="relative flex justify-center">
                                        {/* Pulsing glow */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl opacity-50 animate-pulse"></div>

                                        {/* Gift box with bounce */}
                                        <div className="relative animate-bounce">
                                            <Gift size={140} className="text-gradient-to-r from-purple-500 to-pink-500 drop-shadow-2xl" style={{ filter: 'drop-shadow(0 10px 30px rgba(168, 85, 247, 0.4))' }} />
                                        </div>
                                    </div>

                                    <p className="mt-8 text-2xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                                        🎁 Chạm để mở quà! 🎁
                                    </p>
                                </div>

                                {/* Floating particles */}
                                <div className="absolute top-10 left-10 text-3xl animate-float-slow">✨</div>
                                <div className="absolute top-20 right-10 text-2xl animate-float-slower delay-100">⭐</div>
                                <div className="absolute bottom-20 left-20 text-2xl animate-float-slow delay-200">💫</div>
                            </div>
                        )}

                        {/* Spinning Stage */}
                        {stage === 'spinning' && (
                            <div className="flex flex-col items-center justify-center min-h-[400px]">
                                <div className="relative">
                                    {/* Spinning card with 3D effect */}
                                    <div className="w-48 h-64 bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 rounded-2xl shadow-2xl animate-spin-3d flex items-center justify-center">
                                        <div className="text-white text-7xl drop-shadow-lg">🎴</div>
                                    </div>

                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer rounded-2xl"></div>

                                    {/* Glow ring */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-2xl opacity-60 animate-pulse"></div>
                                </div>

                                <p className="mt-8 text-xl font-bold text-purple-600 animate-pulse">
                                    Đang mở...
                                </p>
                            </div>
                        )}

                        {/* Reveal Stage */}
                        {stage === 'reveal' && (
                            <div className="animate-in zoom-in duration-500 flex flex-col items-center min-h-[400px] justify-center">
                                {/* Header with sparkles */}
                                <div className="mb-6 flex items-center gap-2">
                                    <Sparkles size={24} className="text-yellow-500 animate-pulse" />
                                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        {isNew ? '🎉 Ảnh Mới! 🎉' : 'Ảnh Đã Có'}
                                    </h2>
                                    <Sparkles size={24} className="text-yellow-500 animate-pulse" />
                                </div>

                                {/* Card Display with 3D flip effect */}
                                <div
                                    className="relative w-56 h-72 mb-6 perspective-1000 animate-in flip-x duration-500"
                                    style={{
                                        borderColor: rarityColor,
                                        boxShadow: `0 0 40px ${rarityColor}40`
                                    }}
                                >
                                    <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 shadow-2xl">
                                        {/* Glow effect */}
                                        <div
                                            className="absolute inset-0 opacity-40 blur-xl -z-10"
                                            style={{ backgroundColor: rarityColor }}
                                        ></div>

                                        {/* Image */}
                                        <img
                                            src={image.imagePath}
                                            alt={image.name}
                                            className="relative w-full h-full object-cover"
                                        />

                                        {/* Rarity badge */}
                                        <div
                                            className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm"
                                            style={{ backgroundColor: rarityColor }}
                                        >
                                            ✨ {getRarityName(image.rarity)}
                                        </div>

                                        {/* Shine overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>

                                    {/* Floating particles around card */}
                                    <div className="absolute -top-4 -left-4 text-2xl animate-float-slow">✨</div>
                                    <div className="absolute -top-2 -right-6 text-3xl animate-float-slower delay-100">⭐</div>
                                    <div className="absolute -bottom-4 left-1/2 text-2xl animate-float-slow delay-200">💫</div>
                                </div>

                                {/* Card name */}
                                <h3 className="text-2xl font-extrabold text-gray-800 mb-4">{image.name}</h3>

                                {/* Duplicate compensation */}
                                {!isNew && (
                                    <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-full font-bold shadow-lg mb-4 animate-in zoom-in duration-300 delay-200">
                                        <span>Đổi thành</span>
                                        <Star size={20} fill="currentColor" className="animate-pulse" />
                                        <span className="text-lg">+10 sao</span>
                                    </div>
                                )}

                                {/* Close button */}
                                <button
                                    onClick={onClose}
                                    className="mt-4 px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 hover:-translate-y-1"
                                >
                                    {isNew ? 'Tuyệt vời!' : 'Đóng'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin-3d {
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
                .animate-spin-3d {
                    animation: spin-3d 1.5s ease-in-out;
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
