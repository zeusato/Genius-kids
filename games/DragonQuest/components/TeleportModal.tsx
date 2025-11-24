import React, { useEffect } from 'react';

interface TeleportModalProps {
    distance: number;
    isBackward: boolean;
    hasProtection: boolean;
    onComplete: () => void;
}

export const TeleportModal: React.FC<TeleportModalProps> = ({
    distance,
    isBackward,
    hasProtection,
    onComplete
}) => {
    useEffect(() => {
        // Auto-close after animation
        const timer = setTimeout(() => {
            onComplete();
        }, 2500);

        return () => clearTimeout(timer);
    }, [onComplete]);

    const isProtected = isBackward && hasProtection;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-xl w-full text-center animate-in zoom-in-95 duration-300">
                {/* Swirl Animation */}
                <div className="text-9xl mb-6 animate-spin">
                    🌀
                </div>

                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-4">
                    DỊCH CHUYỂN!
                </h2>

                {isProtected ? (
                    <>
                        <div className="text-6xl mb-4 animate-bounce">
                            🦸‍♂️
                        </div>
                        <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-300">
                            <p className="text-xl font-bold text-blue-800 mb-2">
                                Áo Choàng Bay bảo vệ bạn!
                            </p>
                            <p className="text-lg text-blue-600">
                                Miễn nhiễm dịch chuyển lùi ✨
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                        <p className="text-3xl font-black mb-2">
                            {isBackward ? '⬅️' : '➡️'}
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                            {isBackward ? 'Lùi' : 'Tiến'} {Math.abs(distance)} ô
                        </p>
                    </div>
                )}

                <div className="mt-6 flex gap-2 justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
};
