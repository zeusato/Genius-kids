import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '@/src/contexts/StudentContext';
import { ArrowLeft, BookOpen, HelpCircle } from 'lucide-react';
import { MusicControls } from '@/src/components/MusicControls';

export function LibraryPage() {
    const navigate = useNavigate();
    const { currentStudent } = useStudent();

    if (!currentStudent) {
        navigate('/');
        return null;
    }

    const handleBack = () => {
        navigate('/mode');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white text-slate-600 hover:text-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all font-semibold"
                >
                    <ArrowLeft size={20} />
                    <span className="hidden sm:inline">Quay lại</span>
                </button>

                <h1 className="text-3xl md:text-4xl font-bold text-amber-700 flex items-center gap-3">
                    📚 Thư Viện
                </h1>

                <MusicControls />
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto">
                <p className="text-center text-amber-600 mb-8 text-lg">
                    Chọn nội dung bạn muốn khám phá
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tell Me Why Card */}
                    <button
                        onClick={() => navigate('/library/tellmewhy')}
                        className="group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-yellow-400 hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-orange-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <HelpCircle size={48} className="text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-yellow-600 transition-colors">
                                1000 Câu hỏi Vì sao
                            </h2>

                            <p className="text-slate-600">
                                Khám phá tri thức qua những câu hỏi thú vị
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

                    {/* Book World Card */}
                    <button
                        onClick={() => navigate('/library/books')}
                        className="group relative bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-transparent hover:border-emerald-400 hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                <BookOpen size={48} className="text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-emerald-600 transition-colors">
                                Book World
                            </h2>

                            <p className="text-slate-600">
                                Đọc sách với hiệu ứng lật trang sống động
                            </p>

                            <div className="mt-6 flex flex-wrap gap-2 justify-center">
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                                    Truyện
                                </span>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                                    Khoa học
                                </span>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                                    Tham khảo
                                </span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LibraryPage;
