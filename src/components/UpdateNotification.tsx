import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, X } from 'lucide-react';
import { applyUpdate } from '../../services/updateService';

interface UpdateNotificationProps {
    onDismiss?: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onDismiss }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Auto dismiss sau 30 giây
    useEffect(() => {
        const timer = setTimeout(() => {
            handleDismiss();
        }, 30000);

        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => {
            onDismiss?.();
        }, 300); // Đợi animation kết thúc
    };

    const handleUpdate = async () => {
        setIsUpdating(true);
        await applyUpdate();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all"
                        disabled={isUpdating}
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-white bg-opacity-20 rounded-full p-3">
                            <Download size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Bản Cập Nhật Mới</h3>
                            <p className="text-brand-50 text-sm">Phiên bản mới đã sẵn sàng</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex items-start gap-3 mb-6">
                        <AlertCircle className="text-brand-500 flex-shrink-0 mt-1" size={20} />
                        <div className="text-sm text-slate-600 leading-relaxed">
                            <p className="mb-2">
                                Đã có phiên bản mới của ứng dụng. Cập nhật ngay để trải nghiệm các tính năng và cải tiến mới nhất!
                            </p>
                            <p className="text-xs text-slate-500">
                                💡 Dữ liệu cá nhân và tiến độ học tập của bạn sẽ được giữ nguyên.
                            </p>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleDismiss}
                            disabled={isUpdating}
                            className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Để Sau
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                            {isUpdating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Đang cập nhật...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={18} />
                                    <span>Cập Nhật Ngay</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Progress indicator khi đang update */}
                {isUpdating && (
                    <div className="h-1 bg-brand-100">
                        <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 animate-pulse" style={{ width: '70%' }} />
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};
