import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { SpeedQuestion } from '../../SpeedMath/speedMathEngine';
import demonImg from '../assets/demon.png';

interface CombatModalProps {
    question: SpeedQuestion;
    dialogue: string;
    onAnswer: (isCorrect: boolean) => void;
}

export const CombatModal: React.FC<CombatModalProps> = ({ question, dialogue, onAnswer }) => {
    const [typingInput, setTypingInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAnswer = (answer: string) => {
        const isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        onAnswer(isCorrect);
    };

    const handleTypingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleAnswer(typingInput);
    };

    const renderVisual = () => {
        if (question.type === 'color' && question.color) {
            return (
                <div
                    className="w-32 h-32 rounded-2xl shadow-lg mx-auto mb-6 border-4 border-white"
                    style={{ backgroundColor: question.color }}
                />
            );
        }

        if ((question.type === 'shape' || question.type === 'clock') && question.visual) {
            return (
                <div
                    className="w-48 h-48 mx-auto mb-6"
                    dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 120 120" width="100%" height="100%">${question.visual}</svg>` }}
                />
            );
        }

        return null;
    };

    const renderInput = () => {
        if (question.type === 'typing') {
            return (
                <form onSubmit={handleTypingSubmit} className="w-full">
                    <input
                        ref={inputRef}
                        type="text"
                        value={typingInput}
                        onChange={e => setTypingInput(e.target.value)}
                        className="w-full text-center text-2xl p-4 rounded-xl border-4 border-red-200 focus:border-red-500 focus:outline-none mb-4"
                        placeholder="Gõ câu trả lời..."
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors"
                    >
                        Gửi
                    </button>
                </form>
            );
        }

        // Multiple Choice
        return (
            <div className="grid grid-cols-2 gap-4 w-full">
                {question.options?.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        className="bg-white hover:bg-red-50 border-b-4 border-red-200 hover:border-red-500 text-slate-700 font-bold text-xl py-6 rounded-2xl shadow-sm transition-all active:scale-95"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full animate-in zoom-in-95 duration-300" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
                {/* Two Column Layout on Desktop */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column: Question Content */}
                    <div className="flex-1 flex flex-col">
                        {/* Question Content */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-6 leading-tight">
                                {question.content}
                            </h2>
                            {renderVisual()}
                        </div>

                        {/* Answer Input */}
                        <div className="mt-auto">
                            {renderInput()}
                        </div>
                    </div>

                    {/* Right Column: Monster Character and Dialogue */}
                    <div className="lg:w-72 flex-shrink-0 flex items-center">
                        <div className="text-center w-full">
                            <div className="mb-4 flex justify-center">
                                <img
                                    src={demonImg}
                                    alt="Demon"
                                    className="w-40 h-40 object-contain drop-shadow-2xl animate-bounce"
                                />
                            </div>
                            <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200">
                                <p className="text-lg font-bold text-red-800 italic">
                                    "{dialogue}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
