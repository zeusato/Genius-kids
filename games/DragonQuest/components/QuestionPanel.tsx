// ============================================================================
//  QuestionPanel — phần HỎI & TRẢ LỜI dùng CHUNG cho combat/buff/boss.
//  Trước đây renderVisual()/renderInput() bị lặp gần như y hệt ở 3 modal.
//  Theme màu (accent) đổi theo loại sự kiện qua prop.
// ============================================================================

import React, { useRef, useState } from 'react';
import { SpeedQuestion } from '../../SpeedMath/speedMathEngine';

export type Accent = 'red' | 'green' | 'orange';

// Lớp Tailwind tĩnh theo accent (Tailwind không nhận class ghép động).
const ACCENT: Record<Accent, {
    inputBorder: string; inputFocus: string;
    optionBorder: string; optionHover: string;
    submit: string;
}> = {
    red: {
        inputBorder: 'border-red-200', inputFocus: 'focus:border-red-500',
        optionBorder: 'border-red-200 hover:border-red-500', optionHover: 'hover:bg-red-50',
        submit: 'bg-red-500 hover:bg-red-600',
    },
    green: {
        inputBorder: 'border-green-200', inputFocus: 'focus:border-green-500',
        optionBorder: 'border-green-200 hover:border-green-500', optionHover: 'hover:bg-green-50',
        submit: 'bg-green-500 hover:bg-green-600',
    },
    orange: {
        inputBorder: 'border-orange-200', inputFocus: 'focus:border-orange-500',
        optionBorder: 'border-orange-200 hover:border-orange-500', optionHover: 'hover:bg-orange-50',
        submit: 'bg-orange-500 hover:bg-orange-600',
    },
};

interface QuestionPanelProps {
    question: SpeedQuestion;
    accent: Accent;
    disabled?: boolean;
    onAnswer: (answer: string) => void;
}

export const QuestionPanel: React.FC<QuestionPanelProps> = ({ question, accent, disabled = false, onAnswer }) => {
    const [typingInput, setTypingInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const a = ACCENT[accent];

    const submitTyping = (e: React.FormEvent) => {
        e.preventDefault();
        if (disabled) return;
        onAnswer(typingInput);
    };

    const renderVisual = () => {
        if (question.type === 'color' && question.color) {
            return (
                <div
                    className="w-24 h-24 md:w-32 md:h-32 rounded-2xl shadow-lg mx-auto mb-5 border-4 border-white"
                    style={{ backgroundColor: question.color }}
                />
            );
        }
        if ((question.type === 'shape' || question.type === 'clock') && question.visual) {
            return (
                <div
                    className="w-36 h-36 md:w-48 md:h-48 mx-auto mb-5"
                    dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 120 120" width="100%" height="100%">${question.visual}</svg>` }}
                />
            );
        }
        return null;
    };

    return (
        <div className="flex-1 flex flex-col">
            <div className="text-center mb-6">
                <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-4 leading-tight break-words">
                    {question.content}
                </h2>
                {renderVisual()}
            </div>

            <div className="mt-auto">
                {question.type === 'typing' ? (
                    <form onSubmit={submitTyping} className="w-full">
                        <input
                            ref={inputRef}
                            type="text"
                            value={typingInput}
                            onChange={e => setTypingInput(e.target.value)}
                            disabled={disabled}
                            className={`w-full text-center text-xl md:text-2xl p-3 md:p-4 rounded-xl border-4 ${a.inputBorder} ${a.inputFocus} focus:outline-none mb-3 disabled:opacity-60`}
                            placeholder="Gõ câu trả lời..."
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={disabled}
                            className={`w-full ${a.submit} text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50`}
                        >
                            Gửi
                        </button>
                    </form>
                ) : (
                    <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
                        {question.options?.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => !disabled && onAnswer(opt)}
                                disabled={disabled}
                                className={`bg-white ${a.optionHover} border-b-4 ${a.optionBorder} text-slate-700 font-bold text-lg md:text-xl py-4 md:py-6 rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-50`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
