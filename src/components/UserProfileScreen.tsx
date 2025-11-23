import React, { useState } from 'react';
import { StudentProfile } from '../../types';
import { getAllAvatars, getAvatarById } from '../../services/avatarService';
import { getAllThemes, getThemeById, applyTheme } from '../../services/themeService';
import { getProfileStats, getDailyStarsEarned } from '../../services/profileService';
import { ArrowLeft, Edit2, Image, Palette, Album, LogOut, AlertTriangle, Info } from 'lucide-react';

interface UserProfileScreenProps {
    student: StudentProfile;
    onUpdateProfile: (updated: StudentProfile) => void;
    onBack: () => void;
    onOpenAlbum: () => void;
    onDelete: () => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({
    student,
    onUpdateProfile,
    onBack,
    onOpenAlbum,
    onDelete,
}) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(student.name);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const stats = getProfileStats(student);
    const dailyStars = getDailyStarsEarned(student);
    const currentAvatar = getAvatarById(student.currentAvatarId);
    const currentTheme = getThemeById(student.currentThemeId);
    const ownedAvatars = getAllAvatars().filter(a => student.ownedAvatarIds.includes(a.id));
    const ownedThemes = getAllThemes().filter(t => student.ownedThemeIds.includes(t.id));

    const handleSaveName = () => {
        if (newName.trim()) {
            onUpdateProfile({ ...student, name: newName.trim() });
            setIsEditingName(false);
        }
    };

    const handleChangeAvatar = (avatarId: string) => {
        onUpdateProfile({ ...student, currentAvatarId: avatarId });
        setShowAvatarPicker(false);
    };

    const handleChangeTheme = (themeId: string) => {
        applyTheme(themeId);
        onUpdateProfile({ ...student, currentThemeId: themeId });
        setShowThemePicker(false);
    };

