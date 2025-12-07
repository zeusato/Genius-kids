import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Atom, Globe, Zap } from 'lucide-react';
import { MusicControls } from '@/src/components/MusicControls';

export const ScienceMenuPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/mode')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-semibold text-white shadow-md backdrop-blur-sm"
                    >
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>

                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                        Khoa Học
                    </h1>

                    <MusicControls />
                </div>

                {/* Description */}
                <div className="text-center mb-12">
                    <p className="text-white/70 text-lg">
                        Khám phá thế giới khoa học kỳ thú! Chọn chủ đề bạn muốn tìm hiểu.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Solar System Card */}
                    <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-md rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-white/10 hover:border-white/20">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform ring-2 ring-blue-400/50">
                                <Globe size={64} className="text-white" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-white mb-3">
                                    Khám Phá Hệ Mặt Trời
                                </h3>
                                <p className="text-white/70 text-lg mb-6">
                                    Du hành qua hệ mặt trời, khám phá các hành tinh, mặt trăng và những bí ẩn vũ trụ!
                                </p>

                                <button
                                    onClick={() => navigate('/science/solar-system')}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    🚀 Khám phá ngay!
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Periodic Table Card */}
                    <div className="bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 backdrop-blur-md rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-white/10 hover:border-white/20">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-lg transform hover:-rotate-6 transition-transform ring-2 ring-cyan-400/50">
                                <Atom size={64} className="text-white" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-white mb-3">
                                    Bảng Tuần Hoàn
                                </h3>
                                <p className="text-white/70 text-lg mb-6">
                                    Khám phá 118 nguyên tố hóa học với mô hình nguyên tử 3D tương tác và những kiến thức thú vị!
                                </p>

                                <button
                                    onClick={() => navigate('/science/periodic-table')}
                                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    ⚛️ Khám phá ngay!
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Electricity Card */}
                    <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 backdrop-blur-md rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-white/10 hover:border-white/20">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform ring-2 ring-yellow-400/50">
                                <Zap size={64} className="text-white" />
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-white mb-3">
                                    Điện & Mạch điện
                                </h3>
                                <p className="text-white/70 text-lg mb-6">
                                    Học lắp ráp mạch điện qua thí nghiệm tương tác! Kéo thả linh kiện, xem electron chạy.
                                </p>

                                <button
                                    onClick={() => navigate('/science/electricity')}
                                    className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                >
                                    ⚡ Khám phá ngay!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <div className="text-center mt-12 text-white/50 text-sm">
                    <p>Tiếp tục thêm nhiều chủ đề khoa học hấp dẫn!</p>
                </div>
            </div>
        </div>
    );
};
