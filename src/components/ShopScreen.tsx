import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../../types';
import { getShopAvatars } from '../../services/shopService';
import { getShopThemes } from '../../services/shopService';
import { getDailyPhotos, getPhotoPrice, purchaseAvatar, purchaseTheme, purchasePhoto } from '../../services/shopService';
import { getAvatarById } from '../../services/avatarService';
import { getThemeById } from '../../services/themeService';
import { getImageById } from '../../services/albumService';
import { getRarityColor, getRarityName } from '../../services/albumService';
import { ArrowLeft, ShoppingBag, Star, CheckCircle } from 'lucide-react';

interface ShopScreenProps {
    student: StudentProfile;
    onUpdateProfile: (updated: StudentProfile) => void;
    onBack: () => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
    student,
    onUpdateProfile,
    onBack,
}) => {
    const [activeTab, setActiveTab] = useState<'avatars' | 'themes' | 'photos'>('avatars');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const shopAvatars = getShopAvatars();
    const shopThemes = getShopThemes();
    const [dailyPhotos, setDailyPhotos] = useState(getDailyPhotos(student));

    useEffect(() => {
        // Refresh daily photos if needed
        setDailyPhotos(getDailyPhotos(student));
    }, [student]);

    const handlePurchaseAvatar = (avatarId: string, cost: number) => {
        const result = purchaseAvatar(student, avatarId, cost);
        if (result) {
            onUpdateProfile(result);
            showMessage('Đã mua avatar thành công! ✨', 'success');
        } else {
            if (student.ownedAvatarIds.includes(avatarId)) {
                showMessage('Bạn đã sở hữu avatar này rồi!', 'error');
            } else {
                showMessage('Không đủ sao! Cần thêm ' + (cost - student.stars) + ' ⭐', 'error');
            }
        }
    };

    const handlePurchaseTheme = (themeId: string, cost: number) => {
        const result = purchaseTheme(student, themeId, cost);
        if (result) {
            onUpdateProfile(result);
            showMessage('Đã mua theme thành công! 🎨', 'success');
        } else {
            if (student.ownedThemeIds.includes(themeId)) {
                showMessage('Bạn đã sở hữu theme này rồi!', 'error');
            } else {
                showMessage('Không đủ sao! Cần thêm ' + (cost - student.stars) + ' ⭐', 'error');
            }
        }
    };

    const handlePurchasePhoto = (imageId: string, rarity: any) => {
        const result = purchasePhoto(student, imageId, rarity);
        if (result) {
            onUpdateProfile(result);
            setDailyPhotos(result.shopDailyPhotos);
            showMessage('Đã mua ảnh thành công! 🖼️', 'success');
        } else {
            if (student.ownedImageIds.includes(imageId)) {
                showMessage('Bạn đã sở hữu ảnh này rồi!', 'error');
            } else {
                const cost = getPhotoPrice(rarity);
                showMessage('Không đủ sao! Cần thêm ' + (cost - student.stars) + ' ⭐', 'error');
            }
        }
    };

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="min-h-screen p-4 pb-20 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                >
                    <ArrowLeft size={20} />
                    <span>Quay lại</span>
                </button>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <ShoppingBag size={32} className="text-yellow-600" />
                    Cửa hàng
                </h1>
                <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-lg">
                    <Star size={20} className="text-yellow-600 fill-yellow-600" />
                    <span className="font-bold text-yellow-800">{student.stars}</span>
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-top ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-gray-100 p-2 rounded-xl">
                <button
                    onClick={() => setActiveTab('avatars')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'avatars'
                            ? 'bg-white shadow-md text-brand-600'
                            : 'text-gray-600 hover:text-brand-600'
                        }`}
                >
                    🎭 Avatars
                </button>
                <button
                    onClick={() => setActiveTab('themes')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'themes'
                            ? 'bg-white shadow-md text-brand-600'
                            : 'text-gray-600 hover:text-brand-600'
                        }`}
                >
                    🎨 Themes
                </button>
                <button
                    onClick={() => setActiveTab('photos')}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === 'photos'
                            ? 'bg-white shadow-md text-brand-600'
                            : 'text-gray-600 hover:text-brand-600'
                        }`}
                >
                    🖼️ Ảnh hôm nay
                </button>
            </div>

            {/* Content */}
            <div className="animate-in fade-in duration-300">
                {/* Avatars Tab */}
                {activeTab === 'avatars' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {shopAvatars.map(avatar => {
                            const owned = student.ownedAvatarIds.includes(avatar.id);
                            const canAfford = student.stars >= avatar.cost;

                            return (
                                <div
                                    key={avatar.id}
                                    className={`relative bg-white rounded-2xl p-4 shadow-lg border-2 transition-all ${owned ? 'border-green-400' : canAfford ? 'border-gray-200 hover:border-brand-400' : 'border-gray-200 opacity-60'
                                        }`}
                                >
                                    {owned && (
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center">
                                        {avatar.isEmoji ? (
                                            <div className="text-6xl mb-2">{avatar.imagePath}</div>
                                        ) : (
                                            <img src={avatar.imagePath} alt={avatar.name} className="w-20 h-20 rounded-full mb-2 object-cover" />
                                        )}
                                        <p className="text-sm font-semibold text-slate-700 text-center mb-2">{avatar.name}</p>
                                        {!owned && (
                                            <button
                                                onClick={() => handlePurchaseAvatar(avatar.id, avatar.cost)}
                                                disabled={!canAfford}
                                                className={`w-full px-3 py-2 rounded-lg font-semibold flex items-center justify-center gap-1 ${canAfford
                                                        ? 'bg-brand-500 hover:bg-brand-600 text-white'
                                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                <Star size={14} className={canAfford ? 'fill-yellow-300' : ''} />
                                                {avatar.cost}
                                            </button>
                                        )}
                                        {owned && (
                                            <div className="w-full px-3 py-2 rounded-lg bg-green-100 text-green-700 font-semibold text-center text-sm">
                                                Đã sở hữu
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Themes Tab */}
                {activeTab === 'themes' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shopThemes.map(theme => {
                            const owned = student.ownedThemeIds.includes(theme.id);
                            const canAfford = student.stars >= theme.cost;

                            return (
                                <div
                                    key={theme.id}
                                    className={`relative bg-white rounded-2xl p-6 shadow-lg border-2 transition-all ${owned ? 'border-green-400' : canAfford ? 'border-gray-200 hover:border-brand-400' : 'border-gray-200 opacity-60'
                                        }`}
                                >
                                    {owned && (
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                                            <CheckCircle size={20} />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="text-4xl">{theme.thumbnailPath}</div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-slate-800">{theme.name}</h3>
                                            <div className="flex gap-1 mt-1">
                                                {Object.values(theme.colors).slice(0, 5).map((color, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="w-4 h-4 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {!owned && (
                                        <button
                                            onClick={() => handlePurchaseTheme(theme.id, theme.cost)}
                                            disabled={!canAfford}
                                            className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${canAfford
                                                    ? 'bg-brand-500 hover:bg-brand-600 text-white'
                                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                }`}
                                        >
                                            <Star size={16} className={canAfford ? 'fill-yellow-300' : ''} />
                                            {theme.cost}
                                        </button>
                                    )}
                                    {owned && (
                                        <div className="w-full px-4 py-3 rounded-lg bg-green-100 text-green-700 font-semibold text-center">
                                            Đã sở hữu
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Photos Tab */}
                {activeTab === 'photos' && (
                    <div>
                        <p className="text-sm text-gray-500 mb-4 text-center">
                            🔄 Làm mới hàng ngày lúc 00:00 • {dailyPhotos.length} ảnh có sẵn
                        </p>
                        {dailyPhotos.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg">Đã mua hết ảnh hôm nay! 🎉</p>
                                <p className="text-sm">Quay lại vào ngày mai nhé!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {dailyPhotos.map(dailyPhoto => {
                                    const image = getImageById(dailyPhoto.imageId);
                                    if (!image) return null;

                                    const owned = student.ownedImageIds.includes(image.id);
                                    const cost = getPhotoPrice(dailyPhoto.rarity);
                                    const canAfford = student.stars >= cost;
                                    const rarityColor = getRarityColor(image.rarity);

                                    return (
                                        <div
                                            key={image.id}
                                            className={`relative bg-white rounded-2xl p-3 shadow-lg border-4 transition-all ${owned ? 'opacity-60' : canAfford ? 'hover:scale-105' : 'opacity-60'
                                                }`}
                                            style={{ borderColor: rarityColor }}
                                        >
                                            {owned && (
                                                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 z-10">
                                                    <CheckCircle size={18} />
                                                </div>
                                            )}
                                            <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                                                <img src={image.imagePath} alt={image.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="text-xs font-semibold text-center mb-1" style={{ color: rarityColor }}>
                                                {getRarityName(image.rarity)}
                                            </div>
                                            {!owned && (
                                                <button
                                                    onClick={() => handlePurchasePhoto(image.id, dailyPhoto.rarity)}
                                                    disabled={!canAfford}
                                                    className={`w-full px-2 py-1.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1 ${canAfford
                                                            ? 'bg-brand-500 hover:bg-brand-600 text-white'
                                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <Star size={12} className={canAfford ? 'fill-yellow-300' : ''} />
                                                    {cost}
                                                </button>
                                            )}
                                            {owned && (
                                                <div className="w-full px-2 py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold text-center text-xs">
                                                    Đã có
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