    return (
        <div className="min-h-screen p-4 pb-20 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                >
                    <ArrowLeft size={20} />
                    <span>Quay lại</span>
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Hồ sơ của bạn</h1>
                <div className="w-24"></div>
            </div>

            {/* Avatar Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Avatar</h2>
                    <button
                        onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-100 hover:bg-brand-200 text-brand-800 rounded-lg transition-all text-sm font-semibold"
                    >
                        <Image size={16} />
                        Đổi avatar
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {currentAvatar && (
                        currentAvatar.isEmoji ? (
                            <div className="text-6xl bg-brand-50 p-4 rounded-2xl">{currentAvatar.imagePath}</div>
                        ) : (
                            <img src={currentAvatar.imagePath} alt={currentAvatar.name} className="w-24 h-24 rounded-2xl object-cover border-4 border-brand-200" />
                        )
                    )}
                    <div>
                        <p className="text-lg font-semibold text-slate-700">{currentAvatar?.name}</p>
                        <p className="text-sm text-slate-500">Đã sở hữu {ownedAvatars.length} avatar</p>
                    </div>
                </div>

                {/* Avatar Picker */}
                {showAvatarPicker && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-semibold text-slate-600 mb-3">Chọn avatar:</p>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                            {ownedAvatars.map(avatar => (
                                <button
                                    key={avatar.id}
                                    onClick={() => handleChangeAvatar(avatar.id)}
                                    className={`p-2 rounded-lg transition-all ${avatar.id === student.currentAvatarId
                                        ? 'bg-brand-500 ring-2 ring-brand-300'
                                        : 'bg-white hover:bg-gray-100'
                                        }`}
                                >
                                    {avatar.isEmoji ? (
                                        <span className="text-2xl">{avatar.imagePath}</span>
                                    ) : (
                                        <img src={avatar.imagePath} alt={avatar.name} className="w-full h-auto rounded" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Name Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Tên</h2>
                        {isEditingName ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="flex-1 px-4 py-2 border-2 border-brand-300 rounded-lg focus:border-brand-500 focus:outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveName}
                                    className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 font-semibold"
                                >
                                    Lưu
                                </button>
                                <button
                                    onClick={() => {
                                        setNewName(student.name);
                                        setIsEditingName(false);
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Hủy
                                </button>
                            </div>
                        ) : (
                            <p className="text-2xl font-bold text-brand-600">{student.name}</p>
                        )}
                    </div>
                    {!isEditingName && (
                        <button
                            onClick={() => setIsEditingName(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all ml-4"
                        >
                            <Edit2 size={16} />
                            Sửa
                        </button>
                    )}
                </div>
            </div>

            {/* Stars & Album */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Stars */}
                <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-yellow-800">Số sao sở hữu</h2>
                        <div className="group relative">
                            <Info size={20} className="text-yellow-700 cursor-help" />
                            <div className="absolute right-0 top-8 w-64 bg-gradient-to-br from-yellow-400 to-orange-400 text-gray-900 text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl border-2 border-yellow-500">
                                <p className="font-bold mb-1">💡 Cách kiếm sao:</p>
                                <p>• Hoàn thành bài test/game</p>
                                <p>• Nhận huy chương (🥉🥈🥇)</p>
                                <p>• Bronze = 1⭐, Silver = 2⭐, Gold = 3⭐</p>
                                <p>• Nhận 10⭐ khi kiếm được ảnh trùng lặp</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-6xl">⭐</span>
                        <span className="text-5xl font-black text-yellow-600">{student.stars}</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">Tổng kiếm được trong ngày: {dailyStars} ⭐</p>
                </div>

                {/* Album */}
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-purple-800">Album sưu tập</h2>
                        <div className="group relative">
                            <Info size={20} className="text-purple-700 cursor-help" />
                            <div className="absolute right-0 top-8 w-64 bg-gradient-to-br from-purple-400 to-pink-400 text-gray-900 text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl border-2 border-purple-500">
                                <p className="font-bold mb-1">🎁 Cách nhận ảnh:</p>
                                <p>• Kiếm được sao từ test/game</p>
                                <p>• Có 30% cơ hội nhận ảnh ngẫu nhiên</p>
                                <p>• Độ hiếm: Phổ thông → Huyền thoại</p>
                                <p>• Một số có thể mua tại cửa hàng</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-3xl font-bold text-purple-600">{stats.totalImagesCollected}</p>
                            <p className="text-sm text-purple-700">ảnh đã sưu tập</p>
                        </div>
                        <button
                            onClick={onOpenAlbum}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all font-semibold"
                        >
                            <Album size={20} />
                            Xem
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics - Tests */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Thống kê ôn luyện</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl">
                        <p className="text-3xl font-bold text-blue-600">{stats.totalTests}</p>
                        <p className="text-sm text-blue-700">Bài thi đã làm</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                        <p className="text-3xl font-bold text-green-600">{stats.averageTestScore}%</p>
                        <p className="text-sm text-green-700">Điểm trung bình</p>
                    </div>
                </div>
            </div>

            {/* Statistics - Games */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Thống kê game</h2>
                {Object.keys(stats.gamesByType).length > 0 ? (
                    <div className="space-y-3">
                        {Object.entries(stats.gamesByType).map(([gameType, gameStats]) => (
                            <div key={gameType} className="bg-gray-50 p-4 rounded-xl">
                                <h3 className="font-semibold text-slate-700 capitalize mb-2">{gameType}</h3>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <p className="text-gray-500">Số lần chơi</p>
                                        <p className="font-bold text-slate-800">{gameStats.count}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Điểm TB</p>
                                        <p className="font-bold text-slate-800">{gameStats.avgScore}%</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Sao TB</p>
                                        <p className="font-bold text-yellow-600">{gameStats.avgStars}⭐</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">Chưa chơi game nào</p>
                )}
            </div>

            {/* Theme Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Giao diện</h2>
                    <button
                        onClick={() => setShowThemePicker(!showThemePicker)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-all text-sm font-semibold"
                    >
                        <Palette size={16} />
                        Đổi theme
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-3xl">{currentTheme?.thumbnailPath}</span>
                    <div>
                        <p className="text-lg font-semibold text-slate-700">{currentTheme?.name}</p>
                        <p className="text-sm text-slate-500">Đã sở hữu {ownedThemes.length} theme</p>
                    </div>
                </div>

                {/* Theme Picker */}
                {showThemePicker && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm font-semibold text-slate-600 mb-3">Chọn giao diện:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ownedThemes.map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleChangeTheme(theme.id)}
                                    className={`p-4 rounded-lg transition-all text-left ${theme.id === student.currentThemeId
                                        ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                                        : 'bg-white hover:bg-gray-100 text-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{theme.thumbnailPath}</span>
                                        <span className="font-semibold">{theme.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* Delete Account Section */}
            <div className="mt-8 pt-8 border-t border-slate-200 text-center">
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-2 mx-auto px-4 py-2 hover:bg-red-50 rounded-lg transition-all"
                >
                    <LogOut size={18} />
                    Xóa tài khoản vĩnh viễn
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-red-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Xóa tài khoản?</h3>
                            <p className="text-slate-600">
                                Bạn có chắc chắn muốn xóa hồ sơ của <strong>{student.name}</strong> không?
                            </p>
                            <div className="mt-4 p-4 bg-red-50 rounded-xl text-left text-sm text-red-700 border border-red-100">
                                <p className="font-bold mb-1">Cảnh báo:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Mất toàn bộ {student.stars} sao đã tích lũy</li>
                                    <li>Mất tất cả avatar và theme đã mua</li>
                                    <li>Mất bộ sưu tập ảnh và lịch sử học tập</li>
                                    <li>Hành động này <strong>không thể hoàn tác</strong></li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl font-semibold transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={() => {
                                    onDelete();
                                    setShowDeleteConfirm(false);
                                }}
                                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 transition-all"
                            >
                                Xóa vĩnh viễn
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
