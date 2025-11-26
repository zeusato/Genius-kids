import React from 'react';
import { StudentProfile } from '../../types';
import { getAvatarById } from '../../services/avatarService';
import { ShoppingBag, User as UserIcon, LogOut, Gamepad2, BookOpen, BookText } from 'lucide-react';

interface ModeSelectionScreenProps {
    student: StudentProfile;
    onSelectMode: (mode: 'study' | 'game' | 'profile' | 'shop' | 'tellmewhy' | 'riddle') => void;
    onLogout: () => void;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
    student,
    onSelectMode,
    onLogout,
}) => {
    const avatar = getAvatarById(student.currentAvatarId);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-purple-50 to-fun-yellow/20 relative">
            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 bg-white/10 backdrop-blur-md border-b border-white/20">
                {/* Shop Button */}
                <button
                    onClick={() => onSelectMode('shop')}
                    className="flex items-center gap-2 px-4 py-2 min-w-[100px] min-h-[40px] bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-xl shadow-sm transition-all font-semibold justify-center"
                >
                    <ShoppingBag size={20} />
                    <span className="hidden sm:inline">Cửa hàng</span>
                </button>

                {/* Right Side: Profile + Logout */}
                <div className="flex items-center gap-2">
                    {/* Profile Button */}
                    <button
                        onClick={() => onSelectMode('profile')}
                        className="flex items-center gap-2 px-4 py-2 min-w-[100px] min-h-[40px] bg-brand-100 hover:bg-brand-200 text-brand-800 rounded-xl shadow-sm transition-all justify-center"
                    >
                        {avatar && (
                            avatar.isEmoji ? (
                                <span className="text-2xl">{avatar.imagePath}</span>
                            ) : (
                                <img src={avatar.imagePath} alt={avatar.name} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                            )
                        )}
                        <span className="font-semibold hidden sm:inline">{student.name}</span>
                        <UserIcon size={18} className="sm:hidden" />
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-4 py-2 min-w-[100px] min-h-[40px] bg-red-100 hover:bg-red-200 text-red-800 rounded-xl shadow-sm transition-all justify-center"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700 mt-20">
                <h1 className="text-5xl md:text-6xl font-extrabold text-brand-600 mb-4 drop-shadow-sm">
                    Chào {student.name}!
                </h1>
                <p className="text-xl text-slate-600">Chọn chế độ học tập</p>
                <div className="flex items-center gap-2 justify-center text-yellow-600 mt-2">
                    <span className="text-3xl">⭐</span>
                    <span className="text-2xl font-bold">{student.stars}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                {/* Study Mode */}
                <button
                    onClick={() => onSelectMode('study')}
                    className="group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-brand-400 hover:scale-105 animate-in fade-in slide-in-from-left duration-500"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto mb-6 bg-brand-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <BookOpen size={48} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-brand-600 transition-colors">
                            Ôn Luyện
                        </h2>

                        <p className="text-slate-600 text-lg">
                            Làm bài tập toán theo chủ đề và lớp học
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold">
                                Kiểm tra
                            </span>
                            <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold">
                                Luyện tập
                            </span>
                            <span className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold">
                                Xuất PDF
                            </span>
                        </div>
                    </div>
                </button>

                {/* Game Mode */}
                <button
                    onClick={() => onSelectMode('game')}
                    className="group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-fun-purple hover:scale-105 animate-in fade-in slide-in-from-right duration-500"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-fun-purple to-pink-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Gamepad2 size={48} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-fun-purple transition-colors">
                            Games
                        </h2>

                        <p className="text-slate-600 text-lg">
                            Học toán qua các trò chơi vui nhộn
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                                Ghép thẻ
                            </span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                                Tìm quy luật
                            </span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                                Thử thách
                            </span>
                        </div>
                    </div>
                </button>

                {/* Tell Me Why Mode */}
                <button
                    onClick={() => onSelectMode('tellmewhy')}
                    className="group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-yellow-400 hover:scale-105 animate-in fade-in slide-in-from-bottom duration-500"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-orange-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <BookText size={48} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-yellow-600 transition-colors">
                            1000 Câu hỏi
                        </h2>

                        <p className="text-slate-600 text-lg">
                            Khám phá tri thức qua câu hỏi vì sao
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                                Động vật
                            </span>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                                Khoa học
                            </span>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                                Tự nhiên
                            </span>
                        </div>
                    </div>
                </button>

                {/* Sphinx Riddle Mode */}
                <button
                    onClick={() => onSelectMode('riddle')}
                    className="group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-indigo-400 hover:scale-105 animate-in fade-in slide-in-from-left duration-700"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-violet-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <span className="text-5xl">🦁</span>
                        </div>

                        <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">
                            Nhân Sư
                        </h2>

                        <p className="text-slate-600 text-lg">
                            Giải đố cùng Nhân sư nhận phần thưởng
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                                Việt Nam
                            </span>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                                Nước ngoài
                            </span>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                                3 độ khó
                            </span>
                        </div>
                    </div>
                </button>
            </div>

            <div className="mt-12 text-center text-slate-500 animate-in fade-in duration-1000 delay-300">
                <p className="text-sm">🎯 Chọn chế độ phù hợp để bắt đầu học toán!</p>
            </div>
        </div>
    );
};
