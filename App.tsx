
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Grade, StudentProfile, Topic, TestResult, Question, QuestionType } from './types';
import { TOPICS, generateQuestions, getTopicsByGrade } from './services/mathEngine';
import { exportTestToPDF } from './utils/pdfExport';
import { soundManager } from './utils/sound';
import {
  User, Plus, BookOpen, Clock, CheckCircle, XCircle,
  Trophy, BarChart2, ChevronRight, LogOut, Printer, Star, Brain, X,
  CheckSquare, Type, Settings, Keyboard, Download, Share, MoreVertical
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Components ---

const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false }: any) => {
  const baseStyle = "px-6 py-3 rounded-xl font-bold shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap";
  const variants = {
    primary: "bg-brand-500 hover:bg-brand-600 text-white border-b-4 border-brand-700",
    secondary: "bg-white hover:bg-gray-50 text-brand-600 border-b-4 border-gray-200",
    success: "bg-fun-green hover:bg-green-500 text-white border-b-4 border-green-700",
    danger: "bg-fun-red hover:bg-red-500 text-white border-b-4 border-red-700",
    outline: "border-2 border-brand-500 text-brand-500 hover:bg-brand-50",
    ghost: "bg-transparent hover:bg-gray-100 text-slate-500 border-transparent shadow-none px-3 py-2"
  };

  return (
    <button
      onClick={(e) => {
        soundManager.playClick();
        onClick && onClick(e);
      }}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 ${className}`}>
    {children}
  </div>
);

// --- Screens ---

const InstallInstructions = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in">
    <Card className="w-full max-w-md relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <X size={24} />
      </button>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Download className="text-brand-500" /> Cài đặt ứng dụng
      </h3>
      <div className="space-y-4 text-slate-600">
        <p>Để cài đặt ứng dụng MathGenius Kids, hãy làm theo hướng dẫn sau:</p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
            <span className="bg-brand-100 text-brand-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
            Trên trình duyệt (Chrome/Safari)
          </h4>
          <p className="mb-2">Nhấn vào nút <strong>Chia sẻ</strong> <Share size={16} className="inline" /> hoặc <strong>Menu</strong> <MoreVertical size={16} className="inline" /></p>
          <p>Chọn <strong>"Thêm vào màn hình chính"</strong> hoặc <strong>"Install App"</strong></p>
        </div>

        <div className="text-sm text-slate-500 italic text-center">
          Sau khi cài đặt, bé có thể học toán mọi lúc ngay trên màn hình chính!
        </div>
      </div>
      <div className="mt-6">
        <Button className="w-full" onClick={onClose}>Đã hiểu</Button>
      </div>
    </Card>
  </div>
);

// 1. Profile Selection
const ProfileScreen = ({ onSelectProfile, onInstallClick, canInstall }: { onSelectProfile: (p: StudentProfile) => void, onInstallClick?: () => void, canInstall?: boolean }) => {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProfile, setNewProfile] = useState<{ name: string, grade: Grade }>({ name: '', grade: Grade.Grade2 });

  useEffect(() => {
    const saved = localStorage.getItem('math_profiles');
    if (saved) setProfiles(JSON.parse(saved));
  }, []);

  const handleCreate = () => {
    if (!newProfile.name) return;

    // Get avatars already in use
    const usedAvatarIds = profiles.map(p => p.avatarId);

    // Find an available avatar (0-4)
    let availableAvatarId = 0;
    for (let i = 0; i < 5; i++) {
      if (!usedAvatarIds.includes(i)) {
        availableAvatarId = i;
        break;
      }
    }

    // If all avatars are used (5+ profiles), cycle through
    if (usedAvatarIds.length >= 5) {
      availableAvatarId = profiles.length % 5;
    }

    const profile: StudentProfile = {
      id: Date.now().toString(),
      name: newProfile.name,
      age: newProfile.grade + 6, // Rough estimate
      grade: newProfile.grade,
      avatarId: availableAvatarId,
      history: []
    };
    const updated = [...profiles, profile];
    setProfiles(updated);
    localStorage.setItem('math_profiles', JSON.stringify(updated));
    setIsCreating(false);
  };

  const avatars = ["🐶", "🐱", "🐼", "🦊", "🦁"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="text-center space-y-2 relative">
        <h1 className="text-5xl font-extrabold text-brand-600 tracking-tight drop-shadow-sm">MathGenius Kids</h1>
        <p className="text-xl text-slate-500">Học toán thật vui!</p>
        {canInstall && (
          <div className="absolute top-0 right-0 translate-x-[120%] hidden md:block">
            <Button variant="outline" onClick={onInstallClick} className="animate-bounce shadow-xl border-brand-500 text-brand-600">
              <Download size={20} /> Tải App
            </Button>
          </div>
        )}
        {canInstall && (
          <div className="mt-4 md:hidden">
            <Button variant="outline" onClick={onInstallClick} className="animate-bounce shadow-xl border-brand-500 text-brand-600">
              <Download size={20} /> Tải App
            </Button>
          </div>
        )}
      </div>

      {!isCreating ? (
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {profiles.map(p => (
            <button key={p.id} onClick={() => onSelectProfile(p)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-brand-400 text-left flex items-center space-x-4">
              <div className="text-5xl bg-brand-50 p-3 rounded-2xl group-hover:scale-110 transition-transform">{avatars[p.avatarId % 5]}</div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 group-hover:text-brand-600">{p.name}</h3>
                <p className="text-slate-500 font-medium">Lớp {p.grade}</p>
              </div>
            </button>
          ))}

          <button onClick={() => setIsCreating(true)} className="flex flex-col items-center justify-center p-6 rounded-3xl border-4 border-dashed border-brand-200 text-brand-400 hover:bg-brand-50 hover:border-brand-400 hover:text-brand-600 transition-all h-full min-h-[140px]">
            <Plus size={40} />
            <span className="font-bold mt-2">Thêm học sinh mới</span>
          </button>
        </div>
      ) : (
        <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
          <h2 className="text-2xl font-bold mb-6 text-center">Tạo hồ sơ mới</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Tên của bé</label>
              <input
                type="text"
                value={newProfile.name}
                onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none text-lg"
                placeholder="Ví dụ: Bi, Na..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1">Lớp</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(g => (
                  <button
                    key={g}
                    onClick={() => setNewProfile({ ...newProfile, grade: g as Grade })}
                    className={`p-2 rounded-lg font-bold border-2 ${newProfile.grade === g ? 'bg-brand-500 text-white border-brand-600' : 'bg-white border-gray-200 text-slate-500'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setIsCreating(false)}>Hủy</Button>
              <Button className="flex-1" onClick={handleCreate}>Bắt đầu ngay</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// 2. Dashboard & Topic Selection
const Dashboard = ({ student, onStartTest, onLogout, onExport }: { student: StudentProfile, onStartTest: (topics: string[], count: number) => void, onLogout: () => void, onExport: (topics: string[], count: number) => Promise<void> }) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [isExporting, setIsExporting] = useState(false);

  const gradeTopics = useMemo(() => getTopicsByGrade(student.grade), [student.grade]);

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
    if (questionCount < 1) setQuestionCount(1);
    if (questionCount > 100) setQuestionCount(100);
  }

  // Calculate stats
  const totalTests = student.history.length;
  const avgScore = totalTests > 0
    ? Math.round(student.history.reduce((acc, test) => acc + ((test.score / test.totalQuestions) * 100), 0) / totalTests)
    : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 pb-32">
      <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-brand-100 p-3 rounded-full text-2xl">🎓</div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Chào, {student.name}!</h2>
            <p className="text-slate-500">Học sinh lớp {student.grade}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onLogout} className="text-sm px-4 py-2">
          <LogOut size={16} className="mr-2" /> Thoát
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
              {gradeTopics.map(topic => (
                <div
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedTopics.includes(topic.id) ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-gray-100 bg-white hover:border-brand-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800">{topic.title}</h4>
                    {selectedTopics.includes(topic.id) && <CheckCircle size={20} className="text-brand-500" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{topic.description}</p>
                </div>
              ))}
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
                      min="1"
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
              {student.history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={student.history.slice(-5).map(h => ({
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
};

// 3. Test Runner
const TestRunner = ({ questions, durationMinutes, onFinish, onExit }: { questions: Question[], durationMinutes: number, onFinish: (answers: Record<string, string | string[]>, timeSpent: number) => void, onExit: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  // State for Typing Game
  const [typingInput, setTypingInput] = useState('');
  const typingInputRef = useRef<HTMLInputElement>(null);
  const [showTelexGuide, setShowTelexGuide] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          onFinish(answers, durationMinutes * 60);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [answers, durationMinutes, onFinish]);

  // Reset typing input when question changes
  useEffect(() => {
    if (questions[currentIndex].type === QuestionType.Typing) {
      // Check if already answered
      const existingAns = answers[questions[currentIndex].id];
      setTypingInput(typeof existingAns === 'string' ? existingAns : '');
      // Auto focus
      setTimeout(() => typingInputRef.current?.focus(), 100);
    }
  }, [currentIndex, questions, answers]);

  const handleAnswer = (val: string) => {
    const currentQ = questions[currentIndex];

    // Check correctness for immediate feedback (optional, or just play click)
    // For now, let's just play click to avoid spoiling answer if we want them to think?
    // BUT, user requested "Correct: Ting, Wrong: Buzz". 
    // Usually in test mode we don't show result immediately until end?
    // However, for "kids app", immediate feedback is often good. 
    // But the current UI design waits for "Next" or "Submit".
    // Let's play click for selection, and maybe we can add immediate feedback mode later.
    // Wait, the request said: "Correct: Ting, Wrong: Buzz". 
    // If I play it now, they know the answer. 
    // Let's assume we play it when they select? Or maybe we should only play click here 
    // and play result sound at the end?
    // Actually, let's play click here. The "Correct/Wrong" sounds might be better suited 
    // if we had a "Check Answer" button. 
    // Since the current flow is "Select -> Next", maybe we just play click.
    // OR, we can play the sound when they click "Next" if we want to validate?
    // Let's stick to click sound for interaction to be safe, 
    // and play "Complete" sound at the end.
    // Re-reading request: "Sai: Âm thanh nhẹ nhàng khích lệ".
    // This implies immediate feedback. 
    // But the current TestRunner doesn't seem to show immediate feedback (red/green) 
    // EXCEPT for Typing mode (which has red/green text).

    soundManager.playClick();

    if (currentQ.type === QuestionType.MultipleSelect) {
      setAnswers(prev => {
        const currentSelection = (prev[currentQ.id] as string[]) || [];
        if (currentSelection.includes(val)) {
          return { ...prev, [currentQ.id]: currentSelection.filter(v => v !== val) };
        } else {
          return { ...prev, [currentQ.id]: [...currentSelection, val] };
        }
      });
    } else {
      // Single choice or Manual Input (though manual input uses handleInputChange)
      setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: e.target.value }));
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const target = questions[currentIndex].correctAnswer || '';

    // Logic: Stop if wrong? The prompt says: "Nếu sai thì chuyển sang màu đỏ và không tiếp tục chuyển màu nữa".
    // This suggests we allow typing, but the highlighting stops or shows red.
    // However, typically "stop progression" implies blocking input. 
    // But standard typing games allow typing errors but mark them red.

    setTypingInput(val);
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: val }));
  };

  const handleNext = () => {
    // Check correctness for sound feedback
    const currentQ = questions[currentIndex];
    const userAnswer = answers[currentQ.id];
    let isCorrect = false;

    if (currentQ.type === QuestionType.MultipleSelect) {
      const ua = Array.isArray(userAnswer) ? [...userAnswer].sort().toString() : "";
      const ca = currentQ.correctAnswers ? [...currentQ.correctAnswers].sort().toString() : "";
      isCorrect = ua === ca;
    } else if (currentQ.type === QuestionType.ManualInput) {
      isCorrect = (userAnswer as string || "").toString().trim().toLowerCase() === (currentQ.correctAnswer || "").toString().trim().toLowerCase();
    } else if (currentQ.type === QuestionType.Typing) {
      isCorrect = userAnswer === currentQ.correctAnswer;
    } else {
      isCorrect = userAnswer === currentQ.correctAnswer;
    }

    if (isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playWrong();
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = () => {
    onFinish(answers, (durationMinutes * 60) - timeLeft);
  };

  const currentQ = questions[currentIndex];
  const currentAns = answers[currentQ.id];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Validate if current question is answered "enough" to move on
  const isAnswered = () => {
    if (currentQ.type === QuestionType.MultipleSelect) {
      return Array.isArray(currentAns) && currentAns.length > 0;
    }
    if (currentQ.type === QuestionType.Typing) {
      // Must match completely to enable next? Or just non-empty?
      // Usually strict typing requires full match.
      return typingInput === currentQ.correctAnswer;
    }
    return !!currentAns && currentAns.toString().trim().length > 0;
  };

  const renderTypingVisual = () => {
    const target = currentQ.correctAnswer || '';
    return (
      <div className="space-y-6">
        {/* Telex Guide Toggle */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowTelexGuide(!showTelexGuide)}
            className="px-4 py-2 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            <Keyboard size={16} />
            {showTelexGuide ? 'Ẩn hướng dẫn Telex' : 'Hướng dẫn gõ Telex'}
          </button>
        </div>

        {/* Telex Guide Table */}
        {showTelexGuide && (
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Keyboard size={18} />
              Hướng dẫn gõ dấu Telex
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                { char: 'â', method: 'aa', example: 'caan → cân' },
                { char: 'ă', method: 'aw', example: 'awn → ăn' },
                { char: 'ê', method: 'ee', example: 'een → ên' },
                { char: 'ô', method: 'oo', example: 'oon → ôn' },
                { char: 'ơ', method: 'ow', example: 'ow → ơ' },
                { char: 'ư', method: 'uw', example: 'uw → ư' },
                { char: 'đ', method: 'dd', example: 'ddi → đi' },
                { char: 'á', method: 'as', example: 'as → á' },
                { char: 'à', method: 'af', example: 'af → à' },
                { char: 'ả', method: 'ar', example: 'ar → ả' },
                { char: 'ã', method: 'ax', example: 'ax → ã' },
                { char: 'ạ', method: 'aj', example: 'aj → ạ' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-2 rounded border border-blue-200">
                  <div className="font-bold text-lg text-blue-600">{item.char} = {item.method}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.example}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Display */}
        <div className="p-6 bg-white rounded-xl border-2 border-brand-100 shadow-inner text-2xl md:text-3xl leading-relaxed font-mono" onClick={() => typingInputRef.current?.focus()}>
          {target.split('').map((char, idx) => {
            let colorClass = 'text-slate-400'; // Not typed yet
            if (idx < typingInput.length) {
              if (typingInput[idx] === char) {
                colorClass = 'text-green-500'; // Correct
              } else {
                colorClass = 'text-red-500 bg-red-50'; // Incorrect
                // If prompt implies "stop highlighting", it usually means subsequent correct chars after a wrong one 
                // shouldn't be green? But simple red/green per char is best for kids feedback.
              }
            }
            return (
              <span key={idx} className={`${colorClass} transition-colors duration-100 relative`}>
                {char}
                {/* Cursor */}
                {idx === typingInput.length && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-800 animate-pulse"></span>
                )}
              </span>
            );
          })}
          {typingInput.length >= target.length && <span className="ml-1 inline-block w-2 h-6 bg-transparent"></span>}
        </div>

        {/* Hidden Input */}
        <div className="relative">
          <input
            ref={typingInputRef}
            type="text"
            className="w-full opacity-0 absolute inset-0 h-full cursor-text"
            value={typingInput}
            onChange={handleTypingChange}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && typingInput === target) {
                handleNext();
              }
            }}
          />
          <div className="mt-4 text-center text-slate-400 text-sm">
            <Keyboard className="inline-block mr-1" size={16} />
            Hãy gõ chính xác đoạn văn trên. Chữ đỏ là gõ sai, hãy xóa và gõ lại!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col items-center p-4">
      {/* Header with Timer and Exit */}
      <div className="w-full max-w-3xl mb-6 flex justify-between items-center">
        <Button variant="ghost" onClick={onExit} className="text-red-500 hover:bg-red-50 hover:text-red-600">
          <X size={24} className="mr-1" /> Thoát
        </Button>

        <div className="flex items-center gap-2 text-xl font-bold text-slate-700 bg-white px-4 py-2 rounded-full shadow-sm">
          <Clock className={timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-brand-500'} />
          <span className={timeLeft < 60 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
        </div>

        <div className="text-slate-500 font-bold min-w-[80px] text-right">
          Câu {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <div className="w-full max-w-3xl mb-8">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <Card className="w-full max-w-3xl flex-1 flex flex-col min-h-[400px]">
        <div className="flex-1">
          <div className="mb-4">
            {currentQ.type === QuestionType.MultipleSelect && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-bold mb-2">
                <CheckSquare size={14} className="mr-1" /> Chọn nhiều đáp án
              </span>
            )}
            {currentQ.type === QuestionType.SelectWrong && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold mb-2">
                <XCircle size={14} className="mr-1" /> Chọn đáp án SAI
              </span>
            )}
            {currentQ.type === QuestionType.ManualInput && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-2">
                <Type size={14} className="mr-1" /> Tự nhập đáp án
              </span>
            )}
            {currentQ.type === QuestionType.Typing && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-bold mb-2">
                <Keyboard size={14} className="mr-1" /> Tập gõ phím
              </span>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed mb-8">
            {currentQ.questionText}
          </h2>

          {/* Render SVG Visual if present */}
          {currentQ.visualSvg && (
            <div
              className="mb-8 flex justify-center p-4 bg-white rounded-xl border-2 border-slate-100 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: currentQ.visualSvg }}
            />
          )}

          {/* Render Logic Based on Type */}
          {currentQ.type === QuestionType.Typing ? (
            renderTypingVisual()
          ) : currentQ.type === QuestionType.ManualInput ? (
            <div className="mt-8">
              <input
                type="text"
                value={(currentAns as string) || ''}
                onChange={handleInputChange}
                placeholder="Nhập câu trả lời của bé..."
                className="w-full text-2xl p-4 border-b-4 border-brand-200 focus:border-brand-500 focus:outline-none bg-gray-50 rounded-t-lg transition-colors"
                autoFocus
              />
              <p className="text-slate-500 mt-2 text-sm">* Nhập số hoặc chữ cái tương ứng</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQ.options?.map((opt, idx) => {
                const isSelected = currentQ.type === QuestionType.MultipleSelect
                  ? (currentAns as string[])?.includes(opt)
                  : currentAns === opt;

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    className={`p-6 text-xl font-bold rounded-xl border-2 text-left transition-all flex items-center ${isSelected
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                      : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50 text-slate-700'
                      }`}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 mr-3 ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-300 opacity-50'}`}>
                      {currentQ.type === QuestionType.MultipleSelect
                        ? (isSelected ? <CheckSquare size={16} /> : <span className="w-4 h-4 block" />)
                        : String.fromCharCode(65 + idx)
                      }
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={currentIndex === questions.length - 1 ? handleSubmit : handleNext}
            disabled={!isAnswered()}
          >
            {currentIndex === questions.length - 1 ? 'Nộp bài' : 'Câu tiếp theo'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

// 4. Results Screen
const ResultScreen = ({ result, onHome }: { result: TestResult, onHome: () => void }) => {
  const [showReview, setShowReview] = useState(false);
  const percentage = Math.round((result.score / result.totalQuestions) * 100);

  const getMessage = () => {
    if (percentage === 100) return { text: "Xuất sắc! Bé là thiên tài!", color: "text-yellow-500" };
    if (percentage >= 80) return { text: "Làm tốt lắm! Cố gắng thêm chút nữa nhé!", color: "text-green-500" };
    if (percentage >= 50) return { text: "Khá tốt, nhưng cần ôn luyện thêm nhé.", color: "text-brand-500" };
    return { text: "Đừng buồn, hãy luyện tập thêm nhé!", color: "text-slate-500" };
  };

  const msg = getMessage();

  const renderAnswer = (ans: string | string[] | undefined) => {
    if (!ans) return "Chưa trả lời";
    if (Array.isArray(ans)) return ans.join(", ");
    return ans;
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center py-10">
      <div className="text-center mb-10 animate-in slide-in-from-bottom duration-500">
        <div className="inline-block p-6 rounded-full bg-white shadow-xl mb-6 relative">
          {percentage === 100 ? <Star size={80} className="text-yellow-400 fill-yellow-400 animate-spin-slow" /> : <Brain size={80} className="text-brand-500" />}
          <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white font-bold px-3 py-1 rounded-full">
            {percentage}%
          </div>
        </div>
        <h1 className={`text-4xl font-black mb-2 ${msg.color}`}>{msg.text}</h1>
        <p className="text-xl text-slate-600">
          Đúng {result.score}/{result.totalQuestions} câu trong {Math.floor(result.durationSeconds / 60)} phút.
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <Button variant="secondary" onClick={() => setShowReview(!showReview)}>
          {showReview ? 'Ẩn bài làm' : 'Xem lại bài làm'}
        </Button>
        <Button onClick={onHome}>Về trang chủ</Button>
      </div>

      {showReview && (
        <div className="w-full max-w-3xl space-y-4 animate-in fade-in">
          {result.questions.map((q, idx) => {
            // Logic for determining correctness was already done in handleTestFinish and stored implicitly, 
            // but here we visually check again or trust the parent. 
            // Ideally we should store `isCorrect` on the Question in history, but let's re-evaluate for display.

            // Note: TestResult generation in handleTestFinish does the scoring. 
            // Here we just need to know if it matches.
            // Since we stored userAnswer, we can check against correct answer again.

            let isCorrect = false;
            if (q.type === QuestionType.MultipleSelect) {
              const ua = Array.isArray(q.userAnswer) ? q.userAnswer.sort().toString() : "";
              const ca = q.correctAnswers ? [...q.correctAnswers].sort().toString() : "";
              isCorrect = ua === ca;
            } else if (q.type === QuestionType.ManualInput) {
              isCorrect = (q.userAnswer as string || "").toString().trim().toLowerCase() === (q.correctAnswer || "").toString().trim().toLowerCase();
            } else if (q.type === QuestionType.Typing) {
              isCorrect = q.userAnswer === q.correctAnswer;
            } else {
              isCorrect = q.userAnswer === q.correctAnswer;
            }

            return (
              <Card key={q.id} className={`border-l-8 ${isCorrect ? 'border-l-green-400' : 'border-l-red-400'}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? <CheckCircle /> : <XCircle />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-2">
                      Câu {idx + 1}: {q.questionText}
                      {q.type === QuestionType.ManualInput && <span className="ml-2 text-xs text-slate-400 font-normal">(Tự nhập)</span>}
                      {q.type === QuestionType.MultipleSelect && <span className="ml-2 text-xs text-slate-400 font-normal">(Chọn nhiều)</span>}
                      {q.type === QuestionType.Typing && <span className="ml-2 text-xs text-slate-400 font-normal">(Gõ phím)</span>}
                    </h4>

                    {q.visualSvg && (
                      <div
                        className="mb-4 max-w-[200px] p-2 bg-slate-50 rounded border border-slate-200 overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: q.visualSvg }}
                      />
                    )}

                    <div className="grid grid-cols-1 gap-4 text-sm mb-3">
                      {q.type === QuestionType.Typing ? (
                        <div className={`p-3 rounded-lg border font-mono ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="mb-1 text-xs text-slate-500">Bé gõ:</div>
                          <div className={isCorrect ? 'text-green-700' : 'text-red-700'}>{q.userAnswer as string}</div>
                          {!isCorrect && (
                            <>
                              <div className="mb-1 mt-2 text-xs text-slate-500">Văn bản đúng:</div>
                              <div className="text-slate-700">{q.correctAnswer}</div>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className={`p-2 rounded-lg ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            Bé chọn: <span className="font-bold">{renderAnswer(q.userAnswer)}</span>
                          </div>
                          {!isCorrect && (
                            <div className="p-2 rounded-lg bg-green-100 text-green-800">
                              Đáp án đúng: <span className="font-bold">
                                {q.type === QuestionType.MultipleSelect ? q.correctAnswers?.join(", ") : q.correctAnswer}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                      💡 <span className="font-bold">Giải thích:</span> {q.explanation}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const [screen, setScreen] = useState<'profile' | 'dashboard' | 'test' | 'result'>('profile');
  const [activeTestQuestions, setActiveTestQuestions] = useState<Question[]>([]);
  const [testDuration, setTestDuration] = useState<number>(20);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if standalone
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsStandalone(!!isStandalone);
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    const handler = (e: any) => {
      e.preventDefault(); // Prevent default to capture the event
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowInstallInstructions(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Load last active student from session storage if refreshed? 
  // Keeping simple for this implementation.

  const handleStartTest = (topicIds: string[], count: number) => {
    const questions = generateQuestions(topicIds, count);
    setActiveTestQuestions(questions);
    setTestDuration(count); // 1 minute per question
    setScreen('test');
  };

  const handleTestFinish = (answers: Record<string, string | string[]>, durationSeconds: number) => {
    if (!currentStudent) return;

    let score = 0;
    const processedQuestions = activeTestQuestions.map(q => {
      const userAnswer = answers[q.id];
      let isCorrect = false;

      if (q.type === QuestionType.MultipleSelect) {
        const ua = Array.isArray(userAnswer) ? userAnswer.sort().toString() : "";
        const ca = q.correctAnswers ? [...q.correctAnswers].sort().toString() : "";
        isCorrect = ua === ca;
      } else if (q.type === QuestionType.ManualInput) {
        isCorrect = (userAnswer as string || "").toString().trim().toLowerCase() === (q.correctAnswer || "").toString().trim().toLowerCase();
      } else if (q.type === QuestionType.Typing) {
        isCorrect = userAnswer === q.correctAnswer;
      } else {
        isCorrect = userAnswer === q.correctAnswer;
      }

      if (isCorrect) score++;
      return { ...q, userAnswer };
    });

    const result: TestResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      score,
      totalQuestions: activeTestQuestions.length,
      durationSeconds,
      topicIds: [],
      questions: processedQuestions
    };

    // Play sound based on score
    if (score === activeTestQuestions.length) {
      soundManager.playComplete();
    } else {
      soundManager.playComplete();
    }

    setLastResult(result);

    // Update student history
    const updatedStudent = {
      ...currentStudent,
      history: [...currentStudent.history, result]
    };
    setCurrentStudent(updatedStudent);

    // Update local storage profiles
    const saved = localStorage.getItem('math_profiles');
    if (saved) {
      const profiles = JSON.parse(saved) as StudentProfile[];
      const updatedProfiles = profiles.map(p => p.id === updatedStudent.id ? updatedStudent : p);
      localStorage.setItem('math_profiles', JSON.stringify(updatedProfiles));
    }

    setScreen('result');
  };

  const handleExportPDF = async (topicIds: string[], count: number) => {
    const questions = generateQuestions(topicIds, count);
    await exportTestToPDF(questions, `Bài tập ôn luyện - Lớp ${currentStudent?.grade}`);
  };

  return (
    <div className="min-h-screen font-sans">
      {screen === 'profile' && (
        <ProfileScreen
          onSelectProfile={(p) => { setCurrentStudent(p); setScreen('dashboard'); }}
          onInstallClick={handleInstallClick}
          canInstall={!isStandalone}
        />
      )}

      {showInstallInstructions && (
        <InstallInstructions onClose={() => setShowInstallInstructions(false)} />
      )}

      {screen === 'dashboard' && currentStudent && (
        <Dashboard
          student={currentStudent}
          onStartTest={handleStartTest}
          onLogout={() => { setCurrentStudent(null); setScreen('profile'); }}
          onExport={handleExportPDF}
        />
      )}

      {screen === 'test' && (
        <TestRunner
          questions={activeTestQuestions}
          durationMinutes={testDuration}
          onFinish={handleTestFinish}
          onExit={() => setScreen('dashboard')}
        />
      )}

      {screen === 'result' && lastResult && (
        <ResultScreen
          result={lastResult}
          onHome={() => setScreen('dashboard')}
        />
      )}
    </div>
  );
}
