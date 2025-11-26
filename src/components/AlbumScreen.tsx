import React, { useState } from 'react';
import { StudentProfile, Rarity, AlbumImage } from '../../types';
import { getAllCollections } from '../../services/albumService';
import { getRarityColor, getRarityName } from '../../services/albumService';
import { ArrowLeft, Lock, X, Download } from 'lucide-react';
import { MusicControls } from '@/src/components/MusicControls';

interface AlbumScreenProps {
    student: StudentProfile;
    onBack: () => void;
}

export const AlbumScreen: React.FC<AlbumScreenProps> = ({
    student,
    onBack,
}) => {
    const collections = getAllCollections();
    const [selectedImage, setSelectedImage] = useState<AlbumImage | null>(null);

    const handleDownload = async (image: AlbumImage) => {
        try {
            // Fetch the image as blob
            const response = await fetch(image.imagePath);
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${image.name}.jpg`; // Filename with image name
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Không thể tải ảnh. Vui lòng thử lại!');
        }
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
                <h1 className="text-3xl font-bold text-slate-800">📚 Album sưu tập</h1>
                <MusicControls />
            </div>

            {/* Collections */}
            <div className="space-y-8">
                {collections.map(collection => {
                    const totalImages = collection.images.length;
                    const ownedCount = collection.images.filter(img =>
                        student.ownedImageIds.includes(img.id)
                    ).length;
                    const progress = Math.round((ownedCount / totalImages) * 100);

                    return (
                        <div key={collection.id} className="bg-white rounded-2xl shadow-lg p-6">
                            {/* Collection Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{collection.name}</h2>
                                    <p className="text-gray-600">{collection.description}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-brand-600">{ownedCount}/{totalImages}</div>
                                    <div className="text-sm text-gray-500">Đã sưu tập</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-brand-500 to-brand-600 h-full transition-all duration-500 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-sm text-center mt-1 text-gray-600">{progress}% hoàn thành</p>
                            </div>

                            {/* Image Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                {collection.images.map(image => {
                                    const owned = student.ownedImageIds.includes(image.id);
                                    const rarityColor = getRarityColor(image.rarity);
                                    const rarityName = getRarityName(image.rarity);

                                    return (
                                        <div
                                            key={image.id}
                                            className={`relative aspect-square rounded-xl overflow-hidden transition-all border-4 ${owned ? 'shadow-md hover:scale-105 cursor-pointer' : 'bg-gray-100'
                                                }`}
                                            style={{ borderColor: rarityColor }}
                                            onClick={() => owned && setSelectedImage(image)}
                                        >
                                            {owned ? (
                                                <>
                                                    <img
                                                        src={image.imagePath}
                                                        alt={image.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Rarity Badge */}
                                                    <div
                                                        className="absolute bottom-0 left-0 right-0 py-1 text-center text-xs font-bold text-white"
                                                        style={{ backgroundColor: rarityColor + 'E6' }}
                                                    >
                                                        {rarityName}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                    <Lock size={28} className="text-gray-400 mb-2" />
                                                    <span className="text-xs text-gray-500 font-semibold">Chưa mở</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Rarity Legend */}
                            <div className="mt-6 pt-4 border-t flex flex-wrap gap-3 justify-center text-sm">
                                {[Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic, Rarity.Legendary].map(rarity => {
                                    const color = getRarityColor(rarity);
                                    const name = getRarityName(rarity);
                                    const count = collection.images.filter(img =>
                                        img.rarity === rarity && student.ownedImageIds.includes(img.id)
                                    ).length;
                                    const total = collection.images.filter(img => img.rarity === rarity).length;

                                    return (
                                        <div key={rarity} className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full border-2"
                                                style={{ backgroundColor: color, borderColor: color }}
                                            />
                                            <span className="font-semibold text-gray-700">{name}:</span>
                                            <span className="font-bold" style={{ color: color }}>{count}/{total}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {collections.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-2xl text-gray-400">Chưa có bộ sưu tập nào</p>
                </div>
            )}

            {/* Image Viewer Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 fade-in duration-300 border-8"
                        style={{ borderColor: getRarityColor(selectedImage.rarity) }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Action Buttons */}
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            {/* Download Button */}
                            <button
                                onClick={() => handleDownload(selectedImage)}
                                className="p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-110 flex items-center gap-2"
                                title="Tải ảnh về"
                            >
                                <Download size={24} />
                            </button>

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="p-3 bg-white/90 hover:bg-white text-gray-800 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-110"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Image Container with Gradient Border */}
                        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                            <img
                                src={selectedImage.imagePath}
                                alt={selectedImage.name}
                                className="w-full object-contain max-h-[65vh] rounded-xl shadow-lg"
                            />
                        </div>

                        {/* Image Info - Premium Style */}
                        <div
                            className="p-8 bg-gradient-to-br from-white via-gray-50 to-gray-100"
                        >
                            {/* Rarity Badge */}
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="px-4 py-2 rounded-full font-bold text-white shadow-lg flex items-center gap-2"
                                    style={{ backgroundColor: getRarityColor(selectedImage.rarity) }}
                                >
                                    <span className="text-lg">✨</span>
                                    <span className="text-sm uppercase tracking-wider">{getRarityName(selectedImage.rarity)}</span>
                                </div>
                            </div>

                            {/* Image Name */}
                            <h3 className="text-3xl font-extrabold text-gray-900 mb-2 drop-shadow-sm">
                                {selectedImage.name}
                            </h3>

                            {/* Collection Info */}
                            <p className="text-gray-600 font-medium">
                                Bộ sưu tập: <span className="text-brand-600 font-semibold">
                                    {collections.find(c => c.id === selectedImage.collectionId)?.name || 'Unknown'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
