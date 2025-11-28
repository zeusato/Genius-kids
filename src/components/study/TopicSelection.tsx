import React, { useState, useMemo } from 'react';
import { useStudent } from '@/src/contexts/StudentContext';
import { getTopicsByGrade } from '@/services/mathEngine';
import { BookOpen, Trophy, BarChart2, CheckCircle, ChevronRight, ArrowLeft, Settings, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TopicSelectionProps {
    onStartTest: (topicIds: string[], count: number) => void;
    onExport: (topics: string[], count: number) => Promise<void>;
    onBack: () => void;
}

const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false }: any) => {
    const baseStyle = 'px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';
    const variants = {
        primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg hover:shadow-xl',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        success: 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl',
        outline: 'border-2 border-gray-300 hover:border-brand-500 hover:bg-brand-50 text-gray-700'
    };
    return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

const Card = ({ children, className = '' }: any) => {
    return <div className={`bg-white p-6 rounded-2xl shadow-md border border-gray-100 ${className}`}>{children}</div>;
};

export function TopicSelection({ onStartTest, onExport, onBack }: TopicSelectionProps) {
    const { currentStudent } = useStudent();
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [questionCount, setQuestionCount] = useState<number>(20);
    const [isExporting, setIsExporting] = useState(false);

    if (!currentStudent) return null;

    const gradeTopics = useMemo(() => getTopicsByGrade(currentStudent.grade), [currentStudent.grade]);

    const toggleTopic = (id: string) => {
        setSelectedTopics(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    const selectAll = () => setSelectedTopics(gradeTopics.map(t => t.id));
    const deselectAll = () => setSelectedTopics([]);

    const handleExportClick = async () => {
        setIsExporting(true);
        try {
            await onExport(selectedTopics, questionCount);
        } catch (error) {
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        setQuestionCount(val);
    };

    const handleBlurCount = () => {
        if (questionCount < 20) setQuestionCount(20);
        if (questionCount > 100) setQuestionCount(100);
    }

    // Calculate stats
    const totalTests = currentStudent.history.length;
    const avgScore = totalTests > 0
        ? Math.round(currentStudent.history.reduce((acc, test) => acc + ((test.score / test.totalQuestions) * 100), 0) / totalTests)
        : 0;

    return (
        <div className="max-w-5xl mx-auto p-4 pb-32">
            <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-100 p-3 rounded-full text-2xl">🎓</div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Chào, {currentStudent.name}!</h2>
                        <p className="text-slate-500">Học sinh lớp {currentStudent.grade}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={onBack} className="text-sm px-4 py-2">
                    <ArrowLeft size={16} className="mr-2" /> Quay lại
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <BookOpen className="text-brand-500" /> Chọn chủ đề ôn luyện
                            </h3>
                            {selectedTopics.length === gradeTopics.length ? (
                                <button onClick={deselectAll} className="text-sm text-red-600 font-semibold hover:underline">Bỏ chọn tất cả</button>
                            ) : (
                                <button onClick={selectAll} className="text-sm text-brand-600 font-semibold hover:underline">Chọn tất cả</button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gradeTopics.map((topic, index) => {
                                // Check if this is the first typing topic
                                const isTypingTopic = topic.id.includes('typing');
                                const prevTopic = index > 0 ? gradeTopics[index - 1] : null;
                                const isFirstTypingTopic = isTypingTopic && (!prevTopic || !prevTopic.id.includes('typing'));

                                return (
                                    <React.Fragment key={topic.id}>
                                        {isFirstTypingTopic && (
                                            <div className="col-span-full my-4">
                                                <div className="relative flex items-center">
                                                    <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
                                                    <span className="flex-shrink mx-4 text-sm font-bold text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                                                        ⌨️ LUYỆN GÕ PHÍM
                                                    </span>
                                                    <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
                                                </div>
                                            </div>
                                        )}
                                        <div
                                            onClick={() => toggleTopic(topic.id)}
                                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedTopics.includes(topic.id) ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-gray-100 bg-white hover:border-brand-200'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-800">{topic.title}</h4>
                                                {selectedTopics.includes(topic.id) && <CheckCircle size={20} className="text-brand-500" />}
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">{topic.description}</p>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </section>

                    {selectedTopics.length > 0 && (
                        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-auto md:max-w-5xl md:w-full mx-auto z-50 animate-bounce-in">
                            <div className="bg-slate-800 text-white p-4 rounded-xl shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-700">
                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                                    <div className="font-medium pl-2 whitespace-nowrap">
                                        Đã chọn {selectedTopics.length} chủ đề
                                    </div>
                                    <div className="h-8 w-px bg-slate-600 hidden md:block"></div>
                                    <div className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-lg">
                                        <Settings size={16} className="text-slate-300" />
                                        <span className="text-sm text-slate-300 mr-2 whitespace-nowrap">Số câu:</span>
                                        <input
                                            type="number"
                                            min="20"
                                            max="100"
                                            value={questionCount}
                                            onChange={handleQuestionCountChange}
                                            onBlur={handleBlurCount}
                                            className="w-16 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-brand-500 font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
                                    <Button variant="secondary" className="py-2 text-sm flex-1 md:flex-none whitespace-nowrap" onClick={handleExportClick} disabled={isExporting}>
                                        <Printer size={18} className="mr-2" /> {isExporting ? 'Đang tạo...' : 'In đề'}
                                    </Button>
                                    <Button variant="success" className="py-2 flex-1 md:flex-none whitespace-nowrap min-w-[160px]" onClick={() => onStartTest(selectedTopics, questionCount)}>
                                        Bắt đầu ({questionCount}p) <ChevronRight className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-yellow-100 to-orange-50 border-yellow-200">
                        <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-4">
                            <Trophy className="text-yellow-600" /> Thành tích
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-white/60 p-3 rounded-xl">
                                <div className="text-3xl font-bold text-slate-800">{totalTests}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase">Bài thi</div>
                            </div>
                            <div className="bg-white/60 p-3 rounded-xl">
                                <div className="text-3xl font-bold text-brand-600">{avgScore}%</div>
                                <div className="text-xs font-bold text-slate-500 uppercase">Điểm TB</div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                            <BarChart2 className="text-brand-500" /> Tiến độ gần đây
                        </h3>
                        <div className="h-48 w-full">
                            {currentStudent.history.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={currentStudent.history.slice(-5).map(h => ({
                                        ...h,
                                        percentageScore: Math.round((h.score / h.totalQuestions) * 100)
                                    }))}>
                                        <XAxis dataKey="date" hide />
                                        <YAxis domain={[0, 100]} hide />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            labelFormatter={() => ''}
                                            formatter={(value: number) => [`${value}%`, 'Điểm']}
                                        />
                                        <Bar dataKey="percentageScore" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
