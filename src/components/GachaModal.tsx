import React, { useState, useEffect } from 'react';
import { AlbumImage, Rarity } from '../../types';
import { Gift, Star, X } from 'lucide-react';

interface GachaModalProps {
    image: AlbumImage;
    isNew: boolean;
    onClose: () => void;
}

export const GachaModal: React.FC<GachaModalProps> = ({ image, isNew, onClose }) => {
    const [stage, setStage] = useState<'box' | 'opening' | 'reveal'>('box');

    useEffect(() => {
        if (stage === 'box') {
            // Auto open after delay or wait for click
        }
    }, [stage]);

    const handleOpen = () => {
        if (stage === 'box') {
            setStage('opening');
            setTimeout(() => {
                setStage('reveal');
            }, 1000);
        }
    };

    const getRarityColor = (rarity: Rarity) => {
        switch (rarity) {
            case Rarity.Legendary: return 'text-yellow-500 drop-shadow-lg';
            case Rarity.Epic: return 'text-purple-500';
            case Rarity.Rare: return 'text-blue-500';
            case Rarity.Uncommon: return 'text-green-500';
            default: return 'text-slate-500';
        }
    };

    const getRarityBg = (rarity: Rarity) => {
        switch (rarity) {
            case Rarity.Legendary: return 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-300';
            case Rarity.Epic: return 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300';
            case Rarity.Rare: return 'bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300';
            case Rarity.Uncommon: return 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md">
                {/* Close button (only in reveal stage) */}
                {stage === 'reveal' && (
                    <button
                        onClick={onClose}
                        className="absolute -top-12 right-0 text-white hover:text-gray-200 transition-colors z-20"
                    >
                        <X size={32} />
                    </button>
                )}

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8 text-center relative">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none z-0" />

                    {stage === 'box' && (
                        <div
                            className="cursor-pointer transform hover:scale-110 transition-transform duration-300 relative z-10"
                            onClick={handleOpen}
                        >
                            <div className="animate-bounce">
                                <Gift size={120} className="text-brand-500 drop-shadow-xl" />
                            </div>
                            <p className="mt-8 text-2xl font-bold text-brand-600 animate-pulse">
                                Chạm để mở quà!
                            </p>
                        </div>
                    )}

                    {stage === 'opening' && (
                        <div className="animate-spin-slow relative z-10">
                            <Star size={100} className="text-yellow-400" />
                        </div>
                    )}

                    {stage === 'reveal' && (
                        <div className="animate-in zoom-in duration-500 flex flex-col items-center w-full relative z-10">
                            <div className="mb-2">
                                <span className={`text-lg font-bold uppercase tracking-wider ${getRarityColor(image.rarity)}`}>
                                    {image.rarity}
                                </span>
                            </div>

                            <h2 className="text-3xl font-extrabold text-slate-800 mb-6 drop-shadow-sm">
                                {isNew ? '🎉 Ảnh Mới! 🎉' : 'Ảnh đã sở hữu'}
                            </h2>

                            <div className={`p-4 rounded-2xl border-4 shadow-inner mb-6 ${getRarityBg(image.rarity)} transform hover:rotate-2 transition-transform duration-300`}>
                                <img
                                    src={image.imagePath}
                                    alt={image.name}
                                    className="w-48 h-48 object-contain drop-shadow-md"
                                />
                            </div>

                            <h3 className="text-xl font-bold text-slate-700 mb-2">{image.name}</h3>

                            {!isNew && (
                                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-full font-bold">
                                    <span>Đổi thành</span>
                                    <Star size={20} fill="currentColor" />
                                    <span>+10 sao</span>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="mt-8 px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-brand-200 transition-all hover:-translate-y-1 relative z-20 cursor-pointer"
                            >
                                Tuyệt vời!
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
