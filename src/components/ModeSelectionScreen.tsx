import React from 'react';
import { StudentProfile } from '../../types';
import { getAvatarById } from '../../services/avatarService';
import { ShoppingBag, User as UserIcon, LogOut, Gamepad2, BookOpen, Library, Trophy, Cpu, Languages, ListOrdered, Palette } from 'lucide-react';
import { MusicControls } from '@/src/components/MusicControls';
import { isPreschool } from '@/src/utils/grade';

export type SelectableMode = 'study' | 'game' | 'profile' | 'shop' | 'library' | 'riddle' | 'coding' | 'science' | 'alphabet' | 'counting' | 'colors';

interface ModeSelectionScreenProps {
    student: StudentProfile;
    onSelectMode: (mode: SelectableMode) => void;
    onLogout: () => void;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
    student,
    onSelectMode,
    onLogout,
}) => {
    const avatar = getAvatarById(student.currentAvatarId);
    const preschool = isPreschool(student.grade);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-purple-50 to-fun-yellow/20 relative">
            {/* Top Bar - Simplified without Music Controls */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 bg-white/10 backdrop-blur-md border-b border-white/20">
                {/* Shop Button */}
                <button
                    onClick={() => onSelectMode('shop')}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-xl shadow-sm transition-all font-semibold justify-center"
                >
                    <ShoppingBag size={20} />
                    <span className="hidden sm:inline">Cửa hàng</span>
                </button>

                {/* Right Side: Profile + Logout */}
                <div className="flex items-center gap-2">
                    {/* Profile Button */}
                    <button
                        onClick={() => onSelectMode('profile')}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-100 hover:bg-brand-200 text-brand-800 rounded-xl shadow-sm transition-all justify-center"
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
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl shadow-sm transition-all justify-center"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Floating Music Controls - Right Side, Vertical Stack */}
            <div className="fixed right-4 top-20 z-40">
                <MusicControls vertical />
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
                {!preschool && (
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
                )}

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
                            Học qua các trò chơi vui nhộn
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

                {/* Thư Viện Mode */}
                <button
                    onClick={() => onSelectMode('library')}
                    className="group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-amber-400 hover:scale-105 animate-in fade-in slide-in-from-bottom duration-500"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Library size={48} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-amber-600 transition-colors">
                            Thư Viện
                        </h2>

                        <p className="text-slate-600 text-lg">
                            Đọc sách và khám phá tri thức
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                                Book World
                            </span>
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                                1000 Câu hỏi
                            </span>
                        </div>
                    </div>
                </button>

                {!preschool && (<>
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
                            Sphinx Riddle
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

                {/* Kid Coder Mode */}
                <button
                    onClick={() => onSelectMode('coding')}
                    className="group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-cyan-400 hover:scale-105 animate-in fade-in slide-in-from-right duration-700"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-100 to-blue-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                            <Cpu size={48} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-cyan-600 transition-colors">
                            Lập Trình Nhí
                        </h2>

                        <p className="text-slate-600 text-lg">
                            Học tư duy máy tính và logic
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold">
                                Robot
                            </span>
                            <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold">
                                Thuật toán
                            </span>
                            <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold">
                                Sáng tạo
                            </span>
                        </div>
                    </div>
                </button>
                </>)}

                {/* Science Mode */}
                <button
                    onClick={() => onSelectMode('science')}
                    className="group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-emerald-400 hover:scale-105 animate-in fade-in slide-in-from-right duration-700"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-cyan-900 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg border-2 border-white/20">
                            <span className="text-5xl">🔬</span>
                        </div>

                        <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-emerald-300 transition-colors">
                            Khoa Học
                        </h2>

                        <p className="text-slate-600 text-lg group-hover:text-emerald-100">
                            Hệ mặt trời, Bảng tuần hoàn và nhiều hơn nữa
                        </p>

                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold group-hover:bg-white/20 group-hover:text-white">
                                Vũ trụ
                            </span>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold group-hover:bg-white/20 group-hover:text-white">
                                Hóa học
                            </span>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold group-hover:bg-white/20 group-hover:text-white">
                                3D
                            </span>
                        </div>
                    </div>
                </button>

                {/* ===== Mầm non: 3 module làm quen ===== */}
                {preschool && (<>
                    {/* Bảng chữ cái Tiếng Anh */}
                    <button
                        onClick={() => onSelectMode('alphabet')}
                        className="order-first group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-pink-400 hover:scale-105 animate-in fade-in slide-in-from-left duration-500"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <Languages size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-pink-600 transition-colors">
                                Bảng Chữ Cái
                            </h2>
                            <p className="text-slate-600 text-lg">
                                Làm quen chữ cái Tiếng Anh A–Z
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">Học chữ</span>
                                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">Nghe & chọn</span>
                                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">🔊 Đọc to</span>
                            </div>
                        </div>
                    </button>

                    {/* Số đếm Tiếng Anh - Việt */}
                    <button
                        onClick={() => onSelectMode('counting')}
                        className="order-first group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-teal-400 hover:scale-105 animate-in fade-in slide-in-from-bottom duration-500"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-emerald-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <ListOrdered size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-teal-600 transition-colors">
                                Số Đếm
                            </h2>
                            <p className="text-slate-600 text-lg">
                                Đếm số Tiếng Anh – Việt
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">1 → 10</span>
                                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">Đếm vật</span>
                                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">🔊 Đọc to</span>
                            </div>
                        </div>
                    </button>

                    {/* Màu sắc Tiếng Anh - Việt */}
                    <button
                        onClick={() => onSelectMode('colors')}
                        className="order-first group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-fuchsia-400 hover:scale-105 animate-in fade-in slide-in-from-right duration-500"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-100 to-violet-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-fuchsia-500 to-violet-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <Palette size={48} className="text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-fuchsia-600 transition-colors">
                                Màu Sắc
                            </h2>
                            <p className="text-slate-600 text-lg">
                                Màu sắc Tiếng Anh – Việt
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                <span className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-sm font-semibold">Học màu</span>
                                <span className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-sm font-semibold">Tô màu</span>
                                <span className="px-3 py-1 bg-fuchsia-100 text-fuchsia-700 rounded-full text-sm font-semibold">🔊 Đọc to</span>
                            </div>
                        </div>
                    </button>
                </>)}

            </div>

            <div className="mt-12 text-center text-slate-500 animate-in fade-in duration-1000 delay-300">
                <p className="text-sm">🎯 Chọn chế độ phù hợp để bắt đầu!</p>
            </div>
        </div>
    );
};
