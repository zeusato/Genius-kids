import React, { useState, useEffect } from 'react';
import { Bot, Key, ExternalLink, X, Save, AlertCircle } from 'lucide-react';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';

interface AIAgentSettingsModalProps {
    onClose: () => void;
}

export const AIAgentSettingsModal: React.FC<AIAgentSettingsModalProps> = ({ onClose }) => {
    const { currentStudent, students } = useStudent();
    const { updateStudent } = useStudentActions();

    const [apiKey, setApiKey] = useState('');
    const [isAiEnabled, setIsAiEnabled] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        // Load API key from localStorage
        const savedKey = localStorage.getItem('mathgenius_gemini_key');
        if (savedKey) {
            setApiKey(savedKey);
        }

        if (currentStudent) {
            setIsAiEnabled(!!currentStudent.aiEnabled);
        } else if (students && students.length > 0) {
            // Global toggle state if on Home screen
            setIsAiEnabled(students.some(s => s.aiEnabled));
        }
    }, [currentStudent, students]);

    const handleSave = () => {
        // Save key to localStorage globally
        localStorage.setItem('mathgenius_gemini_key', apiKey.trim());

        const effectiveAiEnabled = apiKey.trim().length > 0 ? isAiEnabled : false;

        if (currentStudent) {
            // Save AI preference to the current specific profile
            updateStudent({
                ...currentStudent,
                aiEnabled: effectiveAiEnabled
            });
        } else if (students && students.length > 0) {
            // Save AI preference to ALL profiles if clicked from home screen
            students.forEach(student => {
                // To avoid React context state update race conditions, 
                // StudentContext's updateStudent should ideally handle bulk, 
                // but sequential calls synchronously generally work in typical React setups.
                updateStudent({
                    ...student,
                    aiEnabled: effectiveAiEnabled
                });
            });
        }

        setIsSaved(true);
        setTimeout(() => {
            setIsSaved(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full animate-in zoom-in-95 duration-200 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-100 hover:bg-slate-200 rounded-full"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-brand-100 text-brand-600 rounded-xl">
                        <Bot size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Cài đặt AI Agent</h2>
                        <p className="text-slate-500 text-sm">Trợ lý học tập "Bo Biết Tuốt"</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* API Key Section */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <Key size={16} />
                            Google AI Studio API Key
                        </label>
                        <p className="text-xs text-slate-500 mb-3">
                            Khóa kết nối này được lưu trữ an toàn ngay trên máy của bạn.
                        </p>

                        <div className="flex flex-col gap-2 mb-3">
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Nhập API Key bắt đầu bằng AIzaSy..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            />
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-semibold w-fit"
                            >
                                Lấy API Key tại đây <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>

                    {/* Enable Toggle Section */}
                    <div
                        className={`flex items-center justify-between p-4 border border-slate-100 rounded-xl shadow-sm transition-colors ${apiKey.trim() ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                        onClick={() => {
                            if (apiKey.trim()) {
                                setIsAiEnabled(!isAiEnabled);
                            }
                        }}
                    >
                        <div>
                            <h3 className="font-bold text-slate-800">Kích hoạt AI Chat</h3>
                            <p className="text-xs text-slate-500">Hiển thị bong bóng chat trên màn hình</p>
                        </div>
                        <div className="relative inline-flex items-center">
                            <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${isAiEnabled && apiKey.trim() ? 'bg-green-500' : 'bg-slate-200'}`}>
                                <div className={`absolute top-[2px] bg-white border rounded-full h-5 w-5 transition-all duration-300 shadow-sm ${isAiEnabled && apiKey.trim() ? 'left-[22px] border-green-500' : 'left-[2px] border-slate-300'}`}></div>
                            </div>
                        </div>
                    </div>

                    {!apiKey.trim() && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-800 text-sm">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p>Bạn cần nhập API key để có thể sử dụng và bật trợ lý AI.</p>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            onClick={handleSave}
                            className={`flex items-center justify-center min-w-[140px] gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md ${isSaved ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200' : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-200'
                                }`}
                        >
                            <Save size={18} />
                            {isSaved ? 'Đã lưu!' : 'Lưu cài đặt'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
