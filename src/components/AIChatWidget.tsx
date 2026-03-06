import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, ArrowLeft, Send, Loader2, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { useStudent, useStudentActions } from '@/src/contexts/StudentContext';
import { generateAiResponse } from '@/services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export const AIChatWidget: React.FC = () => {
    const { currentStudent } = useStudent();
    const { updateStudent } = useStudentActions();

    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Initial load of chat history from profile
    useEffect(() => {
        if (currentStudent && currentStudent.chatHistory) {
            setMessages(currentStudent.chatHistory);
        } else {
            setMessages([{ role: 'model', content: `Chào ${currentStudent?.name || 'bạn'}! Mình là Bo Biết Tuốt 🤖. ${currentStudent?.name || 'Bạn'} có câu hỏi nào về học tập hay khoa học cần mình giúp không nè?` }]);
        }
    }, [currentStudent?.id]); // Only change on user switch, to avoid jumping if history updates behind the scenes? Wait, we update history so it will trigger. 
    // Actually we only want to load it initially. Let's just track currentStudent.id

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    if (!currentStudent || !currentStudent.aiEnabled) {
        return null;
    }

    const handleClearChat = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này?')) {
            const initialMsg = { role: 'model' as const, content: `Chào ${currentStudent.name}! Mình là Bo Biết Tuốt 🤖. ${currentStudent.name} có câu hỏi nào về học tập hay khoa học cần mình giúp không nè?` };
            setMessages([initialMsg]);
            updateStudent({
                ...currentStudent,
                chatHistory: [initialMsg]
            });
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();

        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return;

        const apiKey = localStorage.getItem('mathgenius_gemini_key') || '';
        if (!apiKey) {
            alert("Vui lòng cấu hình API Key trong phần Hồ sơ để chat cùng Bo nha!");
            return;
        }

        const newUserMsg = { role: 'user' as const, content: trimmedInput };
        const updatedMessages = [...messages, newUserMsg];

        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const reply = await generateAiResponse(trimmedInput, messages, apiKey, currentStudent.name);

            const finalMessages = [...updatedMessages, { role: 'model' as const, content: reply }];
            setMessages(finalMessages);

            // Persist to Student Context
            updateStudent({
                ...currentStudent,
                chatHistory: finalMessages
            });

        } catch (error: any) {
            console.error("Chat Error:", error);
            // Revert message or show error system message? Add error message
            const errorMsg = { role: 'model' as const, content: `⚠️ Lỗi: ${error.message}` };
            setMessages([...updatedMessages, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Chat Head Bubble - Always visible */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-[100] p-3 text-white rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 group animate-in zoom-in ${isOpen ? 'bg-slate-600 hover:bg-slate-700 hidden sm:block' : 'bg-brand-500 hover:bg-brand-600'}`}
            >
                {isOpen ? <X size={32} /> : <Bot size={32} />}
                {!isOpen && (
                    <span className="absolute -top-10 right-0 bg-white text-brand-600 px-3 py-1 rounded-full shadow-lg text-sm font-bold opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
                        Chat với Bo!
                    </span>
                )}
                {!isOpen && (
                    <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed z-[99] bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 border border-slate-100 shadow-2xl transition-all duration-300 ${isExpanded
                    ? 'inset-0 sm:rounded-none z-[110]' // Full screen mode
                    : 'inset-0 sm:inset-auto sm:top-auto sm:left-auto sm:bottom-24 sm:right-8 sm:w-[380px] sm:h-[600px] sm:max-h-[calc(100vh-140px)] sm:rounded-2xl sm:zoom-in-95'
                    }`}>

                    {/* Header */}
                    <div className="shrink-0 bg-gradient-to-r from-brand-500 to-brand-600 text-white p-4 flex items-center justify-between shadow-md z-10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="sm:hidden p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div className="p-2 bg-white/20 rounded-full">
                                <Bot size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Bo Biết Tuốt</h3>
                                <p className="text-xs text-brand-100">Trợ lý học tập AI</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleClearChat}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                title="Xoá lịch sử chat"
                            >
                                <Trash2 size={18} />
                            </button>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="hidden sm:block p-2 hover:bg-white/20 rounded-full transition-colors"
                                title={isExpanded ? "Thu nhỏ" : "Phóng to"}
                            >
                                {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="hidden sm:block p-2 hover:bg-white/20 rounded-full transition-colors ml-1"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-brand-500 text-white rounded-br-none shadow-md'
                                    : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-slate-100'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    ) : (
                                        <div className="text-sm prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath]}
                                                rehypePlugins={[rehypeKatex]}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white text-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-slate-100">
                                    <Loader2 size={16} className="animate-spin text-brand-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="shrink-0 mt-auto p-3 bg-white border-t border-slate-100">
                        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Hỏi Bo điều gì đó..."
                                className="flex-1 max-h-32 min-h-[44px] bg-slate-100 text-slate-800 text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 resize-none transition-all"
                                rows={1}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                        <p className="text-[10px] text-center text-slate-400 mt-2">
                            Bo có thể mắc lỗi. Vui lòng kiểm tra lại các thông tin quan trọng.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};
